import { describe,expect,it } from 'vitest';
import { seed } from '../lib/data';
import {
  CreateReleaseInputSchema,GUIDED_VERIFICATION_PACKAGE,MarkVerificationReadyInputSchema,ReviewVerificationExecutionInputSchema,
  VerificationExecutionSchema,evaluateReleaseReadiness,readinessInputFingerprint,type ReadinessInput,
} from '../lib/verification';

const baseInput:ReadinessInput = {
  baseline:{ id:seed.baseline.id,items:seed.evidence.map((item) => ({ id:item.id,versionId:item.versionId,type:item.type })) },
  relationships:seed.relationships.map((link) => ({ id:link.id,sourceId:link.sourceId,targetId:link.targetId,type:link.type })),
  policyViolations:[],coverageGaps:[],
  planLinks:[{ relationshipId:'REL-VERIFY',testItemId:'TEST-004',testVersionId:'TEST-004-v1.0',riskControlId:'RC-003' }],executions:[],
};

function execution(args:{ id:string;executedAt:string;outcome:'passed'|'failed';decision:'accepted'|'rejected'|null }) {
  return VerificationExecutionSchema.parse({
    id:args.id,releaseId:'RELSE-1',baselineId:seed.baseline.id,testItemId:'TEST-004',testVersionId:'TEST-004-v1.0',outcome:args.outcome,
    environment:'Fictional verification environment',buildId:'BUILD-1',observedResult:'Fictional structured observed result.',executedAt:args.executedAt,
    evidenceReference:'FICT-EVIDENCE://TEST-004/1',createdBy:'Alex Morgan · Author',createdAt:args.executedAt,
    decision:args.decision ? { decision:args.decision,reason:'QA reviewed the fictional record.',actor:'Jamie Chen · QA reviewer',createdAt:args.executedAt } : null,
  });
}

describe('release-readiness-v1',() => {
  it('uses the requested threshold wording and boundary checks in the guided package',() => {
    expect(GUIDED_VERIFICATION_PACKAGE.controlUpdates.find((update) => update.itemId === 'RC-001')?.proposedText).toContain('at least 90%');
    expect(GUIDED_VERIFICATION_PACKAGE.controlUpdates.find((update) => update.itemId === 'RC-002')?.proposedText).toContain('at least 85%');
    const population = GUIDED_VERIFICATION_PACKAGE.plans.find((plan) => plan.targetRiskControlId === 'RC-005');
    expect(population?.method).toMatch(/21, 22, and 23/);
    expect(population?.acceptanceCriteria).toMatch(/Age 21 is rejected, ages 22 and 23 are accepted/);
  });

  it('selects the latest execution so an older pass cannot hide a failure or pending rerun',() => {
    const oldPass = execution({ id:'VEX-OLD',executedAt:'2026-09-13T10:00:00.000Z',outcome:'passed',decision:'accepted' });
    const failed = execution({ id:'VEX-FAIL',executedAt:'2026-09-13T11:00:00.000Z',outcome:'failed',decision:'accepted' });
    expect(evaluateReleaseReadiness({ ...baseInput,executions:[oldPass,failed] })).toMatchObject({ status:'blocked',results:expect.arrayContaining([expect.objectContaining({ subjectId:'VEX-FAIL',status:'block',title:'Verification execution failed' })]) });
    const pending = execution({ id:'VEX-PENDING',executedAt:'2026-09-13T12:00:00.000Z',outcome:'passed',decision:null });
    expect(evaluateReleaseReadiness({ ...baseInput,executions:[oldPass,failed,pending] }).results).toContainEqual(expect.objectContaining({ subjectId:'VEX-PENDING',title:'Verification execution awaiting QA' }));
  });

  it('treats medium traceability as a warning while high gaps and rejected reviews block',() => {
    const accepted = execution({ id:'VEX-ACCEPT',executedAt:'2026-09-13T12:00:00.000Z',outcome:'passed',decision:'accepted' });
    const warning = evaluateReleaseReadiness({ ...baseInput,coverageGaps:[{ id:'MED',severity:'medium',itemId:'CLM-002',title:'Claim gap',actual:'No disclosure.' }],executions:[accepted] });
    expect(warning.status).toBe('ready'); expect(warning.results).toContainEqual(expect.objectContaining({ id:'GAP-MED',severity:'warning',status:'warn' }));
    const high = evaluateReleaseReadiness({ ...baseInput,coverageGaps:[{ id:'HIGH',severity:'high',itemId:'RC-001',title:'Control gap',actual:'No verification.' }],executions:[accepted] });
    expect(high.status).toBe('blocked');
    const rejected = execution({ id:'VEX-REJECT',executedAt:'2026-09-13T13:00:00.000Z',outcome:'passed',decision:'rejected' });
    expect(evaluateReleaseReadiness({ ...baseInput,executions:[accepted,rejected] }).status).toBe('blocked');
  });

  it('creates an order-independent fingerprint across baseline, relationships, executions, and decisions',() => {
    const one = execution({ id:'VEX-1',executedAt:'2026-09-13T10:00:00.000Z',outcome:'passed',decision:'accepted' });
    const two = execution({ id:'VEX-2',executedAt:'2026-09-13T11:00:00.000Z',outcome:'passed',decision:'accepted' });
    const input={ ...baseInput,executions:[one,two] };
    expect(readinessInputFingerprint(input)).toBe(readinessInputFingerprint({ ...input,baseline:{ ...input.baseline,items:[...input.baseline.items].reverse() },relationships:[...input.relationships].reverse(),executions:[two,one] }));
    expect(readinessInputFingerprint(input)).not.toBe(readinessInputFingerprint({ ...input,relationships:[...input.relationships,{ id:'REL-NEW',sourceId:'TEST-004',targetId:'RC-003',type:'VERIFIES' }] }));
    expect(readinessInputFingerprint(input)).not.toBe(readinessInputFingerprint({ ...input,executions:[one,{ ...two,decision:{ ...two.decision!,decision:'rejected' } }] }));
  });

  it('enforces role boundaries and provides no readiness waiver command',() => {
    expect(CreateReleaseInputSchema.safeParse({ actor:'Jamie Chen · QA reviewer',baselineId:'BL-1',label:'Release 1',codeRevision:'abc' }).success).toBe(false);
    expect(ReviewVerificationExecutionInputSchema.safeParse({ actor:'Alex Morgan · Author',decision:'accepted',reason:'No.' }).success).toBe(false);
    expect(MarkVerificationReadyInputSchema.safeParse({ actor:'Jamie Chen · QA reviewer',readinessRunId:'RRN-1',confirmation:true,waiveMissingVerification:true }).success).toBe(false);
  });
});
