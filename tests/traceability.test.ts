import { describe,expect,it } from 'vitest';
import { seed } from '../lib/data';
import { EvidenceIdSchema,type EvidenceRelationship } from '../lib/domain';
import { buildTraceabilityView,projectRelationships,validateRelationship } from '../lib/traceability';

const baseline = { id:seed.baseline.id,label:seed.baseline.label,status:seed.baseline.status };
const evidenceId = EvidenceIdSchema.parse;

describe('baseline traceability policy',() => {
  it('validates every stored seed link against the controlled prototype relationship policy',() => {
    const view = buildTraceabilityView({ baseline,evidence:seed.evidence,relationships:seed.relationships });
    expect(view.summary).toMatchObject({ evidenceItems:72,activeLinks:122,policyCompliantLinks:122,policyViolations:0 });
    expect(view.policy).toMatchObject({ id:'relationship-policy-v1.0',version:'1.0',status:'controlled_prototype' });
    expect(view.links.every((link) => link.baselineId === baseline.id && link.policy.valid)).toBe(true);
  });

  it('reports the deliberately missing risk-control verification with its versioned rule',() => {
    const view = buildTraceabilityView({ baseline,evidence:seed.evidence,relationships:seed.relationships });
    expect(view.gaps.map((gap) => gap.id)).toEqual(['TRC-CLM-002-CLM-002','TRC-RC-002-RC-001','TRC-RC-002-RC-002','TRC-RC-002-RC-005']);
    expect(view.gaps).toContainEqual(expect.objectContaining({ id:'TRC-RC-002-RC-005',ruleId:'TRC-RC-002',ruleVersion:'1',itemId:'RC-005',severity:'high' }));
    expect(view.rows.find((row) => row.item.id === 'RC-005')?.gapIds).toEqual(['TRC-RC-002-RC-005']);
  });

  it('flags a relationship whose endpoint types violate the policy',() => {
    const invalid:EvidenceRelationship = { ...seed.relationships[0],type:'MITIGATES' };
    const view = buildTraceabilityView({ baseline,evidence:seed.evidence,relationships:[invalid,...seed.relationships.slice(1)] });
    expect(view.summary.policyViolations).toBe(1);
    expect(view.links[0]?.policy).toMatchObject({ valid:false,id:'relationship-policy-v1.0' });
  });

  it('rejects self links, invalid endpoint types, and duplicate active triples',() => {
    const iu = seed.evidence.find((item) => item.id === 'IU-001');
    const label = seed.evidence.find((item) => item.id === 'LBL-004');
    expect(validateRelationship({ source:iu,target:iu,type:'DISCLOSED_IN',relationships:seed.relationships })).toContain('itself');
    expect(validateRelationship({ source:label,target:iu,type:'VERIFIES',relationships:seed.relationships })).toContain('does not allow');
    const existing = seed.relationships[0];
    expect(validateRelationship({ source:seed.evidence.find((item) => item.id === existing.sourceId),target:seed.evidence.find((item) => item.id === existing.targetId),type:existing.type,relationships:seed.relationships })).toContain('already contains');
  });

  it('projects accepted additions, retypes, retirements, edits, and rejections deterministically',() => {
    const retypeBase = seed.relationships.find((relationship) => relationship.sourceId === 'DES-007' && relationship.targetId === 'REQ-004' && relationship.type === 'MAY_AFFECT');
    const retireBase = seed.relationships.find((relationship) => relationship.sourceId === 'CLM-001' && relationship.type === 'DISCLOSED_IN');
    expect(retypeBase).toBeDefined(); expect(retireBase).toBeDefined();
    if (!retypeBase || !retireBase) return;
    const projection = projectRelationships({ baselineId:'CAND-1',evidence:seed.evidence,relationships:seed.relationships,proposals:[
      { id:'P-ADD',operation:'add',baseRelationshipId:null,sourceId:evidenceId('IU-001'),targetId:evidenceId('LBL-004'),proposedType:'DISCLOSED_IN',decision:'accepted',editedType:null,status:'proposed',rationale:'The intended use limitation must be disclosed in the use-limitation label.' },
      { id:'P-RETYPE',operation:'retype',baseRelationshipId:retypeBase.id,sourceId:retypeBase.sourceId,targetId:retypeBase.targetId,proposedType:'MAY_AFFECT',decision:'edited',editedType:'IMPLEMENTS',status:'proposed',rationale:'QA selected the direct component-to-requirement meaning.' },
      { id:'P-RETIRE',operation:'retire',baseRelationshipId:retireBase.id,sourceId:retireBase.sourceId,targetId:retireBase.targetId,proposedType:null,decision:'accepted',editedType:null,status:'proposed',rationale:'The disclosure moved to a different controlled label.' },
      { id:'P-REJECT',operation:'add',baseRelationshipId:null,sourceId:evidenceId('CLM-002'),targetId:evidenceId('LBL-004'),proposedType:'DISCLOSED_IN',decision:'rejected',editedType:null,status:'proposed',rationale:'Rejected links do not enter the candidate.' },
    ]});
    expect(projection.valid).toBe(true);
    expect(projection.relationships.some((relationship) => relationship.sourceId === 'IU-001' && relationship.targetId === 'LBL-004' && relationship.type === 'DISCLOSED_IN')).toBe(true);
    expect(projection.relationships.some((relationship) => relationship.id === retireBase.id)).toBe(false);
    expect(projection.relationships.some((relationship) => relationship.sourceId === 'CLM-002' && relationship.targetId === 'LBL-004')).toBe(false);
    expect(projection.deltas).toHaveLength(3);
  });

  it('rejects a no-op retype and ignores discarded or superseded proposals',() => {
    const base = seed.relationships.find((relationship) => relationship.type === 'IMPLEMENTS');
    expect(base).toBeDefined(); if (!base) return;
    const projection = projectRelationships({ baselineId:'CAND-2',evidence:seed.evidence,relationships:seed.relationships,proposals:[
      { id:'P-NOOP',operation:'retype',baseRelationshipId:base.id,sourceId:base.sourceId,targetId:base.targetId,proposedType:base.type,decision:'accepted',editedType:null,status:'proposed',rationale:'This intentionally demonstrates no-op rejection.' },
      { id:'P-DISCARDED',operation:'add',baseRelationshipId:null,sourceId:evidenceId('IU-001'),targetId:evidenceId('LBL-004'),proposedType:'DISCLOSED_IN',decision:'pending',editedType:null,status:'discarded',rationale:'Discarded.' },
      { id:'P-SUPERSEDED',operation:'add',baseRelationshipId:null,sourceId:evidenceId('IU-001'),targetId:evidenceId('LBL-004'),proposedType:'DISCLOSED_IN',decision:'accepted',editedType:null,status:'superseded',rationale:'Superseded.' },
    ]});
    expect(projection.valid).toBe(false);
    expect(projection.deltas).toEqual([expect.objectContaining({ proposalId:'P-NOOP',error:'A retype must change the relationship type.' })]);
  });
});
