import { z } from 'zod';
import { auditDetails } from './audit';
import { EvidenceIdSchema } from './domain';
import { WorkflowConflictError } from './http';
import { ensureWorkspace, getTraceability, listEvidence } from './repository';
import {
  CreateReleaseInputSchema,CreateVerificationExecutionInputSchema,ExecutionDecisionSchema,MarkVerificationReadyInputSchema,ReadinessResultSchema,
  RELEASE_READINESS_POLICY,ReleaseRecordSchema,ReleaseWorkspaceSchema,ReviewVerificationExecutionInputSchema,RunReleaseReadinessInputSchema,
  VerificationExecutionSchema,VerificationWorkspaceSchema,evaluateReleaseReadiness,type ReadinessInput,type ReadinessRun,type ReleaseRecord,type VerificationExecution,
} from './verification';

function now():string { return new Date().toISOString(); }
function makeId(prefix:string):string { return `${prefix}-${crypto.randomUUID().slice(0,8).toUpperCase()}`; }

async function appendReleaseAudit(db:D1Database,args:{ releaseId:string;entityType:string;entityId:string;action:string;actor:string;reason?:string;changes:Array<{ field:string;oldValue:unknown;newValue:unknown }>;references?:Record<string,string>;createdAt:string }):Promise<void> {
  await db.prepare('INSERT INTO audit_events (id,entity_type,entity_id,aggregate_type,aggregate_id,action,actor,details_json,schema_version,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(makeId('AUD'),args.entityType,args.entityId,'release',args.releaseId,args.action,args.actor,JSON.stringify(auditDetails({ reason:args.reason,changes:args.changes,references:args.references })),1,args.createdAt).run();
}

type ReleaseRow = { id:string;label:string;baselineId:string;status:string;codeRevision:string;createdBy:string;createdAt:string;readinessRunId:string|null;verificationReadyBy:string|null;verificationReadyAt:string|null;finalReadinessRunId:string|null;releaseApprovedBy:string|null;releaseApprovedAt:string|null };
function releaseFromRow(row:ReleaseRow):ReleaseRecord { return ReleaseRecordSchema.parse(row); }

export async function getReleaseById(db:D1Database,id:string):Promise<ReleaseRecord|null> {
  const row = await db.prepare('SELECT id,label,baseline_id AS baselineId,status,code_revision AS codeRevision,created_by AS createdBy,created_at AS createdAt,readiness_run_id AS readinessRunId,verification_ready_by AS verificationReadyBy,verification_ready_at AS verificationReadyAt,final_readiness_run_id AS finalReadinessRunId,release_approved_by AS releaseApprovedBy,release_approved_at AS releaseApprovedAt FROM releases WHERE id=?').bind(id).first<ReleaseRow>();
  return row ? releaseFromRow(row) : null;
}

export async function listReleaseExecutions(db:D1Database,releaseId:string):Promise<VerificationExecution[]> {
  const executions = await db.prepare(`SELECT id,release_id AS releaseId,baseline_id AS baselineId,test_item_id AS testItemId,test_version_id AS testVersionId,outcome,environment,build_id AS buildId,observed_result AS observedResult,executed_at AS executedAt,evidence_reference AS evidenceReference,created_by AS createdBy,created_at AS createdAt
    FROM verification_executions WHERE release_id=? ORDER BY executed_at,id`).bind(releaseId).all<{ id:string;releaseId:string;baselineId:string;testItemId:string;testVersionId:string;outcome:string;environment:string;buildId:string;observedResult:string;executedAt:string;evidenceReference:string;createdBy:string;createdAt:string }>();
  const decisions = await db.prepare(`SELECT d.execution_id AS executionId,d.decision,d.reason,d.actor,d.created_at AS createdAt FROM verification_execution_decisions d JOIN verification_executions e ON e.id=d.execution_id WHERE e.release_id=? ORDER BY d.created_at DESC,d.id DESC`).bind(releaseId).all<{ executionId:string;decision:string;reason:string;actor:string;createdAt:string }>();
  const latest = new Map<string,typeof decisions.results[number]>();
  for (const decision of decisions.results) if (!latest.has(decision.executionId)) latest.set(decision.executionId,decision);
  return executions.results.map((execution) => VerificationExecutionSchema.parse({ ...execution,testItemId:EvidenceIdSchema.parse(execution.testItemId),decision:latest.has(execution.id) ? ExecutionDecisionSchema.parse(latest.get(execution.id)) : null }));
}

async function readinessInput(db:D1Database,release:ReleaseRecord):Promise<ReadinessInput> {
  const traceability = await getTraceability(db,release.baselineId);
  if (!traceability) throw new WorkflowConflictError('The release baseline is unavailable.');
  const evidence = await db.prepare(`SELECT i.id,i.type,b.version_id AS versionId FROM baseline_items b JOIN evidence_items i ON i.id=b.item_id WHERE b.baseline_id=? ORDER BY i.id`).bind(release.baselineId).all<{ id:string;type:string;versionId:string }>();
  const planLinks = traceability.links.flatMap((link) => link.type === 'VERIFIES' && link.source.type === 'test' && link.target.type === 'risk_control' && link.source.version
    ? [{ relationshipId:link.id,testItemId:link.sourceId,testVersionId:evidence.results.find((item) => item.id === link.sourceId)?.versionId ?? '',riskControlId:link.targetId }]
    : []).filter((link) => link.testVersionId.length > 0);
  return {
    baseline:{ id:release.baselineId,items:evidence.results },
    relationships:traceability.links.map((link) => ({ id:link.id,sourceId:link.sourceId,targetId:link.targetId,type:link.type })),
    policyViolations:traceability.links.filter((link) => !link.policy.valid).map((link) => ({ id:link.id,detail:link.policy.violation ?? 'The relationship is invalid.' })),
    coverageGaps:traceability.gaps.map((gap) => ({ id:gap.id,severity:gap.severity,itemId:gap.itemId,title:gap.title,actual:gap.actual })),
    planLinks,executions:await listReleaseExecutions(db,release.id),
  };
}

export async function getReleaseReadinessRun(db:D1Database,id:string,currentRelease?:ReleaseRecord|null):Promise<ReadinessRun|null> {
  const run = await db.prepare('SELECT id,release_id AS releaseId,baseline_id AS baselineId,policy_id AS policyId,policy_version AS policyVersion,input_fingerprint AS inputFingerprint,status,actor,created_at AS createdAt FROM release_readiness_runs WHERE id=?').bind(id).first<{ id:string;releaseId:string;baselineId:string;policyId:string;policyVersion:string;inputFingerprint:string;status:string;actor:string;createdAt:string }>();
  if (!run) return null;
  const results = await db.prepare('SELECT result_id AS id,code,severity,status,subject_id AS subjectId,title,detail FROM release_readiness_results WHERE run_id=? ORDER BY code,result_id').bind(id).all<{ id:string;code:string;severity:string;status:string;subjectId:string;title:string;detail:string }>();
  const release = currentRelease ?? await getReleaseById(db,run.releaseId);
  const currentFingerprint = release ? evaluateReleaseReadiness(await readinessInput(db,release)).inputFingerprint : null;
  return {
    ...run,policyId:RELEASE_READINESS_POLICY.id,policyVersion:RELEASE_READINESS_POLICY.version,
    status:z.enum(['blocked','ready']).parse(run.status),stale:currentFingerprint !== run.inputFingerprint,results:results.results.map((result) => ReadinessResultSchema.parse(result)),
  };
}

export async function listReleaseWorkspace(db:D1Database) {
  await ensureWorkspace(db);
  const rows = await db.prepare('SELECT id,label,baseline_id AS baselineId,status,code_revision AS codeRevision,created_by AS createdBy,created_at AS createdAt,readiness_run_id AS readinessRunId,verification_ready_by AS verificationReadyBy,verification_ready_at AS verificationReadyAt,final_readiness_run_id AS finalReadinessRunId,release_approved_by AS releaseApprovedBy,release_approved_at AS releaseApprovedAt FROM releases ORDER BY created_at DESC,id DESC').all<ReleaseRow>();
  const releases = rows.results.map(releaseFromRow);
  const latestRelease = releases[0] ?? null;
  const latestRun = latestRelease ? await db.prepare('SELECT id FROM release_readiness_runs WHERE release_id=? ORDER BY created_at DESC,id DESC LIMIT 1').bind(latestRelease.id).first<{ id:string }>() : null;
  return ReleaseWorkspaceSchema.parse({ releases,latestReadiness:latestRun ? await getReleaseReadinessRun(db,latestRun.id,latestRelease) : null });
}

export async function createRelease(db:D1Database,raw:unknown) {
  await ensureWorkspace(db); const input = CreateReleaseInputSchema.parse(raw);
  const baseline = await db.prepare("SELECT id,status FROM baselines WHERE id=?").bind(input.baselineId).first<{ id:string;status:string }>();
  if (!baseline || baseline.status !== 'approved') throw new WorkflowConflictError('A planned release must reference the active approved baseline.');
  const duplicate = await db.prepare('SELECT id FROM releases WHERE baseline_id=?').bind(input.baselineId).first<{ id:string }>();
  if (duplicate) throw new WorkflowConflictError(`Release ${duplicate.id} already references this baseline.`);
  const id = makeId('RELSE'); const createdAt = now();
  await db.prepare("INSERT INTO releases (id,label,baseline_id,status,code_revision,created_by,created_at,readiness_run_id,verification_ready_by,verification_ready_at,final_readiness_run_id,release_approved_by,release_approved_at) VALUES (?,?,?,'planned',?,?,?,NULL,NULL,NULL,NULL,NULL,NULL)")
    .bind(id,input.label,input.baselineId,input.codeRevision,input.actor,createdAt).run();
  await appendReleaseAudit(db,{ releaseId:id,entityType:'release',entityId:id,action:'release_planned',actor:input.actor,createdAt,changes:[{ field:'status',oldValue:null,newValue:'planned' }],references:{ baselineId:input.baselineId,codeRevision:input.codeRevision } });
  return listReleaseWorkspace(db);
}

export async function createVerificationExecution(db:D1Database,raw:unknown) {
  await ensureWorkspace(db); const input = CreateVerificationExecutionInputSchema.parse(raw); const release = await getReleaseById(db,input.releaseId);
  if (!release || release.status !== 'planned') throw new WorkflowConflictError('Executions can be recorded only for a planned release.');
  const test = await db.prepare(`SELECT b.version_id AS versionId FROM baseline_items b JOIN evidence_items i ON i.id=b.item_id WHERE b.baseline_id=? AND b.item_id=? AND i.type='test'`).bind(release.baselineId,input.testItemId).first<{ versionId:string }>();
  if (!test) throw new WorkflowConflictError('The selected TEST plan is not in the release baseline.');
  const verifiesControl = await db.prepare("SELECT id FROM relationships WHERE baseline_id=? AND source_id=? AND type='VERIFIES' AND active=1 AND target_id IN (SELECT id FROM evidence_items WHERE type='risk_control') LIMIT 1").bind(release.baselineId,input.testItemId).first<{ id:string }>();
  if (!verifiesControl) throw new WorkflowConflictError('The selected TEST plan does not verify a risk control in the release baseline.');
  const id = makeId('VEX'); const createdAt = now();
  await db.prepare('INSERT INTO verification_executions (id,release_id,baseline_id,test_item_id,test_version_id,outcome,environment,build_id,observed_result,executed_at,evidence_reference,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id,release.id,release.baselineId,input.testItemId,test.versionId,input.outcome,input.environment,input.buildId,input.observedResult,input.executedAt,input.evidenceReference,input.actor,createdAt).run();
  await appendReleaseAudit(db,{ releaseId:release.id,entityType:'verification_execution',entityId:id,action:'verification_execution_recorded',actor:input.actor,createdAt,changes:[{ field:'execution',oldValue:null,newValue:{ testItemId:input.testItemId,testVersionId:test.versionId,outcome:input.outcome,buildId:input.buildId,executedAt:input.executedAt } }],references:{ baselineId:release.baselineId,evidenceReference:input.evidenceReference } });
  return getVerificationWorkspace(db);
}

export async function reviewVerificationExecution(db:D1Database,id:string,raw:unknown) {
  await ensureWorkspace(db); const input = ReviewVerificationExecutionInputSchema.parse(raw);
  const execution = await db.prepare('SELECT e.id,e.release_id AS releaseId,r.status AS releaseStatus FROM verification_executions e JOIN releases r ON r.id=e.release_id WHERE e.id=?').bind(id).first<{ id:string;releaseId:string;releaseStatus:string }>();
  if (!execution || execution.releaseStatus !== 'planned') throw new WorkflowConflictError('Execution decisions are allowed only while the release is planned.');
  const createdAt = now();
  await db.prepare('INSERT INTO verification_execution_decisions (id,execution_id,decision,reason,actor,created_at) VALUES (?,?,?,?,?,?)').bind(makeId('VED'),id,input.decision,input.reason,input.actor,createdAt).run();
  await appendReleaseAudit(db,{ releaseId:execution.releaseId,entityType:'verification_execution',entityId:id,action:`verification_execution_${input.decision}`,actor:input.actor,reason:input.reason,createdAt,changes:[{ field:'decision',oldValue:null,newValue:input.decision }] });
  return getVerificationWorkspace(db);
}

export async function runReleaseReadiness(db:D1Database,id:string,raw:unknown) {
  await ensureWorkspace(db); const input = RunReleaseReadinessInputSchema.parse(raw); const release = await getReleaseById(db,id);
  if (!release || release.status !== 'planned') throw new WorkflowConflictError('Readiness can run only for a planned release.');
  const evaluation = evaluateReleaseReadiness(await readinessInput(db,release)); const runId = makeId('RRN'); const createdAt = now();
  const statements:D1PreparedStatement[] = [db.prepare('INSERT INTO release_readiness_runs (id,release_id,baseline_id,policy_id,policy_version,input_fingerprint,status,actor,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(runId,release.id,release.baselineId,RELEASE_READINESS_POLICY.id,RELEASE_READINESS_POLICY.version,evaluation.inputFingerprint,evaluation.status,input.actor,createdAt)];
  for (const result of evaluation.results) statements.push(db.prepare('INSERT INTO release_readiness_results (run_id,result_id,code,severity,status,subject_id,title,detail) VALUES (?,?,?,?,?,?,?,?)').bind(runId,result.id,result.code,result.severity,result.status,result.subjectId,result.title,result.detail));
  await db.batch(statements);
  await appendReleaseAudit(db,{ releaseId:release.id,entityType:'release_readiness_run',entityId:runId,action:'release_readiness_evaluated',actor:input.actor,createdAt,changes:[{ field:'status',oldValue:null,newValue:evaluation.status }],references:{ policyId:RELEASE_READINESS_POLICY.id,policyVersion:RELEASE_READINESS_POLICY.version,inputFingerprint:evaluation.inputFingerprint } });
  return getReleaseReadinessRun(db,runId,release);
}

export async function markVerificationReady(db:D1Database,id:string,raw:unknown) {
  await ensureWorkspace(db); const input = MarkVerificationReadyInputSchema.parse(raw); const release = await getReleaseById(db,id);
  if (!release || release.status !== 'planned') throw new WorkflowConflictError('Only a planned release can become verification ready.');
  const run = await getReleaseReadinessRun(db,input.readinessRunId,release);
  if (!run || run.releaseId !== release.id || run.status !== 'ready' || run.stale || run.results.some((result) => result.status === 'block')) throw new WorkflowConflictError('Run a fresh passing readiness check before marking this release verification ready.');
  const readyAt = now();
  const result = await db.prepare("UPDATE releases SET status='verification_ready',readiness_run_id=?,verification_ready_by=?,verification_ready_at=? WHERE id=? AND status='planned'").bind(run.id,input.actor,readyAt,release.id).run();
  if ((result.meta.changes ?? 0) !== 1) throw new WorkflowConflictError('The release state changed before readiness was recorded.');
  await appendReleaseAudit(db,{ releaseId:release.id,entityType:'release',entityId:release.id,action:'release_verification_ready',actor:input.actor,createdAt:readyAt,changes:[{ field:'status',oldValue:'planned',newValue:'verification_ready' }],references:{ readinessRunId:run.id,inputFingerprint:run.inputFingerprint,policyId:run.policyId } });
  return listReleaseWorkspace(db);
}

export async function getVerificationWorkspace(db:D1Database) {
  await ensureWorkspace(db); const evidence = await listEvidence(db); const traceability = await getTraceability(db);
  if (!traceability) throw new WorkflowConflictError('No active approved baseline is available.');
  const byId = new Map(evidence.map((item) => [item.id,item]));
  const details = await db.prepare('SELECT evidence_version_id AS evidenceVersionId,test_item_id AS testItemId,objective,method,acceptance_criteria AS acceptanceCriteria,target_risk_control_id AS targetRiskControlId FROM verification_plan_versions').all<{ evidenceVersionId:string;testItemId:string;objective:string;method:string;acceptanceCriteria:string;targetRiskControlId:string }>();
  const detailByVersion = new Map(details.results.map((detail) => [detail.evidenceVersionId,detail]));
  const latestReleaseRow = await db.prepare('SELECT id,label,baseline_id AS baselineId,status,code_revision AS codeRevision,created_by AS createdBy,created_at AS createdAt,readiness_run_id AS readinessRunId,verification_ready_by AS verificationReadyBy,verification_ready_at AS verificationReadyAt,final_readiness_run_id AS finalReadinessRunId,release_approved_by AS releaseApprovedBy,release_approved_at AS releaseApprovedAt FROM releases WHERE baseline_id=? ORDER BY created_at DESC,id DESC LIMIT 1').bind(traceability.baseline.id).first<ReleaseRow>();
  const activeRelease = latestReleaseRow ? releaseFromRow(latestReleaseRow) : null;
  const executions = activeRelease ? await listReleaseExecutions(db,activeRelease.id) : [];
  const plans = traceability.links.flatMap((link) => {
    if (link.type !== 'VERIFIES' || link.source.type !== 'test' || link.target.type !== 'risk_control') return [];
    const test = byId.get(link.sourceId); const control = byId.get(link.targetId);
    if (!test || !control) return [];
    const planDetails = detailByVersion.get(test.versionId);
    const latest = [...executions.filter((execution) => execution.testItemId === test.id && execution.testVersionId === test.versionId)].sort((left,right) => right.executedAt.localeCompare(left.executedAt) || right.id.localeCompare(left.id))[0] ?? null;
    const packageSource = test.sources.find((source) => source.startsWith('Verification package CHG-'));
    return [{ riskControl:{ id:control.id,title:control.title,statement:control.statement,criticality:control.criticality },test:{ id:test.id,versionId:test.versionId,title:test.title,statement:test.statement },details:planDetails ? { objective:planDetails.objective,method:planDetails.method,acceptanceCriteria:planDetails.acceptanceCriteria } : null,changeId:packageSource?.slice('Verification package '.length) ?? null,latestExecution:latest }];
  });
  const openPackage = await db.prepare("SELECT id FROM change_requests WHERE subject_kind='verification_package' AND status NOT IN ('approved','closed') ORDER BY created_at DESC LIMIT 1").first<{ id:string }>();
  return VerificationWorkspaceSchema.parse({
    baseline:traceability.baseline,highGapCount:traceability.summary.highCoverageGaps,
    gaps:traceability.gaps.filter((gap) => gap.itemType === 'risk_control').map((gap) => ({ id:gap.id,severity:gap.severity,itemId:gap.itemId,title:gap.title,actual:gap.actual })),
    plans:plans.sort((left,right) => left.riskControl.id.localeCompare(right.riskControl.id)),openPackageChangeId:openPackage?.id ?? null,plannedRelease:activeRelease,
  });
}
