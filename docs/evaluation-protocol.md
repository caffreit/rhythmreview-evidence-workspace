# Evaluate the change-impact workflow

## Prepare the answer key

1. Give one QA or regulatory specialist the approved RR-1.0 evidence pack.
2. Hide all AI and replay results.
3. Ask the specialist to record each item that needs review, update, retest, or a new link for each scenario.
4. Mark every safety-critical expected impact.
5. Ask a second specialist to check the safety-critical entries.
6. Resolve disagreements before running the tool-assisted reviews.

The answer keys in the application are provisional. Replace them with the specialists' agreed entries before using the scores for a decision.

## Run each workflow

Run all three scenarios with the same answer key.

1. For manual review, give the reviewer the generated documents and record the start time.
2. For document chat, give the reviewer the same documents without structured relationships.
3. For structured review, use the Evidence Workspace and either the fixed replay or a recorded model configuration.
4. Stop the timer when the reviewer has classified every proposed impact.
5. Record corrections, irrelevant suggestions, unsupported reasoning, and reviewer confidence.
6. Reset RR-1.0 before the next run.

Change the workflow order between reviewers to reduce learning effects.

Replay demonstrates workflow mechanics. Because its saved suggestions were authored from the provisional answer key, do not use replay scores as evidence of model performance. Record a separate live-model run for that comparison.

## Calculate the measures

- Critical-impact recall is the number of found critical impacts divided by all expected critical impacts.
- Overall recall is the number of found expected impacts divided by all expected impacts.
- Actionable precision is the number of relevant update and retest suggestions divided by all update and retest suggestions.
- Time saving is the manual review time minus the structured review time, divided by the manual review time.

Count an item as found only when the reviewer assigns the correct evidence ID. Keep broad review suggestions separate from update and retest precision.

In the prototype, the internal evaluation page treats accepted and edited suggestions as found. Rejected and pending suggestions do not count. It calculates actionable precision only from accepted `update` and `retest` actions, including QA-edited actions. The page uses the latest QA decision for each suggestion and reports corrections separately.

## Apply the gate

The prototype passes when every scenario meets these conditions:

- Critical-impact recall is 100 percent.
- Overall recall is at least 85 percent.
- Actionable precision is at least 70 percent.
- Every suggestion cites an evidence ID or relationship path supplied to the model.
- The model invents no evidence ID and records no approval.
- Replay returns the saved result without an API connection.

Use 30 percent time saving as a target, not as a substitute for the safety and evidence conditions.
