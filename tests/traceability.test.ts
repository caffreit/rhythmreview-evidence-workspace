import { describe,expect,it } from 'vitest';
import { seed } from '../lib/data';
import { EvidenceIdSchema,type EvidenceRelationship } from '../lib/domain';
import { buildTraceabilityView,projectRelationships,validateRelationship } from '../lib/traceability';
import { buildTraceGraphModel,traceGraphNeighborhood } from '../lib/traceability-graph';
import type { CandidateTraceabilityView,RelationshipProposalView } from '../lib/view-models';

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

  it('keeps approved and candidate graph links in exact parity with their Matrix projections',() => {
    const base = buildTraceabilityView({ baseline,evidence:seed.evidence,relationships:seed.relationships });
    const source = seed.evidence.find((item) => item.id === 'IU-001');
    const target = seed.evidence.find((item) => item.id === 'LBL-004');
    const rejectedSource = seed.evidence.find((item) => item.id === 'CLM-002');
    const retired = seed.relationships.find((relationship) => relationship.sourceId === 'CLM-001' && relationship.type === 'DISCLOSED_IN');
    const retyped = seed.relationships.find((relationship) => relationship.sourceId === 'DES-007' && relationship.targetId === 'REQ-004' && relationship.type === 'MAY_AFFECT');
    expect(source).toBeDefined(); expect(target).toBeDefined(); expect(rejectedSource).toBeDefined(); expect(retired).toBeDefined(); expect(retyped).toBeDefined();
    if (!source || !target || !rejectedSource || !retired || !retyped) return;
    const retiredSource = seed.evidence.find((item) => item.id === retired.sourceId);
    const retiredTarget = seed.evidence.find((item) => item.id === retired.targetId);
    const retypedSource = seed.evidence.find((item) => item.id === retyped.sourceId);
    const retypedTarget = seed.evidence.find((item) => item.id === retyped.targetId);
    expect(retiredSource).toBeDefined(); expect(retiredTarget).toBeDefined(); expect(retypedSource).toBeDefined(); expect(retypedTarget).toBeDefined();
    if (!retiredSource || !retiredTarget || !retypedSource || !retypedTarget) return;

    const proposals:RelationshipProposalView[] = [
      { id:'P-GRAPH-ADD',changeId:'CHG-GRAPH',analysisRunId:null,baseBaselineId:baseline.id,operation:'add',baseRelationshipId:null,sourceId:source.id,targetId:target.id,sourceVersionId:source.versionId,targetVersionId:target.versionId,baseType:null,proposedType:'DISCLOSED_IN',revision:1,status:'proposed',createdBy:'Alex Morgan · Author',rationale:'The intended use limitation must be disclosed in the controlled use-limitation label.',createdAt:'2026-09-13T12:00:00.000Z',updatedBy:null,updateReason:null,updatedAt:null,decision:null,effectiveType:'DISCLOSED_IN' },
      { id:'P-GRAPH-RETYPE',changeId:'CHG-GRAPH',analysisRunId:null,baseBaselineId:baseline.id,operation:'retype',baseRelationshipId:retyped.id,sourceId:retypedSource.id,targetId:retypedTarget.id,sourceVersionId:retypedSource.versionId,targetVersionId:retypedTarget.versionId,baseType:retyped.type,proposedType:'MAY_AFFECT',revision:1,status:'proposed',createdBy:'Alex Morgan · Author',rationale:'QA selected the direct component-to-requirement meaning.',createdAt:'2026-09-13T12:00:30.000Z',updatedBy:null,updateReason:null,updatedAt:null,decision:{ decision:'edited',editedType:'IMPLEMENTS',reason:'The statements support a direct implementation link.',actor:'Jamie Chen · QA reviewer',createdAt:'2026-09-13T12:00:45.000Z',proposalRevision:1 },effectiveType:'IMPLEMENTS' },
      { id:'P-GRAPH-REJECTED',changeId:'CHG-GRAPH',analysisRunId:null,baseBaselineId:baseline.id,operation:'add',baseRelationshipId:null,sourceId:rejectedSource.id,targetId:target.id,sourceVersionId:rejectedSource.versionId,targetVersionId:target.versionId,baseType:null,proposedType:'DISCLOSED_IN',revision:1,status:'proposed',createdBy:'Alex Morgan · Author',rationale:'This proposed disclosure was rejected during QA review.',createdAt:'2026-09-13T12:01:00.000Z',updatedBy:null,updateReason:null,updatedAt:null,decision:{ decision:'rejected',editedType:null,reason:'The label does not contain this claim.',actor:'Jamie Chen · QA reviewer',createdAt:'2026-09-13T12:02:00.000Z',proposalRevision:1 },effectiveType:'DISCLOSED_IN' },
      { id:'P-GRAPH-RETIRE',changeId:'CHG-GRAPH',analysisRunId:null,baseBaselineId:baseline.id,operation:'retire',baseRelationshipId:retired.id,sourceId:retiredSource.id,targetId:retiredTarget.id,sourceVersionId:retiredSource.versionId,targetVersionId:retiredTarget.versionId,baseType:retired.type,proposedType:null,revision:1,status:'proposed',createdBy:'Alex Morgan · Author',rationale:'The controlled disclosure moved to another label.',createdAt:'2026-09-13T12:03:00.000Z',updatedBy:null,updateReason:null,updatedAt:null,decision:{ decision:'accepted',editedType:null,reason:'The prior disclosure is obsolete.',actor:'Jamie Chen · QA reviewer',createdAt:'2026-09-13T12:04:00.000Z',proposalRevision:1 },effectiveType:retired.type },
    ];
    const projectedRelationships = projectRelationships({ baselineId:'CAND-CHG-GRAPH-1',evidence:seed.evidence,relationships:seed.relationships,proposals:proposals.map((proposal) => ({ id:proposal.id,operation:proposal.operation,baseRelationshipId:proposal.baseRelationshipId,sourceId:proposal.sourceId,targetId:proposal.targetId,proposedType:proposal.proposedType,decision:proposal.decision?.decision ?? 'pending',editedType:proposal.decision?.editedType ?? null,status:proposal.status,rationale:proposal.rationale })) });
    const projected = buildTraceabilityView({ baseline:{ id:'CAND-CHG-GRAPH-1',label:'Candidate revision 1',status:'candidate' },evidence:seed.evidence,relationships:projectedRelationships.relationships });
    const candidate:CandidateTraceabilityView = { base,projected,deltas:projectedRelationships.deltas,valid:projectedRelationships.valid };

    const approvedGraph = buildTraceGraphModel({ approved:base,candidate,proposals,projection:'approved' });
    expect(approvedGraph.projectedLinkIds).toEqual(base.links.map((link) => link.id).sort());
    expect(approvedGraph.edges.every((edge) => edge.kind === 'projection' && edge.countedInProjection)).toBe(true);

    const candidateGraph = buildTraceGraphModel({ approved:base,candidate,proposals,projection:'candidate' });
    expect(candidateGraph.projectedLinkIds).toEqual(projected.links.map((link) => link.id).sort());
    expect([...candidateGraph.gapIdsByItem]).toEqual(projected.rows.map((row) => [row.item.id,row.gapIds]));
    expect(candidateGraph.edges.filter((edge) => edge.countedInProjection).map((edge) => edge.id).sort()).toEqual(candidateGraph.projectedLinkIds);
    expect(candidateGraph.edges).toContainEqual(expect.objectContaining({ proposalId:'P-GRAPH-ADD',workflowState:'proposed',countedInProjection:true }));
    expect(candidateGraph.edges).toContainEqual(expect.objectContaining({ proposalId:'P-GRAPH-RETYPE',operation:'retype',type:'IMPLEMENTS',workflowState:'proposed',countedInProjection:true }));
    expect(candidateGraph.edges).toContainEqual(expect.objectContaining({ proposalId:'P-GRAPH-REJECTED',workflowState:'rejected',countedInProjection:false }));
    expect(candidateGraph.edges).toContainEqual(expect.objectContaining({ proposalId:'P-GRAPH-RETIRE',operation:'retire',countedInProjection:false }));
    expect(candidateGraph.edges.some((edge) => edge.meaning === 'review_only')).toBe(true);
    expect(traceGraphNeighborhood(candidateGraph,rejectedSource.id).outgoing.some((edge) => edge.workflowState === 'rejected')).toBe(true);
  });
});
