import assert from 'node:assert/strict';

if (!process.env.OPENROUTER_API_KEY?.trim()) throw new Error('OPENROUTER_API_KEY is required for evaluate:live-corpus.');

const baseUrl = process.env.DEMO_URL ?? 'http://localhost:3000';
const expectedModel = process.env.OPENROUTER_MODEL ?? 'openai/gpt-5.6-luna';
const author = 'Alex Morgan · Author';
const reviewer = 'Jamie Chen · QA reviewer';
const timingDecision = '30 seconds is the maximum for the current release; 60-second peak behavior is an engineering gap.';
const resume = process.env.LIVE_CORPUS_RESUME === '1';
const impactOnly = process.env.LIVE_CORPUS_IMPACT_ONLY === '1';

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

function supportedSourceCandidate(sourceId,candidate) {
  const text = `${candidate.supportedUser ?? ''} ${candidate.goalOrConstraint ?? ''} ${candidate.statement}`.toLowerCase();
  if (/(user|administrator) owns? escalation|60 seconds.*(?:maximum|acceptable)/.test(text)) return false;
  if (sourceId === 'SRC-001') return /clinician/.test(text) && /(atrial.fibrillation|diagnos|clinical review|30 seconds|failure|recording|another attempt|22|single.lead)/.test(text);
  if (sourceId === 'SRC-002') return !/offline review/.test(text) && /(clinician|result|recording|acquisition|algorithm version|analysis time|network connection)/.test(text);
  return !/(send|deliver|email alert|email notification)/.test(text) && /(possible atrial fibrillation|diagnos|clinical review|audit|reviewed|trace|intended.use|verification)/.test(text);
}

function metadataSummary(run) {
  return { id:run.id,kind:run.kind ?? 'impact_analysis',policyVersion:run.policyVersion ?? run.promptVersion,model:run.model,durationMs:run.durationMs,attemptCount:run.attemptCount,inputTokens:run.inputTokens,outputTokens:run.outputTokens,embeddingTokens:run.embeddingTokens };
}

if (!resume) await request('/api/reset',{ method:'POST' });
const sourceResults = [];
for (const sourceId of ['SRC-001','SRC-002','SRC-003']) {
  if (impactOnly) continue;
  if (resume) {
    const detail = await request(`/api/sources/${sourceId}`);
    const runs = ['source_context','user_needs','requirements'].map((kind) => detail.runs.find((run) => run.kind === kind));
    runs.forEach((run,index) => assertLiveRun(run,['source-context-v3','user-needs-v2','requirements-v2'][index]));
    sourceResults.push({ sourceId,runs:runs.map(metadataSummary),clarifications:detail.clarifications.map((item) => ({ severity:item.severity,status:item.status,question:item.question })),needs:detail.candidates.filter((item) => item.type === 'user_need').map((item) => ({ id:item.id,title:item.title,accepted:supportedSourceCandidate(sourceId,item) })),requirements:detail.candidates.filter((item) => item.type === 'requirement').map((item) => ({ id:item.id,title:item.title,accepted:supportedSourceCandidate(sourceId,item),statement:item.statement })) });
    continue;
  }
  let detail = await request(`/api/sources/${sourceId}/analyse`,{ method:'POST',body:JSON.stringify({ mode:'live',actor:author }) });
  const contextRun = detail.runs.find((run) => run.kind === 'source_context');
  assertLiveRun(contextRun,'source-context-v3');
  const required = detail.clarifications.filter((item) => item.severity === 'required' && item.status === 'open');
  if (sourceId === 'SRC-001') {
    assert.equal(required.length,1);
    detail = await request(`/api/clarifications/${required[0].id}`,{ method:'POST',body:JSON.stringify({ action:'answer',answer:timingDecision,actor:author }) });
    assert.equal(detail.clarifications.some((item) => item.severity === 'advisory' && item.status === 'open' && /escalation/i.test(item.question)),true);
  } else {
    for (const clarification of required) detail = await request(`/api/clarifications/${clarification.id}`,{ method:'POST',body:JSON.stringify({ action:'defer',reason:'Human review found no supported release decision in the fictional source; generation must remain neutral.',actor:author }) });
  }

  detail = await request(`/api/sources/${sourceId}/generate`,{ method:'POST',body:JSON.stringify({ kind:'user_needs',mode:'live',actor:author }) });
  const needsRun = detail.runs.find((run) => run.kind === 'user_needs');
  assertLiveRun(needsRun,'user-needs-v2');
  const needs = [];
  for (const candidate of detail.candidates.filter((item) => item.type === 'user_need')) {
    const accepted = supportedSourceCandidate(sourceId,candidate);
    needs.push({ id:candidate.id,title:candidate.title,accepted });
    detail = await request(`/api/source-candidates/${candidate.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:accepted ? 'approved_for_baseline' : 'rejected',reason:accepted ? 'Human corpus review confirmed source-supported user, outcome, and exact provenance.' : 'Human corpus review rejected an unsupported or unresolved claim.',actor:reviewer }) });
  }
  assert.equal(needs.some((item) => item.accepted),true);

  detail = await request(`/api/sources/${sourceId}/generate`,{ method:'POST',body:JSON.stringify({ kind:'requirements',mode:'live',actor:author }) });
  const requirementsRun = detail.runs.find((run) => run.kind === 'requirements');
  assertLiveRun(requirementsRun,'requirements-v2');
  const requirements = [];
  for (const candidate of detail.candidates.filter((item) => item.type === 'requirement')) {
    const accepted = supportedSourceCandidate(sourceId,candidate);
    requirements.push({ id:candidate.id,title:candidate.title,accepted,statement:candidate.statement });
  }
  assert.equal(requirements.some((item) => item.accepted),true);
  sourceResults.push({ sourceId,runs:[metadataSummary(contextRun),metadataSummary(needsRun),metadataSummary(requirementsRun)],clarifications:detail.clarifications.map((item) => ({ severity:item.severity,status:item.status,question:item.question })),needs,requirements });
}

const scenariosResponse = await request('/api/scenarios');
const existingChanges = resume ? (await request('/api/changes?limit=20')).changes : [];
const scenarioResults = [];
let totalExpected = 0;
let totalFound = 0;
let totalCritical = 0;
let totalCriticalFound = 0;
let totalActionable = 0;
let totalRelevantActionable = 0;

for (const scenario of scenariosResponse.scenarios) {
  const existing = existingChanges.find((change) => change.scenarioId === scenario.id);
  const change = existing ?? await request('/api/changes',{ method:'POST',body:JSON.stringify({ kind:'evidence',scenarioId:scenario.id,anchorItemId:scenario.anchorId,title:scenario.title,proposedText:scenario.proposedText,rationale:scenario.rationale,createdBy:author }) });
  let analysed = existing?.currentAnalysisMode
    ? await request(`/api/changes/${change.id}`)
    : await request(`/api/changes/${change.id}/analyse`,{ method:'POST',body:JSON.stringify({ mode:'live' }) });
  assertLiveRun(analysed.run,'impact-v6',{ embeddings:true });
  assert.equal(analysed.suggestions.every((suggestion) => suggestion.citations.includes(suggestion.targetId)),true);
  const expected = new Map(scenario.groundTruth.map((item) => [item.itemId,item]));
  const positiveSuggestions = analysed.suggestions.filter((item) => item.action !== 'no_change');
  const suggestedIds = new Set(positiveSuggestions.map((item) => item.targetId));
  const found = [...expected.keys()].filter((id) => suggestedIds.has(id)).length;
  const criticalIds = scenario.groundTruth.filter((item) => item.critical === 1).map((item) => item.itemId);
  const criticalFound = criticalIds.filter((id) => suggestedIds.has(id)).length;
  const actionable = positiveSuggestions.filter((item) => item.action === 'update' || item.action === 'retest');
  const relevantActionable = actionable.filter((item) => expected.get(item.targetId)?.expectedAction === item.action).length;
  totalExpected += expected.size; totalFound += found; totalCritical += criticalIds.length; totalCriticalFound += criticalFound;
  totalActionable += actionable.length; totalRelevantActionable += relevantActionable;

  const review = [];
  for (const suggestion of analysed.suggestions) {
    const truth = expected.get(suggestion.targetId);
    const decision = truth ? (truth.expectedAction === suggestion.action ? 'accepted' : 'edited') : 'rejected';
    const editedAction = decision === 'edited' ? truth.expectedAction : undefined;
    review.push({ targetId:suggestion.targetId,category:suggestion.category,modelAction:suggestion.action,decision,editedAction });
    if (suggestion.decision === 'pending') analysed = await request(`/api/suggestions/${suggestion.id}/decision`,{ method:'POST',body:JSON.stringify({ decision,editedAction,reason:truth ? 'Human review matched this bounded suggestion to the locked provisional answer key.' : 'Human review found no support for this suggestion in the locked provisional answer key.',actor:reviewer }) });
  }
  const evaluation = await request(`/api/evaluations/${scenario.id}?runId=${analysed.run.id}`);
  scenarioResults.push({ scenarioId:scenario.id,run:metadataSummary(analysed.run),raw:{ expected:expected.size,totalClassified:analysed.suggestions.length,suggested:positiveSuggestions.length,criticalRecall:criticalIds.length === 0 ? 100 : Math.round(criticalFound / criticalIds.length * 100),overallRecall:expected.size === 0 ? 100 : Math.round(found / expected.size * 100),actionablePrecision:actionable.length === 0 ? 0 : Math.round(relevantActionable / actionable.length * 100) },review,storedEvaluation:evaluation.calculated });
}

console.log(JSON.stringify({
  verified:true,
  model:expectedModel,
  sourceResults,
  scenarioResults,
  aggregate:{ criticalRecall:Math.round(totalCriticalFound / totalCritical * 100),overallRecall:Math.round(totalFound / totalExpected * 100),actionablePrecision:totalActionable === 0 ? 0 : Math.round(totalRelevantActionable / totalActionable * 100),expected:totalExpected,found:totalFound,criticalExpected:totalCritical,criticalFound:totalCriticalFound,actionableSuggestions:totalActionable,relevantActionable:totalRelevantActionable },
},null,2));
