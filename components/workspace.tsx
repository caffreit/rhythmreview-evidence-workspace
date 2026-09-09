'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { EVIDENCE_TYPE_LABELS, type EvidenceItem, type EvidenceType, type ImpactSuggestion } from '@/lib/domain';
import { formatReviewDuration } from '@/lib/presentation';
import {
  ApprovalResponseSchema, ChangeListResponseSchema, ChangeViewSchema, CoherenceCheckSchema, DocumentListResponseSchema, EvidenceDetailSchema,
  EvidenceListResponseSchema, EvaluationSchema, OverviewSchema, RenderedDocumentSchema,
  type ChangeSummaryView, type ChangeView, type DocumentView, type EvidenceDetailView, type EvaluationView,
  type OverviewView, type RenderedDocumentView, type ScenarioView,
} from '@/lib/view-models';
import { AuditHistory } from './audit-history';
import { CoherenceWorkspace } from './coherence-workspace';
import { GuidedWalkthrough, type WalkthroughStep, type WalkthroughView } from './guided-walkthrough';
import { RecentChanges } from './recent-changes';

type View = WalkthroughView;
type Actor = 'author'|'qa';
type ReviewDecision = 'accepted'|'rejected'|'edited';
const ErrorSchema = z.object({ error:z.string() });
const FilterTypeSchema = z.enum(['intended_use','claim','user_need','requirement','hazard','risk_control','design','test','clinical_evidence','label']);
const ACTIONS = ['review','update','retest','new_link','no_change'] as const;

async function api<T>(url:string,schema:z.ZodType<T>,init?:RequestInit):Promise<T> {
  const response = await fetch(url,{ ...init,headers:{ 'content-type':'application/json',...(init?.headers ?? {}) } });
  const body:unknown = await response.json();
  if (!response.ok) { const parsed = ErrorSchema.safeParse(body); throw new Error(parsed.success ? parsed.data.error : `Request failed with status ${response.status}`); }
  return schema.parse(body);
}

function typeLabel(type:EvidenceType):string { return EVIDENCE_TYPE_LABELS[type]; }
function Loading() { return <div className="loading-state" role="status"><span className="loading-mark">BB</span><p>Preparing the evidence workspace…</p></div>; }
function StatusBadge({ value }:{ value:string }) { return <span className={`status-badge ${value.replaceAll('_','-')}`}>{value.replaceAll('_',' ')}</span>; }

function MetricCard({ id,label,value,caption,explanation,alert = false }:{ id:string;label:string;value:number;caption:string;explanation:string;alert?:boolean }) {
  const tooltipId = `metric-explanation-${id}`;
  return <article className={`metric-card${alert ? ' alert' : ''}`} tabIndex={0} aria-describedby={tooltipId}>
    <div className="metric-label"><p>{label}</p><span className="metric-help" aria-hidden="true">?</span></div>
    <strong>{value}</strong>
    <span className="metric-caption">{caption}</span>
    <span className="metric-tooltip" id={tooltipId} role="tooltip">{explanation}</span>
  </article>;
}

function InlineHelp({ id,explanation }:{ id:string;explanation:string }) {
  const tooltipId = `inline-explanation-${id}`;
  return <span className="inline-help" tabIndex={0} aria-describedby={tooltipId}>
    <span className="inline-help-mark" aria-hidden="true">?</span>
    <span className="inline-help-tooltip" id={tooltipId} role="tooltip">{explanation}</span>
  </span>;
}

function OverviewPanel({ overview,onNavigate }:{ overview:OverviewView;onNavigate:(view:View)=>void }) {
  return <section className="view-content">
    <div className="page-heading"><div><p className="eyebrow teal">RhythmReview · {overview.baseline?.label ?? 'No baseline'}</p><h1>Evidence overview</h1><p className="lede">A clinician-facing ECG triage application for adults aged 22 and over.</p></div><button className="primary-button" onClick={() => onNavigate('changes')}>Open change workspace <span>→</span></button></div>
    <div className="notice" data-walkthrough="overview-boundary"><div className="notice-icon">i</div><p><b>Fictional evaluation dataset.</b> This workspace contains no patient, client, or submission data.</p></div>
    <div className="metric-grid" data-walkthrough="overview-metrics">
      <MetricCard id="evidence" label="Evidence items" value={overview.evidenceCount} caption="10 controlled types" explanation="Controlled evidence records in the active approved baseline, including intended use, claims, needs, requirements, risks, controls, designs, tests, clinical evidence, and labels." />
      <MetricCard id="relationships" label="Direct relationships" value={overview.relationshipCount} caption="In the active approved baseline" explanation="Explicitly stored source-to-target links between evidence items. This count does not include unlinked semantic candidates." />
      <MetricCard id="findings" label="Open coherence findings" value={overview.checkSummary.total} caption={`${overview.checkSummary.high} high severity`} explanation="Specific conditions shown for review. The total combines deterministic checks with seeded evaluation fixtures; it is not a composite health score." alert />
      <MetricCard id="documents" label="Document views" value={overview.documentCount} caption="Abbreviated evidence-grouped views" explanation="Abbreviated views assembled from exact evidence versions in a selected baseline. They are not submission-ready documents." />
    </div>
    <div className="dashboard-grid"><article className="panel evidence-health" data-walkthrough="overview-findings"><div className="panel-heading"><div><p className="eyebrow">Explainable checks</p><h2>Coherence findings <InlineHelp id="coherence-findings" explanation="Specific consistency conditions shown for reviewer attention. Each finding states its origin and can be traced to affected evidence." /></h2></div><button className="text-button" onClick={() => onNavigate('evidence')}>Browse evidence →</button></div><div className="health-summary check-counts"><div><strong>{overview.checkSummary.deterministic}</strong><span className="check-label">deterministic checks <InlineHelp id="deterministic-checks" explanation="Repeatable checks calculated from explicit rules and the stored baseline. They do not require AI judgment." /></span></div><div><strong>{overview.checkSummary.fixtures}</strong><span className="check-label">evaluation fixtures <InlineHelp id="evaluation-fixtures" explanation="Conditions deliberately seeded into the fictional dataset to exercise the review and evaluation workflow. They were not automatically detected." /></span></div><p>No composite health score is assigned.</p></div></article><article className="panel product-definition"><div className="panel-heading"><div><p className="eyebrow">Approved definition</p><h2>Intended use</h2></div><span className="tag">IU-001 · current baseline</span></div><blockquote>RhythmReview analyses a 30-second single-lead ECG recording to assist a qualified clinician in identifying possible atrial fibrillation in adults aged 22 and over.</blockquote><dl><div><dt>User</dt><dd>Qualified clinician</dd></div><div><dt>Decision role</dt><dd>Inform clinical review</dd></div><div><dt>Algorithm</dt><dd>Locked model</dd></div></dl></article></div>
  </section>;
}

function EvidencePanel({ evidence,selectedId,onSelect }:{ evidence:EvidenceItem[];selectedId:string|null;onSelect:(id:string)=>void }) {
  const [query,setQuery] = useState(''); const [type,setType] = useState<'all'|EvidenceType>('all'); const [detail,setDetail] = useState<EvidenceDetailView|null>(null);
  const selected = selectedId ?? evidence[0]?.id ?? null;
  useEffect(() => { if (selected) void api(`/api/evidence/${selected}`,EvidenceDetailSchema).then(setDetail); },[selected]);
  const filtered = useMemo(() => evidence.filter((item) => (type === 'all' || item.type === type) && `${item.id} ${item.title} ${item.statement}`.toLowerCase().includes(query.toLowerCase())),[evidence,query,type]);
  const grouped = useMemo(() => detail ? {
    incoming:detail.relationships.filter((relation) => relation.targetId === detail.item.id),
    outgoing:detail.relationships.filter((relation) => relation.sourceId === detail.item.id),
  } : { incoming:[],outgoing:[] },[detail]);
  const relationshipList = (label:string,relationships:EvidenceDetailView['relationships']) => <div className="relation-group"><div className="subheading"><p className="eyebrow">{label}</p><span>{relationships.length}</span></div><div className="relation-list">{relationships.map((relation) => { const peer = relation.sourceId === detail?.item.id ? relation.targetId : relation.sourceId; return <button key={relation.id} onClick={() => onSelect(peer)}><span className="relation-flow"><code>{relation.sourceId}</code><b>— {relation.type.replaceAll('_',' ').toLowerCase()} →</b><code>{relation.targetId}</code></span><small>Open {peer}</small></button>; })}</div></div>;
  return <section className="view-content"><div className="page-heading compact"><div><p className="eyebrow teal">Active approved baseline</p><h1>Evidence browser</h1><p className="lede">Inspect approved evidence versions and their direct relationships.</p></div><div className="count-chip">{filtered.length} of {evidence.length}</div></div><div className="browser-toolbar"><label><span className="sr-only">Search evidence</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID, title, or statement" /></label><label><span className="sr-only">Filter by type</span><select value={type} onChange={(event) => setType(event.target.value === 'all' ? 'all' : FilterTypeSchema.parse(event.target.value))}><option value="all">All evidence types</option>{Object.entries(EVIDENCE_TYPE_LABELS).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><div className="evidence-layout"><div className="evidence-list" role="list">{filtered.map((item) => <button className={`evidence-list-item ${selected === item.id ? 'selected' : ''}`} key={item.id} onClick={() => onSelect(item.id)}><span><code>{item.id}</code><em>{typeLabel(item.type)}</em></span><b>{item.title}</b><small>{item.statement}</small><i className={`criticality ${item.criticality}`}>{item.criticality}</i></button>)}</div><article className="evidence-detail">{detail && detail.item.id === selected ? <><div className="detail-heading"><div><span className="type-pill">{typeLabel(detail.item.type)}</span><code>{detail.item.id} · v{detail.item.version}</code></div><StatusBadge value={detail.item.status} /></div><h2>{detail.item.title}</h2><p className="controlled-statement">{detail.item.statement}</p><div className="detail-meta"><div><span>Owner</span><b>{detail.item.owner}</b></div><div><span>Criticality</span><b>{detail.item.criticality}</b></div><div><span>Jurisdiction</span><b>{detail.item.jurisdictions.join(' + ')}</b></div></div><section><p className="eyebrow">Rationale</p><p>{detail.item.rationale}</p></section>{detail.item.flags.length > 0 && <section className="finding-box"><p className="eyebrow">Seed metadata used by evaluation fixtures</p>{detail.item.flags.map((flag) => <span key={flag}>{flag.replaceAll('_',' ')}</span>)}</section>}<section data-walkthrough="evidence-relationships"><div className="subheading"><div><p className="eyebrow">Stored source and target direction</p><small>Incoming and outgoing describe the saved link direction, not dependency semantics.</small></div><span>{detail.relationships.length} total</span></div>{relationshipList('Incoming relationships · this item is the target',grouped.incoming)}{relationshipList('Outgoing relationships · this item is the source',grouped.outgoing)}</section><section><p className="eyebrow">Version history</p>{detail.versions.map((version) => <div className="version-row" key={version.versionId}><span>v{version.version}</span><b>{version.status}</b><small>{version.approvedBy ?? 'Not approved'}</small></div>)}</section></> : <Loading />}</article></div></section>;
}

function DocumentsPanel({ documents,refreshToken,onBaselineViewed }:{ documents:DocumentView[];refreshToken:string;onBaselineViewed:(label:string)=>void }) {
  const [selected,setSelected] = useState(documents[0]?.id ?? 'DOC-001'); const [baselineId,setBaselineId] = useState<string|null>(null); const [rendered,setRendered] = useState<RenderedDocumentView|null>(null); const [loadedKey,setLoadedKey] = useState<string|null>(null); const [loadError,setLoadError] = useState<string|null>(null);
  const requestKey = `${selected}|${baselineId ?? 'active'}|${refreshToken}`;
  const isLoading = loadedKey !== requestKey;
  useEffect(() => {
    let current = true;
    const query = baselineId ? `?baselineId=${encodeURIComponent(baselineId)}` : '';
    void api(`/api/documents/${selected}${query}`,RenderedDocumentSchema)
      .then((value) => {
        if (!current) return;
        setRendered(value);
        if (!baselineId) setBaselineId(value.baseline.id);
        setLoadedKey(requestKey);
        setLoadError(null);
        onBaselineViewed(value.baseline.label);
      })
      .catch((reason:unknown) => { if (current) { setLoadError(reason instanceof Error ? reason.message : 'Could not load the selected snapshot.');setLoadedKey(requestKey); } })
    return () => { current = false; };
  },[selected,baselineId,requestKey,onBaselineViewed]);
  const groups = useMemo(() => { const result = new Map<EvidenceType,EvidenceItem[]>(); for (const item of rendered?.items ?? []) result.set(item.type,[...(result.get(item.type) ?? []),item]); return [...result.entries()]; },[rendered]);
  const superseded = rendered?.items.filter((item) => item.status === 'superseded') ?? [];
  return <section className="view-content document-workspace"><div className="page-heading compact no-print"><div><p className="eyebrow teal">Immutable snapshots</p><h1>Controlled document views</h1><p className="lede">Each abbreviated view records the exact baseline and evidence versions used to render it.</p></div><div className="document-actions"><label data-walkthrough="document-baseline"><span>Approved baseline</span><select aria-label="Approved baseline" value={baselineId ?? ''} disabled={isLoading} onChange={(event) => { setLoadError(null);setBaselineId(event.target.value); }}>{rendered?.availableBaselines.map((baseline) => <option value={baseline.id} key={baseline.id}>{baseline.label} · {baseline.status}</option>)}</select></label><button className="secondary-button" disabled={isLoading} onClick={() => window.print()}>Print to PDF</button></div></div><div className="document-layout"><aside className="document-list no-print">{documents.map((document) => <button key={document.id} disabled={isLoading} className={selected === document.id ? 'selected' : ''} onClick={() => { setLoadError(null);setSelected(document.id); }}><span>{document.code}</span><b>{document.title}</b><small>{document.description}</small></button>)}</aside><article className="document-page" data-walkthrough="document-snapshot" aria-busy={isLoading}>{rendered ? <><header><p className="document-brand">BLUE BRIDGE · RHYTHMREVIEW</p><span>Controlled snapshot</span></header><div className="document-title"><p>{rendered.document.code} · {rendered.baseline.label}</p><h1>{rendered.document.title}</h1><p>{rendered.document.description}</p></div><div className="document-control"><div><span>Baseline status</span><b>{rendered.baseline.status}</b></div><div><span>Baseline</span><b>{rendered.baseline.label}</b></div><div><span>Approved by</span><b>{rendered.baseline.approvedBy ?? 'Not approved'}</b></div><div><span>Snapshot</span><b>{rendered.snapshotId}</b></div></div>{superseded.length > 0 && <div className="warning-banner">This snapshot includes superseded evidence: {superseded.map((item) => item.id).join(', ')}. The deterministic coherence check reports this condition.</div>}{groups.map(([groupType,items],index) => <section className="document-section" key={groupType}><p className="section-number">{String(index + 1).padStart(2,'0')}</p><div><h2>{typeLabel(groupType)}</h2>{items.map((item) => <article key={item.id}><div><code>{item.id} · v{item.version}</code><b>{item.title}</b></div><p>{item.statement}</p></article>)}</div></section>)}<footer>Fictional abbreviated document view · {rendered.items.length} source versions · snapshot created {new Date(rendered.renderedAt).toLocaleString()}</footer></> : <Loading />}{isLoading && rendered && <div className="document-loading" role="status">Loading the selected immutable snapshot…</div>}{loadError && <div className="error-banner" role="alert">{loadError}</div>}</article></div></section>;
}

function SuggestionCard({ suggestion,item,disabled,onDecision }:{ suggestion:ImpactSuggestion;item:EvidenceItem|undefined;disabled:boolean;onDecision:(id:string,decision:ReviewDecision,reason:string,editedAction?:typeof ACTIONS[number])=>void }) {
  const [editing,setEditing] = useState(false); const [decision,setDecision] = useState<ReviewDecision>('accepted'); const [editedAction,setEditedAction] = useState<typeof ACTIONS[number]>(suggestion.effectiveAction ?? suggestion.action); const [reason,setReason] = useState('');
  const submit = () => { if (reason.trim().length < 2) return; onDecision(suggestion.id,decision,reason,decision === 'edited' ? editedAction : undefined); setEditing(false); };
  return <article className={`suggestion ${suggestion.decision}`} data-walkthrough={`suggestion-${suggestion.targetId}`}><div className="suggestion-top"><div><span className={`origin ${suggestion.origin}`}>{suggestion.origin === 'linked' ? 'Confirmed graph path' : 'Unlinked semantic candidate'}</span></div><StatusBadge value={suggestion.effectiveAction ?? suggestion.action} /></div><div className="suggestion-title"><code>{suggestion.targetId}</code><h3>{item?.title ?? suggestion.targetId}</h3></div><p>{suggestion.rationale}</p>{suggestion.origin === 'linked' ? <div className="path-strip"><span>Confirmed path</span>{suggestion.path.map((id,index) => <span key={`${id}-${index}`}><code>{id}</code>{index < suggestion.path.length - 1 && <b>→</b>}</span>)}</div> : <div className="path-strip unlinked"><span>No direct relationship asserted</span><code>{suggestion.targetId}</code></div>}{suggestion.decision === 'edited' && <p className="decision-note">Original suggested action: <b>{suggestion.action}</b>. QA changed the controlled-scope action to <b>{suggestion.effectiveAction}</b>.</p>}{suggestion.decisionReason && <p className="decision-note">{suggestion.decidedBy}: {suggestion.decisionReason}</p>}<div className="suggestion-actions"><span>{suggestion.decision === 'pending' ? 'Awaiting QA decision' : `QA decision: ${suggestion.decision}`}</span><button disabled={disabled} onClick={() => { setDecision('rejected');setEditing(true); }}>{suggestion.decision === 'pending' ? 'Reject' : 'Revise decision'}</button><button className="accept" disabled={disabled} onClick={() => { setDecision('accepted');setEditing(true); }}>Accept</button><button disabled={disabled} onClick={() => { setDecision('edited');setEditing(true); }}>Edit action</button></div>{disabled && <small className="role-hint">Switch to QA reviewer to decide impact scope. Decisions close when drafting starts.</small>}{editing && <div className="decision-editor"><label><span>QA decision</span><select value={decision} onChange={(event) => setDecision(event.target.value as ReviewDecision)}><option value="accepted">Accept into change scope</option><option value="rejected">Reject from change scope</option><option value="edited">Accept with edited action</option></select></label>{decision === 'edited' && <label><span>Replacement action</span><select value={editedAction} onChange={(event) => setEditedAction(event.target.value as typeof ACTIONS[number])}>{ACTIONS.map((action) => <option key={action} value={action}>{action.replaceAll('_',' ')}</option>)}</select></label>}<label><span>Reason</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Record the evidence-based QA reason" /></label><div><button onClick={() => setEditing(false)}>Cancel</button><button className="accept" disabled={reason.trim().length < 2} onClick={submit}>Record decision</button></div></div>}</article>;
}

function DraftCard({ update,item,disabled,onUpdate }:{ update:ChangeView['updates'][number];item:EvidenceItem|undefined;disabled:boolean;onUpdate:(id:string,operation:'save'|'discard'|'restore',reason:string,text?:string)=>void }) {
  const [text,setText] = useState(update.proposedText); const [reason,setReason] = useState('');
  const historical = update.status === 'superseded' || update.status === 'approved';
  return <article className={update.status === 'discarded' || historical ? 'discarded' : ''} data-walkthrough={`draft-${update.itemId}`}>
    <div><code>{update.itemId} · candidate v{update.toVersion}</code><StatusBadge value={update.status} /></div>
    <h3>{item?.title}</h3>
    <p className="provenance-line">Original draft source: {update.draftOrigin.replaceAll('_',' ')}. Created by {update.createdBy}.</p>
    <div className="redline"><p><small>APPROVED BASELINE</small>{item?.statement}</p><p><small>ORIGINAL DRAFT, IMMUTABLE</small>{update.originalText}</p></div>
    <label className="draft-editor"><span>Author candidate text</span><textarea value={text} disabled={disabled || update.status !== 'proposed'} onChange={(event) => setText(event.target.value)} /></label>
    {update.editedBy && <p className="decision-note">Last changed by {update.editedBy}: {update.editReason}</p>}
    {!historical && <><label className="draft-reason"><span>Edit, discard, or restore reason</span><input value={reason} disabled={disabled} onChange={(event) => setReason(event.target.value)} placeholder="Required for every draft change" /></label><div className="draft-actions">{update.status === 'discarded' ? <button className="accept" disabled={disabled || reason.trim().length < 2} onClick={() => onUpdate(update.id,'restore',reason)}>Restore candidate version</button> : <><button disabled={disabled || reason.trim().length < 2} onClick={() => onUpdate(update.id,'discard',reason)}>Discard candidate version</button><button className="accept" disabled={disabled || reason.trim().length < 2 || text.trim().length < 8} onClick={() => onUpdate(update.id,'save',reason,text)}>Save author edit</button></>}</div></>}
    {disabled && !historical && <small className="role-hint">Switch to Author to manage candidate versions before QA submission.</small>}
  </article>;
}


function ChangePanel({ overview,evidence,recentChanges,openChangeId,actor,selectedScenario,setSelectedScenario,onOpenChange,onWorkspaceRefresh,onOpenEvidence,onChangeState,onResetWorkspace,onAuditInspect }:{
  overview:OverviewView;
  evidence:EvidenceItem[];
  recentChanges:ChangeSummaryView[];
  openChangeId:string|null;
  actor:Actor;
  selectedScenario:ScenarioView|null;
  setSelectedScenario:(scenario:ScenarioView|null)=>void;
  onOpenChange:(change:ChangeSummaryView|null)=>void;
  onWorkspaceRefresh:()=>Promise<void>;
  onOpenEvidence:(itemId:string)=>void;
  onChangeState:(change:ChangeView|null)=>void;
  onResetWorkspace:()=>Promise<void>;
  onAuditInspect:()=>void;
}) {
  const [change,setChange] = useState<ChangeView|null>(null);
  const [mode,setMode] = useState<'replay'|'live'>('replay');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState<string|null>(null);
  const [returnReason,setReturnReason] = useState('');
  const [reopenReason,setReopenReason] = useState('');
  const itemById = useMemo(() => new Map(evidence.map((item) => [item.id,item])),[evidence]);

  useEffect(() => {
    if (!openChangeId) return;
    void api(`/api/changes/${openChangeId}`,ChangeViewSchema).then(setChange).catch((reason:unknown) => setError(reason instanceof Error ? reason.message : 'Could not open the stored change.'));
  },[openChangeId]);
  useEffect(() => { onChangeState(change); },[change,onChangeState]);

  const runAction = useCallback(async (action:()=>Promise<ChangeView>) => {
    setBusy(true); setError(null);
    try { const result = await action(); setChange(result); await onWorkspaceRefresh(); }
    catch (reason:unknown) { setError(reason instanceof Error ? reason.message : 'The action failed.'); }
    finally { setBusy(false); }
  },[onWorkspaceRefresh]);

  const create = () => {
    if (!selectedScenario) return;
    void runAction(async () => {
      const created = await api('/api/changes',ChangeViewSchema,{ method:'POST',body:JSON.stringify({ scenarioId:selectedScenario.id,anchorItemId:selectedScenario.anchorId,title:selectedScenario.title,proposedText:selectedScenario.proposedText,rationale:selectedScenario.rationale,createdBy:'Alex Morgan · Author' }) });
      return created;
    });
  };
  const analyse = () => { if (change) void runAction(() => api(`/api/changes/${change.id}/analyse`,ChangeViewSchema,{ method:'POST',body:JSON.stringify({ mode }) })); };
  const reopen = () => { if (change) void runAction(() => api(`/api/changes/${change.id}/reopen-analysis`,ChangeViewSchema,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author',mode,reason:reopenReason }) })); };
  const decide = (id:string,decision:ReviewDecision,reason:string,editedAction?:typeof ACTIONS[number]) => void runAction(() => api(`/api/suggestions/${id}/decision`,ChangeViewSchema,{ method:'POST',body:JSON.stringify({ decision,reason,editedAction,actor:'Jamie Chen · QA reviewer' }) }));
  const completeGuidedReview = () => { if (change) void runAction(() => api(`/api/changes/${change.id}/guided-review-completion`,ChangeViewSchema,{ method:'POST',body:JSON.stringify({ actor:'Jamie Chen · QA reviewer',confirmation:true }) })); };
  const draft = () => { if (change) void runAction(() => api(`/api/changes/${change.id}/draft-updates`,ChangeViewSchema,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author' }) })); };
  const updateDraft = (id:string,operation:'save'|'discard'|'restore',reason:string,proposedText?:string) => void runAction(() => api(`/api/updates/${id}`,ChangeViewSchema,{ method:'PATCH',body:JSON.stringify({ operation,reason,proposedText,actor:'Alex Morgan · Author' }) }));
  const submit = () => { if (change) void runAction(() => api(`/api/changes/${change.id}/submit`,ChangeViewSchema,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author' }) })); };
  const returnToAuthor = () => { if (change) void runAction(() => api(`/api/changes/${change.id}/return-to-author`,ChangeViewSchema,{ method:'POST',body:JSON.stringify({ actor:'Jamie Chen · QA reviewer',reason:returnReason }) })); };
  const approve = async () => {
    if (!change) return;
    setBusy(true); setError(null);
    try { const result = await api(`/api/changes/${change.id}/approve`,ApprovalResponseSchema,{ method:'POST',body:JSON.stringify({ actor:'Jamie Chen · QA reviewer',confirmation:true }) }); setChange(result.change); await onWorkspaceRefresh(); }
    catch (reason:unknown) { setError(reason instanceof Error ? reason.message : 'Approval failed.'); }
    finally { setBusy(false); }
  };
  const reset = async () => {
    setBusy(true); setError(null);
    try { await onResetWorkspace(); setChange(null); setSelectedScenario(null); onOpenChange(null); }
    catch (reason:unknown) { setError(reason instanceof Error ? reason.message : 'Reset failed.'); }
    finally { setBusy(false); }
  };
  const refreshChange = async () => { if (change) setChange(await api(`/api/changes/${change.id}`,ChangeViewSchema)); };
  const runCandidateCheck = async () => {
    if (!change) return;
    setBusy(true); setError(null);
    try { await api('/api/coherence-checks',CoherenceCheckSchema,{ method:'POST',body:JSON.stringify({ scope:{ kind:'candidate',changeId:change.id },actor:actor === 'qa' ? 'Jamie Chen · QA reviewer' : 'Alex Morgan · Author' }) }); await refreshChange(); await onWorkspaceRefresh(); }
    catch (reason:unknown) { setError(reason instanceof Error ? reason.message : 'Could not run candidate checks.'); }
    finally { setBusy(false); }
  };
  const disposition = async (finding:NonNullable<ChangeView['coherence']>['findings'][number],action:'waived'|'waiver_removed',reason:string) => {
    if (!change?.coherence) return;
    setBusy(true); setError(null);
    try { await api(`/api/coherence-findings/${encodeURIComponent(finding.id)}/dispositions`,CoherenceCheckSchema,{ method:'POST',body:JSON.stringify({ action,runId:change.coherence.id,fingerprint:finding.fingerprint,actor:'Jamie Chen · QA reviewer',reason }) }); await refreshChange(); await onWorkspaceRefresh(); }
    catch (cause:unknown) { setError(cause instanceof Error ? cause.message : 'Could not record the finding disposition.'); }
    finally { setBusy(false); }
  };
  const scrollTo = (id:string) => document.getElementById(id)?.scrollIntoView({ behavior:'smooth',block:'start' });

  if (openChangeId && !change) return <Loading />;
  if (!change && !selectedScenario) return <section className="view-content"><div className="page-heading compact"><div><p className="eyebrow teal">Customer compliance workflow</p><h1>Change workspace</h1><p className="lede">Reopen retained work or start a guided scenario. Approved baselines remain unchanged until separate QA approval.</p></div></div><RecentChanges changes={recentChanges} onOpen={(summary) => { setChange(null);onOpenChange(summary); }} /><div className="section-heading scenario-heading"><div><p className="eyebrow">Fictional demonstrations</p><h2>Guided scenarios</h2></div></div><div className="change-scenario-grid">{overview.scenarios.map((scenario) => <button data-walkthrough={scenario.id === 'SCN-002' ? 'scenario-timing' : undefined} onClick={() => { setChange(null);onOpenChange(null);setSelectedScenario(scenario); }} key={scenario.id}><span>{scenario.number}</span><p>{scenario.scale}</p><h2>{scenario.title}</h2><small>Starts from {scenario.anchorId}</small><b>Open scenario →</b></button>)}</div></section>;

  const anchorId = change?.anchorItemId ?? selectedScenario?.anchorId;
  const anchor = anchorId ? itemById.get(anchorId) : null;
  const currentUpdates = change?.updates.filter((update) => update.status !== 'superseded' && (!change.run || update.analysisRunId === '' || update.analysisRunId === change.run.id)) ?? [];
  const historicalUpdates = change?.updates.filter((update) => update.status === 'superseded') ?? [];
  const activeUpdates = currentUpdates.filter((update) => update.status === 'proposed');
  const allDecided = Boolean(change?.run) && Boolean(change?.suggestions.every((suggestion) => suggestion.decision !== 'pending'));
  const actionableAccepted = change?.suggestions.some((suggestion) => (suggestion.decision === 'accepted' || suggestion.decision === 'edited') && (suggestion.effectiveAction === 'update' || suggestion.effectiveAction === 'retest')) ?? false;
  const canReopen = change ? ['ready_for_review','under_review','updates_proposed','returned_to_author'].includes(change.status) : false;
  const req004 = change?.suggestions.find((suggestion) => suggestion.targetId === 'REQ-004');
  const test007 = change?.suggestions.find((suggestion) => suggestion.targetId === 'TEST-007');
  const un004 = change?.suggestions.find((suggestion) => suggestion.targetId === 'UN-004');
  const guidedManualExamplesComplete = change?.scenarioId === 'SCN-002' && change.run?.mode === 'replay'
    && req004?.decision === 'accepted'
    && test007?.decision === 'accepted'
    && change.audit.some((event) => event.entityId === test007.id && event.action === 'suggestion_rejected')
    && un004?.decision === 'edited'
    && un004.effectiveAction === 'update';
  const guidedPendingCount = change?.suggestions.filter((suggestion) => suggestion.decision === 'pending').length ?? 0;
  const proposalText = change?.proposedText ?? selectedScenario?.proposedText ?? '';
  const rationale = change?.rationale ?? selectedScenario?.rationale ?? '';
  const title = change?.title ?? selectedScenario?.title ?? 'Controlled change';
  const scenarioLabel = selectedScenario ? `Scenario ${selectedScenario.number} · ${selectedScenario.scale}` : 'Stored controlled change';

  return <section className="view-content"><div className="page-heading compact"><div><p className="eyebrow teal">{scenarioLabel}</p><h1>{title}</h1><p className="lede">{rationale}</p></div><button className="secondary-button" onClick={() => { setChange(null);setSelectedScenario(null);onOpenChange(null); }}>All changes</button></div>{error && <div className="error-banner" role="alert">{error}</div>}
    <div className="change-stepper"><button className={change ? 'done' : 'current'} onClick={() => scrollTo('stage-proposal')}>1 · Proposal</button><button className={change?.run ? 'done' : change ? 'current' : ''} disabled={!change} onClick={() => scrollTo('stage-analysis')}>2 · Analysis</button><button className={allDecided ? 'done' : change?.run ? 'current' : ''} disabled={!change?.run} onClick={() => scrollTo('stage-review')}>3 · Scope review</button><button className={currentUpdates.length ? 'done' : ''} disabled={!currentUpdates.length} onClick={() => scrollTo('stage-draft')}>4 · Candidate drafts</button><button className={change?.status === 'approved' ? 'done' : change?.status === 'qa_review' ? 'current' : ''} disabled={change?.status !== 'qa_review' && change?.status !== 'approved'} onClick={() => scrollTo('stage-approval')}>5 · QA approval</button></div>
    <section id="stage-proposal" className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">Controlled proposal</p><h2>{change?.id ?? 'Not yet created'}</h2></div>{change && <StatusBadge value={change.status} />}</div><div className="change-proposal"><article><p className="eyebrow">Current approved evidence</p><div className="change-item-heading"><code>{anchor?.id}</code><h2>{anchor?.title}</h2></div><p>{anchor?.statement}</p></article><div className="change-arrow">→</div><article className="proposed"><p className="eyebrow">Human-authored proposal fixture</p><div className="change-item-heading"><code>{anchorId}</code><h2>Candidate wording</h2></div><p>{proposalText}</p></article><div className="proposal-rationale"><span>Rationale</span><p>{rationale}</p></div>{!change && <><button className="primary-button" data-walkthrough="create-change" disabled={actor !== 'author' || busy} onClick={create}>{busy ? 'Creating…' : 'Create controlled change'}</button>{actor !== 'author' && <small className="role-hint">Switch to Author to create the change.</small>}</>}</div></section>
    {change && <section id="stage-analysis" className="workflow-stage analysis-launch"><div className="section-heading"><div><p className="eyebrow">Impact analysis</p><h2>{change.run ? 'Current analysis run' : 'Choose an analysis mode'}</h2></div>{change.run && <span className="tag">{change.analysisHistory.length} retained run{change.analysisHistory.length === 1 ? '' : 's'}</span>}</div><p>Deterministic relationship traversal supplies graph candidates. Replay loads a locked fixture. Live mode sends only supplied fictional candidates to OpenAI.</p><div className="mode-switch"><button className={mode === 'replay' ? 'active' : ''} onClick={() => setMode('replay')}><b>Replay fixture</b><span>Saved output, no API key</span></button><button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}><b>Live OpenAI</b><span>Requires a configured API key</span></button></div>{!change.run && <button className="primary-button" data-walkthrough="load-replay" disabled={actor !== 'author' || busy || change.status !== 'draft'} onClick={analyse}>{busy ? 'Analysing…' : mode === 'replay' ? 'Load replay fixture' : 'Run live AI analysis'}</button>}{change.run && <p>{change.run.mode === 'replay' ? 'Locked replay fixture' : 'Live OpenAI output'} · {change.run.model} · {change.run.promptVersion}</p>}{canReopen && <div className="workflow-command"><label><span>Reason to supersede the current analysis</span><input value={reopenReason} disabled={actor !== 'author' || busy} onChange={(event) => setReopenReason(event.target.value)} /></label><button className="secondary-button" disabled={actor !== 'author' || busy || reopenReason.trim().length < 2} onClick={reopen}>Reopen analysis</button><small>A successful run supersedes current decisions and drafts. A failed run restores them.</small></div>}{change.analysisHistory.filter((run) => run.status === 'failed').map((run) => <div className="warning-banner" key={run.id}>Failed {run.mode} run: {run.error}</div>)}</section>}
    {change?.analysisWarning && <div className="warning-banner">{change.analysisWarning}</div>}
    {change?.run && <section id="stage-review" className="workflow-stage" data-walkthrough="suggestion-review"><div className="review-summary"><div><p className="eyebrow">Impact suggestions, not evidence updates</p><h2>{change.suggestions.length} suggestions for QA classification</h2><p>Accepting a suggestion adds an item and action to the controlled change scope. It does not edit or approve evidence.</p></div><div><span><b>{change.suggestions.filter((item) => item.origin === 'semantic').length}</b> unlinked candidates</span><span><b>{change.suggestions.filter((item) => item.decision !== 'pending').length}</b> reviewed</span></div></div><div className="suggestion-list">{change.suggestions.map((suggestion) => <SuggestionCard key={suggestion.id} suggestion={suggestion} item={itemById.get(suggestion.targetId)} disabled={actor !== 'qa' || busy || (change.status !== 'ready_for_review' && change.status !== 'under_review')} onDecision={decide} />)}</div>{guidedManualExamplesComplete && guidedPendingCount > 0 && <div className="guided-completion" data-walkthrough="guided-completion"><div><p className="eyebrow">Guided replay helper</p><h3>Complete {guidedPendingCount} remaining saved decisions</h3><p>This records labelled fixture decisions after the presenter has demonstrated accept, reject and revise, and edit action. Each decision remains visible in the audit history.</p></div><button className="secondary-button" disabled={actor !== 'qa' || busy} onClick={completeGuidedReview}>{busy ? 'Recording…' : 'Apply remaining fixture decisions'}</button></div>}{allDecided && actionableAccepted && currentUpdates.length === 0 && <div className="next-action"><div><p className="eyebrow">Author action</p><h2>Create candidate draft versions</h2><p>Replay drafting uses labelled fixture text. The original draft remains available after human edits.</p></div><button className="primary-button" data-walkthrough="create-drafts" disabled={actor !== 'author' || busy} onClick={draft}>Create candidate drafts →</button></div>}{!allDecided && <p className="gate-note">QA must decide every current suggestion before the author can draft candidate versions.</p>}</section>}
    {change && currentUpdates.length > 0 && <section id="stage-draft" className="workflow-stage update-review"><div className="section-heading"><div><p className="eyebrow">Candidate versions, not approved evidence</p><h2>{activeUpdates.length} retained · {currentUpdates.filter((update) => update.status === 'discarded').length} discarded</h2></div><StatusBadge value={change.status} /></div>{currentUpdates.map((update) => <DraftCard key={update.id} update={update} item={itemById.get(update.itemId)} disabled={actor !== 'author' || busy || (change.status !== 'updates_proposed' && change.status !== 'returned_to_author')} onUpdate={updateDraft} />)}{(change.status === 'updates_proposed' || change.status === 'returned_to_author') && <button className="primary-button" data-walkthrough="submit-candidates" disabled={actor !== 'author' || busy || activeUpdates.length === 0} onClick={submit}>Send retained candidate versions to QA →</button>}</section>}
    {historicalUpdates.length > 0 && <details className="workflow-stage historical-drafts"><summary>{historicalUpdates.length} superseded candidate draft{historicalUpdates.length === 1 ? '' : 's'}</summary>{historicalUpdates.map((update) => <DraftCard key={update.id} update={update} item={itemById.get(update.itemId)} disabled onUpdate={updateDraft} />)}</details>}
    {change && <CoherenceWorkspace title="Projected candidate findings" check={change.coherence} actor={actor} busy={busy} onRun={() => void runCandidateCheck()} onDisposition={(finding,action,reason) => void disposition(finding,action,reason)} onOpenEvidence={onOpenEvidence} />}
    {change?.status === 'qa_review' && <section id="stage-approval" className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">Separate QA baseline decision</p><h2>Candidate baseline awaiting QA</h2></div><StatusBadge value={change.status} /></div><p>The active approved baseline remains unchanged. Returning the candidate preserves the current analysis, decisions, and drafts.</p><div className="approval-actions"><div className="workflow-command"><label><span>Reason to return to author</span><input value={returnReason} disabled={actor !== 'qa' || busy} onChange={(event) => setReturnReason(event.target.value)} /></label><button className="secondary-button" disabled={actor !== 'qa' || busy || returnReason.trim().length < 2} onClick={returnToAuthor}>Return to author</button></div><button className="approve-button" data-walkthrough="approve-baseline" disabled={actor !== 'qa' || busy} onClick={() => void approve()}>Approve new immutable baseline</button></div>{actor !== 'qa' && <small className="role-hint">Switch to QA reviewer to return or approve the candidate. The author cannot do either.</small>}</section>}
    {change?.status === 'approved' && <section id="stage-approval" className="workflow-stage" data-walkthrough="approval-complete"><div className="approval-complete"><span>✓</span><div><h3>New baseline approved</h3><p>This stored change is read-only. The prior baseline and every superseded analysis remain available.</p></div></div></section>}
    {change && <AuditHistory events={change.audit} onInspect={onAuditInspect} />}
    <div className="demo-controls"><p><b>Presenter note</b>{selectedScenario?.presenter ?? 'This stored change retains its controlled history.'}</p><button data-walkthrough="reset-workspace" disabled={busy} onClick={() => void reset()}>Reset workspace</button></div>
  </section>;
}

function EvaluationPanel({ scenarios }:{ scenarios:ScenarioView[] }) {
  const [scenarioId,setScenarioId] = useState(scenarios[0]?.id ?? 'SCN-001'); const [runId,setRunId] = useState<string|null>(null); const [evaluation,setEvaluation] = useState<EvaluationView|null>(null);
  useEffect(() => { const query = runId ? `?runId=${encodeURIComponent(runId)}` : ''; void api(`/api/evaluations/${scenarioId}${query}`,EvaluationSchema).then((value) => { setEvaluation(value); if (runId && !value.runs.some((run) => run.id === runId)) setRunId(null); }); },[scenarioId,runId]);
  const calculated = evaluation?.calculated; const manual = evaluation?.illustrativeComparisons.manual; const timeSaving = calculated && manual && manual.minutes > 0 ? Math.round((1 - calculated.reviewMinutes / manual.minutes) * 100) : null;
  return <section className="view-content"><div className="page-heading compact"><div><p className="eyebrow teal">Internal validation workflow</p><h1>Evaluation dashboard</h1><p className="lede">This page is separate from the customer compliance workflow. It compares a stored run with a locked provisional human answer key.</p></div><div className="evaluation-selectors"><label className="scenario-select"><span>Scenario</span><select value={scenarioId} onChange={(event) => { setScenarioId(event.target.value);setRunId(null); }}>{scenarios.map((scenario) => <option value={scenario.id} key={scenario.id}>{scenario.number} · {scenario.title}</option>)}</select></label><label className="scenario-select"><span>Stored structured run</span><select value={runId ?? evaluation?.selectedRun?.id ?? ''} onChange={(event) => setRunId(event.target.value)}><option value="">Latest completed run</option>{evaluation?.runs.map((run) => <option value={run.id} key={run.id}>{run.mode} · {new Date(run.createdAt).toLocaleString()}</option>)}</select></label></div></div><div className="evaluation-warning" role="note"><b>Not model-performance evidence.</b> Replay suggestions were authored from the same provisional answer key used here. Use this page to inspect calculation mechanics only until independent QA/RA review is complete.</div>{evaluation ? <>{calculated ? <><div className="gate-grid"><article><p>Critical-impact recall</p><strong>{calculated.criticalRecall}%</strong><span className={calculated.criticalRecall >= evaluation.thresholds.criticalRecall ? 'pass' : 'fail'}>{calculated.criticalRecall >= evaluation.thresholds.criticalRecall ? 'Pass' : 'Below target'} · target {evaluation.thresholds.criticalRecall}%</span></article><article><p>Overall recall</p><strong>{calculated.overallRecall}%</strong><span className={calculated.overallRecall >= evaluation.thresholds.overallRecall ? 'pass' : 'fail'}>{calculated.overallRecall >= evaluation.thresholds.overallRecall ? 'Pass' : 'Below target'} · target {evaluation.thresholds.overallRecall}%</span></article><article><p>Actionable precision</p><strong>{calculated.actionablePrecision}%</strong><span className={calculated.actionablePrecision >= evaluation.thresholds.actionablePrecision ? 'pass' : 'fail'}>{calculated.actionablePrecision >= evaluation.thresholds.actionablePrecision ? 'Pass' : 'Below target'} · target {evaluation.thresholds.actionablePrecision}%</span></article><article><p>Recorded review time</p><strong>{formatReviewDuration(calculated.reviewSeconds,calculated.reviewMinutes)}</strong><span>{timeSaving === null ? 'No comparison' : `${timeSaving}% versus illustrative manual time`}</span></article></div><article className="evaluation-table panel"><div className="panel-heading"><div><p className="eyebrow">Calculated selected-run result</p><h2>{evaluation.scenario.title}</h2></div><span className="tag">Locked provisional ground truth · {evaluation.expectedIds.length} items</span></div><div className="evaluation-run-facts"><span>{calculated.mode === 'replay' ? 'Replay fixture' : 'Live AI'}</span><span>{calculated.reviewed} of {calculated.totalSuggestions} reviewed</span><span>{calculated.accepted} accepted</span><span>{calculated.corrections} action edits</span></div></article></> : <div className="empty-state"><h2>No completed structured run</h2><p>Run a guided replay or live analysis, then record QA decisions. This page does not substitute seeded scores.</p></div>}<article className="evaluation-table panel"><div className="panel-heading"><div><p className="eyebrow">Illustrative comparison fixtures</p><h2>Manual and document-chat values</h2></div><span className="tag">Not calculated from this run</span></div><div className="table-header"><span>Workflow</span><span>Recall</span><span>Precision</span><span>Review time</span></div>{[{ label:'Manual review',metrics:evaluation.illustrativeComparisons.manual },{ label:'Document chat',metrics:evaluation.illustrativeComparisons.chat }].map(({ label,metrics }) => <div className="table-row" key={label}><b>{label}</b><span>{metrics.recall}%</span><span>{metrics.precision}%</span><span>{metrics.minutes} min</span></div>)}</article><div className="evaluation-notes"><article><p className="eyebrow">Ground-truth boundary</p><h3>Provisional and locked in the interface</h3><p>Blue Bridge QA and regulatory specialists must review the answer key before using these measures for a decision.</p></article><article><p className="eyebrow">Calculation boundary</p><h3>QA decisions drive the selected-run result</h3><p>Accepted or edited items count as found. Rejected and pending suggestions do not. Exact update and retest actions determine actionable precision.</p></article></div></> : <Loading />}</section>;
}

export default function Workspace() {
  const [view,setView] = useState<View>('overview'); const [actor,setActor] = useState<Actor>('author'); const [overview,setOverview] = useState<OverviewView|null>(null); const [evidence,setEvidence] = useState<EvidenceItem[]>([]); const [documents,setDocuments] = useState<DocumentView[]>([]); const [recentChanges,setRecentChanges] = useState<ChangeSummaryView[]>([]); const [selectedEvidence,setSelectedEvidence] = useState<string|null>(null); const [selectedScenario,setSelectedScenario] = useState<ScenarioView|null>(null); const [selectedChangeId,setSelectedChangeId] = useState<string|null>(null); const [walkthroughChange,setWalkthroughChange] = useState<ChangeView|null>(null); const [auditInspected,setAuditInspected] = useState(false); const [baselineCompared,setBaselineCompared] = useState(false); const [coherenceBusy,setCoherenceBusy] = useState(false); const [error,setError] = useState<string|null>(null); const [refreshToken,setRefreshToken] = useState('initial');
  const load = useCallback(async () => { try { const [overviewResult,evidenceResult,documentResult,changeResult] = await Promise.all([api('/api/overview',OverviewSchema),api('/api/evidence',EvidenceListResponseSchema),api('/api/documents',DocumentListResponseSchema),api('/api/changes?limit=20',ChangeListResponseSchema)]);setOverview(overviewResult);setEvidence(evidenceResult.evidence);setDocuments(documentResult.documents);setRecentChanges(changeResult.changes);setRefreshToken(crypto.randomUUID());setError(null); } catch (reason:unknown) { setError(reason instanceof Error ? reason.message : 'Could not load the workspace.'); } },[]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); },0); return () => window.clearTimeout(timer); },[load]);
  const navigate = useCallback((next:View) => { setView(next);window.scrollTo({ top:0,behavior:'smooth' }); },[]);
  const openIssue = useCallback((itemId:string) => { setSelectedEvidence(itemId);navigate('evidence'); },[navigate]);
  const openChange = useCallback((summary:ChangeSummaryView|null) => { setSelectedChangeId(summary?.id ?? null);setSelectedScenario(summary?.scenarioId ? overview?.scenarios.find((scenario) => scenario.id === summary.scenarioId) ?? null : null); },[overview]);
  const onChangeState = useCallback((change:ChangeView|null) => { setWalkthroughChange(change); },[]);
  const onAuditInspect = useCallback(() => { if (walkthroughChange?.status === 'approved') setAuditInspected(true); },[walkthroughChange?.status]);
  const onBaselineViewed = useCallback((label:string) => { if (overview?.baseline?.label !== 'RR-1.0' && label === 'RR-1.0') setBaselineCompared(true); },[overview?.baseline?.label]);
  const resetWorkspace = useCallback(async () => {
    await api('/api/reset',OverviewSchema,{ method:'POST' });
    setWalkthroughChange(null); setSelectedScenario(null); setSelectedChangeId(null); setSelectedEvidence(null); setActor('author'); setAuditInspected(false); setBaselineCompared(false); navigate('overview');
    await load();
  },[load,navigate]);
  const runBaselineCheck = async () => { if (!overview?.baseline) return;setCoherenceBusy(true);setError(null);try { await api('/api/coherence-checks',CoherenceCheckSchema,{ method:'POST',body:JSON.stringify({ scope:{ kind:'baseline',baselineId:overview.baseline.id },actor:actor === 'qa' ? 'Jamie Chen · QA reviewer' : 'Alex Morgan · Author' }) });await load(); } catch (reason:unknown) { setError(reason instanceof Error ? reason.message : 'Could not rerun baseline checks.'); } finally { setCoherenceBusy(false); } };
  const changeBaselineDisposition = async (finding:NonNullable<OverviewView['coherence']>['findings'][number],action:'waived'|'waiver_removed',reason:string) => { if (!overview?.coherence) return;setCoherenceBusy(true);setError(null);try { await api(`/api/coherence-findings/${encodeURIComponent(finding.id)}/dispositions`,CoherenceCheckSchema,{ method:'POST',body:JSON.stringify({ action,runId:overview.coherence.id,fingerprint:finding.fingerprint,actor:'Jamie Chen · QA reviewer',reason }) });await load(); } catch (cause:unknown) { setError(cause instanceof Error ? cause.message : 'Could not record the finding disposition.'); } finally { setCoherenceBusy(false); } };
  const nav:Array<{ id:View;number:string;label:string }> = [{id:'overview',number:'01',label:'Overview'},{id:'evidence',number:'02',label:'Evidence'},{id:'documents',number:'03',label:'Documents'},{id:'changes',number:'04',label:'Change workspace'},{id:'evaluation',number:'05',label:'Internal evaluation'}];

  const req004 = walkthroughChange?.suggestions.find((suggestion) => suggestion.targetId === 'REQ-004');
  const test007 = walkthroughChange?.suggestions.find((suggestion) => suggestion.targetId === 'TEST-007');
  const un004 = walkthroughChange?.suggestions.find((suggestion) => suggestion.targetId === 'UN-004');
  const test007Rejected = walkthroughChange?.audit.some((event) => event.entityId === test007?.id && event.action === 'suggestion_rejected') ?? false;
  const currentUpdates = walkthroughChange?.updates.filter((update) => update.status !== 'superseded' && update.analysisRunId === walkthroughChange.run?.id) ?? [];
  const req004Draft = currentUpdates.find((update) => update.itemId === 'REQ-004');
  const candidateCheckCurrent = Boolean(walkthroughChange?.coherence && !walkthroughChange.coherence.stale);
  const allDecided = walkthroughChange?.suggestions.every((suggestion) => suggestion.decision !== 'pending') ?? false;

  const draftingTarget = actor !== 'author' ? 'actor-chip' : currentUpdates.length === 0 ? 'create-drafts' : !req004Draft?.editedBy ? 'draft-REQ-004' : 'candidate-checks';
  const approvalTarget = walkthroughChange?.status === 'updates_proposed' ? 'submit-candidates' : walkthroughChange?.status === 'qa_review' && actor !== 'qa' ? 'actor-chip' : walkthroughChange?.status === 'qa_review' ? 'approve-baseline' : 'approval-complete';
  const historyTarget = !auditInspected ? 'audit-history' : 'document-baseline';
  const historyView:View = !auditInspected ? 'changes' : 'documents';
  const resetComplete = overview?.baseline?.label === 'RR-1.0' && walkthroughChange === null;

  const walkthroughSteps = useMemo<WalkthroughStep[]>(() => [
    { id:'overview',kind:'explain',view:'overview',target:'overview-boundary',title:'Start with the boundary',body:'RhythmReview is fictional. It contains no patient, client, or submission data, and the simulated roles are not electronic signatures.' },
    { id:'findings',kind:'explain',view:'overview',target:'overview-findings',title:'Separate checks from fixtures',body:'Three findings come from deterministic rules. Three are seeded evaluation fixtures. The workspace deliberately avoids a composite compliance score.' },
    { id:'relationships',kind:'explain',view:'evidence',target:'evidence-relationships',title:'Read the stored relationship direction',body:'REQ-004 groups links by the saved source and target fields. Incoming and outgoing are factual storage directions; QA and RA still need to ratify dependency semantics.' },
    { id:'documents',kind:'explain',view:'documents',target:'document-snapshot',title:'Inspect an immutable snapshot',body:'Each abbreviated document view records its baseline, source versions, approver, and snapshot ID. These views are not submission-ready documents.' },
    { id:'create-analysis',kind:'action',view:'changes',target:walkthroughChange?.run?.mode === 'replay' ? 'suggestion-review' : walkthroughChange ? 'load-replay' : 'create-change',title:'Create the timing change and load replay',body:walkthroughChange?.run?.mode === 'replay' ? 'The locked replay fixture is loaded. It made no OpenAI call and exists only to demonstrate workflow mechanics.' : walkthroughChange ? 'Load the locked replay fixture. It makes no OpenAI call and exists only to demonstrate workflow mechanics.' : 'Create the human-authored proposal to extend the controlled result time from 30 to 60 seconds.',complete:walkthroughChange?.scenarioId === 'SCN-002' && walkthroughChange.run?.mode === 'replay',waiting:walkthroughChange ? 'Choose “Load replay fixture”.' : 'Choose “Create controlled change”.' },
    { id:'origins',kind:'explain',view:'changes',target:'suggestion-review',title:'Compare trace paths with semantic candidates',body:'Confirmed graph paths reproduce stored links. Unlinked semantic candidates are clearly separated and never pretend that a relationship exists.' },
    { id:'qa-role',kind:'action',view:'changes',target:'actor-chip',title:'Hand control to QA',body:'The author cannot decide impact scope or approve a baseline. Switch to Jamie Chen, the simulated QA reviewer.',complete:actor === 'qa',waiting:'Use the role control in the header.' },
    { id:'accept-anchor',kind:'action',view:'changes',target:'suggestion-REQ-004',title:'Accept the changed requirement',body:'Accept REQ-004 into scope and record a specific reason. This changes the controlled scope only; it does not edit approved evidence.',complete:req004?.decision === 'accepted',waiting:'Accept REQ-004 and record the QA reason.' },
    { id:'reject-revise',kind:'action',view:'changes',target:'suggestion-TEST-007',title:'Prove that QA decisions retain history',body:'Reject TEST-007 once, then revise the decision to accept it. The final scope is complete and the audit history preserves both decisions.',complete:test007?.decision === 'accepted' && test007Rejected,waiting:test007Rejected ? 'Revise TEST-007 to accepted.' : 'Reject TEST-007 first, with a reason.' },
    { id:'edit-action',kind:'action',view:'changes',target:'suggestion-UN-004',title:'Correct the proposed action',body:'Accept UN-004 with an edited action of “update”. The saved replay action remains unchanged while the human correction becomes effective.',complete:un004?.decision === 'edited' && un004.effectiveAction === 'update',waiting:'Choose “Edit action”, set the replacement to “update”, and record why.' },
    { id:'guided-completion',kind:'action',view:'changes',target:allDecided ? 'suggestion-review' : 'guided-completion',title:'Complete the remaining saved review',body:'The helper fills only pending decisions and labels every result as a guided replay fixture in the audit record.',complete:allDecided,waiting:'Choose “Apply remaining fixture decisions”.' },
    { id:'draft-and-check',kind:'action',view:'changes',target:draftingTarget,title:'Author the candidate and rerun checks',body:actor !== 'author' ? 'Switch back to Alex Morgan before creating candidate evidence.' : currentUpdates.length === 0 ? 'Create the curated replay drafts. They remain separate from approved evidence.' : !req004Draft?.editedBy ? 'Edit the REQ-004 candidate text and save a reason. The original draft remains immutable.' : 'Rerun the projected candidate checks after the author edit so the displayed findings are current.',complete:currentUpdates.length > 0 && Boolean(req004Draft?.editedBy) && candidateCheckCurrent,waiting:actor !== 'author' ? 'Switch to the Author role.' : currentUpdates.length === 0 ? 'Choose “Create candidate drafts”.' : !req004Draft?.editedBy ? 'Edit and save the REQ-004 candidate with a reason.' : 'Choose “Rerun checks”.' },
    { id:'submit-approve',kind:'action',view:'changes',target:approvalTarget,title:'Submit and make the separate QA decision',body:walkthroughChange?.status === 'updates_proposed' ? 'Send the retained candidate versions to QA. RR-1.0 remains approved during this handoff.' : walkthroughChange?.status === 'qa_review' && actor !== 'qa' ? 'Switch to Jamie Chen for the separate baseline decision.' : walkthroughChange?.status === 'qa_review' ? 'Approve the candidate as RR-1.1. The old baseline remains available as immutable history.' : 'RR-1.1 is approved and the stored change is now read-only.',complete:walkthroughChange?.status === 'approved',waiting:walkthroughChange?.status === 'updates_proposed' ? 'Send retained candidate versions to QA.' : walkthroughChange?.status === 'qa_review' && actor !== 'qa' ? 'Switch to the QA reviewer.' : 'Approve the new immutable baseline.' },
    { id:'history',kind:'action',view:historyView,target:historyTarget,title:'Inspect the evidence trail',body:!auditInspected ? 'Open an audit event and inspect its actor, reason, references, and old and new values.' : 'Open RR-1.0 in the document baseline selector. Its snapshot and source versions remain available after RR-1.1 approval.',complete:auditInspected && baselineCompared,waiting:!auditInspected ? 'Expand any audit event.' : 'Select RR-1.0 from the approved baseline control.' },
    { id:'reset',kind:'action',view:resetComplete ? 'overview' : 'changes',target:resetComplete ? 'overview-boundary' : 'reset-workspace',title:'Return to the known starting point',body:resetComplete ? 'The workspace is back on RR-1.0 and is ready for the next demonstration.' : 'Reset removes the demonstration workflow and restores RR-1.0. It does not rebuild or replace the controlled seed tables.',complete:resetComplete,waiting:'Choose “Reset workspace”.' },
  ],[actor,allDecided,auditInspected,baselineCompared,candidateCheckCurrent,currentUpdates.length,draftingTarget,historyTarget,historyView,approvalTarget,req004?.decision,req004Draft?.editedBy,resetComplete,test007?.decision,test007Rejected,un004?.decision,un004?.effectiveAction,walkthroughChange]);

  const onWalkthroughStepEnter = useCallback((stepId:string) => {
    if (stepId === 'overview' && overview?.baseline?.label === 'RR-1.0') { setAuditInspected(false);setBaselineCompared(false); }
    if (stepId === 'relationships') setSelectedEvidence('REQ-004');
    if (stepId === 'create-analysis' && !walkthroughChange && overview) {
      const timing = overview.scenarios.find((scenario) => scenario.id === 'SCN-002') ?? null;
      setSelectedScenario(timing); setSelectedChangeId(null);
    }
  },[overview,walkthroughChange]);

  if (!overview && !error) return <Loading />;
  if (!overview) return <div className="fatal-state"><h1>Workspace unavailable</h1><p>{error}</p><button onClick={() => void load()}>Try again</button></div>;

  return <main className="app-shell">
    <header className="topbar"><div className="brand-lockup"><div className="brand-mark" aria-hidden="true">BB</div><div><p className="eyebrow">Blue Bridge</p><p className="brand-name">Evidence workspace</p></div></div><div className="baseline-pill"><span className="status-dot" />Baseline {overview.baseline?.label ?? 'none'} {overview.baseline?.status ?? ''}</div><button className="actor-chip" data-walkthrough="actor-chip" onClick={() => setActor(actor === 'author' ? 'qa' : 'author')} aria-label="Switch demo role"><span className="avatar">{actor === 'author' ? 'AM' : 'JC'}</span><span><b>{actor === 'author' ? 'Alex Morgan' : 'Jamie Chen'}</b><small>{actor === 'author' ? 'Author' : 'QA reviewer'} · switch</small></span></button></header>
    <div className="layout"><aside className="sidebar" aria-label="Workspace navigation"><nav>{nav.map((item) => <button className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)} key={item.id}><span>{item.number}</span>{item.label}</button>)}</nav><div><GuidedWalkthrough steps={walkthroughSteps} onNavigate={navigate} onStepEnter={onWalkthroughStepEnter} onResetWorkspace={resetWorkspace} /><div className="sidebar-note"><p className="eyebrow">Prototype boundary</p><p>Decision support only. AI and replay fixtures cannot approve evidence or baselines.</p></div></div></aside><div className="content-area">{error && <div className="error-banner">{error}</div>}{view === 'overview' && <><OverviewPanel overview={overview} onNavigate={navigate} />{overview.coherence && <CoherenceWorkspace title="Approved baseline finding dispositions" check={overview.coherence} actor={actor} busy={coherenceBusy} onRun={() => void runBaselineCheck()} onDisposition={(finding,action,reason) => void changeBaselineDisposition(finding,action,reason)} onOpenEvidence={openIssue} />}</>}{view === 'evidence' && <EvidencePanel evidence={evidence} selectedId={selectedEvidence} onSelect={setSelectedEvidence} />}{view === 'documents' && <DocumentsPanel documents={documents} refreshToken={refreshToken} onBaselineViewed={onBaselineViewed} />}{view === 'changes' && <ChangePanel overview={overview} evidence={evidence} recentChanges={recentChanges} openChangeId={selectedChangeId} actor={actor} selectedScenario={selectedScenario} setSelectedScenario={setSelectedScenario} onOpenChange={openChange} onWorkspaceRefresh={load} onOpenEvidence={openIssue} onChangeState={onChangeState} onResetWorkspace={resetWorkspace} onAuditInspect={onAuditInspect} />}{view === 'evaluation' && <EvaluationPanel scenarios={overview.scenarios} />}</div></div>
  </main>;
}
