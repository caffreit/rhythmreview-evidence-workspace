import { z } from 'zod';
import { graphCandidates,lexicalCandidates } from './analysis';
import { analyseWithOpenRouter } from './openrouter-provider';
import { configuredOpenRouterModel,isTransientOpenRouterError } from './openrouter-config';
import { ensureWorkspace,listEvidence,listRelationships } from './repository';
import { LiveProcessingError,WorkflowConflictError } from './http';
import { analyzeSourceContext, generateSourceCandidates, type ModelRunMetadata } from './source-ai';
import { ContextOutputSchema,REQUIREMENTS_POLICY, RequirementsOutputSchema, SOURCE_CONTEXT_POLICY, USER_NEEDS_POLICY, UserNeedsOutputSchema, validateCandidateCitations, type CandidateOutput, type ContextOutput } from './source-analysis-policies';
import { SOURCE_SEED, requirementsReplay, sourceContextReplay, userNeedsReplay } from './source-seed';
import {
  ApproveSourceBaselineInputSchema,CandidateDecisionInputSchema,ClarificationDecisionInputSchema,ClarificationSchema,GenerateCandidatesInputSchema,
  ImportSourceInputSchema,ProcessingRunSchema,RunSourceAnalysisInputSchema,SourceCandidateSchema,SourceCitationSchema,SourceDetailSchema,SourceKindSchema,UpdateSourceRevisionInputSchema,
  RunSourceImpactInputSchema,SourceImpactDecisionInputSchema,SourceImpactSuggestionSchema,SourceListResponseSchema,SourceStatusSchema,SourceSummarySchema,type SourceDetail,type SourceImpactSuggestion,type SourceListResponse,
} from './source-domain';

const CitationArraySchema = z.array(SourceCitationSchema);
const StringArraySchema = z.array(z.string());

function now():string { return new Date().toISOString(); }
function makeId(prefix:string):string { return `${prefix}-${crypto.randomUUID().slice(0,8).toUpperCase()}`; }
function parseJson(value:string):unknown { return JSON.parse(value); }
function stableHash(value:string):string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash,16777619); }
  return (hash >>> 0).toString(16).padStart(8,'0');
}

async function initializeSources(db:D1Database):Promise<void> {
  await ensureWorkspace(db);
  const row = await db.prepare('SELECT COUNT(*) AS count FROM source_artifacts').first<{ count:number }>();
  if ((row?.count ?? 0) > 0) return;
  const statements:D1PreparedStatement[] = [];
  for (const source of SOURCE_SEED) {
    statements.push(
      db.prepare('INSERT INTO source_artifacts (id,title,kind,status,latest_revision_id,created_at) VALUES (?,?,?,?,?,?)').bind(source.id,source.title,source.kind,'new',source.revisionId,source.capturedAt),
      db.prepare('INSERT INTO source_revisions (id,source_id,revision,content,content_hash,origin,captured_at) VALUES (?,?,?,?,?,?,?)').bind(source.revisionId,source.id,1,source.content,stableHash(source.content),'fictional_seed',source.capturedAt),
    );
  }
  statements.push(
    db.prepare("INSERT OR IGNORE INTO collections (id,kind,title,version,status) VALUES ('COL-001','test_suite','Alert-path verification suite','1.0','approved')"),
    db.prepare("INSERT OR IGNORE INTO collection_members (collection_id,item_id,member_kind) VALUES ('COL-001','TEST-003','evidence')"),
    db.prepare("INSERT OR IGNORE INTO collection_members (collection_id,item_id,member_kind) VALUES ('COL-001','TEST-007','evidence')"),
    db.prepare("INSERT OR IGNORE INTO collection_members (collection_id,item_id,member_kind) VALUES ('COL-001','TEST-009','evidence')"),
    db.prepare("INSERT OR IGNORE INTO collections (id,kind,title,version,status) VALUES ('COL-002','requirement_family','Analysis result requirements','1.0','approved')"),
    db.prepare("INSERT OR IGNORE INTO collection_members (collection_id,item_id,member_kind) VALUES ('COL-002','REQ-004','evidence')"),
    db.prepare("INSERT OR IGNORE INTO collection_members (collection_id,item_id,member_kind) VALUES ('COL-002','REQ-006','evidence')"),
    db.prepare("INSERT OR IGNORE INTO collection_members (collection_id,item_id,member_kind) VALUES ('COL-002','REQ-010','evidence')"),
  );
  await db.batch(statements);
}

type SourceSummaryRow = {
  id:string;title:string;kind:string;status:string;latestRevisionId:string;revision:number;importedAt:string;
  requiredOpen:number;advisoryOpen:number;candidateCount:number;approvedCandidateCount:number;
};

async function sourceSummaries(db:D1Database):Promise<z.infer<typeof SourceSummarySchema>[]> {
  const result = await db.prepare(`SELECT a.id,a.title,a.kind,a.status,a.latest_revision_id AS latestRevisionId,r.revision,r.captured_at AS importedAt,
    (SELECT COUNT(*) FROM source_clarifications c JOIN source_processing_runs p ON p.id=c.run_id WHERE c.source_id=a.id AND p.revision_id=a.latest_revision_id AND c.severity='required' AND c.status='open') AS requiredOpen,
    (SELECT COUNT(*) FROM source_clarifications c JOIN source_processing_runs p ON p.id=c.run_id WHERE c.source_id=a.id AND p.revision_id=a.latest_revision_id AND c.severity='advisory' AND c.status='open') AS advisoryOpen,
    (SELECT COUNT(*) FROM source_candidates c JOIN source_processing_runs p ON p.id=c.run_id WHERE c.source_id=a.id AND p.revision_id=a.latest_revision_id) AS candidateCount,
    (SELECT COUNT(*) FROM source_candidates c JOIN source_processing_runs p ON p.id=c.run_id WHERE c.source_id=a.id AND p.revision_id=a.latest_revision_id AND c.status='approved_for_baseline') AS approvedCandidateCount
    FROM source_artifacts a JOIN source_revisions r ON r.id=a.latest_revision_id ORDER BY a.created_at,a.id`).all<SourceSummaryRow>();
  return result.results.map((row) => SourceSummarySchema.parse({ ...row,kind:SourceKindSchema.parse(row.kind),status:SourceStatusSchema.parse(row.status) }));
}

export async function listSourceWorkspace(db:D1Database):Promise<SourceListResponse> {
  await initializeSources(db);
  const sources = await sourceSummaries(db);
  const release = await db.prepare('SELECT id,label,baseline_id AS baselineId,status,code_revision AS codeRevision,ci_status AS ciStatus,created_at AS createdAt FROM releases ORDER BY created_at DESC LIMIT 1').first<{ id:string;label:string;baselineId:string;status:string;codeRevision:string|null;ciStatus:string|null;createdAt:string }>();
  const openCandidates = await db.prepare("SELECT COUNT(*) AS count FROM source_candidates c JOIN source_processing_runs p ON p.id=c.run_id JOIN source_artifacts a ON a.id=c.source_id AND a.latest_revision_id=p.revision_id WHERE c.status IN ('pending_review','revision_requested')").first<{ count:number }>();
  const impactRuns = await db.prepare("SELECT p.id,p.source_id AS sourceId,p.revision_id AS revisionId,p.kind,p.mode,p.model,p.reasoning_effort AS reasoningEffort,p.policy_version AS policyVersion,p.status,p.output_json AS outputJson,p.error,p.provider_request_id AS providerRequestId,p.duration_ms AS durationMs,p.attempt_count AS attemptCount,p.input_tokens AS inputTokens,p.output_tokens AS outputTokens,p.embedding_tokens AS embeddingTokens,p.created_at AS createdAt FROM source_processing_runs p JOIN source_artifacts a ON a.id=p.source_id AND a.latest_revision_id=p.revision_id WHERE p.kind='impact_analysis' ORDER BY p.created_at DESC,p.id DESC").all<RunRow & { outputJson:string|null }>();
  const latestImpactBySource = new Map<string,typeof impactRuns.results[number]>();
  for (const run of impactRuns.results) if (!latestImpactBySource.has(run.sourceId)) latestImpactBySource.set(run.sourceId,run);
  const impactSuggestions = [...latestImpactBySource.values()].flatMap((run) => run.status === 'completed' && run.outputJson ? z.object({ suggestions:z.array(SourceImpactSuggestionSchema) }).parse(parseJson(run.outputJson)).suggestions : []);
  const pendingImpacts = impactSuggestions.filter((suggestion) => suggestion.decision === 'pending').length;
  const reviewCount = sources.reduce((sum,source) => sum + source.requiredOpen + source.advisoryOpen,0) + (openCandidates?.count ?? 0) + pendingImpacts;
  const approvedCandidateCount = sources.reduce((sum,source) => sum + source.approvedCandidateCount,0);
  const candidateSources = sources.filter((source) => source.status === 'candidate_baseline');
  const candidateBaselineReady = candidateSources.length > 0 && candidateSources.every((source) => latestImpactBySource.get(source.id)?.status === 'completed') && pendingImpacts === 0;
  const latestImpact = impactRuns.results[0];
  return SourceListResponseSchema.parse({ sources,reviewCount,approvedCandidateCount,candidateBaselineReady,impactSuggestions,impactRun:latestImpact ? ProcessingRunSchema.parse(latestImpact) : null,release:release ?? null });
}

type RunRow = {
  id:string;sourceId:string;revisionId:string;kind:string;mode:string;model:string;reasoningEffort:string;policyVersion:string;status:string;error:string|null;createdAt:string;
  providerRequestId:string|null;durationMs:number|null;attemptCount:number;inputTokens:number|null;outputTokens:number|null;embeddingTokens:number|null;
};
type ClarificationRow = { id:string;runId:string;sourceId:string;kind:string;severity:string;question:string;rationale:string;citationsJson:string;status:string;answer:string|null;decisionReason:string|null;actor:string|null;updatedAt:string };
type CandidateRow = { id:string;runId:string;sourceId:string;type:string;level:string|null;supportedUser:string|null;goalOrConstraint:string|null;title:string;statement:string;rationale:string;origin:string;status:string;parentIdsJson:string;citationsJson:string;advisoryClarificationIdsJson:string;model:string;policyVersion:string;reviewedBy:string|null;reviewedAt:string|null };

export async function getSourceDetail(db:D1Database,id:string):Promise<SourceDetail|null> {
  await initializeSources(db);
  const source = (await sourceSummaries(db)).find((entry) => entry.id === id);
  if (!source) return null;
  const revision = await db.prepare('SELECT id,revision,content,content_hash AS contentHash,origin,captured_at AS capturedAt FROM source_revisions WHERE id=?').bind(source.latestRevisionId).first<{ id:string;revision:number;content:string;contentHash:string;origin:string;capturedAt:string }>();
  if (!revision) return null;
  const runs = await db.prepare('SELECT id,source_id AS sourceId,revision_id AS revisionId,kind,mode,model,reasoning_effort AS reasoningEffort,policy_version AS policyVersion,status,error,provider_request_id AS providerRequestId,duration_ms AS durationMs,attempt_count AS attemptCount,input_tokens AS inputTokens,output_tokens AS outputTokens,embedding_tokens AS embeddingTokens,created_at AS createdAt FROM source_processing_runs WHERE source_id=? AND revision_id=? ORDER BY created_at DESC,id DESC').bind(id,source.latestRevisionId).all<RunRow>();
  const clarifications = await db.prepare('SELECT c.id,c.run_id AS runId,c.source_id AS sourceId,c.kind,c.severity,c.question,c.rationale,c.citations_json AS citationsJson,c.status,c.answer,c.decision_reason AS decisionReason,c.actor,c.updated_at AS updatedAt FROM source_clarifications c JOIN source_processing_runs p ON p.id=c.run_id WHERE c.source_id=? AND p.revision_id=? ORDER BY c.updated_at,c.id').bind(id,source.latestRevisionId).all<ClarificationRow>();
  const candidates = await db.prepare('SELECT c.id,c.run_id AS runId,c.source_id AS sourceId,c.type,c.level,c.supported_user AS supportedUser,c.goal_or_constraint AS goalOrConstraint,c.title,c.statement,c.rationale,c.origin,c.status,c.parent_ids_json AS parentIdsJson,c.citations_json AS citationsJson,c.advisory_clarification_ids_json AS advisoryClarificationIdsJson,c.model,c.policy_version AS policyVersion,c.reviewed_by AS reviewedBy,c.reviewed_at AS reviewedAt FROM source_candidates c JOIN source_processing_runs p ON p.id=c.run_id WHERE c.source_id=? AND p.revision_id=? ORDER BY c.type,c.id').bind(id,source.latestRevisionId).all<CandidateRow>();
  return SourceDetailSchema.parse({
    source,revision,runs:runs.results.map((row) => ProcessingRunSchema.parse(row)),
    clarifications:clarifications.results.map((row) => ClarificationSchema.parse({ ...row,citations:CitationArraySchema.parse(parseJson(row.citationsJson)) })),
    candidates:candidates.results.map((row) => SourceCandidateSchema.parse({ ...row,parentIds:StringArraySchema.parse(parseJson(row.parentIdsJson)),citations:CitationArraySchema.parse(parseJson(row.citationsJson)),advisoryClarificationIds:StringArraySchema.parse(parseJson(row.advisoryClarificationIdsJson)) })),
  });
}

export async function importSource(db:D1Database,raw:unknown):Promise<SourceDetail> {
  await initializeSources(db);
  const input = ImportSourceInputSchema.parse(raw); const id = makeId('SRC'); const revisionId = makeId('SRV'); const createdAt = now();
  await db.batch([
    db.prepare('INSERT INTO source_artifacts (id,title,kind,status,latest_revision_id,created_at) VALUES (?,?,?,?,?,?)').bind(id,input.title,input.kind,'new',revisionId,createdAt),
    db.prepare('INSERT INTO source_revisions (id,source_id,revision,content,content_hash,origin,captured_at) VALUES (?,?,?,?,?,?,?)').bind(revisionId,id,1,input.content,stableHash(input.content),'human_import',createdAt),
  ]);
  const detail = await getSourceDetail(db,id);
  if (!detail) throw new Error('Imported source could not be loaded.');
  return detail;
}

export async function updateSourceRevision(db:D1Database,id:string,raw:unknown):Promise<SourceDetail|null> {
  await initializeSources(db);
  const input = UpdateSourceRevisionInputSchema.parse(raw);
  const current = await db.prepare('SELECT a.latest_revision_id AS revisionId,r.revision,r.content_hash AS contentHash FROM source_artifacts a JOIN source_revisions r ON r.id=a.latest_revision_id WHERE a.id=?').bind(id).first<{ revisionId:string;revision:number;contentHash:string }>();
  if (!current) return null;
  const revisionId = makeId('SRV'); const capturedAt = now(); const contentHash = stableHash(input.content);
  if (contentHash === current.contentHash) throw new WorkflowConflictError('The supplied content matches the current source revision.');
  const affected = await db.prepare("SELECT DISTINCT item_id AS itemId FROM evidence_versions WHERE sources_json LIKE ?").bind(`%${current.revisionId}%`).all<{ itemId:string }>();
  await db.batch([
    db.prepare('INSERT INTO source_revisions (id,source_id,revision,content,content_hash,origin,captured_at) VALUES (?,?,?,?,?,?,?)').bind(revisionId,id,current.revision + 1,input.content,contentHash,'human_import',capturedAt),
    db.prepare("UPDATE source_artifacts SET latest_revision_id=?,status='new' WHERE id=?").bind(revisionId,id),
    db.prepare('INSERT INTO source_processing_runs (id,source_id,revision_id,kind,mode,model,reasoning_effort,policy_version,status,input_json,output_json,error,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(makeId('PRC'),id,revisionId,'source_revision_impact','replay','deterministic','not_run','source-revision-diff-v1','completed',JSON.stringify({ previousRevisionId:current.revisionId,currentRevisionId:revisionId }),JSON.stringify({ category:'source_drift',action:'review',affectedEvidenceIds:affected.results.map((row) => row.itemId),message:'A new source revision requires context analysis and impact review; approved evidence is unchanged.' }),null,capturedAt),
  ]);
  return getSourceDetail(db,id);
}

type ProcessingKind = 'source_context'|'user_needs'|'requirements'|'impact_analysis';
type LiveResult<T> = { value:T;attemptCount:number };

class LiveAttemptFailure extends Error {
  constructor(public readonly causeValue:unknown,public readonly attemptCount:number,public readonly retryable:boolean) {
    super(causeValue instanceof Error ? causeValue.message : 'Live processing failed.');
  }
}

function safeLiveFailureMessage(activity:string,failure:LiveAttemptFailure):string {
  if (failure.message.includes('OPENROUTER_API_KEY is not configured')) return `OpenRouter is not configured, so live ${activity} did not run.`;
  if (failure.retryable) return `OpenRouter was temporarily unavailable during ${activity}. No generated records were saved.`;
  return `Live ${activity} did not pass the configured output and provenance checks. No generated records were saved.`;
}

async function runLive<T>(operation:()=>Promise<T>):Promise<LiveResult<T>> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try { return { value:await operation(),attemptCount:attempt }; }
    catch (error:unknown) {
      const transient = isTransientOpenRouterError(error);
      if (!transient || attempt === 2) throw new LiveAttemptFailure(error,attempt,transient);
    }
  }
  throw new LiveAttemptFailure(new Error('Live processing did not run.'),0,false);
}

async function saveProcessingRun(db:D1Database,args:{
  id?:string;sourceId:string;revisionId:string;kind:ProcessingKind;mode:'live'|'replay';model:string;reasoningEffort:'low'|'medium'|'high'|'not_run';policyVersion:string;
  status:'completed'|'failed';input:unknown;output:unknown|null;error?:string;attemptCount:number;metadata?:ModelRunMetadata;
}):Promise<string> {
  const id = args.id ?? makeId('PRC');
  await db.prepare('INSERT INTO source_processing_runs (id,source_id,revision_id,kind,mode,model,reasoning_effort,policy_version,status,input_json,output_json,error,provider_request_id,duration_ms,attempt_count,input_tokens,output_tokens,embedding_tokens,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id,args.sourceId,args.revisionId,args.kind,args.mode,args.model,args.reasoningEffort,args.policyVersion,args.status,JSON.stringify(args.input),args.output === null ? null : JSON.stringify(args.output),args.error ?? null,args.metadata?.providerRequestId ?? null,args.metadata?.durationMs ?? null,args.attemptCount,args.metadata?.inputTokens ?? null,args.metadata?.outputTokens ?? null,args.metadata?.embeddingTokens ?? null,now()).run();
  return id;
}

export async function analyzeSource(db:D1Database,id:string,raw:unknown):Promise<SourceDetail|null> {
  const input = RunSourceAnalysisInputSchema.parse(raw); const detail = await getSourceDetail(db,id);
  if (!detail) return null;
  let output:ContextOutput; let model:string; let reasoningEffort:'low'|'medium'|'high'|'not_run'; let metadata:ModelRunMetadata|undefined; let attemptCount = 0;
  if (input.mode === 'live') {
    try {
      const result = await runLive(() => analyzeSourceContext({ revisionId:detail.revision.id,title:detail.source.title,content:detail.revision.content }));
      const live = result.value; attemptCount = result.attemptCount;
      const citationsValid = live.output.questions.every((question) => question.citations.every((citation) => citation.sourceRevisionId === detail.revision.id && detail.revision.content.includes(citation.quote)));
      if (!citationsValid) throw new LiveAttemptFailure(new Error('The live analysis returned a citation that does not exactly match the source revision.'),attemptCount,false);
      output = live.output; model = live.model; reasoningEffort = live.reasoningEffort; metadata = live.metadata;
    } catch (error:unknown) {
      const failure = error instanceof LiveAttemptFailure ? error : new LiveAttemptFailure(error,attemptCount,false);
      const config = configuredOpenRouterModel();
      const message = safeLiveFailureMessage('source analysis',failure);
      const runId = await saveProcessingRun(db,{ sourceId:id,revisionId:detail.revision.id,kind:'source_context',mode:'live',model:config.model,reasoningEffort:config.reasoningEffort,policyVersion:SOURCE_CONTEXT_POLICY.name,status:'failed',input:{ revisionId:detail.revision.id },output:null,error:message,attemptCount:failure.attemptCount });
      throw new LiveProcessingError(message,runId,failure.retryable);
    }
  } else { output = ContextOutputSchema.parse(sourceContextReplay(id,detail.revision.id)); model = 'saved-demo-output'; reasoningEffort = 'not_run'; }
  const runId = await saveProcessingRun(db,{ sourceId:id,revisionId:detail.revision.id,kind:'source_context',mode:input.mode,model,reasoningEffort,policyVersion:SOURCE_CONTEXT_POLICY.name,input:{ revisionId:detail.revision.id },output,status:'completed',attemptCount,metadata });
  const createdAt = now();
  const statements = output.questions.map((question) => db.prepare('INSERT INTO source_clarifications (id,run_id,source_id,kind,severity,question,rationale,citations_json,status,answer,decision_reason,actor,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(makeId('CLR'),runId,id,question.kind,question.severity,question.question,question.rationale,JSON.stringify(question.citations),'open',null,null,null,createdAt));
  statements.push(db.prepare('UPDATE source_artifacts SET status=? WHERE id=?').bind(output.questions.some((question) => question.severity === 'required') ? 'needs_context' : 'ready_for_needs',id));
  await db.batch(statements);
  return getSourceDetail(db,id);
}

async function refreshSourceStatus(db:D1Database,sourceId:string):Promise<void> {
  const requiredOpen = await db.prepare("SELECT COUNT(*) AS count FROM source_clarifications c JOIN source_processing_runs p ON p.id=c.run_id JOIN source_artifacts a ON a.id=c.source_id AND a.latest_revision_id=p.revision_id WHERE c.source_id=? AND c.severity='required' AND c.status='open'").bind(sourceId).first<{ count:number }>();
  const candidates = await db.prepare('SELECT c.type,c.status FROM source_candidates c JOIN source_processing_runs p ON p.id=c.run_id JOIN source_artifacts a ON a.id=c.source_id AND a.latest_revision_id=p.revision_id WHERE c.source_id=?').bind(sourceId).all<{ type:string;status:string }>();
  const userNeeds = candidates.results.filter((entry) => entry.type === 'user_need'); const requirements = candidates.results.filter((entry) => entry.type === 'requirement');
  let status = 'ready_for_needs';
  if ((requiredOpen?.count ?? 0) > 0) status = 'needs_context';
  else if (userNeeds.length === 0) status = 'ready_for_needs';
  else if (userNeeds.some((entry) => entry.status === 'pending_review' || entry.status === 'revision_requested')) status = 'needs_review';
  else if (!userNeeds.some((entry) => entry.status === 'approved_for_baseline')) status = 'ready_for_needs';
  else if (requirements.length === 0) status = 'ready_for_requirements';
  else if (requirements.some((entry) => entry.status === 'pending_review' || entry.status === 'revision_requested')) status = 'needs_review';
  else if (requirements.some((entry) => entry.status === 'approved_for_baseline')) status = 'candidate_baseline';
  await db.prepare('UPDATE source_artifacts SET status=? WHERE id=?').bind(status,sourceId).run();
}

function impactCategoryFor(itemType:string|undefined,origin:'linked'|'semantic'|'collection'):SourceImpactSuggestion['category'] {
  if (origin === 'collection') return 'collection_membership';
  if (itemType === 'test') return 'verification_coverage';
  if (itemType === 'hazard' || itemType === 'risk_control') return 'shared_risk_or_control';
  if (itemType === 'component') return 'interface_or_data_flow';
  return origin === 'linked' ? 'hierarchy' : 'functional_overlap';
}

async function createSourceImpactAnalysis(db:D1Database,sourceId:string,mode:'live'|'replay',throwOnFailure:boolean):Promise<void> {
  const detail = await getSourceDetail(db,sourceId);
  if (!detail || detail.source.status !== 'candidate_baseline') return;
  const existing = detail.runs.some((run) => run.kind === 'impact_analysis' && run.status === 'completed');
  if (existing) return;
  const approved = detail.candidates.filter((candidate) => candidate.status === 'approved_for_baseline');
  const [evidence,relationships] = await Promise.all([listEvidence(db),listRelationships(db)]);
  const query = approved.map((candidate) => `${candidate.title} ${candidate.statement} ${candidate.rationale}`).join('\n');
  let semantic = lexicalCandidates(query,evidence,new Set(),5);
  if (semantic.length === 0) {
    const fallback = evidence.find((item) => item.type === 'requirement') ?? evidence[0];
    if (fallback) semantic = [{ targetId:fallback.id,path:[fallback.id],origin:'semantic' }];
  }
  const runId = makeId('PRC');
  const liveConfig = configuredOpenRouterModel();
  let model:string; let reasoningEffort:'low'|'medium'|'high'|'not_run'; let metadata:ModelRunMetadata|undefined; let attemptCount = 0;
  let rawSuggestions:Array<{ targetId:string;origin:'linked'|'semantic';category:SourceImpactSuggestion['category'];action:'review'|'update'|'retest'|'new_link'|'no_change';rationale:string;citations:string[] }>;
  if (mode === 'live') {
    try {
      const anchor = semantic[0];
      if (!anchor) throw new LiveAttemptFailure(new Error('No bounded impact candidates were available.'),0,false);
      const result = await runLive(() => analyseWithOpenRouter({ db,anchorId:anchor.targetId,title:'Source-derived candidate batch',rationale:'New reviewed user needs and requirements are proposed for the product baseline.',proposedText:query,evidence,relationships }));
      const live = result.value; attemptCount = result.attemptCount; model = live.model; reasoningEffort = liveConfig.reasoningEffort; metadata = live.metadata;
      rawSuggestions = live.suggestions.map((suggestion) => ({ targetId:suggestion.targetId,origin:suggestion.origin === 'linked' ? 'linked' : 'semantic',category:suggestion.category,action:suggestion.action,rationale:suggestion.rationale,citations:suggestion.citations }));
    } catch (error:unknown) {
      const failure = error instanceof LiveAttemptFailure ? error : new LiveAttemptFailure(error,attemptCount,false);
      const message = safeLiveFailureMessage('source impact analysis',failure);
      await saveProcessingRun(db,{ id:runId,sourceId,revisionId:detail.revision.id,kind:'impact_analysis',mode:'live',model:liveConfig.model,reasoningEffort:liveConfig.reasoningEffort,policyVersion:'impact-v6',status:'failed',input:{ sourceRevisionId:detail.revision.id,candidateIds:approved.map((candidate) => candidate.id),boundedEvidenceIds:semantic.map((candidate) => candidate.targetId) },output:null,error:message,attemptCount:failure.attemptCount });
      if (throwOnFailure) throw new LiveProcessingError(message,runId,failure.retryable);
      return;
    }
  } else {
    model = 'saved-demo-output'; reasoningEffort = 'not_run';
    const semanticIds = new Set(semantic.map((candidate) => candidate.targetId));
    const linked = semantic.slice(0,2).flatMap((candidate) => graphCandidates(candidate.targetId,relationships,1)).filter((candidate) => !semanticIds.has(candidate.targetId)).slice(0,6);
    rawSuggestions = [
      ...linked.map((candidate) => { const item = evidence.find((entry) => entry.id === candidate.targetId); return { targetId:candidate.targetId,origin:'linked' as const,category:impactCategoryFor(item?.type,'linked'),action:item?.type === 'test' ? 'retest' as const : 'review' as const,rationale:`A stored relationship path from ${candidate.path[0]} reaches ${candidate.targetId}; review the controlled dependency for the new source-derived evidence.`,citations:candidate.path }; }),
      ...semantic.map((candidate) => { const item = evidence.find((entry) => entry.id === candidate.targetId); return { targetId:candidate.targetId,origin:'semantic' as const,category:impactCategoryFor(item?.type,'semantic'),action:'review' as const,rationale:`The content of ${candidate.targetId} overlaps the new source-derived needs and requirements even though no new direct relationship has been asserted.`,citations:[candidate.targetId] }; }),
    ];
  }
  const seen = new Set(rawSuggestions.map((suggestion) => suggestion.targetId));
  const collection = await getCollectionsForEvidence(db,semantic.map((candidate) => candidate.targetId));
  const collectionSuggestions = collection.filter((candidate) => !seen.has(candidate.targetId)).slice(0,6).map((candidate) => ({ targetId:candidate.targetId,origin:'collection' as const,category:'collection_membership' as const,action:'review' as const,rationale:`${candidate.targetId} shares a controlled collection with a semantic impact candidate; review it without claiming a direct trace link.`,citations:candidate.path }));
  const suggestions:SourceImpactSuggestion[] = [...rawSuggestions,...collectionSuggestions].slice(0,16).map((suggestion) => SourceImpactSuggestionSchema.parse({
    id:makeId('SUG'),sourceId,runId,targetId:suggestion.targetId,origin:suggestion.origin,category:suggestion.category,proposedAction:suggestion.action,rationale:suggestion.rationale,citations:suggestion.citations,decision:'pending',decisionReason:null,decidedBy:null,
  }));
  await saveProcessingRun(db,{ id:runId,sourceId,revisionId:detail.revision.id,kind:'impact_analysis',mode,model,reasoningEffort,policyVersion:mode === 'live' ? 'impact-v6' : 'impact-replay-v2',status:'completed',input:{ sourceRevisionId:detail.revision.id,candidateIds:approved.map((candidate) => candidate.id),boundedEvidenceIds:semantic.map((candidate) => candidate.targetId) },output:{ suggestions },attemptCount,metadata });
}

export async function runSourceImpactAnalysis(db:D1Database,id:string,raw:unknown):Promise<SourceListResponse|null> {
  const input = RunSourceImpactInputSchema.parse(raw); const detail = await getSourceDetail(db,id);
  if (!detail) return null;
  if (detail.source.status !== 'candidate_baseline') throw new WorkflowConflictError('Complete candidate review before running source impact analysis.');
  await createSourceImpactAnalysis(db,id,input.mode,true);
  return listSourceWorkspace(db);
}

export async function decideClarification(db:D1Database,id:string,raw:unknown):Promise<SourceDetail|null> {
  const input = ClarificationDecisionInputSchema.parse(raw);
  const current = await db.prepare('SELECT source_id AS sourceId,status FROM source_clarifications WHERE id=?').bind(id).first<{ sourceId:string;status:string }>();
  if (!current || current.status !== 'open') return null;
  const updatedAt = now();
  const status = input.action === 'answer' ? 'answered' : input.action === 'defer' ? 'deferred' : 'dismissed';
  const answer = input.action === 'answer' ? input.answer : null; const reason = input.action === 'answer' ? null : input.reason;
  await db.prepare('UPDATE source_clarifications SET status=?,answer=?,decision_reason=?,actor=?,updated_at=? WHERE id=? AND status=\'open\'').bind(status,answer,reason,input.actor,updatedAt,id).run();
  await refreshSourceStatus(db,current.sourceId);
  return getSourceDetail(db,current.sourceId);
}

function policyFor(kind:'user_needs'|'requirements') { return kind === 'user_needs' ? USER_NEEDS_POLICY : REQUIREMENTS_POLICY; }
function withoutTerminalPunctuation(value:string):string { return value.trim().replace(/[.!?]+$/u,''); }
function userNeedStatement(supportedUser:string,goalOrConstraint:string):string {
  const user = withoutTerminalPunctuation(supportedUser).replace(/^(?:a|an|the)\s+/i,'');
  const goal = withoutTerminalPunctuation(goalOrConstraint).replace(/^to\s+/i,'');
  return `For ${user}, the need is that ${goal.charAt(0).toLowerCase()}${goal.slice(1)}.`;
}

export async function generateCandidates(db:D1Database,id:string,raw:unknown):Promise<SourceDetail|null> {
  const input = GenerateCandidatesInputSchema.parse(raw); const detail = await getSourceDetail(db,id);
  if (!detail) return null;
  if (detail.clarifications.some((entry) => entry.severity === 'required' && entry.status === 'open')) throw new WorkflowConflictError('Resolve or defer every required clarification before generating candidates.');
  if (detail.candidates.some((candidate) => candidate.type === (input.kind === 'user_needs' ? 'user_need' : 'requirement'))) throw new WorkflowConflictError(`This source already has ${input.kind.replace('_',' ')} candidates.`);
  const approvedNeeds = detail.candidates.filter((candidate) => candidate.type === 'user_need' && candidate.status === 'approved_for_baseline');
  if (input.kind === 'requirements') {
    const undecidedNeeds = detail.candidates.some((candidate) => candidate.type === 'user_need' && (candidate.status === 'pending_review' || candidate.status === 'revision_requested'));
    if (approvedNeeds.length === 0 || undecidedNeeds) throw new WorkflowConflictError('Complete user-need review and approve at least one user need before deriving requirements.');
  }
  const clarificationInput = detail.clarifications.filter((entry) => entry.status !== 'open').map((entry) => ({ id:entry.id,question:entry.question,status:entry.status,answer:entry.answer,reason:entry.decisionReason }));
  let output:CandidateOutput; let model:string; let reasoningEffort:'low'|'medium'|'high'|'not_run'; let metadata:ModelRunMetadata|undefined; let attemptCount = 0;
  if (input.mode === 'live') {
    try {
      const result = input.kind === 'user_needs'
        ? await runLive(() => generateSourceCandidates({ kind:'user_needs',revisionId:detail.revision.id,title:detail.source.title,content:detail.revision.content,clarifications:clarificationInput,approvedNeeds }))
        : await runLive(() => generateSourceCandidates({ kind:'requirements',revisionId:detail.revision.id,title:detail.source.title,content:detail.revision.content,clarifications:clarificationInput,approvedNeeds }));
      const live = result.value; attemptCount = result.attemptCount;
      if (!live.output.candidates.every((candidate) => validateCandidateCitations({ citations:candidate.citations,revisionId:detail.revision.id,content:detail.revision.content,clarifications:clarificationInput }))) throw new LiveAttemptFailure(new Error('The live generation returned invalid source or clarification provenance.'),attemptCount,false);
      if (input.kind === 'requirements') {
        const approvedIds = new Set(approvedNeeds.map((candidate) => candidate.id));
        const parsed = RequirementsOutputSchema.parse(live.output);
        if (!parsed.candidates.every((candidate) => candidate.parentIds.every((parentId) => approvedIds.has(parentId)))) throw new LiveAttemptFailure(new Error('The live requirements did not refine supplied approved user needs.'),attemptCount,false);
      }
      output = live.output; model = live.model; reasoningEffort = live.reasoningEffort; metadata = live.metadata;
    } catch (error:unknown) {
      const failure = error instanceof LiveAttemptFailure ? error : new LiveAttemptFailure(error,attemptCount,false);
      const config = configuredOpenRouterModel(); const policy = policyFor(input.kind);
      const message = safeLiveFailureMessage(`${input.kind.replace('_',' ')} generation`,failure);
      const runId = await saveProcessingRun(db,{ sourceId:id,revisionId:detail.revision.id,kind:input.kind,mode:'live',model:config.model,reasoningEffort:config.reasoningEffort,policyVersion:policy.name,status:'failed',input:{ revisionId:detail.revision.id,clarifications:clarificationInput,approvedNeedIds:approvedNeeds.map((candidate) => candidate.id) },output:null,error:message,attemptCount:failure.attemptCount });
      throw new LiveProcessingError(message,runId,failure.retryable);
    }
  } else {
    model = 'saved-demo-output'; reasoningEffort = 'not_run';
    output = input.kind === 'user_needs'
      ? UserNeedsOutputSchema.parse(userNeedsReplay(id,detail.revision.id,clarificationInput))
      : RequirementsOutputSchema.parse(requirementsReplay(id,detail.revision.id,approvedNeeds.map((candidate) => candidate.id),clarificationInput));
  }
  const policy = policyFor(input.kind);
  const runId = await saveProcessingRun(db,{ sourceId:id,revisionId:detail.revision.id,kind:input.kind,mode:input.mode,model,reasoningEffort,policyVersion:policy.name,status:'completed',input:{ revisionId:detail.revision.id,clarifications:clarificationInput,approvedNeedIds:approvedNeeds.map((candidate) => candidate.id) },output,attemptCount,metadata });
  const advisoryIds = detail.clarifications.filter((entry) => entry.severity === 'advisory' && entry.status === 'open').map((entry) => entry.id);
  const statements = input.kind === 'requirements'
    ? RequirementsOutputSchema.parse(output).candidates.map((candidate) => db.prepare('INSERT INTO source_candidates (id,run_id,source_id,type,level,supported_user,goal_or_constraint,title,statement,rationale,origin,status,parent_ids_json,citations_json,advisory_clarification_ids_json,model,policy_version,reviewed_by,reviewed_at,review_reason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(makeId('CAN'),runId,id,'requirement',candidate.level,null,null,candidate.title,candidate.statement,candidate.rationale,'ai','pending_review',JSON.stringify(candidate.parentIds),JSON.stringify(candidate.citations),JSON.stringify(advisoryIds),model,policy.name,null,null,null))
    : UserNeedsOutputSchema.parse(output).candidates.map((candidate) => db.prepare('INSERT INTO source_candidates (id,run_id,source_id,type,level,supported_user,goal_or_constraint,title,statement,rationale,origin,status,parent_ids_json,citations_json,advisory_clarification_ids_json,model,policy_version,reviewed_by,reviewed_at,review_reason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(makeId('CAN'),runId,id,'user_need',null,candidate.supportedUser,candidate.goalOrConstraint,candidate.title,userNeedStatement(candidate.supportedUser,candidate.goalOrConstraint),candidate.rationale,'ai','pending_review','[]',JSON.stringify(candidate.citations),JSON.stringify(advisoryIds),model,policy.name,null,null,null));
  await db.batch(statements);
  await refreshSourceStatus(db,id);
  return getSourceDetail(db,id);
}

export async function decideCandidate(db:D1Database,id:string,raw:unknown):Promise<SourceDetail|null> {
  const input = CandidateDecisionInputSchema.parse(raw);
  const candidate = await db.prepare('SELECT source_id AS sourceId,status FROM source_candidates WHERE id=?').bind(id).first<{ sourceId:string;status:string }>();
  if (!candidate || candidate.status !== 'pending_review') return null;
  await db.prepare("UPDATE source_candidates SET status=?,reviewed_by=?,reviewed_at=?,review_reason=? WHERE id=? AND status='pending_review'").bind(input.decision,input.actor,now(),input.reason,id).run();
  await refreshSourceStatus(db,candidate.sourceId);
  await createSourceImpactAnalysis(db,candidate.sourceId,'live',false);
  return getSourceDetail(db,candidate.sourceId);
}

export async function decideSourceImpactSuggestion(db:D1Database,id:string,raw:unknown):Promise<SourceListResponse|null> {
  const input = SourceImpactDecisionInputSchema.parse(raw); await initializeSources(db);
  const runs = await db.prepare("SELECT p.id,p.output_json AS outputJson FROM source_processing_runs p JOIN source_artifacts a ON a.id=p.source_id AND a.latest_revision_id=p.revision_id WHERE p.kind='impact_analysis' AND p.status='completed' AND p.output_json IS NOT NULL ORDER BY p.created_at DESC,p.id DESC").all<{ id:string;outputJson:string }>();
  for (const run of runs.results) {
    const output = z.object({ suggestions:z.array(SourceImpactSuggestionSchema) }).parse(parseJson(run.outputJson));
    const suggestion = output.suggestions.find((entry) => entry.id === id);
    if (!suggestion || suggestion.decision !== 'pending') continue;
    const suggestions = output.suggestions.map((entry) => entry.id === id ? { ...entry,decision:input.decision,decisionReason:input.reason,decidedBy:input.actor } : entry);
    await db.prepare('UPDATE source_processing_runs SET output_json=? WHERE id=?').bind(JSON.stringify({ suggestions }),run.id).run();
    return listSourceWorkspace(db);
  }
  return null;
}

function nextBaselineLabel(current:string):string {
  const match = /^(.*-)(\d+)\.(\d+)$/.exec(current);
  return match ? `${match[1]}${match[2]}.${Number(match[3]) + 1}` : `${current}.1`;
}

function nextEvidenceId(prefix:'UN'|'REQ',used:string[]):string {
  const max = used.filter((id) => id.startsWith(`${prefix}-`)).map((id) => Number(id.slice(prefix.length + 1))).filter(Number.isFinite).reduce((value,current) => Math.max(value,current),0);
  return `${prefix}-${String(max + 1).padStart(3,'0')}`;
}

export async function approveSourceBaseline(db:D1Database,raw:unknown):Promise<SourceListResponse> {
  const input = ApproveSourceBaselineInputSchema.parse(raw); await initializeSources(db);
  const readiness = await listSourceWorkspace(db);
  if (!readiness.candidateBaselineReady) throw new WorkflowConflictError('Complete impact review, candidate review, and required clarifications before approving the baseline.');
  const candidates = await db.prepare("SELECT c.id,c.source_id AS sourceId,c.type,c.level,c.title,c.statement,c.rationale,c.parent_ids_json AS parentIdsJson,c.citations_json AS citationsJson FROM source_candidates c JOIN source_processing_runs p ON p.id=c.run_id JOIN source_artifacts a ON a.id=c.source_id AND a.latest_revision_id=p.revision_id WHERE c.status='approved_for_baseline' AND a.status='candidate_baseline' ORDER BY c.type,c.id").all<{ id:string;sourceId:string;type:'user_need'|'requirement';level:string|null;title:string;statement:string;rationale:string;parentIdsJson:string;citationsJson:string }>();
  const pending = await db.prepare("SELECT COUNT(*) AS count FROM source_candidates c JOIN source_processing_runs p ON p.id=c.run_id JOIN source_artifacts a ON a.id=c.source_id AND a.latest_revision_id=p.revision_id WHERE c.status IN ('pending_review','revision_requested')").first<{ count:number }>();
  const required = await db.prepare("SELECT COUNT(*) AS count FROM source_clarifications c JOIN source_processing_runs p ON p.id=c.run_id JOIN source_artifacts a ON a.id=c.source_id AND a.latest_revision_id=p.revision_id WHERE c.severity='required' AND c.status='open'").first<{ count:number }>();
  if ((pending?.count ?? 0) > 0 || (required?.count ?? 0) > 0 || !candidates.results.some((candidate) => candidate.type === 'requirement')) throw new WorkflowConflictError('Complete candidate review and required clarifications before approving the baseline.');
  const active = await db.prepare("SELECT id,label FROM baselines WHERE status='approved' ORDER BY approved_at DESC LIMIT 1").first<{ id:string;label:string }>();
  if (!active) throw new Error('No active baseline exists.');
  const baselineLabel = nextBaselineLabel(active.label); const baselineId = `BL-${baselineLabel}`; const approvedAt = now();
  const existingIds = (await db.prepare('SELECT id FROM evidence_items').all<{ id:string }>()).results.map((row) => row.id);
  const candidateToEvidence = new Map<string,string>(); const allocated = [...existingIds];
  for (const candidate of candidates.results) { const id = nextEvidenceId(candidate.type === 'user_need' ? 'UN' : 'REQ',allocated); candidateToEvidence.set(candidate.id,id); allocated.push(id); }
  const relationRows = await db.prepare('SELECT source_id AS sourceId,target_id AS targetId,type FROM relationships WHERE baseline_id=? AND active=1 ORDER BY id').bind(active.id).all<{ sourceId:string;targetId:string;type:string }>();
  const relationCount = await db.prepare('SELECT COUNT(*) AS count FROM relationships').first<{ count:number }>(); let relationNumber = (relationCount?.count ?? 0) + 1;
  const statements:D1PreparedStatement[] = [db.prepare('INSERT INTO baselines (id,label,status,approved_by,approved_at) VALUES (?,?,?,?,?)').bind(baselineId,baselineLabel,'candidate',input.actor,approvedAt)];
  const oldItems = await db.prepare('SELECT item_id AS itemId,version_id AS versionId FROM baseline_items WHERE baseline_id=?').bind(active.id).all<{ itemId:string;versionId:string }>();
  for (const item of oldItems.results) statements.push(db.prepare('INSERT INTO baseline_items (baseline_id,item_id,version_id) VALUES (?,?,?)').bind(baselineId,item.itemId,item.versionId));
  for (const candidate of candidates.results) {
    const evidenceId = candidateToEvidence.get(candidate.id); if (!evidenceId) throw new Error('Candidate evidence mapping failed.');
    const versionId = `${evidenceId}-v1.0`; const citations = CitationArraySchema.parse(parseJson(candidate.citationsJson));
    statements.push(
      db.prepare('INSERT INTO evidence_items (id,type,owner,criticality,jurisdictions_json,current_version_id) VALUES (?,?,?,?,?,?)').bind(evidenceId,candidate.type,candidate.type === 'user_need' ? 'Product' : 'Engineering','medium',JSON.stringify(['US','EU']),versionId),
      db.prepare('INSERT INTO evidence_versions (id,item_id,version,title,statement,rationale,status,sources_json,flags_json,approved_by,approved_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(versionId,evidenceId,'1.0',candidate.title,candidate.statement,candidate.rationale,'approved',JSON.stringify(citations.map((citation) => citation.kind === 'source_span' ? citation.sourceRevisionId : `Clarification ${citation.clarificationId}`)),JSON.stringify(candidate.level ? ['origin_ai',candidate.level] : ['origin_ai']),input.actor,approvedAt),
      db.prepare('INSERT INTO baseline_items (baseline_id,item_id,version_id) VALUES (?,?,?)').bind(baselineId,evidenceId,versionId),
    );
  }
  for (const relation of relationRows.results) statements.push(db.prepare('INSERT INTO relationships (id,source_id,target_id,type,baseline_id,active) VALUES (?,?,?,?,?,1)').bind(`REL-${String(relationNumber++).padStart(3,'0')}-SRC`,relation.sourceId,relation.targetId,relation.type,baselineId));
  for (const candidate of candidates.results.filter((entry) => entry.type === 'requirement')) {
    const requirementId = candidateToEvidence.get(candidate.id); if (!requirementId) continue;
    const parentIds = StringArraySchema.parse(parseJson(candidate.parentIdsJson));
    for (const parentId of parentIds) { const needId = candidateToEvidence.get(parentId); if (needId) statements.push(db.prepare('INSERT INTO relationships (id,source_id,target_id,type,baseline_id,active) VALUES (?,?,?,?,?,1)').bind(`REL-${String(relationNumber++).padStart(3,'0')}-SRC`,requirementId,needId,'REFINES',baselineId)); }
  }
  const collectionId = makeId('COL');
  statements.push(db.prepare('INSERT INTO collections (id,kind,title,version,status) VALUES (?,?,?,?,?)').bind(collectionId,'processing_batch',`Source-derived evidence for ${baselineLabel}`,'1.0','approved'));
  for (const evidenceId of candidateToEvidence.values()) statements.push(db.prepare('INSERT INTO collection_members (collection_id,item_id,member_kind) VALUES (?,?,?)').bind(collectionId,evidenceId,'evidence'));
  const releaseId = makeId('RELSE');
  statements.push(
    db.prepare("UPDATE baselines SET status='superseded' WHERE status='approved'"),
    db.prepare("UPDATE baselines SET status='approved' WHERE id=?").bind(baselineId),
    db.prepare('INSERT INTO releases (id,label,baseline_id,status,code_revision,ci_status,approved_by,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(releaseId,`Release ${baselineLabel.replace('RR-','')}`,baselineId,'planned',null,null,input.actor,approvedAt),
    db.prepare("UPDATE source_artifacts SET status='baselined' WHERE id IN (SELECT DISTINCT source_id FROM source_candidates WHERE status='approved_for_baseline')"),
    db.prepare('INSERT INTO audit_events (id,entity_type,entity_id,aggregate_type,aggregate_id,action,actor,details_json,schema_version,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(makeId('AUD'),'baseline',baselineId,'baseline',baselineId,'source_baseline_approved',input.actor,JSON.stringify({ schemaVersion:1,changes:[{ field:'activeBaselineId',oldValue:active.id,newValue:baselineId }],references:{ releaseId,collectionId } }),1,approvedAt),
  );
  await db.batch(statements);
  return listSourceWorkspace(db);
}

export async function getCollectionsForEvidence(db:D1Database,itemIds:string[]):Promise<Array<{ targetId:string;path:string[];origin:'collection' }>> {
  if (itemIds.length === 0) return [];
  const placeholders = itemIds.map(() => '?').join(',');
  const memberships = await db.prepare(`SELECT collection_id AS collectionId,item_id AS itemId FROM collection_members WHERE collection_id IN (SELECT collection_id FROM collection_members WHERE item_id IN (${placeholders}))`).bind(...itemIds).all<{ collectionId:string;itemId:string }>();
  const anchorSet = new Set(itemIds); const results = new Map<string,{ targetId:string;path:string[];origin:'collection' }>();
  for (const member of memberships.results) if (!anchorSet.has(member.itemId)) results.set(member.itemId,{ targetId:member.itemId,path:itemIds,origin:'collection' });
  return [...results.values()];
}
