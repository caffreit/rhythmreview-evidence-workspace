# Compliance demo

## Purpose

BlueBridge is an internal medtech evidence workspace. It tests whether structured evidence, deterministic traceability, and AI-assisted review help a QA or regulatory reviewer find the full impact of a SaMD change and approve a coherent new baseline. It is not a production eQMS.

## Current state

The RhythmReview prototype uses fictional data. Its accepted release baseline has 75 evidence items, 125 curated typed relationships, 10 generated document views, three change scenarios, immutable baseline snapshots, separate author, QA, and release-approver decisions, and an append-only audit history.

The implemented workflows are:

- A controlled change loop with bounded impact suggestions, candidate revisions, coherence checks, return to author, reanalysis, QA approval, immutable baselines, and retained history.
- A guided 10 to 12 minute demonstration with saved replay fixtures.
- A source-first path for text and Markdown revisions, required and advisory context questions, reviewed user needs, reviewed requirements, source-derived impact work, baseline approval, and a release record.
- Live analysis through OpenRouter and an explicitly selected replay mode.
- A baseline-aware traceability matrix and deterministic gap view backed by a controlled prototype relationship policy.
- Controlled add, retype, and retire proposals with revision-bound QA decisions, deterministic candidate projection, close-without-baseline, and immutable relationship history.
- A verification-readiness path with controlled TEST plans, immutable fictional executions, append-only QA review, and `release-readiness-v1`.
- A fictional final-release path with revisioned residual-risk assessment, hashed R2 attachments, verified GitHub Actions evidence, two simulated attestations, `final-release-v1`, and an immutable approved release.

The foundation package is complete. Its versioned prompt contracts, explicit live-failure behavior, model-run metadata, offline regression, live source-to-baseline proof, and prompt evaluation are recorded in the delivery plan.

WP-10 controlled traceability is implemented and accepted. `relationship-policy-v1.0` recognizes the curated relationship graph. Matrix, Coverage, and the interactive neighborhood graph share the same deterministic approved and candidate projections. The graph keeps controlled, proposed, rejected, and review-only states distinct.

WP-20 verification and final-release controls are implemented and accepted. The accepted `RR-1.1` release has zero high coverage gaps, nine current passed and QA-accepted verification executions, eight current QA-accepted residual-risk assessments, hash-verified support evidence, an accepted real Actions bundle tied to the deployed commit, and a frozen fictional final approval. The acceptance record and its scope limits are in the delivery plan. WP-30 document inputs and outputs is next.

## Delivery plan

The active work packages, dependencies, completion gates, and deferred production controls are maintained in [the BlueBridge delivery plan](docs/delivery-plan.md).

The product model and authority boundaries are maintained separately in [the product architecture](docs/product-architecture.md).

## Product rules

- A person remains responsible for every controlled decision.
- AI output and human corrections are separate records.
- Confirmed graph relationships remain distinct from semantic suggestions.
- Every AI-derived candidate carries exact source or clarification provenance.
- Approved baselines are immutable.
- Fixtures, simulated roles, and mock integrations are labelled.
- Critical-impact recall must be measured before more AI automation is added.

## Prototype boundary

Do not use real patient or client data. The prototype has no verified identity, electronic signatures, production integration controls, records-retention policy, or validated quality-system procedures. Its approvals and generated document views must not be presented as compliant signatures or submission-ready records.
