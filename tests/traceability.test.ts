import { describe,expect,it } from 'vitest';
import { seed } from '../lib/data';
import type { EvidenceRelationship } from '../lib/domain';
import { buildTraceabilityView } from '../lib/traceability';

const baseline = { id:seed.baseline.id,label:seed.baseline.label,status:seed.baseline.status };

describe('baseline traceability policy',() => {
  it('validates every stored seed link against the draft relationship policy',() => {
    const view = buildTraceabilityView({ baseline,evidence:seed.evidence,relationships:seed.relationships });
    expect(view.summary).toMatchObject({ evidenceItems:72,activeLinks:118,policyCompliantLinks:118,policyViolations:0 });
    expect(view.links.every((link) => link.baselineId === baseline.id && link.policy.valid)).toBe(true);
  });

  it('reports the deliberately missing risk-control verification with its versioned rule',() => {
    const view = buildTraceabilityView({ baseline,evidence:seed.evidence,relationships:seed.relationships });
    expect(view.gaps).toEqual([expect.objectContaining({
      id:'TRC-RC-002-RC-005',ruleId:'TRC-RC-002',ruleVersion:'1',itemId:'RC-005',severity:'high',
    })]);
    expect(view.rows.find((row) => row.item.id === 'RC-005')?.gapIds).toEqual(['TRC-RC-002-RC-005']);
  });

  it('flags a relationship whose endpoint types violate the policy',() => {
    const invalid:EvidenceRelationship = { ...seed.relationships[0],type:'MITIGATES' };
    const view = buildTraceabilityView({ baseline,evidence:seed.evidence,relationships:[invalid,...seed.relationships.slice(1)] });
    expect(view.summary.policyViolations).toBe(1);
    expect(view.links[0]?.policy).toMatchObject({ valid:false,id:'relationship-policy-v0.1' });
  });
});
