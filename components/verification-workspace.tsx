'use client';

import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { GUIDED_VERIFICATION_PACKAGE, VerificationWorkspaceSchema, type VerificationWorkspace } from '@/lib/verification';
import { ChangeViewSchema } from '@/lib/view-models';

type Actor = 'author'|'qa';
const ErrorSchema = z.object({ error:z.string() });
const actorName = (actor:Actor) => actor === 'author' ? 'Alex Morgan · Author' as const : 'Jamie Chen · QA reviewer' as const;

async function api<T>(url:string,schema:z.ZodType<T>,init?:RequestInit):Promise<T> {
  const response = await fetch(url,{ ...init,headers:{ 'content-type':'application/json',...(init?.headers ?? {}) } });
  const body:unknown = await response.json();
  if (!response.ok) { const parsed = ErrorSchema.safeParse(body);throw new Error(parsed.success ? parsed.data.error : `Request failed with status ${response.status}`); }
  return schema.parse(body);
}

type PlanDraft = (typeof GUIDED_VERIFICATION_PACKAGE.plans)[number];

function ExecutionCard({ plan,releaseId,actor,busy,onAction,onOpenChange }:{ plan:VerificationWorkspace['plans'][number];releaseId:string;actor:Actor;busy:boolean;onAction:(action:()=>Promise<unknown>)=>Promise<void>;onOpenChange:(id:string)=>void }) {
  const [outcome,setOutcome] = useState<'passed'|'failed'>('passed');
  const [environment,setEnvironment] = useState('Fictional validation environment');
  const [buildId,setBuildId] = useState('BUILD-WP20A-001');
  const [observedResult,setObservedResult] = useState(`Fictional observed result for ${plan.test.id}; acceptance criteria met.`);
  const [evidenceReference,setEvidenceReference] = useState(`FICT-EVIDENCE://${plan.test.id}/WP20A`);
  const [reason,setReason] = useState('QA reviewed the fictional execution record and its structured result.');
  const record = async () => {
    await onAction(() => api('/api/verification-executions',VerificationWorkspaceSchema,{ method:'POST',body:JSON.stringify({ actor:actorName(actor),releaseId,testItemId:plan.test.id,outcome,environment,buildId,observedResult,executedAt:new Date().toISOString(),evidenceReference }) }));
  };
  const review = async (decision:'accepted'|'rejected') => {
    if (!plan.latestExecution) return;
    await onAction(() => api(`/api/verification-executions/${plan.latestExecution!.id}/decision`,VerificationWorkspaceSchema,{ method:'POST',body:JSON.stringify({ actor:actorName(actor),decision,reason }) }));
  };
  return <article className="verification-plan-card">
    <div className="verification-plan-heading"><div><code>{plan.riskControl.id} ← {plan.test.id}</code><h3>{plan.test.title}</h3></div><span className={`candidate-status ${plan.latestExecution?.decision?.decision ?? (plan.latestExecution ? 'pending' : 'missing')}`}>{plan.latestExecution ? plan.latestExecution.decision?.decision ?? 'awaiting QA' : 'not run'}</span></div>
    <p>{plan.test.statement}</p>
    {plan.details && <details><summary>Approved plan details</summary><dl><div><dt>Objective</dt><dd>{plan.details.objective}</dd></div><div><dt>Method</dt><dd>{plan.details.method}</dd></div><div><dt>Acceptance criteria</dt><dd>{plan.details.acceptanceCriteria}</dd></div></dl>{plan.changeId && <button className="text-button" onClick={() => onOpenChange(plan.changeId!)}>Open controlled change history →</button>}</details>}
    {plan.latestExecution ? <div className="execution-result"><span className={`status-badge ${plan.latestExecution.outcome}`}>{plan.latestExecution.outcome}</span><b>{plan.latestExecution.buildId}</b><p>{plan.latestExecution.observedResult}</p><small>Fictional manual record · {new Date(plan.latestExecution.executedAt).toLocaleString()} · {plan.latestExecution.evidenceReference}</small></div> : null}
    {actor === 'author' && <div className="execution-form"><label><span>Outcome</span><select value={outcome} disabled={busy} onChange={(event) => setOutcome(event.target.value === 'failed' ? 'failed' : 'passed')}><option value="passed">Passed</option><option value="failed">Failed</option></select></label><label><span>Environment</span><input value={environment} disabled={busy} onChange={(event) => setEnvironment(event.target.value)} /></label><label><span>Build reference</span><input value={buildId} disabled={busy} onChange={(event) => setBuildId(event.target.value)} /></label><label className="wide"><span>Observed result</span><textarea value={observedResult} disabled={busy} onChange={(event) => setObservedResult(event.target.value)} /></label><label className="wide"><span>Evidence reference</span><input value={evidenceReference} disabled={busy} onChange={(event) => setEvidenceReference(event.target.value)} /></label><button className="primary-button" disabled={busy || environment.trim().length < 2 || buildId.trim().length < 2 || observedResult.trim().length < 8 || evidenceReference.trim().length < 2} onClick={() => void record()}>{plan.latestExecution ? 'Record immutable rerun' : 'Record fictional execution'}</button></div>}
    {actor === 'qa' && plan.latestExecution && !plan.latestExecution.decision && <div className="execution-review"><label><span>Required QA reason</span><textarea value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} /></label><div><button disabled={busy || reason.trim().length < 2} onClick={() => void review('rejected')}>Reject</button><button className="approve-button" disabled={busy || reason.trim().length < 2} onClick={() => void review('accepted')}>Accept execution</button></div></div>}
  </article>;
}

export function VerificationWorkspacePanel({ actor,onOpenChange,onWorkspaceRefresh }:{ actor:Actor;onOpenChange:(changeId:string)=>void;onWorkspaceRefresh:()=>Promise<void> }) {
  const [workspace,setWorkspace] = useState<VerificationWorkspace|null>(null);
  const [plans,setPlans] = useState<PlanDraft[]>(GUIDED_VERIFICATION_PACKAGE.plans.map((plan) => ({ ...plan })));
  const [controlUpdates,setControlUpdates] = useState(GUIDED_VERIFICATION_PACKAGE.controlUpdates.map((update) => ({ ...update })));
  const [busy,setBusy] = useState(false); const [error,setError] = useState<string|null>(null);
  const load = useCallback(async () => { setWorkspace(await api('/api/verification',VerificationWorkspaceSchema)); },[]);
  useEffect(() => { const timer=window.setTimeout(() => { void load().catch((reason:unknown) => setError(reason instanceof Error ? reason.message : 'Could not load verification.')); },0);return () => window.clearTimeout(timer); },[load]);
  const act = async (work:()=>Promise<void>) => { setBusy(true);setError(null);try { await work();await load();await onWorkspaceRefresh(); } catch (reason:unknown) { setError(reason instanceof Error ? reason.message : 'The verification action failed.'); } finally { setBusy(false); } };
  const mutate = (action:()=>Promise<unknown>) => act(async () => { await action(); });
  const createPackage = () => void act(async () => {
    const change = await api('/api/changes',ChangeViewSchema,{ method:'POST',body:JSON.stringify({ kind:'verification_package',title:GUIDED_VERIFICATION_PACKAGE.title,rationale:GUIDED_VERIFICATION_PACKAGE.rationale,createdBy:'Alex Morgan · Author',controlUpdates,plans }) });
    onOpenChange(change.id);
  });
  if (!workspace) return <section className="view-content"><div className="loading-state">Preparing verification coverage…</div>{error && <div className="error-banner">{error}</div>}</section>;
  const editablePackage = workspace.highGapCount > 0 && !workspace.openPackageChangeId;
  return <section className="view-content verification-workspace"><div className="page-heading compact"><div><p className="eyebrow teal">Risk-control verification</p><h1>Verification workspace</h1><p className="lede">Close coverage gaps through controlled plans, then record and review immutable fictional executions for an explicit release.</p></div><div className="count-chip">{workspace.plans.length} approved plans · {workspace.highGapCount} high gaps</div></div>
    <div className="notice"><div className="notice-icon">i</div><p><b>Fictional manual records.</b> This workflow is not CI certification, residual-risk acceptance, an electronic signature, or authorization to release a medical device.</p></div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {workspace.gaps.length > 0 && <section className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">Versioned coverage policy</p><h2>Risk controls requiring verification</h2></div><span>{workspace.gaps.length} findings</span></div><div className="verification-gap-grid">{workspace.gaps.map((gap) => <article key={gap.id}><span className={`status-badge ${gap.severity}`}>{gap.severity}</span><code>{gap.itemId}</code><h3>{gap.title}</h3><p>{gap.actual}</p></article>)}</div></section>}
    {editablePackage && <section className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">Guided controlled package</p><h2>Two amendments and three TEST plans</h2></div><span className="tag">author editable</span></div><div className="package-grid">{controlUpdates.map((update,index) => <article key={update.itemId}><code>{update.itemId}</code><label><span>Proposed controlled wording</span><textarea value={update.proposedText} disabled={busy || actor !== 'author'} onChange={(event) => setControlUpdates((current) => current.map((item,itemIndex) => itemIndex === index ? { ...item,proposedText:event.target.value } : item))} /></label><label><span>Reason</span><textarea value={update.reason} disabled={busy || actor !== 'author'} onChange={(event) => setControlUpdates((current) => current.map((item,itemIndex) => itemIndex === index ? { ...item,reason:event.target.value } : item))} /></label></article>)}</div><div className="verification-plan-grid">{plans.map((plan,index) => <article className="verification-plan-card" key={plan.targetRiskControlId}><code>{plan.targetRiskControlId} · reserved TEST-{String(13 + index).padStart(3,'0')}</code>{(['title','objective','method','acceptanceCriteria','rationale'] as const).map((field) => <label key={field}><span>{field === 'acceptanceCriteria' ? 'Acceptance criteria' : field[0].toUpperCase() + field.slice(1)}</span>{field === 'title' ? <input value={plan[field]} disabled={busy || actor !== 'author'} onChange={(event) => setPlans((current) => current.map((item,itemIndex) => itemIndex === index ? { ...item,[field]:event.target.value } : item))} /> : <textarea value={plan[field]} disabled={busy || actor !== 'author'} onChange={(event) => setPlans((current) => current.map((item,itemIndex) => itemIndex === index ? { ...item,[field]:event.target.value } : item))} />}</label>)}</article>)}</div><button className="primary-button" disabled={busy || actor !== 'author'} onClick={createPackage}>Create controlled verification package →</button>{actor !== 'author' && <small className="role-hint">Switch to Author to create the controlled package.</small>}</section>}
    {workspace.openPackageChangeId && <section className="workflow-stage next-action"><div><p className="eyebrow">Controlled package in progress</p><h2>{workspace.openPackageChangeId}</h2><p>Edit plans, review each paired VERIFIES link, run candidate checks, and approve the new baseline in Change history.</p></div><button className="primary-button" onClick={() => onOpenChange(workspace.openPackageChangeId!)}>Open package →</button></section>}
    <section className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">Approved TEST identity</p><h2>{workspace.plans.length} risk-control plans in {workspace.baseline.label}</h2></div>{workspace.plannedRelease && <span className="tag">{workspace.plannedRelease.label} · {workspace.plannedRelease.status.replaceAll('_',' ')}</span>}</div><div className="verification-plan-grid">{workspace.plans.map((plan) => workspace.plannedRelease?.status === 'planned' ? <ExecutionCard key={plan.test.id} plan={plan} releaseId={workspace.plannedRelease.id} actor={actor} busy={busy} onAction={mutate} onOpenChange={onOpenChange} /> : <article className="verification-plan-card" key={plan.test.id}><div className="verification-plan-heading"><div><code>{plan.riskControl.id} ← {plan.test.id}</code><h3>{plan.test.title}</h3></div></div><p>{plan.test.statement}</p>{plan.changeId && <button className="text-button" onClick={() => onOpenChange(plan.changeId!)}>Open controlled change history →</button>}{plan.latestExecution && <div className="execution-result"><span className={`status-badge ${plan.latestExecution.outcome}`}>{plan.latestExecution.outcome}</span><p>{plan.latestExecution.observedResult}</p><small>Fictional manual record · {plan.latestExecution.decision?.decision ?? 'pending QA'}</small></div>}</article>)}</div>{!workspace.plannedRelease && <p className="gate-note">Create a planned release on the Releases page before recording executions.</p>}{workspace.plannedRelease?.status === 'verification_ready' && <div className="approval-complete"><span>✓</span><div><h3>Verification ready under release-readiness-v1</h3><p>Executions and QA decisions are frozen for this release.</p></div></div>}</section>
  </section>;
}
