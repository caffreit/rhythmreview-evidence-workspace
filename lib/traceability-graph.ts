import type { EvidenceId, EvidenceRelationship } from './domain';
import type { CandidateTraceabilityView, RelationshipProposalView, TraceabilityView } from './view-models';

export type TraceGraphProjection = 'approved'|'candidate';
export type TraceGraphWorkflowState = 'controlled'|'proposed'|'rejected';
export type TraceGraphMeaning = 'confirmed'|'review_only';

type TraceGraphProjectionEdge = {
  kind:'projection';
  id:string;
  sourceId:EvidenceId;
  targetId:EvidenceId;
  type:EvidenceRelationship['type'];
  workflowState:'controlled'|'proposed';
  meaning:TraceGraphMeaning;
  countedInProjection:true;
  operation:RelationshipProposalView['operation']|null;
  proposalId:string|null;
  rationale:string;
  origin:string;
};

type TraceGraphReviewEdge = {
  kind:'review_history';
  id:string;
  sourceId:EvidenceId;
  targetId:EvidenceId;
  type:EvidenceRelationship['type'];
  workflowState:'proposed'|'rejected';
  meaning:TraceGraphMeaning;
  countedInProjection:false;
  operation:RelationshipProposalView['operation'];
  proposalId:string;
  rationale:string;
  origin:'relationship_proposal';
};

export type TraceGraphEdge = TraceGraphProjectionEdge|TraceGraphReviewEdge;
export type TraceGraphNode = TraceabilityView['rows'][number]['item'];

export type TraceGraphModel = {
  projection:TraceGraphProjection;
  baseline:TraceabilityView['baseline'];
  nodes:TraceGraphNode[];
  edges:TraceGraphEdge[];
  gapIdsByItem:Map<EvidenceId,string[]>;
  projectedLinkIds:string[];
  summary:{ evidenceItems:number;projectedLinks:number;reviewHistoryLinks:number;reviewOnlyLinks:number };
};

function proposalType(proposal:RelationshipProposalView):EvidenceRelationship['type']|null {
  return proposal.effectiveType ?? proposal.proposedType ?? proposal.baseType;
}

function matchesProjectedProposal(link:TraceabilityView['links'][number],proposal:RelationshipProposalView):boolean {
  return proposal.status === 'proposed'
    && proposal.operation !== 'retire'
    && proposal.decision?.decision !== 'rejected'
    && proposal.sourceId === link.sourceId
    && proposal.targetId === link.targetId
    && proposalType(proposal) === link.type;
}

export function buildTraceGraphModel(args:{
  approved:TraceabilityView;
  candidate:CandidateTraceabilityView|null;
  proposals:RelationshipProposalView[];
  projection:TraceGraphProjection;
}):TraceGraphModel {
  const candidate = args.projection === 'candidate' ? args.candidate : null;
  const view = candidate?.projected ?? args.approved;
  const projection:TraceGraphProjection = candidate ? 'candidate' : 'approved';
  const activeProposals = projection === 'candidate'
    ? args.proposals.filter((proposal) => proposal.status !== 'discarded' && proposal.status !== 'superseded')
    : [];

  const projectionEdges:TraceGraphProjectionEdge[] = view.links.map((link) => {
    const proposal = link.origin === 'relationship_proposal'
      ? activeProposals.find((entry) => matchesProjectedProposal(link,entry)) ?? null
      : null;
    return {
      kind:'projection',
      id:link.id,
      sourceId:link.sourceId,
      targetId:link.targetId,
      type:link.type,
      workflowState:proposal ? 'proposed' : 'controlled',
      meaning:link.type === 'MAY_AFFECT' ? 'review_only' : 'confirmed',
      countedInProjection:true,
      operation:proposal?.operation ?? null,
      proposalId:proposal?.id ?? null,
      rationale:link.rationale,
      origin:link.origin,
    };
  });

  const representedProposalIds = new Set(projectionEdges.flatMap((edge) => edge.proposalId ? [edge.proposalId] : []));
  const reviewEdges:TraceGraphReviewEdge[] = activeProposals.flatMap((proposal) => {
    const type = proposalType(proposal);
    const rejected = proposal.decision?.decision === 'rejected' || proposal.status === 'rejected';
    const needsOverlay = rejected || proposal.operation === 'retire' || !representedProposalIds.has(proposal.id);
    if (!type || !needsOverlay) return [];
    return [{
      kind:'review_history',
      id:`proposal-${proposal.id}`,
      sourceId:proposal.sourceId,
      targetId:proposal.targetId,
      type,
      workflowState:rejected ? 'rejected' : 'proposed',
      meaning:type === 'MAY_AFFECT' ? 'review_only' : 'confirmed',
      countedInProjection:false,
      operation:proposal.operation,
      proposalId:proposal.id,
      rationale:proposal.rationale,
      origin:'relationship_proposal',
    }];
  });
  const edges:TraceGraphEdge[] = [...projectionEdges,...reviewEdges];

  return {
    projection,
    baseline:view.baseline,
    nodes:view.rows.map((row) => row.item),
    edges,
    gapIdsByItem:new Map(view.rows.map((row) => [row.item.id,row.gapIds])),
    projectedLinkIds:view.links.map((link) => link.id).sort(),
    summary:{
      evidenceItems:view.rows.length,
      projectedLinks:projectionEdges.length,
      reviewHistoryLinks:reviewEdges.length,
      reviewOnlyLinks:edges.filter((edge) => edge.meaning === 'review_only').length,
    },
  };
}

export function traceGraphNeighborhood(model:TraceGraphModel,focusId:EvidenceId) {
  const node = model.nodes.find((entry) => entry.id === focusId) ?? null;
  const incoming = model.edges.filter((edge) => edge.targetId === focusId).sort(compareEdges);
  const outgoing = model.edges.filter((edge) => edge.sourceId === focusId).sort(compareEdges);
  return { node,incoming,outgoing };
}

function compareEdges(left:TraceGraphEdge,right:TraceGraphEdge):number {
  if (left.countedInProjection !== right.countedInProjection) return left.countedInProjection ? -1 : 1;
  return `${left.type}-${left.id}`.localeCompare(`${right.type}-${right.id}`);
}
