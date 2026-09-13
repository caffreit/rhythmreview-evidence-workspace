'use client';

import { useMemo, useState } from 'react';
import { EVIDENCE_TYPE_LABELS, EvidenceIdSchema, EvidenceTypeSchema, type EvidenceId, type EvidenceType } from '@/lib/domain';
import { buildTraceGraphModel, traceGraphNeighborhood, type TraceGraphEdge, type TraceGraphNode, type TraceGraphProjection } from '@/lib/traceability-graph';
import type { CandidateTraceabilityView, ChangeView, TraceabilityView } from '@/lib/view-models';

function GraphEdgeCard({ edge,peer,direction,onSelect }:{ edge:TraceGraphEdge;peer:TraceGraphNode|null;direction:'incoming'|'outgoing';onSelect:(id:EvidenceId)=>void }) {
  const peerId = direction === 'incoming' ? edge.sourceId : edge.targetId;
  const stateLabel = edge.workflowState === 'controlled' ? 'Controlled' : edge.workflowState === 'rejected' ? 'Rejected' : edge.operation === 'retire' ? 'Retire proposal' : 'Proposed';
  return <article className={`trace-graph-edge ${edge.workflowState} ${edge.meaning === 'review_only' ? 'review-only' : ''}`}>
    <button className="trace-graph-peer" onClick={() => onSelect(peerId)}>
      <code>{peerId}</code>
      <b>{peer?.title ?? 'Evidence unavailable'}</b>
      <span>{peer ? EVIDENCE_TYPE_LABELS[peer.type] : direction === 'incoming' ? 'Source evidence' : 'Target evidence'}</span>
    </button>
    <div className="trace-graph-connector" aria-label={`${edge.sourceId} ${edge.type} ${edge.targetId}`}>
      <i aria-hidden="true" />
      <span>{edge.type.replaceAll('_',' ').toLowerCase()}</span>
      <b aria-hidden="true">→</b>
    </div>
    <div className="trace-graph-edge-meta">
      <span className={`graph-state ${edge.workflowState}`}>{stateLabel}</span>
      {edge.meaning === 'review_only' && <span className="graph-state review-only">Review only</span>}
      {!edge.countedInProjection && <small>Review history, excluded from projection</small>}
    </div>
    <p>{edge.rationale}</p>
  </article>;
}

export function TraceabilityGraph({ traceability,candidate,change,selectedId,onSelect,onOpenEvidence }:{
  traceability:TraceabilityView;
  candidate:CandidateTraceabilityView|null;
  change:ChangeView|null;
  selectedId:string|null;
  onSelect:(id:string)=>void;
  onOpenEvidence:(id:string)=>void;
}) {
  const hasCandidate = candidate !== null && change !== null && change.relationshipProposals.length > 0;
  const [projection,setProjection] = useState<TraceGraphProjection>('approved');
  const [query,setQuery] = useState('');
  const [type,setType] = useState<'all'|EvidenceType>('all');
  const activeProjection:TraceGraphProjection = hasCandidate ? projection : 'approved';

  const model = useMemo(() => buildTraceGraphModel({
    approved:traceability,
    candidate:hasCandidate ? candidate : null,
    proposals:hasCandidate ? change.relationshipProposals : [],
    projection:activeProjection,
  }),[activeProjection,candidate,change,hasCandidate,traceability]);
  const focusId = useMemo(() => {
    const requested = EvidenceIdSchema.safeParse(selectedId);
    if (requested.success && model.nodes.some((node) => node.id === requested.data)) return requested.data;
    return model.nodes.find((node) => node.id === 'REQ-004')?.id ?? model.nodes[0]?.id ?? null;
  },[model.nodes,selectedId]);
  const neighborhood = useMemo(() => focusId ? traceGraphNeighborhood(model,focusId) : null,[focusId,model]);
  const nodesById = useMemo(() => new Map(model.nodes.map((node) => [node.id,node])),[model.nodes]);
  const visibleNodes = useMemo(() => model.nodes.filter((node) => {
    const matchesType = type === 'all' || node.type === type;
    const matchesQuery = `${node.id} ${node.title}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesType && matchesQuery;
  }),[model.nodes,query,type]);
  const gapIds = focusId ? model.gapIdsByItem.get(focusId) ?? [] : [];
  const focusNode = neighborhood?.node ?? null;
  const selectNode = (id:EvidenceId) => { onSelect(id); };

  return <section className="view-content trace-graph-workspace">
    <div className="page-heading compact"><div><p className="eyebrow teal">Explorable controlled traceability</p><h1>Traceability graph</h1><p className="lede">Choose an evidence item to inspect its direct stored relationships. Candidate links remain separate from rejected review history.</p></div><span className="baseline-pill"><span className="status-dot" />{model.baseline.label}</span></div>
    <div className="trace-graph-assurance" role="note"><div><p className="eyebrow">Projection parity</p><h2>{model.summary.projectedLinks} links match the {model.projection === 'candidate' ? 'candidate' : 'approved'} Matrix projection</h2></div><div className="trace-graph-legend"><span className="controlled">Controlled</span><span className="proposed">Proposed</span><span className="rejected">Rejected</span><span className="review-only">Review only</span></div></div>
    <div className="trace-graph-projection" aria-label="Graph projection">
      <button className={activeProjection === 'approved' ? 'active' : ''} onClick={() => setProjection('approved')}><b>Approved baseline</b><span>{traceability.summary.activeLinks} controlled links</span></button>
      <button className={activeProjection === 'candidate' ? 'active' : ''} disabled={!hasCandidate} onClick={() => setProjection('candidate')}><b>Candidate projection</b><span>{hasCandidate ? `${candidate.projected.summary.activeLinks} projected links · ${change.id}` : 'Open a change with relationship proposals'}</span></button>
    </div>
    <div className="trace-graph-layout">
      <aside className="trace-graph-index" aria-label="Evidence items">
        <div className="trace-graph-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID or title" aria-label="Search graph evidence" /><select value={type} onChange={(event) => setType(event.target.value === 'all' ? 'all' : EvidenceTypeSchema.parse(event.target.value))} aria-label="Filter graph evidence type"><option value="all">All evidence types</option>{Object.entries(EVIDENCE_TYPE_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></div>
        <span>{visibleNodes.length} evidence items</span>
        <div>{visibleNodes.map((node) => <button key={node.id} className={node.id === focusId ? 'active' : ''} onClick={() => selectNode(node.id)}><code>{node.id}</code><span>{node.title}</span><small>{EVIDENCE_TYPE_LABELS[node.type]} · v{node.version}</small></button>)}</div>
      </aside>
      <div className="trace-graph-stage">
        {focusNode && neighborhood ? <>
          <header className="trace-graph-focus"><div><span>{EVIDENCE_TYPE_LABELS[focusNode.type]}</span><code>{focusNode.id} · v{focusNode.version}</code><h2>{focusNode.title}</h2></div><button className="secondary-button" onClick={() => onOpenEvidence(focusNode.id)}>Open evidence record</button><dl><div><dt>Incoming</dt><dd>{neighborhood.incoming.length}</dd></div><div><dt>Outgoing</dt><dd>{neighborhood.outgoing.length}</dd></div><div><dt>Coverage gaps</dt><dd>{gapIds.length}</dd></div></dl></header>
          <div className="trace-graph-neighborhood">
            <section><div className="trace-graph-section-title"><div><p className="eyebrow">Incoming</p><h3>Sources pointing to {focusNode.id}</h3></div><span>{neighborhood.incoming.length}</span></div>{neighborhood.incoming.length > 0 ? <div className="trace-graph-edge-list">{neighborhood.incoming.map((edge) => <GraphEdgeCard key={edge.id} edge={edge} peer={nodesById.get(edge.sourceId) ?? null} direction="incoming" onSelect={selectNode} />)}</div> : <p className="trace-graph-empty">No incoming relationships in this projection.</p>}</section>
            <section><div className="trace-graph-section-title"><div><p className="eyebrow">Outgoing</p><h3>{focusNode.id} points to</h3></div><span>{neighborhood.outgoing.length}</span></div>{neighborhood.outgoing.length > 0 ? <div className="trace-graph-edge-list">{neighborhood.outgoing.map((edge) => <GraphEdgeCard key={edge.id} edge={edge} peer={nodesById.get(edge.targetId) ?? null} direction="outgoing" onSelect={selectNode} />)}</div> : <p className="trace-graph-empty">No outgoing relationships in this projection.</p>}</section>
          </div>
        </> : <div className="empty-state"><h2>No evidence in this projection</h2><p>The selected baseline has no graph nodes.</p></div>}
      </div>
    </div>
  </section>;
}
