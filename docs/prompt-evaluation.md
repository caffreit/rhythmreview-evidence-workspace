# Prototype prompt evaluation

Evaluation date: 2026-09-12  
Configuration: `openai/gpt-5.6-luna`, medium reasoning, `openai/text-embedding-3-small`  
Scope: fictional seed data only, before the WP-10A curated relationship graph

Historical decision: approved for the pre-WP-10A prototype

Current WP-10A decision: pending a newly authorized paid corpus run

This is a prototype prompt evaluation. It is not regulatory validation, production model approval, or evidence of compliance.

The results below are historical and do not support a live-quality claim for the curated 122-link graph. WP-10A acceptance requires a fresh three-scenario run against that graph. Until it is explicitly authorized and passes every locked threshold, the current quality claim remains withdrawn.

## Historical decision against the gates

| Gate | Result | Decision |
| --- | ---: | --- |
| Exact citation validity | 100% | Pass |
| Invented facts or IDs | 0 | Pass |
| Invalid user-need or requirement shapes | 0 | Pass |
| Known required contradictions raised | 100% | Pass |
| Critical-impact recall | 100% (13/13) | Pass |
| Overall impact recall | 94% (34/36) | Pass |
| Actionable impact precision | 88% (14/16) | Pass |
| Current-policy `SRC-001` live baseline | `RR-1.1` | Pass |

The impact measures use model-positive classifications only; `no_change` results do not count as detected impacts. Human edits and rejections are recorded separately and do not inflate the raw figures.

| Human-review field | Final result |
| --- | --- |
| Structural failures | 0 in final completed runs; 2 explicit pre-fix impact failures retained |
| Unsupported accepted claims | 0 |
| Missing known required questions | 0 |
| Source-candidate revisions | 0 in the final proof |
| Impact action corrections | 4 across the three-scenario corpus |

## Connectivity and structured-output smoke test

The final opt-in `verify:live` check established connectivity, structured parsing, citation validation, usage capture, and explicit live mode with the current policies. It reset the workspace after completion.

| Stage | Run ID | Policy | Result |
| --- | --- | --- | --- |
| Source context | `PRC-7FC1705D` | `source-context-v3` | Completed live |
| Semantic impact | `RUN-CBC263AC` | `impact-v6` | Completed live |

Both runs used the configured model, recorded a provider response ID, duration, attempts, and token usage, and stored no error or replay output.

## Complete SRC-001 source-to-baseline proof

The required timing decision was recorded exactly as: “30 seconds is the maximum for the current release; 60-second peak behavior is an engineering gap.” The escalation-owner question remained open as advisory provenance. QA review accepted only candidates supported by exact source or clarification citations. The current-policy workflow reached immutable baseline `RR-1.1` and planned release `RELSE-847B8FE9` using live runs only.

| Stage | Run ID | Policy | Duration | Input tokens | Output tokens | Embedding tokens |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Context | `PRC-25B6B74E` | `source-context-v3` | 5,441 ms | 556 | 390 | — |
| User needs | `PRC-4504961A` | `user-needs-v2` | 11,786 ms | 650 | 1,009 | — |
| Requirements | `PRC-373E7DEE` | `requirements-v2` | 14,598 ms | 1,563 | 1,119 | — |
| Source impact | `PRC-6057A25D` | `impact-v6` | 42,459 ms | 8,566 | 3,271 | 2,857 |

Human review accepted three user needs, six atomic requirements, and 16 bounded impact follow-ups. It recorded no candidate revision or rejection in the final run. Every stage completed on its first attempt with the configured model and no stored error.

## Source prompt quality result

| Gate | Result |
| --- | ---: |
| Exact citation validity | 100% |
| Invented facts or IDs | 0 |
| Invalid user-need or requirement shapes | 0 |
| Known required contradictions raised | 100% |
| Open advisory provenance retained downstream | Yes |
| Live-only immutable baseline reached | Yes |

The evaluation cycle found and corrected two prompt-contract issues before the final run: organizational escalation ownership was initially classified as required rather than advisory, and a prose-template check confused writing style with user-need structure. The final contract represents user needs with separate `supportedUser` and `goalOrConstraint` fields and derives readable baseline text from them.

## Three-source review

All three fictional sources completed context, user-need, and requirement generation. The current context policy was then verified across the full set.

| Source | Context run and result | User-needs run | Requirements run |
| --- | --- | --- | --- |
| `SRC-001` | `PRC-0279F26B` · v3 · 5,276 ms · 556/387 tokens · required timing and advisory escalation | `PRC-DEB197AC` · v2 · 7,922 ms · 658/867 | `PRC-A7E0E3AB` · v2 · 9,842 ms · 1,498/1,066 |
| `SRC-002` | `PRC-95F1E7C5` · v3 · 7,555 ms · 466/643 tokens · advisory operating procedure only | `PRC-D6165B25` · v2 · 7,588 ms · 491/761 | `PRC-9CEDBC74` · v2 · 5,409 ms · 1,019/472 |
| `SRC-003` | `PRC-67513D15` · v3 · 2,571 ms · 489/122 tokens · no question | `PRC-ECC96C08` · v2 · 8,114 ms · 514/866 | `PRC-9A756F93` · v2 · 9,856 ms · 1,279/854 |

`SRC-002` did not reopen the explicit network requirement or current joint ownership. `SRC-003` did not reopen the explicit email-alert exclusion. Human review found no unsupported generated need or requirement in the accepted corpus.

## Historical live impact corpus

The final `impact-v6` evaluation classified every bounded candidate for each fictional change scenario. Recall and precision below are measured on the model output before human decisions.

| Scenario | Run ID | Duration | Input / output / embedding tokens | Critical recall | Overall recall | Actionable precision |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `SCN-001` | `RUN-89953843` | 24,608 ms | 3,734 / 3,236 / 2,529 | 100% | 100% | 80% |
| `SCN-002` | `RUN-A14403D5` | 25,599 ms | 4,960 / 3,899 / 39 | 100% | 91% | 100% |
| `SCN-003` | `RUN-E9A0CD75` | 26,388 ms | 13,195 / 4,533 / 0 | 100% | 95% | 75% |
| **Aggregate** | — | — | — | **100% (13/13)** | **94% (34/36)** | **88% (14/16)** |

Zero embedding tokens on the last run are valid: all required evidence-version and model pairs were already cached. Human review rejected false positives and recorded four action corrections across the corpus; those decisions do not alter the raw scores above.

## Failures and prompt revisions

- The initial context policy treated escalation ownership as a required release choice. `source-context-v3` now distinguishes required unsupported choices from advisory operating matters.
- The initial user-need validator treated a prose template as the contract. The final contract uses explicit `supportedUser` and `goalOrConstraint` fields.
- `impact-v3` through `impact-v5` exposed incomplete classification and low precision. `impact-v6` requires one controlled classification for every bounded candidate and restricts actions by candidate type.
- Two `impact-v6` attempts failed explicitly when the provider returned an action that was invalid for the selected candidate type. They created no suggestions and did not load replay data. A per-candidate structured schema corrected the failure; the next explicit retry completed.

Those completed runs had no structural failures, invented identifiers, unsupported accepted claims, vague unresolved thresholds, or invalid citations. They approved the pre-WP-10A prompt set for the prototype only; they do not approve the current curated graph.
