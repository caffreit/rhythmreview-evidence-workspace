# Controlled prototype relationship and coverage policy

Status: `controlled_prototype`

Policy ID: `relationship-policy-v1.0`
Coverage policy ID: `trace-coverage-v1`  
Applies to: RhythmReview prototype baselines

## Purpose

This policy gives each stored relationship type one explicit meaning and a bounded set of source and target evidence types. Matrix, Coverage, candidate validation, and baseline approval use the same pure projection function. Every approved relationship records the policy ID and version, a statement-based rationale, origin, approval details, and predecessor lineage when applicable.

## Relationship meanings

| Type | Stored statement | Allowed source types | Allowed target types |
| --- | --- | --- | --- |
| `REFINES` | The source adds controlled detail to the target. | Claim, user need, requirement | Intended use, user need |
| `MITIGATES` | The source control reduces risk associated with the target hazard. | Risk control | Hazard |
| `IMPLEMENTS` | The source component implements the target requirement. | Component | Requirement |
| `VERIFIES` | The source test verifies the target requirement or risk control. | Test | Requirement, risk control |
| `VALIDATES` | The source clinical evidence validates the target product intent or user need. | Clinical evidence | Intended use, user need |
| `SUPPORTED_BY` | The source claim is supported by the target clinical evidence. | Claim | Clinical evidence |
| `DISCLOSED_IN` | The source controlled statement is disclosed in the target label. | Claim, intended use, requirement, risk control | Label |
| `DEPENDS_ON` | The source component depends on the target component. | Component | Component |
| `MAY_AFFECT` | A source change requires human review of the target. It does not assert confirmed design-control coverage. | Requirement, hazard, component, test, clinical evidence, label | Intended use, user need, requirement, hazard, risk control, component, claim |

All relationships must use two different evidence items from the same base baseline. A candidate cannot contain duplicate active source, target, and type triples. `MAY_AFFECT` is visually distinct and never satisfies a confirmed coverage rule.

## Controlled lifecycle

- Authors may add, retype, retire, discard, restore, or revise proposals in an eligible open change.
- QA may accept, reject, or change only the proposed relationship type, always with a reason.
- Endpoint changes require return to the author.
- An author revision increments the proposal revision. Earlier QA decisions remain in history and do not authorize the revised proposal.
- Relationship-only changes do not call OpenRouter. Their Matrix and Coverage projection is deterministic.
- Approval rejects stale base baselines and policy-invalid, duplicate, self-referential, cross-baseline, or no-op changes.
- Approval copies unchanged relationships into a new immutable baseline, applies accepted changes, ignores rejected proposals, and preserves the prior baseline.
- Coverage gaps inform review in WP-10A but do not block approval. WP-20 owns release gating.

## Coverage rules

| Rule | Version | Severity | Requirement |
| --- | --- | --- | --- |
| `TRC-REQ-001` | 1 | High | Each requirement refines at least one user need. |
| `TRC-REQ-002` | 1 | High | Each requirement has at least one implementing component. |
| `TRC-REQ-003` | 1 | High | Each requirement has at least one verifying test. |
| `TRC-RC-001` | 1 | High | Each risk control mitigates at least one hazard. |
| `TRC-RC-002` | 1 | High | Each risk control has at least one verifying test. |
| `TRC-CLM-001` | 1 | High | Each product claim links to supporting clinical evidence. |
| `TRC-CLM-002` | 1 | Medium | Each product claim links to the label where it is disclosed. |

## Current baseline result

The curated `RR-1.0` fixture contains 122 explicitly reviewed, policy-conforming relationships. It has four honest coverage gaps: disclosure coverage for `CLM-002`, and direct verification coverage for `RC-001`, `RC-002`, and `RC-005`. No existing test directly verifies the adult-population restriction in `RC-005`; that gap intentionally remains open for WP-20.

The five-minute traceability flow proposes `IU-001 DISCLOSED_IN LBL-004`, records a revision-bound QA decision, previews the candidate, approves a new baseline, proves the old relationship set is unchanged, and confirms that the unrelated `RC-005` gap remains open.
