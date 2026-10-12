# BlueBridge problem framing and planning brief

Status: working draft for discussion, 9 October 2026. This captures the requested framing and proposes the next steps. It does not change the prototype delivery plan or commit to a feature scope, supplier, or delivery date.

## The assignment

Explain the problem BlueBridge should solve, the jobs people need to complete across the development lifecycle, and how an internal tool could support those jobs in useful increments. Show how bought tools and existing processes cover the remaining jobs during that build.

The audience has not seen the full compliance demo. The explanation should therefore begin with their work and information flows. The demo can later supply examples and evidence of feasibility.

The user confirmed that the previous arrangement used Jira, GitHub, and substantial manual document processes. Future evidence homes are undecided. The new toolset and revised processes should keep pace with AI-powered software development. The internal demo's Cloudflare D1 database uses the SQLite dialect; it is a candidate home for structured records, with R2 holding file bytes.

The final format remains open. A useful target is a small presentation supported by a detailed working map. The working map should come first so that the diagram and slides express the same reasoning.

## Proposed problem statement

Teams create product information in conversations, documents, design work, tickets, code, reviews, and tests. People then have to turn that information into agreed product evidence, connect it across the development lifecycle, and keep those connections current when something changes.

BlueBridge should reduce the effort of capturing, structuring, linking, reviewing, and updating that evidence. A reviewer should be able to establish what was decided, where it came from, what implements it, how it was checked, and what a change affects.

It should also help BBT learn from corrections and failures in client projects. That feedback can inform reviewed improvements to prompts, checks, context selection, tools, and workflows from the first week of use.

This is a problem hypothesis to confirm with the people doing the work. Its value should be measured in completed jobs, review effort, fewer repeated entries, and fewer missed consequences.

## What the attachment contributes

The supplied `Design_Controls_Must_Have_Traceability_v3.drawio` contains five pages:

1. Data point trace, showing dependencies between individual evidence items.
2. Data point to document, showing where those items are recorded.
3. Document trace, showing dependencies aggregated at document level.
4. Simple traceability, showing needs, requirements, risk controls, verification, and validation.
5. V model, adding design and implementation levels, risk and usability work, and annotations for residence and process assistance.

Page 5 is the best starting point for the audience diagram. Pages 1 and 2 can help expand the detailed inventory and check for missing work. The attachment already distinguishes an element's residence from the process a tool assists. Preserve that distinction.

Use the V model to locate work and trace relationships. Add change and feedback loops so that it also describes ongoing maintenance. Source intake, risk management, usability, review, and change control span several levels.

The attachment's clause annotations are source material. This framing does not assess their regulatory accuracy or establish that every illustrated item applies to every BlueBridge product.

## The structure of the working map

Keep one connected mapping:

**Job → information and trace relationships → supporting features → work package → coverage during each phase.**

A job describes an outcome someone needs. A feature describes a way the tool helps achieve that outcome. One job may need several features, and one feature may serve several jobs.

For every job, capture:

| Field | What to record |
| --- | --- |
| Actor and trigger | Who does the work, and what starts it? |
| Desired outcome | What must they be able to establish or complete? |
| Inputs and origin | What information is created or used, and where? |
| Residence and authority | Where does the source live, and which system owns the resulting record? |
| Output | What evidence, decision, task, or document is produced? |
| Connections | Which upstream and downstream items use it, and what does each link mean? |
| Review and update | Who accepts it, and what happens if its source or a linked item changes? |
| Quality loops and feedback | What does the worker check, what receives independent scrutiny, and which corrections inform improvements to the process? |
| Current friction | What is slow, duplicated, ambiguous, or easy to miss today? |
| Success measure | How will we know the job became easier without losing necessary evidence? |

Information flow can mean derivation, reference, verification, validation, or a request for review. Label the relationship. An arrow should not imply that a whole document is copied or that approval transfers automatically.

## Starter job inventory

These are proposed job families to expand and validate, not a complete feature backlog. Actors and current systems need confirmation.

| ID | Job and likely actor | Inputs and likely current home | Output and connections |
| --- | --- | --- | --- |
| J01 | Capture a discussion without losing its product decisions. Product lead or engineer. | Slack threads, meeting transcripts, notes, and client documents in their source systems. | Preserved source revision; candidate decisions, needs, risks, and actions with source references. |
| J02 | Resolve ambiguity and agree what users need. Product lead with relevant reviewers. | Source material, intended use, user research, and clarification answers. | Reviewed user needs linked to their basis and eventual validation evidence. |
| J03 | Turn needs into testable requirements. Systems or software engineer. | User needs, constraints, system requirements, and risk controls. | Product and subsystem requirements with derivation links and acceptance criteria. |
| J04 | Explain how the design and implementation satisfy requirements. Architect and developer. | Requirements, architecture, design notes, tickets, code, and pull requests. | Design records and implementation references tied to exact revisions and requirements. |
| J05 | Identify risks and specify controls. Risk owner with engineers. | Intended use, system design, software, security, dependencies, and use-related analyses. | Hazards, risk assessments, and controls linked to requirements and evidence of control effectiveness. |
| J06 | Develop and evaluate the user interface. Designer and usability lead. | User tasks, critical tasks, use-related risks, designs, and formative studies. | UI requirements and evaluations linked to design changes and summative validation. |
| J07 | Plan and demonstrate verification. Test engineer with reviewer. | Requirements, risk controls, design levels, test cases, code revision, and execution results. | Reviewed test plans and results; trace coverage; defects and regression work. Unit, integration, subsystem, and system levels remain distinguishable. |
| J08 | Demonstrate that the product meets user needs. Validation or clinical lead. | User needs, intended use, validation scenarios, usability studies, and relevant clinical evidence. | Results linked to needs and claims, with unresolved evidence gaps visible. |
| J09 | Review the consequences of a change. Author and affected reviewers. | Changed source, requirement, design, code, test, risk, or label. | Impact assessment, assigned follow-up work, reviewed revisions, and updated trace links. |
| J10 | Establish a coherent reviewed state. Design reviewers and QA. | Candidate evidence, relationships, open issues, risk and test records. | Reviewed baseline with explicit versions and remaining issues. |
| J11 | Assemble the evidence needed for release or transfer. QA and release owner. | Baseline, implementation revision, verification, validation, residual risks, labels, and approvals. | Release or transfer decision and evidence package linked to the exact reviewed state. |
| J12 | Produce documents and answer traceability questions. Evidence author or reviewer. | Structured evidence, source references, baselines, and document templates. | Specifications, reports, matrices, and review packages with identifiable evidence membership. |
| J13 | Keep evidence current as external work changes. Record owners and reviewers. | New source revisions, ticket changes, commits, test runs, defects, and post-release feedback. | Recorded differences and review tasks; historical evidence remains available. |
| J14 | Manage dataset and model evidence when applicable. ML lead and reviewers. | Dataset provenance, splits, training records, model versions, acceptance criteria, and performance results. | Evidence linking model and dataset versions to requirements, risks, tests, and changes. |
| J15 | Reduce recurring mistakes in design-control work. Process owner with engineers and reviewers. | Reviewer edits, rejected requirements, QA comments, risk-review changes, missing traces, verification failures, audit observations, document rework, and manual agent redirection. | Investigated failure patterns and evaluated, versioned changes to prompts, checks, context, tools, and workflows. |

For each row, distinguish the source's home from the home of the reviewed evidence. Git may own code, a work tracker may own task state, and BlueBridge or a bought tool may own a reviewed requirement. Moving evidence ownership is a separate decision from importing a reference.

## Worked example: meeting transcript to reviewed product evidence

The job is to turn a discussion into an agreed, traceable product decision with less manual reconstruction.

| Step | Capability | Result |
| --- | --- | --- |
| Capture | Upload or paste a transcript; retain source identity, revision, and locators. | A recoverable source that later outputs can cite. |
| Analyse | Run a selected, versioned prompt against an agreed output structure. | Candidate decisions, needs, requirements, risks, and clarification questions. Start with a deliberately small output scope. |
| Resolve | Let the responsible person answer questions and correct the candidates. | Reviewed interpretation with a recorded basis. |
| Connect | Propose links to existing evidence and let a person confirm them. | Accepted relationships with defined meanings. |
| Save | Write accepted outputs to the designated evidence home. Preserve rejected or superseded proposals as appropriate. | Stable, versioned records that other lifecycle work can use. |
| Maintain | Compare a later source revision and identify affected outputs. | Follow-up review work rather than a silent rewrite. |

The feature description should name its trigger, inputs, prompt version, output schema, destination, trace links, human decision, and failure behaviour. Estimate the complete workflow, including review and correction.

A manual upload can support this job before a Slack or meeting-platform connector exists. Once a common intake and review path exists, the connectors can be independent additions.

In this workflow, the drafting agent's inner loop checks a candidate requirement and revises it. An outer loop independently examines its interpretation of the source and the related evidence. Human edits and both loops' findings supply examples for the meta-loop. Record which candidate revision each check examined so a later edit does not inherit an earlier passing result.

## Loop engineering applied to design control

Use the V model to show which evidence must connect. Use the loops to show how people and agents improve the work and catch mistakes throughout that model. These are dimensions of the same workflows, not additional lifecycle phases.

| Loop | Typical cadence | Purpose and design-control example | Output |
| --- | --- | --- | --- |
| Inner loop | Seconds to minutes while doing the work. | The drafting agent checks a requirement for measurability, formatting, source support, proposed trace links, and known rules, then revises it. | A revised candidate plus recorded checks and unresolved issues. |
| Outer loop | Per work item, PR, significant design change, or document package. | An independent checker interrogates the result and its wider consequences, including impacted requirements, hazards, mitigations, verification tests, trace links, and configuration consistency. | Findings and follow-up work tied to the exact versions examined. |
| Meta-loop | Daily, weekly, or monthly according to the volume and importance of feedback. | A process owner examines patterns across corrections and failures, investigates why they recur, and changes the way work is generated and checked. | Evaluated improvements to prompts, rules, context selection, tools, and workflows, with a versioned record of the change. |

The distinction between inner and outer loops is independence and breadth. An outer check can run every time someone proposes a significant change. Its trigger need not be a formal regulatory gate or an FDA-facing review. Formal approval remains a separate decision where the workflow requires it.

Design the outer check on the assumption that the worker may have missed something. It can use a separate reviewer or agent, a different prompt, independently selected context, and, where useful, a different model. Record those choices. A different model alone does not establish independence, and another pass over the worker's own summary may reproduce its omissions. The checker needs access to the underlying source, relevant evidence, and known coverage rules.

For example, if a developer changes an alert threshold, the inner loop may check the code and local tests. The outer loop should independently inspect the associated requirement, hazard, control, verification criteria, labels, and trace relationships. The meta-loop asks why an affected item was missed and whether the context selection, trace rules, or review instructions need to change.

The strongest proposed meta-loop inputs are everyday project feedback: human edits, rejected requirements, QA comments, risk-review changes, missing traces, verification failures, audit observations, recurring document rework, and manual redirection of an agent. Regulatory feedback, including FDA feedback, is an external signal into this loop. It does not define the loop or its cadence.

Learning here means deliberate changes to the working system. Capture a correction with its original source and output, the reason, the relevant prompt and rule versions, and the subsequent review outcome. Investigate recurring causes, propose a change, and evaluate it against relevant examples before adopting a new version. Include cases where the old behaviour was correct so that fixing one pattern does not introduce another. Previously accepted product evidence remains subject to its existing change process.

## Loop capabilities in the roadmap

Attach loop capabilities to each useful workflow rather than requiring a separate loop-engineering package before any delivery:

| Capability | Minimum useful version | Later increments and dependencies |
| --- | --- | --- |
| Inner-loop checking and revision | Defined checks and a bounded revise-and-recheck path for one output type; unresolved issues go to a person. | More evidence types, tool-assisted checks, and targeted repairs after their rules and inputs are defined. |
| Independent outer checking | A separate reviewer or checker inspects the candidate and accessible linked evidence; findings remain distinct from approval. | Automated trigger handling, broader impact inspection, and version-aware reruns require usable references and relevant evidence access. |
| Feedback capture | Retain corrections, rejection reasons, check results, and processing versions from the first useful workflow. | Structured categories and cross-project analysis once records are sufficiently consistent and access is appropriate. |
| Meta-loop improvement | Regular human review of feedback and a recorded, evaluated change to a prompt, rule, tool, or workflow. | Automated pattern summaries and a larger regression set as reviewed examples accumulate. |

Start feedback capture with P0 and P1. A manual outer check and manual meta-loop review can operate while automated coverage is still being built. Cross-V-model checking can broaden through P2 and P3. The record of feedback should continue across internal tools, bought tools, and manual reviews.

Measure first-pass acceptance, correction effort, recurring failure rates, missed impacts, and unhelpful checker findings. A decline in flags alone does not show improvement; reviewers may have less visibility or the checks may have become weaker.

## Work packages and dependency types

Define packages by the useful workflow they deliver. Ingestion and orchestration are useful capability groupings, but a package also needs a user outcome and a completion gate.

| Dependency type | Meaning | Example |
| --- | --- | --- |
| Hard prerequisite | A capability needs another capability to operate. | A result-to-test link needs an identifiable test and execution record. |
| Required together for the outcome | The parts can be built separately, but the promised workflow needs both. | AI extraction and human acceptance are both needed for transcript-to-reviewed-evidence. |
| Workflow affinity | The parts are convenient together and can ship independently. | Slack and meeting-transcript connectors use the same intake path. |
| External prerequisite | Delivery depends on something outside the feature implementation. | API access, usable source data, record ownership, or reviewer availability. |

Record the minimum version of each prerequisite. A first useful slice may use manual import, manual link confirmation, and evidence stored in a bought tool. It need not contain the final form of every shared capability.

The following is a candidate sequence for the framing exercise, separate from the repository's WP-00 to WP-60 implementation plan. A [first estimation pass](bluebridge-estimation.md) now covers a narrow fresh-build P0/P1/P2 pilot; other increments remain unestimated.

| Candidate package | Useful outcome | Minimum prerequisites | Possible increments |
| --- | --- | --- | --- |
| P0 Evidence conventions and ownership | People agree on record types, IDs, link meanings, destinations, and review responsibilities. | Access to representative workflows and responsible people. | Start with one product and a narrow evidence vocabulary. Existing tools can supply storage and review. |
| P1 Discussion to reviewed evidence | A person turns one source into accepted evidence with citations and links. | Relevant P0 conventions, one intake method, one output type, and an acceptance path. | Manual transcript intake first; document intake and individual connectors later. |
| P2 Traceability and change review | A reviewer finds gaps and the consequences of a changed item. | Identifiable records and usable relationships, imported or internally managed. | Read-only trace view first; then reviewed link changes and bounded impact assistance. |
| P3 Implementation and test evidence | A reviewer connects requirements to design, code, and current verification results. | P0 conventions, relevant trace relationships, access to implementation and test records. | Manual references first; then work-tracker, repository, and CI adapters independently. |
| P4 Baselines, documents, and release support | A team can review a coherent state and assemble its evidence package. | Versioned evidence and the reviews, risk, verification, and validation records needed for the chosen scope. | Baseline-linked documents first; expand review and release workflows by demonstrated need. |

These packages may branch and overlap. Internal source intake is not a prerequisite for a trace view over bought-tool records. A document export need not wait for automated CI intake. The detailed feature dependencies should determine scheduling.

For each package, record scope, excluded increments, actor, completion gate, dependencies, resource assumptions, estimated effort range, expected value, and interim coverage. Keep elapsed time separate from engineering effort. The first estimation pass assumes a new codebase, narrow manual integrations, and provisional staffing.

## Hybrid build and buy coverage

The lifecycle jobs continue throughout the build. For every phase, assign each job to an internal capability, a bought tool, an existing engineering tool, or a manual process. Some jobs will span several of these.

| Job | Coverage before internal delivery | Internal contribution when delivered | Condition for changing ownership |
| --- | --- | --- | --- |
| Transcript to reviewed need | Manual extraction plus current evidence store or bought tool. | Drafting, citations, clarification, and review assistance. | Accepted outputs and source links reach the agreed evidence home. Ownership need not move. |
| Requirement-to-test traceability | Bought lifecycle tool and test processes, provisionally assumed. | Trace inspection, gap checks, and later controlled relationship management. | Relevant records, link meanings, history, and reviewer workflow survive the transition. |
| Code and test execution | Repository and CI systems. | References, captured observations, and evidence review. | These tools can retain ownership of code and executions throughout. |
| Baseline and release evidence | Bought tool plus current QA process, provisionally assumed. | Selected review, baseline, document, or release workflows. | The chosen internal workflow has passed agreed acceptance checks and records remain accessible. |

Treat bought-tool coverage as a planning assumption until checked. The suppliers mentioned in the conversation need exact identification before comparison. Existing project notes refer to Infera and Ketryx; no current supplier capabilities have been verified for this brief.

Evaluate suppliers later against the job map, including interfaces and export of records, relationships, versions, source provenance, and review history. A tool that fills a short-term gap should also support the intended coexistence or handover.

Internal capability can replace selected workflows over time. There is no requirement to replace every external system. At each handover, identify one authoritative home for each controlled record and preserve a usable route to historical decisions.

## Relationship to the existing demo

The repository's [product architecture](product-architecture.md), [authority model](authority-model.md), and [delivery plan](delivery-plan.md) provide design precedents. Their recorded statuses have not been reverified during this framing exercise. The user has chosen a fresh-build estimate; existing implementation receives no reuse credit.

Develop the desired job map independently, then map the demo onto it. Label each relevant capability as demonstrated, implemented locally, planned, or absent using supporting evidence. This identifies comparable work for calibration and areas the earlier demo did not cover.

The framing roadmap should not inherit the demo's package order automatically. The audience needs to understand the proposed user outcomes and dependencies before seeing implementation details.

## Proposed next steps

1. Confirm the audience and the decision the presentation should support. A build investment, a supplier choice, and agreement on the problem require different emphasis.
2. Expand and validate the starter job inventory against page 5, using pages 1 and 2 to check evidence detail and residence. Identify the actors, current homes, pain points, and change loops.
3. Work through two representative scenarios: a meeting introduces a new need; a developer change affects an existing requirement, risk control, and test. Use them to test the information flows and expose missing jobs.
4. Map features onto the jobs, including minimum manual versions, later automation, and dependency types. For each workflow, specify inner checks, independent outer checks, and feedback for the meta-loop. Group features into complete useful workflows.
5. Estimate the fresh-build workflows, using the demo's recalled pace as an initial timing reference and counting new shared components once. Map interim coverage and record staffing assumptions. Replace provisional timing with actual effort after the first new workflow.
6. Produce the audience artifact from that map. A reasonable initial format is three slides: the problem and V-model information flow; jobs and supporting capabilities; phased delivery with dependencies and interim coverage. Show a compact loop annotation on the capabilities slide and feedback capture in the roadmap. Keep the detailed loop design and tables as supporting material.

The [first jobs-and-information-flow map](bluebridge-jobs-map.md) is available with an [interactive visual reference](bluebridge-jobs-map.html) and [editable draw.io views](bluebridge-jobs-map.drawio). The user has reviewed the job families and regards them as a reasonable working basis. Responsibilities and future record homes remain provisional.

The [first supporting feature map](bluebridge-feature-map.md) now defines minimum capabilities, later increments, hard and conditional prerequisites, useful package outcomes, and interim coverage for every job. Its [visual reference](bluebridge-feature-map.html) provides package and job views; the [editable package diagram](bluebridge-feature-roadmap.drawio) shows the main sequencing choices. The proposed first slice turns one source into reviewed needs and requirements with citations, confirmed links, target-home persistence, and correction feedback. The [first fresh-build estimation pass](bluebridge-estimation.md) adds provisional effort scenarios, a task worksheet, and capacity assumptions for the minimum P0/P1/P2 path.
