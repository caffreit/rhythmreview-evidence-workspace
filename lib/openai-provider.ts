import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { ModelImpactOutputSchema, type EvidenceId, type EvidenceItem, type ImpactSuggestion } from './domain';
import { cosineSimilarity, graphCandidates, mergeCandidates, type CandidatePath } from './analysis';
import type { EvidenceRelationship } from './domain';

type AiConfig = { apiKey:string; model:string; embeddingModel:string };

function readConfig(): AiConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured. Choose replay mode or add the key to the local environment.');
  return { apiKey,model:process.env.OPENAI_MODEL ?? 'gpt-5.5',embeddingModel:process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small' };
}

async function semanticCandidates(args:{ client:OpenAI; db:D1Database; embeddingModel:string; query:string; evidence:EvidenceItem[]; excluded:Set<EvidenceId>; limit:number }): Promise<CandidatePath[]> {
  const missing = args.evidence.filter((item) => !args.excluded.has(item.id) && item.status !== 'superseded');
  if (missing.length === 0) return [];
  const stored = await args.db.prepare('SELECT item_id AS itemId,model,vector_json AS vectorJson FROM embeddings WHERE model=?').bind(args.embeddingModel).all<{ itemId:string; model:string; vectorJson:string }>();
  const vectors = new Map<string,number[]>();
  for (const row of stored.results) {
    const parsed:unknown = JSON.parse(row.vectorJson);
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === 'number')) vectors.set(row.itemId,parsed);
  }
  const toEmbed = args.evidence.filter((item) => !vectors.has(item.id));
  if (toEmbed.length > 0) {
    const response = await args.client.embeddings.create({ model:args.embeddingModel,input:toEmbed.map((item) => `${item.id}\n${item.title}\n${item.statement}\n${item.rationale}`) });
    const statements:D1PreparedStatement[] = [];
    response.data.forEach((entry,index) => {
      const item = toEmbed[index];
      if (!item) return;
      vectors.set(item.id,entry.embedding);
      statements.push(args.db.prepare('INSERT OR REPLACE INTO embeddings (item_id,model,vector_json,created_at) VALUES (?,?,?,?)').bind(item.id,args.embeddingModel,JSON.stringify(entry.embedding),new Date().toISOString()));
    });
    for (let index = 0; index < statements.length; index += 50) await args.db.batch(statements.slice(index,index + 50));
  }
  const queryResult = await args.client.embeddings.create({ model:args.embeddingModel,input:args.query });
  const queryVector = queryResult.data[0]?.embedding ?? [];
  return missing.map((item) => ({ item,score:cosineSimilarity(queryVector,vectors.get(item.id) ?? []) }))
    .sort((left,right) => right.score - left.score)
    .slice(0,args.limit)
    .map(({ item }) => ({ targetId:item.id,path:[item.id],origin:'semantic' }));
}

export async function analyseWithOpenAI(args:{ db:D1Database; anchorId:EvidenceId; title:string; rationale:string; proposedText:string; evidence:EvidenceItem[]; relationships:EvidenceRelationship[] }): Promise<{ model:string; promptVersion:string; suggestions:ImpactSuggestion[] }> {
  const config = readConfig(); const client = new OpenAI({ apiKey:config.apiKey });
  const linked = graphCandidates(args.anchorId,args.relationships,3);
  const linkedIds = new Set(linked.map((candidate) => candidate.targetId));
  const semantic = await semanticCandidates({ client,db:args.db,embeddingModel:config.embeddingModel,query:`${args.title}\n${args.rationale}\n${args.proposedText}`,evidence:args.evidence,excluded:linkedIds,limit:12 });
  const candidates = mergeCandidates(linked,semantic,60);
  const byId = new Map(args.evidence.map((item) => [item.id,item]));
  const candidatePayload = candidates.map((candidate) => {
    const item = byId.get(candidate.targetId);
    return { id:candidate.targetId,type:item?.type,title:item?.title,statement:item?.statement,criticality:item?.criticality,origin:candidate.origin,path:candidate.path };
  });
  const response = await client.responses.parse({
    model:config.model,
    store:false,
    instructions:'You are supporting a regulated medical-software QA reviewer. Select only evidence that the proposed change may require a person to review, update, retest, or newly link. Cite only supplied candidate IDs. Do not approve anything. Use no_change sparingly and do not invent facts.',
    input:JSON.stringify({ change:{ anchorId:args.anchorId,title:args.title,rationale:args.rationale,proposedText:args.proposedText },allowedActions:['review','update','retest','new_link','no_change'],candidates:candidatePayload }),
    text:{ format:zodTextFormat(ModelImpactOutputSchema,'impact_analysis') },
  });
  const parsed = response.output_parsed;
  if (!parsed) throw new Error('The model returned no structured impact analysis.');
  const candidateById = new Map(candidates.map((candidate) => [candidate.targetId,candidate]));
  const suggestions = parsed.suggestions.filter((suggestion) => candidateById.has(suggestion.targetId) && suggestion.citations.every((citation) => candidateById.has(citation))).map((suggestion,index) => {
    const candidate = candidateById.get(suggestion.targetId);
    if (!candidate) throw new Error('Validated suggestion was not present in the candidate set.');
    return { id:`SUG-LIVE-${String(index + 1).padStart(2,'0')}`,targetId:suggestion.targetId,action:suggestion.action,origin:candidate.origin,rationale:suggestion.rationale,path:candidate.path,citations:suggestion.citations,critical:byId.get(suggestion.targetId)?.criticality === 'high',decision:'pending' } satisfies ImpactSuggestion;
  });
  return { model:config.model,promptVersion:'impact-v1',suggestions };
}
