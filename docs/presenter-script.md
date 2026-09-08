# Present the RhythmReview demo

This script covers behaviour tested on 4 September 2026. Reset the workspace before the session.

## Set the context

Open **Overview**. Say that RhythmReview is fictional and the workspace contains no patient, client, or submission data.

Explain the counts:

- 72 evidence items belong to the active approved baseline.
- 118 direct relationships connect those items.
- 10 abbreviated document views group controlled evidence versions.
- Six open coherence findings include three deterministic structural checks and three seeded evaluation fixtures.

Do not call the six findings automated detections. Open `TRC-014` to show the calculated rule, expected state, actual state, and affected item. Select **Open RC-005 in evidence**.

## Show direct relationship direction

Open `REQ-004`, Maximum analysis time. Point to the full stored relationship statements. `UN-004` appears under upstream inputs and dependencies. `DES-004` and `TEST-004` appear under downstream implementations and effects.

Say that the direction mapping is provisional. Blue Bridge QA and RA must ratify the semantics for each relationship type.

## Show a document snapshot

Open **Documents** and select the Software requirements specification. Point to the baseline label, baseline status, approver, snapshot ID, and evidence version beside each entry.

Say that these are abbreviated evidence-grouped views, not submission-ready documents. The VVP and VVR intentionally include superseded `TEST-009`; both views show a warning and the overview reports the condition.

## Run the timing change

1. Open **Change workspace**.
2. Select **Extend analysis time**.
3. Compare the approved 30-second requirement with the human-authored 60-second proposal fixture.
4. Create the change as Alex Morgan.
5. Keep **Replay fixture** selected and choose **Load replay fixture**.
6. Say that replay loads saved structured output and makes no OpenAI call.
7. Compare a confirmed graph path with an **Unlinked semantic candidate**. The unlinked card states that no direct relationship is asserted.
8. Switch to Jamie Chen.
9. Accept one suggestion, reject another, and edit one proposed action. Record a specific QA reason for each decision.
10. Explain that a decision changes the controlled change scope only. It does not edit evidence.
11. Decide every remaining suggestion.
12. Switch to Alex Morgan and choose **Create candidate drafts**.
13. Point to the approved text, immutable original replay draft, editable author candidate, and provenance label.
14. Edit one candidate and discard another. Record a reason for both actions.
15. Send the retained candidates to QA.
16. Point to the header. RR-1.0 remains the active approved baseline.
17. Switch to Jamie Chen and approve RR-1.1.
18. Open the audit history and identify the separate author, system, and QA events.

The step buttons return to earlier sections without deleting audit history.

## Compare document baselines

After approval, open **Documents**. The current view opens RR-1.1. Use the baseline selector to open RR-1.0. The two snapshots have different IDs and source-version lists.

Do not say that RR-1.0 was deleted. It remains an immutable historical baseline with status `superseded` after RR-1.1 approval.

## Show internal evaluation separately

Open **Internal evaluation**. Say that this page is an internal validation workflow, not part of the routine customer compliance workflow.

Select the stored run. The application calculates critical recall, overall recall, actionable precision, corrections, review count, accepted count, and elapsed review time from that run and the latest QA decisions. The answer key is locked in the interface but still provisional.

The manual and document-chat rows are labelled illustrative fixtures. Replay suggestions were authored from the same provisional answer key, so replay scores demonstrate calculation mechanics, not model performance.

## Close the demonstration

Reset the workspace. Confirm that the header returns to RR-1.0.

Close with this statement: the prototype tests whether structured evidence and AI-assisted suggestions can help a reviewer maintain compliance coherence. It does not test whether AI can replace the reviewer.

## Disclosures for questions

- Live OpenAI impact analysis requires an API key. This cleanup tested the no-key failure and replay recovery path, not a successful live call.
- The draft endpoint does not call OpenAI. Guided replay drafts are curated fixtures, and custom or live workflows receive an author drafting template.
- The provisional answer keys need QA and RA review. Scenario 2 omits the 30-second claim in `CLM-003`. Scenario 3 omits the adult age limit in `LBL-004` and may assign the wrong action to `REQ-001`.
- The simulated roles demonstrate separation of duties but do not authenticate identity or provide electronic signatures.
- The prototype does not include an eQMS, SharePoint, Jira, Git, Word round trip, or submission generation.
