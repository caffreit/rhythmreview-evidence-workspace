import type { DocumentTemplate, EvidenceItem, EvidenceRelationship } from './domain';

export type CoherenceFinding = {
  id:string;
  fingerprint:string;
  itemId:string;
  code:string;
  severity:'high'|'medium';
  title:string;
  detail:string;
  basis:'deterministic_check'|'evaluation_fixture';
  rule:string;
  expected:string;
  actual:string;
};

type FindingWithoutFingerprint = Omit<CoherenceFinding,'fingerprint'>;

function stableHash(value:string):string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash,16777619);
  }
  return (hash >>> 0).toString(16).padStart(8,'0');
}

export function findingFingerprint(finding:Pick<CoherenceFinding,'id'|'itemId'|'basis'|'rule'|'expected'|'actual'>):string {
  return `FPR-${stableHash([finding.id,finding.itemId,finding.basis,finding.rule,finding.expected,finding.actual].join('\u001f'))}`;
}

function withFingerprint(finding:FindingWithoutFingerprint):CoherenceFinding {
  return { ...finding,fingerprint:findingFingerprint(finding) };
}

export function runCoherenceChecks(args:{
  evidence:EvidenceItem[];
  relationships:EvidenceRelationship[];
  documents:DocumentTemplate[];
}):CoherenceFinding[] {
  const findings:FindingWithoutFingerprint[] = [];

  const riskControls = args.evidence.filter((item) => item.type === 'risk_control' && item.status !== 'superseded');
  for (const control of riskControls) {
    const verifying = args.relationships.filter((relation) => relation.active && relation.type === 'VERIFIES' && relation.targetId === control.id);
    if (verifying.length === 0) findings.push({
      id:`CHECK-VERIFY-${control.id}`,itemId:control.id,code:'TRC-014',severity:'high',title:'Risk control missing verification link',
      detail:`${control.id} has no active incoming VERIFIES relationship.`,basis:'deterministic_check',
      rule:'Each current risk control must have at least one active incoming VERIFIES relationship.',
      expected:`At least one test VERIFIES ${control.id}.`,actual:'No matching relationship exists.',
    });
  }

  for (const item of args.evidence.filter((entry) => entry.status === 'superseded')) {
    const containingDocuments = args.documents.filter((document) => document.types.includes(item.type) && !item.flags.some((flag) => document.excludeFlags?.includes(flag)));
    if (containingDocuments.length > 0) findings.push({
      id:`CHECK-SUPERSEDED-${item.id}`,itemId:item.id,code:'VER-009',severity:'medium',title:'Superseded evidence appears in current document views',
      detail:`${item.id} is included by ${containingDocuments.map((document) => document.code).join(' and ')}.`,basis:'deterministic_check',
      rule:'A current document view must not silently include a superseded evidence version.',
      expected:'Current document views include approved current evidence only.',actual:`The template rules include superseded ${item.id}.`,
    });
  }

  const architecture = args.documents.find((document) => document.code === 'SAD');
  const inventory = args.documents.find((document) => document.code === 'CCI');
  if (architecture && inventory) {
    const architectureItems = args.evidence.filter((item) => item.type === 'design' && architecture.types.includes(item.type) && !item.flags.some((flag) => architecture.excludeFlags?.includes(flag)));
    const inventoryIds = new Set(args.evidence.filter((item) => item.type === 'design' && inventory.types.includes(item.type) && !item.flags.some((flag) => inventory.excludeFlags?.includes(flag))).map((item) => item.id));
    for (const item of architectureItems.filter((entry) => !inventoryIds.has(entry.id))) findings.push({
      id:`CHECK-INVENTORY-${item.id}`,itemId:item.id,code:'CMP-004',severity:'medium',title:'Architecture component absent from inventory',
      detail:`${item.id} appears in SAD but is excluded from CCI.`,basis:'deterministic_check',
      rule:'Each design component in the architecture view must appear in the component inventory view.',
      expected:`CCI includes ${item.id}.`,actual:`CCI excludes ${item.id}.`,
    });
  }

  const itemById = new Map<string,EvidenceItem>(args.evidence.map((item) => [item.id,item]));
  const seconds = (id:string) => itemById.get(id)?.statement.match(/\b(\d+) seconds?\b/)?.[1] ?? 'not stated';
  const timingValues = ['REQ-004','CLM-003','LBL-002'].map(seconds);
  if (new Set(timingValues).size > 1) findings.push({
    id:'ISS-002',itemId:'LBL-002',code:'VAL-022',severity:'medium',title:'Inconsistent timing value',
    detail:'This authored fixture compares the controlled timing requirement, claim, and label.',basis:'evaluation_fixture',
    rule:'Human-authored fixture for wording and value consistency review.',
    expected:'REQ-004, CLM-003, and LBL-002 use one approved timing value.',
    actual:`REQ-004 states ${timingValues[0]} seconds, CLM-003 states ${timingValues[1]} seconds, and LBL-002 states ${timingValues[2]} seconds.`,
  });

  const labelClaim = itemById.get('LBL-003')?.statement.toLowerCase() ?? '';
  if (/\bconfirms?\b/.test(labelClaim)) findings.push({
    id:'ISS-004',itemId:'LBL-003',code:'CLM-006',severity:'medium',title:'Label overstates the claim',
    detail:'The seed pack intentionally uses "confirms" in the label while the approved claim says "possible".',basis:'evaluation_fixture',
    rule:'Human-authored fixture for claim consistency review.',expected:'The label stays within the approved claim.',actual:'The seeded label uses stronger diagnostic wording.',
  });

  const clinicalEvidence = itemById.get('CE-003')?.statement ?? '';
  if (!/review date\s*:/i.test(clinicalEvidence)) findings.push({
    id:'ISS-006',itemId:'CE-003',code:'REV-003',severity:'medium',title:'Evidence review date missing',
    detail:'The seed pack intentionally omits a scheduled review date from the clinical workflow study.',basis:'evaluation_fixture',
    rule:'Human-authored fixture for evidence review metadata.',expected:'A review date is recorded.',actual:'No review date is represented in this prototype.',
  });

  return findings.map(withFingerprint).sort((left,right) => left.code.localeCompare(right.code));
}
