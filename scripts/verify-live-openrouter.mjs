import assert from 'node:assert/strict';

if (!process.env.OPENROUTER_API_KEY?.trim()) throw new Error('OPENROUTER_API_KEY is required for verify:live.');

const baseUrl = process.env.DEMO_URL ?? 'http://localhost:3000';
const expectedModel = process.env.OPENROUTER_MODEL ?? 'openai/gpt-5.6-luna';

async function request(path,init) {
  const response = await fetch(`${baseUrl}${path}`,{ ...init,headers:{ 'content-type':'application/json',...(init?.headers ?? {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

function assertLiveRun(run,policyVersion,{ embeddings = false } = {}) {
  assert.ok(run);
  assert.equal(run.mode,'live');
  assert.equal(run.status,'completed');
  assert.equal(run.model,expectedModel);
  assert.equal(run.policyVersion ?? run.promptVersion,policyVersion);
  assert.equal(run.error,null);
  assert.equal(typeof run.providerRequestId,'string');
  assert.ok(run.providerRequestId.length > 0);
  assert.ok(run.durationMs >= 0);
  assert.ok(run.attemptCount >= 1 && run.attemptCount <= 2);
  assert.ok(run.inputTokens > 0);
  assert.ok(run.outputTokens > 0);
  if (embeddings) assert.ok(Number.isInteger(run.embeddingTokens) && run.embeddingTokens >= 0);
}

await request('/api/reset',{ method:'POST' });
try {
  const sourceDetail = await request('/api/sources/SRC-001/analyse',{ method:'POST',body:JSON.stringify({ mode:'live',actor:'Alex Morgan · Author' }) });
  const contextRun = sourceDetail.runs.find((run) => run.kind === 'source_context');
  assertLiveRun(contextRun,'source-context-v3');
  assert.equal(sourceDetail.clarifications.length > 0,true);
  assert.equal(sourceDetail.clarifications.flatMap((item) => item.citations).every((citation) => citation.kind === 'source_span'),true);

  const scenarios = await request('/api/scenarios');
  const scenario = scenarios.scenarios.find((entry) => entry.id === 'SCN-002');
  assert.ok(scenario);
  const change = await request('/api/changes',{ method:'POST',body:JSON.stringify({ kind:'evidence',scenarioId:scenario.id,anchorItemId:scenario.anchorId,title:scenario.title,proposedText:scenario.proposedText,rationale:scenario.rationale,createdBy:'Alex Morgan · Author' }) });
  const analysed = await request(`/api/changes/${change.id}/analyse`,{ method:'POST',body:JSON.stringify({ mode:'live' }) });
  assertLiveRun(analysed.run,'impact-v6',{ embeddings:true });
  assert.equal(analysed.suggestions.length > 0,true);
  assert.equal(analysed.suggestions.every((suggestion) => suggestion.citations.includes(suggestion.targetId)),true);

  console.log(JSON.stringify({ verified:true,sourceRunId:contextRun.id,impactRunId:analysed.run.id,model:expectedModel },null,2));
} finally {
  await request('/api/reset',{ method:'POST' });
}
