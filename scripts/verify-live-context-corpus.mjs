import assert from 'node:assert/strict';

if (!process.env.OPENROUTER_API_KEY?.trim()) throw new Error('OPENROUTER_API_KEY is required for verify:live-contexts.');
const baseUrl = process.env.DEMO_URL ?? 'http://localhost:3000';
const expectedModel = process.env.OPENROUTER_MODEL ?? 'openai/gpt-5.6-luna';
const resume = process.env.LIVE_CONTEXT_RESUME === '1';

async function request(path,init) {
  const response = await fetch(`${baseUrl}${path}`,{ ...init,headers:{ 'content-type':'application/json',...(init?.headers ?? {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

if (!resume) await request('/api/reset',{ method:'POST' });
const results = [];
for (const sourceId of ['SRC-001','SRC-002','SRC-003']) {
  const existing = resume ? await request(`/api/sources/${sourceId}`) : null;
  const detail = existing?.runs.some((run) => run.kind === 'source_context' && run.status === 'completed')
    ? existing
    : await request(`/api/sources/${sourceId}/analyse`,{ method:'POST',body:JSON.stringify({ mode:'live',actor:'Alex Morgan · Author' }) });
  const run = detail.runs.find((item) => item.kind === 'source_context');
  assert.ok(run);
  assert.equal(run.mode,'live');
  assert.equal(run.status,'completed');
  assert.equal(run.model,expectedModel);
  assert.equal(run.policyVersion,'source-context-v3');
  assert.equal(run.error,null);
  assert.ok(typeof run.providerRequestId === 'string' && run.providerRequestId.length > 0);
  assert.ok(run.durationMs >= 0 && run.attemptCount === 1 && run.inputTokens > 0 && run.outputTokens > 0);
  assert.equal(detail.clarifications.flatMap((item) => item.citations).every((citation) => citation.kind === 'source_span' && detail.revision.content.includes(citation.quote)),true);
  if (sourceId === 'SRC-001') {
    assert.equal(detail.clarifications.filter((item) => item.severity === 'required').length,1);
    assert.equal(detail.clarifications.some((item) => item.severity === 'advisory' && /escalation/i.test(item.question)),true);
  } else if (sourceId === 'SRC-002') {
    assert.equal(detail.clarifications.some((item) => /offline|network connection/i.test(item.question)),false);
    assert.equal(detail.clarifications.some((item) => /who owns|which.*owns|ownership/i.test(item.question)),false);
    assert.equal(detail.clarifications.every((item) => item.severity === 'advisory'),true);
    assert.equal(detail.clarifications.some((item) => /operating procedure|trigger|handoff/i.test(item.question)),true);
  } else {
    assert.equal(detail.clarifications.length,0);
  }
  results.push({ sourceId,runId:run.id,durationMs:run.durationMs,inputTokens:run.inputTokens,outputTokens:run.outputTokens,questions:detail.clarifications.map((item) => ({ severity:item.severity,question:item.question })) });
}
console.log(JSON.stringify({ verified:true,policyVersion:'source-context-v3',model:expectedModel,results },null,2));
