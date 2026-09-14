import { describe,expect,it } from 'vitest';
import {
  CiManifestSchema,
  UpsertResidualRiskInputSchema,
  evaluateFinalReadiness,
  finalReadinessFingerprint,
  normalizeFilename,
  riskAcceptanceFingerprint,
  sha256Hex,
  validateAttachmentFile,
  type FinalReadinessInput,
} from '../lib/final-release';

const acceptedRisk = { hazardId:'HAZ-001',assessmentId:'RRA-1',classification:'acceptable' as const,decisionId:'RRD-1',decision:'accepted' as const };
const input:FinalReadinessInput = {
  release:{ id:'REL-1',status:'verification_ready',readinessRunId:'RRN-1' },verification:{ status:'ready',stale:false },
  policyViolationIds:[],highGapIds:[],highCoherenceFindings:[],mediumCoherenceFindings:[],risks:[acceptedRisk],
  riskSupport:[{ id:'ATT-1',sha256:'a'.repeat(64) }],attachments:[{ id:'ATT-1',category:'risk_support',sha256:'a'.repeat(64) }],
  ci:{ id:'CIE-1',validationStatus:'valid',decisionId:'CID-1',decision:'accepted' },riskAttestation:{ id:'ATTST-1',current:true },
};

describe('final-release-v1',() => {
  it('passes a complete input and keeps medium coherence findings as warnings',() => {
    const result=evaluateFinalReadiness({ ...input,mediumCoherenceFindings:[{ id:'FND-1',title:'Medium review note' }] });
    expect(result.status).toBe('ready');
    expect(result.results.find((item) => item.id === 'WARNING-FND-1')?.status).toBe('warn');
  });

  it.each([
    ['missing risk',{ ...input,risks:[{ ...acceptedRisk,assessmentId:null,classification:null,decisionId:null,decision:null }] }],
    ['unacceptable risk',{ ...input,risks:[{ ...acceptedRisk,classification:'unacceptable' as const }] }],
    ['rejected risk',{ ...input,risks:[{ ...acceptedRisk,decision:'rejected' as const }] }],
    ['missing support',{ ...input,riskSupport:[],attachments:[] }],
    ['invalid CI',{ ...input,ci:{ ...input.ci!,validationStatus:'invalid' as const } }],
    ['stale risk attestation',{ ...input,riskAttestation:{ id:'ATTST-1',current:false } }],
  ])('blocks for %s',(_name,value) => expect(evaluateFinalReadiness(value).status).toBe('blocked'));

  it('fingerprints replacement decisions and attachments',() => {
    expect(finalReadinessFingerprint(input)).not.toBe(finalReadinessFingerprint({ ...input,risks:[{ ...acceptedRisk,decisionId:'RRD-2' }] }));
    expect(finalReadinessFingerprint(input)).not.toBe(finalReadinessFingerprint({ ...input,attachments:[...input.attachments,{ id:'ATT-2',category:'release_support',sha256:'b'.repeat(64) }] }));
    expect(riskAcceptanceFingerprint(input)).not.toBe(riskAcceptanceFingerprint({ ...input,risks:[{ ...acceptedRisk,decisionId:'RRD-2' }] }));
    expect(finalReadinessFingerprint(input)).toBe(finalReadinessFingerprint({ ...input,release:{ ...input.release,status:'release_approved' } }));
  });
});

describe('residual-risk and CI boundaries',() => {
  it('requires rationale and a conclusion only for benefit-risk review',() => {
    const actor='Alex Morgan · Author';
    expect(UpsertResidualRiskInputSchema.safeParse({ actor,hazardItemId:'HAZ-001',classification:'acceptable',rationale:'Adequate rationale.',benefitRiskConclusion:null }).success).toBe(true);
    expect(UpsertResidualRiskInputSchema.safeParse({ actor,hazardItemId:'HAZ-001',classification:'benefit_risk_required',rationale:'Adequate rationale.',benefitRiskConclusion:null }).success).toBe(false);
  });

  it('accepts failed CI manifests for durable invalid-history recording',() => {
    const manifest={ schema:'ci-evidence-v1',provider:'github_actions',repository:'example/repo',workflow:'Offline suite',runId:'12',runAttempt:1,runUrl:'https://github.com/example/repo/actions/runs/12',commitSha:'a'.repeat(40),startedAt:'2026-01-01T00:00:00.000Z',completedAt:'2026-01-01T00:01:00.000Z',conclusion:'failure',checks:[{ name:'Tests',conclusion:'failure' }],reports:[{ filename:'report.txt',sha256:'b'.repeat(64) }] };
    expect(CiManifestSchema.safeParse(manifest).success).toBe(true);
  });

  it('normalizes names, rejects empty uploads, and hashes exact bytes',async () => {
    expect(normalizeFilename('../Risk: support.txt')).toBe('Risk_ support.txt');
    expect(() => validateAttachmentFile(new File([], 'empty.txt',{ type:'text/plain' }))).toThrow(/empty/);
    await expect(sha256Hex(new TextEncoder().encode('abc').buffer)).resolves.toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
