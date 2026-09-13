'use client';

import { useMemo, useState } from 'react';
import { EVIDENCE_TYPE_LABELS, EvidenceTypeSchema, type EvidenceType } from '@/lib/domain';
import type { TraceabilityView } from '@/lib/view-models';

type TraceMode = 'matrix'|'coverage';

function PolicyHeader({ traceability }:{ traceability:TraceabilityView }) {
  return <>
    <div className="trace-policy-banner" role="note">
      <div><p className="eyebrow">Draft policy for review</p><h2>{traceability.policy.title} · v{traceability.policy.version}</h2><p>Every stored link is checked against an allowed source type, target type, and relationship meaning. QA and RA must ratify this draft before it becomes a controlled policy.</p></div>
      <span>{traceability.summary.policyViolations === 0 ? 'All current links conform' : `${traceability.summary.policyViolations} policy violations`}</span>
    </div>
    <div className="trace-summary" aria-label="Traceability summary">
      <article><span>Baseline</span><strong>{traceability.baseline.label}</strong><small>{traceability.baseline.status}</small></article>
      <article><span>Evidence items</span><strong>{traceability.summary.evidenceItems}</strong><small>exact approved versions</small></article>
      <article><span>Active links</span><strong>{traceability.summary.activeLinks}</strong><small>{traceability.summary.policyCompliantLinks} policy-conforming</small></article>
      <article className={traceability.summary.coverageGaps > 0 ? 'attention' : ''}><span>Coverage gaps</span><strong>{traceability.summary.coverageGaps}</strong><small>{traceability.summary.highCoverageGaps} high severity</small></article>
    </div>
  </>;
}

export function TraceabilityWorkspace({ mode,traceability,onOpenEvidence }:{ mode:TraceMode;traceability:TraceabilityView;onOpenEvidence:(id:string)=>void }) {
  const [query,setQuery] = useState('');
  const [type,setType] = useState<'all'|EvidenceType>(mode === 'matrix' ? 'requirement' : 'all');
  const [gapsOnly,setGapsOnly] = useState(false);
  const linksById = useMemo(() => new Map(traceability.links.map((link) => [link.id,link])),[traceability.links]);
  const filteredRows = useMemo(() => traceability.rows.filter((row) => {
    const matchesType = type === 'all' || row.item.type === type;
    const text = `${row.item.id} ${row.item.title}`.toLowerCase();
    return matchesType && text.includes(query.toLowerCase()) && (!gapsOnly || row.gapIds.length > 0);
  }),[gapsOnly,query,traceability.rows,type]);
  const linkCell = (linkIds:string[],direction:'incoming'|'outgoing') => <div className="trace-link-stack">{linkIds.length === 0 ? <span className="trace-empty">None</span> : linkIds.map((linkId) => {
    const link = linksById.get(linkId);
    if (!link) return null;
    const peer = direction === 'incoming' ? link.source : link.target;
    return <button className={link.policy.valid ? '' : 'invalid'} key={link.id} onClick={() => onOpenEvidence(peer.id)} title={link.policy.meaning}><b>{link.type.replaceAll('_',' ').toLowerCase()}</b><code>{peer.id}</code><small>v{peer.version ?? '?'}</small></button>;
  })}</div>;

  return <section className="view-content trace-workspace">
    <div className="page-heading compact"><div><p className="eyebrow teal">Baseline-aware traceability</p><h1>{mode === 'matrix' ? 'Traceability matrix' : 'Coverage and gaps'}</h1><p className="lede">{mode === 'matrix' ? 'Inspect every direct relationship against exact evidence versions in the active baseline.' : 'Review deterministic gaps with the exact policy rule and baseline that produced them.'}</p></div><span className="baseline-pill"><span className="status-dot" />{traceability.baseline.label}</span></div>
    <PolicyHeader traceability={traceability} />
    {mode === 'matrix' ? <>
      <div className="trace-toolbar"><label><span className="sr-only">Search traceability rows</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search evidence ID or title" /></label><label><span className="sr-only">Filter evidence type</span><select value={type} onChange={(event) => setType(event.target.value === 'all' ? 'all' : EvidenceTypeSchema.parse(event.target.value))}><option value="all">All evidence types</option>{Object.entries(EVIDENCE_TYPE_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="trace-gap-toggle"><input type="checkbox" checked={gapsOnly} onChange={(event) => setGapsOnly(event.target.checked)} /> Gaps only</label><span>{filteredRows.length} rows</span></div>
      <div className="trace-table-wrap"><table className="trace-table"><thead><tr><th>Evidence version</th><th>Incoming stored links</th><th>Outgoing stored links</th><th>Rule gaps</th></tr></thead><tbody>{filteredRows.map((row) => <tr key={row.item.id}><th><button onClick={() => onOpenEvidence(row.item.id)}><code>{row.item.id} · v{row.item.version}</code><b>{row.item.title}</b><small>{EVIDENCE_TYPE_LABELS[row.item.type]} · {row.item.criticality}</small></button></th><td>{linkCell(row.incomingLinkIds,'incoming')}</td><td>{linkCell(row.outgoingLinkIds,'outgoing')}</td><td>{row.gapIds.length === 0 ? <span className="trace-pass">Covered</span> : <div className="trace-gap-ids">{row.gapIds.map((gapId) => <code key={gapId}>{gapId.split(`-${row.item.id}`)[0]}</code>)}</div>}</td></tr>)}</tbody></table></div>
    </> : <>
      {traceability.gaps.length === 0 ? <div className="empty-state"><h2>No coverage gaps</h2><p>The active baseline passes every rule in {traceability.coveragePolicy.id}.</p></div> : <div className="trace-gap-list">{traceability.gaps.map((gap) => <article key={gap.id}><div><span className={`trace-severity ${gap.severity}`}>{gap.severity}</span><code>{gap.ruleId} · v{gap.ruleVersion}</code></div><button onClick={() => onOpenEvidence(gap.itemId)}><code>{gap.itemId}</code><b>{gap.itemTitle}</b></button><h2>{gap.title}</h2><p>{gap.requirement}</p><small>{gap.actual}</small></article>)}</div>}
      <section className="trace-rule-register"><div className="section-heading"><div><p className="eyebrow">Rule register</p><h2>{traceability.coveragePolicy.id}</h2></div><span>{traceability.coveragePolicy.rules.length} deterministic rules</span></div><div>{traceability.coveragePolicy.rules.map((rule) => <article key={rule.id}><code>{rule.id} · v{rule.version}</code><b>{rule.title}</b><p>{rule.requirement}</p><small>{EVIDENCE_TYPE_LABELS[rule.subjectType]} · {rule.direction} {rule.relationshipType.replaceAll('_',' ').toLowerCase()} · {rule.peerTypes.map((peerType) => EVIDENCE_TYPE_LABELS[peerType]).join(' or ')}</small></article>)}</div></section>
    </>}
  </section>;
}
