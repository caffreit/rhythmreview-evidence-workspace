# Compliance demo

## Purpose

Build an internal medtech compliance workspace that combines the strongest ideas from Ketryx and Infera without pretending to be a production eQMS. The first product question is narrower: can structured evidence, deterministic traceability, and AI-assisted review help a QA or regulatory reviewer find the full impact of a SaMD change and approve a coherent new baseline?

The current RhythmReview prototype already demonstrates this core loop with fictional data. It contains 72 evidence items, 118 typed relationships, 10 generated document views, three change scenarios, immutable baseline snapshots, QA decisions, and an audit history.

## Product principles

- Keep a person responsible for every controlled decision.
- Preserve AI output and human corrections as separate records.
- Distinguish confirmed graph relationships from semantic suggestions.
- Cite the evidence behind every AI recommendation.
- Keep approved baselines immutable.
- Label fixtures, simulated roles, and mock integrations honestly.
- Measure critical-impact recall before adding more AI automation.

## Capability priorities

The estimates below apply to a polished internal prototype that continues to use fictional data. They do not estimate the work required for a validated commercial system.

| Capability | User value | Prototype lift | Delivery risk | Decision |
| --- | ---: | --- | --- | --- |
| Traceability coverage matrix and gap drill-down | 5 | Medium | Low | Build now |
| Return-to-author and reopen-analysis workflow | 5 | Small | Medium | Phase 1 complete |
| Relationship editor with controlled link semantics | 5 | Medium | Medium | Build now |
| Risk workspace for hazards, scores, controls, and residual risk | 5 | Medium | Medium | Build now |
| Verification plan, protocol, execution, and coverage views | 5 | Medium | Medium | Build now |
| Release-readiness gates across requirements, risks, tests, and approvals | 5 | Medium | Medium | Build now |
| Expandable audit history with old and new values | 4 | Small | Low | Phase 1 complete |
| Recent-change list and completed-change reopening | 4 | Small | Low | Phase 1 complete |
| Resolve findings and rerun deterministic checks | 5 | Medium | Medium | Phase 1 complete |
| Controlled document redlines and package-completeness view | 4 | Medium | Medium | Build next |
| Source-document import and AI requirement extraction | 5 | Medium to large | Medium | Build next |
| AI-assisted candidate drafting with explicit provenance | 4 | Medium | High | Build next after evaluation controls |
| Fixture-backed Jira import and export adapter | 4 | Medium | Medium | Build next |
| Search, filters, saved views, and evidence ownership queues | 3 | Small to medium | Low | Build when needed |
| SBOM and vulnerability review workspace | 3 | Large | Medium | Later |
| Real Jira synchronization | 5 | Large | High | Later, after the internal model stabilizes |
| Git and CI test-result synchronization | 5 | Large | High | Later |
| Real authentication and role-based access | 5 | Large | High | Required before real users or data |
| Electronic signatures and Part 11 controls | 5 | Extra large | High | Do not simulate as production capability |
| Submission-ready Word and technical-document generation | 4 | Extra large | High | Later |
| Full eQMS, CAPA, training, complaints, and supplier controls | 3 | Extra large | High | Out of scope for this product phase |
| Multi-product, multi-tenant enterprise administration | 4 | Extra large | High | Later |
| Post-market surveillance | 3 | Large | High | Later |

## Recommended build sequence

### Phase 1: Complete the controlled change loop

1. Add recent-change navigation.
2. Add audited return-to-author and reopen-analysis transitions.
3. Show full audit-event details, including old and new values.
4. Let reviewers resolve coherence findings and rerun deterministic checks.

Implemented. Stored changes reopen at their current stage, QA can return candidates with reasons, authors can reopen analysis without deleting history, audit events expose old/new values, and persisted baseline or candidate checks support exact-fingerprint waivers and deterministic resolution on rerun.

### Phase 2: Resemble a lifecycle-management product

1. Add a traceability coverage matrix with drill-down into missing links.
2. Add controlled relationship editing and validate allowed source, relationship, and target combinations.
3. Add a risk workspace for hazard analysis, controls, verification, and residual-risk review.
4. Add verification planning, protocol generation, execution status, and coverage.
5. Add a release-readiness page that blocks the candidate baseline when required evidence is incomplete.

This phase creates the clearest Ketryx and Infera comparison. All five capabilities can work against the existing fictional evidence graph.

### Phase 3: Demonstrate ingestion and connected work

1. Import a small set of fictional PDFs, product requirements, and Jira-shaped records.
2. Show extracted requirement candidates before a person accepts them.
3. Add a fixture-backed Jira adapter that demonstrates field mapping, typed links, and round-trip status changes.
4. Add controlled document redlines and a package-completeness view.

Use a fixture-backed adapter before a live Jira integration. The team can settle the internal evidence model and mapping rules without depending on Jira administration or credentials.

### Phase 4: Connect real systems

Add real Jira, Git, and CI integrations only after the evidence types, relationship policy, approval states, and release gates are stable. Add real authentication before any non-fictional data or additional users enter the system.

## First milestone

The first milestone should be an end-to-end fictional release in which a reviewer can:

1. Open a proposed change.
2. Review cited graph and semantic impacts.
3. Correct the proposed scope.
4. Return the change to the author if needed.
5. Review updated hazards and controls.
6. inspect requirement and risk-control test coverage.
7. Resolve or waive deterministic findings with reasons.
8. Pass explicit release-readiness gates.
9. Approve a new immutable baseline.
10. Inspect the full audit history and the prior baseline.

## Important boundary

This remains an internal prototype until the team implements and validates identity, access control, electronic signatures, records retention, integration reliability, model controls, and the applicable quality-system procedures. The interface must not describe simulated approval as a compliant electronic signature or generated document views as submission-ready records.
