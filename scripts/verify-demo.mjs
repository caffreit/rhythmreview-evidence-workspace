import assert from 'node:assert/strict';

const baseUrl = process.env.DEMO_URL ?? 'http://localhost:3000';

async function request(path,init) {
  const response = await fetch(`${baseUrl}${path}`,{ ...init,headers:{ 'content-type':'application/json',...(init?.headers ?? {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function expectStatus(path,status,init) {
  const response = await fetch(`${baseUrl}${path}`,{ ...init,headers:{ 'content-type':'application/json',...(init?.headers ?? {}) } });
  assert.equal(response.status,status,`${path} should return ${status}`);
  return response.json();
}

async function assertLinkedPaths(suggestions) {
  const detailById = new Map();
  for (const suggestion of suggestions) {
    if (suggestion.origin === 'semantic') {
      assert.deepEqual(suggestion.path,[suggestion.targetId]);
      continue;
    }
    for (let index = 0; index < suggestion.path.length - 1; index += 1) {
      const source = suggestion.path[index];
      const target = suggestion.path[index + 1];
      if (!detailById.has(source)) detailById.set(source,await request(`/api/evidence/${source}`));
      const detail = detailById.get(source);
      assert.equal(detail.relationships.some((relationship) => (relationship.sourceId === source && relationship.targetId === target) || (relationship.targetId === source && relationship.sourceId === target)),true,`${source} → ${target} must be a stored relationship`);
    }
  }
}

const documentByScenario = { 'SCN-001':'DOC-010','SCN-002':'DOC-003','SCN-003':'DOC-001' };
const summaries = [];

for (const scenarioId of ['SCN-001','SCN-002','SCN-003']) {
  const reset = await request('/api/reset',{ method:'POST' });
  assert.equal(reset.baseline.label,'RR-1.0');
  assert.deepEqual(reset.checkSummary,{ total:6,high:1,deterministic:3,fixtures:3,waived:0 });

  if (scenarioId === 'SCN-001') {
    const baselineFinding = reset.coherence.findings.find((finding) => finding.code === 'TRC-014');
    assert.ok(baselineFinding);
    await expectStatus(`/api/coherence-findings/${baselineFinding.id}/dispositions`,400,{ method:'POST',body:JSON.stringify({ action:'waived',runId:reset.coherence.id,fingerprint:baselineFinding.fingerprint,actor:'Alex Morgan · Author',reason:'Authors cannot waive findings.' }) });
    const waived = await request(`/api/coherence-findings/${baselineFinding.id}/dispositions`,{ method:'POST',body:JSON.stringify({ action:'waived',runId:reset.coherence.id,fingerprint:baselineFinding.fingerprint,actor:'Jamie Chen · QA reviewer',reason:'Accepted for this fictional baseline demonstration.' }) });
    assert.equal(waived.findings.find((finding) => finding.id === baselineFinding.id).status,'waived');
    const rerun = await request('/api/coherence-checks',{ method:'POST',body:JSON.stringify({ scope:{ kind:'baseline',baselineId:reset.baseline.id },actor:'Jamie Chen · QA reviewer' }) });
    assert.equal(rerun.findings.find((finding) => finding.id === baselineFinding.id).status,'waived');
  }

  const scenarios = await request('/api/scenarios');
  const scenario = scenarios.scenarios.find((entry) => entry.id === scenarioId);
  assert.ok(scenario);
  const documentId = documentByScenario[scenarioId];
  const beforeDocument = await request(`/api/documents/${documentId}`);
  assert.equal(beforeDocument.baseline.label,'RR-1.0');

  const change = await request('/api/changes',{ method:'POST',body:JSON.stringify({ scenarioId:scenario.id,anchorItemId:scenario.anchorId,title:scenario.title,proposedText:scenario.proposedText,rationale:scenario.rationale,createdBy:'Alex Morgan · Author' }) });
  assert.equal(change.status,'draft');
  assert.equal(change.revision,1);
  const recent = await request('/api/changes?limit=20');
  assert.equal(recent.changes[0].id,change.id);
  assert.equal((await request('/api/overview')).baseline.label,'RR-1.0');

  if (scenarioId === 'SCN-001' && !process.env.OPENAI_API_KEY) {
    const failed = await request(`/api/changes/${change.id}/analyse`,{ method:'POST',body:JSON.stringify({ mode:'live' }) });
    assert.equal(failed.status,'draft');
    assert.equal(failed.run,null);
    assert.equal(failed.suggestions.length,0);
    assert.equal(failed.analysisHistory[0].status,'failed');
    assert.match(failed.analysisWarning,/No AI suggestions were saved/);
  }

  const analysed = await request(`/api/changes/${change.id}/analyse`,{ method:'POST',body:JSON.stringify({ mode:'replay' }) });
  assert.equal(analysed.status,'ready_for_review');
  assert.equal(analysed.run.mode,'replay');
  assert.equal(analysed.run.model,'saved-output-no-api');
  assert.equal(analysed.suggestions.length,scenario.expectedCount);
  assert.equal(analysed.suggestions.every((suggestion) => suggestion.citations.length > 0),true);
  assert.equal(analysed.suggestions.every((suggestion) => !suggestion.rationale.includes('contains or supports an assumption')),true);
  assert.equal(analysed.audit.every((event) => event.schemaVersion === 1),true);
  assert.equal(analysed.audit.every((event) => Array.isArray(event.details.changes)),true);
  await assertLinkedPaths(analysed.suggestions);
  let candidateCheck = await request('/api/coherence-checks',{ method:'POST',body:JSON.stringify({ scope:{ kind:'candidate',changeId:change.id },actor:'Alex Morgan · Author' }) });
  assert.equal(candidateCheck.scope.kind,'candidate');
  assert.equal(candidateCheck.stale,false);
  const candidateHigh = candidateCheck.findings.find((finding) => finding.code === 'TRC-014');
  assert.ok(candidateHigh);
  candidateCheck = await request(`/api/coherence-findings/${candidateHigh.id}/dispositions`,{ method:'POST',body:JSON.stringify({ action:'waived',runId:candidateCheck.id,fingerprint:candidateHigh.fingerprint,actor:'Jamie Chen · QA reviewer',reason:'Accepted for the fictional candidate demonstration.' }) });
  assert.equal(candidateCheck.findings.find((finding) => finding.id === candidateHigh.id).status,'waived');
  candidateCheck = await request('/api/coherence-checks',{ method:'POST',body:JSON.stringify({ scope:{ kind:'candidate',changeId:change.id },actor:'Jamie Chen · QA reviewer' }) });
  assert.equal(candidateCheck.findings.find((finding) => finding.id === candidateHigh.id).status,'waived');
  await expectStatus(`/api/changes/${change.id}/draft-updates`,409,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author' }) });

  let reviewed = analysed;
  if (scenarioId === 'SCN-002') {
    await expectStatus(`/api/changes/${change.id}/guided-review-completion`,409,{ method:'POST',body:JSON.stringify({ actor:'Jamie Chen · QA reviewer',confirmation:true }) });
    const req004 = analysed.suggestions.find((suggestion) => suggestion.targetId === 'REQ-004');
    const test007 = analysed.suggestions.find((suggestion) => suggestion.targetId === 'TEST-007');
    const un004 = analysed.suggestions.find((suggestion) => suggestion.targetId === 'UN-004');
    assert.ok(req004 && test007 && un004);
    reviewed = await request(`/api/suggestions/${req004.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:'accepted',reason:'The timing requirement is the controlled anchor for this change.',actor:'Jamie Chen · QA reviewer' }) });
    reviewed = await request(`/api/suggestions/${test007.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:'rejected',reason:'Demonstrate retained decision history before correcting the scope.',actor:'Jamie Chen · QA reviewer' }) });
    reviewed = await request(`/api/suggestions/${test007.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:'accepted',reason:'Workflow validation must cover the revised result window.',actor:'Jamie Chen · QA reviewer' }) });
    reviewed = await request(`/api/suggestions/${un004.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:'edited',editedAction:'update',reason:'The user need contains the old timing expectation and needs controlled revision.',actor:'Jamie Chen · QA reviewer' }) });
    reviewed = await request(`/api/changes/${change.id}/guided-review-completion`,{ method:'POST',body:JSON.stringify({ actor:'Jamie Chen · QA reviewer',confirmation:true }) });
    assert.equal(reviewed.audit.filter((event) => event.details?.references?.completionMode === 'guided_replay_fixture').length,8);
    assert.equal(reviewed.suggestions.filter((suggestion) => suggestion.decisionReason?.startsWith('Guided replay fixture:')).length,8);
    await expectStatus(`/api/changes/${change.id}/guided-review-completion`,409,{ method:'POST',body:JSON.stringify({ actor:'Jamie Chen · QA reviewer',confirmation:true }) });
  } else {
    for (const suggestion of analysed.suggestions) {
      let decision = 'accepted';
      let editedAction;
      if (scenarioId === 'SCN-001' && suggestion.targetId === 'UN-003') decision = 'rejected';
      if (scenarioId === 'SCN-001' && suggestion.targetId === 'CLM-002') { decision = 'edited';editedAction = 'new_link'; }
      reviewed = await request(`/api/suggestions/${suggestion.id}/decision`,{ method:'POST',body:JSON.stringify({ decision,editedAction,reason:`QA verification decision for ${suggestion.targetId}.`,actor:'Jamie Chen · QA reviewer' }) });
    }
  }
  assert.equal(reviewed.suggestions.every((suggestion) => suggestion.decision !== 'pending'),true);
  if (scenarioId === 'SCN-001') {
    const edited = reviewed.suggestions.find((suggestion) => suggestion.targetId === 'CLM-002');
    assert.equal(edited.action,'review');
    assert.equal(edited.effectiveAction,'new_link');
  }
  assert.equal((await request('/api/overview')).baseline.label,'RR-1.0');

  const drafted = await request(`/api/changes/${change.id}/draft-updates`,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author' }) });
  assert.equal(drafted.status,'updates_proposed');
  assert.equal(drafted.updates.length > 0,true);
  assert.equal(drafted.updates.every((update) => update.originalText === update.proposedText && update.draftOrigin === 'guided_replay_fixture'),true);
  assert.equal(drafted.updates.every((update) => !update.proposedText.includes('Proposed revision note')),true);
  assert.equal(drafted.coherence.stale,true);
  candidateCheck = await request('/api/coherence-checks',{ method:'POST',body:JSON.stringify({ scope:{ kind:'candidate',changeId:change.id },actor:'Alex Morgan · Author' }) });
  assert.equal(candidateCheck.stale,false);
  assert.equal(candidateCheck.findings.find((finding) => finding.id === candidateHigh.id).status,'waived');

  const editable = drafted.updates[0];
  const humanText = `${editable.proposedText}\nHuman-reviewed for the controlled candidate baseline.`;
  let editedDrafts = await request(`/api/updates/${editable.id}`,{ method:'PATCH',body:JSON.stringify({ operation:'save',actor:'Alex Morgan · Author',proposedText:humanText,reason:'Clarified by the author for the candidate baseline.' }) });
  const editedDraft = editedDrafts.updates.find((update) => update.id === editable.id);
  assert.equal(editedDraft.originalText,editable.originalText);
  assert.equal(editedDraft.proposedText,humanText);
  assert.equal(editedDraft.editedBy,'Alex Morgan · Author');
  assert.equal(editedDrafts.coherence.stale,true);

  if (scenarioId === 'SCN-002' && editedDrafts.updates.length > 1) {
    const discarded = editedDrafts.updates.at(-1);
    editedDrafts = await request(`/api/updates/${discarded.id}`,{ method:'PATCH',body:JSON.stringify({ operation:'discard',actor:'Alex Morgan · Author',reason:'QA scope is retained, but this candidate text needs separate authoring.' }) });
    assert.equal(editedDrafts.updates.find((update) => update.id === discarded.id).status,'discarded');
  }

  if (scenarioId === 'SCN-003') {
    const priorRunId = editedDrafts.run.id;
    let reopened = await request(`/api/changes/${change.id}/reopen-analysis`,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author',mode:'replay',reason:'The author identified a material scope question.' }) });
    assert.notEqual(reopened.run.id,priorRunId);
    assert.equal(reopened.analysisHistory.find((run) => run.id === priorRunId).status,'superseded');
    assert.equal(reopened.suggestions.every((suggestion) => suggestion.decision === 'pending'),true);
    assert.equal(reopened.updates.filter((update) => update.analysisRunId === priorRunId).every((update) => update.status === 'superseded'),true);
    for (const suggestion of reopened.suggestions) reopened = await request(`/api/suggestions/${suggestion.id}/decision`,{ method:'POST',body:JSON.stringify({ decision:'accepted',reason:`Fresh QA decision for ${suggestion.targetId}.`,actor:'Jamie Chen · QA reviewer' }) });
    editedDrafts = await request(`/api/changes/${change.id}/draft-updates`,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author' }) });
  }

  let submitted = await request(`/api/changes/${change.id}/submit`,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author' }) });
  assert.equal(submitted.status,'qa_review');
  if (scenarioId === 'SCN-001') {
    const retainedRunId = submitted.run.id;
    const retainedDraftIds = submitted.updates.filter((update) => update.status === 'proposed').map((update) => update.id);
    await expectStatus(`/api/changes/${change.id}/return-to-author`,400,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author',reason:'Authors cannot return QA work.' }) });
    let returned = await request(`/api/changes/${change.id}/return-to-author`,{ method:'POST',body:JSON.stringify({ actor:'Jamie Chen · QA reviewer',reason:'Clarify one retained candidate before approval.' }) });
    assert.equal(returned.status,'returned_to_author');
    assert.equal(returned.run.id,retainedRunId);
    assert.deepEqual(returned.updates.filter((update) => update.status === 'proposed').map((update) => update.id),retainedDraftIds);
    const restorable = returned.updates.find((update) => update.status === 'proposed');
    returned = await request(`/api/updates/${restorable.id}`,{ method:'PATCH',body:JSON.stringify({ operation:'discard',actor:'Alex Morgan · Author',reason:'Exercise the reversible returned-author draft path.' }) });
    assert.equal(returned.updates.find((update) => update.id === restorable.id).status,'discarded');
    returned = await request(`/api/updates/${restorable.id}`,{ method:'PATCH',body:JSON.stringify({ operation:'restore',actor:'Alex Morgan · Author',reason:'Retain the candidate after author review.' }) });
    assert.equal(returned.updates.find((update) => update.id === restorable.id).status,'proposed');
    if (!process.env.OPENAI_API_KEY) {
      const failedReanalysis = await request(`/api/changes/${change.id}/reopen-analysis`,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author',mode:'live',reason:'Exercise failed reanalysis recovery.' }) });
      assert.equal(failedReanalysis.status,'returned_to_author');
      assert.equal(failedReanalysis.run.id,retainedRunId);
      assert.equal(failedReanalysis.analysisHistory[0].status,'failed');
      assert.equal(failedReanalysis.updates.filter((update) => update.status === 'proposed').length > 0,true);
    }
    submitted = await request(`/api/changes/${change.id}/submit`,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author' }) });
    assert.equal(submitted.status,'qa_review');
  }
  assert.equal((await request('/api/overview')).baseline.label,'RR-1.0');
  const beforeApprovalEvidence = await request(`/api/evidence/${scenario.anchorId}`);
  assert.equal(beforeApprovalEvidence.item.version,'1.0');

  await expectStatus(`/api/changes/${change.id}/approve`,400,{ method:'POST',body:JSON.stringify({ actor:'Alex Morgan · Author',confirmation:true }) });
  const approved = await request(`/api/changes/${change.id}/approve`,{ method:'POST',body:JSON.stringify({ actor:'Jamie Chen · QA reviewer',confirmation:true }) });
  assert.equal(approved.change.status,'approved');
  assert.equal(approved.change.audit.some((event) => event.action === 'baseline_approved'),true);
  assert.equal(approved.change.audit.some((event) => event.action === 'returned_to_author'),scenarioId === 'SCN-001');
  assert.equal(approved.change.audit.filter((event) => event.action.startsWith('suggestion_')).every((event) => event.details.changes.some((change) => change.field === 'decision')),true);
  const reopenedStored = await request(`/api/changes/${change.id}`);
  assert.equal(reopenedStored.status,'approved');
  assert.equal((await request('/api/changes?limit=20')).changes[0].id,change.id);
  const afterOverview = await request('/api/overview');
  assert.equal(afterOverview.baseline.label,'RR-1.1');
  assert.equal(afterOverview.relationshipCount,118);
  if (scenarioId === 'SCN-002') assert.match(afterOverview.issues.find((issue) => issue.code === 'VAL-022').actual,/REQ-004 states 60 seconds, CLM-003 states 30 seconds, and LBL-002 states 60 seconds/);

  const afterEvidence = await request(`/api/evidence/${scenario.anchorId}`);
  assert.equal(afterEvidence.item.version,'1.1');
  const oldSnapshot = await request(`/api/documents/${documentId}?baselineId=BL-RR-1.0`);
  const newSnapshot = await request(`/api/documents/${documentId}?baselineId=${encodeURIComponent(approved.baselineId)}`);
  assert.notEqual(oldSnapshot.snapshotId,newSnapshot.snapshotId);
  assert.equal(oldSnapshot.sourceVersionIds.includes(`${scenario.anchorId}-v1.0`),true);
  assert.equal(newSnapshot.sourceVersionIds.includes(afterEvidence.item.versionId),true);
  assert.equal(oldSnapshot.items.find((item) => item.id === scenario.anchorId).version,'1.0');
  assert.equal(newSnapshot.items.find((item) => item.id === scenario.anchorId).version,'1.1');

  const evaluation = await request(`/api/evaluations/${scenarioId}?runId=${analysed.run.id}`);
  assert.equal(evaluation.selectedRun.id,analysed.run.id);
  assert.equal(evaluation.groundTruth.locked,true);
  assert.ok(evaluation.calculated);
  assert.equal(evaluation.calculated.criticalRecall,100);
  assert.equal(Number.isInteger(evaluation.calculated.reviewSeconds),true);
  summaries.push({ scenarioId,changeId:change.id,suggestions:analysed.suggestions.length,updates:drafted.updates.length,calculated:evaluation.calculated });
}

const restored = await request('/api/reset',{ method:'POST' });
assert.equal(restored.baseline.label,'RR-1.0');
assert.equal(restored.relationshipCount,118);
assert.deepEqual(restored.checkSummary,{ total:6,high:1,deterministic:3,fixtures:3,waived:0 });

console.log(JSON.stringify({ verified:summaries,restoredBaseline:restored.baseline.label },null,2));
