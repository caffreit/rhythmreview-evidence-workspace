import assert from 'node:assert/strict';

const baseUrl = process.env.DEMO_URL ?? 'http://localhost:3000';

async function rawRequest(path,init) {
  const response = await fetch(`${baseUrl}${path}`,{ ...init,headers:{ 'content-type':'application/json',...(init?.headers ?? {}) } });
  const body = await response.json();
  return { response,body };
}

async function request(path,init) {
  const { response,body } = await rawRequest(path,init);
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

await request('/api/reset',{ method:'POST' });
try {
  const failed = await rawRequest('/api/sources/SRC-001/analyse',{ method:'POST',body:JSON.stringify({ mode:'live',actor:'Alex Morgan · Author' }) });
  assert.equal(failed.response.status,502,'Offline regression server must run with OPENROUTER_API_KEY disabled.');
  assert.equal(typeof failed.body.runId,'string');
  assert.equal(typeof failed.body.retryable,'boolean');

  let detail = await request('/api/sources/SRC-001');
  const failedRun = detail.runs.find((run) => run.id === failed.body.runId);
  assert.equal(failedRun.status,'failed');
  assert.equal(failedRun.mode,'live');
  assert.equal(failedRun.outputTokens,null);
  assert.equal(detail.clarifications.length,0);

  detail = await request('/api/sources/SRC-001/analyse',{ method:'POST',body:JSON.stringify({ mode:'replay',actor:'Alex Morgan · Author' }) });
  const replayContext = detail.runs.find((run) => run.kind === 'source_context' && run.status === 'completed');
  assert.equal(replayContext.mode,'replay');
  assert.equal(replayContext.policyVersion,'source-context-v3');
  assert.equal(replayContext.attemptCount,0);

  const required = detail.clarifications.find((item) => item.severity === 'required');
  assert.ok(required);
  detail = await request(`/api/clarifications/${required.id}`,{ method:'POST',body:JSON.stringify({ action:'answer',answer:'30 seconds is the maximum for the current release; 60-second peak behavior is an engineering gap.',actor:'Alex Morgan · Author' }) });
  assert.equal(detail.source.status,'ready_for_needs');
  assert.equal(detail.clarifications.some((item) => item.severity === 'advisory' && item.status === 'open'),true);

  const failedGeneration = await rawRequest('/api/sources/SRC-001/generate',{ method:'POST',body:JSON.stringify({ kind:'user_needs',mode:'live',actor:'Alex Morgan · Author' }) });
  assert.equal(failedGeneration.response.status,502);
  assert.equal(failedGeneration.body.error,'OpenRouter is not configured, so live user needs generation did not run.');
  detail = await request('/api/sources/SRC-001');
  assert.equal(detail.source.status,'ready_for_needs');
  assert.equal(detail.candidates.length,0);
  assert.equal(detail.runs.find((run) => run.id === failedGeneration.body.runId).status,'failed');

  detail = await request('/api/sources/SRC-001/generate',{ method:'POST',body:JSON.stringify({ kind:'user_needs',mode:'replay',actor:'Alex Morgan · Author' }) });
  assert.equal(detail.candidates.filter((candidate) => candidate.type === 'user_need').length,3);
  assert.equal(detail.candidates.filter((candidate) => candidate.type === 'user_need').every((candidate) => candidate.level === null && candidate.parentIds.length === 0),true);
  for (const candidate of detail.candidates.filter((entry) => entry.type === 'user_need')) detail = await request(`/api/source-candidates/${candidate.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:'approved_for_baseline',reason:'Supported by exact fictional provenance.',actor:'Jamie Chen · QA reviewer' }) });
  assert.equal(detail.source.status,'ready_for_requirements');

  detail = await request('/api/sources/SRC-001/generate',{ method:'POST',body:JSON.stringify({ kind:'requirements',mode:'replay',actor:'Alex Morgan · Author' }) });
  const requirements = detail.candidates.filter((candidate) => candidate.type === 'requirement');
  assert.equal(requirements.length,3);
  assert.equal(requirements.every((candidate) => candidate.parentIds.length > 0 && /\bshall\b/i.test(candidate.statement)),true);
  assert.equal(requirements.some((candidate) => candidate.citations.some((citation) => citation.kind === 'clarification_answer')),true);
  for (const candidate of requirements) detail = await request(`/api/source-candidates/${candidate.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:'approved_for_baseline',reason:'Atomic, verifiable, and supported by fictional provenance.',actor:'Jamie Chen · QA reviewer' }) });
  assert.equal(detail.source.status,'candidate_baseline');

  let workspace = await request('/api/sources');
  assert.equal(workspace.impactRun.status,'failed');
  assert.equal(workspace.impactRun.mode,'live');
  assert.equal(workspace.impactSuggestions.length,0);
  assert.equal(workspace.candidateBaselineReady,false);

  workspace = await request('/api/sources/SRC-001/impact-analysis',{ method:'POST',body:JSON.stringify({ mode:'replay',actor:'Alex Morgan · Author' }) });
  assert.equal(workspace.impactRun.status,'completed');
  assert.equal(workspace.impactRun.mode,'replay');
  assert.equal(workspace.impactSuggestions.length > 0,true);
  for (const suggestion of workspace.impactSuggestions) workspace = await request(`/api/source-impact-suggestions/${suggestion.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:'accepted',reason:'Required for the fictional source-derived baseline.',actor:'Jamie Chen · QA reviewer' }) });
  assert.equal(workspace.candidateBaselineReady,true);

  workspace = await request('/api/source-baselines/approve',{ method:'POST',body:JSON.stringify({ actor:'Jamie Chen · QA reviewer',confirmation:true }) });
  assert.equal(workspace.release.status,'planned');
  assert.equal((await request('/api/overview')).baseline.label,'RR-1.1');
  console.log(JSON.stringify({ verified:true,sourceId:'SRC-001',baseline:'RR-1.1',releaseId:workspace.release.id },null,2));
} finally {
  await request('/api/reset',{ method:'POST' });
}
