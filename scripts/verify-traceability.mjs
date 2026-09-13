import assert from 'node:assert/strict';

const baseUrl = process.env.DEMO_URL ?? 'http://localhost:3000';
const author = 'Alex Morgan · Author';
const qa = 'Jamie Chen · QA reviewer';

async function response(path,init) {
  const result = await fetch(`${baseUrl}${path}`,{ ...init,headers:{ 'content-type':'application/json',...(init?.headers ?? {}) } });
  const body = await result.json();
  return { status:result.status,body };
}
async function request(path,init) {
  const result = await response(path,init);
  if (result.status < 200 || result.status >= 300) throw new Error(`${path} returned ${result.status}: ${JSON.stringify(result.body)}`);
  return result.body;
}
async function reset() { const result = await request('/api/reset',{ method:'POST' }); assert.equal(result.baseline.label,'RR-1.0'); }
const draft = (sourceId,targetId,type,rationale) => ({ operation:'add',sourceId,targetId,type,rationale });
async function createRelationship(proposal) {
  return request('/api/changes',{ method:'POST',body:JSON.stringify({ kind:'relationship',anchorItemId:proposal.sourceId,title:`Add ${proposal.type} relationship`,rationale:proposal.rationale,createdBy:author,proposal }) });
}
async function submit(changeId) { return request(`/api/changes/${changeId}/submit`,{ method:'POST',body:JSON.stringify({ actor:author }) }); }
async function decide(proposalId,decision='accepted',reason='QA confirms the relationship meaning between these exact controlled versions.') {
  return request(`/api/relationship-proposals/${proposalId}/decision`,{ method:'POST',body:JSON.stringify({ actor:qa,decision,reason }) });
}
async function approve(changeId) { return request(`/api/changes/${changeId}/approve`,{ method:'POST',body:JSON.stringify({ actor:qa,confirmation:true }) }); }

try {
  await reset();
  const before = await request('/api/traceability');
  assert.equal(before.baseline.label,'RR-1.0');
  assert.equal(before.links.some((link) => link.sourceId === 'IU-001' && link.targetId === 'LBL-004' && link.type === 'DISCLOSED_IN'),false);
  assert.equal(before.gaps.some((gap) => gap.id === 'TRC-RC-002-RC-005'),true);

  let change = await createRelationship(draft('IU-001','LBL-004','DISCLOSED_IN','The approved adult-use limitation in IU-001 must be disclosed in the controlled use-limitation label LBL-004.'));
  assert.equal(change.subjectKind,'relationship'); assert.equal(change.status,'updates_proposed'); assert.equal(change.run,null);
  const proposalId = change.relationshipProposals[0].id;
  let candidate = await request(`/api/changes/${change.id}/traceability`);
  assert.equal(candidate.valid,true);
  assert.equal(candidate.projected.links.some((link) => link.sourceId === 'IU-001' && link.targetId === 'LBL-004' && link.type === 'DISCLOSED_IN'),true);
  assert.equal(candidate.projected.gaps.some((gap) => gap.id === 'TRC-RC-002-RC-005'),true);

  change = await submit(change.id); assert.equal(change.status,'qa_review');
  const authorDecision = await response(`/api/relationship-proposals/${proposalId}/decision`,{ method:'POST',body:JSON.stringify({ actor:author,decision:'accepted',reason:'Authors cannot make QA decisions.' }) });
  assert.equal(authorDecision.status,400);
  change = await decide(proposalId); assert.equal(change.relationshipProposals[0].decision.decision,'accepted');
  candidate = await request(`/api/changes/${change.id}/traceability`); assert.equal(candidate.deltas[0].status,'accepted');
  const approved = await approve(change.id); assert.equal(approved.change.status,'approved');

  const active = await request('/api/traceability');
  assert.equal(active.baseline.label,'RR-1.1');
  assert.equal(active.links.some((link) => link.sourceId === 'IU-001' && link.targetId === 'LBL-004' && link.type === 'DISCLOSED_IN'),true);
  assert.equal(active.gaps.some((gap) => gap.id === 'TRC-RC-002-RC-005'),true);
  const old = await request(`/api/traceability?baselineId=${encodeURIComponent(before.baseline.id)}`);
  assert.deepEqual(old.links,before.links,'The prior relationship rows must remain byte-for-byte unchanged.');
  assert.equal(approved.change.audit.some((event) => event.action === 'baseline_approved' && Array.isArray(event.details.changes.find((entry) => entry.field === 'relationships')?.oldValue)),true);

  await reset();
  change = await createRelationship(draft('CLM-002','LBL-004','DISCLOSED_IN','The controlled outcomes claim should be reviewed against the use-limitation label before any disclosure link is approved.'));
  change = await submit(change.id); change = await decide(change.relationshipProposals[0].id,'rejected','LBL-004 does not contain the three controlled outcome statements.');
  const closed = await request(`/api/changes/${change.id}/close`,{ method:'POST',body:JSON.stringify({ actor:qa,reason:'Every relationship proposal was rejected, so no baseline change is warranted.',confirmation:true }) });
  assert.equal(closed.status,'closed'); assert.equal((await request('/api/overview')).baseline.label,'RR-1.0');

  await reset();
  change = await createRelationship(draft('IU-001','LBL-004','DISCLOSED_IN','The intended-use limitation is disclosed in the controlled use-limitation label.'));
  change = await submit(change.id); change = await decide(change.relationshipProposals[0].id);
  change = await request(`/api/changes/${change.id}/return-to-author`,{ method:'POST',body:JSON.stringify({ actor:qa,reason:'Strengthen the statement-based rationale before approval.' }) });
  change = await request(`/api/relationship-proposals/${change.relationshipProposals[0].id}`,{ method:'PATCH',body:JSON.stringify({ operation:'revise_add',actor:author,sourceId:'IU-001',targetId:'LBL-004',type:'DISCLOSED_IN',rationale:'IU-001 states the same adult population restriction that is explicitly controlled in LBL-004.',reason:'Clarified the exact shared restriction.' }) });
  assert.equal(change.relationshipProposals[0].revision,2); assert.equal(change.relationshipProposals[0].decision,null);
  change = await submit(change.id);
  assert.equal((await response(`/api/changes/${change.id}/approve`,{ method:'POST',body:JSON.stringify({ actor:qa,confirmation:true }) })).status,409);
  change = await decide(change.relationshipProposals[0].id); await approve(change.id);

  await reset();
  const stale = await createRelationship(draft('IU-001','LBL-004','DISCLOSED_IN','The intended-use limitation should be disclosed in the controlled use-limitation label.'));
  let advancing = await createRelationship(draft('CLM-002','LBL-004','DISCLOSED_IN','The three controlled outcomes should be disclosed in a controlled product label.'));
  advancing = await submit(advancing.id); advancing = await decide(advancing.relationshipProposals[0].id); await approve(advancing.id);
  let staleChange = await submit(stale.id); staleChange = await decide(staleChange.relationshipProposals[0].id);
  assert.equal((await response(`/api/changes/${staleChange.id}/approve`,{ method:'POST',body:JSON.stringify({ actor:qa,confirmation:true }) })).status,409);

  console.log('Traceability lifecycle verified: deterministic projection, revision-bound QA, immutable baselines, close-without-baseline, and stale-baseline conflict.');
} finally {
  await reset();
}
