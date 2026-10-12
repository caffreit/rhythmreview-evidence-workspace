# BlueBridge jobs and information-flow map

Status: first working map, 9 October 2026. Confirmed context and proposed operating model are distinguished below.

Open the [visual map](bluebridge-jobs-map.html), or edit the [three-view draw.io map](bluebridge-jobs-map.drawio). The visual map also includes expandable job details. This catalogue is the supporting reference.

## Context and scope

- Confirmed by the user: the previous arrangement used Jira, GitHub, and substantial manual document-based processes. The organisation is in transition; future authoritative homes for requirements, risk, and test evidence have not been decided.
- The purpose of the new toolset and process redesign is to keep pace with AI-powered software development. Frequent capture and independent checking should fit normal work rather than depend on retrospective document assembly.
- The internal compliance demo is one candidate. It uses Cloudflare D1 with the SQLite dialect for structured records and R2 for file bytes. This describes the demo, not an agreed future tool allocation.
- The user has reviewed the job families and regards them as a reasonable working basis. Roles, exact triggers, granularity, review authority, applicable evidence scope, pain points, and measures remain proposed for validation. No supplier coverage, delivery date, or current connector capability is assumed.

This map develops the [framing brief](bluebridge-problem-framing.md). It describes jobs and their information contracts before feature selection, work-package estimation, or supplier comparison. J01–J15 preserve the starter IDs. J16 adds explicit planning, scope, and record-ownership work.

The supplied draw.io pages 4 and 5 anchor the needs/design/test relationships. Pages 1 and 2 inform the expanded risk, usability, dataset/model, document, and release inventory. Clause annotations are not assessed here.

## How to read the map

The V-model view locates evidence and matching verification or validation work. The source-flow view distinguishes captured sources, candidates, independent findings, human decisions, controlled versions, and outputs. The change-loop view shows drift, impact work, correction, and method improvement.

Arrows mean that information in the source record is used by the target record or activity. They may indicate derivation, reference, test planning, execution, review, or feedback. They do not imply copying a whole document, transferring authority, or automatic acceptance. Dashed arrows in the diagrams show context or matching trace relationships; they do not label implementation status or known gaps.

A record code names an information type, not one file or database table. Structured items can appear in several document views. Stable item IDs, exact versions, typed links, and separately recorded decisions make those views reconcilable.

## Information homes and authority

Separate the original source, an observed/captured revision, a reviewed interpretation, and a rendered output. A connector can capture a reference while the source system remains authoritative for its own content. The internal tool and a bought tool can share a workflow while each controlled record has one agreed authoritative home.

The map does not designate Jira as the future home of requirements or GitHub as the future repository. Source systems, repository/CI, work tracking, and controlled evidence management are categories whose selected products remain provisional. D1 and R2 are the current demo implementation.

### SRC: Source revisions

Home and authority: Originating source system; captured revision in the chosen evidence store.

Information unit: Slack thread, transcript, authored note, document, or external observation with origin, revision, date, and exact locator.

### SCOPE: Product scope and planning basis

Home and authority: Chosen controlled evidence store, provisional.

Information unit: Intended use, population, scope, owners, criteria, methods, and applicable project agreements.

### CLAR: Clarification and decision

Home and authority: Chosen controlled evidence store, provisional.

Information unit: Question, response, responsible person, rationale, and source or candidate revision.

### NEED: User need

Home and authority: Chosen controlled evidence store, provisional.

Information unit: Stable item ID; individual version with statement, basis, owner, and decision state.

### SYS: Product / system requirement

Home and authority: Chosen controlled evidence store, provisional.

Information unit: Individual requirement with parent need, acceptance criteria, version, and review state.

### SUB: Software / hardware / UI / labelling requirement

Home and authority: Chosen controlled evidence store, provisional.

Information unit: Individual requirement with level, allocation, acceptance criteria, version, and review state.

### ARCH: Architecture and components

Home and authority: Chosen design evidence store, provisional; repository references where relevant.

Information unit: Versioned component/interface identity and requirement allocation, distinguishing intended and observed design.

### DESIGN: Detailed design

Home and authority: Chosen design evidence store or repository, provisional.

Information unit: Unit or design element, rationale, interfaces, and links to requirements and components.

### WORK: Implementation work item

Home and authority: Chosen work tracker, provisional; Jira is part of the previous arrangement.

Information unit: Task identity, scope, owner, status, and controlled-record references.

### CODE: Implementation and build

Home and authority: Chosen repository and build system, provisional; GitHub is part of the previous arrangement.

Information unit: Repository, path, exact commit, PR review, build identity, and relevant artifacts.

### HAZ: Hazard and risk analysis

Home and authority: Chosen risk evidence store, provisional.

Information unit: Hazard, hazardous situation, causes, initial assessment, assumptions, and analysis revision.

### CTRL: Risk control

Home and authority: Chosen risk evidence store, provisional.

Information unit: Individual control with rationale, implementation reference, and effectiveness criteria.

### RISK: Residual-risk decision

Home and authority: Chosen controlled evidence store, provisional.

Information unit: Risk evaluation and acceptance decision tied to control, test, validation, and product versions; overall evaluation where applicable.

### USE: Use and usability evidence

Home and authority: Chosen usability evidence store, provisional.

Information unit: User profile, use environment, task, critical task, use-related risk, and formative-study records.

### TEST: Verification plan / test case

Home and authority: Chosen test or evidence system, provisional.

Information unit: Stable test ID and exact plan version, level, acceptance criteria, required configuration, and traced item.

### RUN: Verification execution and results

Home and authority: Execution system owns raw result; reviewed reference and disposition in the chosen evidence store.

Information unit: Test-plan version, code/build version, environment, result, attachments, and execution-review decision. A new run is a new record.

### DEFECT: Anomaly / defect

Home and authority: Chosen issue tracker owns work state; risk and evidence dispositions retain their own owners.

Information unit: Failed expectation, affected version, risk assessment, remediation, retest, and release disposition.

### VP: Validation plan / protocol

Home and authority: Chosen validation evidence store, provisional.

Information unit: Need or claim, population, intended use, scenarios, acceptance criteria, and evaluation configuration.

### VR: Validation and clinical results

Home and authority: Study system owns original results; reviewed evidence and interpretation in the chosen evidence store.

Information unit: Protocol version, product version, per-need or per-claim result, critical-task outcomes, and limitations.

### ML: Dataset and model evidence, if applicable

Home and authority: Chosen dataset/model systems own artifacts; controlled references retain exact versions.

Information unit: Provenance, train/tune/test splits, test-set lock, model/training version, performance, subgroup results, and change scope.

### CLAIM: Product / clinical claim

Home and authority: Chosen controlled evidence store, provisional.

Information unit: Claim wording, intended population, supporting evidence, limitations, and approved version.

### LABEL: Labelling and instructions for use

Home and authority: Chosen controlled evidence store, provisional.

Information unit: Versioned label content, claims, risk disclosure, and associated product/release scope.

### LINK: Trace relationship

Home and authority: Chosen controlled relationship store, provisional.

Information unit: Link identity, endpoint IDs and reviewed version/baseline context, defined meaning, rationale, proposal/change state, and review history. A similarity suggestion is distinct from a confirmed trace.

### REVIEW: Check, finding, and human decision

Home and authority: Chosen review/evidence system, provisional.

Information unit: Keep automated finding and human disposition distinct. Record object/version, context, checker or reviewer, method, reason, and outcome.

### CHANGE: Change and impact work

Home and authority: Chosen change/evidence system, provisional.

Information unit: Trigger, old and proposed versions, impacted records, links, follow-up owners, review decisions, and unresolved work.

### BASE: Reviewed baseline

Home and authority: Chosen controlled evidence store, provisional.

Information unit: Exact reviewed evidence versions, relationship set, relevant decisions, and unresolved dispositions.

### DOC: Document snapshot / package

Home and authority: Chosen document/evidence store, provisional.

Information unit: Exact baseline, template/renderer versions, evidence membership, rendered files, and package-review state.

### REL: Release / transfer record

Home and authority: Chosen release/evidence system, provisional.

Information unit: Baseline, build, applicable verification/validation, risk decisions, labels, open anomalies, package, and separate release decision.

### FB: Correction and failure feedback

Home and authority: Chosen feedback/evaluation store, provisional; preserve links to project records.

Information unit: Before/after, reason, source and output revisions, prompt/rule/tool versions, checker finding, human disposition, and outcome.

### METHOD: Working methods and evaluation evidence

Home and authority: Versioned configuration/evaluation store, provisional.

Information unit: Prompt, schema, rule, context-selection method, tool configuration, representative examples, evaluation result, and adoption decision.

## Jobs and information contracts

Each job states proposed actors, trigger, inputs, outputs, decision, handoff, change behaviour, loops, and value measures. Friction statements are hypotheses to check with the team. Human role names describe responsibilities; they do not imply that every decision belongs to QA.

### J01: Capture information with a usable source reference

Actor: Meeting participant, product lead, engineer, or source owner.

Trigger: A discussion, document, note, or new source revision contains product information.

Inputs: `SRC` Source revisions.

Tasks:

1. Capture the relevant thread, transcript, note, or document revision.
2. Record origin, author/date where available, revision, and exact locators.
3. Identify missing context, ambiguity, and candidate decisions for follow-up.

Outputs: `SRC` Source revisions; `CLAR` Clarification and decision.

Decision: A source owner confirms usable capture; candidate statements still need their own review.

Handoff: J02, J03, J05, J06, or J09 receives the relevant source and questions.

When something changes: A new source revision raises J13 drift review; earlier interpretations retain their original citation.

Inner loop: Check extraction completeness, locators, duplicates, and structured output.

Outer loop: Inspect the original source for omitted qualifiers, disagreements, or unsupported interpretation.

Feedback to the meta-loop: Capture extraction errors, missed decisions, and manual redirection.

Friction hypothesis: Decisions may be reconstructed later from scattered conversations.

Measure: Capture effort and the proportion of outputs with usable exact source references.

### J02: Agree the user need and its intended-use context

Actor: Product owner with user, clinical, or domain reviewers.

Trigger: New evidence, an unresolved clarification, or a change affects what users need.

Inputs: `SRC` Source revisions; `SCOPE` Product scope and planning basis; `CLAR` Clarification and decision; `USE` Use and usability evidence.

Tasks:

1. Identify the user, problem, use environment, and desired outcome.
2. Resolve ambiguity with the responsible person.
3. Record proposed product claims separately from user needs; supporting evidence is reviewed in J08.
4. Review each need and retain its source and rationale.

Outputs: `NEED` User need; `CLAIM` Product / clinical claim; `CLAR` Clarification and decision; `REVIEW` Check, finding, and human decision.

Decision: The designated need owner/reviewer accepts, revises, rejects, or defers the specific version.

Handoff: J03 derives requirements; J08 defines validation against the need.

When something changes: A changed need prompts review of derived requirements, use-related risks, validation, and claims through J09.

Inner loop: Check clear actor/outcome, source support, duplicates, and unresolved scope.

Outer loop: Challenge interpretation against underlying sources, intended use, and existing needs.

Feedback to the meta-loop: Capture reviewer rewrites and rejected or unsupported needs.

Friction hypothesis: People may confuse a discussion suggestion with an agreed need.

Measure: Time to an accepted need and reviewer correction effort.

### J03: Translate needs and controls into testable requirements

Actor: Systems, software, hardware, or product engineer.

Trigger: A reviewed need, control, constraint, or parent requirement needs implementation detail.

Inputs: `NEED` User need; `SCOPE` Product scope and planning basis; `CLAR` Clarification and decision; `CTRL` Risk control; `USE` Use and usability evidence; `SYS` Product / system requirement; `LINK` Trace relationship.

Tasks:

1. Derive product/system requirements and decompose them into software, hardware, UI, and labelling requirements.
2. Specify measurable acceptance criteria, allocation, and source/parent links.
3. Review requirement versions and proposed links separately.

Outputs: `SYS` Product / system requirement; `SUB` Software / hardware / UI / labelling requirement; `LINK` Trace relationship; `REVIEW` Check, finding, and human decision.

Decision: The assigned discipline reviewer accepts the requirement and its links. Parent acceptance does not accept children.

Handoff: J04 uses approved design inputs; J07 plans verification; J12 uses the exact versions in specifications.

When something changes: A changed criterion or allocation prompts design, control, test, and label review through J09.

Inner loop: Check measurability, schema, units, source support, and allowed link types; revise within a bounded loop.

Outer loop: Independently inspect consistency with needs, risk controls, related requirements, and testability.

Feedback to the meta-loop: Capture rejected requirements, ambiguous criteria, missing links, and recurring reviewer edits.

Friction hypothesis: Requirements may be duplicated in tickets or rewritten retrospectively.

Measure: First-pass acceptance, correction effort, and unresolved source/trace gaps.

### J04: Connect intended design, implementation work, and what was built

Actor: Architect and developer, including coding agents under an assigned owner.

Trigger: A requirement is allocated, a design changes, or implementation/PR evidence becomes available.

Inputs: `SYS` Product / system requirement; `SUB` Software / hardware / UI / labelling requirement; `CTRL` Risk control; `ARCH` Architecture and components; `DESIGN` Detailed design; `WORK` Implementation work item; `CODE` Implementation and build; `LINK` Trace relationship.

Tasks:

1. Allocate requirements to components, interfaces, and detailed design.
2. Create implementation tasks that reference controlled IDs.
3. Capture authored design rationale and as-built observations tied to exact commits and PRs.
4. Review mismatches between intended design and implementation.

Outputs: `ARCH` Architecture and components; `DESIGN` Detailed design; `WORK` Implementation work item; `CODE` Implementation and build; `LINK` Trace relationship; `REVIEW` Check, finding, and human decision.

Decision: Design reviewer owns design acceptance; repository reviewers own PR decisions. Neither decision automatically approves the other record.

Handoff: J07 consumes exact design and build references; J09 receives design/implementation mismatches.

When something changes: Code, interface, dependency, or task changes prompt review of the associated design, requirements, risk, and tests.

Inner loop: Check local design/code constraints, referenced IDs, and local tests.

Outer loop: Inspect requirement and control coverage, component boundaries, and configuration consistency beyond the local change.

Feedback to the meta-loop: Capture missed allocations, design/code divergence, PR corrections, and agent redirection.

Friction hypothesis: The reason for a code change may remain in a PR while design evidence becomes stale.

Measure: Effort to reconstruct requirement-to-build evidence and unresolved design/implementation mismatches.

### J05: Analyse risk, define controls, and assess residual risk

Actor: Risk owner with engineering, clinical, security, usability, and QA reviewers.

Trigger: Scope/design changes, a hazard is identified, or control/test evidence changes.

Inputs: `SCOPE` Product scope and planning basis; `NEED` User need; `ARCH` Architecture and components; `CODE` Implementation and build; `USE` Use and usability evidence; `ML` Dataset and model evidence, if applicable; `HAZ` Hazard and risk analysis; `RUN` Verification execution and results; `VR` Validation and clinical results; `LINK` Trace relationship.

Tasks:

1. Record hazards, causes, assumptions, and the relevant risk analyses, including security and dependencies where applicable.
2. Define controls and translate them into requirement/design inputs.
3. Define how implementation and effectiveness will be checked.
4. Evaluate residual risk against current evidence and record the responsible decision.

Outputs: `HAZ` Hazard and risk analysis; `CTRL` Risk control; `RISK` Residual-risk decision; `LINK` Trace relationship; `REVIEW` Check, finding, and human decision.

Decision: The named risk authority records acceptance or further work for the relevant product state.

Handoff: J03/J04 implement controls; J07 verifies them; J08 contributes use/clinical evidence; J11/J12 use risk decisions and disclosures.

When something changes: Changed assumptions, controls, failures, or use conditions trigger risk reassessment and linked follow-up.

Inner loop: Check required fields, criteria, control references, and evidence versions.

Outer loop: Challenge missing hazards, ineffective controls, conflicting requirements, and unsupported residual-risk conclusions.

Feedback to the meta-loop: Capture risk-review changes, missing hazards, and recurring control-evidence gaps.

Friction hypothesis: Risk records may lag behind implementation and test changes.

Measure: Time to assess a change and the number/type of unresolved control-evidence gaps.

### J06: Connect user tasks, interface design, and usability evidence

Actor: Designer and usability lead with product and risk reviewers.

Trigger: A task, user profile, interface, or use-related risk changes.

Inputs: `SRC` Source revisions; `SCOPE` Product scope and planning basis; `NEED` User need; `USE` Use and usability evidence; `HAZ` Hazard and risk analysis; `SUB` Software / hardware / UI / labelling requirement; `CODE` Implementation and build.

Tasks:

1. Describe user profiles, environment, tasks, and critical tasks.
2. Use task/risk evidence to define UI requirements.
3. Record formative evaluations and resulting changes.
4. Connect summative evaluation plans/results to critical tasks and needs.

Outputs: `USE` Use and usability evidence; `SUB` Software / hardware / UI / labelling requirement; `VP` Validation plan / protocol; `VR` Validation and clinical results; `REVIEW` Check, finding, and human decision.

Decision: Assigned design/usability reviewers accept interpretations and required changes; risk acceptance has its own owner.

Handoff: J02/J03 receive task evidence; J05 receives use-related risk; J08 receives summative validation evidence.

When something changes: Changed users, tasks, interface, or use errors trigger requirement, risk, and evaluation review.

Inner loop: Check task IDs, design versions, critical-task links, and study/result structure.

Outer loop: Inspect whether tasks and use-related controls are covered by the UI design and evaluation scope.

Feedback to the meta-loop: Capture missing tasks, repeated use errors, and study/document rework.

Friction hypothesis: Task analyses, UI designs, and evaluation results may be maintained separately.

Measure: Effort to trace a critical task through UI requirements to evaluated outcomes.

### J07: Plan verification and preserve results at every V-model level

Actor: Test engineer or developer with assigned verification reviewer.

Trigger: Requirements/design need tests, a build is ready, or a change requires regression.

Inputs: `SYS` Product / system requirement; `SUB` Software / hardware / UI / labelling requirement; `ARCH` Architecture and components; `DESIGN` Detailed design; `CTRL` Risk control; `CODE` Implementation and build; `TEST` Verification plan / test case; `CHANGE` Change and impact work; `LINK` Trace relationship.

Tasks:

1. Plan unit tests against detailed design, integration tests against components/interfaces, subsystem tests against allocated requirements, and system tests against system requirements.
2. Record test identity, plan version, acceptance criteria, configuration, and traced items.
3. Execute against an exact build and retain raw results and attachments.
4. Review results, record anomalies, and determine relevant regression work.

Outputs: `TEST` Verification plan / test case; `RUN` Verification execution and results; `DEFECT` Anomaly / defect; `LINK` Trace relationship; `REVIEW` Check, finding, and human decision.

Decision: The assigned reviewer disposes of each execution and its applicability. A passing run alone does not approve a release.

Handoff: J05 reviews control evidence; J08 references the verified configuration; J11 consumes applicable results and dispositions.

When something changes: A changed test, requirement, build, environment, or failed execution prompts freshness, regression, and impact review.

Inner loop: Check test schema, criteria, configuration, raw-result integrity, and local failures.

Outer loop: Independently inspect requirement/control coverage, missing tests, stale runs, and consistency across levels.

Feedback to the meta-loop: Capture verification failures, missing coverage, unreliable checks, and incorrect execution associations.

Friction hypothesis: A test result may be available without a reliable link to the requirement and release version.

Measure: Coverage gaps, stale evidence, result-review effort, and missed required regression.

### J08: Validate user needs and support applicable product claims

Actor: Validation, usability, or clinical lead with assigned reviewers.

Trigger: A product version is evaluated, a need/claim changes, or new study evidence arrives.

Inputs: `NEED` User need; `SCOPE` Product scope and planning basis; `USE` Use and usability evidence; `CLAIM` Product / clinical claim; `VP` Validation plan / protocol; `CODE` Implementation and build; `RUN` Verification execution and results; `ML` Dataset and model evidence, if applicable; `LINK` Trace relationship.

Tasks:

1. Define representative needs, populations, scenarios, critical tasks, and applicable claims.
2. Specify criteria and the exact evaluation configuration.
3. Record results per need/claim, limitations, and unresolved gaps.
4. Review conclusions and route failures back to needs, design, risk, or evidence collection.

Outputs: `VP` Validation plan / protocol; `VR` Validation and clinical results; `CLAIM` Product / clinical claim; `LINK` Trace relationship; `REVIEW` Check, finding, and human decision.

Decision: Assigned reviewers assess whether the evidence supports the specific need or claim. Verification success does not establish validation.

Handoff: J05 uses relevant results for risk decisions; J11/J12 use reviewed conclusions and limitations.

When something changes: A changed need, claim, population, interface, model, or evaluated configuration prompts validation-scope review.

Inner loop: Check protocol/result association, criteria, population, and configuration references.

Outer loop: Challenge representativeness, uncovered needs/critical tasks, claim support, and interpretation of failures.

Feedback to the meta-loop: Capture validation failures, unsupported claims, study corrections, and repeated evidence gaps.

Friction hypothesis: Validation conclusions may be stored as reports with weak links to individual needs.

Measure: Effort to establish per-need/claim support and unresolved validation gaps.

### J09: Determine and resolve the consequences of a change

Actor: Change author and reviewers from affected disciplines.

Trigger: A significant source, requirement, design, code, risk, test, label, or relationship changes.

Inputs: `SRC` Source revisions; `CHANGE` Change and impact work; `BASE` Reviewed baseline; `NEED` User need; `SYS` Product / system requirement; `SUB` Software / hardware / UI / labelling requirement; `ARCH` Architecture and components; `CODE` Implementation and build; `HAZ` Hazard and risk analysis; `CTRL` Risk control; `TEST` Verification plan / test case; `RUN` Verification execution and results; `VR` Validation and clinical results; `LABEL` Labelling and instructions for use; `LINK` Trace relationship.

Tasks:

1. Identify the old state, proposed state, reason, and change scope.
2. Inspect known links and independently look for missing relationships or consequences.
3. Assign updates, relinking, retesting, and reviews to owners.
4. Resolve or explicitly disposition findings before advancing the changed records.

Outputs: `CHANGE` Change and impact work; `LINK` Trace relationship; `REVIEW` Check, finding, and human decision; `WORK` Implementation work item.

Decision: Affected reviewers decide which impacts are real and what follow-up is required; the author does not approve the agent's conclusions by default.

Handoff: J02 through J08 and J12 receive named follow-up work; J10 receives the reviewed candidate state.

When something changes: A candidate edit or new external revision makes version-bound checks and decisions subject to freshness review.

Inner loop: Check the proposed change and its known direct relationships.

Outer loop: Independently interrogate impacted requirements, hazards, controls, tests, labels, configuration, and potentially absent links.

Feedback to the meta-loop: Capture missed impacts, false alarms, reviewer additions, and manually redirected analysis.

Friction hypothesis: People may rely on memory to identify impacts across disconnected records.

Measure: Impact-review effort, missed consequential impacts, and unhelpful findings.

### J10: Establish a coherent reviewed baseline

Actor: Design reviewers and designated baseline authority.

Trigger: A change or review package has a candidate evidence state ready for a decision.

Inputs: `CHANGE` Change and impact work; `REVIEW` Check, finding, and human decision; `NEED` User need; `SYS` Product / system requirement; `SUB` Software / hardware / UI / labelling requirement; `ARCH` Architecture and components; `DESIGN` Detailed design; `HAZ` Hazard and risk analysis; `CTRL` Risk control; `USE` Use and usability evidence; `TEST` Verification plan / test case; `ML` Dataset and model evidence, if applicable; `CLAIM` Product / clinical claim; `LABEL` Labelling and instructions for use; `LINK` Trace relationship.

Tasks:

1. Select exact evidence and relationship versions for the proposed scope.
2. Check consistency, completeness, current review decisions, and unresolved issues.
3. Return work for revision or explicitly disposition it.
4. Record the baseline decision and retain the previous baseline.

Outputs: `BASE` Reviewed baseline; `REVIEW` Check, finding, and human decision.

Decision: The designated authority accepts the named evidence state. Baseline acceptance and release approval remain separate.

Handoff: J12 renders controlled views; J11 references the baseline in release/transfer work; J09 uses it as the comparison state.

When something changes: New candidate versions require relevant checks and reviews to run again against that state.

Inner loop: Check membership, IDs, version freshness, and known consistency rules.

Outer loop: Independently inspect package-wide consistency and whether unresolved work changes the decision.

Feedback to the meta-loop: Capture returned packages, stale decisions, and repeated coherence findings.

Friction hypothesis: Different documents may describe different versions of the product.

Measure: Baseline-review effort and unresolved or recurring configuration inconsistencies.

### J11: Establish release or transfer readiness and record the decision

Actor: QA and designated release/transfer owner.

Trigger: A named baseline and implementation version are proposed for release or transfer.

Inputs: `BASE` Reviewed baseline; `CODE` Implementation and build; `RUN` Verification execution and results; `VR` Validation and clinical results; `RISK` Residual-risk decision; `LABEL` Labelling and instructions for use; `DEFECT` Anomaly / defect; `DOC` Document snapshot / package; `REVIEW` Check, finding, and human decision.

Tasks:

1. Assemble applicable current verification, validation, risk, labels, anomalies, and output evidence.
2. Check that the evidence applies to the same proposed product/build state.
3. Resolve readiness findings and obtain the required distinct decisions.
4. Record release/transfer scope and retain the exact evidence references.

Outputs: `REL` Release / transfer record; `REVIEW` Check, finding, and human decision.

Decision: The designated release/transfer authority records the final decision according to the chosen process.

Handoff: Operations or the receiving team uses the release record; J13 monitors later changes and feedback.

When something changes: Changed supporting evidence requires readiness and decision freshness review; historical release evidence stays identifiable.

Inner loop: Check required records, file integrity, configuration, and decision freshness.

Outer loop: Inspect cross-package coverage, residual risks, validation limitations, open anomalies, and configuration consistency.

Feedback to the meta-loop: Capture readiness blockers, missing support, and recurring release-package rework.

Friction hypothesis: People may manually reconcile test reports, code versions, labels, and approval documents.

Measure: Assembly/review effort and late discoveries of missing or mismatched evidence.

### J12: Maintain labelling, produce document views, and answer evidence questions

Actor: Evidence or labelling author, reviewer, or QA/RA reader.

Trigger: A label, specification, report, trace matrix, design-review package, or evidence answer is needed.

Inputs: `BASE` Reviewed baseline; `NEED` User need; `SYS` Product / system requirement; `SUB` Software / hardware / UI / labelling requirement; `ARCH` Architecture and components; `HAZ` Hazard and risk analysis; `CTRL` Risk control; `RUN` Verification execution and results; `VR` Validation and clinical results; `RISK` Residual-risk decision; `CLAIM` Product / clinical claim; `LABEL` Labelling and instructions for use; `LINK` Trace relationship; `REVIEW` Check, finding, and human decision.

Tasks:

1. Author or revise controlled labelling and instructions for use from requirements, supported claims, limitations, and risk disclosures.
2. Select the relevant baseline and evidence scope.
3. Render or assemble a specification, report, matrix, or package using a named template.
4. Preserve exact source membership and review the output.
5. Answer a traceability question with references to the underlying records.

Outputs: `LABEL` Labelling and instructions for use; `DOC` Document snapshot / package; `REVIEW` Check, finding, and human decision.

Decision: The assigned document/package reviewer accepts the projection and completeness; rendering does not create new product truth.

Handoff: Reviewers, release owners, clients, or other readers receive a version-identifiable output.

When something changes: Changed baseline or template creates a new output and an explainable difference; edits to exported content return through controlled review.

Inner loop: Check membership, layout, references, template version, and required sections.

Outer loop: Inspect completeness and consistency with the underlying evidence, including meaningful omissions.

Feedback to the meta-loop: Capture recurring document edits, template omissions, and misleading evidence presentation.

Friction hypothesis: Manual copying and reconciliation may consume time and introduce divergence.

Measure: Output-preparation effort, repeated edits, and time to answer a cited evidence question.

### J13: Detect drift and route ongoing observations into review

Actor: Source and record owners with affected reviewers.

Trigger: A source revision, ticket, commit, test run, defect, or post-release observation arrives.

Inputs: `SRC` Source revisions; `WORK` Implementation work item; `CODE` Implementation and build; `RUN` Verification execution and results; `DEFECT` Anomaly / defect; `REL` Release / transfer record; `BASE` Reviewed baseline.

Tasks:

1. Capture the observation at an exact external revision.
2. Compare it with the version previously used by evidence.
3. Distinguish duplicates, irrelevant updates, and meaningful changes.
4. Route meaningful drift into J09 with the relevant records and owners.

Outputs: `SRC` Source revisions; `CHANGE` Change and impact work; `REVIEW` Check, finding, and human decision.

Decision: The responsible person dispositions drift; external activity does not automatically rewrite controlled evidence.

Handoff: J09 handles product consequences; J15 receives capture and routing failures.

When something changes: Repeated capture of the same revision should converge; lost or failed capture remains visible for recovery.

Inner loop: Check source identity, revision ordering, duplicates, and capture completeness.

Outer loop: Inspect whether material changes were missed or incorrectly associated with controlled records.

Feedback to the meta-loop: Capture missed/stale observations, duplicate work, routing errors, and recurring drift.

Friction hypothesis: Evidence may fall behind work in developer tools, particularly as AI accelerates changes.

Measure: Time from observation to disposition, missed material drift, and duplicate review work.

### J14: Maintain dataset and model evidence where product scope requires it

Actor: ML lead with test, risk, and domain reviewers.

Trigger: A dataset, model, training process, performance criterion, or permitted change scope changes.

Inputs: `SCOPE` Product scope and planning basis; `SRC` Source revisions; `SYS` Product / system requirement; `SUB` Software / hardware / UI / labelling requirement; `HAZ` Hazard and risk analysis; `ML` Dataset and model evidence, if applicable; `TEST` Verification plan / test case; `RUN` Verification execution and results; `VR` Validation and clinical results.

Tasks:

1. Record dataset origins, versions, partitions, and test-set independence/lock.
2. Record model/training configuration and the exact artifact used in a build.
3. Associate performance and subgroup evidence with the intended use and predefined criteria.
4. Review model/data changes alongside requirements, risk, verification, and validation.

Outputs: `ML` Dataset and model evidence, if applicable; `REVIEW` Check, finding, and human decision.

Decision: Named ML/domain reviewers decide the evidence interpretation; risk and release decisions retain their own owners.

Handoff: J04 uses the model artifact; J05, J07, and J08 use its risk and performance evidence; J11 uses the exact released configuration.

When something changes: Changed model/data versions or distributions trigger performance, risk, traceability, and evaluation-scope review.

Inner loop: Check version identity, split integrity, criteria, and result associations.

Outer loop: Inspect population coverage, leakage/independence assumptions, subgroup limitations, and model/build consistency.

Feedback to the meta-loop: Capture provenance gaps, incorrect version associations, performance failures, and review corrections.

Friction hypothesis: Model, dataset, build, and performance records may be maintained separately.

Measure: Effort to reconstruct the released model/data evidence and unresolved version/provenance gaps.

### J15: Improve the working system from corrections and failures

Actor: BBT process owner with project engineers and reviewers.

Trigger: Feedback accumulates or an important failure warrants immediate investigation.

Inputs: `FB` Correction and failure feedback; `REVIEW` Check, finding, and human decision; `RUN` Verification execution and results; `DEFECT` Anomaly / defect; `CHANGE` Change and impact work; `METHOD` Working methods and evaluation evidence.

Tasks:

1. Retain human edits, rejections, QA/risk comments, missing traces, failures, audit observations, document rework, and agent redirection.
2. Investigate why patterns recur and distinguish product issues from method or checking failures.
3. Propose a versioned change to prompts, rules, context selection, tools, or workflows.
4. Evaluate against relevant failure examples and correct cases, review adoption, and monitor subsequent outcomes.

Outputs: `FB` Correction and failure feedback; `METHOD` Working methods and evaluation evidence; `REVIEW` Check, finding, and human decision.

Decision: The method/process owner adopts a reviewed method version. This does not retrospectively approve product evidence.

Handoff: J01 through J14 use the adopted methods; new project feedback returns to this job.

When something changes: Method changes retain before/after versions and evaluation outcomes; regression or new failures prompt another meta-loop review.

Inner loop: Check feedback identity, source versions, proposed configuration, and evaluation execution.

Outer loop: Independently review whether the proposed method change addresses the cause and introduces new omissions or false alarms.

Feedback to the meta-loop: This is the meta-loop. Regulatory/FDA feedback is one external input; internal project corrections can supply signals from week one.

Friction hypothesis: Repeated corrections may stay in individual reviewers' heads and never improve the process.

Measure: Recurring failure rate, correction effort, and regression outcomes after a method change.

### J16: Agree product scope, lifecycle methods, and evidence responsibilities

Actor: Product/project owner with engineering, QA, and relevant domain leads.

Trigger: An engagement starts, the toolset changes, or intended use and project scope materially change.

Inputs: `SRC` Source revisions; `SCOPE` Product scope and planning basis; `METHOD` Working methods and evaluation evidence; `REVIEW` Check, finding, and human decision.

Tasks:

1. Agree intended use, users/population, product boundaries, and the evidence activities applicable to this scope.
2. Agree lifecycle methods, acceptance criteria, review cadence, and responsibilities.
3. Choose the authoritative home and granularity of each controlled record, including coexistence and handover arrangements.
4. Record how human and agent work enter the process and who can make each decision.

Outputs: `SCOPE` Product scope and planning basis; `REVIEW` Check, finding, and human decision.

Decision: The designated engagement owners agree the versioned scope, methods, record ownership, and review responsibilities.

Handoff: J01–J14 use the agreed scope and criteria; J15 uses the agreed method ownership and evaluation approach.

When something changes: Scope, home, method, or responsibility changes prompt review of affected workflows and historical-record access.

Inner loop: Check that the proposed plan names record types, owners, criteria, methods, and unresolved decisions.

Outer loop: Independently inspect whether the planned activities and responsibilities cover the selected product scope and normal developer work.

Feedback to the meta-loop: Capture missing ownership, unsuitable review cadence, migration problems, and avoidable process overhead.

Friction hypothesis: Tool selection may move faster than decisions about record ownership and practical review responsibilities.

Measure: Unassigned decisions, duplicate authoritative records, and effort spent reconciling process or ownership ambiguity.

## Connection register

These conceptual relationships expand the main diagrams. Record presence does not establish sufficiency or acceptance. Baselines select exact controlled evidence and link versions; release records select applicable support and separate decisions. The register is a planning vocabulary, not an extension of the demo's implemented relationship policy.

- **F01** `SRC` → `CLAR`: raises questions. Owned work: J01, J02.
- **F02** `SRC` → `NEED`: supports interpretation. Owned work: J01, J02.
- **F03** `CLAR` → `NEED`: records agreed clarification. Owned work: J02.
- **F04** `SCOPE` → `NEED`: constrains intended use. Owned work: J02.
- **F05** `NEED` → `SYS`: defines the need to satisfy. Owned work: J03.
- **F06** `SYS` → `SUB`: decomposes and allocates. Owned work: J03.
- **F07** `SCOPE` → `HAZ`: sets use context and risk criteria. Owned work: J05.
- **F08** `HAZ` → `CTRL`: defines risk to control. Owned work: J05.
- **F09** `CTRL` → `SYS`: expresses system-level control. Owned work: J03, J05.
- **F10** `CTRL` → `SUB`: expresses allocated control. Owned work: J03, J05.
- **F11** `USE` → `NEED`: informs user/task needs. Owned work: J02, J06.
- **F12** `USE` → `SUB`: informs UI and use-related controls. Owned work: J03, J06.
- **F13** `SYS` → `ARCH`: allocates system behaviour. Owned work: J04.
- **F14** `SUB` → `ARCH`: allocates requirement to component. Owned work: J04.
- **F15** `ARCH` → `DESIGN`: defines component/interface context. Owned work: J04.
- **F16** `SUB` → `DESIGN`: defines detailed design obligation. Owned work: J04.
- **F17** `DESIGN` → `WORK`: scopes implementation work. Owned work: J04.
- **F18** `WORK` → `CODE`: records work implemented at a revision. Owned work: J04.
- **F19** `CODE` → `ARCH`: provides as-built observation to reconcile. Owned work: J04, J13.
- **F20** `SYS` → `TEST`: defines system verification criteria. Owned work: J07.
- **F21** `SUB` → `TEST`: defines subsystem verification criteria. Owned work: J07.
- **F22** `ARCH` → `TEST`: defines integration verification scope. Owned work: J07.
- **F23** `DESIGN` → `TEST`: defines unit verification scope. Owned work: J07.
- **F24** `CTRL` → `TEST`: defines implementation/effectiveness checks. Owned work: J05, J07.
- **F25** `TEST` → `RUN`: defines executed plan and criteria. Owned work: J07.
- **F26** `CODE` → `RUN`: identifies exact tested build. Owned work: J07.
- **F27** `RUN` → `DEFECT`: records failed expectation. Owned work: J07.
- **F28** `DEFECT` → `CHANGE`: initiates assessed remediation. Owned work: J09, J13.
- **F29** `NEED` → `VP`: defines validation outcome. Owned work: J08.
- **F30** `USE` → `VP`: defines tasks and use conditions. Owned work: J06, J08.
- **F31** `CLAIM` → `VP`: defines claim to evaluate. Owned work: J08.
- **F32** `VP` → `VR`: defines executed evaluation. Owned work: J08.
- **F33** `CODE` → `VR`: identifies evaluated configuration. Owned work: J08.
- **F34** `RUN` → `VR`: references verification of that configuration. Owned work: J08.
- **F35** `ML` → `CODE`: identifies model artifact used. Owned work: J04, J14.
- **F36** `ML` → `TEST`: defines dataset/model test configuration. Owned work: J07, J14.
- **F37** `ML` → `VR`: provides versioned performance evidence. Owned work: J08, J14.
- **F38** `HAZ` → `RISK`: provides assessed hazard context. Owned work: J05.
- **F39** `CTRL` → `RISK`: provides control implementation context. Owned work: J05.
- **F40** `RUN` → `RISK`: provides control verification evidence. Owned work: J05, J07.
- **F41** `VR` → `RISK`: provides relevant validation findings. Owned work: J05, J08.
- **F42** `VR` → `CLAIM`: supports or limits claim. Owned work: J08.
- **F43** `RISK` → `LABEL`: defines required risk disclosure. Owned work: J05, J12.
- **F44** `CLAIM` → `LABEL`: provides supported claim wording. Owned work: J08, J12.
- **F45** `SUB` → `LABEL`: defines labelling requirement. Owned work: J03, J12.
- **F46** `CHANGE` → `REVIEW`: requests version-specific impact decisions. Owned work: J09.
- **F47** `REVIEW` → `BASE`: records decisions for selected evidence state. Owned work: J10.
- **F48** `BASE` → `DOC`: selects exact rendered evidence versions. Owned work: J12.
- **F49** `BASE` → `REL`: identifies reviewed product state. Owned work: J11.
- **F50** `CODE` → `REL`: identifies implementation/build. Owned work: J11.
- **F51** `RUN` → `REL`: provides applicable execution and disposition. Owned work: J11.
- **F52** `VR` → `REL`: provides applicable validation and limitations. Owned work: J11.
- **F53** `RISK` → `REL`: provides applicable risk decisions. Owned work: J11.
- **F54** `LABEL` → `REL`: identifies released label versions. Owned work: J11.
- **F55** `DEFECT` → `REL`: records remaining anomaly disposition. Owned work: J11.
- **F56** `DOC` → `REL`: provides exact output package. Owned work: J11, J12.
- **F57** `REVIEW` → `REL`: records separate release decision. Owned work: J11.
- **F58** `SRC` → `CHANGE`: raises source-drift work. Owned work: J09, J13.
- **F59** `CODE` → `CHANGE`: raises implementation-drift work. Owned work: J09, J13.
- **F60** `RUN` → `CHANGE`: raises failure or changed-evidence work. Owned work: J09, J13.
- **F61** `WORK` → `CHANGE`: raises relevant external-work observation. Owned work: J09, J13.
- **F62** `BASE` → `CHANGE`: provides prior controlled comparison state. Owned work: J09.
- **F63** `REVIEW` → `FB`: records edits, rejections, and reasons. Owned work: J15.
- **F64** `RUN` → `FB`: records failures and result corrections. Owned work: J15.
- **F65** `CHANGE` → `FB`: records missed impacts and redirection. Owned work: J15.
- **F66** `DEFECT` → `FB`: records recurring failure evidence. Owned work: J15.
- **F67** `FB` → `METHOD`: informs investigated method improvement. Owned work: J15.
- **F68** `METHOD` → `REVIEW`: defines versioned checking method. Owned work: J15.
- **F69** `METHOD` → `NEED`: defines versioned drafting method. Owned work: J02, J15.
- **F70** `SRC` → `SCOPE`: provides project and intended-use basis. Owned work: J16.
- **F71** `SCOPE` → `REVIEW`: defines responsibilities, criteria, and methods. Owned work: J16.
- **F72** `USE` → `HAZ`: provides use-related hazard context. Owned work: J05, J06.
- **F73** `ML` → `HAZ`: provides model/data hazard context. Owned work: J05, J14.
- **F74** `CODE` → `HAZ`: provides implementation, dependency, and security observations. Owned work: J04, J05.
- **F75** `DEFECT` → `HAZ`: provides observed failure for risk reassessment. Owned work: J05, J07.
- **F76** `SRC` → `USE`: supports task and study interpretation. Owned work: J01, J06.
- **F77** `SRC` → `CLAIM`: supports proposed claim and its basis. Owned work: J02.
- **F78** `LABEL` → `BASE`: selects reviewed labelling version. Owned work: J10, J12.
- **F79** `LINK` → `REVIEW`: requests confirmation, retype, retirement, or rejection. Owned work: J03, J04, J05, J07, J08, J09.
- **F80** `LINK` → `BASE`: selects confirmed relationship versions. Owned work: J10.
- **F81** `LINK` → `CHANGE`: provides known trace context for impact analysis. Owned work: J09.
- **F82** `LINK` → `DOC`: provides matrix and cited trace answers. Owned work: J12.

## Scenarios that test the map

### A meeting introduces a new user need

1. J01 captures the exact source revision, including uncertainty or disagreement. J02 resolves necessary questions and proposes a need with citations.
2. J05 and J06 supply relevant risk and task context before J03 settles derived requirements. The agent's inner loop checks a requirement's criteria, wording, and proposed links.
3. An outer check uses the underlying source, existing needs, risk/task evidence, and related requirements. It may find that the proposed criterion lacks a source basis or that a relevant control is missing.
4. The responsible people disposition those findings and review the candidate versions and links. J04 and J07 receive design/test obligations; J08 receives the validation obligation. J10 can freeze a reviewed state when the selected scope is ready.
5. The source stays attributable to its origin. Accepted need/requirement versions live in the provisional controlled-record home. Human edits, omissions, and rejections go to J15 as feedback.

### A developer proposes a significant alert-threshold change

1. Illustrative case: a PR changes a threshold from 30 seconds to 60 seconds. J13 records the exact old/new commit references. J09 compares the proposed change with the relevant baseline and records impact work. Where feasible, run this before merge; otherwise keep the observed mismatch explicit.
2. The coding agent's inner loop may pass local code checks and tests. That result leaves the product meaning and wider evidence to be examined independently.
3. The outer check inspects the requirement threshold, hazard/control assumptions, unit/integration/system test criteria, applicable usability/validation evidence, labels, and configuration. It also looks for consequences missing from the existing trace graph.
4. Affected people decide whether the code should change back or the controlled evidence should change. J03/J04/J05/J07/J08/J12 receive only the required follow-up. New tests retain their own plan and build references.
5. J10 reviews the new evidence state; J11 makes a separate release decision when relevant. The old baseline/release and their associated tests remain identifiable.
6. If a label or control was repeatedly missed, J15 investigates the cause, changes context selection or checking rules, evaluates the change, and adopts a method version for future work.

## Relationship to the feature map

The [first feature map](bluebridge-feature-map.md) now maps supporting capabilities, minimum workflows, prerequisites, package outcomes, and interim coverage onto these jobs. Open its [visual reference](bluebridge-feature-map.html) to inspect features by job. The user regards these job families as a reasonable working basis; specific responsibilities and future homes remain provisional.

Preserve each job's input, output, source reference, decision, and change path when defining a feature. Begin with the minimum complete workflow; manual capture, linking, and independent checking can supply early coverage.

Treat record identity, revision references, link meanings, and ownership decisions as shared prerequisites. Live Slack intake is not a prerequisite for a traceability job over existing evidence. Internal evidence storage is not a prerequisite for useful drafting assistance if accepted outputs reach a bought-tool evidence home.

Capture feedback in the first useful workflow. Broader automated outer checks depend on available evidence and usable references. Different models, prompts, and independent context selection may help establish independence; model difference alone does not establish it. Formal approval is a separate workflow decision.

## Decisions still to validate

1. Which evidence homes and coexistence arrangements will be selected, and who owns migration or handover?
2. Who authors, independently checks, reviews, and approves each evidence type for a BBT/client engagement?
3. What makes a change significant, and where should the outer check run in normal developer work?
4. What granularity and link meanings give useful coverage without excessive maintenance?
5. Which risk, usability, hardware, clinical, and dataset/model evidence applies to the first product scope?
6. Which current jobs consume the most effort or cause repeated rework? Observe a real example before assigning benefit estimates.
7. Who owns method improvements, and what evaluation is sufficient to adopt a changed prompt, rule, context strategy, or tool?

## Sources and regeneration

Sources: the user's framing and loop-engineering discussion; the supplied `Design_Controls_Must_Have_Traceability_v3.drawio`; the user's confirmation of previous Jira/GitHub/document processes and undecided future homes; local [product architecture](product-architecture.md), [authority model](authority-model.md), and [data model](data-model.md). Current demo statuses and supplier capabilities have not been revalidated.

The editable planning source and generator are [build_jobs_map.py](planning/build_jobs_map.py). Run `python3 docs/planning/build_jobs_map.py` to regenerate the catalogue, visual map, draw.io file, SVG views, and JSON data. The generator checks job and record references, unique IDs, diagram endpoints, text capacity, and output structure. It does not validate the proposed operating model with stakeholders.
