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

Replay mode works without an API key. To run live analysis, copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`. The server sends only the fictional candidate evidence to the API.

## Run a demonstration

For the rehearsed 10–12 minute internal QA/RA path, select **Start guided walkthrough** in the sidebar. The walkthrough highlights each target, waits for required workflow state, and keeps every controlled action under the presenter's control. Its restart action offers a workspace reset instead of changing server-backed workflow state silently.

The shareable companion is the eight-page [Phase 1.5 walkthrough PDF](output/pdf/rhythmreview_phase_1_5_walkthrough.pdf). The detailed rehearsal reference remains [the presenter script](docs/presenter-script.md).

The unguided workflow is:

1. Open **Change workspace**.
2. Select a scenario.
3. Create the controlled change as Alex Morgan, the author.
4. Load the saved replay fixture or run live OpenAI analysis.
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
npm run build
```

`verify:demo` walks all three scenarios. For the timing scenario it follows the exact guided path, including the three required manual examples, pending-only guided completion, fixture provenance, retained rejection history, separate approval, RR-1.0/RR-1.1 comparison, and reset. It also checks recent-change ordering, replay paths, live no-key failure recovery, return/edit/restore/resubmit, successful reanalysis, immutable superseded history, detailed audit values, baseline and candidate checks, exact-fingerprint waiver carry-forward, stale candidate results, and selected-run evaluation.

## Regenerate controlled data

Run `npm run seed:generate` after you edit `scripts/generate-seed.mjs`. The generator must report 72 evidence items, 118 relationships, 10 documents, and 3 scenarios.

After you change `db/schema.ts`, run both commands:

```sh
npm run db:generate
npm run db:embed
```

The second command embeds the generated migration in the local runtime initializer.

## Project boundary

Version one has one fictional product, immutable approved baselines, separately stored candidate work, and simulated author and QA identities. The simulated roles provide no identity assurance. It has no eQMS, Jira, Git, Word, or submission integration. Replay output is a saved fixture, not a live model call. The internal evaluation page calculates structured-run results against a locked provisional answer key. Manual and document-chat values remain illustrative fixtures.

See [the demo charter](docs/demo-charter.md), [the evaluation protocol](docs/evaluation-protocol.md), and [the presenter script](docs/presenter-script.md).
