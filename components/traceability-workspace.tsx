'use client';

import { useMemo, useState } from 'react';
import type { DemoRole } from '@/lib/actors';
import { EVIDENCE_TYPE_LABELS, EvidenceIdSchema, EvidenceTypeSchema, RelationshipTypeSchema, type EvidenceItem, type EvidenceType, type RelationshipProposalDraft } from '@/lib/domain';
import type { TraceabilityView } from '@/lib/view-models';

type TraceMode = 'matrix'|'coverage';

function PolicyHeader({ traceability }:{ traceability:TraceabilityView }) {
  return <>
    <div className="trace-policy-banner" role="note">
      <div><p className="eyebrow">Controlled prototype policy</p><h2>{traceability.policy.title} · v{traceability.policy.version}</h2><p>Every stored link is checked against allowed endpoint types, a controlled meaning, an explicit rationale, and immutable baseline provenance.</p></div>
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

type ComposerState = { operation:'add'|'retype'|'retire';baseRelationshipId?:string;sourceId:string;targetId:string;type:string;rationale:string;lockedEndpoint?:'source'|'target';eligiblePeerTypes?:EvidenceType[] };

export function TraceabilityWorkspace({ mode,traceability,evidence,actor,onOpenEvidence,onCreateRelationship }:{ mode:TraceMode;traceability:TraceabilityView;evidence:EvidenceItem[];actor:DemoRole;onOpenEvidence:(id:string)=>void;onCreateRelationship:(draft:RelationshipProposalDraft)=>Promise<void> }) {
  const [query,setQuery] = useState('');
  const [type,setType] = useState<'all'|EvidenceType>(mode === 'matrix' ? 'requirement' : 'all');
  const [gapsOnly,setGapsOnly] = useState(false);
  const [composer,setComposer] = useState<ComposerState|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState<string|null>(null);
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
    return <div className={`trace-link-control${link.type === 'MAY_AFFECT' ? ' may-affect' : ''}`} key={link.id}><button className={link.policy.valid ? '' : 'invalid'} onClick={() => onOpenEvidence(peer.id)} title={`${link.policy.meaning} ${link.rationale}`}><b>{link.type.replaceAll('_',' ').toLowerCase()}</b><code>{peer.id}</code><small>v{peer.version ?? '?'} · {link.origin.replaceAll('_',' ')}</small><small>{link.policyId} · {link.approvedBy ? `approved by ${link.approvedBy}` : 'not approved'}</small></button>{actor === 'author' && <span><button onClick={() => setComposer({ operation:'retype',baseRelationshipId:link.id,sourceId:link.sourceId,targetId:link.targetId,type:link.type,rationale:link.rationale })}>Retype</button><button onClick={() => setComposer({ operation:'retire',baseRelationshipId:link.id,sourceId:link.sourceId,targetId:link.targetId,type:link.type,rationale:'' })}>Retire</button></span>}</div>;
  })}</div>;

  const source = evidence.find((item) => item.id === composer?.sourceId);
  const target = evidence.find((item) => item.id === composer?.targetId);
  const sourceOptions = composer?.lockedEndpoint === 'target' && composer.eligiblePeerTypes ? evidence.filter((item) => composer.eligiblePeerTypes?.includes(item.type)) : evidence;
  const targetOptions = composer?.lockedEndpoint === 'source' && composer.eligiblePeerTypes ? evidence.filter((item) => composer.eligiblePeerTypes?.includes(item.type)) : evidence;
  const allowedTypes = traceability.policy.rules.filter((rule) => (!source || rule.sourceTypes.includes(source.type)) && (!target || rule.targetTypes.includes(target.type)));
  const submitComposer = async () => {
    if (!composer || actor !== 'author' || composer.rationale.trim().length < 8) return;
    setBusy(true); setError(null);
    try {
      const draft:RelationshipProposalDraft = composer.operation === 'add'
        ? { operation:'add',sourceId:EvidenceIdSchema.parse(composer.sourceId),targetId:EvidenceIdSchema.parse(composer.targetId),type:RelationshipTypeSchema.parse(composer.type),rationale:composer.rationale }
        : composer.operation === 'retype'
          ? { operation:'retype',baseRelationshipId:composer.baseRelationshipId ?? '',type:RelationshipTypeSchema.parse(composer.type),rationale:composer.rationale }
          : { operation:'retire',baseRelationshipId:composer.baseRelationshipId ?? '',rationale:composer.rationale };
      await onCreateRelationship(draft); setComposer(null);
    } catch (cause:unknown) { setError(cause instanceof Error ? cause.message : 'Could not create the controlled change.'); }
    finally { setBusy(false); }
  };

  return <section className="view-content trace-workspace">
    <div className="page-heading compact"><div><p className="eyebrow teal">Baseline-aware traceability</p><h1>{mode === 'matrix' ? 'Traceability matrix' : 'Coverage and gaps'}</h1><p className="lede">{mode === 'matrix' ? 'Inspect every direct relationship against exact evidence versions in the active baseline.' : 'Review deterministic gaps with the exact policy rule and baseline that produced them.'}</p></div><div>{mode === 'matrix' && <button className="primary-button" disabled={actor !== 'author'} onClick={() => setComposer({ operation:'add',sourceId:'',targetId:'',type:'',rationale:'' })}>Propose relationship</button>}<span className="baseline-pill"><span className="status-dot" />{traceability.baseline.label}</span></div></div>
    <PolicyHeader traceability={traceability} />
    {error && <div className="error-banner" role="alert">{error}</div>}
    {composer && <section className="workflow-stage relationship-composer"><div className="section-heading"><div><p className="eyebrow">Author-controlled proposal</p><h2>{composer.operation === 'add' ? 'Add relationship' : composer.operation === 'retype' ? 'Retype relationship' : 'Retire relationship'}</h2></div><button className="text-button" onClick={() => setComposer(null)}>Cancel</button></div>{composer.operation === 'add' ? <div className="browser-toolbar"><label><span>Source evidence</span><select value={composer.sourceId} disabled={composer.lockedEndpoint === 'source'} onChange={(event) => setComposer({ ...composer,sourceId:event.target.value,type:composer.lockedEndpoint ? composer.type : '' })}><option value="">Choose source</option>{sourceOptions.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}</select></label><label><span>Target evidence</span><select value={composer.targetId} disabled={composer.lockedEndpoint === 'target'} onChange={(event) => setComposer({ ...composer,targetId:event.target.value,type:composer.lockedEndpoint ? composer.type : '' })}><option value="">Choose target</option>{targetOptions.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.title}</option>)}</select></label></div> : <p><code>{composer.sourceId}</code> → <code>{composer.targetId}</code>. Endpoint changes require return to the author as a new proposal.</p>}{composer.operation !== 'retire' && <label className="draft-reason"><span>Relationship type</span><select value={composer.type} onChange={(event) => setComposer({ ...composer,type:event.target.value })}><option value="">Choose type</option>{allowedTypes.map((rule) => <option key={rule.type} value={rule.type}>{rule.label} — {rule.meaning}</option>)}</select></label>}<label className="draft-reason"><span>Statement-based rationale</span><textarea value={composer.rationale} onChange={(event) => setComposer({ ...composer,rationale:event.target.value })} placeholder="Explain why these exact evidence versions have this relationship." /></label><button className="primary-button" disabled={busy || actor !== 'author' || !composer.sourceId || !composer.targetId || (composer.operation !== 'retire' && !composer.type) || composer.rationale.trim().length < 8} onClick={() => void submitComposer()}>{busy ? 'Creating…' : 'Open controlled change'}</button><small>Compatible endpoint types narrow the available policy meanings. They do not prove that the link is semantically adequate.</small></section>}
    {mode === 'matrix' ? <>
      <div className="trace-toolbar"><label><span className="sr-only">Search traceability rows</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search evidence ID or title" /></label><label><span className="sr-only">Filter evidence type</span><select value={type} onChange={(event) => setType(event.target.value === 'all' ? 'all' : EvidenceTypeSchema.parse(event.target.value))}><option value="all">All evidence types</option>{Object.entries(EVIDENCE_TYPE_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="trace-gap-toggle"><input type="checkbox" checked={gapsOnly} onChange={(event) => setGapsOnly(event.target.checked)} /> Gaps only</label><span>{filteredRows.length} rows</span></div>
      <div className="trace-table-wrap"><table className="trace-table"><thead><tr><th>Evidence version</th><th>Incoming stored links</th><th>Outgoing stored links</th><th>Rule gaps</th></tr></thead><tbody>{filteredRows.map((row) => <tr key={row.item.id}><th><button onClick={() => onOpenEvidence(row.item.id)}><code>{row.item.id} · v{row.item.version}</code><b>{row.item.title}</b><small>{EVIDENCE_TYPE_LABELS[row.item.type]} · {row.item.criticality}</small></button></th><td>{linkCell(row.incomingLinkIds,'incoming')}</td><td>{linkCell(row.outgoingLinkIds,'outgoing')}</td><td>{row.gapIds.length === 0 ? <span className="trace-pass">Covered</span> : <div className="trace-gap-ids">{row.gapIds.map((gapId) => <code key={gapId}>{gapId.split(`-${row.item.id}`)[0]}</code>)}</div>}</td></tr>)}</tbody></table></div>
    </> : <>
      {traceability.gaps.length === 0 ? <div className="empty-state"><h2>No coverage gaps</h2><p>The active baseline passes every rule in {traceability.coveragePolicy.id}.</p></div> : <div className="trace-gap-list">{traceability.gaps.map((gap) => { const rule = traceability.coveragePolicy.rules.find((entry) => entry.id === gap.ruleId); return <article key={gap.id}><div><span className={`trace-severity ${gap.severity}`}>{gap.severity}</span><code>{gap.ruleId} · v{gap.ruleVersion}</code></div><button onClick={() => onOpenEvidence(gap.itemId)}><code>{gap.itemId}</code><b>{gap.itemTitle}</b></button><h2>{gap.title}</h2><p>{gap.requirement}</p><small>{gap.actual}</small><button className="secondary-button" disabled={actor !== 'author' || !rule} onClick={() => rule && setComposer({ operation:'add',sourceId:rule.direction === 'outgoing' ? gap.itemId : '',targetId:rule.direction === 'incoming' ? gap.itemId : '',type:rule.relationshipType,rationale:'',lockedEndpoint:rule.direction === 'outgoing' ? 'source' : 'target',eligiblePeerTypes:rule.peerTypes })}>Open controlled change</button>{rule && <small>Choose a semantically adequate {rule.peerTypes.map((peerType) => EVIDENCE_TYPE_LABELS[peerType]).join(' or ')}. Nothing is auto-selected.</small>}</article>; })}</div>}
      <section className="trace-rule-register"><div className="section-heading"><div><p className="eyebrow">Rule register</p><h2>{traceability.coveragePolicy.id}</h2></div><span>{traceability.coveragePolicy.rules.length} deterministic rules</span></div><div>{traceability.coveragePolicy.rules.map((rule) => <article key={rule.id}><code>{rule.id} · v{rule.version}</code><b>{rule.title}</b><p>{rule.requirement}</p><small>{EVIDENCE_TYPE_LABELS[rule.subjectType]} · {rule.direction} {rule.relationshipType.replaceAll('_',' ').toLowerCase()} · {rule.peerTypes.map((peerType) => EVIDENCE_TYPE_LABELS[peerType]).join(' or ')}</small></article>)}</div></section>
    </>}
  </section>;
}
