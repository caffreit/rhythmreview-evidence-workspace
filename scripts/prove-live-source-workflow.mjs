import assert from 'node:assert/strict';

if (!process.env.OPENROUTER_API_KEY?.trim()) throw new Error('OPENROUTER_API_KEY is required for prove:live-source.');

const baseUrl = process.env.DEMO_URL ?? 'http://localhost:3000';
const expectedModel = process.env.OPENROUTER_MODEL ?? 'openai/gpt-5.6-luna';
const author = 'Alex Morgan · Author';
const reviewer = 'Jamie Chen · QA reviewer';
const timingDecision = '30 seconds is the maximum for the current release; 60-second peak behavior is an engineering gap.';

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
  assert.ok(typeof run.providerRequestId === 'string' && run.providerRequestId.length > 0);
  assert.ok(run.durationMs >= 0);
  assert.ok(run.attemptCount >= 1 && run.attemptCount <= 2);
  assert.ok(run.inputTokens > 0);
  assert.ok(run.outputTokens > 0);
  if (embeddings) assert.ok(Number.isInteger(run.embeddingTokens) && run.embeddingTokens >= 0);
}

function supportedNeed(candidate) {
  const text = `${candidate.supportedUser} ${candidate.goalOrConstraint}`.toLowerCase();
  return /clinician/.test(text)
    && /(atrial fibrillation|diagnos|clinical review|30 seconds|failure|recording|another attempt|adults aged 22|single-lead ecg)/.test(text)
    && !/(owns? escalation|administrator owns?|60-second.*acceptable|60 seconds.*maximum)/.test(text);
}

function supportedRequirement(candidate) {
  const text = candidate.statement.toLowerCase();
  return /\bshall\b/.test(text)
    && /(atrial.fibrillation|diagnos|clinical review|30 seconds|failure|recording|another attempt|22|single.lead)/.test(text)
    && !/(owns? escalation|administrator owns?|60 seconds)/.test(text);
}

await request('/api/reset',{ method:'POST' });

let detail = await request('/api/sources/SRC-001/analyse',{ method:'POST',body:JSON.stringify({ mode:'live',actor:author }) });
const contextRun = detail.runs.find((run) => run.kind === 'source_context');
assertLiveRun(contextRun,'source-context-v3');
const required = detail.clarifications.filter((item) => item.severity === 'required');
const advisory = detail.clarifications.filter((item) => item.severity === 'advisory');
assert.equal(required.length,1);
assert.match(required[0].question,/30.second|timing|completion time/i);
assert.equal(advisory.some((item) => /escalation/i.test(item.question) && item.status === 'open'),true);

detail = await request(`/api/clarifications/${required[0].id}`,{ method:'POST',body:JSON.stringify({ action:'answer',answer:timingDecision,actor:author }) });
assert.equal(detail.source.status,'ready_for_needs');

detail = await request('/api/sources/SRC-001/generate',{ method:'POST',body:JSON.stringify({ kind:'user_needs',mode:'live',actor:author }) });
const needsRun = detail.runs.find((run) => run.kind === 'user_needs');
assertLiveRun(needsRun,'user-needs-v2');
const needReviews = [];
for (const candidate of detail.candidates.filter((item) => item.type === 'user_need')) {
  const accepted = supportedNeed(candidate);
  needReviews.push({ id:candidate.id,title:candidate.title,accepted,supportedUser:candidate.supportedUser,goalOrConstraint:candidate.goalOrConstraint });
  detail = await request(`/api/source-candidates/${candidate.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:accepted ? 'approved_for_baseline' : 'rejected',reason:accepted ? 'Human review confirmed the user, goal, and exact fictional provenance.' : 'Human review found this candidate unsupported by the supplied fictional material.',actor:reviewer }) });
}
assert.equal(needReviews.some((item) => item.accepted),true);
assert.equal(detail.source.status,'ready_for_requirements');

detail = await request('/api/sources/SRC-001/generate',{ method:'POST',body:JSON.stringify({ kind:'requirements',mode:'live',actor:author }) });
const requirementsRun = detail.runs.find((run) => run.kind === 'requirements');
assertLiveRun(requirementsRun,'requirements-v2');
const requirementReviews = [];
for (const candidate of detail.candidates.filter((item) => item.type === 'requirement')) {
  const accepted = supportedRequirement(candidate);
  requirementReviews.push({ id:candidate.id,title:candidate.title,accepted,level:candidate.level,statement:candidate.statement,parentIds:candidate.parentIds });
  detail = await request(`/api/source-candidates/${candidate.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:accepted ? 'approved_for_baseline' : 'rejected',reason:accepted ? 'Human review confirmed one testable obligation, accepted parentage, explicit limits, and exact fictional provenance.' : 'Human review found this obligation unsupported or outside the resolved fictional scope.',actor:reviewer }) });
}
assert.equal(requirementReviews.some((item) => item.accepted),true);
assert.equal(detail.source.status,'candidate_baseline');

let workspace = await request('/api/sources');
if (workspace.impactRun?.status !== 'completed') workspace = await request('/api/sources/SRC-001/impact-analysis',{ method:'POST',body:JSON.stringify({ mode:'live',actor:author }) });
assertLiveRun(workspace.impactRun,'impact-v6',{ embeddings:true });
for (const suggestion of workspace.impactSuggestions) {
  assert.equal(suggestion.citations.includes(suggestion.targetId),true);
  const accepted = suggestion.proposedAction !== 'no_change';
  workspace = await request(`/api/source-impact-suggestions/${suggestion.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:accepted ? 'accepted' : 'rejected',reason:accepted ? 'Human review confirmed this bounded item warrants the proposed follow-up; no relationship or baseline is approved by the suggestion.' : 'Human review confirmed that this bounded item requires no change for the fictional source.',actor:reviewer }) });
}
assert.equal(workspace.candidateBaselineReady,true);

workspace = await request('/api/source-baselines/approve',{ method:'POST',body:JSON.stringify({ actor:reviewer,confirmation:true }) });
const finalDetail = await request('/api/sources/SRC-001');
assert.equal(finalDetail.source.status,'baselined');
assert.equal(finalDetail.runs.every((run) => run.mode === 'live'),true);
assert.equal(Object.hasOwn(workspace,'release'),false);
assert.equal((await request('/api/releases')).releases.length,0);

console.log(JSON.stringify({
  verified:true,
  sourceId:'SRC-001',
  baseline:(await request('/api/overview')).baseline.label,
  releaseCreation:'explicit_on_releases_page',
  openAdvisoryClarificationId:advisory.find((item) => /escalation/i.test(item.question))?.id,
  runs:[contextRun,needsRun,requirementsRun,workspace.impactRun].map((run) => ({ id:run.id,kind:run.kind ?? 'impact_analysis',policyVersion:run.policyVersion ?? run.promptVersion,model:run.model,durationMs:run.durationMs,attemptCount:run.attemptCount,inputTokens:run.inputTokens,outputTokens:run.outputTokens,embeddingTokens:run.embeddingTokens })),
  needReviews,
  requirementReviews,
  impactSuggestionsReviewed:workspace.impactSuggestions.length,
},null,2));
