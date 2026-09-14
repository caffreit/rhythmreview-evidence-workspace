import { z } from 'zod';
import { AuthorActorSchema, DemoActorSchema, QaActorSchema, ReleaseApproverActorSchema } from './actors';
import { EvidenceIdSchema } from './domain';
import { ReleaseRecordSchema } from './verification';

export const FINAL_RELEASE_POLICY = { id:'final-release-v1',version:'1.0',title:'Residual risk and final release readiness' } as const;
export const RISK_ATTESTATION = {
  version:'1.0',
  statement:'I confirm that I reviewed every current residual-risk assessment for this fictional release and accept the recorded residual risk under the prototype policy.',
} as const;
export const FINAL_RELEASE_ATTESTATION = {
  version:'1.0',
  statement:'I confirm that I reviewed the current release gate and approve this fictional release record. This is not production authorization or a compliant electronic signature.',
} as const;

export const ResidualRiskClassificationSchema = z.enum(['acceptable','benefit_risk_required','unacceptable']);
export const ReviewDecisionSchema = z.object({ id:z.string(),decision:z.enum(['accepted','rejected']),reason:z.string(),actor:z.string(),createdAt:z.string() });
export const ResidualRiskAssessmentSchema = z.object({
  id:z.string(),releaseId:z.string(),hazardItemId:EvidenceIdSchema,hazardVersionId:z.string(),revision:z.number().int().positive(),
  classification:ResidualRiskClassificationSchema,rationale:z.string(),benefitRiskConclusion:z.string().nullable(),createdBy:z.string(),createdAt:z.string(),decision:ReviewDecisionSchema.nullable(),
});
export const RiskControlStatusSchema = z.object({ id:EvidenceIdSchema,title:z.string(),statement:z.string(),verification:z.enum(['accepted_pass','missing_or_not_accepted']) });
export const ResidualRiskViewSchema = z.object({
  hazard:z.object({ id:EvidenceIdSchema,versionId:z.string(),title:z.string(),statement:z.string() }),linkedControls:z.array(RiskControlStatusSchema),
  current:ResidualRiskAssessmentSchema.nullable(),history:z.array(ResidualRiskAssessmentSchema),
});

export const AttachmentCategorySchema = z.enum(['risk_support','ci_manifest','ci_report','release_support']);
export const ReleaseAttachmentSchema = z.object({
  id:z.string(),releaseId:z.string(),category:AttachmentCategorySchema,filename:z.string(),contentType:z.string(),size:z.number().int().positive(),sha256:z.string().regex(/^[a-f0-9]{64}$/),
  objectKey:z.string(),supersedesAttachmentId:z.string().nullable(),ciEvidenceId:z.string().nullable(),createdBy:z.string(),createdAt:z.string(),superseded:z.boolean(),
});
export const CiManifestSchema = z.object({
  schema:z.literal('ci-evidence-v1'),provider:z.literal('github_actions'),repository:z.string().min(3).max(300),workflow:z.string().min(1).max(200),
  runId:z.string().min(1).max(100),runAttempt:z.number().int().positive(),runUrl:z.string().url(),commitSha:z.string().regex(/^[a-f0-9]{40}$/),
  startedAt:z.string().datetime(),completedAt:z.string().datetime(),conclusion:z.enum(['success','failure','cancelled']),
  checks:z.array(z.object({ name:z.string().min(1).max(200),conclusion:z.enum(['success','failure','cancelled']) })).min(1),
  reports:z.array(z.object({ filename:z.string().min(1).max(240),sha256:z.string().regex(/^[a-f0-9]{64}$/) })).min(1),
}).strict().superRefine((value,context) => {
  if (Date.parse(value.completedAt) < Date.parse(value.startedAt)) context.addIssue({ code:'custom',path:['completedAt'],message:'The CI completion time must not precede its start time.' });
  if (new Set(value.reports.map((report) => report.filename)).size !== value.reports.length) context.addIssue({ code:'custom',path:['reports'],message:'CI report filenames must be unique.' });
});
export const CiEvidenceSchema = z.object({
  id:z.string(),releaseId:z.string(),manifestAttachmentId:z.string(),manifest:CiManifestSchema,commitSha:z.string(),conclusion:z.string(),
  validationStatus:z.enum(['valid','invalid']),validationError:z.string().nullable(),supersedesCiEvidenceId:z.string().nullable(),createdBy:z.string(),createdAt:z.string(),decision:ReviewDecisionSchema.nullable(),
});
export const PrototypeAttestationSchema = z.object({
  id:z.string(),releaseId:z.string(),kind:z.enum(['residual_risk_acceptance','final_release_approval']),statementVersion:z.literal('1.0'),statement:z.string(),actor:z.string(),
  role:z.enum(['qa','release_approver']),reason:z.string(),inputFingerprint:z.string(),createdAt:z.string(),current:z.boolean(),
});
export const FinalReadinessResultSchema = z.object({ id:z.string(),code:z.string(),severity:z.enum(['blocker','warning']),status:z.enum(['pass','block','warn']),subjectId:z.string(),title:z.string(),detail:z.string() });
export const FinalReadinessRunSchema = z.object({
  id:z.string(),releaseId:z.string(),policyId:z.literal(FINAL_RELEASE_POLICY.id),policyVersion:z.literal(FINAL_RELEASE_POLICY.version),inputFingerprint:z.string(),
  status:z.enum(['blocked','ready']),actor:z.string(),createdAt:z.string(),stale:z.boolean(),results:z.array(FinalReadinessResultSchema),
});
export const ReleaseAuditEventSchema = z.object({ id:z.string(),entityType:z.string(),entityId:z.string(),action:z.string(),actor:z.string(),details:z.unknown(),createdAt:z.string() });
export const FinalizationWorkspaceSchema = z.object({
  release:ReleaseRecordSchema,risks:z.array(ResidualRiskViewSchema),attachments:z.array(ReleaseAttachmentSchema),ciEvidence:z.array(CiEvidenceSchema),
  attestations:z.array(PrototypeAttestationSchema),latestFinalReadiness:FinalReadinessRunSchema.nullable(),audit:z.array(ReleaseAuditEventSchema),
});

export const UpsertResidualRiskInputSchema = z.object({
  actor:AuthorActorSchema,hazardItemId:EvidenceIdSchema,classification:ResidualRiskClassificationSchema,rationale:z.string().min(8).max(3000),
  benefitRiskConclusion:z.string().min(8).max(3000).nullable(),
}).strict().superRefine((value,context) => {
  if (value.classification === 'benefit_risk_required' && !value.benefitRiskConclusion) context.addIssue({ code:'custom',path:['benefitRiskConclusion'],message:'A benefit-risk conclusion is required.' });
  if (value.classification !== 'benefit_risk_required' && value.benefitRiskConclusion) context.addIssue({ code:'custom',path:['benefitRiskConclusion'],message:'A benefit-risk conclusion is valid only for benefit-risk review.' });
});
export const RiskDecisionInputSchema = z.object({ actor:QaActorSchema,decision:z.enum(['accepted','rejected']),reason:z.string().min(2).max(1000) }).strict();
export const CiDecisionInputSchema = RiskDecisionInputSchema;
export const RiskAcceptanceInputSchema = z.object({ actor:QaActorSchema,reason:z.string().min(2).max(1000),statementVersion:z.literal(RISK_ATTESTATION.version),confirmation:z.literal(true) }).strict();
export const RunFinalReadinessInputSchema = z.object({ actor:DemoActorSchema }).strict();
export const ApproveFinalReleaseInputSchema = z.object({ actor:ReleaseApproverActorSchema,reason:z.string().min(2).max(1000),statementVersion:z.literal(FINAL_RELEASE_ATTESTATION.version),finalReadinessRunId:z.string().min(1),confirmation:z.literal(true) }).strict();

export type ResidualRiskAssessment = z.infer<typeof ResidualRiskAssessmentSchema>;
export type ReleaseAttachment = z.infer<typeof ReleaseAttachmentSchema>;
export type CiManifest = z.infer<typeof CiManifestSchema>;
export type CiEvidence = z.infer<typeof CiEvidenceSchema>;
export type PrototypeAttestation = z.infer<typeof PrototypeAttestationSchema>;
export type FinalReadinessResult = z.infer<typeof FinalReadinessResultSchema>;
export type FinalReadinessRun = z.infer<typeof FinalReadinessRunSchema>;
export type FinalizationWorkspace = z.infer<typeof FinalizationWorkspaceSchema>;

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_RELEASE = 25;
const ALLOWED_CONTENT_TYPES = new Set(['application/pdf','application/json','text/plain','text/csv','application/xml','text/xml','application/zip','application/x-zip-compressed']);

export function normalizeFilename(value:string):string {
  const normalized = value.normalize('NFKC').replaceAll('\\','/').split('/').at(-1)?.replace(/[^A-Za-z0-9._ -]/g,'_').replace(/\s+/g,' ').trim() ?? '';
  if (!normalized || normalized === '.' || normalized === '..' || normalized.length > 240) throw new Error('The attachment filename is invalid.');
  return normalized;
}

export function validateAttachmentFile(file:File):void {
  if (file.size < 1) throw new Error('Attachments must not be empty.');
  if (file.size > MAX_ATTACHMENT_SIZE) throw new Error('Attachments must be 10 MB or smaller.');
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) throw new Error('This attachment type is not allowed.');
  normalizeFilename(file.name);
}

export async function sha256Hex(value:ArrayBuffer):Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256',value);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2,'0')).join('');
}

function stableHash(value:string):string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index);hash = Math.imul(hash,16777619); }
  return (hash >>> 0).toString(16).padStart(8,'0');
}

export type FinalReadinessInput = {
  release:{ id:string;status:'planned'|'verification_ready'|'release_approved';readinessRunId:string|null };
  verification:{ status:'ready'|'blocked'|null;stale:boolean };
  policyViolationIds:string[];highGapIds:string[];
  highCoherenceFindings:Array<{ id:string;title:string;waived:boolean }>;
  mediumCoherenceFindings:Array<{ id:string;title:string }>;
  risks:Array<{ hazardId:string;assessmentId:string|null;classification:z.infer<typeof ResidualRiskClassificationSchema>|null;decisionId:string|null;decision:'accepted'|'rejected'|null }>;
  riskSupport:Array<{ id:string;sha256:string }>;
  attachments:Array<{ id:string;category:z.infer<typeof AttachmentCategorySchema>;sha256:string }>;
  ci:{ id:string;validationStatus:'valid'|'invalid';decisionId:string|null;decision:'accepted'|'rejected'|null }|null;
  riskAttestation:{ id:string;current:boolean }|null;
};

export function finalReadinessFingerprint(input:FinalReadinessInput):string {
  const canonical = {
    release:{ id:input.release.id,readinessRunId:input.release.readinessRunId },verification:input.verification,
    violations:[...input.policyViolationIds].sort(),gaps:[...input.highGapIds].sort(),
    high:[...input.highCoherenceFindings].sort((a,b) => a.id.localeCompare(b.id)),medium:[...input.mediumCoherenceFindings].sort((a,b) => a.id.localeCompare(b.id)),
    risks:[...input.risks].sort((a,b) => a.hazardId.localeCompare(b.hazardId)),support:[...input.riskSupport].sort((a,b) => a.id.localeCompare(b.id)),
    attachments:[...input.attachments].sort((a,b) => a.id.localeCompare(b.id)),ci:input.ci,attestation:input.riskAttestation,
  };
  return `FRF-${stableHash(JSON.stringify(canonical))}`;
}

export function riskAcceptanceFingerprint(input:Pick<FinalReadinessInput,'risks'|'riskSupport'>):string {
  return `RAF-${stableHash(JSON.stringify({ risks:[...input.risks].sort((a,b) => a.hazardId.localeCompare(b.hazardId)),support:[...input.riskSupport].sort((a,b) => a.id.localeCompare(b.id)) }))}`;
}

export function evaluateFinalReadiness(input:FinalReadinessInput):{ inputFingerprint:string;status:'blocked'|'ready';results:FinalReadinessResult[] } {
  const results:FinalReadinessResult[] = [];
  const add = (result:FinalReadinessResult) => results.push(result);
  const verificationPass = input.release.status !== 'planned' && input.verification.status === 'ready' && !input.verification.stale && Boolean(input.release.readinessRunId);
  add({ id:'VERIFICATION',code:'FR-VER-001',severity:'blocker',status:verificationPass ? 'pass' : 'block',subjectId:input.release.id,title:verificationPass ? 'Verification readiness current' : 'Verification readiness missing or stale',detail:verificationPass ? 'The accepted WP-20A readiness run still matches its inputs.' : 'A current accepted WP-20A readiness run is required.' });
  add({ id:'TRACEABILITY',code:'FR-TRC-001',severity:'blocker',status:input.policyViolationIds.length === 0 && input.highGapIds.length === 0 ? 'pass' : 'block',subjectId:input.release.id,title:input.policyViolationIds.length === 0 && input.highGapIds.length === 0 ? 'Traceability gate passed' : 'Traceability blockers remain',detail:`${input.policyViolationIds.length} relationship-policy violations and ${input.highGapIds.length} high coverage gaps.` });
  const highOpen = input.highCoherenceFindings.filter((finding) => !finding.waived);
  add({ id:'COHERENCE',code:'FR-COH-001',severity:'blocker',status:highOpen.length === 0 ? 'pass' : 'block',subjectId:input.release.id,title:highOpen.length === 0 ? 'Required coherence review complete' : 'High coherence findings remain',detail:highOpen.length === 0 ? 'No unwaived high finding remains.' : highOpen.map((finding) => finding.title).join('; ') });
  for (const finding of input.mediumCoherenceFindings) add({ id:`WARNING-${finding.id}`,code:'FR-COH-002',severity:'warning',status:'warn',subjectId:finding.id,title:finding.title,detail:'Medium findings remain visible for the final decision.' });
  for (const risk of input.risks) {
    const accepted = risk.assessmentId !== null && risk.classification !== 'unacceptable' && risk.decision === 'accepted';
    add({ id:`RISK-${risk.hazardId}`,code:'FR-RSK-001',severity:'blocker',status:accepted ? 'pass' : 'block',subjectId:risk.hazardId,title:accepted ? 'Residual risk accepted' : 'Residual risk unresolved',detail:accepted ? `${risk.hazardId} has a current QA-accepted assessment.` : `${risk.hazardId} needs a current acceptable QA decision.` });
  }
  add({ id:'RISK-SUPPORT',code:'FR-ATT-001',severity:'blocker',status:input.riskSupport.length > 0 ? 'pass' : 'block',subjectId:input.release.id,title:input.riskSupport.length > 0 ? 'Risk support attached' : 'Risk support missing',detail:input.riskSupport.length > 0 ? `${input.riskSupport.length} current risk-support attachment(s) are hashed and stored.` : 'Attach at least one current risk-support file.' });
  const ciAccepted = input.ci?.validationStatus === 'valid' && input.ci.decision === 'accepted';
  add({ id:'CI-EVIDENCE',code:'FR-CI-001',severity:'blocker',status:ciAccepted ? 'pass' : 'block',subjectId:input.ci?.id ?? input.release.id,title:ciAccepted ? 'CI evidence accepted' : 'CI evidence unresolved',detail:ciAccepted ? 'The current valid CI bundle has QA acceptance.' : 'Import a valid CI bundle and obtain QA acceptance.' });
  add({ id:'RISK-ATTESTATION',code:'FR-SIG-001',severity:'blocker',status:input.riskAttestation?.current ? 'pass' : 'block',subjectId:input.riskAttestation?.id ?? input.release.id,title:input.riskAttestation?.current ? 'Residual-risk attestation current' : 'Residual-risk attestation missing or stale',detail:input.riskAttestation?.current ? 'QA attested to the current accepted risk set.' : 'QA must attest after the current risk set is complete.' });
  return { inputFingerprint:finalReadinessFingerprint(input),status:results.some((result) => result.status === 'block') ? 'blocked' : 'ready',results };
}
