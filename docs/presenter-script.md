# Present the RhythmReview demo

This script covers the phase 1.5 guided demonstration. Reset the workspace before the session, or use **Restart** and then **Reset and restart** in the walkthrough.

## Use the guided walkthrough

Select **Start guided walkthrough** in the lower-left corner. The walkthrough moves to the correct workspace and highlights the next control. **Next** remains unavailable until each required action succeeds.

Use **Pause** to inspect the workspace without losing your place. Use **Restart** to restart only the instructions or restore RR-1.0 and restart from a clean workspace.

## Set the context

Open **Overview**. Say that RhythmReview is fictional and the workspace contains no patient, client, or submission data.

Explain the counts:

- 72 evidence items belong to the active approved baseline.
- 118 direct relationships connect those items.
- 10 abbreviated document views group controlled evidence versions.
- Six open coherence findings include three deterministic structural checks and three seeded evaluation fixtures.

Do not call the six findings automated detections. Open `TRC-014` to show the calculated rule, expected state, actual state, and affected item. Select **Open RC-005 in evidence**.

## Show stored relationship direction

Open `REQ-004`, Maximum analysis time. Point to the full stored relationship statements. The interface groups links by whether `REQ-004` is the saved source or target.

Say that incoming and outgoing describe storage direction only. Blue Bridge QA and regulatory reviewers must still ratify the dependency semantics for each relationship type.

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
9. Accept `REQ-004`. Record that the timing requirement is the controlled anchor for the change.
10. Reject `TEST-007`, then revise the decision to accept it. Explain that the reversal is deliberate and proves that decision history is retained.
11. Accept `UN-004` with an edited action of **update**. Record that the user need contains the old timing expectation.
12. Select **Apply remaining fixture decisions**. Explain that the helper records only pending replay decisions and labels each audit event as a guided fixture.
13. Explain that a decision changes the controlled change scope only. It does not edit evidence.
14. Switch to Alex Morgan and choose **Create candidate drafts**.
15. Point to the approved text, immutable original replay draft, editable author candidate, and provenance label.
16. Edit the `REQ-004` candidate and record a reason.
17. Rerun the projected candidate checks.
18. Send the retained candidates to QA.
19. Point to the header. RR-1.0 remains the active approved baseline.
20. Switch to Jamie Chen and approve RR-1.1.
21. Open one audit event and identify its actor, reason, references, and old and new values.

The step buttons return to earlier sections without deleting audit history.

## Compare document baselines

After approval, open **Documents**. The current view opens RR-1.1. Use the baseline selector to open RR-1.0. The two snapshots have different IDs and source-version lists.

Do not say that RR-1.0 was deleted. It remains an immutable historical baseline with status `superseded` after RR-1.1 approval.

## Treat internal evaluation as an appendix

Do not include **Internal evaluation** in the main walkthrough. Open it only when a reviewer asks how the prototype calculates evaluation measures.

Select the stored run. The application calculates critical recall, overall recall, actionable precision, corrections, review count, accepted count, and elapsed review time from that run and the latest QA decisions. The answer key is locked in the interface but still provisional.

The warning at the top states that replay scores are not model-performance evidence. Replay suggestions were authored from the same provisional answer key, so the page demonstrates calculation mechanics only.

## Close the demonstration

Reset the workspace. Confirm that the header returns to RR-1.0.

Close with this statement: the prototype tests whether structured evidence and AI-assisted suggestions can help a reviewer maintain compliance coherence. It does not test whether AI can replace the reviewer.

## Disclosures for questions

- Live OpenAI impact analysis requires an API key. This cleanup tested the no-key failure and replay recovery path, not a successful live call.
- The draft endpoint does not call OpenAI. Guided replay drafts are curated fixtures, and custom or live workflows receive an author drafting template.
- The provisional answer keys need QA and RA review. Scenario 2 omits the 30-second claim in `CLM-003`. Scenario 3 omits the adult age limit in `LBL-004` and may assign the wrong action to `REQ-001`.
- The simulated roles demonstrate separation of duties but do not authenticate identity or provide electronic signatures.
- The prototype does not include an eQMS, SharePoint, Jira, Git, Word round trip, or submission generation.
