# Demo charter

## Decision to test

Test whether a structured evidence model helps a QA or regulatory reviewer identify the consequences of a proposed SaMD change. The useful result is a smaller, cited review set with no missed critical impact.

## Product case

RhythmReview is a fictional clinician-facing application. It analyses a 30-second single-lead ECG and returns Possible AF, No AF detected, or Unreadable recording. Its approved population is adults aged 22 and over. A clinician reviews every result.

The baseline contains 72 evidence items, 118 relationships, and 10 generated document views. The overview reports six deliberate coherence findings. Three come from deterministic structural checks. Three remain labelled evaluation fixtures.

## Human authority

Alex Morgan authors changes and candidate evidence. Jamie Chen reviews impact suggestions and approves candidate baselines. The application blocks approval by the author.

AI can classify potential impacts and draft candidate text. AI cannot change the approved baseline, accept its own suggestions, or record an approval.

## Included work

- Browse evidence, versions, and direct relationships with provisional upstream and downstream labels.
- Render 10 familiar documents from evidence versions.
- Create a change against a selected evidence item.
- Run deterministic relationship traversal.
- Add unlinked semantic candidates and structured AI reasoning in live mode.
- Load saved suggestion and draft fixtures in replay mode without an API key.
- Record accepted and rejected suggestions.
- Draft, edit, discard, restore, and resubmit candidate evidence versions.
- Return submitted candidates to the author with a reason, or reopen analysis while preserving superseded history.
- Run persisted baseline and projected-candidate coherence checks; record QA waivers without treating a still-failing rule as resolved.
- Approve a separate baseline as the QA reviewer.
- Reopen stored changes and inspect detailed audit events with old/new values.
- Calculate a selected structured run against a locked provisional answer key and show separately labelled illustrative comparison fixtures.

## Excluded work

- Production quality-system records
- Patient or client data
- Electronic signatures or user authentication
- Word import or round-trip editing
- Regulatory submission generation
- Integrations with an eQMS, Jira, or Git
- Evidence that the AI is safe for unsupervised quality decisions

## Exit decision

Continue to a second phase only if all three scenarios have 100 percent critical-impact recall, at least 85 percent overall recall, and at least 70 percent actionable precision. Every recommendation must cite supplied evidence. Record review time, but do not trade a critical miss for speed.
