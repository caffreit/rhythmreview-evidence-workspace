import { z } from 'zod';
import { seed } from './data';
import { schemaStatements } from '@/db/runtime-schema';
import {
  ChangeIdSchema, ChangeStatusSchema, CheckScopeSchema, CreateChangeInputSchema, DocumentTemplateSchema, EvidenceIdSchema, EvidenceItemSchema,
  FindingDispositionInputSchema, GuidedReviewCompletionInputSchema, ImpactSuggestionSchema, RelationshipSchema, ReviewDecisionInputSchema,
  RunCoherenceCheckInputSchema, ScenarioIdSchema, type CreateChangeInput, type EvidenceId,
  type EvidenceItem, type GuidedReviewCompletionInput, type ImpactSuggestion, type ReviewDecisionInput, type UpdateDraftInput,
} from './domain';
import { runCoherenceChecks } from './coherence';
import { auditDetails } from './audit';
import { canEditDraft, nextChangeStatus } from './change-workflow';

const StringArraySchema = z.array(z.string());
const StoredMetricsSchema = z.object({
  manual:z.object({ recall:z.number(),precision:z.number(),minutes:z.number() }),
  chat:z.object({ recall:z.number(),precision:z.number(),minutes:z.number() }),
  structured:z.object({ recall:z.number(),precision:z.number(),minutes:z.number() }),
});

function parseJson(value:string): unknown { return JSON.parse(value); }
function now(): string { return new Date().toISOString(); }
function makeId(prefix:string): string { return `${prefix}-${crypto.randomUUID().slice(0,8).toUpperCase()}`; }

type AuditStatementArgs = {
  aggregateType:'change'|'baseline'; aggregateId:string; entityType:string; entityId:string; action:string; actor:string;
  details:ReturnType<typeof auditDetails>; createdAt:string;
};

function auditStatement(db:D1Database,args:AuditStatementArgs):D1PreparedStatement {
  return db.prepare('INSERT INTO audit_events (id,entity_type,entity_id,aggregate_type,aggregate_id,action,actor,details_json,schema_version,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(makeId('AUD'),args.entityType,args.entityId,args.aggregateType,args.aggregateId,args.action,args.actor,JSON.stringify(args.details),1,args.createdAt);
}

async function runBatches(db:D1Database, statements:D1PreparedStatement[], size = 60): Promise<void> {
  for (let index = 0; index < statements.length; index += size) await db.batch(statements.slice(index,index + size));
}

let workspaceInitialization:Promise<void>|null = null;

export function ensureWorkspace(db:D1Database): Promise<void> {
  workspaceInitialization ??= initializeWorkspace(db).catch((error:unknown) => {
    workspaceInitialization = null;
    throw error;
  });
  return workspaceInitialization;
}

async function initializeWorkspace(db:D1Database): Promise<void> {
  for (const sql of schemaStatements) {
    try { await db.prepare(sql).run(); }
    catch (error:unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (!sql.startsWith('ALTER TABLE') || !message.toLowerCase().includes('duplicate column')) throw error;
    }
  }
  await db.batch([
    db.prepare("UPDATE change_requests SET updated_at=created_at WHERE updated_at=''"),
    db.prepare("UPDATE change_requests SET current_analysis_run_id=(SELECT id FROM analysis_runs WHERE change_id=change_requests.id AND status='completed' ORDER BY created_at DESC LIMIT 1) WHERE current_analysis_run_id IS NULL"),
    db.prepare("UPDATE audit_events SET aggregate_type='change',aggregate_id=entity_id WHERE aggregate_id='' AND entity_type='change'"),
    db.prepare("UPDATE audit_events SET aggregate_type='change',aggregate_id=(SELECT r.change_id FROM impact_suggestions s JOIN analysis_runs r ON r.id=s.run_id WHERE s.id=audit_events.entity_id) WHERE aggregate_id='' AND entity_type='suggestion'"),
    db.prepare("UPDATE audit_events SET aggregate_type='change',aggregate_id=(SELECT change_id FROM proposed_updates WHERE id=audit_events.entity_id) WHERE aggregate_id='' AND entity_type='proposed_update'"),
  ]);
  const existing = await db.prepare('SELECT COUNT(*) AS count FROM baselines').first<{ count:number }>();
  if ((existing?.count ?? 0) > 0) return;

  const statements:D1PreparedStatement[] = [];
  statements.push(db.prepare('INSERT OR IGNORE INTO baselines (id,label,status,approved_by,approved_at) VALUES (?,?,?,?,?)').bind(seed.baseline.id,seed.baseline.label,seed.baseline.status,seed.baseline.approvedBy,seed.baseline.approvedAt));
  for (const item of seed.evidence) {
    statements.push(db.prepare('INSERT OR IGNORE INTO evidence_items (id,type,owner,criticality,jurisdictions_json,current_version_id) VALUES (?,?,?,?,?,?)').bind(item.id,item.type,item.owner,item.criticality,JSON.stringify(item.jurisdictions),item.versionId));
    statements.push(db.prepare('INSERT OR IGNORE INTO evidence_versions (id,item_id,version,title,statement,rationale,status,sources_json,flags_json,approved_by,approved_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(item.versionId,item.id,item.version,item.title,item.statement,item.rationale,item.status,JSON.stringify(item.sources),JSON.stringify(item.flags),item.approvedBy,item.approvedAt));
    statements.push(db.prepare('INSERT OR IGNORE INTO baseline_items (baseline_id,item_id,version_id) VALUES (?,?,?)').bind(seed.baseline.id,item.id,item.versionId));
  }
  for (const relation of seed.relationships) statements.push(db.prepare('INSERT OR IGNORE INTO relationships (id,source_id,target_id,type,baseline_id,active) VALUES (?,?,?,?,?,?)').bind(relation.id,relation.sourceId,relation.targetId,relation.type,relation.baselineId,relation.active ? 1 : 0));
  for (const document of seed.documents) statements.push(db.prepare('INSERT OR IGNORE INTO document_templates (id,code,title,description,types_json,exclude_flags_json) VALUES (?,?,?,?,?,?)').bind(document.id,document.code,document.title,document.description,JSON.stringify(document.types),JSON.stringify(document.excludeFlags ?? [])));
  for (const scenario of seed.scenarios) {
    statements.push(db.prepare('INSERT OR IGNORE INTO scenarios (id,number,slug,title,scale,anchor_id,proposed_text,rationale,presenter,non_impacts_json,drafts_json,metrics_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(scenario.id,scenario.number,scenario.slug,scenario.title,scenario.scale,scenario.anchorId,scenario.proposedText,scenario.rationale,scenario.presenter,JSON.stringify(scenario.nonImpacts),JSON.stringify(scenario.drafts),JSON.stringify(scenario.metrics)));
    for (const itemId of scenario.expected) {
      const item = seed.evidence.find((entry) => entry.id === itemId);
      const action = item?.type === 'test' ? 'retest' : item?.type === 'design' || item?.type === 'requirement' || item?.type === 'label' || item?.type === 'intended_use' ? 'update' : 'review';
      statements.push(db.prepare('INSERT OR IGNORE INTO ground_truth_impacts (scenario_id,item_id,critical,expected_action) VALUES (?,?,?,?)').bind(scenario.id,itemId,scenario.critical.includes(itemId) ? 1 : 0,action));
    }
  }
  for (const run of seed.replayRuns) statements.push(db.prepare('INSERT OR IGNORE INTO replay_runs (id,scenario_id,name,model,prompt_version,output_json) VALUES (?,?,?,?,?,?)').bind(run.id,run.scenarioId,run.name,run.model,run.promptVersion,JSON.stringify(run.suggestions)));
  await runBatches(db,statements);
}

interface EvidenceRow { id:string; version_id:string; version:string; type:string; title:string; statement:string; rationale:string; owner:string; criticality:string; jurisdictions_json:string; status:string; sources_json:string; flags_json:string; approved_by:string|null; approved_at:string|null }

function evidenceFromRow(row:EvidenceRow): EvidenceItem {
  return EvidenceItemSchema.parse({
    id:row.id, versionId:row.version_id, version:row.version, type:row.type, title:row.title, statement:row.statement,
    rationale:row.rationale, owner:row.owner, criticality:row.criticality,
    jurisdictions:StringArraySchema.parse(parseJson(row.jurisdictions_json)), status:row.status,
    sources:StringArraySchema.parse(parseJson(row.sources_json)), flags:StringArraySchema.parse(parseJson(row.flags_json)),
    approvedBy:row.approved_by, approvedAt:row.approved_at,
  });
}

async function getActiveBaseline(db:D1Database) {
  return db.prepare("SELECT id,label,status,approved_by AS approvedBy,approved_at AS approvedAt FROM baselines WHERE status='approved' ORDER BY approved_at DESC LIMIT 1").first<{ id:string; label:string; status:string; approvedBy:string; approvedAt:string }>();
}

function nextBaselineLabel(current:string):string {
  const match = /^(.*-)(\d+)\.(\d+)$/.exec(current);
  if (!match) return `${current}.1`;
  return `${match[1]}${match[2]}.${Number(match[3]) + 1}`;
}

async function listEvidenceForBaseline(db:D1Database,baselineId:string): Promise<EvidenceItem[]> {
  await ensureWorkspace(db);
  const result = await db.prepare(`SELECT i.id,v.id AS version_id,v.version,i.type,v.title,v.statement,v.rationale,i.owner,i.criticality,i.jurisdictions_json,v.status,v.sources_json,v.flags_json,v.approved_by,v.approved_at FROM baseline_items b JOIN evidence_items i ON i.id=b.item_id JOIN evidence_versions v ON v.id=b.version_id WHERE b.baseline_id=? ORDER BY i.id`).bind(baselineId).all<EvidenceRow>();
  return result.results.map(evidenceFromRow);
}

export async function listEvidence(db:D1Database): Promise<EvidenceItem[]> {
  await ensureWorkspace(db);
  const baseline = await getActiveBaseline(db);
  return baseline ? listEvidenceForBaseline(db,baseline.id) : [];
}

async function listRelationshipsForBaseline(db:D1Database,baselineId:string) {
  const result = await db.prepare('SELECT id,source_id AS sourceId,target_id AS targetId,type,baseline_id AS baselineId,active FROM relationships WHERE active=1 AND baseline_id=? ORDER BY id').bind(baselineId).all<{ id:string; sourceId:string; targetId:string; type:string; baselineId:string; active:number }>();
  return result.results.map((row) => RelationshipSchema.parse({ id:row.id,sourceId:row.sourceId,targetId:row.targetId,type:row.type,baselineId:row.baselineId,active:row.active === 1 }));
}

export async function listRelationships(db:D1Database) {
  await ensureWorkspace(db);
  const baseline = await getActiveBaseline(db);
  return baseline ? listRelationshipsForBaseline(db,baseline.id) : [];
}

export async function getEvidence(db:D1Database,id:string) {
  const evidence = await listEvidence(db);
  const parsedId = EvidenceIdSchema.parse(id);
  const item = evidence.find((entry) => entry.id === parsedId);
  if (!item) return null;
  const relationships = await listRelationships(db);
  const linked = relationships.filter((relation) => relation.sourceId === parsedId || relation.targetId === parsedId);
  const versions = await db.prepare('SELECT id AS versionId,version,title,statement,status,approved_by AS approvedBy,approved_at AS approvedAt FROM evidence_versions WHERE item_id=? ORDER BY version DESC').bind(parsedId).all<{ versionId:string; version:string; title:string; statement:string; status:string; approvedBy:string|null; approvedAt:string|null }>();
  return { item,relationships:linked,versions:versions.results };
}

export async function getOverview(db:D1Database) {
  const [evidence,relationships,documents,scenarios,baseline] = await Promise.all([
    listEvidence(db), listRelationships(db), listDocuments(db), listScenarios(db),
    getActiveBaseline(db),
  ]);
  let check = baseline ? await getLatestCoherenceCheck(db,{ kind:'baseline',baselineId:baseline.id }) : null;
  if (baseline && !check) check = await runCoherenceCheck(db,{ scope:{ kind:'baseline',baselineId:baseline.id },actor:'System' });
  const issues = check?.findings.filter((finding) => finding.ruleState === 'failing') ?? [];
  return {
    product:seed.product,baseline,evidenceCount:evidence.length,relationshipCount:relationships.length,documentCount:documents.length,issues,coherence:check,scenarios,
    checkSummary:{ total:issues.length,high:issues.filter((issue) => issue.severity === 'high' && issue.status === 'open').length,deterministic:issues.filter((issue) => issue.basis === 'deterministic_check').length,fixtures:issues.filter((issue) => issue.basis === 'evaluation_fixture').length,waived:issues.filter((issue) => issue.status === 'waived').length },
  };
}

interface DocumentRow { id:string; code:string; title:string; description:string; types_json:string; exclude_flags_json:string }
export async function listDocuments(db:D1Database) {
  await ensureWorkspace(db);
  const result = await db.prepare('SELECT id,code,title,description,types_json,exclude_flags_json FROM document_templates ORDER BY id').all<DocumentRow>();
  return result.results.map((row) => DocumentTemplateSchema.parse({ id:row.id,code:row.code,title:row.title,description:row.description,types:StringArraySchema.parse(parseJson(row.types_json)),excludeFlags:StringArraySchema.parse(parseJson(row.exclude_flags_json)) }));
}

export async function renderDocument(db:D1Database,id:string,requestedBaselineId?:string) {
  await ensureWorkspace(db);
  const baselines = await db.prepare("SELECT id,label,status,approved_by AS approvedBy,approved_at AS approvedAt FROM baselines WHERE status IN ('approved','superseded') ORDER BY approved_at DESC").all<{ id:string; label:string; status:string; approvedBy:string; approvedAt:string }>();
  const baseline = requestedBaselineId ? baselines.results.find((entry) => entry.id === requestedBaselineId) : baselines.results.find((entry) => entry.status === 'approved');
  const [documents,evidence] = await Promise.all([listDocuments(db),baseline ? listEvidenceForBaseline(db,baseline.id) : Promise.resolve([])]);
  const document = documents.find((entry) => entry.id === id);
  if (!document || !baseline) return null;
  const items = evidence.filter((item) => document.types.includes(item.type) && !item.flags.some((flag) => document.excludeFlags.includes(flag)));
  const snapshotId = `SNAP-${document.id}-${baseline.id}`;
  const renderedAt = now();
  await db.prepare('INSERT OR IGNORE INTO document_snapshots (id,document_id,baseline_id,source_versions_json,rendered_at) VALUES (?,?,?,?,?)').bind(snapshotId,document.id,baseline.id,JSON.stringify(items.map((item) => item.versionId)),renderedAt).run();
  const snapshot = await db.prepare('SELECT rendered_at AS renderedAt,source_versions_json AS sourceVersionsJson FROM document_snapshots WHERE id=?').bind(snapshotId).first<{ renderedAt:string; sourceVersionsJson:string }>();
  return { document,baseline,items,snapshotId,renderedAt:snapshot?.renderedAt ?? renderedAt,sourceVersionIds:StringArraySchema.parse(parseJson(snapshot?.sourceVersionsJson ?? '[]')),availableBaselines:baselines.results };
}

interface ScenarioRow { id:string; number:string; slug:string; title:string; scale:string; anchor_id:string; proposed_text:string; rationale:string; presenter:string; non_impacts_json:string; drafts_json:string; metrics_json:string }
export async function listScenarios(db:D1Database) {
  await ensureWorkspace(db);
  const result = await db.prepare('SELECT * FROM scenarios ORDER BY number').all<ScenarioRow>();
  return Promise.all(result.results.map(async (row) => {
    const truth = await db.prepare('SELECT item_id AS itemId,critical,expected_action AS expectedAction FROM ground_truth_impacts WHERE scenario_id=? ORDER BY item_id').bind(row.id).all<{ itemId:string; critical:number; expectedAction:string }>();
    return { id:ScenarioIdSchema.parse(row.id),number:row.number,slug:row.slug,title:row.title,scale:row.scale,anchorId:EvidenceIdSchema.parse(row.anchor_id),proposedText:row.proposed_text,rationale:row.rationale,presenter:row.presenter,nonImpacts:StringArraySchema.parse(parseJson(row.non_impacts_json)),drafts:z.array(z.object({ itemId:EvidenceIdSchema,text:z.string() })).parse(parseJson(row.drafts_json)),metrics:StoredMetricsSchema.parse(parseJson(row.metrics_json)),expectedCount:truth.results.length,criticalCount:truth.results.filter((entry) => entry.critical === 1).length,groundTruth:truth.results };
  }));
}

export async function getScenario(db:D1Database,id:string) {
  const parsed = ScenarioIdSchema.parse(id);
  return (await listScenarios(db)).find((scenario) => scenario.id === parsed) ?? null;
}

export async function listChanges(db:D1Database,rawLimit:string|null) {
  await ensureWorkspace(db);
  const parsedLimit = z.coerce.number().int().min(1).max(100).catch(20).parse(rawLimit ?? 20);
  const rows = await db.prepare(`SELECT c.id,c.scenario_id AS scenarioId,c.anchor_item_id AS anchorItemId,c.title,c.status,c.created_by AS createdBy,c.created_at AS createdAt,c.updated_at AS updatedAt,c.revision,
    r.mode AS currentAnalysisMode
    FROM change_requests c LEFT JOIN analysis_runs r ON r.id=c.current_analysis_run_id
    ORDER BY c.updated_at DESC,c.created_at DESC LIMIT ?`).bind(parsedLimit).all<{ id:string; scenarioId:string|null; anchorItemId:string; title:string; status:string; createdBy:string; createdAt:string; updatedAt:string; revision:number; currentAnalysisMode:string|null }>();
  return { changes:rows.results.map((row) => ({ ...row,anchorItemId:EvidenceIdSchema.parse(row.anchorItemId),status:ChangeStatusSchema.parse(row.status) })) };
}

export async function createChange(db:D1Database,raw:unknown) {
  await ensureWorkspace(db);
  const input:CreateChangeInput = CreateChangeInputSchema.parse(raw);
  const id = makeId('CHG'); const createdAt = now();
  await db.batch([
    db.prepare('INSERT INTO change_requests (id,scenario_id,anchor_item_id,title,rationale,proposed_text,status,created_by,created_at,updated_at,revision,current_analysis_run_id) VALUES (?,?,?,?,?,?,?,?,?,?,1,NULL)').bind(id,input.scenarioId ?? null,input.anchorItemId,input.title,input.rationale,input.proposedText,'draft',input.createdBy,createdAt,createdAt),
    auditStatement(db,{ aggregateType:'change',aggregateId:id,entityType:'change',entityId:id,action:'change_created',actor:input.createdBy,createdAt,details:auditDetails({
      changes:[{ field:'status',oldValue:null,newValue:'draft' }],references:{ anchorItemId:input.anchorItemId },
    }) }),
  ]);
  return getChange(db,id);
}

interface ChangeRow { id:string; scenario_id:string|null; anchor_item_id:string; title:string; rationale:string; proposed_text:string; status:string; created_by:string; created_at:string; updated_at:string; revision:number; current_analysis_run_id:string|null }
export async function getChange(db:D1Database,id:string) {
  await ensureWorkspace(db);
  const change = await db.prepare('SELECT * FROM change_requests WHERE id=?').bind(id).first<ChangeRow>();
  if (!change) return null;
  const history = await db.prepare('SELECT id,mode,model,prompt_version AS promptVersion,status,error,previous_run_id AS previousRunId,prior_change_status AS priorChangeStatus,created_at AS createdAt FROM analysis_runs WHERE change_id=? ORDER BY created_at DESC').bind(id).all<{ id:string; mode:string; model:string; promptVersion:string; status:string; error:string|null; previousRunId:string|null; priorChangeStatus:string|null; createdAt:string }>();
  const run = history.results.find((entry) => entry.id === change.current_analysis_run_id) ?? null;
  let suggestions:ImpactSuggestion[] = [];
  if (run) {
    const rows = await db.prepare('SELECT id,target_item_id AS targetId,action,origin,rationale,path_json AS pathJson,citations_json AS citationsJson,critical,decision FROM impact_suggestions WHERE run_id=? ORDER BY critical DESC,target_item_id').bind(run.id).all<{ id:string; targetId:string; action:string; origin:string; rationale:string; pathJson:string; citationsJson:string; critical:number; decision:string }>();
    const decisions = await db.prepare('SELECT d.suggestion_id AS suggestionId,d.decision,d.edited_action AS editedAction,d.reason,d.actor,d.created_at AS createdAt FROM review_decisions d JOIN impact_suggestions s ON s.id=d.suggestion_id WHERE s.run_id=? ORDER BY d.created_at DESC').bind(run.id).all<{ suggestionId:string; decision:string; editedAction:string|null; reason:string; actor:string; createdAt:string }>();
    const latestDecision = new Map<string,typeof decisions.results[number]>();
    for (const decision of decisions.results) if (!latestDecision.has(decision.suggestionId)) latestDecision.set(decision.suggestionId,decision);
    suggestions = rows.results.map((row) => {
      const decision = latestDecision.get(row.id);
      return ImpactSuggestionSchema.parse({
        id:row.id,targetId:row.targetId,action:row.action,origin:row.origin,rationale:row.rationale,
        path:StringArraySchema.parse(parseJson(row.pathJson)),citations:StringArraySchema.parse(parseJson(row.citationsJson)),
        critical:row.critical === 1,decision:decision?.decision ?? 'pending',effectiveAction:decision?.editedAction ?? row.action,
        decisionReason:decision?.reason,decidedBy:decision?.actor,decidedAt:decision?.createdAt,
      });
    });
  }
  const updates = await db.prepare('SELECT id,analysis_run_id AS analysisRunId,item_id AS itemId,from_version_id AS fromVersionId,to_version AS toVersion,original_text AS originalText,proposed_text AS proposedText,draft_origin AS draftOrigin,created_by AS createdBy,created_at AS createdAt,edited_by AS editedBy,edit_reason AS editReason,edited_at AS editedAt,status FROM proposed_updates WHERE change_id=? ORDER BY created_at,item_id').bind(id).all<{ id:string; analysisRunId:string; itemId:string; fromVersionId:string; toVersion:string; originalText:string; proposedText:string; draftOrigin:string; createdBy:string; createdAt:string; editedBy:string|null; editReason:string|null; editedAt:string|null; status:string }>();
  const audit = await db.prepare("SELECT id,entity_type AS entityType,entity_id AS entityId,aggregate_type AS aggregateType,aggregate_id AS aggregateId,action,actor,details_json AS detailsJson,schema_version AS schemaVersion,created_at AS createdAt FROM audit_events WHERE aggregate_type='change' AND aggregate_id=? ORDER BY created_at,id").bind(id).all<{ id:string; entityType:string; entityId:string; aggregateType:string; aggregateId:string; action:string; actor:string; detailsJson:string; schemaVersion:number; createdAt:string }>();
  const coherence = await getLatestCoherenceCheck(db,{ kind:'candidate',changeId:ChangeIdSchema.parse(change.id) });
  return {
    id:change.id,scenarioId:change.scenario_id,anchorItemId:EvidenceIdSchema.parse(change.anchor_item_id),title:change.title,rationale:change.rationale,proposedText:change.proposed_text,status:ChangeStatusSchema.parse(change.status),createdBy:change.created_by,createdAt:change.created_at,updatedAt:change.updated_at,revision:change.revision,
    run,analysisHistory:history.results,suggestions,updates:updates.results,
    audit:audit.results.map((event) => ({ ...event,details:parseJson(event.detailsJson) })),coherence,
  };
}

export async function beginAnalysis(db:D1Database,args:{ changeId:string; mode:'replay'|'live'; actor:string; reopen:boolean; reason?:string }) {
  const { changeId } = args;
  const change = await getChange(db,changeId);
  if (!change) return null;
  const command = args.reopen ? 'reopen_analysis' : 'start_analysis';
  const nextStatus = nextChangeStatus(change.status,command);
  if (nextStatus !== 'analysing') return null;
  const runId = makeId('RUN'); const createdAt = now();
  const action = args.reopen ? 'analysis_reopened' : 'analysis_started';
  const details = auditDetails({ reason:args.reason,changes:[{ field:'status',oldValue:change.status,newValue:nextStatus }],references:{ runId,mode:args.mode,...(change.run ? { previousRunId:change.run.id } : {}) } });
  const results = await db.batch([
    db.prepare(`INSERT INTO analysis_runs (id,change_id,mode,model,prompt_version,status,output_json,error,previous_run_id,prior_change_status,created_at)
      SELECT ?,?,?,?,?,?,?,?,?,?,? FROM change_requests WHERE id=? AND status=?`).bind(runId,changeId,args.mode,'pending','pending','running',null,null,change.run?.id ?? null,change.status,createdAt,changeId,change.status),
    db.prepare("UPDATE change_requests SET status='analysing',updated_at=? WHERE id=? AND status=?").bind(createdAt,changeId,change.status),
    db.prepare(`INSERT INTO audit_events (id,entity_type,entity_id,aggregate_type,aggregate_id,action,actor,details_json,schema_version,created_at)
      SELECT ?,'analysis_run',?,'change',?,?,?,?,1,? FROM analysis_runs WHERE id=?`).bind(makeId('AUD'),runId,changeId,action,args.actor,JSON.stringify(details),createdAt,runId),
  ]);
  if ((results[1]?.meta.changes ?? 0) !== 1) return null;
  return { change,runId };
}

export async function saveAnalysis(db:D1Database,args:{ changeId:string; runId:string; mode:'replay'|'live'; model:string; promptVersion:string; suggestions:ImpactSuggestion[]; error?:string }) {
  const running = await db.prepare(`SELECT r.previous_run_id AS previousRunId,r.prior_change_status AS priorChangeStatus,r.status,c.status AS changeStatus
    FROM analysis_runs r JOIN change_requests c ON c.id=r.change_id WHERE r.id=? AND r.change_id=?`).bind(args.runId,args.changeId).first<{ previousRunId:string|null; priorChangeStatus:string; status:string; changeStatus:string }>();
  if (!running || running.status !== 'running' || running.changeStatus !== 'analysing') return null;
  const createdAt = now();
  if (args.error) {
    const restoredStatus = ChangeStatusSchema.parse(running.priorChangeStatus);
    const details = auditDetails({ changes:[{ field:'status',oldValue:'analysing',newValue:restoredStatus }],references:{ runId:args.runId,mode:args.mode,model:args.model },reason:args.error });
    await db.batch([
      db.prepare("UPDATE analysis_runs SET status='failed',model=?,prompt_version=?,output_json='[]',error=? WHERE id=? AND status='running'").bind(args.model,args.promptVersion,args.error,args.runId),
      db.prepare('UPDATE change_requests SET status=?,updated_at=? WHERE id=? AND status=\'analysing\'').bind(restoredStatus,createdAt,args.changeId),
      auditStatement(db,{ aggregateType:'change',aggregateId:args.changeId,entityType:'analysis_run',entityId:args.runId,action:'analysis_failed',actor:'System',createdAt,details }),
    ]);
    return getChange(db,args.changeId);
  }

  const details = auditDetails({ changes:[{ field:'status',oldValue:'analysing',newValue:'ready_for_review' },{ field:'currentAnalysisRunId',oldValue:running.previousRunId,newValue:args.runId }],references:{ runId:args.runId,mode:args.mode,model:args.model,suggestionCount:String(args.suggestions.length) } });
  const statements:D1PreparedStatement[] = [];
  if (running.previousRunId) {
    statements.push(db.prepare("UPDATE analysis_runs SET status='superseded' WHERE id=? AND status='completed'").bind(running.previousRunId));
    statements.push(db.prepare("UPDATE proposed_updates SET status='superseded' WHERE change_id=? AND status IN ('proposed','discarded')").bind(args.changeId));
  }
  statements.push(db.prepare("UPDATE analysis_runs SET status='completed',model=?,prompt_version=?,output_json=?,error=NULL WHERE id=? AND status='running'").bind(args.model,args.promptVersion,JSON.stringify(args.suggestions),args.runId));
  for (const suggestion of args.suggestions) statements.push(db.prepare('INSERT INTO impact_suggestions (id,run_id,target_item_id,action,origin,rationale,path_json,citations_json,critical,decision) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(`${args.runId}-${suggestion.id}`,args.runId,suggestion.targetId,suggestion.action,suggestion.origin,suggestion.rationale,JSON.stringify(suggestion.path),JSON.stringify(suggestion.citations),suggestion.critical ? 1 : 0,'pending'));
  statements.push(db.prepare("UPDATE change_requests SET status='ready_for_review',current_analysis_run_id=?,updated_at=?,revision=revision+? WHERE id=? AND status='analysing'").bind(args.runId,createdAt,running.previousRunId ? 1 : 0,args.changeId));
  statements.push(auditStatement(db,{ aggregateType:'change',aggregateId:args.changeId,entityType:'analysis_run',entityId:args.runId,action:'analysis_completed',actor:'System',createdAt,details }));
  await runBatches(db,statements);
  return getChange(db,args.changeId);
}

export async function loadReplaySuggestions(db:D1Database,scenarioId:string): Promise<{ model:string; promptVersion:string; suggestions:ImpactSuggestion[] } | null> {
  const parsed = ScenarioIdSchema.parse(scenarioId);
  const row = await db.prepare('SELECT model,prompt_version AS promptVersion,output_json AS outputJson FROM replay_runs WHERE scenario_id=?').bind(parsed).first<{ model:string; promptVersion:string; outputJson:string }>();
  if (!row) return null;
  return { model:row.model,promptVersion:row.promptVersion,suggestions:z.array(ImpactSuggestionSchema).parse(parseJson(row.outputJson)) };
}

export async function recordDecision(db:D1Database,suggestionId:string,raw:unknown) {
  const input:ReviewDecisionInput = ReviewDecisionInputSchema.parse(raw);
  const suggestion = await db.prepare('SELECT id,run_id AS runId,action FROM impact_suggestions WHERE id=?').bind(suggestionId).first<{ id:string; runId:string; action:string }>();
  if (!suggestion) return null;
  const run = await db.prepare('SELECT r.change_id AS changeId,c.status AS changeStatus,c.current_analysis_run_id AS currentRunId FROM analysis_runs r JOIN change_requests c ON c.id=r.change_id WHERE r.id=?').bind(suggestion.runId).first<{ changeId:string; changeStatus:string; currentRunId:string|null }>();
  if (!run) return null;
  const changeStatus = ChangeStatusSchema.parse(run.changeStatus);
  const nextStatus = nextChangeStatus(changeStatus,'record_decision');
  if (!nextStatus || run.currentRunId !== suggestion.runId) return null;
  const previous = await db.prepare('SELECT decision,edited_action AS editedAction,reason FROM review_decisions WHERE suggestion_id=? ORDER BY created_at DESC,id DESC LIMIT 1').bind(suggestionId).first<{ decision:string; editedAction:string|null; reason:string }>();
  const createdAt = now();
  const effectiveAction = input.editedAction ?? suggestion.action;
  const previousEffectiveAction = previous?.editedAction ?? suggestion.action;
  const details = auditDetails({ reason:input.reason,changes:[
    { field:'decision',oldValue:previous?.decision ?? 'pending',newValue:input.decision },
    { field:'effectiveAction',oldValue:previousEffectiveAction,newValue:effectiveAction },
    { field:'reason',oldValue:previous?.reason ?? null,newValue:input.reason },
    ...(changeStatus !== nextStatus ? [{ field:'status',oldValue:changeStatus,newValue:nextStatus }] : []),
  ],references:{ suggestionId,runId:suggestion.runId } });
  await db.batch([
    db.prepare('INSERT INTO review_decisions (id,suggestion_id,decision,edited_action,reason,actor,created_at) VALUES (?,?,?,?,?,?,?)').bind(makeId('DEC'),suggestionId,input.decision,input.editedAction ?? null,input.reason,input.actor,createdAt),
    db.prepare('UPDATE change_requests SET status=?,updated_at=? WHERE id=? AND status=? AND current_analysis_run_id=?').bind(nextStatus,createdAt,run.changeId,changeStatus,suggestion.runId),
    auditStatement(db,{ aggregateType:'change',aggregateId:run.changeId,entityType:'suggestion',entityId:suggestionId,action:`suggestion_${input.decision}`,actor:input.actor,createdAt,details }),
  ]);
  return getChange(db,run.changeId);
}

export async function completeGuidedReview(db:D1Database,changeId:string,raw:unknown) {
  const input:GuidedReviewCompletionInput = GuidedReviewCompletionInputSchema.parse(raw);
  const change = await getChange(db,changeId);
  if (!change || change.scenarioId !== 'SCN-002' || change.run?.mode !== 'replay' || change.status !== 'under_review') return null;

  const req004 = change.suggestions.find((suggestion) => suggestion.targetId === 'REQ-004');
  const test007 = change.suggestions.find((suggestion) => suggestion.targetId === 'TEST-007');
  const un004 = change.suggestions.find((suggestion) => suggestion.targetId === 'UN-004');
  const test007Rejected = change.audit.some((event) => event.entityId === test007?.id && event.action === 'suggestion_rejected');
  const manualExamplesComplete = req004?.decision === 'accepted'
    && test007?.decision === 'accepted'
    && test007Rejected
    && un004?.decision === 'edited'
    && un004.effectiveAction === 'update';
  const pending = change.suggestions.filter((suggestion) => suggestion.decision === 'pending');
  if (!manualExamplesComplete || pending.length === 0 || !change.run) return null;

  const createdAt = now();
  const reason = 'Guided replay fixture: accepted to complete the saved walkthrough after the presenter recorded the required QA examples.';
  const statements:D1PreparedStatement[] = [];
  for (const suggestion of pending) {
    statements.push(
      db.prepare('INSERT INTO review_decisions (id,suggestion_id,decision,edited_action,reason,actor,created_at) VALUES (?,?,?,?,?,?,?)')
        .bind(makeId('DEC'),suggestion.id,'accepted',null,reason,input.actor,createdAt),
      auditStatement(db,{
        aggregateType:'change',aggregateId:change.id,entityType:'suggestion',entityId:suggestion.id,action:'suggestion_accepted',actor:input.actor,createdAt,
        details:auditDetails({
          reason,
          changes:[
            { field:'decision',oldValue:'pending',newValue:'accepted' },
            { field:'effectiveAction',oldValue:suggestion.action,newValue:suggestion.action },
            { field:'reason',oldValue:null,newValue:reason },
          ],
          references:{ suggestionId:suggestion.id,runId:change.run.id,completionMode:'guided_replay_fixture' },
        }),
      }),
    );
  }
  statements.push(db.prepare('UPDATE change_requests SET updated_at=? WHERE id=? AND status=? AND current_analysis_run_id=?')
    .bind(createdAt,change.id,'under_review',change.run.id));
  await db.batch(statements);
  return getChange(db,change.id);
}

function draftText(item:EvidenceItem,change:{ anchorItemId:EvidenceId; proposedText:string },scenarioDrafts:Map<string,string>): string {
  if (scenarioDrafts.has(item.id)) return scenarioDrafts.get(item.id) ?? item.statement;
  if (item.id === change.anchorItemId) return change.proposedText;
  return `${item.statement}\n\nAuthor drafting prompt: revise this item against ${change.anchorItemId} before QA submission.`;
}

export async function draftUpdates(db:D1Database,changeId:string,actor:string) {
  const [change,evidence] = await Promise.all([getChange(db,changeId),listEvidence(db)]);
  if (!change || !nextChangeStatus(change.status,'draft_updates') || change.suggestions.some((suggestion) => suggestion.decision === 'pending')) return null;
  const scenario = change.scenarioId ? await getScenario(db,change.scenarioId) : null;
  const scenarioDrafts = new Map((scenario?.drafts ?? []).map((draft) => [draft.itemId,draft.text]));
  const accepted = change.suggestions.filter((suggestion) => suggestion.decision === 'accepted' || suggestion.decision === 'edited').filter((suggestion) => suggestion.effectiveAction === 'update' || suggestion.effectiveAction === 'retest');
  if (accepted.length === 0) return null;
  const runMode = change.run?.mode;
  const draftOrigin = scenarioDrafts.size > 0 ? 'guided_replay_fixture' : runMode === 'live' ? 'author_template_after_live_analysis' : 'author_template';
  const createdAt = now();
  const statements:D1PreparedStatement[] = [];
  for (const suggestion of accepted) {
    const item = evidence.find((entry) => entry.id === suggestion.targetId);
    if (!item) continue;
    const text = draftText(item,change,scenarioDrafts);
    statements.push(db.prepare('INSERT INTO proposed_updates (id,change_id,analysis_run_id,item_id,from_version_id,to_version,original_text,proposed_text,draft_origin,created_by,created_at,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(makeId('UPD'),changeId,change.run?.id ?? '',item.id,item.versionId,'1.1',text,text,draftOrigin,actor,createdAt,'proposed'));
  }
  statements.push(db.prepare("UPDATE change_requests SET status='updates_proposed',updated_at=?,revision=revision+1 WHERE id=? AND status IN ('ready_for_review','under_review')").bind(createdAt,changeId));
  statements.push(auditStatement(db,{ aggregateType:'change',aggregateId:changeId,entityType:'change',entityId:changeId,action:'updates_drafted',actor,createdAt,details:auditDetails({
    changes:[{ field:'status',oldValue:change.status,newValue:'updates_proposed' },{ field:'revision',oldValue:change.revision,newValue:change.revision + 1 }],references:{ count:String(accepted.length),runId:change.run?.id ?? '' },
  }) }));
  await runBatches(db,statements);
  return getChange(db,changeId);
}

export async function updateDraft(db:D1Database,updateId:string,input:UpdateDraftInput) {
  const row = await db.prepare('SELECT u.id,u.change_id AS changeId,u.proposed_text AS proposedText,u.status,c.status AS changeStatus,c.revision FROM proposed_updates u JOIN change_requests c ON c.id=u.change_id WHERE u.id=?').bind(updateId).first<{ id:string; changeId:string; proposedText:string; status:string; changeStatus:string; revision:number }>();
  if (!row) return null;
  const changeStatus = ChangeStatusSchema.parse(row.changeStatus);
  if (!canEditDraft(changeStatus) || row.status === 'superseded' || row.status === 'approved') return null;
  const editedAt = now();
  const nextRevision = row.revision + 1;
  if (input.operation === 'save') {
    if (row.status !== 'proposed') return null;
    await db.batch([
      db.prepare("UPDATE proposed_updates SET proposed_text=?,edited_by=?,edit_reason=?,edited_at=? WHERE id=? AND status='proposed'").bind(input.proposedText,input.actor,input.reason,editedAt,updateId),
      db.prepare('UPDATE change_requests SET updated_at=?,revision=revision+1 WHERE id=? AND status=?').bind(editedAt,row.changeId,changeStatus),
      auditStatement(db,{ aggregateType:'change',aggregateId:row.changeId,entityType:'proposed_update',entityId:updateId,action:'draft_edited',actor:input.actor,createdAt:editedAt,details:auditDetails({ reason:input.reason,changes:[{ field:'proposedText',oldValue:row.proposedText,newValue:input.proposedText },{ field:'revision',oldValue:row.revision,newValue:nextRevision }],references:{ updateId } }) }),
    ]);
  } else if (input.operation === 'discard') {
    if (row.status !== 'proposed') return null;
    await db.batch([
      db.prepare("UPDATE proposed_updates SET status='discarded',edited_by=?,edit_reason=?,edited_at=? WHERE id=? AND status='proposed'").bind(input.actor,input.reason,editedAt,updateId),
      db.prepare('UPDATE change_requests SET updated_at=?,revision=revision+1 WHERE id=? AND status=?').bind(editedAt,row.changeId,changeStatus),
      auditStatement(db,{ aggregateType:'change',aggregateId:row.changeId,entityType:'proposed_update',entityId:updateId,action:'draft_discarded',actor:input.actor,createdAt:editedAt,details:auditDetails({ reason:input.reason,changes:[{ field:'status',oldValue:'proposed',newValue:'discarded' },{ field:'revision',oldValue:row.revision,newValue:nextRevision }],references:{ updateId } }) }),
    ]);
  } else {
    if (row.status !== 'discarded') return null;
    await db.batch([
      db.prepare("UPDATE proposed_updates SET status='proposed',edited_by=?,edit_reason=?,edited_at=? WHERE id=? AND status='discarded'").bind(input.actor,input.reason,editedAt,updateId),
      db.prepare('UPDATE change_requests SET updated_at=?,revision=revision+1 WHERE id=? AND status=?').bind(editedAt,row.changeId,changeStatus),
      auditStatement(db,{ aggregateType:'change',aggregateId:row.changeId,entityType:'proposed_update',entityId:updateId,action:'draft_restored',actor:input.actor,createdAt:editedAt,details:auditDetails({ reason:input.reason,changes:[{ field:'status',oldValue:'discarded',newValue:'proposed' },{ field:'revision',oldValue:row.revision,newValue:nextRevision }],references:{ updateId } }) }),
    ]);
  }
  return getChange(db,row.changeId);
}

export async function submitForQa(db:D1Database,changeId:string,actor:string) {
  const change = await getChange(db,changeId);
  const activeUpdates = change?.updates.filter((update) => update.status === 'proposed') ?? [];
  if (!change || !nextChangeStatus(change.status,'submit') || activeUpdates.length === 0) return null;
  const createdAt = now();
  await db.batch([
    db.prepare("UPDATE change_requests SET status='qa_review',updated_at=? WHERE id=? AND status=?").bind(createdAt,changeId,change.status),
    auditStatement(db,{ aggregateType:'change',aggregateId:changeId,entityType:'change',entityId:changeId,action:'candidate_submitted',actor,createdAt,details:auditDetails({ changes:[{ field:'status',oldValue:change.status,newValue:'qa_review' }],references:{ count:String(activeUpdates.length) } }) }),
  ]);
  return getChange(db,changeId);
}

export async function returnToAuthor(db:D1Database,changeId:string,actor:string,reason:string) {
  const change = await getChange(db,changeId);
  if (!change || nextChangeStatus(change.status,'return_to_author') !== 'returned_to_author') return null;
  const createdAt = now();
  const results = await db.batch([
    db.prepare("UPDATE change_requests SET status='returned_to_author',updated_at=? WHERE id=? AND status='qa_review'").bind(createdAt,changeId),
    auditStatement(db,{ aggregateType:'change',aggregateId:changeId,entityType:'change',entityId:changeId,action:'returned_to_author',actor,createdAt,details:auditDetails({ reason,changes:[{ field:'status',oldValue:'qa_review',newValue:'returned_to_author' }] }) }),
  ]);
  if ((results[0]?.meta.changes ?? 0) !== 1) return null;
  return getChange(db,changeId);
}

export async function approveChange(db:D1Database,changeId:string,actor:string) {
  const change = await getChange(db,changeId);
  if (!change || nextChangeStatus(change.status,'approve') !== 'approved' || change.createdBy === actor) return null;
  const activeBaseline = await getActiveBaseline(db);
  if (!activeBaseline) return null;
  const approvedAt = now(); const baselineLabel = nextBaselineLabel(activeBaseline.label); const baselineId = `BL-${baselineLabel}-${changeId.slice(-4)}`;
  const [evidence,relationships] = await Promise.all([listEvidence(db),listRelationships(db)]);
  const updateByItem = new Map(change.updates.filter((update) => update.status === 'proposed').map((update) => [update.itemId,update]));
  if (updateByItem.size === 0) return null;
  const oldMembership = evidence.map((item) => ({ itemId:item.id,versionId:item.versionId }));
  const newMembership = evidence.map((item) => ({ itemId:item.id,versionId:updateByItem.has(item.id) ? `${item.id}-v1.1-${changeId.slice(-4)}` : item.versionId }));
  const staged:D1PreparedStatement[] = [db.prepare("INSERT OR IGNORE INTO baselines (id,label,status,approved_by,approved_at) VALUES (?,?,?,?,?)").bind(baselineId,baselineLabel,'candidate',null,null)];
  for (const item of evidence) {
    const update = updateByItem.get(item.id);
    if (!update) { staged.push(db.prepare('INSERT OR IGNORE INTO baseline_items (baseline_id,item_id,version_id) VALUES (?,?,?)').bind(baselineId,item.id,item.versionId)); continue; }
    const versionId = `${item.id}-v1.1-${changeId.slice(-4)}`;
    staged.push(db.prepare('INSERT OR IGNORE INTO evidence_versions (id,item_id,version,title,statement,rationale,status,sources_json,flags_json,approved_by,approved_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(versionId,item.id,'1.1',item.title,update.proposedText,`Candidate from ${changeId}; QA approval pending.`,'proposed',JSON.stringify(item.sources),JSON.stringify(item.flags),null,null));
    staged.push(db.prepare('INSERT OR IGNORE INTO baseline_items (baseline_id,item_id,version_id) VALUES (?,?,?)').bind(baselineId,item.id,versionId));
  }
  for (const relation of relationships) staged.push(db.prepare('INSERT OR IGNORE INTO relationships (id,source_id,target_id,type,baseline_id,active) VALUES (?,?,?,?,?,1)').bind(`${relation.id}-${changeId.slice(-4)}`,relation.sourceId,relation.targetId,relation.type,baselineId));
  await runBatches(db,staged);

  const finalize:D1PreparedStatement[] = [];
  for (const [itemId,update] of updateByItem) {
    const versionId = `${itemId}-v1.1-${changeId.slice(-4)}`;
    finalize.push(db.prepare("UPDATE evidence_versions SET status='approved',rationale=?,approved_by=?,approved_at=? WHERE id=?").bind(`Approved through ${changeId}: ${change.rationale}`,actor,approvedAt,versionId));
    finalize.push(db.prepare('UPDATE evidence_items SET current_version_id=? WHERE id=?').bind(versionId,itemId));
    finalize.push(db.prepare("UPDATE proposed_updates SET status='approved' WHERE id=?").bind(update.id));
  }
  finalize.push(db.prepare("UPDATE baselines SET status='superseded' WHERE status='approved'"));
  finalize.push(db.prepare("UPDATE baselines SET status='approved',approved_by=?,approved_at=? WHERE id=?").bind(actor,approvedAt,baselineId));
  finalize.push(db.prepare("UPDATE change_requests SET status='approved',updated_at=? WHERE id=? AND status='qa_review'").bind(approvedAt,changeId));
  finalize.push(auditStatement(db,{ aggregateType:'change',aggregateId:changeId,entityType:'baseline',entityId:baselineId,action:'baseline_approved',actor,createdAt:approvedAt,details:auditDetails({ changes:[
    { field:'status',oldValue:'qa_review',newValue:'approved' },
    { field:'activeBaselineId',oldValue:activeBaseline.id,newValue:baselineId },
    { field:'baselineItems',oldValue:oldMembership,newValue:newMembership },
    { field:'proposedUpdateStatuses',oldValue:[...updateByItem.values()].map((update) => ({ id:update.id,status:'proposed' })),newValue:[...updateByItem.values()].map((update) => ({ id:update.id,status:'approved' })) },
  ],references:{ baselineId,baselineLabel } }) }));
  await db.batch(finalize);
  return { change:await getChange(db,changeId),baselineId };
}

export async function resetWorkspace(db:D1Database) {
  await ensureWorkspace(db);
  const statements = [
    "DELETE FROM finding_dispositions","DELETE FROM coherence_check_results","DELETE FROM coherence_check_runs","DELETE FROM review_decisions","DELETE FROM impact_suggestions","DELETE FROM analysis_runs","DELETE FROM proposed_updates","DELETE FROM change_requests","DELETE FROM audit_events","DELETE FROM embeddings","DELETE FROM document_snapshots",
    "DELETE FROM relationships WHERE baseline_id != 'BL-RR-1.0'","DELETE FROM baseline_items WHERE baseline_id != 'BL-RR-1.0'","DELETE FROM baselines WHERE id != 'BL-RR-1.0'","DELETE FROM evidence_versions WHERE version != '1.0'",
    "UPDATE evidence_items SET current_version_id = id || '-v1.0'","UPDATE baselines SET status='approved',approved_by='Jamie Chen · QA reviewer',approved_at='2026-08-14T10:00:00.000Z' WHERE id='BL-RR-1.0'",
  ];
  await runBatches(db,statements.map((sql) => db.prepare(sql)),20);
  const fixtureUpdates:D1PreparedStatement[] = [];
  for (const scenario of seed.scenarios) fixtureUpdates.push(db.prepare('UPDATE scenarios SET proposed_text=?,rationale=?,presenter=?,non_impacts_json=?,drafts_json=?,metrics_json=? WHERE id=?').bind(scenario.proposedText,scenario.rationale,scenario.presenter,JSON.stringify(scenario.nonImpacts),JSON.stringify(scenario.drafts),JSON.stringify(scenario.metrics),scenario.id));
  for (const run of seed.replayRuns) fixtureUpdates.push(db.prepare('UPDATE replay_runs SET name=?,model=?,prompt_version=?,output_json=? WHERE id=?').bind(run.name,run.model,run.promptVersion,JSON.stringify(run.suggestions),run.id));
  await runBatches(db,fixtureUpdates,20);
  return getOverview(db);
}

type CheckRunRow = { id:string; scopeKind:'baseline'|'candidate'; scopeId:string; baselineId:string; changeId:string|null; candidateRevision:number|null; status:string; actor:string; createdAt:string };
type CheckResultRow = { findingId:string; fingerprint:string; itemId:string; code:string; severity:'high'|'medium'; title:string; detail:string; basis:'deterministic_check'|'evaluation_fixture'; rule:string; expected:string; actual:string };
type CheckFindingView = CheckResultRow & { id:string; ruleState:'failing'|'cleared'; disposition:'none'|'waived'; status:'open'|'waived'|'resolved'; waiver:{ reason:string; actor:string; createdAt:string }|null };

async function checkRunView(db:D1Database,run:CheckRunRow) {
  const results = await db.prepare(`SELECT finding_id AS findingId,fingerprint,item_id AS itemId,code,severity,title,detail,basis,rule,expected,actual
    FROM coherence_check_results WHERE run_id=? ORDER BY code`).bind(run.id).all<CheckResultRow>();
  const dispositions = await db.prepare(`SELECT finding_id AS findingId,fingerprint,action,reason,actor,created_at AS createdAt
    FROM finding_dispositions WHERE scope_kind=? AND scope_id=? ORDER BY created_at DESC,id DESC`).bind(run.scopeKind,run.scopeId).all<{ findingId:string; fingerprint:string; action:string; reason:string; actor:string; createdAt:string }>();
  const latestDisposition = new Map<string,typeof dispositions.results[number]>();
  for (const disposition of dispositions.results) {
    const key = `${disposition.findingId}|${disposition.fingerprint}`;
    if (!latestDisposition.has(key)) latestDisposition.set(key,disposition);
  }
  const findings:CheckFindingView[] = results.results.map((finding) => {
    const disposition = latestDisposition.get(`${finding.findingId}|${finding.fingerprint}`);
    const waived = disposition?.action === 'waived';
    return { id:finding.findingId,...finding,ruleState:'failing' as const,disposition:waived ? 'waived' as const : 'none' as const,status:waived ? 'waived' as const : 'open' as const,waiver:waived ? { reason:disposition.reason,actor:disposition.actor,createdAt:disposition.createdAt } : null };
  });
  const previous = await db.prepare(`SELECT id FROM coherence_check_runs WHERE scope_kind=? AND scope_id=? AND id!=? AND created_at<=? ORDER BY created_at DESC,id DESC LIMIT 1`).bind(run.scopeKind,run.scopeId,run.id,run.createdAt).first<{ id:string }>();
  if (previous) {
    const previousResults = await db.prepare(`SELECT finding_id AS findingId,fingerprint,item_id AS itemId,code,severity,title,detail,basis,rule,expected,actual
      FROM coherence_check_results WHERE run_id=? ORDER BY code`).bind(previous.id).all<CheckResultRow>();
    const currentIds = new Set(results.results.map((finding) => finding.findingId));
    for (const finding of previousResults.results.filter((entry) => !currentIds.has(entry.findingId))) findings.push({ id:finding.findingId,...finding,ruleState:'cleared',disposition:'none',status:'resolved',waiver:null });
  }
  let stale = false;
  if (run.scopeKind === 'candidate') {
    const change = await db.prepare('SELECT revision FROM change_requests WHERE id=?').bind(run.scopeId).first<{ revision:number }>();
    stale = !change || change.revision !== run.candidateRevision;
  }
  return { ...run,scope:{ kind:run.scopeKind,...(run.scopeKind === 'baseline' ? { baselineId:run.scopeId } : { changeId:run.scopeId }) },stale,findings:findings.sort((left,right) => left.code.localeCompare(right.code)) };
}

export async function getLatestCoherenceCheck(db:D1Database,rawScope:unknown) {
  await ensureWorkspace(db);
  const scope = CheckScopeSchema.parse(rawScope);
  const run = await db.prepare(`SELECT id,scope_kind AS scopeKind,scope_id AS scopeId,baseline_id AS baselineId,change_id AS changeId,candidate_revision AS candidateRevision,status,actor,created_at AS createdAt
    FROM coherence_check_runs WHERE scope_kind=? AND scope_id=? ORDER BY created_at DESC,id DESC LIMIT 1`).bind(scope.kind,scope.kind === 'baseline' ? scope.baselineId : scope.changeId).first<CheckRunRow>();
  return run ? checkRunView(db,run) : null;
}

async function projectedCandidateEvidence(db:D1Database,changeId:string) {
  const change = await db.prepare('SELECT anchor_item_id AS anchorItemId,proposed_text AS proposedText,revision FROM change_requests WHERE id=?').bind(changeId).first<{ anchorItemId:string; proposedText:string; revision:number }>();
  const baseline = await getActiveBaseline(db);
  if (!change || !baseline) return null;
  const evidence = await listEvidenceForBaseline(db,baseline.id);
  const updates = await db.prepare("SELECT item_id AS itemId,proposed_text AS proposedText FROM proposed_updates WHERE change_id=? AND status='proposed'").bind(changeId).all<{ itemId:string; proposedText:string }>();
  const overlay = new Map<string,string>([[change.anchorItemId,change.proposedText],...updates.results.map((entry) => [entry.itemId,entry.proposedText] as [string,string])]);
  return {
    baseline,revision:change.revision,
    evidence:evidence.map((item) => overlay.has(item.id) ? { ...item,versionId:`CAND-${changeId}-${change.revision}-${item.id}`,statement:overlay.get(item.id) ?? item.statement,status:'proposed' as const,approvedBy:null,approvedAt:null } : item),
  };
}

export async function runCoherenceCheck(db:D1Database,raw:unknown) {
  await ensureWorkspace(db);
  const input = RunCoherenceCheckInputSchema.parse(raw);
  const documents = await listDocuments(db);
  let baselineId:string; let changeId:string|null; let candidateRevision:number|null; let evidence:EvidenceItem[];
  if (input.scope.kind === 'baseline') {
    const baseline = await db.prepare('SELECT id FROM baselines WHERE id=?').bind(input.scope.baselineId).first<{ id:string }>();
    if (!baseline) return null;
    baselineId = baseline.id; changeId = null; candidateRevision = null; evidence = await listEvidenceForBaseline(db,baseline.id);
  } else {
    const projected = await projectedCandidateEvidence(db,input.scope.changeId);
    if (!projected) return null;
    baselineId = projected.baseline.id; changeId = input.scope.changeId; candidateRevision = projected.revision; evidence = projected.evidence;
  }
  const relationships = await listRelationshipsForBaseline(db,baselineId);
  const findings = runCoherenceChecks({ evidence,relationships,documents });
  const scopeId = input.scope.kind === 'baseline' ? input.scope.baselineId : input.scope.changeId;
  const previous = await getLatestCoherenceCheck(db,input.scope);
  const previousFailing = new Set(previous?.findings.filter((finding) => finding.ruleState === 'failing').map((finding) => finding.id) ?? []);
  const currentIds = new Set(findings.map((finding) => finding.id));
  const cleared = [...previousFailing].filter((id) => !currentIds.has(id));
  const runId = makeId('CHK'); const createdAt = now();
  const statements:D1PreparedStatement[] = [db.prepare(`INSERT INTO coherence_check_runs (id,scope_kind,scope_id,baseline_id,change_id,candidate_revision,status,actor,created_at)
    VALUES (?,?,?,?,?,?,'completed',?,?)`).bind(runId,input.scope.kind,scopeId,baselineId,changeId,candidateRevision,input.actor,createdAt)];
  for (const finding of findings) statements.push(db.prepare(`INSERT INTO coherence_check_results (run_id,finding_id,fingerprint,item_id,code,severity,title,detail,basis,rule,expected,actual)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(runId,finding.id,finding.fingerprint,finding.itemId,finding.code,finding.severity,finding.title,finding.detail,finding.basis,finding.rule,finding.expected,finding.actual));
  const details = auditDetails({ changes:[{ field:'failingFindingCount',oldValue:previousFailing.size,newValue:findings.length }],references:{ runId,scopeKind:input.scope.kind,scopeId,clearedFindingIds:cleared.join(',') } });
  statements.push(auditStatement(db,{ aggregateType:input.scope.kind === 'candidate' ? 'change' : 'baseline',aggregateId:scopeId,entityType:'coherence_run',entityId:runId,action:'coherence_check_completed',actor:input.actor,createdAt,details }));
  if (changeId) statements.push(db.prepare('UPDATE change_requests SET updated_at=? WHERE id=?').bind(createdAt,changeId));
  await runBatches(db,statements);
  return getLatestCoherenceCheck(db,input.scope);
}

export async function recordFindingDisposition(db:D1Database,findingId:string,raw:unknown) {
  const input = FindingDispositionInputSchema.parse(raw);
  const run = await db.prepare(`SELECT id,scope_kind AS scopeKind,scope_id AS scopeId,baseline_id AS baselineId,change_id AS changeId,candidate_revision AS candidateRevision,status,actor,created_at AS createdAt
    FROM coherence_check_runs WHERE id=?`).bind(input.runId).first<CheckRunRow>();
  if (!run) return null;
  const current = await getLatestCoherenceCheck(db,{ kind:run.scopeKind,...(run.scopeKind === 'baseline' ? { baselineId:run.scopeId } : { changeId:run.scopeId }) });
  const finding = current?.findings.find((entry) => entry.id === findingId && entry.fingerprint === input.fingerprint && entry.ruleState === 'failing');
  if (!current || current.id !== run.id || current.stale || !finding) return null;
  const previousDisposition = finding.disposition;
  const nextDisposition = input.action === 'waived' ? 'waived' : 'none';
  if (previousDisposition === nextDisposition) return null;
  const createdAt = now(); const dispositionId = makeId('DSP');
  const details = auditDetails({ reason:input.reason,changes:[{ field:'disposition',oldValue:previousDisposition,newValue:nextDisposition }],references:{ findingId,fingerprint:input.fingerprint,runId:input.runId } });
  const statements = [
    db.prepare('INSERT INTO finding_dispositions (id,scope_kind,scope_id,finding_id,fingerprint,action,reason,actor,run_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(dispositionId,run.scopeKind,run.scopeId,findingId,input.fingerprint,input.action,input.reason,input.actor,input.runId,createdAt),
    auditStatement(db,{ aggregateType:run.scopeKind === 'candidate' ? 'change' : 'baseline',aggregateId:run.scopeId,entityType:'coherence_finding',entityId:findingId,action:input.action === 'waived' ? 'finding_waived' : 'finding_waiver_removed',actor:input.actor,createdAt,details }),
  ];
  if (run.changeId) statements.push(db.prepare('UPDATE change_requests SET updated_at=? WHERE id=?').bind(createdAt,run.changeId));
  await db.batch(statements);
  return getLatestCoherenceCheck(db,{ kind:run.scopeKind,...(run.scopeKind === 'baseline' ? { baselineId:run.scopeId } : { changeId:run.scopeId }) });
}

export async function getEvaluation(db:D1Database,scenarioId:string,selectedRunId?:string) {
  const scenario = await getScenario(db,scenarioId);
  if (!scenario) return null;
  const expectedIds = new Set(scenario.groundTruth.map((entry) => entry.itemId));
  const criticalIds = new Set(scenario.groundTruth.filter((entry) => entry.critical === 1).map((entry) => entry.itemId));
  const runs = await db.prepare("SELECT r.id,r.mode,r.model,r.prompt_version AS promptVersion,r.status,r.created_at AS createdAt,r.change_id AS changeId FROM analysis_runs r JOIN change_requests c ON c.id=r.change_id WHERE c.scenario_id=? AND r.status IN ('completed','superseded') ORDER BY r.created_at DESC").bind(scenarioId).all<{ id:string; mode:string; model:string; promptVersion:string; status:string; createdAt:string; changeId:string }>();
  const selectedRun = runs.results.find((run) => run.id === selectedRunId) ?? runs.results[0] ?? null;
  let calculated = null;
  if (selectedRun) {
    const suggestions = await db.prepare("SELECT s.id,s.target_item_id AS targetId,s.action,COALESCE(d.decision,'pending') AS decision,d.edited_action AS editedAction,d.created_at AS decidedAt FROM impact_suggestions s LEFT JOIN review_decisions d ON d.id=(SELECT id FROM review_decisions WHERE suggestion_id=s.id ORDER BY created_at DESC,id DESC LIMIT 1) WHERE s.run_id=? ORDER BY s.target_item_id").bind(selectedRun.id).all<{ id:string; targetId:string; action:string; decision:string; editedAction:string|null; decidedAt:string|null }>();
    const accepted = suggestions.results.filter((entry) => entry.decision === 'accepted' || entry.decision === 'edited');
    const acceptedIds = new Set(accepted.map((entry) => entry.targetId));
    const foundExpected = [...expectedIds].filter((id) => acceptedIds.has(id)).length;
    const foundCritical = [...criticalIds].filter((id) => acceptedIds.has(id)).length;
    const actionable = accepted.filter((entry) => (entry.editedAction ?? entry.action) === 'update' || (entry.editedAction ?? entry.action) === 'retest');
    const expectedActionById = new Map(scenario.groundTruth.map((entry) => [entry.itemId,entry.expectedAction]));
    const relevantActionable = actionable.filter((entry) => expectedActionById.get(entry.targetId) === (entry.editedAction ?? entry.action)).length;
    const latestDecisionAt = suggestions.results.map((entry) => entry.decidedAt).filter((value):value is string => value !== null).sort().at(-1);
    const reviewSeconds = latestDecisionAt ? Math.max(0,Math.round((Date.parse(latestDecisionAt) - Date.parse(selectedRun.createdAt)) / 1000)) : 0;
    const elapsedMinutes = Math.round((reviewSeconds / 60) * 10) / 10;
    calculated = {
      runId:selectedRun.id,mode:selectedRun.mode,model:selectedRun.model,promptVersion:selectedRun.promptVersion,
      criticalRecall:criticalIds.size === 0 ? 100 : Math.round(foundCritical / criticalIds.size * 100),
      overallRecall:expectedIds.size === 0 ? 100 : Math.round(foundExpected / expectedIds.size * 100),
      actionablePrecision:actionable.length === 0 ? 0 : Math.round(relevantActionable / actionable.length * 100),
      corrections:suggestions.results.filter((entry) => entry.decision === 'edited').length,
      reviewed:suggestions.results.filter((entry) => entry.decision !== 'pending').length,totalSuggestions:suggestions.results.length,
      accepted:accepted.length,reviewSeconds,reviewMinutes:elapsedMinutes,
    };
  }
  return {
    scenario,thresholds:{ criticalRecall:100,overallRecall:85,actionablePrecision:70,timeSavingTarget:30 },
    expectedIds:[...expectedIds],criticalIds:[...criticalIds],groundTruth:{ locked:true,provisional:true },
    runs:runs.results,selectedRun,calculated,
    illustrativeComparisons:{ manual:scenario.metrics.manual,chat:scenario.metrics.chat },
  };
}
