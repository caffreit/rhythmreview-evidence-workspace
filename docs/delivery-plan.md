# BlueBridge delivery plan

Status: WP-00 complete; WP-10 in progress  
Last updated: 13 September 2026

## How to use this plan

Work packages have stable IDs. A package is complete only when its completion gate passes. Later packages may be refined, but their boundary and dependency remain fixed unless the product architecture changes.

| Work package | Status | Depends on | Outcome | Completion gate |
| --- | --- | --- | --- | --- |
| WP-00 Foundation and live proof | Complete | None | Versioned prompt contracts, explicit live failures, reproducible regression checks, OpenRouter smoke test, and a recorded fictional source-to-baseline run | Passed: offline checks and seed-corpus review passed; `SRC-001` reached `RR-1.1` using live runs only |
| WP-10A Controlled relationship lifecycle | Accepted | WP-00 | Ratified prototype policy, curated relationship fixture, controlled proposals, baseline-aware matrix, and gap analysis | Invalid link combinations are blocked; revision-bound QA decisions, immutable baseline outcomes, browser checks, and live corpus gates pass |
| WP-10B Interactive traceability graph | Planned | WP-10A | Explorable graph with controlled, proposed, rejected, and review-only links | Graph state matches the Matrix projection for every supported change state |
| WP-20 Risk, verification, and release readiness | Planned | WP-10 | Structured hazards, controls, residual risk, verification plans and executions, and release gates | A candidate release cannot proceed with unresolved required risk, verification, traceability, or review work |
| WP-30 Document inputs and outputs | Planned | WP-20 | PDF and DOCX ingestion, source and controlled-document redlines, versioned templates, and package completeness | An imported document can produce reviewed evidence and a baseline-linked output package |
| WP-40 Connected-work fixtures | Planned | WP-10 | Fixture-backed Jira mapping plus repository and CI observations | Repeated imports converge without overwriting controlled evidence or claiming external facts as BlueBridge approvals |
| WP-50 Production foundations | Deferred | WP-20, WP-30, WP-40 | Identity, permissions, durable jobs, concurrency controls, migration discipline, retention, monitoring, and cost controls | A limited internal pilot can use controlled non-patient data with verified identity and recoverable operations |
| WP-60 Real integrations and validation | Deferred | WP-50 | Real Jira, GitHub and CI connections plus applicable quality procedures, model governance, validation evidence, and electronic signatures | Production use and compliance claims have documented, approved evidence |

## Current package

WP-10A has its implementation slice:

1. `relationship-policy-v1.0` has `controlled_prototype` status and defines meanings and endpoint types for all nine relationship types.
2. The numeric seed loops were replaced by 122 explicit, statement-rationalized, policy-conforming relationships.
3. Authors can create add, retype, and retire proposals from Matrix, Coverage, or an open evidence change. QA decisions are immutable and bound to the current proposal revision.
4. Matrix, Coverage, validation, and approval share one deterministic candidate projection. Approval preserves the prior baseline and relationship rows.
5. `trace-coverage-v1` reports four honest gaps: `CLM-002`, `RC-001`, `RC-002`, and `RC-005`. Coverage gaps do not gate WP-10A approval; WP-20 owns that release gate.
6. `verify:traceability` exercises the five-minute guided flow, revision invalidation, all-rejected closure, stale-baseline conflict, and workspace reset.

WP-10A passed the full offline regression suite, desktop and 390 px browser acceptance, and the authorized paid three-scenario corpus against the curated graph. The interactive graph is deliberately deferred to WP-10B. See [Controlled prototype relationship and coverage policy](relationship-policy.md).

## Completed foundation package

WP-00 delivered four outcomes:

1. Harden `source-context-v3`, `user-needs-v2`, `requirements-v2`, and `impact-v6` together with their structured-output contracts.
2. Record failed live runs without automatic replay and preserve model request, timing, attempt, and token metadata.
3. Keep offline replay regression separate from opt-in live verification, then review every fictional source and change scenario.
4. Record the first live `SRC-001` source-to-baseline result and the prompt-approval decision.

The implementation and acceptance evidence are recorded in [Prototype prompt evaluation](prompt-evaluation.md). The workspace was reset after the evaluation, leaving replay available only as an explicit demonstration choice.

## Product boundary

BlueBridge remains an internal prototype. Simulated roles are not authenticated identities or electronic signatures. Connected systems, patient data, submission-ready records, and production compliance claims remain outside WP-00 through WP-40.
