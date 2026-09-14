import assert from 'node:assert/strict';

const baseUrl = process.env.DEMO_URL ?? 'http://localhost:3000';
const author = 'Alex Morgan · Author';
const qa = 'Jamie Chen · QA reviewer';
async function response(path,init) { const result=await fetch(`${baseUrl}${path}`,{ ...init,headers:{ 'content-type':'application/json',...(init?.headers ?? {}) } });const body=await result.json();return { status:result.status,body }; }
async function request(path,init) { const result=await response(path,init);if (result.status < 200 || result.status >= 300) throw new Error(`${path} returned ${result.status}: ${JSON.stringify(result.body)}`);return result.body; }
async function expectStatus(path,status,init) { const result=await response(path,init);assert.equal(result.status,status,`${path} should return ${status}; received ${JSON.stringify(result.body)}`);return result.body; }
async function reset() { const value=await request('/api/reset',{ method:'POST' });assert.equal(value.baseline.label,'RR-1.0');assert.equal(value.evidenceCount,72);assert.equal(value.relationshipCount,122); }
const packageInput = {
  kind:'verification_package',title:'Close risk-control verification gaps',
  rationale:'Make the three uncovered risk controls objectively verifiable and add controlled verification plans before release-readiness review.',createdBy:author,
  controlUpdates:[
    { itemId:'RC-001',proposedText:'Release testing shall demonstrate sensitivity of at least 90% for the intended population.',reason:'Replace the undefined approved threshold with the fictional WP-20A acceptance value.' },
    { itemId:'RC-002',proposedText:'Release testing shall demonstrate specificity of at least 85% for the intended population.',reason:'Replace the undefined approved threshold with the fictional WP-20A acceptance value.' },
  ],
  plans:[
    { targetRiskControlId:'RC-001',title:'Sensitivity acceptance verification',objective:'Demonstrate that sensitivity meets the approved threshold for the intended population.',method:'Run the locked fictional evaluation set against the candidate build and calculate sensitivity from approved reference classifications.',acceptanceCriteria:'Sensitivity is at least 90%, all included records have approved reference classifications, and no calculation errors remain.',rationale:'Provides direct release verification for the false-negative risk control.' },
    { targetRiskControlId:'RC-002',title:'Specificity acceptance verification',objective:'Demonstrate that specificity meets the approved threshold for the intended population.',method:'Run the locked fictional evaluation set against the candidate build and calculate specificity from approved reference classifications.',acceptanceCriteria:'Specificity is at least 85%, all included records have approved reference classifications, and no calculation errors remain.',rationale:'Provides direct release verification for the false-positive risk control.' },
    { targetRiskControlId:'RC-005',title:'Adult population restriction verification',objective:'Demonstrate that the product and controlled labelling restrict use to adults aged 22 and over.',method:'Exercise age values 21, 22, and 23, inspect interface enforcement, and compare the displayed limitation with controlled labelling.',acceptanceCriteria:'Age 21 is rejected, ages 22 and 23 are accepted, the adult-only limitation is displayed, and no bypass path is observed.',rationale:'Provides the missing direct verification for the adult-population restriction.' },
  ],
};

async function decideAll(change) {
  let current=change;
  for (const proposal of current.relationshipProposals) current=await request(`/api/relationship-proposals/${proposal.id}/decision`,{ method:'POST',body:JSON.stringify({ actor:qa,decision:'accepted',reason:`QA accepts the fictional ${proposal.sourceId} VERIFIES ${proposal.targetId} plan relationship.` }) });
  return current;
}

async function recordExecution(releaseId,testItemId,outcome,executedAt,suffix) {
  return request('/api/verification-executions',{ method:'POST',body:JSON.stringify({ actor:author,releaseId,testItemId,outcome,environment:'Fictional validation environment',buildId:`BUILD-WP20A-${suffix}`,observedResult:`Fictional structured result for ${testItemId}: ${outcome === 'passed' ? 'all acceptance criteria were met.' : 'one acceptance criterion was not met.'}`,executedAt,evidenceReference:`FICT-EVIDENCE://${testItemId}/${suffix}` }) });
}
async function review(executionId,decision,reason) { return request(`/api/verification-executions/${executionId}/decision`,{ method:'POST',body:JSON.stringify({ actor:qa,decision,reason }) }); }

try {
  await reset();
  let rejectedPackage=await request('/api/changes',{ method:'POST',body:JSON.stringify(packageInput) });
  rejectedPackage=await request(`/api/changes/${rejectedPackage.id}/submit`,{ method:'POST',body:JSON.stringify({ actor:author }) });
  for (const [index,proposal] of rejectedPackage.relationshipProposals.entries()) rejectedPackage=await request(`/api/relationship-proposals/${proposal.id}/decision`,{ method:'POST',body:JSON.stringify({ actor:qa,decision:index === 0 ? 'rejected' : 'accepted',reason:index === 0 ? 'The fictional plan requires revision and must remain outside the baseline.' : 'QA accepts this fictional plan relationship.' }) });
  const partial=await request(`/api/changes/${rejectedPackage.id}/approve`,{ method:'POST',body:JSON.stringify({ actor:qa,confirmation:true }) });
  assert.equal(partial.change.verificationPlans.filter((plan) => plan.status === 'rejected').length,1);
  const partialTrace=await request('/api/traceability');assert.equal(partialTrace.summary.evidenceItems,74);assert.equal(partialTrace.summary.activeLinks,124);assert.equal(partialTrace.summary.highCoverageGaps,1);

  await reset();
  const stalePackage=await request('/api/changes',{ method:'POST',body:JSON.stringify(packageInput) });
  let advancing=await request('/api/changes',{ method:'POST',body:JSON.stringify({ kind:'relationship',anchorItemId:'IU-001',title:'Advance baseline before package approval',rationale:'Create a controlled baseline advance to prove stale package protection.',createdBy:author,proposal:{ operation:'add',sourceId:'IU-001',targetId:'LBL-004',type:'DISCLOSED_IN',rationale:'The adult intended-use restriction is disclosed in the controlled use-limitation label.' } }) });
  advancing=await request(`/api/changes/${advancing.id}/submit`,{ method:'POST',body:JSON.stringify({ actor:author }) });
  advancing=await request(`/api/relationship-proposals/${advancing.relationshipProposals[0].id}/decision`,{ method:'POST',body:JSON.stringify({ actor:qa,decision:'accepted',reason:'QA accepts the exact intended-use disclosure meaning.' }) });
  await request(`/api/changes/${advancing.id}/approve`,{ method:'POST',body:JSON.stringify({ actor:qa,confirmation:true }) });
  let staleSubmitted=await request(`/api/changes/${stalePackage.id}/submit`,{ method:'POST',body:JSON.stringify({ actor:author }) });staleSubmitted=await decideAll(staleSubmitted);
  await expectStatus(`/api/changes/${staleSubmitted.id}/approve`,409,{ method:'POST',body:JSON.stringify({ actor:qa,confirmation:true }) });

  await reset();
  const before=await request('/api/traceability');
  assert.equal(before.summary.evidenceItems,72);assert.equal(before.summary.activeLinks,122);assert.equal(before.summary.highCoverageGaps,3);
  assert.deepEqual(before.gaps.filter((gap) => gap.itemType === 'risk_control').map((gap) => gap.itemId),['RC-001','RC-002','RC-005']);

  let change=await request('/api/changes',{ method:'POST',body:JSON.stringify(packageInput) });
  assert.equal(change.subjectKind,'verification_package');assert.equal(change.status,'updates_proposed');assert.deepEqual(change.verificationPlans.map((plan) => plan.proposedItemId),['TEST-013','TEST-014','TEST-015']);
  const firstPlan=change.verificationPlans[0]; const firstProposal=change.relationshipProposals.find((proposal) => proposal.id === firstPlan.relationshipProposalId);
  assert.ok(firstProposal);
  let candidate=await request(`/api/changes/${change.id}/traceability`);assert.equal(candidate.projected.summary.evidenceItems,75);assert.equal(candidate.projected.summary.activeLinks,125);assert.equal(candidate.projected.summary.highCoverageGaps,0);
  change=await request(`/api/changes/${change.id}/submit`,{ method:'POST',body:JSON.stringify({ actor:author }) });
  change=await request(`/api/relationship-proposals/${firstProposal.id}/decision`,{ method:'POST',body:JSON.stringify({ actor:qa,decision:'accepted',reason:'QA accepts this paired verification relationship.' }) });
  change=await request(`/api/changes/${change.id}/return-to-author`,{ method:'POST',body:JSON.stringify({ actor:qa,reason:'Clarify the plan method before final review.' }) });
  change=await request(`/api/verification-plan-candidates/${firstPlan.id}`,{ method:'PATCH',body:JSON.stringify({ actor:author,title:firstPlan.title,objective:firstPlan.objective,method:`${firstPlan.method} Record the fictional calculation worksheet reference.`,acceptanceCriteria:firstPlan.acceptanceCriteria,rationale:firstPlan.rationale,reason:'Added the calculation-record expectation.' }) });
  assert.equal(change.verificationPlans[0].revision,2);assert.equal(change.relationshipProposals.find((proposal) => proposal.id === firstProposal.id).revision,2);assert.equal(change.relationshipProposals.find((proposal) => proposal.id === firstProposal.id).decision,null);assert.equal(change.coherence?.stale ?? true,true);
  change=await request(`/api/changes/${change.id}/submit`,{ method:'POST',body:JSON.stringify({ actor:author }) });
  await expectStatus(`/api/relationship-proposals/${change.relationshipProposals[0].id}/decision`,400,{ method:'POST',body:JSON.stringify({ actor:author,decision:'accepted',reason:'Authors cannot accept controlled relationship proposals.' }) });
  change=await decideAll(change);
  candidate=await request(`/api/changes/${change.id}/traceability`);assert.equal(candidate.valid,true);assert.equal(candidate.projected.summary.evidenceItems,75);assert.equal(candidate.projected.summary.activeLinks,125);assert.equal(candidate.projected.summary.highCoverageGaps,0);
  const check=await request('/api/coherence-checks',{ method:'POST',body:JSON.stringify({ scope:{ kind:'candidate',changeId:change.id },actor:qa }) });assert.equal(check.stale,false);assert.equal(check.findings.filter((finding) => finding.severity === 'high').length,0);
  const approved=await request(`/api/changes/${change.id}/approve`,{ method:'POST',body:JSON.stringify({ actor:qa,confirmation:true }) });assert.equal(approved.change.status,'approved');
  const active=await request('/api/traceability');assert.equal(active.summary.evidenceItems,75);assert.equal(active.summary.activeLinks,125);assert.equal(active.summary.highCoverageGaps,0);
  const historical=await request(`/api/traceability?baselineId=${encodeURIComponent(before.baseline.id)}`);
  assert.deepEqual(historical.links,before.links,'Prior baseline relationships changed.');
  assert.deepEqual(historical.rows,before.rows,'Prior baseline evidence projection changed.');
  assert.match((await request('/api/evidence/RC-001')).item.statement,/at least 90%/);assert.match((await request('/api/evidence/RC-002')).item.statement,/at least 85%/);

  const releases=await request('/api/releases',{ method:'POST',body:JSON.stringify({ actor:author,baselineId:active.baseline.id,label:'WP-20A fictional verification release',codeRevision:'fictional-8fdff6d-wp20a' }) });
  const release=releases.releases.find((item) => item.baselineId === active.baseline.id);assert.ok(release);assert.equal(release.status,'planned');
  await expectStatus('/api/releases',409,{ method:'POST',body:JSON.stringify({ actor:author,baselineId:active.baseline.id,label:'Duplicate release',codeRevision:'duplicate' }) });
  let verification=await request('/api/verification');assert.equal(verification.plans.length,9);
  assert.deepEqual(verification.plans.map((plan) => `${plan.riskControl.id}/${plan.test.id}`),['RC-001/TEST-013','RC-002/TEST-014','RC-003/TEST-004','RC-004/TEST-006','RC-005/TEST-015','RC-006/TEST-005','RC-007/TEST-010','RC-008/TEST-008','RC-009/TEST-011']);

  const first=verification.plans[0].test.id;
  verification=await recordExecution(release.id,first,'failed','2026-09-13T12:00:00.000Z','FAIL');
  let latest=verification.plans.find((plan) => plan.test.id === first).latestExecution;await review(latest.id,'accepted','QA confirms the fictional failed result is accurately recorded.');
  let run=await request(`/api/releases/${release.id}/readiness`,{ method:'POST',body:JSON.stringify({ actor:author }) });assert.equal(run.status,'blocked');assert.equal(run.results.some((result) => result.title === 'Verification execution failed'),true);
  verification=await recordExecution(release.id,first,'passed','2026-09-13T12:01:00.000Z','REJECT');latest=verification.plans.find((plan) => plan.test.id === first).latestExecution;
  await review(latest.id,'rejected','The fictional evidence reference is insufficient for QA acceptance.');
  run=await request(`/api/releases/${release.id}/readiness`,{ method:'POST',body:JSON.stringify({ actor:qa }) });assert.equal(run.status,'blocked');assert.equal(run.results.some((result) => result.title === 'Verification execution rejected'),true);const staleRunId=run.id;
  verification=await recordExecution(release.id,first,'passed','2026-09-13T12:02:00.000Z','CORRECT');latest=verification.plans.find((plan) => plan.test.id === first).latestExecution;await review(latest.id,'accepted','QA accepts the corrected fictional execution and evidence reference.');
  for (const [index,plan] of verification.plans.filter((plan) => plan.test.id !== first).entries()) { verification=await recordExecution(release.id,plan.test.id,'passed',`2026-09-13T12:${String(index+3).padStart(2,'0')}:00.000Z`,String(index+2).padStart(3,'0'));latest=verification.plans.find((entry) => entry.test.id === plan.test.id).latestExecution;await review(latest.id,'accepted',`QA accepts the fictional ${plan.test.id} execution record.`); }
  await expectStatus(`/api/releases/${release.id}/verification-ready`,409,{ method:'POST',body:JSON.stringify({ actor:qa,readinessRunId:staleRunId,confirmation:true }) });
  run=await request(`/api/releases/${release.id}/readiness`,{ method:'POST',body:JSON.stringify({ actor:qa }) });assert.equal(run.status,'ready');assert.equal(run.stale,false);assert.equal(run.results.filter((result) => result.code === 'RR-VER-001' && result.status === 'pass').length,9);assert.equal(run.results.some((result) => result.severity === 'warning'),true);
  await expectStatus(`/api/releases/${release.id}/verification-ready`,400,{ method:'POST',body:JSON.stringify({ actor:author,readinessRunId:run.id,confirmation:true }) });
  const readyWorkspace=await request(`/api/releases/${release.id}/verification-ready`,{ method:'POST',body:JSON.stringify({ actor:qa,readinessRunId:run.id,confirmation:true }) });const readyRelease=readyWorkspace.releases.find((item) => item.id === release.id);assert.equal(readyRelease.status,'verification_ready');assert.equal(readyRelease.readinessRunId,run.id);
  await expectStatus('/api/verification-executions',409,{ method:'POST',body:JSON.stringify({ actor:author,releaseId:release.id,testItemId:first,outcome:'passed',environment:'Fictional environment',buildId:'BUILD-FROZEN',observedResult:'This should not be stored.',executedAt:'2026-09-13T13:00:00.000Z',evidenceReference:'FICT-EVIDENCE://FROZEN' }) });
  const frozenExecution=(await request('/api/verification')).plans[0].latestExecution;await expectStatus(`/api/verification-executions/${frozenExecution.id}/decision`,409,{ method:'POST',body:JSON.stringify({ actor:qa,decision:'accepted',reason:'Frozen release decisions cannot change.' }) });
  assert.equal((await request(`/api/changes/${change.id}`)).verificationPlans.length,3);assert.equal((await request('/api/releases')).releases[0].status,'verification_ready');
  console.log('WP-20A readiness verified: 75 items, 125 links, nine current QA-accepted executions, stale-run protection, and the QA-only verification_ready transition.');
} finally {
  if (process.env.VERIFY_READINESS_KEEP !== '1') { await reset();const releases=await request('/api/releases');assert.equal(releases.releases.length,0); }
}
