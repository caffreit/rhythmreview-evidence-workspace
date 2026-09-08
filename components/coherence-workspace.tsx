'use client';

import { useState } from 'react';
import type { CoherenceCheckView } from '@/lib/view-models';

export function CoherenceWorkspace({ title,check,actor,busy,onRun,onDisposition,onOpenEvidence }:{
  title:string;
  check:CoherenceCheckView|null;
  actor:'author'|'qa';
  busy:boolean;
  onRun:()=>void;
  onDisposition:(finding:CoherenceCheckView['findings'][number],action:'waived'|'waiver_removed',reason:string)=>void;
  onOpenEvidence?:(itemId:string)=>void;
}) {
  const [reasons,setReasons] = useState<Record<string,string>>({});
  const failing = check?.findings.filter((finding) => finding.ruleState === 'failing') ?? [];
  return <section className="workflow-stage coherence-workspace"><div className="section-heading"><div><p className="eyebrow">Rerunnable checks</p><h2>{title}</h2></div><button className="secondary-button" disabled={busy} onClick={onRun}>{busy ? 'Running…' : 'Rerun checks'}</button></div>{check?.stale && <div className="warning-banner">These results are stale because the candidate changed. Rerun checks before recording a disposition.</div>}<p className="coherence-summary">{check ? `${failing.length} failing · ${failing.filter((finding) => finding.status === 'waived').length} waived · Run ${new Date(check.createdAt).toLocaleString()}` : 'No stored check run yet.'}</p>{check && <div className="issue-list">{check.findings.map((finding) => <details className={`coherence-finding ${finding.status}`} key={`${finding.id}-${finding.fingerprint}`}><summary><code>{finding.code}</code><span>{finding.title}</span><span className={`status-badge ${finding.status}`}>{finding.status}</span></summary><div className="issue-detail"><span className={`origin ${finding.basis === 'deterministic_check' ? 'linked' : 'semantic'}`}>{finding.basis === 'deterministic_check' ? 'Deterministic check' : 'Seeded evaluation fixture'}</span><p>{finding.detail}</p><dl><div><dt>Rule</dt><dd>{finding.rule}</dd></div><div><dt>Expected</dt><dd>{finding.expected}</dd></div><div><dt>Actual</dt><dd>{finding.actual}</dd></div></dl>{finding.waiver && <p className="decision-note">Waived by {finding.waiver.actor}: {finding.waiver.reason}</p>}{onOpenEvidence && <button className="text-button" onClick={() => onOpenEvidence(finding.itemId)}>Open {finding.itemId} in evidence →</button>}{finding.ruleState === 'failing' && <div className="finding-disposition"><label><span>QA disposition reason</span><input value={reasons[finding.id] ?? ''} disabled={actor !== 'qa' || busy || check.stale} onChange={(event) => setReasons((current) => ({ ...current,[finding.id]:event.target.value }))} placeholder="Required for waiver changes" /></label><button className="secondary-button" disabled={actor !== 'qa' || busy || check.stale || (reasons[finding.id]?.trim().length ?? 0) < 2} onClick={() => onDisposition(finding,finding.status === 'waived' ? 'waiver_removed' : 'waived',reasons[finding.id] ?? '')}>{finding.status === 'waived' ? 'Remove waiver' : 'Waive finding'}</button>{actor !== 'qa' && <small className="role-hint">Switch to QA reviewer to change a finding disposition.</small>}</div>}</div></details>)}</div>}</section>;
}
