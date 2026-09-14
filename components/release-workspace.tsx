'use client';

import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { demoActor, type DemoRole } from '@/lib/actors';
import {
  FINAL_RELEASE_ATTESTATION,
  FINAL_RELEASE_POLICY,
  FinalizationWorkspaceSchema,
  RISK_ATTESTATION,
  type FinalizationWorkspace,
} from '@/lib/final-release';
import { RELEASE_READINESS_POLICY, ReadinessRunSchema, ReleaseWorkspaceSchema, type ReleaseWorkspace } from '@/lib/verification';

const ErrorSchema = z.object({ error:z.string() });
const fullCommitSha = /^[a-f0-9]{40}$/;

async function apiJson<T>(url:string,schema:z.ZodType<T>,init?:RequestInit):Promise<T> {
  const response = await fetch(url,{ ...init,headers:{ 'content-type':'application/json',...(init?.headers ?? {}) } });
  const body:unknown = await response.json();
  if (!response.ok) { const parsed=ErrorSchema.safeParse(body);throw new Error(parsed.success ? parsed.data.error : `Request failed with status ${response.status}`); }
  return schema.parse(body);
}

async function apiForm<T>(url:string,schema:z.ZodType<T>,body:FormData):Promise<T> {
  const response = await fetch(url,{ method:'POST',body });
  const payload:unknown = await response.json();
  if (!response.ok) { const parsed=ErrorSchema.safeParse(payload);throw new Error(parsed.success ? parsed.data.error : `Request failed with status ${response.status}`); }
  return schema.parse(payload);
}

function displayStatus(value:string):string { return value.replaceAll('_',' '); }
function shortHash(value:string):string { return `${value.slice(0,10)}…${value.slice(-8)}`; }

export function ReleaseWorkspacePanel({ actor,baseline,onWorkspaceRefresh,onNavigate }:{ actor:DemoRole;baseline:{ id:string;label:string }|null;onWorkspaceRefresh:()=>Promise<void>;onNavigate:(view:'verification'|'evidence')=>void }) {
  const [workspace,setWorkspace] = useState<ReleaseWorkspace|null>(null);
  const [finalization,setFinalization] = useState<FinalizationWorkspace|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState<string|null>(null);
  const [label,setLabel] = useState(baseline ? `${baseline.label} verification release` : '');
  const [codeRevision,setCodeRevision] = useState('');

  const load = useCallback(async () => {
    const next = await apiJson('/api/releases',ReleaseWorkspaceSchema);
    setWorkspace(next);
    const active = next.releases.find((item) => item.baselineId === baseline?.id) ?? null;
    if (active && active.status !== 'planned') setFinalization(await apiJson(`/api/releases/${active.id}/finalization`,FinalizationWorkspaceSchema));
    else setFinalization(null);
  },[baseline?.id]);

  useEffect(() => { const timer=window.setTimeout(() => { void load().catch((reason:unknown) => setError(reason instanceof Error ? reason.message : 'Could not load releases.')); },0);return () => window.clearTimeout(timer); },[load]);

  const act = async (work:()=>Promise<void>) => {
    setBusy(true);setError(null);
    try { await work();await load();await onWorkspaceRefresh(); }
    catch (reason:unknown) { setError(reason instanceof Error ? reason.message : 'The release action failed.'); }
    finally { setBusy(false); }
  };

  const release = workspace?.releases.find((item) => item.baselineId === baseline?.id) ?? null;
  const latestReadiness = workspace?.latestReadiness ?? null;
  const readiness = latestReadiness?.releaseId === release?.id ? latestReadiness : null;
  const create = () => baseline && void act(async () => { await apiJson('/api/releases',ReleaseWorkspaceSchema,{ method:'POST',body:JSON.stringify({ actor:demoActor(actor),baselineId:baseline.id,label,codeRevision }) }); });
  const evaluate = () => release && void act(async () => { await apiJson(`/api/releases/${release.id}/readiness`,ReadinessRunSchema,{ method:'POST',body:JSON.stringify({ actor:demoActor(actor) }) }); });
  const markReady = () => release && readiness && void act(async () => { await apiJson(`/api/releases/${release.id}/verification-ready`,ReleaseWorkspaceSchema,{ method:'POST',body:JSON.stringify({ actor:demoActor(actor),readinessRunId:readiness.id,confirmation:true }) }); });

  return <section className="view-content release-workspace">
    <div className="page-heading compact"><div><p className="eyebrow teal">Controlled outputs</p><h1>Release finalization</h1><p className="lede">Move an approved baseline through fictional verification, residual-risk review, evidence review, and a separate final decision.</p></div>{release && <span className={`status-badge ${release.status}`}>{release.status === 'release_approved' ? 'Fictional release approved' : release.status === 'verification_ready' ? 'Verification ready' : 'Planned'}</span>}</div>
    <div className="notice"><div className="notice-icon">i</div><p><b>Scope boundary.</b> These are simulated prototype controls. Final approval does not claim deployment, production readiness, authenticated identity, a compliant electronic signature, or independent authentication of GitHub.</p></div>
    {error && <div className="error-banner" role="alert">{error}</div>}

    {!release && <section className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">Prerequisite · planned record</p><h2>Create a release for {baseline?.label ?? 'an approved baseline'}</h2></div><span className="tag">fictional prototype record</span></div><div className="release-create-form"><label><span>Release label</span><input value={label} disabled={busy || actor !== 'author' || !baseline} onChange={(event) => setLabel(event.target.value)} /></label><label><span>Full Git commit SHA</span><input value={codeRevision} placeholder="40 lowercase hexadecimal characters" disabled={busy || actor !== 'author' || !baseline} onChange={(event) => setCodeRevision(event.target.value.trim().toLowerCase())} /></label><button className="primary-button" disabled={busy || actor !== 'author' || !baseline || label.trim().length < 3 || !fullCommitSha.test(codeRevision)} onClick={create}>Create planned release</button></div>{actor !== 'author' && <small className="role-hint">Switch to Author to create the release record.</small>}</section>}

    {release && <>
      <section className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">1 · Prerequisite</p><h2>{release.label}</h2></div><code>{release.id}</code></div><dl className="release-facts"><div><dt>Baseline</dt><dd>{baseline?.label ?? release.baselineId}</dd></div><div><dt>Code revision</dt><dd title={release.codeRevision}>{fullCommitSha.test(release.codeRevision) ? shortHash(release.codeRevision) : release.codeRevision}</dd></div><div><dt>Created by</dt><dd>{release.createdBy}</dd></div><div><dt>Policy</dt><dd>{RELEASE_READINESS_POLICY.id}</dd></div></dl>
        {release.status === 'planned' ? <div className="release-actions"><button className="secondary-button" onClick={() => onNavigate('verification')}>Open verification records</button><button className="primary-button" disabled={busy || actor === 'release_approver'} onClick={evaluate}>Run readiness policy</button></div> : <div className="approval-complete"><span>✓</span><div><h3>Verification readiness recorded</h3><p>{release.verificationReadyBy} · {new Date(release.verificationReadyAt).toLocaleString()} · input {release.readinessRunId}</p></div></div>}
      </section>

      {readiness && <section className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">{readiness.policyId} · version {readiness.policyVersion}</p><h2>{readiness.status === 'ready' ? 'Readiness checks passed' : 'Readiness blockers remain'}</h2></div><span className={`status-badge ${readiness.stale ? 'stale' : readiness.status}`}>{readiness.stale ? 'stale run' : readiness.status}</span></div><p>Input fingerprint <code>{readiness.inputFingerprint}</code></p><div className="readiness-results">{readiness.results.map((result) => <button key={result.id} className={result.status} onClick={() => onNavigate(result.code === 'RR-VER-001' ? 'verification' : 'evidence')}><span>{result.status}</span><div><b>{result.title}</b><p>{result.detail}</p></div><code>{result.subjectId}</code></button>)}</div>{release.status === 'planned' && <div className="approval-actions"><button className="secondary-button" disabled={busy || actor === 'release_approver'} onClick={evaluate}>Refresh evaluation</button><button className="approve-button" disabled={busy || actor !== 'qa' || readiness.status !== 'ready' || readiness.stale} onClick={markReady}>Mark verification ready</button></div>}</section>}

      {finalization && <FinalizationSections workspace={finalization} actor={actor} busy={busy} act={act} />}
    </>}
  </section>;
}

function FinalizationSections({ workspace,actor,busy,act }:{ workspace:FinalizationWorkspace;actor:DemoRole;busy:boolean;act:(work:()=>Promise<void>)=>Promise<void> }) {
  const frozen = workspace.release.status === 'release_approved';
  const [attachmentCategory,setAttachmentCategory] = useState<'risk_support'|'release_support'>('risk_support');
  const [attachmentFile,setAttachmentFile] = useState<File|null>(null);
  const [supersedesAttachmentId,setSupersedesAttachmentId] = useState('');
  const [manifestFile,setManifestFile] = useState<File|null>(null);
  const [reportFiles,setReportFiles] = useState<File[]>([]);
  const [riskReason,setRiskReason] = useState('Reviewed against the approved controls and verification outcomes.');
  const [approvalReason,setApprovalReason] = useState('All current fictional final-release controls are satisfied.');
  const currentCi = workspace.ciEvidence[0] ?? null;
  const currentRiskAttestation = workspace.attestations.find((item) => item.kind === 'residual_risk_acceptance' && item.current) ?? null;
  const currentApproval = workspace.attestations.find((item) => item.kind === 'final_release_approval' && item.current) ?? null;

  const upload = () => void act(async () => {
    if (!attachmentFile) return;
    const data=new FormData();data.set('actor',demoActor(actor));data.set('category',attachmentCategory);data.set('file',attachmentFile);if (supersedesAttachmentId) data.set('supersedesAttachmentId',supersedesAttachmentId);
    await apiForm(`/api/releases/${workspace.release.id}/attachments`,FinalizationWorkspaceSchema,data);
    setAttachmentFile(null);setSupersedesAttachmentId('');
  });
  const importCi = () => void act(async () => {
    if (!manifestFile || reportFiles.length === 0) return;
    const data=new FormData();data.set('actor',demoActor(actor));data.set('manifest',manifestFile);for (const report of reportFiles) data.append('reports',report);
    await apiForm(`/api/releases/${workspace.release.id}/ci-evidence`,FinalizationWorkspaceSchema,data);
    setManifestFile(null);setReportFiles([]);
  });
  const attest = () => void act(async () => { await apiJson(`/api/releases/${workspace.release.id}/residual-risk-acceptance`,FinalizationWorkspaceSchema,{ method:'POST',body:JSON.stringify({ actor:demoActor(actor),reason:riskReason,statementVersion:RISK_ATTESTATION.version,confirmation:true }) }); });
  const runFinal = () => void act(async () => { await apiJson(`/api/releases/${workspace.release.id}/final-readiness`,FinalizationWorkspaceSchema,{ method:'POST',body:JSON.stringify({ actor:demoActor(actor) }) }); });
  const approve = () => void act(async () => { if (!workspace.latestFinalReadiness) return;await apiJson(`/api/releases/${workspace.release.id}/approve`,FinalizationWorkspaceSchema,{ method:'POST',body:JSON.stringify({ actor:demoActor(actor),reason:approvalReason,statementVersion:FINAL_RELEASE_ATTESTATION.version,finalReadinessRunId:workspace.latestFinalReadiness.id,confirmation:true }) }); });

  return <>
    <section className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">2 · Residual risk</p><h2>Assess every baseline hazard</h2></div><span className="tag">{workspace.risks.filter((item) => item.current?.decision?.decision === 'accepted').length}/{workspace.risks.length} QA accepted</span></div><div className="finalization-grid">{workspace.risks.map((risk) => <RiskCard key={risk.hazard.id} releaseId={workspace.release.id} risk={risk} actor={actor} busy={busy} frozen={frozen} act={act} />)}</div></section>

    <section className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">3 · Evidence</p><h2>Durable attachments and verified CI import</h2></div><span className="tag">{workspace.attachments.length}/25 files</span></div>
      <div className="split-stage"><div className="substage"><h3>Release attachments</h3><p>PDF, JSON, text, CSV, XML, or ZIP · 10 MB maximum. Bytes are hashed and downloads are forced as attachments.</p><label><span>Category</span><select value={attachmentCategory} disabled={busy || frozen || actor !== 'author'} onChange={(event) => setAttachmentCategory(event.target.value as 'risk_support'|'release_support')}><option value="risk_support">Risk support</option><option value="release_support">Release support</option></select></label><label><span>File</span><input type="file" accept=".pdf,.json,.txt,.csv,.xml,.zip" disabled={busy || frozen || actor !== 'author'} onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)} /></label><label><span>Supersede (optional)</span><select value={supersedesAttachmentId} disabled={busy || frozen || actor !== 'author'} onChange={(event) => setSupersedesAttachmentId(event.target.value)}><option value="">No prior file</option>{workspace.attachments.filter((item) => item.category === attachmentCategory && !item.superseded && !item.ciEvidenceId).map((item) => <option key={item.id} value={item.id}>{item.filename}</option>)}</select></label><button className="primary-button" disabled={busy || frozen || actor !== 'author' || !attachmentFile} onClick={upload}>Upload attachment</button><AttachmentList attachments={workspace.attachments.filter((item) => !item.ciEvidenceId)} /></div>
        <div className="substage"><h3>GitHub Actions evidence bundle</h3><p>The run is real when sourced from Actions; its product and validation content remain fictional. BlueBridge does not authenticate GitHub without a live connector.</p><label><span>ci-evidence-v1 manifest</span><input type="file" accept="application/json,.json" disabled={busy || frozen || actor !== 'author'} onChange={(event) => setManifestFile(event.target.files?.[0] ?? null)} /></label><label><span>Referenced reports</span><input type="file" multiple accept=".pdf,.json,.txt,.csv,.xml,.zip" disabled={busy || frozen || actor !== 'author'} onChange={(event) => setReportFiles(Array.from(event.target.files ?? []))} /></label><button className="primary-button" disabled={busy || frozen || actor !== 'author' || !manifestFile || reportFiles.length === 0} onClick={importCi}>Import and verify bundle</button>{currentCi ? <CiCard evidence={currentCi} attachments={workspace.attachments.filter((item) => item.ciEvidenceId === currentCi.id)} actor={actor} busy={busy} frozen={frozen} act={act} /> : <p className="empty-state">No CI bundle imported.</p>}{workspace.ciEvidence.length > 1 && <details><summary>Earlier imports ({workspace.ciEvidence.length-1})</summary>{workspace.ciEvidence.slice(1).map((item) => <CiCard key={item.id} evidence={item} attachments={workspace.attachments.filter((attachment) => attachment.ciEvidenceId === item.id)} actor={actor} busy={true} frozen={true} act={act} />)}</details>}</div></div>
    </section>

    <section className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">4 · QA attestation</p><h2>Accept the current residual-risk set</h2></div>{currentRiskAttestation && <span className="status-badge ready">current</span>}</div><blockquote className="attestation-statement">{RISK_ATTESTATION.statement}</blockquote><label><span>QA reason</span><textarea value={riskReason} disabled={busy || frozen || actor !== 'qa'} onChange={(event) => setRiskReason(event.target.value)} /></label><button className="approve-button" disabled={busy || frozen || actor !== 'qa' || riskReason.trim().length < 2} onClick={attest}>Record residual-risk acceptance</button>{currentRiskAttestation && <p className="record-meta">{currentRiskAttestation.actor} · {new Date(currentRiskAttestation.createdAt).toLocaleString()} · {currentRiskAttestation.inputFingerprint}</p>}</section>

    <section className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">5 · Final decision</p><h2>{FINAL_RELEASE_POLICY.id} · version {FINAL_RELEASE_POLICY.version}</h2></div>{workspace.latestFinalReadiness && <span className={`status-badge ${workspace.latestFinalReadiness.stale ? 'stale' : workspace.latestFinalReadiness.status}`}>{workspace.latestFinalReadiness.stale ? 'stale run' : workspace.latestFinalReadiness.status}</span>}</div><button className="secondary-button" disabled={busy || frozen} onClick={runFinal}>Run final policy</button>{workspace.latestFinalReadiness && <div className="readiness-results final-results">{workspace.latestFinalReadiness.results.map((result) => <div key={result.id} className={result.status}><span>{result.status}</span><div><b>{result.title}</b><p>{result.detail}</p></div><code>{result.subjectId}</code></div>)}</div>}
      <blockquote className="attestation-statement">{FINAL_RELEASE_ATTESTATION.statement}</blockquote><label><span>Release-approver reason</span><textarea value={approvalReason} disabled={busy || frozen || actor !== 'release_approver'} onChange={(event) => setApprovalReason(event.target.value)} /></label><button className="approve-button" disabled={busy || frozen || actor !== 'release_approver' || !workspace.latestFinalReadiness || workspace.latestFinalReadiness.status !== 'ready' || workspace.latestFinalReadiness.stale || approvalReason.trim().length < 2} onClick={approve}>Approve fictional release</button>{actor !== 'release_approver' && !frozen && <small className="role-hint">Only Priya Shah · Release approver can record the final decision.</small>}
      {frozen && currentApproval && <div className="approval-complete"><span>✓</span><div><h3>Fictional release approved</h3><p>{currentApproval.actor} · {new Date(currentApproval.createdAt).toLocaleString()} · statement version {currentApproval.statementVersion} · fingerprint {currentApproval.inputFingerprint}. The release record and its finalization inputs are now frozen.</p></div></div>}
    </section>
    <section className="workflow-stage"><div className="section-heading"><div><p className="eyebrow">Append-only record</p><h2>Release audit history</h2></div><span className="tag">{workspace.audit.length} events</span></div><div className="audit-list">{workspace.audit.map((event) => <details className="audit-event" key={event.id}><summary className="audit-row"><time>{new Date(event.createdAt).toLocaleString()}</time><b>{displayStatus(event.action)}</b><span>{event.actor}</span></summary><div className="audit-detail"><p><b>Target</b> {displayStatus(event.entityType)} · {event.entityId}</p><pre>{JSON.stringify(event.details,null,2)}</pre></div></details>)}</div></section>
  </>;
}

function RiskCard({ releaseId,risk,actor,busy,frozen,act }:{ releaseId:string;risk:FinalizationWorkspace['risks'][number];actor:DemoRole;busy:boolean;frozen:boolean;act:(work:()=>Promise<void>)=>Promise<void> }) {
  const [classification,setClassification] = useState<'acceptable'|'benefit_risk_required'|'unacceptable'>(risk.current?.classification ?? 'acceptable');
  const [rationale,setRationale] = useState(risk.current?.rationale ?? 'Residual risk reviewed against the linked controls and accepted verification evidence.');
  const [conclusion,setConclusion] = useState(risk.current?.benefitRiskConclusion ?? '');
  const [reviewReason,setReviewReason] = useState('Assessment and linked evidence reviewed.');
  const save = () => void act(async () => { await apiJson(`/api/releases/${releaseId}/residual-risks`,FinalizationWorkspaceSchema,{ method:'POST',body:JSON.stringify({ actor:demoActor(actor),hazardItemId:risk.hazard.id,classification,rationale,benefitRiskConclusion:classification === 'benefit_risk_required' ? conclusion : null }) }); });
  const decide = (decision:'accepted'|'rejected') => void act(async () => { if (!risk.current) return;await apiJson(`/api/residual-risks/${risk.current.id}/decisions`,FinalizationWorkspaceSchema,{ method:'POST',body:JSON.stringify({ actor:demoActor(actor),decision,reason:reviewReason }) }); });
  return <article className="risk-card"><div className="risk-card-heading"><div><code>{risk.hazard.id}</code><h3>{risk.hazard.title}</h3></div>{risk.current && <span className={`status-badge ${risk.current.decision?.decision ?? 'pending'}`}>r{risk.current.revision} · {risk.current.decision?.decision ?? 'awaiting QA'}</span>}</div><p>{risk.hazard.statement}</p><details><summary>{risk.linkedControls.length} linked control(s)</summary>{risk.linkedControls.map((control) => <div className="linked-control" key={control.id}><span className={control.verification === 'accepted_pass' ? 'pass-dot' : 'block-dot'} /> <b>{control.id}</b> {control.title}</div>)}</details><label><span>Classification</span><select value={classification} disabled={busy || frozen || actor !== 'author'} onChange={(event) => setClassification(event.target.value as typeof classification)}><option value="acceptable">Acceptable</option><option value="benefit_risk_required">Benefit-risk required</option><option value="unacceptable">Unacceptable</option></select></label><label><span>Rationale</span><textarea value={rationale} disabled={busy || frozen || actor !== 'author'} onChange={(event) => setRationale(event.target.value)} /></label>{classification === 'benefit_risk_required' && <label><span>Benefit-risk conclusion</span><textarea value={conclusion} disabled={busy || frozen || actor !== 'author'} onChange={(event) => setConclusion(event.target.value)} /></label>}<button className="secondary-button" disabled={busy || frozen || actor !== 'author' || rationale.trim().length < 8 || (classification === 'benefit_risk_required' && conclusion.trim().length < 8)} onClick={save}>{risk.current ? 'Create replacement revision' : 'Record assessment'}</button>{risk.current && <><label><span>QA decision reason</span><input value={reviewReason} disabled={busy || frozen || actor !== 'qa'} onChange={(event) => setReviewReason(event.target.value)} /></label><div className="review-actions"><button disabled={busy || frozen || actor !== 'qa'} onClick={() => decide('rejected')}>Reject</button><button className="approve-button" disabled={busy || frozen || actor !== 'qa' || risk.current.classification === 'unacceptable'} onClick={() => decide('accepted')}>Accept</button></div></>}{risk.history.length > 1 && <small>{risk.history.length} append-only revisions retained.</small>}</article>;
}

function AttachmentList({ attachments }:{ attachments:FinalizationWorkspace['attachments'] }) { return <div className="attachment-list">{attachments.length === 0 ? <p className="empty-state">No release attachments.</p> : attachments.map((item) => <a key={item.id} className={item.superseded ? 'superseded' : ''} href={`/api/release-attachments/${item.id}`}><span><b>{item.filename}</b><small>{displayStatus(item.category)} · {(item.size/1024).toFixed(1)} KB</small></span><code>{shortHash(item.sha256)}</code></a>)}</div>; }

function CiCard({ evidence,attachments,actor,busy,frozen,act }:{ evidence:FinalizationWorkspace['ciEvidence'][number];attachments:FinalizationWorkspace['attachments'];actor:DemoRole;busy:boolean;frozen:boolean;act:(work:()=>Promise<void>)=>Promise<void> }) {
  const [reason,setReason] = useState('Manifest, commit, checks, and report hashes reviewed.');
  const decide = (decision:'accepted'|'rejected') => void act(async () => { await apiJson(`/api/ci-evidence/${evidence.id}/decisions`,FinalizationWorkspaceSchema,{ method:'POST',body:JSON.stringify({ actor:demoActor(actor),decision,reason }) }); });
  return <article className="ci-card"><div><span className={`status-badge ${evidence.validationStatus}`}>{evidence.validationStatus}</span><b>{evidence.manifest.repository} · {evidence.manifest.workflow}</b></div><p>Run <a href={evidence.manifest.runUrl} target="_blank" rel="noreferrer">{evidence.manifest.runId}, attempt {evidence.manifest.runAttempt}</a> · commit <code>{shortHash(evidence.commitSha)}</code></p>{evidence.validationError && <p className="validation-error">{evidence.validationError}</p>}<AttachmentList attachments={attachments} /><label><span>QA decision reason</span><input value={reason} disabled={busy || frozen || actor !== 'qa'} onChange={(event) => setReason(event.target.value)} /></label><div className="review-actions"><button disabled={busy || frozen || actor !== 'qa' || evidence.validationStatus !== 'valid'} onClick={() => decide('rejected')}>Reject</button><button className="approve-button" disabled={busy || frozen || actor !== 'qa' || evidence.validationStatus !== 'valid'} onClick={() => decide('accepted')}>Accept CI evidence</button></div>{evidence.decision && <small>{displayStatus(evidence.decision.decision)} by {evidence.decision.actor}: {evidence.decision.reason}</small>}</article>;
}
