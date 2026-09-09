# Walkthrough findings

This log records the implementation audit completed on 4 September 2026 and the Phase 1.5 verification completed on 8 September 2026. Each original finding was checked against the application, the local database, and generated document views. The final pass ran all three scenarios from reset through QA approval with `npm run verify:demo`. The 15-step guided browser walkthrough also covered target recovery, finding navigation, factual relationship direction, replay review, retained rejection history, action editing, guided pending-decision completion, draft editing, role gates, approval, audit history, historical document selection, and reset.

## 1. Must fix before an internal Blue Bridge showcase

### Resolved

| ID | Verified finding | Resolution and check |
| --- | --- | --- |
| WF-001 | Evidence relationships did not show direction. | The evidence detail now groups factual incoming and outgoing relationships and prints the stored source, type, and target. `REQ-004` is clearly identified as the stored target for incoming links and the stored source for outgoing links. Controlled dependency meaning remains an explicit QA/RA question. |
| WF-002 | Replay and UI records implied direct links that did not exist. | The seed generator now stores real graph paths for linked suggestions. Semantic candidates store only the candidate ID and display **No direct relationship asserted**. The verifier checks every graph-path edge against a stored relationship. |
| WF-003 | Six authored defects appeared to be automated detections. | The UI now separates three calculated findings from three seeded evaluation fixtures. The calculated rules cover a missing verification link, superseded evidence in current document views, and a design component absent from the component inventory. Reset reproduces the findings from stored evidence, relationships, and document rules. |
| WF-004 | Document metadata always used RR-1.0 and one fixed snapshot ID. | Rendering now resolves a selected approved or historical baseline through `baseline_items`. Each document and baseline pair has one immutable snapshot and exact source-version list. The verifier opens distinct RR-1.0 and RR-1.1 snapshots after every scenario. |
| WF-005 | Disabled role-restricted actions looked broken. | Each disabled action now states whether the presenter must switch to Author or QA reviewer. Server routes also validate the simulated actor for drafting, submission, and approval. |
| WF-006 | Replay rationales were generic. | Every replay suggestion now has a scenario-specific rationale. `TEST-005` states that copy verification must be rerun against the new approved wording and review prompt. |
| WF-007 | Accepting an impact could sound like approving generated wording. | The review stage now says that acceptance adds an evidence ID and action to the controlled change scope. It does not edit or approve evidence. Candidate versions and approved evidence use separate sections and records. |
| WF-008 | QA could not edit an impact action. | QA can accept, reject, or accept with an edited action and must record a reason. The stored suggestion keeps the original action. Review decisions and audit events preserve each human correction. |
| WF-009 | Non-anchor draft updates were placeholders. | All three guided replay scenarios now contain item-specific draft fixtures for every seeded `update` and `retest` action. The UI labels them as guided replay fixtures, not live AI output. Custom and live drafting remains an author template and is not presented as AI drafting. |
| WF-010 | The author could not edit or discard a proposed version. | The author can edit, save, or discard each candidate version before QA submission. The database preserves the immutable original draft, current candidate text, source, actor, reason, and time. |
| WF-011 | Evaluation metrics were scenario fixtures rather than selected-run calculations. | The internal evaluation page selects a stored completed run and calculates critical recall, overall recall, actionable precision, corrections, review count, accepted count, and elapsed review time from stored suggestions, latest QA decisions, and the locked provisional answer key. Manual and document-chat values remain visibly labelled fixtures. |
| WF-012 | The workflow stepper was display-only. | Each available step is now a navigation button that returns to the retained proposal, analysis, review, draft, or approval section without rewriting history. A formal return-to-author transition remains open as WF-026. |
| WF-013 | The overview displayed an unexplained fixed score of 92. | The score was removed. The overview shows three deterministic findings, three fixtures, one high-severity finding, and no composite score. |
| WF-014 | Coherence findings could not open affected evidence. | Each finding now shows its basis, rule, expected state, actual state, and affected evidence ID. The action opens that item in the evidence browser. |
| WF-015 | Edited suggestions overwrote the original replay or AI action. | `impact_suggestions.action` now remains the original output. The latest human action is read from `review_decisions` as the effective action. Both values appear after an edit. |
| WF-016 | State transitions were enforced mainly by hidden or disabled controls. | The repository now gates analysis, suggestion decisions, drafting, submission, draft edits, and approval by the persisted change state. Drafting requires every suggestion to have a QA decision. Approval requires a submitted candidate with at least one retained version. |
| WF-017 | A failed live run saved deterministic fallback suggestions under a failed live-AI record and then blocked retry. | A failed live call now stores a failed run with no suggestions, returns the change to `draft`, and tells the presenter to use replay. Failed attempts remain in analysis and audit history. Replay then runs without an API key. |
| WF-018 | Approval could leave the active baseline partly changed if a multi-batch write failed. | Approval first stages a candidate baseline, proposed evidence versions, baseline membership, and copied relationships. The final database batch approves the versions, changes current pointers, supersedes RR-1.0, approves the new baseline, and marks the change approved. RR-1.0 remains active until that final batch succeeds. |
| WF-019 | New baselines retained relationships labelled as belonging to RR-1.0. | Approval now copies the 118 relationship records into the new baseline. The overview and evidence browser resolve relationships only from the active baseline. |
| WF-020 | Reset could leave stale fixture definitions after the seed generator changed. | Reset removes transactional records and post-RR-1.0 records, restores RR-1.0 pointers, and refreshes scenario and replay fixture content from `seed.json`. It does not delete and rebuild the controlled seed tables. |
| WF-023 | The customer change workspace exposed critical flags derived from the internal answer key. | Answer-key counts and critical badges were removed from the change workspace. Live suggestions use evidence criticality internally rather than the evaluation answer key. Critical-impact recall appears only in the internal evaluation page. |
| WF-024 | Audit history was stored but not visible, and submit had no audit event. | The change workspace now shows change, analysis, decision, draft, submission, and approval events. Submission, draft edit, and draft discard actions create audit records. |
| WF-026 | QA could not return a submitted candidate, and the author could not explicitly repeat analysis. | QA can return a candidate with a required reason. The author can edit, discard, restore, and resubmit retained drafts. Reanalysis creates a new current run on success and retains superseded runs, suggestions, decisions, and drafts. A failed reanalysis restores the prior workflow state and current work. |
| WF-027 | Audit entries omitted structured details and repeated-decision history. | Mutations now append versioned aggregate audit events with actors, reasons, references, and full old/new values. The interface renders expandable comparisons and retains a readable fallback for earlier events. |
| WF-030 | Completed changes disappeared from the interface after leaving the page. | The change workspace lists recent changes by update time and restores their scenario, workflow stage, analysis history, drafts, findings, and audit history. Approved changes reopen read-only. |
| WF-031 | Coherence findings had no controlled rerun or disposition workflow. | Baseline and projected-candidate checks are persisted. Candidate edits make results stale; exact fingerprints carry QA waivers across reruns; changed failures invalidate waivers; and findings resolve only when a later deterministic run no longer detects them. |
| WF-025 | Upstream and downstream labels implied unratified dependency semantics. | The interface now uses neutral incoming and outgoing groups derived directly from stored source and target direction. It states that controlled dependency semantics still require QA/RA ratification. |
| WF-028 | Fast reviews displayed as `0.0` minutes. | Calculated evaluation results now include `reviewSeconds`; the interface displays seconds below one minute and retains `reviewMinutes` for compatibility and comparisons. Boundary tests cover 0, 1, 59, 60, and more than 60 seconds. |
| WF-029 | Baseline changes had no local loading state. | The document viewer retains the current snapshot during loading, disables repeat selection, reports failures in place, and ignores stale responses during rapid changes. |

### Open QA and RA decisions

| ID | Finding | Options and current treatment |
| --- | --- | --- |
| WF-021 | The provisional answer keys contain questionable omissions and actions. Scenario 2 omits `CLM-003`, although its claim still promises a result within 30 seconds. Scenario 3 omits `LBL-004`, although that label says “adults aged 22 and over.” Scenario 3 also assigns `update` to `REQ-001` by evidence type even though the recording-duration statement has no age limit. | QA and RA should add the omitted items and revise the action for `REQ-001`, or document why the current entries are correct. The implementation does not change the locked provisional answer key without that judgment. |
| WF-022 | Replay suggestions are authored from the same provisional answer key used to score the run. A complete accepted replay therefore reaches 100 percent by construction. | Use replay to demonstrate workflow mechanics and calculation only. Do not present replay scores as model performance. A valid evaluation needs answer keys authored blind to model or replay output and separately recorded model runs. |
| QA/RA-REL | Controlled dependency semantics remain undefined for relationship types including `MAY_AFFECT`, `SUPPORTED_BY`, and `DISCLOSED_IN`. | Ratify and version a relationship policy before interpreting incoming and outgoing storage direction as regulatory or engineering dependency direction. |

## 2. Phase 1.5 presentation package

- A persistent, accessible 15-step walkthrough uses stable targets, viewport-aware callouts, keyboard controls, state gates, and asynchronous target recovery.
- The SCN-002 guided helper requires Jamie Chen, the correct replay workflow state, and the three manual examples. It fills pending decisions only and records a guided replay fixture reason plus structured audit provenance.
- The eight-page landscape PDF matches walkthrough step numbers and includes speaker notes, boundaries, reset instructions, evaluation cautions, open questions, and the Phase 2 roadmap.
- The fixture-backed Jira adapter is positioned after Phase 2. Live Jira remains outside Phase 1.5.

## 3. Later product work

- Replace provisional answer keys with independently authored and second-reviewed ground truth.
- Define controlled relationship semantics and a versioned relationship policy.
- Add database foreign keys and a production migration ledger.
- Define concurrency policy for multiple simultaneous candidate changes.
- Define whether QA can edit candidate evidence or must always return it to the author.
- Add durable job handling for long live-model calls, retries, cancellation, and service restarts.
- Add phase-2 release gates and candidate relationship editing; passing gates must remain separate from QA approval.
- Decide how evidence baselines and document snapshots map to Blue Bridge document-control procedures.
- Validate prompts, models, retrieval settings, and human-use controls before any production claim.

## 4. Explicitly out of scope for this demo

- An eQMS or electronic-signature system
- Production authentication and organisation role management
- SharePoint, Jira, Git, Word, or submission-system integration
- Word round-trip editing and submission generation
- Patient, client, or production product data
- Unsupervised regulatory, quality, clinical, or approval decisions

The simulated Author and QA reviewer roles demonstrate separation of duties. They do not provide identity assurance.

## Verified limitations

- The ten document views are abbreviated groups of evidence items, not submission-ready controlled documents.
- `TEST-009` is intentionally superseded but included by both VVP and VVR. The UI now warns about it and the deterministic check reports both views. The demo does not silently remove the fixture.
- Three coherence findings remain human-authored fixtures because the current model does not represent structured timing values, claim strength, or review dates. The timing fixture reads the current statements and reports their current values, but the rule and item selection remain authored for the evaluation pack.
- Replay loads saved structured output and curated drafts without calling OpenAI. Live analysis was tested only for its no-key failure path in this cleanup pass.
- Live analysis provides AI-assisted impact classification. The current draft endpoint does not call OpenAI and must not be presented as live AI drafting.
- The internal evaluation page calculates the selected structured run. Its manual and document-chat comparisons are illustrative fixtures.
