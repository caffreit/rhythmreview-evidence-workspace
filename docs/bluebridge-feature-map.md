# BlueBridge jobs, features, and phased coverage

Status: first feature-mapping proposal, 9 October 2026.

Open the [visual feature map](bluebridge-feature-map.html) or edit the [package dependency diagram](bluebridge-feature-roadmap.drawio). Job IDs refer to the [jobs and information-flow map](bluebridge-jobs-map.md). See the [first fresh-build estimation pass](bluebridge-estimation.md) for the minimum P0/P1/P2 path.

The user has reviewed the job list and regards it as a reasonable working basis. This maps supporting capabilities onto those jobs; specific responsibilities and future evidence homes remain provisional.

Each capability has a minimum usable version and later increments. A minimum can be supplied internally, by a bought tool, or by an existing/manual process. Dependency means the capability must be available, not that BlueBridge must build a full native module first.

This is a proposal for useful workflows and sequencing. It does not replace the demo's WP-00 to WP-60 delivery plan, claim current supplier coverage, or establish product compliance. Recorded demo precedents are identified separately and have not been revalidated here.

The first P0/P1/P2 estimation pass assumes a fresh build. Existing demo descriptions are design and rough timing references; that estimate credits no existing code, prompts, fixtures, or tests.

## Recommended first useful slice

Start with one transcript or text source, one bounded need/requirement output schema, agreed risk/task context, and one target evidence home. Capture the source, resolve material questions, draft with citations, check/revise, independently inspect, record human decisions, confirm links, and save accepted outputs with their target IDs. Review the needs before deriving requirements; review the requirements and links in their own right. Capture correction reasons from the same workflow.

P0 supplies the minimum agreements, identities, decisions, run contracts, and exchange path. P1 supplies the workflow; CAP-35 starts feedback capture. Manual context selection, an independent human check, and manual transfer to the chosen home can be sufficient for the first slice. Additional adapters and automation are later increments.

Success means a person can complete the job with usable citations, decisions, and saved records, and less reconstruction/rework. Measure reviewer correction effort and consequential misses alongside elapsed time. Establish the current-process comparison before claiming a quantified saving.

A viable alternative is P2 first if existing records and links are accessible and change review is the greater pain. P2 does not require transcript ingestion. The recommended ordering is a discovery proposal, not a fixed build schedule.

## Dependency meanings

- A hard prerequisite is another minimum capability that must be available.
- A conditional prerequisite applies only to the stated scope or automation level. Domain evidence may be mandatory for a job even while native domain software remains deferred.
- Features required together deliver the package's promised user outcome. A single part can still be useful as assistance, with the rest handled elsewhere.
- Workflow affinity is convenience for delivery or shared implementation, without a dependency.
- External prerequisites are people, authority decisions, access, source quality, selected systems, and agreed criteria.

Examples: live Slack capture needs a source-capture contract, not a completed meeting connector. A trace view needs usable links, not an internal link editor. A significant-change check needs independent context and follow-up ownership; a different model alone does not establish independence.

## Work packages and completion gates

### P0: Agree conventions and a usable exchange path

The first workflow has agreed record identities, homes, review responsibilities, processing contracts, and a way to transfer accepted outputs.

Features grouped here: CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-38.

Minimum for the named outcome: CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-38.

Other minimum capabilities that must be available: Check the selected feature prerequisites.

Completion gate: One sample source, candidate, decision, and accepted target record can be followed using exact IDs and versions, with one authoritative home per controlled record.

Interim coverage: Existing document agreements and selected bought-tool record/review functions can provide these capabilities. Internal D1 storage is an option.

Independent later increments: Broader record schemas, managed policy/role configuration, and API exchange.

Sequencing: Shared capabilities must be available at their minimum level; they do not all require new internal software.

Estimation: the [fresh-build estimation pass](bluebridge-estimation.md) covers a narrow minimum version of this package. Calendar dates remain open. Main drivers: ownership decisions, usable existing data, destination formats, and internal-versus-external storage choice.

### P1: Turn one source into reviewed needs and requirements

A person captures a transcript, resolves questions, obtains cited candidate needs/requirements, reviews them and their links, and saves accepted outputs to the chosen home.

Features grouped here: CAP-06, CAP-07, CAP-10, CAP-11, CAP-12, CAP-13, CAP-14, CAP-18.

Minimum for the named outcome: CAP-06, CAP-10, CAP-11, CAP-12, CAP-13, CAP-14, CAP-18, CAP-35, CAP-38.

Other minimum capabilities that must be available: CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-35, CAP-38.

Completion gate: Complete the flow on a representative source; an independent check finds a deliberately unsupported statement; revisions receive fresh checks; accepted target IDs, citations, decisions, and correction reasons are retrievable.

Interim coverage: Manual risk/task context, existing or bought-tool evidence/review, and current test/validation/release processes cover the rest of the lifecycle.

Independent later increments: CAP-07 document formats are optional; live Slack/meeting capture can be added independently through P-IN.

Sequencing: Drafting, checking, independent scrutiny, human acceptance, usable links, persistence/exchange, and feedback are required together for this promised outcome. AI extraction by itself is a smaller assistance feature.

Estimation: the [fresh-build estimation pass](bluebridge-estimation.md) covers a narrow minimum version of this package. Calendar dates remain open. Main drivers: fresh application/storage setup, prompt quality, citation reliability, reviewer workflow, and target-home exchange.

### P2: Inspect traces and coordinate a significant change

A reviewer sees known traces, assesses change consequences, independently inspects wider evidence, and assigns update/relink/retest work.

Features grouped here: CAP-15, CAP-16, CAP-17, CAP-19, CAP-20.

Minimum for the named outcome: CAP-15, CAP-16, CAP-17, CAP-18, CAP-14, CAP-35.

Other minimum capabilities that must be available: CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-13, CAP-14, CAP-18, CAP-35.

Completion gate: The threshold-change scenario exposes affected requirements, controls, tests, and labels; each finding has a version, reason, owner, and disposition. Missing context is visible.

Interim coverage: An imported external relationship set and manual review can supply initial coverage. Existing owners/tools continue to implement and execute follow-up work.

Independent later increments: CAP-19 unlinked suggestions and CAP-20 drift automation are separate increments. Initial review can be manually triggered.

Sequencing: This package can precede P1 if existing records and links supply its inputs. P1 transcript ingestion is not a hard prerequisite.

Estimation: the [fresh-build estimation pass](bluebridge-estimation.md) covers a narrow minimum version of this package. Calendar dates remain open. Main drivers: existing graph quality, missing-link prevalence, impact-review breadth, evaluation cases, and integration with follow-up work.

### P3: Connect implementation, verification, and normal developer work

A team connects requirements/design to exact work/code/build references and reviewed test plans/executions at the relevant V-model levels.

Features grouped here: CAP-21, CAP-25, CAP-26, CAP-39.

Minimum for the named outcome: CAP-21, CAP-26.

Other minimum capabilities that must be available: CAP-01, CAP-02, CAP-03, CAP-04, CAP-14.

Completion gate: A reviewer can follow a requirement to its design/build/test execution and disposition; failed and stale evidence remains distinguishable from current support.

Interim coverage: Repository, CI, and work-tracker systems retain their facts. Manual references/imports and existing reviewers can start this workflow.

Independent later increments: CAP-25 adds checks in the PR/work path; CAP-39 supports unattended operations; selected P-IN adapters can arrive separately.

Sequencing: The minimum does not require every connector or a full automated release gate. CAP-25's developer-check workflow additionally needs change work and independent checking.

Estimation: calendar dates and engineering effort ranges remain open. Main drivers: reference/mapping quality, report formats, execution identity, workflow permissions, and background-operation needs.

### P4: Review baselines and produce selected outputs

A team reviews an exact evidence state and produces a version-identifiable specification/report/package. Release support is a further scoped workflow.

Features grouped here: CAP-30, CAP-32, CAP-33, CAP-34.

Minimum for the named outcome: CAP-32, CAP-33.

Other minimum capabilities that must be available: CAP-01, CAP-02, CAP-03, CAP-04, CAP-14.

Completion gate: The output identifies baseline, template, and evidence versions; a changed baseline/template produces a new output and an explainable difference.

Interim coverage: Selected bought-tool baselines, documents, label records, and release processes can continue while internal output capabilities grow.

Independent later increments: CAP-30 label authoring and CAP-34 release/transfer support have additional evidence prerequisites. Full release takeover is a separate handover decision.

Sequencing: The baseline-to-document minimum does not depend on internal transcript intake or all automated developer integrations.

Estimation: calendar dates and engineering effort ranges remain open. Main drivers: required outputs, template governance, target formats, evidence freshness, and scope of release support.

### P-IN: Add selected source and engineering adapters

Reduce manual capture for one selected source or engineering system using the common intake and identity contracts.

Features grouped here: CAP-08, CAP-09, CAP-22, CAP-23, CAP-24.

Minimum for the named outcome: Choose one adapter; no mandatory whole-group bundle.

Other minimum capabilities that must be available: Check the selected feature prerequisites.

Completion gate: For each adapter, test capture, repeated capture, source revision/configuration mapping, failure visibility, and the relevant downstream review path.

Interim coverage: Manual upload, paste, references, and report bundles remain usable between adapter deliveries.

Independent later increments: Choose Slack, meetings, tracker, repository, or CI independently according to actual friction and selected systems.

Sequencing: This is a grouping by shared integration work, not an all-or-nothing release package. There is no minimum bundle of all five adapters.

Estimation: calendar dates and engineering effort ranges remain open. Main drivers: selected vendor APIs, permissions, field/report mappings, revision semantics, and unattended reliability.

### P-R: Extend risk records and control-evidence review

Support the selected risk authoring/reference and control-evidence workflow.

Features grouped here: CAP-27.

Minimum for the named outcome: CAP-27.

Other minimum capabilities that must be available: CAP-01, CAP-02, CAP-03, CAP-04, CAP-14.

Completion gate: A changed control identifies the related requirement/test evidence and risk decision to reconsider.

Interim coverage: A bought tool or existing risk process can supply reviewed risk/control inputs from the first slice.

Independent later increments: Domain forms and broader effectiveness/risk-change assistance.

Sequencing: Risk information may be required early even when native risk authoring is delivered later.

Estimation: calendar dates and engineering effort ranges remain open. Main drivers: product scope, existing risk data, analysis conventions, reviewers, and supporting evidence.

### P-U: Extend task, UI, and usability evidence

Support the chosen task-to-UI-to-evaluation workflow.

Features grouped here: CAP-28.

Minimum for the named outcome: CAP-28.

Other minimum capabilities that must be available: CAP-01, CAP-02, CAP-03, CAP-04, CAP-14.

Completion gate: A critical task links to the relevant UI requirement, use-related risk, and evaluation outcome.

Interim coverage: Existing design/study processes or a bought tool provide task and usability inputs meanwhile.

Independent later increments: Dedicated formative/summative work and coverage assistance.

Sequencing: This branch is selected by product scope and source availability, not by completion of all other domain modules.

Estimation: calendar dates and engineering effort ranges remain open. Main drivers: study/task granularity, critical-task coverage, data formats, and design-system references.

### P-V: Extend validation and claim evidence

Support per-need/per-claim evaluation plans, results, limitations, and decisions.

Features grouped here: CAP-29.

Minimum for the named outcome: CAP-29.

Other minimum capabilities that must be available: CAP-01, CAP-02, CAP-03, CAP-04, CAP-14.

Completion gate: A reviewer can explain the evidence basis and limitations of a need/claim for the evaluated product configuration.

Interim coverage: Existing validation/clinical processes or a bought tool continue to supply evidence and decisions.

Independent later increments: More study types and appropriate usability/model context.

Sequencing: Validation evidence is required where applicable; native validation workflow is an optional ownership choice.

Estimation: calendar dates and engineering effort ranges remain open. Main drivers: applicable claims/needs, study types, evidence quality, and domain review responsibilities.

### P-M: Extend model and dataset evidence where applicable

Connect exact model/data versions with implementation, performance, risk, and evaluation evidence.

Features grouped here: CAP-31.

Minimum for the named outcome: CAP-31.

Other minimum capabilities that must be available: CAP-01, CAP-02, CAP-03, CAP-04, CAP-14.

Completion gate: A build/model/performance version mismatch is visible with the affected evidence references.

Interim coverage: Selected model/dataset registries and current ML review practices retain artifact ownership.

Independent later increments: Registry adapters and domain-specific integrity/performance checks.

Sequencing: Conditional on product scope. A conventional software product need not build an ML module.

Estimation: calendar dates and engineering effort ranges remain open. Main drivers: registry/data access, versioning, provenance, dataset partitions, and evaluation criteria.

### P-L: Learn from corrections from the first workflow

Capture corrections, investigate recurring causes, and adopt evaluated changes to working methods.

Features grouped here: CAP-35, CAP-36, CAP-37.

Minimum for the named outcome: CAP-35, CAP-36, CAP-37.

Other minimum capabilities that must be available: CAP-01, CAP-02, CAP-04, CAP-05.

Completion gate: A real correction has source/output/method references and a reason; a proposed method change is evaluated against failure and correct cases before adoption.

Interim coverage: Manual feedback capture, a periodic human review, and an existing evaluation script/spreadsheet can supply the first meta-loop.

Independent later increments: Assisted cross-project pattern analysis and monitored method rollout.

Sequencing: Start CAP-35 with P1 or the first delivered workflow. Periodic analysis and evaluation can grow independently; a single important failure can trigger CAP-37 without waiting for CAP-36 pattern summaries.

Estimation: calendar dates and engineering effort ranges remain open. Main drivers: feedback quality, reviewer effort, representative examples, evaluation coverage, and adoption ownership.

## Job coverage throughout the build

Mapping a feature to a job means it supports that work; it does not replace the accountable person or prove the entire job is complete. During every phase, remaining scope needs an assigned existing/bought/manual process. The following assignments are provisional categories, not checked supplier claims.

### J01: Capture information with a usable source reference

Useful internal increment: P1 / selected P-IN adapter. Capture and citations for selected sources.

Supporting features: CAP-02, CAP-05, CAP-06, CAP-07, CAP-08, CAP-09, CAP-10, CAP-20, CAP-35, CAP-38, CAP-39.

Remaining/interim responsibility: Manual capture or existing/bought source intake covers unconnected formats/systems.

### J02: Agree the user need and its intended-use context

Useful internal increment: P1. Clarifications and reviewed need/claim candidates.

Supporting features: CAP-02, CAP-04, CAP-05, CAP-10, CAP-11, CAP-12, CAP-13, CAP-18, CAP-28, CAP-29, CAP-35, CAP-38.

Remaining/interim responsibility: Product/domain owners still agree intended use, meaning, and claims; unsupported scope stays with the existing process.

### J03: Translate needs and controls into testable requirements

Useful internal increment: P1; broader P2 checks later. Drafting, inner checks, review, and trace links for the chosen requirement scope.

Supporting features: CAP-02, CAP-03, CAP-04, CAP-05, CAP-10, CAP-11, CAP-12, CAP-13, CAP-14, CAP-15, CAP-18, CAP-19, CAP-27, CAP-28, CAP-30, CAP-35, CAP-38.

Remaining/interim responsibility: Existing/bought requirements processes cover unimplemented types or deeper decomposition.

### J04: Connect intended design, implementation work, and what was built

Useful internal increment: P3; P2/P-IN increments. Design/work/code references and independent significant-change checking.

Supporting features: CAP-02, CAP-03, CAP-04, CAP-12, CAP-13, CAP-14, CAP-16, CAP-18, CAP-20, CAP-21, CAP-22, CAP-23, CAP-25, CAP-31, CAP-35, CAP-38, CAP-39.

Remaining/interim responsibility: Current design, repository, PR, and work processes perform implementation and their own reviews.

### J05: Analyse risk, define controls, and assess residual risk

Useful internal increment: P-R; P2 review assistance. Selected risk/control records and change/coverage assistance.

Supporting features: CAP-02, CAP-03, CAP-04, CAP-13, CAP-14, CAP-15, CAP-16, CAP-17, CAP-18, CAP-19, CAP-27, CAP-28, CAP-29, CAP-30, CAP-31, CAP-35, CAP-38.

Remaining/interim responsibility: Risk owners and existing/bought risk management supply records, criteria, and decisions from day one.

### J06: Connect user tasks, interface design, and usability evidence

Useful internal increment: P-U. Selected task/UI/study references and coverage.

Supporting features: CAP-02, CAP-03, CAP-04, CAP-13, CAP-14, CAP-15, CAP-16, CAP-18, CAP-28, CAP-35, CAP-38.

Remaining/interim responsibility: Existing design/usability processes conduct studies and maintain unimplemented work.

### J07: Plan verification and preserve results at every V-model level

Useful internal increment: P3; CI adapter separately. Versioned plans, execution associations, dispositions, and selected coverage checks.

Supporting features: CAP-02, CAP-03, CAP-04, CAP-13, CAP-14, CAP-15, CAP-16, CAP-17, CAP-18, CAP-19, CAP-21, CAP-24, CAP-25, CAP-26, CAP-27, CAP-31, CAP-35, CAP-38, CAP-39.

Remaining/interim responsibility: Developers/test owners and execution systems still run tests; other test workflows stay with existing/bought tools.

### J08: Validate user needs and support applicable product claims

Useful internal increment: P-V. Selected validation/claim records and review support.

Supporting features: CAP-02, CAP-03, CAP-04, CAP-13, CAP-14, CAP-15, CAP-16, CAP-18, CAP-28, CAP-29, CAP-30, CAP-31, CAP-35, CAP-38.

Remaining/interim responsibility: Validation/clinical/usability owners and their current or bought processes conduct and interpret evaluations.

### J09: Determine and resolve the consequences of a change

Useful internal increment: P2; P3 developer-path increment. Recorded scope, linked/unlinked impact assistance, independent findings, and follow-up.

Supporting features: CAP-02, CAP-03, CAP-04, CAP-05, CAP-13, CAP-14, CAP-15, CAP-16, CAP-17, CAP-18, CAP-19, CAP-20, CAP-21, CAP-22, CAP-23, CAP-25, CAP-26, CAP-32, CAP-35, CAP-38, CAP-39.

Remaining/interim responsibility: Affected people decide consequences and complete updates/retests; existing change control covers unsupported scope.

### J10: Establish a coherent reviewed baseline

Useful internal increment: P4 baseline increment. Exact evidence-state selection and coherence/review support.

Supporting features: CAP-02, CAP-03, CAP-04, CAP-13, CAP-14, CAP-15, CAP-16, CAP-17, CAP-18, CAP-32, CAP-33, CAP-34, CAP-35, CAP-38.

Remaining/interim responsibility: The chosen external review/baseline process remains authoritative until a scoped handover.

### J11: Establish release or transfer readiness and record the decision

Useful internal increment: P4 release increment after applicable prerequisites. Current evidence association and separate readiness/release decisions.

Supporting features: CAP-02, CAP-04, CAP-13, CAP-15, CAP-18, CAP-21, CAP-24, CAP-26, CAP-27, CAP-29, CAP-30, CAP-31, CAP-32, CAP-33, CAP-34, CAP-35, CAP-38.

Remaining/interim responsibility: Existing/bought release/transfer process covers the complete job meanwhile, including evidence branches not yet internal.

### J12: Maintain labelling, produce document views, and answer evidence questions

Useful internal increment: P4 output/label increments; P2 trace answers. Selected baseline documents, labels, packages, and cited trace views.

Supporting features: CAP-02, CAP-03, CAP-04, CAP-07, CAP-12, CAP-13, CAP-14, CAP-15, CAP-18, CAP-27, CAP-29, CAP-30, CAP-32, CAP-33, CAP-34, CAP-35, CAP-38.

Remaining/interim responsibility: Existing/bought document and labelling processes cover remaining outputs and content types.

### J13: Detect drift and route ongoing observations into review

Useful internal increment: P2; each P-IN adapter independently. Captured revision comparison and meaningful drift work.

Supporting features: CAP-02, CAP-06, CAP-07, CAP-08, CAP-09, CAP-16, CAP-20, CAP-21, CAP-22, CAP-23, CAP-24, CAP-25, CAP-35, CAP-38, CAP-39.

Remaining/interim responsibility: Manual checks of unconnected systems and existing owners keep other evidence current.

### J14: Maintain dataset and model evidence where product scope requires it

Useful internal increment: P-M only if applicable. Exact model/data/build/evaluation associations.

Supporting features: CAP-02, CAP-03, CAP-04, CAP-13, CAP-14, CAP-15, CAP-18, CAP-31, CAP-35, CAP-38.

Remaining/interim responsibility: Model/dataset systems and current ML owners supply artifacts and performance evidence.

### J15: Improve the working system from corrections and failures

Useful internal increment: P-L from first delivered workflow. Correction capture, cause investigation, and evaluated method changes.

Supporting features: CAP-02, CAP-04, CAP-05, CAP-35, CAP-36, CAP-37, CAP-39.

Remaining/interim responsibility: Human process owners supply the early meta-loop; regulatory/audit signals can join project feedback.

### J16: Agree product scope, lifecycle methods, and evidence responsibilities

Useful internal increment: P0 and ongoing P-L feedback. Recorded scope, ownership, decision methods, and chosen exchange boundaries.

Supporting features: CAP-01, CAP-02, CAP-03, CAP-04, CAP-10, CAP-36, CAP-37, CAP-38.

Remaining/interim responsibility: BBT/client owners agree the operating model; selecting software alone does not allocate these responsibilities.

## Feature catalogue

CAP IDs distinguish feature capabilities from the job map's F-series information connections. Minimum versions are functional contracts; later increments describe greater capability/ease. Hard/conditional dependencies are availability requirements regardless of which tool supplies them.

### CAP-01: Record scope, evidence homes, and decision responsibilities

Supports J16; grouped in P0.

Inputs: SRC, SCOPE, METHOD. Outputs: SCOPE, REVIEW.

Minimum useful version: A recorded agreement names product scope, record types, authoritative homes, link meanings, responsible people, and applicable checks.

Later capability: Configurable scope/role profiles and rules selected for each engagement.

Hard prerequisites: None beyond agreeing the first scope.

External prerequisites: Responsible BBT/client owners must agree the first scope and permitted decision roles.

Acceptance example: A requirement has one agreed home and named author/reviewer; the team can identify who resolves an ownership conflict.

Documented demo precedent: Product rules and an authority explanation are documented; engagement-level configuration is a broader proposal. See [authority-model.md](authority-model.md).

### CAP-02: Identify and retain exact record versions

Supports J01, J02, J03, J04, J05, J06, J07, J08, J09, J10, J11, J12, J13, J14, J15, J16; grouped in P0.

Inputs: SRC, NEED, SYS, SUB, LINK, REVIEW. Outputs: SRC, NEED, SYS, SUB, LINK, REVIEW.

Minimum useful version: Use stable IDs, exact revisions, source references, and distinct candidate/accepted states in the selected record home. A small agreed record set is enough to start.

Later capability: Internal editing/history for more evidence types, with cross-system identity mappings and concurrency handling.

Hard prerequisites: CAP-01.

External prerequisites: The chosen home must support, or be supplemented with, usable version references and accessible history.

Acceptance example: A reviewer can open the source and requirement revisions used by a check even after the latest versions change.

Documented demo precedent: Evidence versions, source revisions, and retained baselines are described in the demo data model. See [data-model.md](data-model.md).

### CAP-03: Define trace meanings and allowed relationships

Supports J03, J04, J05, J06, J07, J08, J09, J10, J12, J14, J16; grouped in P0.

Inputs: SCOPE, LINK. Outputs: METHOD, LINK.

Minimum useful version: Define a small vocabulary with endpoint types, direction, meaning, and review expectations for the first workflow.

Later capability: Versioned policies covering additional evidence types and conditional coverage rules.

Hard prerequisites: CAP-01, CAP-02.

External prerequisites: Domain owners must agree what a link establishes and which links are expected for the selected scope.

Acceptance example: A need-to-requirement link means derivation, while a requirement-to-test link names verification scope; neither transfers approval.

Documented demo precedent: A controlled prototype relationship policy is documented; the wider map vocabulary still needs agreement. See [relationship-policy.md](relationship-policy.md).

### CAP-04: Record human decisions and return work for revision

Supports J02, J03, J04, J05, J06, J07, J08, J09, J10, J11, J12, J14, J15, J16; grouped in P0.

Inputs: REVIEW, NEED, SYS, SUB, LINK, CHANGE. Outputs: REVIEW, FB.

Minimum useful version: Retain the named person, role, object/version, reason, and accept/revise/reject/defer outcome. An existing review process can supply the decision.

Later capability: Integrated review queues, reminders, permission enforcement, and authenticated decision capture for the selected deployment.

Hard prerequisites: CAP-01, CAP-02.

External prerequisites: A designated reviewer and an agreed decision record are required; a checker finding remains separate from approval.

Acceptance example: Editing a submitted requirement prevents an earlier acceptance from applying to the new wording.

Documented demo precedent: Revision-bound prototype decisions and return-to-author history are documented; simulated personas do not establish production identity. See [authority-model.md](authority-model.md).

### CAP-05: Version processing instructions and retain run provenance

Supports J01, J02, J03, J09, J15; grouped in P0.

Inputs: SRC, METHOD. Outputs: METHOD, REVIEW.

Minimum useful version: Select an agreed prompt, output schema, source/context revisions, and model configuration; retain result, validation failures, and run identity.

Later capability: A managed policy registry, richer run comparison, and evaluated configuration changes.

Hard prerequisites: CAP-01, CAP-02.

External prerequisites: A method owner agrees the initial instructions, output contract, and evaluation examples.

Acceptance example: Two drafts can be compared using their exact inputs and prompt versions; a failed output does not become accepted evidence.

Documented demo precedent: Versioned source/context/needs/requirements/impact contracts and run records are documented. See [llm-actions.md](llm-actions.md).

### CAP-06: Capture source material manually with citations

Supports J01, J13; grouped in P1.

Inputs: SRC. Outputs: SRC.

Minimum useful version: Paste or upload supported text; retain origin, revision, captured content, and exact locators. Record duplicate capture without duplicating the interpretation work.

Later capability: Additional source formats and assisted selection of relevant spans.

Hard prerequisites: CAP-02.

External prerequisites: A usable source and the selected capture destination must be available.

Acceptance example: A pasted transcript remains identifiable, and a draft need points to the exact quoted passage.

Documented demo precedent: Text/Markdown source intake and source-derived provenance are documented. See [product-architecture.md](product-architecture.md).

### CAP-07: Extract source text from documents

Supports J01, J12, J13; grouped in P1.

Inputs: SRC, DOC. Outputs: SRC.

Minimum useful version: Extract supported text-based PDF/DOCX content with page/paragraph locators, original file references, and visible extraction warnings.

Later capability: Additional formats and separately evaluated OCR where needed.

Hard prerequisites: CAP-06.

External prerequisites: Representative files, extraction limits, and a decision about retaining the original bytes are required.

Acceptance example: A requirement citation opens the correct paragraph in the imported document revision.

Documented demo precedent: WP-30 document intake and anchored extraction are recorded as local work in the delivery plan; acceptance status is not rechecked here. See [delivery-plan.md](delivery-plan.md).

### CAP-08: Capture selected Slack discussions

Supports J01, J13; grouped in P-IN.

Inputs: SRC. Outputs: SRC.

Minimum useful version: Import a selected thread with message IDs, author/time, edits, and source references into the common intake path.

Later capability: Scoped ongoing observation, edited/deleted-message handling, and recoverable capture.

Hard prerequisites: CAP-06.

Conditional prerequisite: Capture runs unattended → CAP-39.

External prerequisites: The selected workspace, access permissions, capture scope, and retention expectations must be agreed.

Acceptance example: A thread becomes a cited source without implying that every message is an approved product decision.

Documented demo precedent: No live Slack connector is established by the current documentation. See [product-architecture.md](product-architecture.md).

### CAP-09: Capture meeting transcripts and associated notes

Supports J01, J13; grouped in P-IN.

Inputs: SRC. Outputs: SRC.

Minimum useful version: Import an identified transcript/notes pair with meeting date, speaker/time locators where supplied, and revision references.

Later capability: A selected meeting-platform connection and recovery of later transcript corrections.

Hard prerequisites: CAP-06.

Conditional prerequisite: Capture runs unattended → CAP-39.

External prerequisites: The selected transcript source, access, and interpretation of speaker/time metadata must be agreed.

Acceptance example: A candidate decision cites a transcript passage while a later correction creates a new source revision.

Documented demo precedent: Manual source intake offers a reuse path; a live meeting-platform connector is not established. See [product-architecture.md](product-architecture.md).

### CAP-10: Ask and resolve clarification questions

Supports J01, J02, J03, J16; grouped in P1.

Inputs: SRC, SCOPE, CLAR. Outputs: CLAR, REVIEW.

Minimum useful version: Identify ambiguous or unsupported statements, assign questions, and retain answers/deferrals with their source and rationale.

Later capability: Assisted question generation, discipline routing, and richer conflict handling.

Hard prerequisites: CAP-02, CAP-04.

External prerequisites: Someone with the relevant product/domain knowledge must be available to answer material questions.

Acceptance example: An unclear alert threshold produces a question rather than an invented numeric requirement.

Documented demo precedent: Source-context questions with required/advisory handling are documented. See [llm-actions.md](llm-actions.md).

### CAP-11: Draft needs and requirements from agreed evidence

Supports J02, J03; grouped in P1.

Inputs: SRC, SCOPE, CLAR, NEED, CTRL, USE. Outputs: NEED, SYS, SUB, LINK.

Minimum useful version: Run an agreed prompt to produce a small structured batch of cited candidate needs/requirements and proposed links. Required clarifications and relevant risk/task inputs enter the context. Derived requirements use reviewed needs; parent acceptance does not approve the resulting requirement.

Later capability: Additional evidence types, tailored schemas, and improved drafting based on evaluated feedback.

Hard prerequisites: CAP-05, CAP-06, CAP-10, CAP-13.

External prerequisites: Agree the output type, destination, source context, and representative evaluation examples. Risk/task inputs may be supplied externally.

Acceptance example: A transcript creates a candidate need and measurable requirement with citations; the reviewer corrects unsupported detail before acceptance.

Documented demo precedent: Needs/requirements drafting is documented; the full risk/usability-before-requirements workflow remains broader than the existing source-first slice. See [llm-actions.md](llm-actions.md).

### CAP-12: Check and revise the worker's draft

Supports J02, J03, J04, J12; grouped in P1.

Inputs: NEED, SYS, SUB, DESIGN, METHOD, LINK. Outputs: NEED, SYS, SUB, DESIGN, REVIEW.

Minimum useful version: Apply defined checks for schema, measurability, units, citations, and link rules. Record findings; a person or drafting agent revises and rechecks within a bounded loop.

Later capability: Targeted agent repairs, additional domain rules, and tool-assisted checking.

Hard prerequisites: CAP-02, CAP-03, CAP-05.

External prerequisites: Agree the check criteria and retry/escalation limits for each output type.

Acceptance example: A requirement missing a measurable criterion is revised or routed to a person; exhausting retries leaves the issue visible.

Documented demo precedent: Schema/provenance validation and deterministic checks are documented; a general autonomous revise/recheck loop is a proposed increment. See [llm-actions.md](llm-actions.md).

### CAP-13: Find and assemble relevant existing evidence

Supports J02, J03, J04, J05, J06, J07, J08, J09, J10, J11, J12, J14; grouped in P1.

Inputs: SRC, NEED, SYS, SUB, ARCH, HAZ, CTRL, TEST, LINK, BASE. Outputs: SRC, NEED, SYS, SUB, ARCH, HAZ, CTRL, TEST, LINK, BASE.

Minimum useful version: Open a curated set of referenced records and exact versions from their homes; retain the context selection and mark unavailable evidence.

Later capability: Search, filtering, semantic retrieval, and independently selected context bundles.

Hard prerequisites: CAP-02.

External prerequisites: Read access and usable references to the evidence needed by the selected job.

Acceptance example: A requirement reviewer can inspect the existing need, risk control, and related test without relying on the drafting agent's summary.

Documented demo precedent: Evidence browsing, graph neighborhoods, and bounded impact retrieval are documented. See [product-architecture.md](product-architecture.md).

### CAP-14: Propose and review trace-link changes

Supports J03, J04, J05, J06, J07, J08, J09, J10, J12, J14; grouped in P1.

Inputs: NEED, SYS, SUB, ARCH, CTRL, TEST, LINK, REVIEW. Outputs: LINK, REVIEW.

Minimum useful version: Create, confirm, retype, or retire a link with defined meaning, endpoint/version context, rationale, and a separate decision.

Later capability: Bulk proposal review and changes launched from the graph, matrix, or change work.

Hard prerequisites: CAP-02, CAP-03, CAP-04.

External prerequisites: The authoritative link home and reviewer must be agreed. Existing external link controls can supply this capability.

Acceptance example: Rejecting a suggested test link leaves the suggestion in history and keeps it out of the confirmed trace set.

Documented demo precedent: WP-10 controlled relationship lifecycle is documented as accepted at prototype scope. See [delivery-plan.md](delivery-plan.md).

### CAP-15: Inspect traceability and identify defined coverage gaps

Supports J03, J05, J06, J07, J08, J09, J10, J11, J12, J14; grouped in P2.

Inputs: NEED, SYS, SUB, CTRL, TEST, VP, LINK, BASE. Outputs: REVIEW, DOC.

Minimum useful version: Show a read-only matrix/neighborhood from identifiable accepted links and report missing relationships under named scope rules.

Later capability: Candidate-state comparison, richer domain coverage, and explainable gap priorities.

Hard prerequisites: CAP-02, CAP-03, CAP-13.

External prerequisites: A usable relationship set and agreed coverage expectations. The set may be imported from a bought tool.

Acceptance example: A control lacking an applicable verification test is visible with the reason and affected version.

Documented demo precedent: Matrix, graph, coverage rules, and candidate projections are documented. See [relationship-policy.md](relationship-policy.md).

### CAP-16: Coordinate a change and its follow-up work

Supports J04, J05, J06, J07, J08, J09, J10, J13; grouped in P2.

Inputs: SRC, BASE, CHANGE, REVIEW. Outputs: CHANGE, WORK, REVIEW.

Minimum useful version: Record old/proposed states, reason, scope, impact decisions, owners, and update/relink/retest tasks; retain unresolved work.

Later capability: Integrated review queues, task synchronization, and workflow rules for different change classes.

Hard prerequisites: CAP-02, CAP-04.

External prerequisites: Agree what constitutes a significant change, the responsible disciplines, and the chosen work home.

Acceptance example: A threshold change has named requirement, risk, test, and label follow-up with separate dispositions.

Documented demo precedent: Controlled change, impact decisions, return-to-author, and reanalysis are documented. See [product-architecture.md](product-architecture.md).

### CAP-17: Trace the known consequences of a change

Supports J05, J07, J09, J10; grouped in P2.

Inputs: CHANGE, BASE, LINK, NEED, SYS, SUB, CTRL, TEST, LABEL. Outputs: REVIEW, CHANGE.

Minimum useful version: Traverse known links under defined bounds and show why each record is in the review set.

Later capability: Configurable traversal and collection/configuration-aware impact context.

Hard prerequisites: CAP-03, CAP-13, CAP-16.

External prerequisites: Relevant links and a declared traversal policy must be available; an empty graph cannot establish absence of impact.

Acceptance example: The reviewer can follow the path from the changed requirement to a control and verification plan.

Documented demo precedent: Bounded graph/collection candidate selection and path origins are documented. See [llm-actions.md](llm-actions.md).

### CAP-18: Independently check a candidate or change

Supports J02, J03, J04, J05, J06, J07, J08, J09, J10, J11, J12, J14; grouped in P1.

Inputs: SRC, NEED, SYS, SUB, HAZ, CTRL, TEST, RUN, LINK, CHANGE, METHOD. Outputs: REVIEW, FB.

Minimum useful version: Use a separate reviewer or checker with underlying sources, explicit criteria, and independently selected context. Record findings, coverage limits, and exact examined versions.

Later capability: Automated broader checks using separately configured model/prompt/context choices, with evaluated independence and miss/false-alarm measures.

Hard prerequisites: CAP-02, CAP-04, CAP-05, CAP-13.

Conditional prerequisite: Checking a significant change with assigned follow-up → CAP-16.

External prerequisites: An independent checker and relevant evidence access are needed. Formal approval remains a separate decision.

Acceptance example: The outer check catches an affected control or test omitted by the worker and sends a finding to the responsible person.

Documented demo precedent: Impact assistance and deterministic coherence checks offer components; the documented workflow does not establish a fully independent outer-check design. See [llm-actions.md](llm-actions.md).

### CAP-19: Suggest missing relationships and unlinked impacts

Supports J03, J05, J07, J09; grouped in P2.

Inputs: CHANGE, SRC, SYS, SUB, CTRL, TEST, LINK, METHOD. Outputs: LINK, REVIEW.

Minimum useful version: Search supplied records beyond known links and propose cited possible relationships/impacts; people confirm or reject them.

Later capability: Improved retrieval and evaluations that measure consequential misses and unhelpful suggestions.

Hard prerequisites: CAP-03, CAP-05, CAP-13, CAP-04.

External prerequisites: A representative evidence corpus, review criteria, and access to records outside the current linked neighborhood.

Acceptance example: A relevant label outside the confirmed graph appears as a possible impact and stays provisional until reviewed.

Documented demo precedent: Semantic impact candidates are documented; similarity remains distinct from controlled traceability. See [llm-actions.md](llm-actions.md).

### CAP-20: Detect source and implementation drift

Supports J01, J04, J09, J13; grouped in P2.

Inputs: SRC, WORK, CODE, RUN, BASE. Outputs: SRC, CHANGE, REVIEW.

Minimum useful version: Compare captured old/new observations, distinguish duplicates from material changes, and route meaningful drift to review without rewriting accepted records.

Later capability: Continuous scoped observation and recoverable synchronization.

Hard prerequisites: CAP-02, CAP-06, CAP-16.

Conditional prerequisite: Observation runs unattended → CAP-39.

External prerequisites: The previous observed revision and current source access must be available.

Acceptance example: A changed transcript or commit creates review work while the prior requirement and baseline retain their original basis.

Documented demo precedent: Source-revision drift is documented; live work-system observations are broader planned work. See [system-architecture.md](system-architecture.md).

### CAP-21: Connect design, work, code, and builds

Supports J04, J07, J09, J11, J13; grouped in P3.

Inputs: SYS, SUB, ARCH, DESIGN, WORK, CODE, LINK. Outputs: ARCH, DESIGN, WORK, CODE, LINK.

Minimum useful version: Author or reference design records and manually associate requirement/component IDs, tasks, commits, PRs, and builds with reviewed link meanings.

Later capability: Assisted as-built comparison and synchronized implementation references.

Hard prerequisites: CAP-02, CAP-03, CAP-14.

External prerequisites: Access to the selected work/repository/build systems and agreement on design granularity.

Acceptance example: A reviewer can identify the design rationale, work item, and exact implementation revision associated with a requirement.

Documented demo precedent: Component evidence exists in the product model; live repository/work-tracker connections remain planned in the documentation. See [product-architecture.md](product-architecture.md).

### CAP-22: Observe work-tracker records

Supports J04, J09, J13; grouped in P-IN.

Inputs: WORK, SRC. Outputs: WORK, SRC.

Minimum useful version: Capture a selected ticket revision, assignment/state, and controlled-record references using a defined mapping.

Later capability: Event-driven capture and deliberate exchange of follow-up tasks without duplicating product truth.

Hard prerequisites: CAP-02, CAP-06.

Conditional prerequisite: Updates should create drift review → CAP-20.

Conditional prerequisite: Capture runs unattended → CAP-39.

External prerequisites: Select the tracker, access, field mapping, and task-state authority.

Acceptance example: A ticket update becomes an observation; moving a ticket to Done does not accept a requirement.

Documented demo precedent: Fixture-backed work observations are planned in WP-40; no live connector is established here. See [delivery-plan.md](delivery-plan.md).

### CAP-23: Observe repository and PR revisions

Supports J04, J09, J13; grouped in P-IN.

Inputs: CODE, SRC. Outputs: CODE, SRC.

Minimum useful version: Capture exact commits, paths, PR decisions, and build references with origin and mapping metadata.

Later capability: Scoped event handling and assisted comparison between intended and observed implementation.

Hard prerequisites: CAP-02, CAP-06.

Conditional prerequisite: Changes should create drift review → CAP-20.

Conditional prerequisite: Capture runs unattended → CAP-39.

External prerequisites: Select repository/PR access and the observation scope; code presence does not establish product intent.

Acceptance example: A changed threshold is associated with its commit and relevant evidence without silently changing a requirement.

Documented demo precedent: Repository observation is described as planned product direction. See [product-architecture.md](product-architecture.md).

### CAP-24: Capture CI executions and report evidence

Supports J07, J11, J13; grouped in P-IN.

Inputs: CODE, TEST, RUN, SRC. Outputs: RUN, SRC, REVIEW.

Minimum useful version: Import a run/report bundle with exact build/test references, provenance, result checks, and file integrity; retain the execution and its review separately.

Later capability: A selected live CI connection with authenticated run observations and recoverable report capture.

Hard prerequisites: CAP-02, CAP-06, CAP-26.

Conditional prerequisite: Capture runs unattended → CAP-39.

External prerequisites: Agree CI report formats, required checks, test/build mappings, and read access.

Acceptance example: A green pipeline from a different commit cannot provide current evidence for the proposed build.

Documented demo precedent: Manual verified GitHub Actions bundle import is documented; a live CI connector is not established. See [delivery-plan.md](delivery-plan.md).

### CAP-25: Run checks in normal PR and work-item workflows

Supports J04, J07, J09, J13; grouped in P3.

Inputs: WORK, CODE, CHANGE, METHOD. Outputs: REVIEW, CHANGE.

Minimum useful version: Provide an explicit command/action from the chosen developer workflow that checks named revisions and reports findings there with evidence links.

Later capability: Event-triggered checks and agreed tool-native gates for defined significant changes.

Hard prerequisites: CAP-16, CAP-18.

Conditional prerequisite: Checks run unattended → CAP-39.

Conditional prerequisite: Checks use captured PR context → CAP-23.

External prerequisites: Select the event/command surface, criteria, write permissions for results, and ownership of any gate.

Acceptance example: A PR author sees independent requirement/risk/test findings before the significant change proceeds.

Documented demo precedent: Thin developer-tool controls are identified as a gap in the charter alignment notes. See [sdlc-charter-alignment.md](sdlc-charter-alignment.md).

### CAP-26: Manage verification plans, executions, and dispositions

Supports J07, J09, J11; grouped in P3.

Inputs: SYS, SUB, ARCH, DESIGN, CTRL, TEST, CODE, LINK. Outputs: TEST, RUN, DEFECT, REVIEW, LINK.

Minimum useful version: Maintain a test plan at a named V-model level, link its criterion to the checked item, record an exact execution/configuration, and review the outcome.

Later capability: More execution formats, regression selection, suite-level coverage, and stale-evidence detection.

Hard prerequisites: CAP-02, CAP-03, CAP-04, CAP-14.

External prerequisites: Test owners, criteria, build/environment identity, and access to original execution evidence.

Acceptance example: A failed execution creates an anomaly; a rerun is a new execution and does not erase the failure.

Documented demo precedent: WP-20A test-plan/execution/review controls are documented at fictional prototype scope. See [delivery-plan.md](delivery-plan.md).

### CAP-27: Support risk analysis, controls, and residual-risk review

Supports J05, J03, J07, J11, J12; grouped in P-R.

Inputs: SCOPE, HAZ, CTRL, RUN, VR, RISK, LINK. Outputs: HAZ, CTRL, RISK, LINK, REVIEW.

Minimum useful version: Maintain or reference risk records and controls, their requirement/test links, supporting evidence, and named risk decisions.

Later capability: Domain-specific analysis forms, control effectiveness checks, and broader risk-change assistance.

Hard prerequisites: CAP-02, CAP-03, CAP-04, CAP-14.

External prerequisites: Risk owners, criteria, relevant analyses, and supporting evidence appropriate to the selected product scope.

Acceptance example: Changing a control exposes the requirement/test evidence and residual-risk decision that need review.

Documented demo precedent: Hazard/control evidence and WP-20B residual-risk decisions are documented; a complete risk authoring system is broader work. See [delivery-plan.md](delivery-plan.md).

### CAP-28: Support tasks, UI requirements, and usability evidence

Supports J06, J02, J03, J05, J08; grouped in P-U.

Inputs: USE, NEED, HAZ, SUB, VP, VR. Outputs: USE, SUB, VP, VR, LINK, REVIEW.

Minimum useful version: Maintain or reference user tasks, critical tasks, UI requirements, study versions, and resulting review actions.

Later capability: Dedicated formative/summative workflow and assisted use-related coverage checks.

Hard prerequisites: CAP-02, CAP-04, CAP-14.

External prerequisites: Usability owner, task identities, study evidence, and applicability to the selected scope.

Acceptance example: A critical task can be followed through the UI requirement to its evaluation outcome.

Documented demo precedent: General clinical/usability evidence is in the product model; a dedicated usability workflow is not established. See [product-architecture.md](product-architecture.md).

### CAP-29: Support validation and claim-evidence review

Supports J08, J02, J05, J11, J12; grouped in P-V.

Inputs: NEED, SCOPE, CLAIM, VP, VR, CODE. Outputs: VP, VR, CLAIM, LINK, REVIEW.

Minimum useful version: Maintain or reference protocols/results per need or claim, their evaluation configuration, limitations, and review decisions.

Later capability: Dedicated study/evidence-package workflows and domain-specific coverage checks.

Hard prerequisites: CAP-02, CAP-04, CAP-14.

Conditional prerequisite: A usability evaluation supplies validation → CAP-28.

Conditional prerequisite: Model/data evidence supplies validation → CAP-31.

External prerequisites: Validation/domain owners, criteria, population/scenario scope, and original evaluation evidence.

Acceptance example: A claim unsupported by the selected study remains an unresolved finding even if system tests pass.

Documented demo precedent: Clinical evidence and validation links appear in the product model; a full validation workflow is not established. See [product-architecture.md](product-architecture.md).

### CAP-30: Author and review labelling and instructions

Supports J03, J05, J08, J11, J12; grouped in P4.

Inputs: SUB, CLAIM, RISK, LABEL, LINK. Outputs: LABEL, LINK, REVIEW.

Minimum useful version: Maintain controlled label content with source requirements, supported claims, limitations, risk disclosures, and separate review.

Later capability: Template-assisted label authoring, cross-version comparison, and broader consistency checks.

Hard prerequisites: CAP-02, CAP-04, CAP-14.

Conditional prerequisite: Risk disclosure is required → CAP-27.

Conditional prerequisite: Claims require validation support → CAP-29.

External prerequisites: Label owner and applicable claim/risk evidence; the authoritative content home remains provisional.

Acceptance example: Changing a performance claim identifies the label wording and supporting evidence that must be reconsidered.

Documented demo precedent: Label evidence/change scenarios are documented; dedicated label authoring remains broader work. See [product-architecture.md](product-architecture.md).

### CAP-31: Associate model and dataset versions with product evidence

Supports J14, J04, J05, J07, J08, J11; grouped in P-M.

Inputs: ML, SCOPE, CODE, TEST, RUN, VR. Outputs: ML, LINK, REVIEW.

Minimum useful version: Reference dataset/model identities, provenance, partitions, training configuration, locked-test criteria, and the exact build/evaluation using them.

Later capability: Adapters to selected registries and domain-specific split/performance/change checks.

Hard prerequisites: CAP-02, CAP-04, CAP-14.

External prerequisites: An applicable ML scope, accessible artifact versions, and agreed data/model ownership and criteria.

Acceptance example: A performance report tied to model A does not establish performance of a release containing model B.

Documented demo precedent: Dataset/model records are in the wider planning map, with no dedicated implemented workflow established here. See [product-architecture.md](product-architecture.md).

### CAP-32: Review and freeze an exact evidence baseline

Supports J09, J10, J11, J12; grouped in P4.

Inputs: NEED, SYS, SUB, ARCH, LINK, REVIEW, CHANGE. Outputs: BASE, REVIEW.

Minimum useful version: Select exact evidence/link versions, inspect current decisions and coherence, and record a separate baseline decision while retaining the prior state.

Later capability: Richer baseline comparison and checks for more evidence families.

Hard prerequisites: CAP-02, CAP-04, CAP-14.

External prerequisites: A baseline authority and the evidence scope/decision criteria must be agreed. A bought-tool baseline can supply the capability.

Acceptance example: A later requirement edit creates new candidate work while documents from the previous baseline remain reproducible.

Documented demo precedent: Immutable baseline selection, projections, decisions, and retained history are documented. See [authority-model.md](authority-model.md).

### CAP-33: Render and review baseline-linked document packages

Supports J10, J11, J12; grouped in P4.

Inputs: BASE, DOC, REVIEW. Outputs: DOC, REVIEW.

Minimum useful version: Use an agreed template to assemble a version-identifiable document/package from exact baseline membership, then review completeness.

Later capability: Governed template versions, automated PDF/DOCX/ZIP outputs, and meaningful redlines.

Hard prerequisites: CAP-32.

External prerequisites: Document owners, required outputs, templates, and access to baseline evidence.

Acceptance example: A specification identifies the evidence versions it contains and explains differences from the prior output.

Documented demo precedent: WP-30 controlled snapshots/templates/packages are recorded as local work; this exercise does not revalidate acceptance. See [delivery-plan.md](delivery-plan.md).

### CAP-34: Assemble release evidence and a separate decision

Supports J11, J10, J12; grouped in P4.

Inputs: BASE, CODE, RUN, VR, RISK, LABEL, DEFECT, DOC, REVIEW. Outputs: REL, REVIEW.

Minimum useful version: Join the named baseline/build to applicable current support, open-issue dispositions, and required distinct release/transfer decisions.

Later capability: Automated freshness/readiness checks and richer transfer packages for the selected scope.

Hard prerequisites: CAP-32, CAP-21, CAP-26, CAP-30, CAP-04.

Conditional prerequisite: Risk acceptance is required for this release → CAP-27.

Conditional prerequisite: Validation evidence is required → CAP-29.

Conditional prerequisite: A document package is required → CAP-33.

Conditional prerequisite: Model/data versions are part of the release → CAP-31.

External prerequisites: Agree release scope, required evidence, decision authorities, and the selected release home.

Acceptance example: A changed test, label, or risk decision makes the relevant readiness assessment subject to recheck.

Documented demo precedent: WP-20B final-release controls are documented at fictional prototype scope, with specified support and role limits. See [delivery-plan.md](delivery-plan.md).

### CAP-35: Capture corrections and failure feedback

Supports J01, J02, J03, J04, J05, J06, J07, J08, J09, J10, J11, J12, J13, J14, J15; grouped in P-L.

Inputs: REVIEW, CHANGE, RUN, DEFECT, SRC, METHOD. Outputs: FB.

Minimum useful version: Retain before/after, reason, relevant record/source/method versions, and subsequent outcome when someone corrects or rejects work.

Later capability: Structured failure categories and feedback capture embedded in every review surface.

Hard prerequisites: CAP-02, CAP-04.

External prerequisites: Agree a small feedback record and responsibility for completing it. Start with human edits and rejections.

Acceptance example: A reviewer changing an invented threshold records what changed and why, rather than leaving only the final wording.

Documented demo precedent: Audit and correction histories offer source material; a joined meta-loop feedback workflow is not established. See [authority-model.md](authority-model.md).

### CAP-36: Review recurring corrections and failures

Supports J15, J16; grouped in P-L.

Inputs: FB, REVIEW, RUN, DEFECT. Outputs: FB, REVIEW.

Minimum useful version: A process owner periodically groups feedback, investigates causes, and records proposed improvements; a spreadsheet or simple query can suffice.

Later capability: Assisted pattern summaries across suitable projects, with access-aware aggregation and follow-up tracking.

Hard prerequisites: CAP-35.

External prerequisites: A named process owner, review cadence, sufficient context, and appropriate access to project feedback.

Acceptance example: Repeated missing control links lead to an investigation of context selection rather than repeated one-off instructions.

Documented demo precedent: The loop concept comes from the user's framing; a recurring cross-project review workflow is proposed. See [bluebridge-problem-framing.md](bluebridge-problem-framing.md).

### CAP-37: Evaluate and adopt improved working methods

Supports J15, J16; grouped in P-L.

Inputs: FB, METHOD, REVIEW. Outputs: METHOD, REVIEW.

Minimum useful version: Propose a versioned prompt/rule/context/tool change, evaluate failure examples and previously correct cases, record adoption, and observe later regressions.

Later capability: A richer evaluation library, comparisons by method version, and monitored rollout.

Hard prerequisites: CAP-05, CAP-35, CAP-04.

External prerequisites: A method owner, representative reviewed examples, evaluation criteria, and an adoption decision.

Acceptance example: A new context rule catches the missed label while preserving correct previous decisions; it changes future methods without rewriting product records.

Documented demo precedent: Prompt evaluation and offline regression precedents are documented; continuous meta-loop adoption is broader work. See [prompt-evaluation.md](prompt-evaluation.md).

### CAP-38: Exchange records and preserve a handover path

Supports J01, J02, J03, J04, J05, J06, J07, J08, J09, J10, J11, J12, J13, J14, J16; grouped in P0.

Inputs: SRC, NEED, SYS, SUB, LINK, REVIEW, BASE. Outputs: SRC, NEED, SYS, SUB, LINK, REVIEW, BASE.

Minimum useful version: Define a small import/export contract for the first workflow, preserve IDs/provenance/decisions, and record the accepted target IDs. Manual transfer can suffice.

Later capability: Selected API adapters, broader history/attachment exchange, and rehearsed migration of scoped record ownership.

Hard prerequisites: CAP-02, CAP-03, CAP-04.

External prerequisites: Agree the destination's supported format and ownership boundary; confirm access to history and relationships before a handover.

Acceptance example: Accepted drafts reach the chosen evidence home with their source references and decisions; the team can retrieve them there without a second authoritative copy.

Documented demo precedent: Document packages and an authority model offer pieces; supplier-neutral exchange and handover are proposed. See [authority-model.md](authority-model.md).

### CAP-39: Run background work with visible status and recovery

Supports J01, J04, J07, J09, J13, J15; grouped in P3.

Inputs: SRC, CHANGE, METHOD, REVIEW. Outputs: SRC, CHANGE, REVIEW.

Minimum useful version: Give unattended capture/check operations durable identities, explicit queued/running/failed/completed states, bounded retries, duplicate handling, and a recovery path.

Later capability: Broader job coordination, concurrency protection, cost limits, and operational monitoring.

Hard prerequisites: CAP-02, CAP-05.

External prerequisites: Agree operating environment, ownership of failed work, and recovery/retention expectations.

Acceptance example: A connector retry captures the same source revision once; a failed check remains visible and cannot be mistaken for a passing review.

Documented demo precedent: Run failures are documented; durable jobs/recovery and related production foundations are deferred in the delivery plan. See [delivery-plan.md](delivery-plan.md).

## Features convenient to group without a hard dependency

- CAP-08, CAP-09: Conversation capture uses a common intake contract; either source can ship alone.
- CAP-22, CAP-23, CAP-24: Engineering adapters share identity/provenance work; each has its own source mapping and downstream use.
- CAP-15, CAP-17: A trace view helps explain impact traversal, but traversal does not need a graphical UI.
- CAP-35, CAP-36, CAP-37: Feedback, pattern review, and method evaluation form a practical meta-loop; feedback capture is useful before automated pattern analysis.

## Hybrid ownership and handover

Before the first slice, choose the source home, the candidate/review home, the accepted record home, and the owner of each decision. If BlueBridge drafts while a bought tool owns accepted requirements, CAP-38 must preserve the source and decision references and record the target IDs. Internal candidate records remain identifiable as proposals.

Before transferring an authoritative workflow, demonstrate the agreed job end to end in the new home; reconcile IDs, versions, links, decisions, attachments, and historical access; disposition unresolved work; and name the cutover owner. Choose native features by actual need. Repository, CI, work tracking, study, and model systems can keep their facts throughout.

## Decisions needed to estimate and prioritise

1. Choose the first workflow and evidence scope. The proposal above favours P1, with P2 as an alternative if current pain/data favour change review.
2. Choose an initial target home and minimum exchange method, including what remains manual.
3. Name the author, independent checker, decision owner, and method owner for that scope.
4. Review representative source/trace data and compare current completion/review effort.
5. Review the fresh-build P0/P1/P2 estimate against its pilot scope and named staffing assumptions. Use recalled demo pace as provisional calibration, then replace it with fresh-build actuals.
6. Select adapters one at a time after the toolset choice. Confirm access, mappings, and reliability needs before estimating them.

The separate estimation pass provides provisional effort scenarios for a narrow P0/P1/P2 pilot. Other increments remain unestimated. Availability of reviewers, source quality, and selected systems can change elapsed time independently of implementation effort.

## Source and regeneration

Source basis: the user-reviewed job map, loop-engineering discussion, confirmed transition context, and local prototype documentation. Feature scope, internal/bought/manual allocation, and calendar estimates remain proposals. Supplier capabilities have not been investigated in this step.

Edit [build_feature_map.py](planning/build_feature_map.py), then run `python3 docs/planning/build_feature_map.py`. It reads the canonical job-map definitions and regenerates this reference, the visual map, JSON data, SVG, and draw.io roadmap. It checks all job/record references, feature/package coverage, unique IDs, hard-dependency cycles, and diagram structure. Conditional requirements are stated by scope; package ordering does not silently turn affinities into hard prerequisites.
