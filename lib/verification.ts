import { z } from 'zod';
import { CriticalitySchema, EvidenceIdSchema, QaActorSchema, AuthorActorSchema } from './domain';

export const RELEASE_READINESS_POLICY = { id:'release-readiness-v1',version:'1.0',title:'Risk-control verification readiness' } as const;

export const GUIDED_VERIFICATION_PACKAGE = {
  kind:'verification_package' as const,
  title:'Close risk-control verification gaps',
  rationale:'Make the three uncovered risk controls objectively verifiable and add controlled verification plans before release-readiness review.',
  controlUpdates:[
    { itemId:'RC-001' as const,proposedText:'Release testing shall demonstrate sensitivity of at least 90% for the intended population.',reason:'Replace the undefined approved threshold with the fictional WP-20A acceptance value.' },
    { itemId:'RC-002' as const,proposedText:'Release testing shall demonstrate specificity of at least 85% for the intended population.',reason:'Replace the undefined approved threshold with the fictional WP-20A acceptance value.' },
  ],
  plans:[
    { targetRiskControlId:'RC-001' as const,title:'Sensitivity acceptance verification',objective:'Demonstrate that sensitivity meets the approved threshold for the intended population.',method:'Run the locked fictional evaluation set against the candidate build and calculate sensitivity from approved reference classifications.',acceptanceCriteria:'Sensitivity is at least 90%, all included records have approved reference classifications, and no calculation errors remain.',rationale:'Provides direct release verification for the false-negative risk control.' },
    { targetRiskControlId:'RC-002' as const,title:'Specificity acceptance verification',objective:'Demonstrate that specificity meets the approved threshold for the intended population.',method:'Run the locked fictional evaluation set against the candidate build and calculate specificity from approved reference classifications.',acceptanceCriteria:'Specificity is at least 85%, all included records have approved reference classifications, and no calculation errors remain.',rationale:'Provides direct release verification for the false-positive risk control.' },
    { targetRiskControlId:'RC-005' as const,title:'Adult population restriction verification',objective:'Demonstrate that the product and controlled labelling restrict use to adults aged 22 and over.',method:'Exercise age values 21, 22, and 23, inspect interface enforcement, and compare the displayed limitation with controlled labelling.',acceptanceCriteria:'Age 21 is rejected, ages 22 and 23 are accepted, the adult-only limitation is displayed, and no bypass path is observed.',rationale:'Provides the missing direct verification for the adult-population restriction.' },
  ],
};

const VerificationPlanCandidateBaseSchema = z.object({
  id:z.string(),changeId:z.string(),proposedItemId:EvidenceIdSchema,targetRiskControlId:EvidenceIdSchema,relationshipProposalId:z.string(),
  title:z.string(),objective:z.string(),method:z.string(),acceptanceCriteria:z.string(),rationale:z.string(),revision:z.number().int().positive(),
  createdBy:z.string(),createdAt:z.string(),updatedBy:z.string().nullable(),updateReason:z.string().nullable(),updatedAt:z.string().nullable(),
});
export const VerificationPlanCandidateSchema = z.discriminatedUnion('status',[
  VerificationPlanCandidateBaseSchema.extend({ status:z.literal('proposed') }),
  VerificationPlanCandidateBaseSchema.extend({ status:z.literal('approved') }),
  VerificationPlanCandidateBaseSchema.extend({ status:z.literal('rejected') }),
]);

export const ExecutionDecisionSchema = z.object({ decision:z.enum(['accepted','rejected']),reason:z.string(),actor:z.string(),createdAt:z.string() });
const VerificationExecutionBaseSchema = z.object({
  id:z.string(),releaseId:z.string(),baselineId:z.string(),testItemId:EvidenceIdSchema,testVersionId:z.string(),
  environment:z.string(),buildId:z.string(),observedResult:z.string(),executedAt:z.string(),evidenceReference:z.string(),createdBy:z.string(),createdAt:z.string(),
  decision:ExecutionDecisionSchema.nullable(),
});
export const VerificationExecutionSchema = z.discriminatedUnion('outcome',[
  VerificationExecutionBaseSchema.extend({ outcome:z.literal('passed') }),
  VerificationExecutionBaseSchema.extend({ outcome:z.literal('failed') }),
]);

const ReleaseBaseSchema = z.object({ id:z.string(),label:z.string(),baselineId:z.string(),codeRevision:z.string(),createdBy:z.string(),createdAt:z.string() });
export const ReleaseRecordSchema = z.discriminatedUnion('status',[
  ReleaseBaseSchema.extend({ status:z.literal('planned'),readinessRunId:z.null(),verificationReadyBy:z.null(),verificationReadyAt:z.null() }),
  ReleaseBaseSchema.extend({ status:z.literal('verification_ready'),readinessRunId:z.string(),verificationReadyBy:z.string(),verificationReadyAt:z.string() }),
]);

export const ReadinessResultSchema = z.object({
  id:z.string(),code:z.string(),severity:z.enum(['blocker','warning']),status:z.enum(['pass','block','warn']),subjectId:z.string(),title:z.string(),detail:z.string(),
});
export const ReadinessRunSchema = z.object({
  id:z.string(),releaseId:z.string(),baselineId:z.string(),policyId:z.literal(RELEASE_READINESS_POLICY.id),policyVersion:z.literal(RELEASE_READINESS_POLICY.version),
  inputFingerprint:z.string(),status:z.enum(['blocked','ready']),actor:z.string(),createdAt:z.string(),stale:z.boolean(),results:z.array(ReadinessResultSchema),
});

export const VerificationPlanViewSchema = z.object({
  riskControl:z.object({ id:EvidenceIdSchema,title:z.string(),statement:z.string(),criticality:CriticalitySchema }),
  test:z.object({ id:EvidenceIdSchema,versionId:z.string(),title:z.string(),statement:z.string() }),
  details:z.object({ objective:z.string(),method:z.string(),acceptanceCriteria:z.string() }).nullable(),changeId:z.string().nullable(),latestExecution:VerificationExecutionSchema.nullable(),
});
export const VerificationWorkspaceSchema = z.object({
  baseline:z.object({ id:z.string(),label:z.string(),status:z.string() }),
  highGapCount:z.number(),gaps:z.array(z.object({ id:z.string(),severity:z.enum(['high','medium']),itemId:EvidenceIdSchema,title:z.string(),actual:z.string() })),
  plans:z.array(VerificationPlanViewSchema),openPackageChangeId:z.string().nullable(),plannedRelease:ReleaseRecordSchema.nullable(),
});
export const ReleaseWorkspaceSchema = z.object({ releases:z.array(ReleaseRecordSchema),latestReadiness:ReadinessRunSchema.nullable() });

export const CreateReleaseInputSchema = z.object({ actor:AuthorActorSchema,baselineId:z.string().min(1),label:z.string().min(3).max(140),codeRevision:z.string().min(2).max(200) }).strict();
export const CreateVerificationExecutionInputSchema = z.object({
  actor:AuthorActorSchema,releaseId:z.string().min(1),testItemId:EvidenceIdSchema,outcome:z.enum(['passed','failed']),environment:z.string().min(2).max(500),
  buildId:z.string().min(2).max(200),observedResult:z.string().min(8).max(4000),executedAt:z.string().datetime(),evidenceReference:z.string().min(2).max(500),
}).strict();
export const ReviewVerificationExecutionInputSchema = z.object({ actor:QaActorSchema,decision:z.enum(['accepted','rejected']),reason:z.string().min(2).max(1000) }).strict();
export const RunReleaseReadinessInputSchema = z.object({ actor:z.union([AuthorActorSchema,QaActorSchema]) }).strict();
export const MarkVerificationReadyInputSchema = z.object({ actor:QaActorSchema,readinessRunId:z.string().min(1),confirmation:z.literal(true) }).strict();

export type VerificationPlanCandidate = z.infer<typeof VerificationPlanCandidateSchema>;
export type VerificationExecution = z.infer<typeof VerificationExecutionSchema>;
export type ReleaseRecord = z.infer<typeof ReleaseRecordSchema>;
export type ReadinessResult = z.infer<typeof ReadinessResultSchema>;
export type ReadinessRun = z.infer<typeof ReadinessRunSchema>;
export type VerificationWorkspace = z.infer<typeof VerificationWorkspaceSchema>;
export type ReleaseWorkspace = z.infer<typeof ReleaseWorkspaceSchema>;

export type ReadinessInput = {
  baseline:{ id:string;items:Array<{ id:string;versionId:string;type:string }> };
  relationships:Array<{ id:string;sourceId:string;targetId:string;type:string }>;
  policyViolations:Array<{ id:string;detail:string }>;
  coverageGaps:Array<{ id:string;severity:'high'|'medium';itemId:string;title:string;actual:string }>;
  planLinks:Array<{ relationshipId:string;testItemId:string;testVersionId:string;riskControlId:string }>;
  executions:VerificationExecution[];
};

function stableHash(value:string):string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index);hash = Math.imul(hash,16777619); }
  return (hash >>> 0).toString(16).padStart(8,'0');
}

function latestExecution(executions:VerificationExecution[]):VerificationExecution|null {
  return [...executions].sort((left,right) => right.executedAt.localeCompare(left.executedAt) || right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id))[0] ?? null;
}

export function readinessInputFingerprint(input:ReadinessInput):string {
  const canonical = {
    baselineId:input.baseline.id,items:[...input.baseline.items].sort((a,b) => a.id.localeCompare(b.id)),
    relationships:[...input.relationships].sort((a,b) => a.id.localeCompare(b.id)),
    violations:[...input.policyViolations].sort((a,b) => a.id.localeCompare(b.id)),gaps:[...input.coverageGaps].sort((a,b) => a.id.localeCompare(b.id)),
    links:[...input.planLinks].sort((a,b) => a.relationshipId.localeCompare(b.relationshipId)),
    executions:[...input.executions].sort((a,b) => a.id.localeCompare(b.id)).map((execution) => ({ ...execution,decision:execution.decision })),
  };
  return `RRF-${stableHash(JSON.stringify(canonical))}`;
}

export function evaluateReleaseReadiness(input:ReadinessInput):{ inputFingerprint:string;status:'blocked'|'ready';results:ReadinessResult[] } {
  const results:ReadinessResult[] = [];
  if (input.policyViolations.length === 0) results.push({ id:'RELATIONSHIP-POLICY',code:'RR-REL-001',severity:'blocker',status:'pass',subjectId:input.baseline.id,title:'Relationship policy valid',detail:'Every active relationship conforms to the controlled relationship policy.' });
  else for (const violation of input.policyViolations) results.push({ id:`RELATIONSHIP-${violation.id}`,code:'RR-REL-001',severity:'blocker',status:'block',subjectId:violation.id,title:'Relationship policy violation',detail:violation.detail });

  for (const gap of input.coverageGaps) results.push({ id:`GAP-${gap.id}`,code:'RR-TRC-001',severity:gap.severity === 'high' ? 'blocker' : 'warning',status:gap.severity === 'high' ? 'block' : 'warn',subjectId:gap.itemId,title:gap.title,detail:gap.actual });
  if (input.coverageGaps.length === 0) results.push({ id:'TRACEABILITY-COVERAGE',code:'RR-TRC-001',severity:'blocker',status:'pass',subjectId:input.baseline.id,title:'Traceability coverage complete',detail:'The baseline has no coverage gaps under trace-coverage-v1.' });

  for (const plan of input.planLinks) {
    const execution = latestExecution(input.executions.filter((entry) => entry.testItemId === plan.testItemId && entry.testVersionId === plan.testVersionId));
    if (!execution) {
      results.push({ id:`EXECUTION-${plan.relationshipId}`,code:'RR-VER-001',severity:'blocker',status:'block',subjectId:plan.testItemId,title:'Verification execution missing',detail:`${plan.testItemId} has no execution for this release and baseline.` });
      continue;
    }
    if (!execution.decision) {
      results.push({ id:`EXECUTION-${plan.relationshipId}`,code:'RR-VER-001',severity:'blocker',status:'block',subjectId:execution.id,title:'Verification execution awaiting QA',detail:`The latest ${plan.testItemId} execution has no QA decision.` });
      continue;
    }
    if (execution.decision.decision === 'rejected') {
      results.push({ id:`EXECUTION-${plan.relationshipId}`,code:'RR-VER-001',severity:'blocker',status:'block',subjectId:execution.id,title:'Verification execution rejected',detail:`QA rejected the latest ${plan.testItemId} execution: ${execution.decision.reason}` });
      continue;
    }
    if (execution.outcome === 'failed') {
      results.push({ id:`EXECUTION-${plan.relationshipId}`,code:'RR-VER-001',severity:'blocker',status:'block',subjectId:execution.id,title:'Verification execution failed',detail:`The latest accepted ${plan.testItemId} execution did not meet its acceptance criteria.` });
      continue;
    }
    results.push({ id:`EXECUTION-${plan.relationshipId}`,code:'RR-VER-001',severity:'blocker',status:'pass',subjectId:execution.id,title:'Verification execution accepted',detail:`The latest ${plan.testItemId} execution passed and QA accepted the record.` });
  }
  const status = results.some((result) => result.status === 'block') ? 'blocked' : 'ready';
  return { inputFingerprint:readinessInputFingerprint(input),status,results };
}
