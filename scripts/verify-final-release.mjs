import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { basename,extname } from 'node:path';

const baseUrl=process.env.DEMO_URL ?? 'http://localhost:3000';
const author='Alex Morgan · Author';
const qa='Jamie Chen · QA reviewer';
const approver='Priya Shah · Release approver';
const releaseSha=process.env.RELEASE_SHA ?? 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const keepFinalState=process.env.VERIFY_FINAL_KEEP === '1';
let completed=false;

async function raw(path,init) { return fetch(`${baseUrl}${path}`,init); }
async function response(path,init) { const result=await raw(path,{ ...init,headers:{ 'content-type':'application/json',...(init?.headers ?? {}) } });const body=await result.json();return { status:result.status,body }; }
async function request(path,init) { const result=await response(path,init);if (result.status < 200 || result.status >= 300) throw new Error(`${path} returned ${result.status}: ${JSON.stringify(result.body)}`);return result.body; }
async function expectStatus(path,status,init) { const result=await response(path,init);assert.equal(result.status,status,`${path} should return ${status}; received ${JSON.stringify(result.body)}`);return result.body; }
async function postForm(path,form) { const result=await raw(path,{ method:'POST',body:form });const body=await result.json();if (!result.ok) throw new Error(`${path} returned ${result.status}: ${JSON.stringify(body)}`);return body; }
async function reset() { return request('/api/reset',{ method:'POST' }); }
const hash=(value) => createHash('sha256').update(value).digest('hex');

function ciBundle({ commitSha=releaseSha,conclusion='success',checkConclusion='success',expectedHash }={}) {
  const report='WP-20B fictional offline report\n';
  const manifest={ schema:'ci-evidence-v1',provider:'github_actions',repository:'bluebridge/compliance-demo',workflow:'WP-20B release evidence',runId:String(Date.now()),runAttempt:1,runUrl:'https://github.com/bluebridge/compliance-demo/actions/runs/123',commitSha,startedAt:'2026-09-14T18:00:00.000Z',completedAt:'2026-09-14T18:03:00.000Z',conclusion,checks:[{ name:'complete offline suite',conclusion:checkConclusion }],reports:[{ filename:'offline-suite.txt',sha256:expectedHash ?? hash(report) }] };
  const form=new FormData();form.set('actor',author);form.set('manifest',new File([JSON.stringify(manifest)],'ci-evidence-v1.json',{ type:'application/json' }));form.set('reports',new File([report],'offline-suite.txt',{ type:'text/plain' }));return form;
}

async function acceptedCiBundle() {
  const manifestPath=process.env.CI_MANIFEST_PATH;const reportPaths=(process.env.CI_REPORT_PATHS ?? '').split(',').filter(Boolean);
  if (!manifestPath) return ciBundle();
  if (reportPaths.length === 0) throw new Error('CI_REPORT_PATHS is required with CI_MANIFEST_PATH.');
  const form=new FormData();form.set('actor',author);form.set('manifest',new File([await readFile(manifestPath)],basename(manifestPath),{ type:'application/json' }));
  for (const path of reportPaths) { const extension=extname(path).toLowerCase();const type=extension === '.json' ? 'application/json' : extension === '.csv' ? 'text/csv' : extension === '.xml' ? 'application/xml' : extension === '.zip' ? 'application/zip' : extension === '.pdf' ? 'application/pdf' : 'text/plain';form.append('reports',new File([await readFile(path)],basename(path),{ type })); }
  return form;
}

try {
  execFileSync(process.execPath,['scripts/verify-readiness.mjs'],{ cwd:process.cwd(),env:{ ...process.env,VERIFY_READINESS_KEEP:'1',DEMO_URL:baseUrl,RELEASE_SHA:releaseSha },stdio:'inherit' });
  const releases=await request('/api/releases');const release=releases.releases.find((item) => item.status === 'verification_ready');assert.ok(release);assert.equal(release.codeRevision,releaseSha);
  let workspace=await request(`/api/releases/${release.id}/finalization`);assert.equal(workspace.risks.length,8);assert.equal(workspace.risks.every((risk) => risk.current === null),true);
  workspace=await request(`/api/releases/${release.id}/final-readiness`,{ method:'POST',body:JSON.stringify({ actor:author }) });assert.equal(workspace.latestFinalReadiness.status,'blocked');assert.equal(workspace.latestFinalReadiness.results.filter((item) => item.code === 'FR-RSK-001' && item.status === 'block').length,8);
  await expectStatus(`/api/releases/${release.id}/residual-risk-acceptance`,409,{ method:'POST',body:JSON.stringify({ actor:qa,reason:'Too early.',statementVersion:'1.0',confirmation:true }) });

  workspace=await request(`/api/releases/${release.id}/residual-risks`,{ method:'POST',body:JSON.stringify({ actor:author,hazardItemId:'HAZ-001',classification:'unacceptable',rationale:'The fictional residual risk is not acceptable in this revision.',benefitRiskConclusion:null }) });
  let current=workspace.risks.find((risk) => risk.hazard.id === 'HAZ-001').current;await expectStatus(`/api/residual-risks/${current.id}/decisions`,409,{ method:'POST',body:JSON.stringify({ actor:qa,decision:'accepted',reason:'QA must never accept an unacceptable risk.' }) });
  workspace=await request(`/api/releases/${release.id}/residual-risks`,{ method:'POST',body:JSON.stringify({ actor:author,hazardItemId:'HAZ-001',classification:'acceptable',rationale:'The replacement revision records acceptable fictional residual risk.',benefitRiskConclusion:null }) });
  current=workspace.risks.find((risk) => risk.hazard.id === 'HAZ-001').current;assert.equal(current.revision,2);assert.equal(current.decision,null);

  for (const risk of workspace.risks) {
    if (risk.hazard.id !== 'HAZ-001') workspace=await request(`/api/releases/${release.id}/residual-risks`,{ method:'POST',body:JSON.stringify({ actor:author,hazardItemId:risk.hazard.id,classification:risk.hazard.id === 'HAZ-002' ? 'benefit_risk_required' : 'acceptable',rationale:`The current ${risk.hazard.id} residual risk is reviewed against its controls.`,benefitRiskConclusion:risk.hazard.id === 'HAZ-002' ? 'The fictional clinical benefit outweighs the recorded residual risk under the prototype assumptions.' : null }) });
  }
  for (const risk of workspace.risks) { const assessment=workspace.risks.find((item) => item.hazard.id === risk.hazard.id).current;workspace=await request(`/api/residual-risks/${assessment.id}/decisions`,{ method:'POST',body:JSON.stringify({ actor:qa,decision:'accepted',reason:`QA accepts the current fictional ${risk.hazard.id} assessment.` }) }); }

  const riskBytes='Fictional benefit-risk support for WP-20B.\n';const riskForm=new FormData();riskForm.set('actor',author);riskForm.set('category','risk_support');riskForm.set('file',new File([riskBytes],'../benefit:risk support.txt',{ type:'text/plain' }));workspace=await postForm(`/api/releases/${release.id}/attachments`,riskForm);
  const riskAttachment=workspace.attachments.find((item) => item.category === 'risk_support');assert.ok(riskAttachment);assert.equal(riskAttachment.filename,'benefit_risk support.txt');assert.equal(riskAttachment.sha256,hash(riskBytes));
  workspace=await request(`/api/releases/${release.id}/residual-risk-acceptance`,{ method:'POST',body:JSON.stringify({ actor:qa,reason:'All eight current fictional assessments and supporting evidence were reviewed.',statementVersion:'1.0',confirmation:true }) });assert.ok(workspace.attestations.find((item) => item.kind === 'residual_risk_acceptance' && item.current));

  workspace=await postForm(`/api/releases/${release.id}/ci-evidence`,ciBundle({ commitSha:'b'.repeat(40) }));assert.equal(workspace.ciEvidence[0].validationStatus,'invalid');await expectStatus(`/api/ci-evidence/${workspace.ciEvidence[0].id}/decisions`,409,{ method:'POST',body:JSON.stringify({ actor:qa,decision:'accepted',reason:'Invalid imports cannot be accepted.' }) });
  workspace=await postForm(`/api/releases/${release.id}/ci-evidence`,ciBundle({ expectedHash:'c'.repeat(64) }));assert.match(workspace.ciEvidence[0].validationError,/Hash mismatch/);
  workspace=await postForm(`/api/releases/${release.id}/ci-evidence`,ciBundle({ conclusion:'failure',checkConclusion:'failure' }));assert.match(workspace.ciEvidence[0].validationError,/did not conclude successfully/);assert.match(workspace.ciEvidence[0].validationError,/did not pass/);
  workspace=await postForm(`/api/releases/${release.id}/ci-evidence`,ciBundle());let ci=workspace.ciEvidence[0];assert.equal(ci.validationStatus,'valid');workspace=await request(`/api/ci-evidence/${ci.id}/decisions`,{ method:'POST',body:JSON.stringify({ actor:qa,decision:'rejected',reason:'QA rejects this valid import to verify decision history.' }) });
  workspace=await postForm(`/api/releases/${release.id}/ci-evidence`,await acceptedCiBundle());ci=workspace.ciEvidence[0];workspace=await request(`/api/ci-evidence/${ci.id}/decisions`,{ method:'POST',body:JSON.stringify({ actor:qa,decision:'accepted',reason:'Manifest fields, exact commit, checks, and report bytes all match.' }) });assert.equal(workspace.ciEvidence[0].decision.decision,'accepted');assert.equal(workspace.ciEvidence.length,5);

  workspace=await request(`/api/releases/${release.id}/final-readiness`,{ method:'POST',body:JSON.stringify({ actor:qa }) });assert.equal(workspace.latestFinalReadiness.status,'ready');const staleRun=workspace.latestFinalReadiness;
  const supportForm=new FormData();supportForm.set('actor',author);supportForm.set('category','release_support');supportForm.set('file',new File(['Additional release support.\n'],'release-support.txt',{ type:'text/plain' }));workspace=await postForm(`/api/releases/${release.id}/attachments`,supportForm);assert.equal(workspace.latestFinalReadiness.id,staleRun.id);assert.equal(workspace.latestFinalReadiness.stale,true);
  await expectStatus(`/api/releases/${release.id}/approve`,400,{ method:'POST',body:JSON.stringify({ actor:author,reason:'Wrong role.',statementVersion:'1.0',finalReadinessRunId:staleRun.id,confirmation:true }) });
  await expectStatus(`/api/releases/${release.id}/approve`,409,{ method:'POST',body:JSON.stringify({ actor:approver,reason:'Stale run cannot be approved.',statementVersion:'1.0',finalReadinessRunId:staleRun.id,confirmation:true }) });
  workspace=await request(`/api/releases/${release.id}/final-readiness`,{ method:'POST',body:JSON.stringify({ actor:approver }) });assert.equal(workspace.latestFinalReadiness.status,'ready');assert.equal(workspace.latestFinalReadiness.stale,false);
  workspace=await request(`/api/releases/${release.id}/approve`,{ method:'POST',body:JSON.stringify({ actor:approver,reason:'All current fictional final-release controls are satisfied.',statementVersion:'1.0',finalReadinessRunId:workspace.latestFinalReadiness.id,confirmation:true }) });assert.equal(workspace.release.status,'release_approved');assert.equal(workspace.release.releaseApprovedBy,approver);assert.equal(workspace.latestFinalReadiness.stale,false);assert.ok(workspace.attestations.find((item) => item.kind === 'final_release_approval' && item.current));
  assert.ok(workspace.audit.find((event) => event.action === 'fictional_release_approved'));assert.ok(workspace.audit.find((event) => event.action === 'ci_evidence_imported_invalid'));
  await expectStatus(`/api/releases/${release.id}/residual-risks`,409,{ method:'POST',body:JSON.stringify({ actor:author,hazardItemId:'HAZ-003',classification:'acceptable',rationale:'Frozen releases cannot change.',benefitRiskConclusion:null }) });
  const download=await raw(`/api/release-attachments/${riskAttachment.id}`);assert.equal(download.status,200);assert.match(download.headers.get('content-disposition') ?? '',/^attachment;/);assert.equal(await download.text(),riskBytes);
  if (!keepFinalState) { await reset();const missing=await raw(`/api/release-attachments/${riskAttachment.id}`);assert.equal(missing.status,404); }
  completed=true;
  console.log('WP-20B final release verified: risk revisions, durable evidence, CI validation history, two-role attestations, stale-run enforcement, final freeze, audit history, download, and reset cleanup.');
} finally {
  if (!completed || !keepFinalState) await reset();
}
