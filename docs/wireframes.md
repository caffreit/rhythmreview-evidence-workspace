# BlueBridge annotated wireframes

These low-fidelity wireframes define layout and behaviour before visual implementation. Bracketed numbers refer to the notes below each frame.

## 1. Product shell and lifecycle overview

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ BB  BlueBridge  [Northstar Health] [RhythmReview] [Working / RR-2.4]  Search │ [1]
│ Definition  Requirements  Architecture  Risk  Verification  Validation Release│ [2]
├──────────────────┬───────────────────────────────────────────────────────────┤
│ Overview         │ RhythmReview workspace                                   │
│ INPUTS           │ 12 open reviews   3 blockers   1 candidate baseline       │ [3]
│ Source inbox     │ ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│ Connected systems│ │ New sources  │ │ Review work  │ │ Release readiness  │  │
│ WORK             │ └──────────────┘ └──────────────┘ └────────────────────┘  │
│ Review centre    │ Recent source processing                                 │
│ Changes          │ Lifecycle coverage and gaps                              │
│ DESIGN CONTROLS  │ Recent controlled activity                               │
│ ...              │                                                           │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

1. Header selectors set the authority and release context for every page.
2. The lifecycle strip filters content and shows counts or blockers. It does not lock navigation.
3. Overview prioritizes incoming work, review load and release readiness over generic charts.

## 2. Source inbox and connected systems

```text
┌──────────────────┬───────────────────────────────────────────────────────────┐
│ Source inbox     │ Source inbox                         [Import text / .md]  │ [1]
│ Connected systems│ [All] [Needs context] [Ready] [Processed]                 │
│                  │ ┌───────────────────────────────────────────────────────┐ │
│                  │ │ Product discovery call · transcript · rev 1          │ │
│                  │ │ 2 required questions · 1 contradiction     Open ->   │ │ [2]
│                  │ ├───────────────────────────────────────────────────────┤ │
│                  │ │ Product follow-up · email thread · rev 1             │ │
│                  │ │ Ready to generate user needs                Open ->   │ │
│                  │ └───────────────────────────────────────────────────────┘ │
└──────────────────┴───────────────────────────────────────────────────────────┘

┌──────────────────┬───────────────────────────────────────────────────────────┐
│ Source inbox     │ Connected systems                                        │
│ Connected systems│ GitHub   Not connected   Repository -> Components        │ [3]
│                  │ Jira     Not connected   Work records -> Change sets      │
│                  │ CI       Not connected   Runs -> Verification evidence    │
│                  │          Conceptual — not implemented                    │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

1. The prototype accepts pasted text and `.txt` or `.md` files.
2. Status summarizes the current processing gate rather than presenting a generic upload list.
3. Operational connection cards explain what each future integration will observe.

## 3. Source processing and clarification

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Product discovery call / revision 1         Source | Processing | Activity  │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ Original source              │ Context questions                             │
│ 12:14 "alerts should be..." │ REQUIRED · Contradiction                      │ [1]
│ 18:02 "clinicians can..."   │ Which alert timing should govern?            │
│                              │ [answer____________________________________]   │
│                              │ [Save answer] [Defer with reason]             │
│                              │                                               │
│                              │ ADVISORY · Missing decision                   │ [2]
│                              │ Owner for the escalation workflow is unclear. │
│                              │                                               │
│                              │ Required 1 of 2 resolved                       │
│                              │ [Generate user needs — blocked]               │ [3]
└──────────────────────────────┴───────────────────────────────────────────────┘
```

1. Selecting a question highlights the cited source span.
2. Advisory questions may remain open but follow generated candidates.
3. The generation action states exactly why it is blocked.

## 4. Review centre and sequential candidate review

```text
┌──────────────────┬───────────────────────────────────────────────────────────┐
│ My review work   │ UN-C03 · Clinician sees time-critical alert              │
│ User needs  4    │ AI-derived · source-context-v3 / user-needs-v2            │ [1]
│ Requirements 0   │ Statement                                                 │
│ Impacts     7    │ As a reviewing clinician, I need...                       │
│ Baselines   1    │                                                           │
│                  │ Sources [2]   Relationships [1]   Open advisory [1]       │ [2]
│                  │ [Reject] [Request revision] [Accept candidate]            │ [3]
└──────────────────┴───────────────────────────────────────────────────────────┘
```

1. The candidate always shows origin, model and policy version.
2. Sources open the exact cited spans; relationships are proposed, not silently committed.
3. Accepting a user need permits requirement generation. It does not approve a baseline.

## 5. Requirements and component detail

```text
┌──────────────────┬───────────────────────────────────────────────────────────┐
│ Requirements     │ REQ-C07 · Alert delivery latency                         │
│ Product      2   │ Candidate · System requirement                            │
│ System       5   │ Content | Relationships | Provenance | History | Usage     │ [1]
│ Subsystem    8   │                                                           │
│                  │ Parent  REQ-C02                                            │
│                  │ Refines UN-019                                             │
│                  │ Implemented by CMP-014                                     │
│                  │ Verified by TEST-022                                       │
│                  │                                                           │
│                  │ Parent approved / child awaiting review        BLOCKER    │ [2]
└──────────────────┴───────────────────────────────────────────────────────────┘
```

1. Evidence types share the same detail structure.
2. Parent-child approval never cascades. Mismatches become coherence findings.

## 6. Impact review

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Change set CHG-ALERT-01                     9 suggestions · 2 critical       │
│ [Linked 4] [Semantic 3] [Collection 2]                                  [1] │
├──────────────────────────────────────────────────────────────────────────────┤
│ TEST-022 · Retest · LINKED                                                   │
│ Path: REQ-C07 -> CMP-014 -> TEST-022                         [Accept][Reject] │
│                                                                              │
│ REQ-031 · Review · SEMANTIC                                                  │
│ Category: shared interface · cited evidence                                  │
│                                                                              │
│ Alert regression suite · Review · COLLECTION                                 │
│ Reason: one suite member changed                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

1. Origin stays visible throughout review. Model output never masquerades as a confirmed trace link.

## 7. Separate baseline and release workspaces

```text
┌──────────────────┬───────────────────────────────────────────────────────────┐
│ Baselines        │ Candidate baseline RR-2.5                                │
│ Releases         │ 6 item versions · 2 links · 1 collection update          │
│ Documents        │ Coherence: 0 blockers   Reviews: complete                 │
│ Design reviews   │ [Approve immutable baseline]                              │ [1]
│                  │                                                           │
│                  │ [Open separate Releases workspace]                        │
│                  │ Planned release -> release-readiness-v1                    │
│                  │ Nine fictional execution records and QA decisions          │ [2]
│                  │ Verification ready (not Released or Production ready)       │
└──────────────────┴───────────────────────────────────────────────────────────┘
```

1. Baseline approval remains a separate authorized decision after item review.
2. Release creation is explicit. Manual execution, build, and evidence references are labelled fictional; real CI and final release approval remain outside WP-20A.
