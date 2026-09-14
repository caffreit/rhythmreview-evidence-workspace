# BlueBridge technical documentation

These pages describe the RhythmReview prototype as it exists on 14 September 2026. They separate implemented behavior from the broader product direction in [Product architecture](product-architecture.md).

## Pick a starting point

| Reader | Start here | Then read |
| --- | --- | --- |
| Senior engineer or architect | [System architecture](system-architecture.md) | [Data model and database](data-model.md), [LLM actions and prompt contracts](llm-actions.md) |
| PM or product owner | [SDLC charter alignment](sdlc-charter-alignment.md) | [Authority model](authority-model.md), [Delivery plan](delivery-plan.md) |
| QA or regulatory reviewer | [SDLC charter alignment](sdlc-charter-alignment.md) | [Authority model](authority-model.md), [Evaluation protocol](evaluation-protocol.md) |
| New contributor | [Technology and repository guide](technology.md) | [System architecture](system-architecture.md), the project [README](../README.md) |

## Reference set

- [System architecture](system-architecture.md) describes the deployed parts, request paths, trust boundaries, and main workflows.
- [Data model and database](data-model.md) explains the 28-table D1 schema, logical relationships, versioning, and known integrity gaps.
- [Technology and repository guide](technology.md) lists the languages, frameworks, runtime, and source ownership.
- [LLM actions and prompt contracts](llm-actions.md) records each implemented model action, its exact policy text, bounded inputs, validation, and failure behavior.
- [Authority model](authority-model.md) explains why external facts, model proposals, human decisions, baselines, and releases have different owners. It also compares the approach with the public positioning of Infera and Ketryx.
- [SDLC charter alignment](sdlc-charter-alignment.md) assesses the prototype and work packages against the Team Brief and Charter Tier 1 positions, identifies philosophical tensions and roadmap gaps, and proposes testable acceptance criteria.
- [Controlled prototype relationship and coverage policy](relationship-policy.md) defines the meanings, allowed endpoint types, and versioned gap rules used by the traceability pages.
- [Stakeholder questions](stakeholder-questions.md) answers the questions senior developers, architects, PMs, POs, and QA or RA leaders are likely to ask.

## Scope labels

The docs use three labels:

- **Implemented** means the behavior exists in this repository.
- **Fixture** means saved fictional data demonstrates the behavior without proving live model quality.
- **Planned** means the product architecture describes the behavior, but the repository does not implement it.

The prototype is not a production eQMS. Its simulated roles are not authenticated identities or electronic signatures.
