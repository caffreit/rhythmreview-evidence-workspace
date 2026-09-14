# RhythmReview Evidence Workspace

This local prototype tests whether linked evidence plus AI can help a QA or regulatory reviewer assess a SaMD change. The data is fictional. The application does not approve evidence on behalf of a person.

## Run the workspace

1. Install the dependencies.

   ```sh
   npm install
   ```

2. Start the local application.

   ```sh
   npm run dev
   ```

3. Open the local address shown in the terminal. The default is `http://localhost:3000`.

Replay mode works without an API key. To run live analysis, copy `.env.example` to `.env.local` and set `OPENROUTER_API_KEY`. The server uses OpenRouter's OpenAI-compatible API and sends only fictional source or candidate evidence. The default models are `openai/gpt-5.6-luna` for analysis and `openai/text-embedding-3-small` for semantic retrieval. A failed live run creates no AI-derived work. Retry live processing or choose saved replay explicitly.

## Run a demonstration

For the rehearsed 10–12 minute internal QA/RA path, select **Start guided walkthrough** in the sidebar. The walkthrough highlights each target, waits for required workflow state, and keeps every controlled action under the presenter's control. Its restart action offers a workspace reset instead of changing server-backed workflow state silently.

The shareable companion is the eight-page [Phase 1.5 walkthrough PDF](output/pdf/rhythmreview_phase_1_5_walkthrough.pdf). The detailed rehearsal reference remains [the presenter script](docs/presenter-script.md).

The unguided workflow is:

1. Open **Change workspace**.
2. Select a scenario.
3. Create the controlled change as Alex Morgan, the author.
4. Load the saved replay fixture or run live OpenRouter analysis.
5. Select the role control in the header to switch to Jamie Chen, the QA reviewer.
6. Accept, reject, or edit each impact suggestion and record a reason.
7. Switch to the author and create, edit, or discard candidate versions.
8. Run projected-candidate coherence checks. QA may waive an unchanged finding with a reason; an author cannot waive it.
9. Send the candidate baseline to QA. QA can return it with a reason, after which the author can edit, restore, or resubmit retained drafts.
10. Reopen analysis when the impact scope needs to be recalculated. A successful run supersedes the prior run, decisions, and drafts without deleting them; a failed run restores the prior state.
11. Expand **Audit history** to inspect actors, reasons, references, and old/new values.
12. Switch to the QA reviewer and approve the new immutable baseline, or reopen an already stored approved change in read-only mode.
13. Select **Reset workspace** before the next demonstration.

## Verify the implementation

Keep the local application running, then run:

```sh
npm test
npx tsc --noEmit
npm run lint
npm run verify:demo
npm run verify:source
npm run verify:traceability
npm run verify:readiness
npm run verify:final-release
npm run build
```

`verify:demo` walks all three scenarios. For the timing scenario it follows the exact guided path, including the three required manual examples, pending-only guided completion, fixture provenance, retained rejection history, separate approval, RR-1.0/RR-1.1 comparison, and reset. It also checks recent-change ordering, replay paths, live no-key failure recovery, return/edit/restore/resubmit, successful reanalysis, immutable superseded history, detailed audit values, baseline and candidate checks, exact-fingerprint waiver carry-forward, stale candidate results, and selected-run evaluation.

`verify:source` checks the source-to-baseline workflow against a server started without an available OpenRouter key. It proves that a failed live run creates no replay records, then completes the same path through explicitly selected replay output. Keep the key unavailable to that server process for this check; local environment files may otherwise take precedence over a shell override.

`verify:traceability` exercises the controlled relationship lifecycle. It proves deterministic projection, revision-bound QA authority, close-without-baseline, stale-baseline conflict handling, and byte-for-byte preservation of the prior relationship rows, then resets the workspace.

`verify:readiness` exercises WP-20A from reset through an editable three-plan package, revision-bound QA review, a 75-item/125-link baseline, explicit planned-release creation, nine fictional executions and QA decisions, failed and rejected reruns, stale-run protection, the QA-only `verification_ready` transition, frozen records, historical inspection, and final reset.

`verify:final-release` carries that fixture through WP-20B. It covers eight release-scoped residual-risk records, rejected and replacement revisions, benefit-risk support, immutable R2 attachments, invalid and replaced CI imports, QA decisions, both simulated attestations, final-policy staleness, release-approver authority, the immutable `release_approved` transition, attachment download, audit history, and D1/R2 reset cleanup.

With the local server running and `.env.local` configured, run `npm run verify:live` for the opt-in OpenRouter smoke test. This command makes paid external calls with fictional data and is never part of the ordinary test suite.

## Regenerate controlled data

Run `npm run seed:generate` after you edit `scripts/generate-seed.mjs`. The generator must report 72 evidence items, 122 relationships, 10 documents, and 3 scenarios.

After you change `db/schema.ts`, run both commands:

```sh
npm run db:generate
npm run db:embed
```

The second command embeds the generated migration in the local runtime initializer.

## Project boundary

Version one has one fictional product, immutable approved baselines, separately stored candidate work, explicit releases, and three simulated actors. The roles provide no identity assurance. WP-20B stores hashed attachments and can verify a manually imported `ci-evidence-v1` bundle emitted by a real GitHub Actions run, but BlueBridge has no live GitHub connector and does not independently authenticate that run. Product content, verification records, attestations, and approval remain fictional. `verification_ready` means only “Verification ready under release-readiness-v1”; `release_approved` is displayed as “Fictional release approved.” Neither state claims deployment, production readiness, a compliant electronic signature, or regulatory compliance. The prototype still has no eQMS, Jira, Word, patient data, submission integration, authenticated identity, or production validation.

See [the demo charter](docs/demo-charter.md), [the evaluation protocol](docs/evaluation-protocol.md), and [the presenter script](docs/presenter-script.md).

Current delivery status and completion gates are in [the delivery plan](docs/delivery-plan.md).

Controlled traceability authoring and the interactive neighborhood graph are implemented under `relationship-policy-v1.0`. Matrix, Graph, Coverage, candidate validation, and approval share one deterministic projection. The graph distinguishes controlled, proposed, rejected, and review-only relationships without counting review history as candidate traceability. The curated `RR-1.0` fixture has 122 policy-conforming links and four honest versioned coverage gaps, including the intentionally open `RC-005` verification gap. See [the controlled prototype relationship and coverage policy](docs/relationship-policy.md).
