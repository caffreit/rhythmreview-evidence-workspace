# Compliance demo

## Purpose

BlueBridge is an internal medtech evidence workspace. It tests whether structured evidence, deterministic traceability, and AI-assisted review help a QA or regulatory reviewer find the full impact of a SaMD change and approve a coherent new baseline. It is not a production eQMS.

## Current state

The RhythmReview prototype uses fictional data. It has 72 evidence items, 118 typed relationships, 10 generated document views, three change scenarios, immutable baseline snapshots, separate author and QA decisions, and an audit history.

The implemented workflows are:

- A controlled change loop with bounded impact suggestions, candidate revisions, coherence checks, return to author, reanalysis, QA approval, immutable baselines, and retained history.
- A guided 10 to 12 minute demonstration with saved replay fixtures.
- A source-first path for text and Markdown revisions, required and advisory context questions, reviewed user needs, reviewed requirements, source-derived impact work, baseline approval, and a release record.
- Live analysis through OpenRouter and an explicitly selected replay mode.
- A baseline-aware traceability matrix and deterministic gap view backed by versioned draft relationship and coverage policies.

The foundation package is complete. Its versioned prompt contracts, explicit live-failure behavior, model-run metadata, offline regression, live source-to-baseline proof, and prompt evaluation are recorded in the delivery plan.

The controlled traceability package is in progress. The current draft policy recognizes all 118 seeded links and reports the missing verification relationship for `RC-005` through rule `TRC-RC-002` version 1. QA and regulatory ratification, controlled relationship editing, and the graph remain open.

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
