import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { EvidenceIdSchema, ImpactCategorySchema, type EvidenceId, type EvidenceItem, type ImpactSuggestion, type ModelImpactOutput } from './domain';
import { cosineSimilarity, graphCandidates, mergeCandidates, type CandidatePath } from './analysis';
import type { EvidenceRelationship } from './domain';
import { createOpenRouterClient,readOpenRouterConfig } from './openrouter-config';
import type { ModelRunMetadata } from './source-ai';

export function embeddingIdentity(versionId:string,model:string):string { return `${model}\u0000${versionId}`; }

export function uncachedEvidenceForEmbeddings<T extends Pick<EvidenceItem,'versionId'>>(evidence:T[],model:string,cachedIdentities:ReadonlySet<string>):T[] {
  return evidence.filter((item) => !cachedIdentities.has(embeddingIdentity(item.versionId,model)));
}

function allowedActionsForType(type:EvidenceItem['type']|undefined):Array<'review'|'update'|'retest'|'new_link'|'no_change'> {
  if (type === 'test') return ['review','retest','new_link','no_change'];
  if (type === 'intended_use' || type === 'requirement' || type === 'component' || type === 'label') return ['review','update','new_link','no_change'];
  return ['review','new_link','no_change'];
}

function boundedImpactOutputSchema(candidates:Array<{ id:EvidenceId;allowedActions:Array<'review'|'update'|'retest'|'new_link'|'no_change'> }>):z.ZodType<ModelImpactOutput> {
  if (candidates.length === 0) return z.object({ suggestions:z.array(z.never()).length(0) }) as unknown as z.ZodType<ModelImpactOutput>;
  const schemas = candidates.map((candidate) => z.object({
    targetId:z.literal(candidate.id),
    category:ImpactCategorySchema,
    action:z.enum(candidate.allowedActions as [typeof candidate.allowedActions[number],...typeof candidate.allowedActions]),
    rationale:z.string().min(1),
    citations:z.array(EvidenceIdSchema).min(1),
  }));
  const suggestionSchema = schemas.length === 1
    ? schemas[0]
    : z.union(schemas as [typeof schemas[number],typeof schemas[number],...typeof schemas]);
  return z.object({ suggestions:z.array(suggestionSchema) }) as unknown as z.ZodType<ModelImpactOutput>;
}

async function semanticCandidates(args:{ client:OpenAI; db:D1Database; embeddingModel:string; query:string; evidence:EvidenceItem[]; excluded:Set<EvidenceId>; limit:number }): Promise<{ candidates:CandidatePath[];embeddingTokens:number }> {
  const missing = args.evidence.filter((item) => !args.excluded.has(item.id) && item.status !== 'superseded');
  if (missing.length === 0) return { candidates:[],embeddingTokens:0 };
  const stored = await args.db.prepare('SELECT version_id AS versionId,vector_json AS vectorJson FROM embeddings WHERE model=?').bind(args.embeddingModel).all<{ versionId:string;vectorJson:string }>();
  const vectors = new Map<string,number[]>();
  for (const row of stored.results) {
    const parsed:unknown = JSON.parse(row.vectorJson);
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === 'number')) vectors.set(embeddingIdentity(row.versionId,args.embeddingModel),parsed);
  }
  let embeddingTokens = 0;
  const toEmbed = uncachedEvidenceForEmbeddings(args.evidence,args.embeddingModel,new Set(vectors.keys()));
  if (toEmbed.length > 0) {
    const response = await args.client.embeddings.create({ model:args.embeddingModel,input:toEmbed.map((item) => `${item.id}\n${item.title}\n${item.statement}\n${item.rationale}`) });
    embeddingTokens += response.usage.total_tokens;
    const statements:D1PreparedStatement[] = [];
    response.data.forEach((entry,index) => {
      const item = toEmbed[index];
      if (!item) return;
      vectors.set(embeddingIdentity(item.versionId,args.embeddingModel),entry.embedding);
      statements.push(args.db.prepare('INSERT OR REPLACE INTO embeddings (item_id,version_id,model,vector_json,created_at) VALUES (?,?,?,?,?)').bind(item.id,item.versionId,args.embeddingModel,JSON.stringify(entry.embedding),new Date().toISOString()));
    });
    for (let index = 0; index < statements.length; index += 50) await args.db.batch(statements.slice(index,index + 50));
  }
  const queryResult = await args.client.embeddings.create({ model:args.embeddingModel,input:args.query });
  embeddingTokens += queryResult.usage.total_tokens;
  const queryVector = queryResult.data[0]?.embedding ?? [];
  const candidates = missing.map((item) => ({ item,score:cosineSimilarity(queryVector,vectors.get(embeddingIdentity(item.versionId,args.embeddingModel)) ?? []) }))
    .sort((left,right) => right.score - left.score)
    .slice(0,args.limit)
    .map(({ item }) => ({ targetId:item.id,path:[item.id],origin:'semantic' as const }));
  return { candidates,embeddingTokens };
}

export async function analyseWithOpenRouter(args:{ db:D1Database; anchorId:EvidenceId; title:string; rationale:string; proposedText:string; evidence:EvidenceItem[]; relationships:EvidenceRelationship[] }): Promise<{ model:string;promptVersion:string;suggestions:ImpactSuggestion[];metadata:ModelRunMetadata }> {
  const config = readOpenRouterConfig(); const client = createOpenRouterClient(config);
  const startedAt = performance.now();
  const linked = graphCandidates(args.anchorId,args.relationships,3);
  const linkedIds = new Set(linked.map((candidate) => candidate.targetId));
  const semanticResult = await semanticCandidates({ client,db:args.db,embeddingModel:config.embeddingModel,query:`${args.title}\n${args.rationale}\n${args.proposedText}`,evidence:args.evidence,excluded:linkedIds,limit:12 });
  const candidates = mergeCandidates(linked,semanticResult.candidates,80);
  const byId = new Map(args.evidence.map((item) => [item.id,item]));
  const candidatePayload = candidates.map((candidate) => {
    const item = byId.get(candidate.targetId);
    return { id:candidate.targetId,type:item?.type,title:item?.title,statement:item?.statement,criticality:item?.criticality,origin:candidate.origin,path:candidate.path,allowedActions:allowedActionsForType(item?.type) };
  });
  const { data:response,request_id:requestId } = await client.responses.parse({
    model:config.model,
    store:false,
    reasoning:{ effort:config.reasoningEffort },
    instructions:'Support a regulated medical-software QA reviewer by classifying every supplied evidence candidate exactly once. Never omit a supplied candidate: use no_change when no follow-up is warranted. The action must be one of that candidate’s allowedActions. Use review when human assessment is needed but a controlled-text revision or verification rerun is not directly established. Use update only when the candidate statement itself contains the changed value, scope, behavior, or directly affected presentation flow. Use retest only when the test statement directly exercises the changed constraint or affected behavior. When uncertain, use review instead of update or retest. For a population change, review applicable claims, user needs, hazards, controls, and clinical evidence; update intended use and directly affected input, signal-quality, failure-behavior, or use-limitation requirements; and retest directly affected signal-quality or clinician-interpretation tests. Do not update unrelated labels or components or retest unrelated tests merely because the population change is broad. Use new_link only when a person should consider a missing relationship; it proposes rather than asserts that relationship. Choose one supplied impact category. Cite only supplied candidate IDs and always include the target ID. Do not invent evidence, assert or approve a relationship, or approve any evidence or baseline.',
    input:JSON.stringify({ change:{ anchorId:args.anchorId,title:args.title,rationale:args.rationale,proposedText:args.proposedText },allowedActions:['review','update','retest','new_link','no_change'],allowedCategories:['hierarchy','functional_overlap','interface_or_data_flow','shared_risk_or_control','verification_coverage','conflicting_constraint','collection_membership','release_coupling'],candidates:candidatePayload }),
    text:{ format:zodTextFormat(boundedImpactOutputSchema(candidatePayload),'impact_analysis') },
  }).withResponse();
  const parsed = response.output_parsed;
  if (!parsed) throw new Error('The model returned no structured impact analysis.');
  const candidateById = new Map(candidates.map((candidate) => [candidate.targetId,candidate]));
  if (!parsed.suggestions.every((suggestion) => candidateById.has(suggestion.targetId) && suggestion.citations.every((citation) => candidateById.has(citation)))) {
    throw new Error('The model returned an impact ID outside the bounded candidate set.');
  }
  if (!parsed.suggestions.every((suggestion) => allowedActionsForType(byId.get(suggestion.targetId)?.type).includes(suggestion.action))) throw new Error('The model returned an action that is not allowed for the candidate evidence type.');
  const classifiedIds = new Set(parsed.suggestions.map((suggestion) => suggestion.targetId));
  if (classifiedIds.size !== candidateById.size || [...candidateById.keys()].some((id) => !classifiedIds.has(id))) throw new Error('The model did not classify every bounded impact candidate.');
  const suggestions = parsed.suggestions.map((suggestion,index) => {
    const candidate = candidateById.get(suggestion.targetId);
    if (!candidate) throw new Error('Validated suggestion was not present in the candidate set.');
    return { id:`SUG-LIVE-${String(index + 1).padStart(2,'0')}`,targetId:suggestion.targetId,category:suggestion.category,action:suggestion.action,origin:candidate.origin,rationale:suggestion.rationale,path:candidate.path,citations:suggestion.citations,critical:byId.get(suggestion.targetId)?.criticality === 'high',decision:'pending' } satisfies ImpactSuggestion;
  });
  return {
    model:config.model,promptVersion:'impact-v6',suggestions,
    metadata:{ providerRequestId:requestId ?? response.id,durationMs:Math.max(0,Math.round(performance.now() - startedAt)),inputTokens:response.usage?.input_tokens ?? null,outputTokens:response.usage?.output_tokens ?? null,embeddingTokens:semanticResult.embeddingTokens },
  };
}
