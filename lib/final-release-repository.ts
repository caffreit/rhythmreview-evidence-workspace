import { z } from 'zod';
import { auditDetails } from './audit';
import { demoActor } from './actors';
import { EvidenceIdSchema } from './domain';
import {
  ApproveFinalReleaseInputSchema,AttachmentCategorySchema,CiDecisionInputSchema,CiEvidenceSchema,CiManifestSchema,FINAL_RELEASE_ATTESTATION,FINAL_RELEASE_POLICY,
  FinalReadinessResultSchema,FinalReadinessRunSchema,FinalizationWorkspaceSchema,MAX_ATTACHMENTS_PER_RELEASE,PrototypeAttestationSchema,ReleaseAttachmentSchema,
  RISK_ATTESTATION,ResidualRiskAssessmentSchema,RiskAcceptanceInputSchema,RiskDecisionInputSchema,RunFinalReadinessInputSchema,UpsertResidualRiskInputSchema,
  evaluateFinalReadiness,normalizeFilename,riskAcceptanceFingerprint,sha256Hex,validateAttachmentFile,
  type CiEvidence,type FinalReadinessInput,type FinalReadinessRun,type PrototypeAttestation,type ReleaseAttachment,type ResidualRiskAssessment,
} from './final-release';
import { InvalidRequestError, WorkflowConflictError } from './http';
import { ensureWorkspace,getLatestCoherenceCheck,getTraceability,runCoherenceCheck } from './repository';
import { getReleaseById,getReleaseReadinessRun,listReleaseExecutions } from './verification-repository';
import type { ReleaseRecord, VerificationExecution } from './verification';

function now():string { return new Date().toISOString(); }
function makeId(prefix:string):string { return `${prefix}-${crypto.randomUUID().slice(0,8).toUpperCase()}`; }

async function appendAudit(db:D1Database,args:{ releaseId:string;entityType:string;entityId:string;action:string;actor:string;reason?:string;changes:Array<{ field:string;oldValue:unknown;newValue:unknown }>;references?:Record<string,string>;createdAt:string }):Promise<void> {
  await db.prepare('INSERT INTO audit_events (id,entity_type,entity_id,aggregate_type,aggregate_id,action,actor,details_json,schema_version,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(makeId('AUD'),args.entityType,args.entityId,'release',args.releaseId,args.action,args.actor,JSON.stringify(auditDetails({ reason:args.reason,changes:args.changes,references:args.references })),1,args.createdAt).run();
}

async function finalizableRelease(db:D1Database,id:string):Promise<ReleaseRecord> {
  const release = await getReleaseById(db,id);
  if (!release) throw new WorkflowConflictError('The release does not exist.');
  if (release.status !== 'verification_ready') throw new WorkflowConflictError('Finalization records can change only after verification readiness and before final approval.');
  return release;
}

type RiskRow = { id:string;releaseId:string;hazardItemId:string;hazardVersionId:string;revision:number;classification:string;rationale:string;benefitRiskConclusion:string|null;createdBy:string;createdAt:string };
async function listRiskAssessments(db:D1Database,releaseId:string):Promise<ResidualRiskAssessment[]> {
  const rows = await db.prepare('SELECT id,release_id AS releaseId,hazard_item_id AS hazardItemId,hazard_version_id AS hazardVersionId,revision,classification,rationale,benefit_risk_conclusion AS benefitRiskConclusion,created_by AS createdBy,created_at AS createdAt FROM residual_risk_assessments WHERE release_id=? ORDER BY hazard_item_id,revision DESC,created_at DESC').bind(releaseId).all<RiskRow>();
  const decisions = await db.prepare('SELECT id,assessment_id AS assessmentId,decision,reason,actor,created_at AS createdAt FROM residual_risk_decisions WHERE assessment_id IN (SELECT id FROM residual_risk_assessments WHERE release_id=?) ORDER BY created_at DESC,id DESC').bind(releaseId).all<{ id:string;assessmentId:string;decision:string;reason:string;actor:string;createdAt:string }>();
  const latestDecision = new Map<string,typeof decisions.results[number]>();
  for (const decision of decisions.results) if (!latestDecision.has(decision.assessmentId)) latestDecision.set(decision.assessmentId,decision);
  return rows.results.map((row) => ResidualRiskAssessmentSchema.parse({ ...row,hazardItemId:EvidenceIdSchema.parse(row.hazardItemId),decision:latestDecision.get(row.id) ?? null }));
}

function latestExecutionFor(testId:string,executions:VerificationExecution[]):VerificationExecution|null {
  return executions.filter((entry) => entry.testItemId === testId).sort((left,right) => right.executedAt.localeCompare(left.executedAt) || right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id))[0] ?? null;
}

async function riskViews(db:D1Database,release:ReleaseRecord) {
  const hazards = await db.prepare(`SELECT i.id,v.id AS versionId,v.title,v.statement FROM baseline_items b JOIN evidence_items i ON i.id=b.item_id JOIN evidence_versions v ON v.id=b.version_id WHERE b.baseline_id=? AND i.type='hazard' ORDER BY i.id`).bind(release.baselineId).all<{ id:string;versionId:string;title:string;statement:string }>();
  const controls = await db.prepare(`SELECT r.target_id AS hazardId,i.id,v.title,v.statement FROM relationships r JOIN evidence_items i ON i.id=r.source_id JOIN baseline_items b ON b.baseline_id=r.baseline_id AND b.item_id=i.id JOIN evidence_versions v ON v.id=b.version_id WHERE r.baseline_id=? AND r.active=1 AND r.type='MITIGATES' AND i.type='risk_control' ORDER BY i.id`).bind(release.baselineId).all<{ hazardId:string;id:string;title:string;statement:string }>();
  const verifies = await db.prepare("SELECT source_id AS testId,target_id AS controlId FROM relationships WHERE baseline_id=? AND active=1 AND type='VERIFIES' ORDER BY source_id").bind(release.baselineId).all<{ testId:string;controlId:string }>();
  const executions = await listReleaseExecutions(db,release.id);
  const assessments = await listRiskAssessments(db,release.id);
  return hazards.results.map((hazard) => {
    const history = assessments.filter((assessment) => assessment.hazardItemId === hazard.id).sort((left,right) => right.revision - left.revision || right.createdAt.localeCompare(left.createdAt));
    const linkedControls = controls.results.filter((control) => control.hazardId === hazard.id).map((control) => {
      const testIds = verifies.results.filter((link) => link.controlId === control.id).map((link) => link.testId);
      const accepted = testIds.some((testId) => { const execution = latestExecutionFor(testId,executions);return execution?.outcome === 'passed' && execution.decision?.decision === 'accepted'; });
      return { id:EvidenceIdSchema.parse(control.id),title:control.title,statement:control.statement,verification:accepted ? 'accepted_pass' as const : 'missing_or_not_accepted' as const };
    });
    return { hazard:{ ...hazard,id:EvidenceIdSchema.parse(hazard.id) },linkedControls,current:history[0] ?? null,history };
  });
}

type AttachmentRow = { id:string;releaseId:string;category:string;filename:string;contentType:string;size:number;sha256:string;objectKey:string;supersedesAttachmentId:string|null;ciEvidenceId:string|null;createdBy:string;createdAt:string };
async function listAttachments(db:D1Database,releaseId:string):Promise<ReleaseAttachment[]> {
  const rows = await db.prepare('SELECT id,release_id AS releaseId,category,filename,content_type AS contentType,size,sha256,object_key AS objectKey,supersedes_attachment_id AS supersedesAttachmentId,ci_evidence_id AS ciEvidenceId,created_by AS createdBy,created_at AS createdAt FROM release_attachments WHERE release_id=? ORDER BY created_at DESC,id DESC').bind(releaseId).all<AttachmentRow>();
  const replaced = new Set(rows.results.flatMap((row) => row.supersedesAttachmentId ? [row.supersedesAttachmentId] : []));
  const latestCi = await db.prepare('SELECT id FROM ci_evidence_records WHERE release_id=? ORDER BY created_at DESC,id DESC LIMIT 1').bind(releaseId).first<{ id:string }>();
  return rows.results.map((row) => ReleaseAttachmentSchema.parse({ ...row,superseded:replaced.has(row.id) || Boolean(row.ciEvidenceId && row.ciEvidenceId !== latestCi?.id) }));
}

async function listCiEvidence(db:D1Database,releaseId:string):Promise<CiEvidence[]> {
  const rows = await db.prepare('SELECT id,release_id AS releaseId,manifest_attachment_id AS manifestAttachmentId,manifest_json AS manifestJson,commit_sha AS commitSha,conclusion,validation_status AS validationStatus,validation_error AS validationError,supersedes_ci_evidence_id AS supersedesCiEvidenceId,created_by AS createdBy,created_at AS createdAt FROM ci_evidence_records WHERE release_id=? ORDER BY created_at DESC,id DESC').bind(releaseId).all<{ id:string;releaseId:string;manifestAttachmentId:string;manifestJson:string;commitSha:string;conclusion:string;validationStatus:string;validationError:string|null;supersedesCiEvidenceId:string|null;createdBy:string;createdAt:string }>();
  const decisions = await db.prepare('SELECT id,ci_evidence_id AS ciEvidenceId,decision,reason,actor,created_at AS createdAt FROM ci_evidence_decisions WHERE ci_evidence_id IN (SELECT id FROM ci_evidence_records WHERE release_id=?) ORDER BY created_at DESC,id DESC').bind(releaseId).all<{ id:string;ciEvidenceId:string;decision:string;reason:string;actor:string;createdAt:string }>();
  const latest = new Map<string,typeof decisions.results[number]>();for (const decision of decisions.results) if (!latest.has(decision.ciEvidenceId)) latest.set(decision.ciEvidenceId,decision);
  return rows.results.map((row) => CiEvidenceSchema.parse({ ...row,manifest:CiManifestSchema.parse(JSON.parse(row.manifestJson)),decision:latest.get(row.id) ?? null }));
}

async function rawAttestations(db:D1Database,releaseId:string):Promise<Array<Omit<PrototypeAttestation,'current'>>> {
  const rows = await db.prepare('SELECT id,release_id AS releaseId,kind,statement_version AS statementVersion,statement,actor,role,reason,input_fingerprint AS inputFingerprint,created_at AS createdAt FROM prototype_attestations WHERE release_id=? ORDER BY created_at DESC,id DESC').bind(releaseId).all<{ id:string;releaseId:string;kind:string;statementVersion:string;statement:string;actor:string;role:string;reason:string;inputFingerprint:string;createdAt:string }>();
  return rows.results.map((row) => PrototypeAttestationSchema.omit({ current:true }).parse(row));
}

async function buildFinalReadinessInput(db:D1Database,release:ReleaseRecord):Promise<FinalReadinessInput> {
  const [trace,risks,attachments,ci,storedAttestations] = await Promise.all([getTraceability(db,release.baselineId),riskViews(db,release),listAttachments(db,release.id),listCiEvidence(db,release.id),rawAttestations(db,release.id)]);
  if (!trace) throw new WorkflowConflictError('The release baseline is unavailable.');
  let coherence = await getLatestCoherenceCheck(db,{ kind:'baseline',baselineId:release.baselineId });
  if (!coherence) coherence = await runCoherenceCheck(db,{ scope:{ kind:'baseline',baselineId:release.baselineId },actor:'System' });
  const readiness = release.readinessRunId ? await getReleaseReadinessRun(db,release.readinessRunId,release) : null;
  const currentRisks = risks.map((risk) => ({ hazardId:risk.hazard.id,assessmentId:risk.current?.id ?? null,classification:risk.current?.classification ?? null,decisionId:risk.current?.decision?.id ?? null,decision:risk.current?.decision?.decision ?? null }));
  const support = attachments.filter((attachment) => attachment.category === 'risk_support' && !attachment.superseded).map((attachment) => ({ id:attachment.id,sha256:attachment.sha256 }));
  const currentAttachments = attachments.filter((attachment) => !attachment.superseded).map((attachment) => ({ id:attachment.id,category:attachment.category,sha256:attachment.sha256 }));
  const expectedRiskFingerprint = riskAcceptanceFingerprint({ risks:currentRisks,riskSupport:support });
  const riskAttestation = storedAttestations.find((attestation) => attestation.kind === 'residual_risk_acceptance') ?? null;
  return {
    release:{ id:release.id,status:release.status,readinessRunId:release.readinessRunId },verification:{ status:readiness?.status ?? null,stale:readiness?.stale ?? true },
    policyViolationIds:trace.links.filter((link) => !link.policy.valid).map((link) => link.id),highGapIds:trace.gaps.filter((gap) => gap.severity === 'high').map((gap) => gap.id),
    highCoherenceFindings:(coherence?.findings ?? []).filter((finding) => finding.ruleState === 'failing' && finding.severity === 'high').map((finding) => ({ id:finding.id,title:finding.title,waived:finding.status === 'waived' })),
    mediumCoherenceFindings:(coherence?.findings ?? []).filter((finding) => finding.ruleState === 'failing' && finding.severity === 'medium').map((finding) => ({ id:finding.id,title:finding.title })),
    risks:currentRisks,riskSupport:support,attachments:currentAttachments,ci:ci[0] ? { id:ci[0].id,validationStatus:ci[0].validationStatus,decisionId:ci[0].decision?.id ?? null,decision:ci[0].decision?.decision ?? null } : null,
    riskAttestation:riskAttestation ? { id:riskAttestation.id,current:riskAttestation.inputFingerprint === expectedRiskFingerprint } : null,
  };
}

async function getFinalReadinessRun(db:D1Database,id:string,release:ReleaseRecord):Promise<FinalReadinessRun|null> {
  const row = await db.prepare('SELECT id,release_id AS releaseId,policy_id AS policyId,policy_version AS policyVersion,input_fingerprint AS inputFingerprint,status,actor,created_at AS createdAt FROM final_readiness_runs WHERE id=?').bind(id).first<{ id:string;releaseId:string;policyId:string;policyVersion:string;inputFingerprint:string;status:string;actor:string;createdAt:string }>();
  if (!row || row.releaseId !== release.id) return null;
  const results = await db.prepare('SELECT result_id AS id,code,severity,status,subject_id AS subjectId,title,detail FROM final_readiness_results WHERE run_id=? ORDER BY code,result_id').bind(id).all<{ id:string;code:string;severity:string;status:string;subjectId:string;title:string;detail:string }>();
  const currentFingerprint = evaluateFinalReadiness(await buildFinalReadinessInput(db,release)).inputFingerprint;
  return FinalReadinessRunSchema.parse({ ...row,policyId:FINAL_RELEASE_POLICY.id,policyVersion:FINAL_RELEASE_POLICY.version,stale:currentFingerprint !== row.inputFingerprint,results:results.results.map((result) => FinalReadinessResultSchema.parse(result)) });
}

export async function getFinalizationWorkspace(db:D1Database,releaseId:string) {
  await ensureWorkspace(db);const release = await getReleaseById(db,releaseId);if (!release) return null;
  const [risks,attachments,ci,storedAttestations,auditRows] = await Promise.all([
    riskViews(db,release),listAttachments(db,release.id),listCiEvidence(db,release.id),rawAttestations(db,release.id),
    db.prepare("SELECT id,entity_type AS entityType,entity_id AS entityId,action,actor,details_json AS detailsJson,created_at AS createdAt FROM audit_events WHERE aggregate_type='release' AND aggregate_id=? ORDER BY created_at DESC,id DESC").bind(release.id).all<{ id:string;entityType:string;entityId:string;action:string;actor:string;detailsJson:string;createdAt:string }>(),
  ]);
  const input = await buildFinalReadinessInput(db,release);
  const riskFingerprint = riskAcceptanceFingerprint({ risks:input.risks,riskSupport:input.riskSupport });
  const latestFinal = await db.prepare('SELECT id FROM final_readiness_runs WHERE release_id=? ORDER BY created_at DESC,id DESC LIMIT 1').bind(release.id).first<{ id:string }>();
  const finalRun = latestFinal ? await getFinalReadinessRun(db,latestFinal.id,release) : null;
  const attestations = storedAttestations.map((attestation) => PrototypeAttestationSchema.parse({ ...attestation,current:attestation.kind === 'residual_risk_acceptance' ? attestation.inputFingerprint === riskFingerprint : attestation.inputFingerprint === finalRun?.inputFingerprint }));
  const audit=auditRows.results.map((event) => { let details:unknown;try { details=JSON.parse(event.detailsJson); } catch { details=event.detailsJson; }return { ...event,details }; });
  return FinalizationWorkspaceSchema.parse({ release,risks,attachments,ciEvidence:ci,attestations,latestFinalReadiness:finalRun,audit });
}

export async function createResidualRiskAssessment(db:D1Database,releaseId:string,raw:unknown) {
  await ensureWorkspace(db);const input = UpsertResidualRiskInputSchema.parse(raw);const release = await finalizableRelease(db,releaseId);
  const hazard = await db.prepare("SELECT b.version_id AS versionId FROM baseline_items b JOIN evidence_items i ON i.id=b.item_id WHERE b.baseline_id=? AND b.item_id=? AND i.type='hazard'").bind(release.baselineId,input.hazardItemId).first<{ versionId:string }>();
  if (!hazard) throw new WorkflowConflictError('The selected hazard is not in the release baseline.');
  const previous = await db.prepare('SELECT id,revision FROM residual_risk_assessments WHERE release_id=? AND hazard_item_id=? ORDER BY revision DESC,created_at DESC LIMIT 1').bind(release.id,input.hazardItemId).first<{ id:string;revision:number }>();
  const id = makeId('RRA');const createdAt=now();const revision=(previous?.revision ?? 0)+1;
  await db.prepare('INSERT INTO residual_risk_assessments (id,release_id,hazard_item_id,hazard_version_id,revision,classification,rationale,benefit_risk_conclusion,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,release.id,input.hazardItemId,hazard.versionId,revision,input.classification,input.rationale,input.benefitRiskConclusion,input.actor,createdAt).run();
  await appendAudit(db,{ releaseId:release.id,entityType:'residual_risk_assessment',entityId:id,action:previous ? 'residual_risk_revised' : 'residual_risk_recorded',actor:input.actor,createdAt,changes:[{ field:'revision',oldValue:previous?.revision ?? null,newValue:revision},{ field:'classification',oldValue:null,newValue:input.classification }],references:{ hazardItemId:input.hazardItemId,hazardVersionId:hazard.versionId,predecessorAssessmentId:previous?.id ?? '' } });
  return getFinalizationWorkspace(db,release.id);
}

export async function decideResidualRisk(db:D1Database,assessmentId:string,raw:unknown) {
  await ensureWorkspace(db);const input=RiskDecisionInputSchema.parse(raw);
  const assessment=await db.prepare('SELECT id,release_id AS releaseId,hazard_item_id AS hazardItemId,revision,classification FROM residual_risk_assessments WHERE id=?').bind(assessmentId).first<{ id:string;releaseId:string;hazardItemId:string;revision:number;classification:string }>();
  if (!assessment) return null;await finalizableRelease(db,assessment.releaseId);
  const current=await db.prepare('SELECT id FROM residual_risk_assessments WHERE release_id=? AND hazard_item_id=? ORDER BY revision DESC,created_at DESC LIMIT 1').bind(assessment.releaseId,assessment.hazardItemId).first<{ id:string }>();
  if (current?.id !== assessment.id) throw new WorkflowConflictError('Only the current residual-risk revision can be reviewed.');
  if (input.decision === 'accepted' && assessment.classification === 'unacceptable') throw new WorkflowConflictError('An unacceptable residual risk cannot be accepted.');
  const id=makeId('RRD');const createdAt=now();
  await db.prepare('INSERT INTO residual_risk_decisions (id,assessment_id,decision,reason,actor,created_at) VALUES (?,?,?,?,?,?)').bind(id,assessment.id,input.decision,input.reason,input.actor,createdAt).run();
  await appendAudit(db,{ releaseId:assessment.releaseId,entityType:'residual_risk_assessment',entityId:assessment.id,action:`residual_risk_${input.decision}`,actor:input.actor,reason:input.reason,createdAt,changes:[{ field:'decision',oldValue:null,newValue:input.decision }],references:{ decisionId:id,revision:String(assessment.revision) } });
  return getFinalizationWorkspace(db,assessment.releaseId);
}

function formText(form:FormData,key:string):string { const value=form.get(key);if (typeof value !== 'string') throw new InvalidRequestError(`${key} is required.`);return value; }
function formFile(form:FormData,key:string):File { const value=form.get(key);if (!(value instanceof File)) throw new InvalidRequestError(`${key} is required.`);return value; }

async function attachmentCount(db:D1Database,releaseId:string):Promise<number> { return (await db.prepare('SELECT COUNT(*) AS count FROM release_attachments WHERE release_id=?').bind(releaseId).first<{ count:number }>())?.count ?? 0; }

export async function uploadReleaseAttachment(db:D1Database,bucket:R2Bucket,releaseId:string,form:FormData) {
  await ensureWorkspace(db);const actor=z.literal(demoActor('author')).parse(formText(form,'actor'));const category=AttachmentCategorySchema.parse(formText(form,'category'));const file=formFile(form,'file');validateAttachmentFile(file);const release=await finalizableRelease(db,releaseId);
  if (await attachmentCount(db,release.id) >= MAX_ATTACHMENTS_PER_RELEASE) throw new WorkflowConflictError('This release already has the maximum of 25 attachments.');
  if (category === 'ci_manifest' || category === 'ci_report') throw new InvalidRequestError('CI attachments must be imported as one CI evidence bundle.');
  const supersedesValue=form.get('supersedesAttachmentId');const supersedes=typeof supersedesValue === 'string' && supersedesValue.length > 0 ? supersedesValue : null;
  if (supersedes) { const prior=await db.prepare('SELECT id,category FROM release_attachments WHERE id=? AND release_id=?').bind(supersedes,release.id).first<{ id:string;category:string }>();if (!prior || prior.category !== category) throw new WorkflowConflictError('A replacement must target a current attachment in the same category.');const replacement=await db.prepare('SELECT id FROM release_attachments WHERE supersedes_attachment_id=?').bind(supersedes).first<{ id:string }>();if (replacement) throw new WorkflowConflictError('That attachment has already been superseded.'); }
  const bytes=await file.arrayBuffer();const sha256=await sha256Hex(bytes);const id=makeId('ATT');const objectKey=`releases/${release.id}/${id}`;const createdAt=now();
  await bucket.put(objectKey,bytes,{ httpMetadata:{ contentType:file.type },customMetadata:{ filename:normalizeFilename(file.name),sha256 } });
  try { await db.prepare('INSERT INTO release_attachments (id,release_id,category,filename,content_type,size,sha256,object_key,supersedes_attachment_id,ci_evidence_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,NULL,?,?)').bind(id,release.id,category,normalizeFilename(file.name),file.type,file.size,sha256,objectKey,supersedes,actor,createdAt).run(); }
  catch (error:unknown) { await bucket.delete(objectKey);throw error; }
  await appendAudit(db,{ releaseId:release.id,entityType:'release_attachment',entityId:id,action:'release_attachment_uploaded',actor,createdAt,changes:[{ field:'attachment',oldValue:null,newValue:{ category,filename:normalizeFilename(file.name),size:file.size,sha256 } }],references:{ supersedesAttachmentId:supersedes ?? '' } });
  return getFinalizationWorkspace(db,release.id);
}

export async function downloadReleaseAttachment(db:D1Database,bucket:R2Bucket,id:string):Promise<Response|null> {
  await ensureWorkspace(db);const attachment=await db.prepare('SELECT filename,content_type AS contentType,object_key AS objectKey,sha256 FROM release_attachments WHERE id=?').bind(id).first<{ filename:string;contentType:string;objectKey:string;sha256:string }>();if (!attachment) return null;
  const object=await bucket.get(attachment.objectKey);if (!object) return null;
  const safeName=attachment.filename.replaceAll('"','_');return new Response(object.body,{ headers:{ 'content-type':attachment.contentType,'content-disposition':`attachment; filename="${safeName}"`,'etag':attachment.sha256,'x-content-type-options':'nosniff' } });
}

export async function importCiEvidence(db:D1Database,bucket:R2Bucket,releaseId:string,form:FormData) {
  await ensureWorkspace(db);const actor=z.literal(demoActor('author')).parse(formText(form,'actor'));const release=await finalizableRelease(db,releaseId);const manifestFile=formFile(form,'manifest');validateAttachmentFile(manifestFile);
  if (manifestFile.type !== 'application/json') throw new InvalidRequestError('The CI manifest must be a JSON file.');
  const reportValues=form.getAll('reports');const reports:File[]=reportValues.map((value) => { if (!(value instanceof File)) throw new InvalidRequestError('Each CI report must be a file.');validateAttachmentFile(value);return value; });
  if (reports.length < 1) throw new InvalidRequestError('At least one CI report is required.');
  if (await attachmentCount(db,release.id)+reports.length+1 > MAX_ATTACHMENTS_PER_RELEASE) throw new WorkflowConflictError('The CI bundle would exceed the 25-attachment release limit.');
  let manifestUnknown:unknown;try { manifestUnknown=JSON.parse(await manifestFile.text()); } catch { throw new InvalidRequestError('The CI manifest is not valid JSON.'); }
  const manifest=CiManifestSchema.parse(manifestUnknown);const normalizedReports=new Map<string,File>();for (const report of reports) { const name=normalizeFilename(report.name);if (normalizedReports.has(name)) throw new InvalidRequestError('CI report filenames must be unique.');normalizedReports.set(name,report); }
  const errors:string[]=[];if (manifest.commitSha !== release.codeRevision) errors.push('The manifest commit SHA does not match the release code revision.');
  if (manifest.conclusion !== 'success') errors.push('The CI run did not conclude successfully.');
  for (const check of manifest.checks) if (check.conclusion !== 'success') errors.push(`Required check ${check.name} did not pass.`);
  if (manifest.reports.length !== reports.length) errors.push('The uploaded report count does not match the manifest.');
  const reportBytes=new Map<string,{ file:File;bytes:ArrayBuffer;sha256:string }>();
  for (const expected of manifest.reports) { const file=normalizedReports.get(normalizeFilename(expected.filename));if (!file) { errors.push(`Missing report ${expected.filename}.`);continue; }const bytes=await file.arrayBuffer();const sha256=await sha256Hex(bytes);if (sha256 !== expected.sha256) errors.push(`Hash mismatch for ${expected.filename}.`);reportBytes.set(normalizeFilename(expected.filename),{ file,bytes,sha256 }); }
  for (const name of normalizedReports.keys()) if (!manifest.reports.some((expected) => normalizeFilename(expected.filename) === name)) errors.push(`Unexpected report ${name}.`);
  const ciId=makeId('CIE');const manifestAttachmentId=makeId('ATT');const createdAt=now();const manifestBytes=await manifestFile.arrayBuffer();const manifestSha=await sha256Hex(manifestBytes);const predecessor=await db.prepare('SELECT id FROM ci_evidence_records WHERE release_id=? ORDER BY created_at DESC,id DESC LIMIT 1').bind(release.id).first<{ id:string }>();
  const stored:Array<{ id:string;objectKey:string }>=[];const statements:D1PreparedStatement[]=[];
  const store=async (id:string,file:File,bytes:ArrayBuffer,sha256:string,category:'ci_manifest'|'ci_report') => { const objectKey=`releases/${release.id}/${id}`;await bucket.put(objectKey,bytes,{ httpMetadata:{ contentType:file.type },customMetadata:{ filename:normalizeFilename(file.name),sha256 } });stored.push({ id,objectKey });statements.push(db.prepare('INSERT INTO release_attachments (id,release_id,category,filename,content_type,size,sha256,object_key,supersedes_attachment_id,ci_evidence_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,NULL,?,?,?)').bind(id,release.id,category,normalizeFilename(file.name),file.type,file.size,sha256,objectKey,ciId,actor,createdAt)); };
  await store(manifestAttachmentId,manifestFile,manifestBytes,manifestSha,'ci_manifest');
  for (const report of reports) { const entry=reportBytes.get(normalizeFilename(report.name));const bytes=entry?.bytes ?? await report.arrayBuffer();const sha=entry?.sha256 ?? await sha256Hex(bytes);await store(makeId('ATT'),report,bytes,sha,'ci_report'); }
  statements.push(db.prepare('INSERT INTO ci_evidence_records (id,release_id,manifest_attachment_id,manifest_json,commit_sha,conclusion,validation_status,validation_error,supersedes_ci_evidence_id,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(ciId,release.id,manifestAttachmentId,JSON.stringify(manifest),manifest.commitSha,manifest.conclusion,errors.length === 0 ? 'valid' : 'invalid',errors.length === 0 ? null : errors.join(' '),predecessor?.id ?? null,actor,createdAt));
  try { await db.batch(statements); } catch (error:unknown) { await Promise.all(stored.map((item) => bucket.delete(item.objectKey)));throw error; }
  await appendAudit(db,{ releaseId:release.id,entityType:'ci_evidence',entityId:ciId,action:errors.length === 0 ? 'ci_evidence_imported' : 'ci_evidence_imported_invalid',actor,createdAt,changes:[{ field:'validationStatus',oldValue:null,newValue:errors.length === 0 ? 'valid' : 'invalid' }],references:{ manifestAttachmentId,commitSha:manifest.commitSha,predecessorCiEvidenceId:predecessor?.id ?? '' } });
  return getFinalizationWorkspace(db,release.id);
}

export async function decideCiEvidence(db:D1Database,ciEvidenceId:string,raw:unknown) {
  await ensureWorkspace(db);const input=CiDecisionInputSchema.parse(raw);const record=await db.prepare('SELECT id,release_id AS releaseId,validation_status AS validationStatus FROM ci_evidence_records WHERE id=?').bind(ciEvidenceId).first<{ id:string;releaseId:string;validationStatus:string }>();if (!record) return null;await finalizableRelease(db,record.releaseId);
  const current=await db.prepare('SELECT id FROM ci_evidence_records WHERE release_id=? ORDER BY created_at DESC,id DESC LIMIT 1').bind(record.releaseId).first<{ id:string }>();if (current?.id !== record.id) throw new WorkflowConflictError('Only the current CI evidence import can be reviewed.');if (input.decision === 'accepted' && record.validationStatus !== 'valid') throw new WorkflowConflictError('Invalid CI evidence cannot be accepted.');
  const id=makeId('CID');const createdAt=now();await db.prepare('INSERT INTO ci_evidence_decisions (id,ci_evidence_id,decision,reason,actor,created_at) VALUES (?,?,?,?,?,?)').bind(id,record.id,input.decision,input.reason,input.actor,createdAt).run();
  await appendAudit(db,{ releaseId:record.releaseId,entityType:'ci_evidence',entityId:record.id,action:`ci_evidence_${input.decision}`,actor:input.actor,reason:input.reason,createdAt,changes:[{ field:'decision',oldValue:null,newValue:input.decision }],references:{ decisionId:id } });return getFinalizationWorkspace(db,record.releaseId);
}

export async function attestResidualRisk(db:D1Database,releaseId:string,raw:unknown) {
  await ensureWorkspace(db);const input=RiskAcceptanceInputSchema.parse(raw);const release=await finalizableRelease(db,releaseId);const state=await buildFinalReadinessInput(db,release);
  const incomplete=state.risks.some((risk) => risk.assessmentId === null || risk.classification === 'unacceptable' || risk.decision !== 'accepted');if (incomplete) throw new WorkflowConflictError('Every current residual-risk assessment must be acceptable and QA accepted.');if (state.riskSupport.length === 0) throw new WorkflowConflictError('At least one current risk-support attachment is required.');
  const fingerprint=riskAcceptanceFingerprint({ risks:state.risks,riskSupport:state.riskSupport });const id=makeId('ATTST');const createdAt=now();
  await db.prepare('INSERT INTO prototype_attestations (id,release_id,kind,statement_version,statement,actor,role,reason,input_fingerprint,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,release.id,'residual_risk_acceptance',RISK_ATTESTATION.version,RISK_ATTESTATION.statement,input.actor,'qa',input.reason,fingerprint,createdAt).run();
  await appendAudit(db,{ releaseId:release.id,entityType:'prototype_attestation',entityId:id,action:'residual_risk_attested',actor:input.actor,reason:input.reason,createdAt,changes:[{ field:'attestation',oldValue:null,newValue:'residual_risk_acceptance' }],references:{ inputFingerprint:fingerprint,statementVersion:RISK_ATTESTATION.version } });return getFinalizationWorkspace(db,release.id);
}

export async function runFinalReadiness(db:D1Database,releaseId:string,raw:unknown) {
  await ensureWorkspace(db);const input=RunFinalReadinessInputSchema.parse(raw);const release=await finalizableRelease(db,releaseId);const evaluation=evaluateFinalReadiness(await buildFinalReadinessInput(db,release));const id=makeId('FRN');const createdAt=now();const statements:D1PreparedStatement[]=[db.prepare('INSERT INTO final_readiness_runs (id,release_id,policy_id,policy_version,input_fingerprint,status,actor,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,release.id,FINAL_RELEASE_POLICY.id,FINAL_RELEASE_POLICY.version,evaluation.inputFingerprint,evaluation.status,input.actor,createdAt)];
  for (const result of evaluation.results) statements.push(db.prepare('INSERT INTO final_readiness_results (run_id,result_id,code,severity,status,subject_id,title,detail) VALUES (?,?,?,?,?,?,?,?)').bind(id,result.id,result.code,result.severity,result.status,result.subjectId,result.title,result.detail));await db.batch(statements);
  await appendAudit(db,{ releaseId:release.id,entityType:'final_readiness_run',entityId:id,action:'final_readiness_evaluated',actor:input.actor,createdAt,changes:[{ field:'status',oldValue:null,newValue:evaluation.status }],references:{ inputFingerprint:evaluation.inputFingerprint,policyId:FINAL_RELEASE_POLICY.id } });return getFinalizationWorkspace(db,release.id);
}

export async function approveFinalRelease(db:D1Database,releaseId:string,raw:unknown) {
  await ensureWorkspace(db);const input=ApproveFinalReleaseInputSchema.parse(raw);const release=await finalizableRelease(db,releaseId);const run=await getFinalReadinessRun(db,input.finalReadinessRunId,release);if (!run || run.status !== 'ready' || run.stale || run.results.some((result) => result.status === 'block')) throw new WorkflowConflictError('Run a fresh passing final-release check before approval.');
  const id=makeId('ATTST');const createdAt=now();const results=await db.batch([
    db.prepare('INSERT INTO prototype_attestations (id,release_id,kind,statement_version,statement,actor,role,reason,input_fingerprint,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,release.id,'final_release_approval',FINAL_RELEASE_ATTESTATION.version,FINAL_RELEASE_ATTESTATION.statement,input.actor,'release_approver',input.reason,run.inputFingerprint,createdAt),
    db.prepare("UPDATE releases SET status='release_approved',final_readiness_run_id=?,release_approved_by=?,release_approved_at=? WHERE id=? AND status='verification_ready'").bind(run.id,input.actor,createdAt,release.id),
  ]);if ((results[1]?.meta.changes ?? 0) !== 1) throw new WorkflowConflictError('The release state changed before final approval.');
  await appendAudit(db,{ releaseId:release.id,entityType:'release',entityId:release.id,action:'fictional_release_approved',actor:input.actor,reason:input.reason,createdAt,changes:[{ field:'status',oldValue:'verification_ready',newValue:'release_approved' }],references:{ finalReadinessRunId:run.id,inputFingerprint:run.inputFingerprint,attestationId:id } });return getFinalizationWorkspace(db,release.id);
}

export async function deleteReleaseObjects(db:D1Database,bucket:R2Bucket):Promise<void> {
  await ensureWorkspace(db);const objects=await db.prepare('SELECT object_key AS objectKey FROM release_attachments').all<{ objectKey:string }>();if (objects.results.length > 0) await bucket.delete(objects.results.map((entry) => entry.objectKey));
}
