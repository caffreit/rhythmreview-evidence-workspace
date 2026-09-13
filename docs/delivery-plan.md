# BlueBridge delivery plan

Status: WP-00 complete; WP-10 in progress  
Last updated: 13 September 2026

## How to use this plan

Work packages have stable IDs. A package is complete only when its completion gate passes. Later packages may be refined, but their boundary and dependency remain fixed unless the product architecture changes.

| Work package | Status | Depends on | Outcome | Completion gate |
| --- | --- | --- | --- | --- |
| WP-00 Foundation and live proof | Complete | None | Versioned prompt contracts, explicit live failures, reproducible regression checks, OpenRouter smoke test, and a recorded fictional source-to-baseline run | Passed: offline checks and seed-corpus review passed; `SRC-001` reached `RR-1.1` using live runs only |
| WP-10 Controlled traceability | In progress | WP-00 | Ratified relationship policy, controlled relationship editor, baseline-aware matrix, graph, and gap analysis | Invalid link combinations are blocked and every reported gap is traceable to a versioned rule |
| WP-20 Risk, verification, and release readiness | Planned | WP-10 | Structured hazards, controls, residual risk, verification plans and executions, and release gates | A candidate release cannot proceed with unresolved required risk, verification, traceability, or review work |
| WP-30 Document inputs and outputs | Planned | WP-20 | PDF and DOCX ingestion, source and controlled-document redlines, versioned templates, and package completeness | An imported document can produce reviewed evidence and a baseline-linked output package |
| WP-40 Connected-work fixtures | Planned | WP-10 | Fixture-backed Jira mapping plus repository and CI observations | Repeated imports converge without overwriting controlled evidence or claiming external facts as BlueBridge approvals |
| WP-50 Production foundations | Deferred | WP-20, WP-30, WP-40 | Identity, permissions, durable jobs, concurrency controls, migration discipline, retention, monitoring, and cost controls | A limited internal pilot can use controlled non-patient data with verified identity and recoverable operations |
| WP-60 Real integrations and validation | Deferred | WP-50 | Real Jira, GitHub and CI connections plus applicable quality procedures, model governance, validation evidence, and electronic signatures | Production use and compliance claims have documented, approved evidence |

## Current package

WP-10 now has its first reviewable slice:

1. `relationship-policy-v0.1` defines draft meanings and allowed endpoint types for all nine relationship types.
2. The baseline-aware Matrix displays exact evidence versions, incoming and outgoing stored links, and rule gaps.
3. `trace-coverage-v1` reports deterministic coverage gaps with stable rule IDs and versions.
4. The current seed has 118 policy-conforming links and one high-severity coverage gap: `RC-005` lacks verification under `TRC-RC-002` version 1.

The policy remains draft. WP-10 is not complete until QA and regulatory reviewers ratify it, link authoring rejects invalid combinations, relationship changes have a controlled review history, and the graph view is implemented. See [Draft relationship and coverage policy](relationship-policy.md).

## Completed foundation package

WP-00 delivered four outcomes:

1. Harden `source-context-v3`, `user-needs-v2`, `requirements-v2`, and `impact-v6` together with their structured-output contracts.
2. Record failed live runs without automatic replay and preserve model request, timing, attempt, and token metadata.
3. Keep offline replay regression separate from opt-in live verification, then review every fictional source and change scenario.
4. Record the first live `SRC-001` source-to-baseline result and the prompt-approval decision.

The implementation and acceptance evidence are recorded in [Prototype prompt evaluation](prompt-evaluation.md). The workspace was reset after the evaluation, leaving replay available only as an explicit demonstration choice.

## Product boundary

BlueBridge remains an internal prototype. Simulated roles are not authenticated identities or electronic signatures. Connected systems, patient data, submission-ready records, and production compliance claims remain outside WP-00 through WP-40.
