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
npm run build
```

`verify:demo` walks all three scenarios. For the timing scenario it follows the exact guided path, including the three required manual examples, pending-only guided completion, fixture provenance, retained rejection history, separate approval, RR-1.0/RR-1.1 comparison, and reset. It also checks recent-change ordering, replay paths, live no-key failure recovery, return/edit/restore/resubmit, successful reanalysis, immutable superseded history, detailed audit values, baseline and candidate checks, exact-fingerprint waiver carry-forward, stale candidate results, and selected-run evaluation.

`verify:source` checks the source-to-baseline workflow against a server started without an available OpenRouter key. It proves that a failed live run creates no replay records, then completes the same path through explicitly selected replay output. Keep the key unavailable to that server process for this check; local environment files may otherwise take precedence over a shell override.

`verify:traceability` exercises the controlled relationship lifecycle. It proves deterministic projection, revision-bound QA authority, close-without-baseline, stale-baseline conflict handling, and byte-for-byte preservation of the prior relationship rows, then resets the workspace.

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

Version one has one fictional product, immutable approved baselines, separately stored candidate work, and simulated author and QA identities. The simulated roles provide no identity assurance. It has no eQMS, Jira, Git, Word, or submission integration. Replay output is a saved fixture, not a live model call. The internal evaluation page calculates structured-run results against a locked provisional answer key. Manual and document-chat values remain illustrative fixtures.

See [the demo charter](docs/demo-charter.md), [the evaluation protocol](docs/evaluation-protocol.md), and [the presenter script](docs/presenter-script.md).

Current delivery status and completion gates are in [the delivery plan](docs/delivery-plan.md).

Controlled traceability authoring is implemented under `relationship-policy-v1.0`. Matrix, Coverage, candidate validation, and approval share one deterministic projection. The curated `RR-1.0` fixture has 122 policy-conforming links and four honest versioned coverage gaps, including the intentionally open `RC-005` verification gap. The interactive graph remains WP-10B. See [the controlled prototype relationship and coverage policy](docs/relationship-policy.md).
