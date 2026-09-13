# Draft relationship and coverage policy

Status: Draft for QA and regulatory review  
Policy ID: `relationship-policy-v0.1`  
Coverage policy ID: `trace-coverage-v1`  
Applies to: RhythmReview prototype baselines

## Purpose

This draft gives each stored relationship type one explicit meaning and a bounded set of source and target evidence types. The traceability API applies the policy to the active approved baseline. The Matrix page shows exact evidence versions and stored links. The Coverage and gaps page reports failed coverage rules with a stable rule ID and version.

This is not yet a controlled policy. QA and regulatory reviewers must ratify the meanings and allowed endpoint types before BlueBridge adds relationship authoring.

## Relationship meanings

| Type | Stored statement | Allowed source types | Allowed target types |
| --- | --- | --- | --- |
| `REFINES` | The source adds controlled detail to the target. | Claim, user need, requirement | Intended use, user need |
| `MITIGATES` | The source control reduces risk associated with the target hazard. | Risk control | Hazard |
| `IMPLEMENTS` | The source component implements the target requirement. | Component | Requirement |
| `VERIFIES` | The source test verifies the target requirement or risk control. | Test | Requirement, risk control |
| `VALIDATES` | The source clinical evidence validates the target product intent or user need. | Clinical evidence | Intended use, claim, user need |
| `SUPPORTED_BY` | The source claim is supported by the target clinical evidence. | Claim | Clinical evidence |
| `DISCLOSED_IN` | The source controlled statement is disclosed in the target label. | Claim, intended use, requirement, risk control | Label |
| `DEPENDS_ON` | The source component depends on the target component. | Component | Component |
| `MAY_AFFECT` | A source change requires human review of the target. It does not assert a direct design-control dependency. | Requirement, hazard, component, test, clinical evidence, label | Intended use, user need, requirement, hazard, risk control, component, claim |

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

For the seeded `RR-1.0` baseline, all 118 active relationships conform to `relationship-policy-v0.1`. The coverage engine reports one high-severity gap: `RC-005` has no incoming `VERIFIES` relationship from a test under `TRC-RC-002` version 1.

## Decisions needed before relationship editing

- Confirm whether `MAY_AFFECT` is narrow enough for controlled use or should be replaced by more specific relationship types.
- Confirm whether clinical evidence validates intended use and user needs directly, or only supports claims.
- Confirm whether disclosure coverage applies to every claim or only claims selected for external communication.
- Decide who may propose, review, approve, retire, and supersede a relationship.
- Decide whether relationship changes belong to the candidate baseline transaction or a separate controlled change record.
