# BlueBridge first estimation pass

Status: provisional planning estimate, 9 October 2026. Low confidence until the first fresh-build workflow is completed.

The central starting point is 54 engineering hours plus 11 hours of product/domain input and independent review for the minimum P0, P1, and P2 path. At six focused engineering hours per day, that is nine engineering days. A roughly two-week delivery target is a reasonable hypothesis for this bounded scope if reviewer time and required inputs are available. It needs testing against actual work.

This estimate starts a new codebase. It gives no credit for existing demo code, database contents, prompts, fixtures, or tests. The demo supplies examples of the problem and a rough timing reference. New P0 components are shared with the new P1/P2 workflows and counted once.

Open the [feature map](bluebridge-feature-map.md) for the complete catalogue. The [task worksheet](planning/bluebridge-estimate-tasks.csv) contains the effort breakdown and blank actual-effort fields. Copy it to a tracking sheet before recording actuals; regeneration replaces the generated worksheet.

## Calibration and units

The calibration input is the user's recollection that previous demo work packages took "two or three days". This is an informal recollection, not a verified time record. The previous WP packages have different boundaries from P0/P1/P2. We have not established how much active engineering, review, or waiting those days contained.

For a first number to discuss, the estimate uses three focused engineering days as the central package allowance, two as the lower scenario, and five as the upper scenario. The task breakdown allocates those provisional budgets to actual work. It does not provide independent evidence that each task or package will take that time.

One engineering day means six focused person-hours, including developer checks and repairs. The planning week has 30 engineering hours. Product/domain clarification and independent human checking are separate person-hours. These assumptions do not prescribe anyone's working day or claim that the earlier packages used six-hour days.

Lower, central, and upper are judgement scenarios, not confidence intervals, measured productivity, or a promise that work cannot exceed the upper number. AI-assisted coding is already assumed throughout. There is no second AI speed discount to apply.

## Scope being estimated

The outcome is a reviewable pilot for one project in one development environment. It has a small web interface, fresh persistent storage, one available model provider, plain-text transcript capture, a small need/requirement schema, and one JSON exchange format. The internal store is the provisional home for the pilot's new records. Risk, test, and label references come from a small manually prepared bundle. This does not decide the future organisation-wide evidence home.

People select context, resolve questions, revise drafts, confirm links, and make decisions. The inner loop has explicit checks and a manual revise/recheck action. The outer loop uses a separate human with direct access to source evidence and wider change context. The tool captures correction reasons from the first workflow; periodic cause review can use that log.

Live Slack/meeting/tracker/repository/CI connectors, PDF/DOCX extraction, semantic search for unlinked impacts, continuous drift detection, autonomous repair, automated independent checking, and automated meta-loop analysis are later increments. P3/P4 and native risk/usability/validation/model modules remain unestimated. Client deployment, authenticated permissions, concurrent-user operation, and durable background processing also need their own scope and estimate.

## Package effort

All values below are person-hours. P1 and P2 are increments after the new shared components exist.

| Package | Lower engineering | Central engineering | Upper engineering | Review lower / central / upper | Central focused engineering days |
| --- | ---: | ---: | ---: | --- | ---: |
| P0 Shared foundations | 12 | 18 | 30 | 2 / 3 / 5 | 3 |
| P1 Source to reviewed evidence | 12 | 18 | 30 | 2 / 4 / 7 | 3 |
| P2 Trace and change review | 12 | 18 | 30 | 2 / 4 / 7 | 3 |
| Total | 36 | 54 | 90 | 6 / 11 / 19 | 9 |

Engineering and review together total 42 / 65 / 109 person-hours. Review can overlap engineering, so adding the two effort figures does not directly give elapsed delivery time.

## Work breakdown

Each row includes implementation and its immediate developer checks. E11 and E17 add representative end-to-end checks and repairs. Review hours count preparing and exercising the pilot, not ongoing review of every future requirement or change. Capability IDs can appear in several rows where distinct work extends the same capability.

### P0

| Task | Work | Capabilities | Engineering lower / central / upper | Review lower / central / upper |
| --- | --- | --- | --- | --- |
| E01 | Agree the first workflow and record contracts | CAP-01, CAP-03 | 2 / 3 / 5 | 1 / 2 / 3 |
| E02 | Create the application and versioned store | CAP-02 | 3 / 4 / 7 | 0 / 0 / 0 |
| E03 | Record decisions and return work for revision | CAP-04 | 2 / 4 / 6 | 1 / 1 / 2 |
| E04 | Create the model-call and run-record contracts | CAP-05 | 3 / 4 / 7 | 0 / 0 / 0 |
| E05 | Add local execution and one exchange format | CAP-38 | 2 / 3 / 5 | 0 / 0 / 0 |

- E01: Agree one project, provisional homes, record schemas, link meanings, check criteria, and named decision roles.
- E02: Start a new repository/application/database; create stable IDs and retained revisions, candidate/accepted states, and record lookup.
- E03: A simple screen records person, role, reason, disposition, and exact revision; a new revision needs a new decision.
- E04: Connect one available model provider; validate structured outputs and retain prompt/context/model versions, failures, and run identity.
- E05: A colleague can launch the workspace, retain records across restart, and export/reopen one agreed JSON bundle with IDs, revisions, decisions, and links.

### P1

| Task | Work | Capabilities | Engineering lower / central / upper | Review lower / central / upper |
| --- | --- | --- | --- | --- |
| E06 | Capture a transcript with passage references | CAP-06 | 2 / 3 / 5 | 0 / 0 / 0 |
| E07 | Select context and resolve questions | CAP-10, CAP-13 | 2 / 3 / 5 | 1 / 1 / 2 |
| E08 | Draft needs, then derive requirements | CAP-11 | 3 / 4 / 7 | 0 / 1 / 2 |
| E09 | Check drafts and review trace links | CAP-12, CAP-14 | 2 / 3 / 5 | 0 / 0 / 0 |
| E10 | Support independent checking and correction capture | CAP-18, CAP-35 | 1 / 2 / 3 | 0 / 1 / 1 |
| E11 | Exercise the complete source-to-evidence workflow and repair it | CAP-06, CAP-10, CAP-11, CAP-12, CAP-13, CAP-14, CAP-18, CAP-35, CAP-38 | 2 / 3 / 5 | 1 / 1 / 2 |

- E06: Paste/upload one plain-text format; preserve the source revision and paragraph locators and identify repeated capture.
- E07: A person chooses exact context records, records questions/answers/deferrals, and sees missing required context.
- E08: Two explicit actions produce cited structured candidates. Requirements use reviewed needs and supplied risk/task context.
- E09: Check schema, required measurable fields, citation locators, and allowed link types. People revise/recheck and separately accept or reject proposed links.
- E10: A separate human opens underlying evidence, records findings and correction reasons, and then records the human disposition through the shared review path.
- E11: Check ambiguous input, unsupported output, invalid citations, model failure, rejected links, edited decisions, and saved-record retrieval; fix defects found in the bounded examples.

### P2

| Task | Work | Capabilities | Engineering lower / central / upper | Review lower / central / upper |
| --- | --- | --- | --- | --- |
| E12 | Import reference evidence and inspect traces | CAP-13, CAP-15 | 3 / 4 / 7 | 1 / 1 / 2 |
| E13 | Report a small set of defined coverage gaps | CAP-15 | 2 / 3 / 5 | 0 / 1 / 1 |
| E14 | Record a change and owned follow-up | CAP-16, CAP-14 | 2 / 3 / 5 | 0 / 0 / 0 |
| E15 | Traverse known links and explain consequences | CAP-17 | 2 / 3 / 5 | 0 / 0 / 0 |
| E16 | Extend independent review to the whole change | CAP-18, CAP-35 | 1 / 2 / 3 | 0 / 1 / 2 |
| E17 | Exercise change-review scenarios and repair them | CAP-15, CAP-16, CAP-17, CAP-18, CAP-14, CAP-35 | 2 / 3 / 5 | 1 / 1 / 2 |

- E12: Import one agreed record/link bundle, identify missing endpoints, and show a read-only table and record neighborhood.
- E13: Apply the agreed relationships, such as need-to-requirement and requirement/control-to-test; show the rule, record revision, and missing evidence.
- E14: Record old/proposed revisions, reason, scope, and update/relink/retest tasks with owner, reason, and disposition. Reuse only the new P0/P1 components built in this estimate.
- E15: Use one bounded traversal policy, retain explanatory paths, handle cycles, and show unavailable evidence without asserting that it has no impact.
- E16: A separate human inspects requirements, hazards, controls, tests, and labels, including supplied evidence beyond the graph. Capture findings, limits, and follow-up.
- E17: Check a threshold change, an omitted link, a graph cycle, missing context, and revised evidence. Retrieve each finding's version, reason, owner, and disposition.

## Milestones and dependencies

Use P0, then P1, then P2 for this estimate. This chosen order lets P2 use the new context lookup, trace-link lifecycle, independent review screen, and correction log built in P1. P2 does not need transcript ingestion as a product dependency. Choosing P2 first would move its shared prerequisite work into that first delivery and require a revised allocation.

| Milestone | Cumulative engineering lower / central / upper | Central focused engineering days | Completion evidence |
| --- | --- | ---: | --- |
| P0 complete | 12 / 18 / 30 | 3 | Launch the new workspace, retrieve exact record/decision revisions, retain a failed run, and reopen an exported record bundle. |
| P1 complete | 24 / 36 / 60 | 6 | Turn a representative transcript into independently checked and human-reviewed needs/requirements with citations, separately reviewed links, correction reasons, and retrievable records. Unsupported output is caught and edited records receive fresh checks. |
| P2 complete | 36 / 54 / 90 | 9 | A significant threshold change exposes affected requirements, controls, tests, and labels. Known-link paths explain the review set; independent inspection catches an omitted relationship. Findings retain versions, reasons, owners, and dispositions. |

The first milestone needs a named workflow owner, access to the chosen model provider, and an agreed local execution setup. P1 needs a representative transcript and domain answers. P2 needs a small agreed evidence/link bundle and a representative change. Prepare these alongside P0; otherwise their waiting time moves the delivery date.

## Converting effort into elapsed time

The reference staffing is one AI-assisted developer with 30 focused engineering hours per week, plus six combined hours per week of product/domain input and independent checking from colleagues. Staffing is an assumption awaiting team confirmation.

| Scenario | Engineering hours | Engineering weeks at 30 hours/week | Review hours | Review weeks at 6 hours/week |
| --- | ---: | ---: | ---: | ---: |
| Lower | 36 | 1.2 | 6 | 1.0 |
| Central | 54 | 1.8 | 11 | 1.8 |
| Upper | 90 | 3.0 | 19 | 3.2 |

These columns describe capacity demand. They are not a computed delivery schedule. Some review can happen during construction; final workflow checks must happen after the relevant implementation is ready. Review appointments, access delays, scope changes, and rework beyond the examples can extend elapsed time.

The central engineering workload takes 1.8 weeks at the reference capacity, or 2.7 weeks if the developer has 20 focused hours per week. A second developer does not automatically halve the duration because contracts, staged drafting, and final workflow checks have dependencies. Divide genuinely independent tasks and include coordination before changing the schedule.

## How to use and improve these numbers

1. Review the pilot boundary and task breakdown with the developer and domain/review colleagues. Change scope and hours together. Do not present a full catalogue estimate by multiplying its feature count by these package numbers.
2. Track active engineering, domain/review work, elapsed days, and blocked time separately. Include prompt experiments, developer intervention, corrections, and repairs in engineering actuals. Keep model latency that blocks progress visible without counting unattended runtime as developer effort.
3. After P0, compare actual hours with its 18-hour central allowance. After P1, compare actual hours with its own 18-hour allowance and inspect why tasks differed. Use those task-level findings to re-estimate the unstarted P2 work.
4. Record actual AI-assisted pace by type of work. Prompt/citation evaluation, trace traversal, reviewer screens, and connector mapping may have different rates. Only apply a package-wide actual-to-estimate ratio where remaining work is comparable.
5. Add later increments as separate estimates after selecting their scope and external systems. Scope expansion changes this estimate; it is not free work inside the same two-week target.

## Wording for colleagues

> "Our first planning estimate is about nine focused engineering days, plus roughly eleven hours of domain input and independent review, for a fresh-build pilot covering shared foundations, transcript-to-reviewed-evidence, and trace/change review. We are using the earlier demo's recalled two-to-three-day package pace as a rough starting point. A two-week target looks worth testing for this small scope; the current engineering scenarios span six to fifteen focused days. We will revise the remaining estimates after the first workflow, using actual effort and rework. Live integrations and the remaining lifecycle modules need separate estimates."

## Source and regeneration

The scope and capability IDs come from the local feature map. The timing anchor comes from the user's recollection in this conversation. The hours, staffing, pilot home, and scope boundaries are provisional assumptions for discussion. No historical timesheet or code-reuse saving has been inferred.

Edit [build_estimates.py](planning/build_estimates.py), then run `python3 docs/planning/build_estimates.py`. It regenerates this reference, the CSV worksheet, and the JSON estimate data. Validation checks capability IDs, staged minimum-dependency coverage, unique tasks, and ordered non-negative hours.
