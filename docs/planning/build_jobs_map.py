"""Regenerate the BlueBridge planning map with Python 3 and no dependencies.

Run from any directory: python3 /path/to/docs/planning/build_jobs_map.py
Edit the job, record, and flow definitions here. Outputs are planning artifacts,
not the application's schema or its controlled relationship policy.
"""

from pathlib import Path
import html
import json
import textwrap
import xml.etree.ElementTree as ET


DOCS = Path(__file__).resolve().parents[1]
OUT = DOCS / "planning"
DATE = "9 October 2026"

RECORDS = [
    ("SRC", "Source revisions", "Originating source system; captured revision in the chosen evidence store.", "Slack thread, transcript, authored note, document, or external observation with origin, revision, date, and exact locator."),
    ("SCOPE", "Product scope and planning basis", "Chosen controlled evidence store, provisional.", "Intended use, population, scope, owners, criteria, methods, and applicable project agreements."),
    ("CLAR", "Clarification and decision", "Chosen controlled evidence store, provisional.", "Question, response, responsible person, rationale, and source or candidate revision."),
    ("NEED", "User need", "Chosen controlled evidence store, provisional.", "Stable item ID; individual version with statement, basis, owner, and decision state."),
    ("SYS", "Product / system requirement", "Chosen controlled evidence store, provisional.", "Individual requirement with parent need, acceptance criteria, version, and review state."),
    ("SUB", "Software / hardware / UI / labelling requirement", "Chosen controlled evidence store, provisional.", "Individual requirement with level, allocation, acceptance criteria, version, and review state."),
    ("ARCH", "Architecture and components", "Chosen design evidence store, provisional; repository references where relevant.", "Versioned component/interface identity and requirement allocation, distinguishing intended and observed design."),
    ("DESIGN", "Detailed design", "Chosen design evidence store or repository, provisional.", "Unit or design element, rationale, interfaces, and links to requirements and components."),
    ("WORK", "Implementation work item", "Chosen work tracker, provisional; Jira is part of the previous arrangement.", "Task identity, scope, owner, status, and controlled-record references."),
    ("CODE", "Implementation and build", "Chosen repository and build system, provisional; GitHub is part of the previous arrangement.", "Repository, path, exact commit, PR review, build identity, and relevant artifacts."),
    ("HAZ", "Hazard and risk analysis", "Chosen risk evidence store, provisional.", "Hazard, hazardous situation, causes, initial assessment, assumptions, and analysis revision."),
    ("CTRL", "Risk control", "Chosen risk evidence store, provisional.", "Individual control with rationale, implementation reference, and effectiveness criteria."),
    ("RISK", "Residual-risk decision", "Chosen controlled evidence store, provisional.", "Risk evaluation and acceptance decision tied to control, test, validation, and product versions; overall evaluation where applicable."),
    ("USE", "Use and usability evidence", "Chosen usability evidence store, provisional.", "User profile, use environment, task, critical task, use-related risk, and formative-study records."),
    ("TEST", "Verification plan / test case", "Chosen test or evidence system, provisional.", "Stable test ID and exact plan version, level, acceptance criteria, required configuration, and traced item."),
    ("RUN", "Verification execution and results", "Execution system owns raw result; reviewed reference and disposition in the chosen evidence store.", "Test-plan version, code/build version, environment, result, attachments, and execution-review decision. A new run is a new record."),
    ("DEFECT", "Anomaly / defect", "Chosen issue tracker owns work state; risk and evidence dispositions retain their own owners.", "Failed expectation, affected version, risk assessment, remediation, retest, and release disposition."),
    ("VP", "Validation plan / protocol", "Chosen validation evidence store, provisional.", "Need or claim, population, intended use, scenarios, acceptance criteria, and evaluation configuration."),
    ("VR", "Validation and clinical results", "Study system owns original results; reviewed evidence and interpretation in the chosen evidence store.", "Protocol version, product version, per-need or per-claim result, critical-task outcomes, and limitations."),
    ("ML", "Dataset and model evidence, if applicable", "Chosen dataset/model systems own artifacts; controlled references retain exact versions.", "Provenance, train/tune/test splits, test-set lock, model/training version, performance, subgroup results, and change scope."),
    ("CLAIM", "Product / clinical claim", "Chosen controlled evidence store, provisional.", "Claim wording, intended population, supporting evidence, limitations, and approved version."),
    ("LABEL", "Labelling and instructions for use", "Chosen controlled evidence store, provisional.", "Versioned label content, claims, risk disclosure, and associated product/release scope."),
    ("LINK", "Trace relationship", "Chosen controlled relationship store, provisional.", "Link identity, endpoint IDs and reviewed version/baseline context, defined meaning, rationale, proposal/change state, and review history. A similarity suggestion is distinct from a confirmed trace."),
    ("REVIEW", "Check, finding, and human decision", "Chosen review/evidence system, provisional.", "Keep automated finding and human disposition distinct. Record object/version, context, checker or reviewer, method, reason, and outcome."),
    ("CHANGE", "Change and impact work", "Chosen change/evidence system, provisional.", "Trigger, old and proposed versions, impacted records, links, follow-up owners, review decisions, and unresolved work."),
    ("BASE", "Reviewed baseline", "Chosen controlled evidence store, provisional.", "Exact reviewed evidence versions, relationship set, relevant decisions, and unresolved dispositions."),
    ("DOC", "Document snapshot / package", "Chosen document/evidence store, provisional.", "Exact baseline, template/renderer versions, evidence membership, rendered files, and package-review state."),
    ("REL", "Release / transfer record", "Chosen release/evidence system, provisional.", "Baseline, build, applicable verification/validation, risk decisions, labels, open anomalies, package, and separate release decision."),
    ("FB", "Correction and failure feedback", "Chosen feedback/evaluation store, provisional; preserve links to project records.", "Before/after, reason, source and output revisions, prompt/rule/tool versions, checker finding, human disposition, and outcome."),
    ("METHOD", "Working methods and evaluation evidence", "Versioned configuration/evaluation store, provisional.", "Prompt, schema, rule, context-selection method, tool configuration, representative examples, evaluation result, and adoption decision."),
]


def job(id, title, actor, trigger, inputs, outputs, steps, decision, handoff,
        change, inner, outer, feedback, friction, measure):
    return dict(id=id, title=title, actor=actor, trigger=trigger, inputs=inputs.split(),
                outputs=outputs.split(), steps=steps, decision=decision,
                handoff=handoff, change=change, inner=inner, outer=outer,
                feedback=feedback, friction=friction, measure=measure)


JOBS = [
    job("J01", "Capture information with a usable source reference", "Meeting participant, product lead, engineer, or source owner",
        "A discussion, document, note, or new source revision contains product information.", "SRC", "SRC CLAR",
        ["Capture the relevant thread, transcript, note, or document revision.", "Record origin, author/date where available, revision, and exact locators.", "Identify missing context, ambiguity, and candidate decisions for follow-up."],
        "A source owner confirms usable capture; candidate statements still need their own review.",
        "J02, J03, J05, J06, or J09 receives the relevant source and questions.",
        "A new source revision raises J13 drift review; earlier interpretations retain their original citation.",
        "Check extraction completeness, locators, duplicates, and structured output.",
        "Inspect the original source for omitted qualifiers, disagreements, or unsupported interpretation.",
        "Capture extraction errors, missed decisions, and manual redirection.",
        "Decisions may be reconstructed later from scattered conversations.", "Capture effort and the proportion of outputs with usable exact source references."),
    job("J02", "Agree the user need and its intended-use context", "Product owner with user, clinical, or domain reviewers",
        "New evidence, an unresolved clarification, or a change affects what users need.", "SRC SCOPE CLAR USE", "NEED CLAIM CLAR REVIEW",
        ["Identify the user, problem, use environment, and desired outcome.", "Resolve ambiguity with the responsible person.", "Record proposed product claims separately from user needs; supporting evidence is reviewed in J08.", "Review each need and retain its source and rationale."],
        "The designated need owner/reviewer accepts, revises, rejects, or defers the specific version.",
        "J03 derives requirements; J08 defines validation against the need.",
        "A changed need prompts review of derived requirements, use-related risks, validation, and claims through J09.",
        "Check clear actor/outcome, source support, duplicates, and unresolved scope.",
        "Challenge interpretation against underlying sources, intended use, and existing needs.",
        "Capture reviewer rewrites and rejected or unsupported needs.",
        "People may confuse a discussion suggestion with an agreed need.", "Time to an accepted need and reviewer correction effort."),
    job("J03", "Translate needs and controls into testable requirements", "Systems, software, hardware, or product engineer",
        "A reviewed need, control, constraint, or parent requirement needs implementation detail.", "NEED SCOPE CLAR CTRL USE SYS LINK", "SYS SUB LINK REVIEW",
        ["Derive product/system requirements and decompose them into software, hardware, UI, and labelling requirements.", "Specify measurable acceptance criteria, allocation, and source/parent links.", "Review requirement versions and proposed links separately."],
        "The assigned discipline reviewer accepts the requirement and its links. Parent acceptance does not accept children.",
        "J04 uses approved design inputs; J07 plans verification; J12 uses the exact versions in specifications.",
        "A changed criterion or allocation prompts design, control, test, and label review through J09.",
        "Check measurability, schema, units, source support, and allowed link types; revise within a bounded loop.",
        "Independently inspect consistency with needs, risk controls, related requirements, and testability.",
        "Capture rejected requirements, ambiguous criteria, missing links, and recurring reviewer edits.",
        "Requirements may be duplicated in tickets or rewritten retrospectively.", "First-pass acceptance, correction effort, and unresolved source/trace gaps."),
    job("J04", "Connect intended design, implementation work, and what was built", "Architect and developer, including coding agents under an assigned owner",
        "A requirement is allocated, a design changes, or implementation/PR evidence becomes available.", "SYS SUB CTRL ARCH DESIGN WORK CODE LINK", "ARCH DESIGN WORK CODE LINK REVIEW",
        ["Allocate requirements to components, interfaces, and detailed design.", "Create implementation tasks that reference controlled IDs.", "Capture authored design rationale and as-built observations tied to exact commits and PRs.", "Review mismatches between intended design and implementation."],
        "Design reviewer owns design acceptance; repository reviewers own PR decisions. Neither decision automatically approves the other record.",
        "J07 consumes exact design and build references; J09 receives design/implementation mismatches.",
        "Code, interface, dependency, or task changes prompt review of the associated design, requirements, risk, and tests.",
        "Check local design/code constraints, referenced IDs, and local tests.",
        "Inspect requirement and control coverage, component boundaries, and configuration consistency beyond the local change.",
        "Capture missed allocations, design/code divergence, PR corrections, and agent redirection.",
        "The reason for a code change may remain in a PR while design evidence becomes stale.", "Effort to reconstruct requirement-to-build evidence and unresolved design/implementation mismatches."),
    job("J05", "Analyse risk, define controls, and assess residual risk", "Risk owner with engineering, clinical, security, usability, and QA reviewers",
        "Scope/design changes, a hazard is identified, or control/test evidence changes.", "SCOPE NEED ARCH CODE USE ML HAZ RUN VR LINK", "HAZ CTRL RISK LINK REVIEW",
        ["Record hazards, causes, assumptions, and the relevant risk analyses, including security and dependencies where applicable.", "Define controls and translate them into requirement/design inputs.", "Define how implementation and effectiveness will be checked.", "Evaluate residual risk against current evidence and record the responsible decision."],
        "The named risk authority records acceptance or further work for the relevant product state.",
        "J03/J04 implement controls; J07 verifies them; J08 contributes use/clinical evidence; J11/J12 use risk decisions and disclosures.",
        "Changed assumptions, controls, failures, or use conditions trigger risk reassessment and linked follow-up.",
        "Check required fields, criteria, control references, and evidence versions.",
        "Challenge missing hazards, ineffective controls, conflicting requirements, and unsupported residual-risk conclusions.",
        "Capture risk-review changes, missing hazards, and recurring control-evidence gaps.",
        "Risk records may lag behind implementation and test changes.", "Time to assess a change and the number/type of unresolved control-evidence gaps."),
    job("J06", "Connect user tasks, interface design, and usability evidence", "Designer and usability lead with product and risk reviewers",
        "A task, user profile, interface, or use-related risk changes.", "SRC SCOPE NEED USE HAZ SUB CODE", "USE SUB VP VR REVIEW",
        ["Describe user profiles, environment, tasks, and critical tasks.", "Use task/risk evidence to define UI requirements.", "Record formative evaluations and resulting changes.", "Connect summative evaluation plans/results to critical tasks and needs."],
        "Assigned design/usability reviewers accept interpretations and required changes; risk acceptance has its own owner.",
        "J02/J03 receive task evidence; J05 receives use-related risk; J08 receives summative validation evidence.",
        "Changed users, tasks, interface, or use errors trigger requirement, risk, and evaluation review.",
        "Check task IDs, design versions, critical-task links, and study/result structure.",
        "Inspect whether tasks and use-related controls are covered by the UI design and evaluation scope.",
        "Capture missing tasks, repeated use errors, and study/document rework.",
        "Task analyses, UI designs, and evaluation results may be maintained separately.", "Effort to trace a critical task through UI requirements to evaluated outcomes."),
    job("J07", "Plan verification and preserve results at every V-model level", "Test engineer or developer with assigned verification reviewer",
        "Requirements/design need tests, a build is ready, or a change requires regression.", "SYS SUB ARCH DESIGN CTRL CODE TEST CHANGE LINK", "TEST RUN DEFECT LINK REVIEW",
        ["Plan unit tests against detailed design, integration tests against components/interfaces, subsystem tests against allocated requirements, and system tests against system requirements.", "Record test identity, plan version, acceptance criteria, configuration, and traced items.", "Execute against an exact build and retain raw results and attachments.", "Review results, record anomalies, and determine relevant regression work."],
        "The assigned reviewer disposes of each execution and its applicability. A passing run alone does not approve a release.",
        "J05 reviews control evidence; J08 references the verified configuration; J11 consumes applicable results and dispositions.",
        "A changed test, requirement, build, environment, or failed execution prompts freshness, regression, and impact review.",
        "Check test schema, criteria, configuration, raw-result integrity, and local failures.",
        "Independently inspect requirement/control coverage, missing tests, stale runs, and consistency across levels.",
        "Capture verification failures, missing coverage, unreliable checks, and incorrect execution associations.",
        "A test result may be available without a reliable link to the requirement and release version.", "Coverage gaps, stale evidence, result-review effort, and missed required regression."),
    job("J08", "Validate user needs and support applicable product claims", "Validation, usability, or clinical lead with assigned reviewers",
        "A product version is evaluated, a need/claim changes, or new study evidence arrives.", "NEED SCOPE USE CLAIM VP CODE RUN ML LINK", "VP VR CLAIM LINK REVIEW",
        ["Define representative needs, populations, scenarios, critical tasks, and applicable claims.", "Specify criteria and the exact evaluation configuration.", "Record results per need/claim, limitations, and unresolved gaps.", "Review conclusions and route failures back to needs, design, risk, or evidence collection."],
        "Assigned reviewers assess whether the evidence supports the specific need or claim. Verification success does not establish validation.",
        "J05 uses relevant results for risk decisions; J11/J12 use reviewed conclusions and limitations.",
        "A changed need, claim, population, interface, model, or evaluated configuration prompts validation-scope review.",
        "Check protocol/result association, criteria, population, and configuration references.",
        "Challenge representativeness, uncovered needs/critical tasks, claim support, and interpretation of failures.",
        "Capture validation failures, unsupported claims, study corrections, and repeated evidence gaps.",
        "Validation conclusions may be stored as reports with weak links to individual needs.", "Effort to establish per-need/claim support and unresolved validation gaps."),
    job("J09", "Determine and resolve the consequences of a change", "Change author and reviewers from affected disciplines",
        "A significant source, requirement, design, code, risk, test, label, or relationship changes.", "SRC CHANGE BASE NEED SYS SUB ARCH CODE HAZ CTRL TEST RUN VR LABEL LINK", "CHANGE LINK REVIEW WORK",
        ["Identify the old state, proposed state, reason, and change scope.", "Inspect known links and independently look for missing relationships or consequences.", "Assign updates, relinking, retesting, and reviews to owners.", "Resolve or explicitly disposition findings before advancing the changed records."],
        "Affected reviewers decide which impacts are real and what follow-up is required; the author does not approve the agent's conclusions by default.",
        "J02 through J08 and J12 receive named follow-up work; J10 receives the reviewed candidate state.",
        "A candidate edit or new external revision makes version-bound checks and decisions subject to freshness review.",
        "Check the proposed change and its known direct relationships.",
        "Independently interrogate impacted requirements, hazards, controls, tests, labels, configuration, and potentially absent links.",
        "Capture missed impacts, false alarms, reviewer additions, and manually redirected analysis.",
        "People may rely on memory to identify impacts across disconnected records.", "Impact-review effort, missed consequential impacts, and unhelpful findings."),
    job("J10", "Establish a coherent reviewed baseline", "Design reviewers and designated baseline authority",
        "A change or review package has a candidate evidence state ready for a decision.", "CHANGE REVIEW NEED SYS SUB ARCH DESIGN HAZ CTRL USE TEST ML CLAIM LABEL LINK", "BASE REVIEW",
        ["Select exact evidence and relationship versions for the proposed scope.", "Check consistency, completeness, current review decisions, and unresolved issues.", "Return work for revision or explicitly disposition it.", "Record the baseline decision and retain the previous baseline."],
        "The designated authority accepts the named evidence state. Baseline acceptance and release approval remain separate.",
        "J12 renders controlled views; J11 references the baseline in release/transfer work; J09 uses it as the comparison state.",
        "New candidate versions require relevant checks and reviews to run again against that state.",
        "Check membership, IDs, version freshness, and known consistency rules.",
        "Independently inspect package-wide consistency and whether unresolved work changes the decision.",
        "Capture returned packages, stale decisions, and repeated coherence findings.",
        "Different documents may describe different versions of the product.", "Baseline-review effort and unresolved or recurring configuration inconsistencies."),
    job("J11", "Establish release or transfer readiness and record the decision", "QA and designated release/transfer owner",
        "A named baseline and implementation version are proposed for release or transfer.", "BASE CODE RUN VR RISK LABEL DEFECT DOC REVIEW", "REL REVIEW",
        ["Assemble applicable current verification, validation, risk, labels, anomalies, and output evidence.", "Check that the evidence applies to the same proposed product/build state.", "Resolve readiness findings and obtain the required distinct decisions.", "Record release/transfer scope and retain the exact evidence references."],
        "The designated release/transfer authority records the final decision according to the chosen process.",
        "Operations or the receiving team uses the release record; J13 monitors later changes and feedback.",
        "Changed supporting evidence requires readiness and decision freshness review; historical release evidence stays identifiable.",
        "Check required records, file integrity, configuration, and decision freshness.",
        "Inspect cross-package coverage, residual risks, validation limitations, open anomalies, and configuration consistency.",
        "Capture readiness blockers, missing support, and recurring release-package rework.",
        "People may manually reconcile test reports, code versions, labels, and approval documents.", "Assembly/review effort and late discoveries of missing or mismatched evidence."),
    job("J12", "Maintain labelling, produce document views, and answer evidence questions", "Evidence or labelling author, reviewer, or QA/RA reader",
        "A label, specification, report, trace matrix, design-review package, or evidence answer is needed.", "BASE NEED SYS SUB ARCH HAZ CTRL RUN VR RISK CLAIM LABEL LINK REVIEW", "LABEL DOC REVIEW",
        ["Author or revise controlled labelling and instructions for use from requirements, supported claims, limitations, and risk disclosures.", "Select the relevant baseline and evidence scope.", "Render or assemble a specification, report, matrix, or package using a named template.", "Preserve exact source membership and review the output.", "Answer a traceability question with references to the underlying records."],
        "The assigned document/package reviewer accepts the projection and completeness; rendering does not create new product truth.",
        "Reviewers, release owners, clients, or other readers receive a version-identifiable output.",
        "Changed baseline or template creates a new output and an explainable difference; edits to exported content return through controlled review.",
        "Check membership, layout, references, template version, and required sections.",
        "Inspect completeness and consistency with the underlying evidence, including meaningful omissions.",
        "Capture recurring document edits, template omissions, and misleading evidence presentation.",
        "Manual copying and reconciliation may consume time and introduce divergence.", "Output-preparation effort, repeated edits, and time to answer a cited evidence question."),
    job("J13", "Detect drift and route ongoing observations into review", "Source and record owners with affected reviewers",
        "A source revision, ticket, commit, test run, defect, or post-release observation arrives.", "SRC WORK CODE RUN DEFECT REL BASE", "SRC CHANGE REVIEW",
        ["Capture the observation at an exact external revision.", "Compare it with the version previously used by evidence.", "Distinguish duplicates, irrelevant updates, and meaningful changes.", "Route meaningful drift into J09 with the relevant records and owners."],
        "The responsible person dispositions drift; external activity does not automatically rewrite controlled evidence.",
        "J09 handles product consequences; J15 receives capture and routing failures.",
        "Repeated capture of the same revision should converge; lost or failed capture remains visible for recovery.",
        "Check source identity, revision ordering, duplicates, and capture completeness.",
        "Inspect whether material changes were missed or incorrectly associated with controlled records.",
        "Capture missed/stale observations, duplicate work, routing errors, and recurring drift.",
        "Evidence may fall behind work in developer tools, particularly as AI accelerates changes.", "Time from observation to disposition, missed material drift, and duplicate review work."),
    job("J14", "Maintain dataset and model evidence where product scope requires it", "ML lead with test, risk, and domain reviewers",
        "A dataset, model, training process, performance criterion, or permitted change scope changes.", "SCOPE SRC SYS SUB HAZ ML TEST RUN VR", "ML REVIEW",
        ["Record dataset origins, versions, partitions, and test-set independence/lock.", "Record model/training configuration and the exact artifact used in a build.", "Associate performance and subgroup evidence with the intended use and predefined criteria.", "Review model/data changes alongside requirements, risk, verification, and validation."],
        "Named ML/domain reviewers decide the evidence interpretation; risk and release decisions retain their own owners.",
        "J04 uses the model artifact; J05, J07, and J08 use its risk and performance evidence; J11 uses the exact released configuration.",
        "Changed model/data versions or distributions trigger performance, risk, traceability, and evaluation-scope review.",
        "Check version identity, split integrity, criteria, and result associations.",
        "Inspect population coverage, leakage/independence assumptions, subgroup limitations, and model/build consistency.",
        "Capture provenance gaps, incorrect version associations, performance failures, and review corrections.",
        "Model, dataset, build, and performance records may be maintained separately.", "Effort to reconstruct the released model/data evidence and unresolved version/provenance gaps."),
    job("J15", "Improve the working system from corrections and failures", "BBT process owner with project engineers and reviewers",
        "Feedback accumulates or an important failure warrants immediate investigation.", "FB REVIEW RUN DEFECT CHANGE METHOD", "FB METHOD REVIEW",
        ["Retain human edits, rejections, QA/risk comments, missing traces, failures, audit observations, document rework, and agent redirection.", "Investigate why patterns recur and distinguish product issues from method or checking failures.", "Propose a versioned change to prompts, rules, context selection, tools, or workflows.", "Evaluate against relevant failure examples and correct cases, review adoption, and monitor subsequent outcomes."],
        "The method/process owner adopts a reviewed method version. This does not retrospectively approve product evidence.",
        "J01 through J14 use the adopted methods; new project feedback returns to this job.",
        "Method changes retain before/after versions and evaluation outcomes; regression or new failures prompt another meta-loop review.",
        "Check feedback identity, source versions, proposed configuration, and evaluation execution.",
        "Independently review whether the proposed method change addresses the cause and introduces new omissions or false alarms.",
        "This is the meta-loop. Regulatory/FDA feedback is one external input; internal project corrections can supply signals from week one.",
        "Repeated corrections may stay in individual reviewers' heads and never improve the process.", "Recurring failure rate, correction effort, and regression outcomes after a method change."),
    job("J16", "Agree product scope, lifecycle methods, and evidence responsibilities", "Product/project owner with engineering, QA, and relevant domain leads",
        "An engagement starts, the toolset changes, or intended use and project scope materially change.", "SRC SCOPE METHOD REVIEW", "SCOPE REVIEW",
        ["Agree intended use, users/population, product boundaries, and the evidence activities applicable to this scope.", "Agree lifecycle methods, acceptance criteria, review cadence, and responsibilities.", "Choose the authoritative home and granularity of each controlled record, including coexistence and handover arrangements.", "Record how human and agent work enter the process and who can make each decision."],
        "The designated engagement owners agree the versioned scope, methods, record ownership, and review responsibilities.",
        "J01–J14 use the agreed scope and criteria; J15 uses the agreed method ownership and evaluation approach.",
        "Scope, home, method, or responsibility changes prompt review of affected workflows and historical-record access.",
        "Check that the proposed plan names record types, owners, criteria, methods, and unresolved decisions.",
        "Independently inspect whether the planned activities and responsibilities cover the selected product scope and normal developer work.",
        "Capture missing ownership, unsuitable review cadence, migration problems, and avoidable process overhead.",
        "Tool selection may move faster than decisions about record ownership and practical review responsibilities.", "Unassigned decisions, duplicate authoritative records, and effort spent reconciling process or ownership ambiguity."),
]

# Direction means information in A is used by B. These are conceptual planning
# relationships, not production schema enums and not automatic approvals.
FLOW_ROWS = [
    ("SRC", "CLAR", "raises questions", "J01 J02"),
    ("SRC", "NEED", "supports interpretation", "J01 J02"),
    ("CLAR", "NEED", "records agreed clarification", "J02"),
    ("SCOPE", "NEED", "constrains intended use", "J02"),
    ("NEED", "SYS", "defines the need to satisfy", "J03"),
    ("SYS", "SUB", "decomposes and allocates", "J03"),
    ("SCOPE", "HAZ", "sets use context and risk criteria", "J05"),
    ("HAZ", "CTRL", "defines risk to control", "J05"),
    ("CTRL", "SYS", "expresses system-level control", "J03 J05"),
    ("CTRL", "SUB", "expresses allocated control", "J03 J05"),
    ("USE", "NEED", "informs user/task needs", "J02 J06"),
    ("USE", "SUB", "informs UI and use-related controls", "J03 J06"),
    ("SYS", "ARCH", "allocates system behaviour", "J04"),
    ("SUB", "ARCH", "allocates requirement to component", "J04"),
    ("ARCH", "DESIGN", "defines component/interface context", "J04"),
    ("SUB", "DESIGN", "defines detailed design obligation", "J04"),
    ("DESIGN", "WORK", "scopes implementation work", "J04"),
    ("WORK", "CODE", "records work implemented at a revision", "J04"),
    ("CODE", "ARCH", "provides as-built observation to reconcile", "J04 J13"),
    ("SYS", "TEST", "defines system verification criteria", "J07"),
    ("SUB", "TEST", "defines subsystem verification criteria", "J07"),
    ("ARCH", "TEST", "defines integration verification scope", "J07"),
    ("DESIGN", "TEST", "defines unit verification scope", "J07"),
    ("CTRL", "TEST", "defines implementation/effectiveness checks", "J05 J07"),
    ("TEST", "RUN", "defines executed plan and criteria", "J07"),
    ("CODE", "RUN", "identifies exact tested build", "J07"),
    ("RUN", "DEFECT", "records failed expectation", "J07"),
    ("DEFECT", "CHANGE", "initiates assessed remediation", "J09 J13"),
    ("NEED", "VP", "defines validation outcome", "J08"),
    ("USE", "VP", "defines tasks and use conditions", "J06 J08"),
    ("CLAIM", "VP", "defines claim to evaluate", "J08"),
    ("VP", "VR", "defines executed evaluation", "J08"),
    ("CODE", "VR", "identifies evaluated configuration", "J08"),
    ("RUN", "VR", "references verification of that configuration", "J08"),
    ("ML", "CODE", "identifies model artifact used", "J04 J14"),
    ("ML", "TEST", "defines dataset/model test configuration", "J07 J14"),
    ("ML", "VR", "provides versioned performance evidence", "J08 J14"),
    ("HAZ", "RISK", "provides assessed hazard context", "J05"),
    ("CTRL", "RISK", "provides control implementation context", "J05"),
    ("RUN", "RISK", "provides control verification evidence", "J05 J07"),
    ("VR", "RISK", "provides relevant validation findings", "J05 J08"),
    ("VR", "CLAIM", "supports or limits claim", "J08"),
    ("RISK", "LABEL", "defines required risk disclosure", "J05 J12"),
    ("CLAIM", "LABEL", "provides supported claim wording", "J08 J12"),
    ("SUB", "LABEL", "defines labelling requirement", "J03 J12"),
    ("CHANGE", "REVIEW", "requests version-specific impact decisions", "J09"),
    ("REVIEW", "BASE", "records decisions for selected evidence state", "J10"),
    ("BASE", "DOC", "selects exact rendered evidence versions", "J12"),
    ("BASE", "REL", "identifies reviewed product state", "J11"),
    ("CODE", "REL", "identifies implementation/build", "J11"),
    ("RUN", "REL", "provides applicable execution and disposition", "J11"),
    ("VR", "REL", "provides applicable validation and limitations", "J11"),
    ("RISK", "REL", "provides applicable risk decisions", "J11"),
    ("LABEL", "REL", "identifies released label versions", "J11"),
    ("DEFECT", "REL", "records remaining anomaly disposition", "J11"),
    ("DOC", "REL", "provides exact output package", "J11 J12"),
    ("REVIEW", "REL", "records separate release decision", "J11"),
    ("SRC", "CHANGE", "raises source-drift work", "J09 J13"),
    ("CODE", "CHANGE", "raises implementation-drift work", "J09 J13"),
    ("RUN", "CHANGE", "raises failure or changed-evidence work", "J09 J13"),
    ("WORK", "CHANGE", "raises relevant external-work observation", "J09 J13"),
    ("BASE", "CHANGE", "provides prior controlled comparison state", "J09"),
    ("REVIEW", "FB", "records edits, rejections, and reasons", "J15"),
    ("RUN", "FB", "records failures and result corrections", "J15"),
    ("CHANGE", "FB", "records missed impacts and redirection", "J15"),
    ("DEFECT", "FB", "records recurring failure evidence", "J15"),
    ("FB", "METHOD", "informs investigated method improvement", "J15"),
    ("METHOD", "REVIEW", "defines versioned checking method", "J15"),
    ("METHOD", "NEED", "defines versioned drafting method", "J02 J15"),
    ("SRC", "SCOPE", "provides project and intended-use basis", "J16"),
    ("SCOPE", "REVIEW", "defines responsibilities, criteria, and methods", "J16"),
    ("USE", "HAZ", "provides use-related hazard context", "J05 J06"),
    ("ML", "HAZ", "provides model/data hazard context", "J05 J14"),
    ("CODE", "HAZ", "provides implementation, dependency, and security observations", "J04 J05"),
    ("DEFECT", "HAZ", "provides observed failure for risk reassessment", "J05 J07"),
    ("SRC", "USE", "supports task and study interpretation", "J01 J06"),
    ("SRC", "CLAIM", "supports proposed claim and its basis", "J02"),
    ("LABEL", "BASE", "selects reviewed labelling version", "J10 J12"),
    ("LINK", "REVIEW", "requests confirmation, retype, retirement, or rejection", "J03 J04 J05 J07 J08 J09"),
    ("LINK", "BASE", "selects confirmed relationship versions", "J10"),
    ("LINK", "CHANGE", "provides known trace context for impact analysis", "J09"),
    ("LINK", "DOC", "provides matrix and cited trace answers", "J12"),
]
FLOWS = [dict(id=f"F{i:02d}", source=s, target=t, meaning=m, jobs=j.split())
         for i, (s, t, m, j) in enumerate(FLOW_ROWS, 1)]


class Diagram:
    def __init__(self, id, title, subtitle, width=1800, height=1120):
        self.id, self.title, self.subtitle = id, title, subtitle
        self.width, self.height = width, height
        self.boxes, self.edges, self.notes = [], [], []

    def box(self, id, title, body, x, y, w, h, kind="record", job=None):
        self.boxes.append(dict(id=id, title=title, body=body, x=x, y=y, w=w, h=h, kind=kind, job=job))

    def edge(self, id, source, target, label, points, label_at, dashed=False):
        self.edges.append(dict(id=id, source=source, target=target, label=label,
                               points=points, label_at=label_at, dashed=dashed))

    def note(self, title, body, x, y, w):
        self.notes.append(dict(title=title, body=body, x=x, y=y, w=w))


def diagrams():
    v = Diagram("v-model", "1. Jobs and evidence across the V model",
                "Working map · provisional record homes · arrows describe information use, not automatic approval", height=1210)
    levels = [
        ("needs", "User needs", "NEED · J02\nUser, outcome, intended use", 150, 220, "validation", "Validation and clinical evidence", "VP / VR · J08\nProtocol → per-need / claim results", 1350, "defines validation"),
        ("sys", "Product / system requirements", "SYS · J03\nBehaviour and acceptance criteria", 250, 340, "system-test", "System verification", "TEST / RUN · J07\nPlan → execution → disposition", 1250, "defines system tests"),
        ("sub", "SW / HW / UI / label requirements", "SUB · J03\nAllocation and control criteria", 350, 460, "sub-test", "Subsystem verification", "TEST / RUN · J07\nPlan → execution → disposition", 1150, "defines subsystem tests"),
        ("arch", "Architecture and components", "ARCH · J04\nComponents and interfaces", 450, 580, "int-test", "Integration verification", "TEST / RUN · J07\nPlan → execution → disposition", 1050, "defines integration tests"),
        ("design", "Detailed design", "DESIGN · J04\nUnits, decisions, rationale", 550, 700, "unit-test", "Unit verification", "TEST / RUN · J07\nPlan → execution → disposition", 950, "unit tests"),
    ]
    for a, title, body, x, y, b, rt, rb, rx, label in levels:
        v.box(a, title, body, x, y, 300, 105, job="J02" if a == "needs" else "J03" if a in ["sys", "sub"] else "J04")
        v.box(b, rt, rb, rx, y, 300, 105, job="J08" if a == "needs" else "J07")
        v.edge(a+"-match", a, b, label, [(x+300,y+45),(rx,y+45)], ((x+300+rx)/2,y+33), dashed=True)
    for left, right in zip(levels, levels[1:]):
        a, x, y = left[0], left[3], left[4]
        b, bx, by = right[0], right[3], right[4]
        v.edge(a+"-down", a, b, "", [(x+150,y+105),(bx+150,by)], (0,0))
    v.box("code", "Implementation work and exact build", "WORK / CODE · J04\nTask, commit, PR, build, artifacts", 750, 825, 340, 95, "external", "J04")
    v.edge("to-code", "design", "code", "implements", [(700,805),(920,825)], (770,811))
    v.edge("build-to-test", "code", "unit-test", "execution reference", [(1090,860),(1270,860),(1270,745),(1250,745)], (1190,885))
    v.box("intake", "Capture information where work happens", "SRC / CLAR · J01\nSlack, meetings, documents, design notes, developer observations", 150, 105, 650, 80, "external", "J01")
    v.box("scope", "Agree scope and evidence ownership", "SCOPE · J16 · owners, criteria, methods\nInternal, bought, and existing tool homes remain provisional", 920, 105, 730, 80, "decision", "J16")
    v.edge("source-to-needs", "intake", "needs", "source support", [(300,185),(300,220)], (398,207))
    v.box("cross-cutting", "Inputs and evidence that span the V", "Risk J05 · HAZ / CTRL / RISK → requirements, tests, labels, release\nUsability J06 · USE → needs, UI requirements, validation\nDataset / model J14, if applicable · ML → build, tests, performance evidence", 150, 960, 850, 125)
    v.box("controlled-state", "Reviewed states and usable outputs", "Baseline J10 · BASE\nDocuments / matrices / packages J12 · DOC\nRelease / transfer J11 · REL", 1050, 960, 600, 125, "decision", "J10")
    v.note("Continuous work around every level", "J09 change impact · J13 drift capture · J15 method improvement. Inner checks assist the worker; outer checks independently inspect the result and wider evidence. See views 2 and 3 for the process and feedback paths.", 150, 1120, 1500)

    p = Diagram("source-flow", "2. Source information becomes reviewed, connected evidence",
                "Capturing a reference does not transfer authority · a finding, a decision, and a baseline are separate records", width=1500, height=1190)
    p.box("capture", "Capture an exact source revision", "SRC · J01 / J13\nOrigin, revision, locator, captured content", 450, 135, 430, 100, "external", "J01")
    p.box("draft", "Interpret, clarify, and draft candidates", "NEED / SYS / SUB / LINK · J02 / J03\nCitations, proposed links, unresolved questions", 450, 315, 430, 110, job="J03")
    p.box("outer", "Independently interrogate the result", "REVIEW · outer loop\nCheck source meaning, coverage, links, and wider consistency", 450, 510, 430, 110, "decision", "J09")
    p.box("human", "Review the named candidate and links", "REVIEW · responsible person\nAccept, reject, revise, or defer with a reason", 450, 700, 430, 110, "decision", "J10")
    p.box("baseline", "Save accepted records; review the state", "Stable IDs and versions → BASE · J10\nIndividual acceptance and baseline decision stay distinct", 450, 900, 430, 110, "decision", "J10")
    for s,t,label,y1,y2 in [("capture","draft","interpret with source support",235,315),("draft","outer","candidate plus check results",425,510),("outer","human","findings for disposition",620,700),("human","baseline","accepted versions and confirmed links",810,900)]:
        p.edge(s+"-"+t,s,t,label,[(665,y1),(665,y2)],(665,(y1+y2)/2-7))
    p.box("original", "Original information homes", "Slack / meeting system / documents\nAuthoritative for supplied source content", 35, 135, 335, 100, "external", "J01")
    p.edge("origin", "original", "capture", "capture", [(370,185),(450,185)], (410,172))
    p.box("clarify", "Clarify with the responsible person", "CLAR · J02\nRetain the question, answer, and basis", 35, 315, 335, 110, "decision", "J02")
    p.edge("clarification", "clarify", "draft", "answer", [(370,370),(450,370)], (410,357))
    p.box("inner", "Inner loop: check and revise", "Worker / drafting agent\nMeasurability, format, rules, citations\nBounded retries; unresolved issues remain visible", 35, 510, 335, 120, job="J03")
    p.edge("draft-check", "draft", "inner", "check", [(450,400),(410,400),(410,555),(370,555)], (410,480))
    p.edge("revise-draft", "inner", "draft", "revise", [(200,510),(200,465),(500,465),(500,425)], (310,452))
    p.box("rework", "Return to the author or clarification", "Record rejected / deferred proposals\nA revised candidate gets fresh applicable checks", 35, 710, 335, 130, "decision", "J09")
    p.edge("return", "human", "rework", "return", [(450,765),(370,765)], (410,753))
    p.edge("rework-draft", "rework", "draft", "new candidate revision", [(200,710),(200,670),(395,670),(395,285),(600,285),(600,315)], (395,655), True)
    p.box("context", "Independent access to underlying evidence", "Sources, existing needs and requirements\nRisk / usability / model evidence\nDesign, code/build, tests, and configuration\nSelected for the change; omissions are findings", 1000, 315, 445, 150, "external", "J09")
    p.edge("context-check", "context", "outer", "independently selected context", [(1000,390),(940,390),(940,565),(880,565)], (1180,500), True)
    p.box("homes", "Provisional homes for controlled records", "Internal BlueBridge, bought tool, or a hybrid\nDemo candidate: D1 / SQLite structured records\nR2 file bytes and attachments\nOne authoritative home per controlled record", 1000, 700, 445, 145)
    p.box("outputs", "Answer questions and produce outputs", "DOC · J12 from exact baseline / template\nREL · J11 with build, test, validation, and risk evidence\nA document is an identifiable view of records", 1000, 900, 445, 125, "decision", "J12")
    p.edge("baseline-outputs", "baseline", "outputs", "selected state", [(880,955),(1000,955)], (940,942))
    p.note("Authored evidence can enter at candidate creation", "Developers can write design notes, requirements, code, and review rationale directly. LLM extraction is optional. Existing controlled evidence supplies context without passing through transcript ingestion. Both paths need clear ownership, version references, and the applicable reviews.", 35, 1065, 1410)

    c = Diagram("change-loops", "3. Change review and the learning loop",
                "Outer-loop independence and breadth are separate from cadence · learning changes methods through reviewed versions", height=1060)
    top = [
        ("observe", "Observe a significant change", "SRC / CODE / RUN / DEFECT\nJ13 → J09\nExact old / new references", "external", "J13"),
        ("scope-change", "Record scope and impact work", "CHANGE · J09\nPrior BASE and relevant links\nOwners and unresolved questions", "record", "J09"),
        ("worker", "Worker drafts, checks, revises", "Inner loop\nLocal rules and relevant evidence\nVersioned candidate and check results", "record", "J03"),
        ("independent", "Independent broader check", "Outer loop · per significant change\nRequirements, hazards, controls\nTests, traces, labels, configuration", "decision", "J09"),
        ("dispose", "People disposition findings", "REVIEW · J09\nUpdate / relink / retest / defer\nReasons and accountable owners", "decision", "J09"),
        ("new-state", "Review the resulting state", "J07 / J08 retest or evaluate as needed\nJ10 new BASE; J12 new DOC\nJ11 separate REL decision if relevant", "decision", "J10"),
    ]
    for i,(id,title,body,kind,jid) in enumerate(top):
        c.box(id,title,body,35+295*i,155,255,170,kind,jid)
    for i,(left,right) in enumerate(zip(top,top[1:])):
        x=35+295*i+255
        c.edge("top-"+str(i),left[0],right[0],"",[(x,230),(x+40,230)],(0,0))
    c.box("scope-evidence", "Check the underlying evidence, including missing links", "J02 / J03 needs and requirements · J04 design/build\nJ05 risk and controls · J06 tasks/UI · J07 tests/results\nJ08 validation · J14 model/data where applicable",35,395,765,125,"external","J09")
    c.edge("context", "scope-evidence", "independent", "independently retrieve and inspect", [(800,455),(1047,455),(1047,325)], (1050,382), True)
    c.box("corrections", "Capture corrections and failures", "FB · start with the first workflow\nReviewer edits, rejections, QA/risk comments\nMissing traces, failures, rework, redirection",35,615,455,155,job="J15")
    c.box("patterns", "Investigate recurring causes", "Meta-loop · J15\nDaily / weekly / monthly as appropriate\nSeparate product defects from method failures",620,615,335,155,job="J15")
    c.box("evaluate", "Propose and evaluate a method change", "METHOD · J15\nPrompt, rule, context, tool, or workflow\nEvaluate failures and previously correct cases",1065,615,360,155,job="J15")
    c.box("adopt", "Review and adopt a method version", "METHOD / REVIEW · J15\nRecord before / after, evidence, owner\nObserve subsequent corrections and regressions",1490,615,275,175,"decision","J15")
    c.edge("feedback", "dispose", "corrections", "findings, human edits, reasons, outcomes", [(1342,325),(1342,555),(262,555),(262,615)], (785,543))
    c.edge("failures", "new-state", "corrections", "test failures and package rework", [(1637,325),(1637,585),(405,585),(405,615)], (1410,574), True)
    c.edge("pattern", "corrections", "patterns", "review signals", [(490,692),(620,692)], (555,680))
    c.edge("improve", "patterns", "evaluate", "propose change", [(955,692),(1065,692)], (1010,680))
    c.edge("adoption", "evaluate", "adopt", "review", [(1425,692),(1490,692)], (1457,680))
    c.edge("method-return", "adopt", "method-use", "adopted method versions return to future work and checks", [(1627,790),(1627,835),(765,835),(765,900)], (1175,824), True)
    c.box("method-use", "Use adopted methods in future work and checking", "J01–J14 · versioned drafting instructions, rules, context selection, and independent review methods\nRetain prior methods and evaluation evidence. Product evidence changes still use their own change process.", 450, 900, 1220, 90, job="J15")
    c.note("Additional meta-loop signals", "Audit observations and regulatory/FDA feedback can inform J15. Internal BBT/client corrections supply feedback from week one. Different models/prompts/context can support independence; a different model alone does not establish it.", 35, 1010, 1730)
    return [v,p,c]


COLORS = {
    "record": ("#eff5f9", "#41637c"),
    "external": ("#f4f4f2", "#71776f"),
    "decision": ("#faf3e6", "#977642"),
}


def wrapped(text, width, char=8.0):
    return [line for para in text.split("\n") for line in textwrap.wrap(para, max(12,int(width/char))) or [""]]


def svg(d):
    parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{d.width}" height="{d.height}" viewBox="0 0 {d.width} {d.height}" role="img" aria-labelledby="{d.id}-title {d.id}-desc">',
           f'<title id="{d.id}-title">{html.escape(d.title)}</title>',f'<desc id="{d.id}-desc">{html.escape(d.subtitle)}</desc>',
           '<defs><marker id="arrow-'+d.id+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#667683"/></marker></defs>',
           f'<rect width="{d.width}" height="{d.height}" fill="white"/>',
           f'<text x="35" y="40" font-family="Arial,sans-serif" font-size="25" font-weight="bold" fill="#223746">{html.escape(d.title)}</text>',
           f'<text x="35" y="70" font-family="Arial,sans-serif" font-size="16" fill="#52616b">{html.escape(d.subtitle)}</text>']
    for e in d.edges:
        points=" ".join(f'{x},{y}' for x,y in e["points"])
        dash=' stroke-dasharray="7 5"' if e["dashed"] else ''
        parts.append(f'<polyline points="{points}" fill="none" stroke="#667683" stroke-width="1.8"{dash} marker-end="url(#arrow-{d.id})"/>')
    for b in d.boxes:
        fill,stroke=COLORS[b["kind"]]
        if b["job"]: parts.append(f'<a href="#{b["job"].lower()}" aria-label="Read {b["job"]}: {html.escape(b["title"],quote=True)}">')
        parts.append(f'<rect x="{b["x"]}" y="{b["y"]}" width="{b["w"]}" height="{b["h"]}" rx="5" fill="{fill}" stroke="{stroke}"/>')
        yy=b["y"]+25
        titlelines=wrapped(b["title"],b["w"]-24,9)
        bodylines=wrapped(b["body"],b["w"]-24,7.5)
        assert 12+len(titlelines)*21+6+len(bodylines)*20 <= b["h"], (d.id,b["id"],titlelines,bodylines)
        for line in titlelines:
            parts.append(f'<text x="{b["x"]+12}" y="{yy}" font-family="Arial,sans-serif" font-size="17" font-weight="bold" fill="#223746">{html.escape(line)}</text>'); yy+=21
        yy+=6
        for line in bodylines:
            parts.append(f'<text x="{b["x"]+12}" y="{yy}" font-family="Arial,sans-serif" font-size="15" fill="#384d5b">{html.escape(line)}</text>'); yy+=20
        if b["job"]: parts.append('</a>')
    for e in d.edges:
        if not e["label"]: continue
        x,y=e["label_at"];width=len(e["label"])*7.1+12
        parts.append(f'<rect x="{x-width/2}" y="{y-14}" width="{width}" height="20" fill="white"/>')
        parts.append(f'<text x="{x}" y="{y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#465966">{html.escape(e["label"])}</text>')
    for n in d.notes:
        parts.append(f'<text x="{n["x"]}" y="{n["y"]}" font-family="Arial,sans-serif" font-size="17" font-weight="bold" fill="#223746">{html.escape(n["title"])}</text>')
        for i,line in enumerate(wrapped(n["body"],n["w"],7.5)):
            parts.append(f'<text x="{n["x"]}" y="{n["y"]+26+i*20}" font-family="Arial,sans-serif" font-size="15" fill="#52616b">{html.escape(line)}</text>')
    parts.append('</svg>')
    return "\n".join(parts)


def drawio(ds):
    mx=ET.Element("mxfile",host="app.diagrams.net",pages=str(len(ds)))
    for d in ds:
        page=ET.SubElement(mx,"diagram",id=d.id,name=d.title)
        model=ET.SubElement(page,"mxGraphModel",dx=str(d.width),dy=str(d.height),grid="1",gridSize="10",page="1",pageScale="1",pageWidth=str(d.width),pageHeight=str(d.height),math="0",shadow="0")
        root=ET.SubElement(model,"root");ET.SubElement(root,"mxCell",id="0");ET.SubElement(root,"mxCell",id="1",parent="0")
        def cell(id,value,x,y,w,h,style):
            c=ET.SubElement(root,"mxCell",id=id,value=value,style=style,vertex="1",parent="1")
            ET.SubElement(c,"mxGeometry",x=str(x),y=str(y),width=str(w),height=str(h),attrib={"as":"geometry"})
        cell("title",d.title,35,15,d.width-70,40,"text;html=0;fontSize=25;fontStyle=1;align=left;fontFamily=Arial;")
        cell("subtitle",d.subtitle,35,55,d.width-70,35,"text;html=0;fontSize=16;align=left;fontColor=#52616b;fontFamily=Arial;")
        for b in d.boxes:
            fill,stroke=COLORS[b["kind"]]
            title="<br>".join(html.escape(x) for x in wrapped(b["title"],b["w"]-24,9))
            body="<br>".join(html.escape(x) for x in wrapped(b["body"],b["w"]-24,7.5))
            value=f'<div style="font-size:16px;font-weight:bold;line-height:19px">{title}</div><div style="margin-top:4px;font-size:14px;line-height:18px">{body}</div>'
            cell(b["id"],value,b["x"],b["y"],b["w"],b["h"],f"rounded=1;whiteSpace=wrap;html=1;fontSize=14;align=left;spacing=12;fillColor={fill};strokeColor={stroke};fontColor=#223746;fontFamily=Arial;")
        boxes={b["id"]:b for b in d.boxes}
        for e in d.edges:
            def endpoint(id,p):
                b=boxes[id]
                return ((p[0]-b["x"])/b["w"],(p[1]-b["y"])/b["h"])
            start=endpoint(e["source"],e["points"][0]);end=endpoint(e["target"],e["points"][-1])
            assert all(-0.001<=k<=1.001 for k in (*start,*end)), (d.id,e["id"],start,end)
            style=f"edgeStyle=none;html=0;endArrow=block;endFill=1;strokeColor=#667683;strokeWidth=1.8;dashed={int(e['dashed'])};exitX={start[0]};exitY={start[1]};entryX={end[0]};entryY={end[1]};exitPerimeter=0;entryPerimeter=0;"
            c=ET.SubElement(root,"mxCell",id="edge-"+e["id"],style=style,edge="1",parent="1",source=e["source"],target=e["target"])
            g=ET.SubElement(c,"mxGeometry",relative="1",attrib={"as":"geometry"})
            if len(e["points"])>2:
                arr=ET.SubElement(g,"Array",attrib={"as":"points"})
                for x,y in e["points"][1:-1]:ET.SubElement(arr,"mxPoint",x=str(x),y=str(y))
            if e["label"]:
                x,y=e["label_at"];w=len(e["label"])*7.1+12
                cell("label-"+e["id"],e["label"],x-w/2,y-17,w,24,"text;html=0;fontSize=14;align=center;fillColor=#ffffff;fontColor=#465966;fontFamily=Arial;")
        for i,n in enumerate(d.notes):
            cell("note-"+str(i),n["title"]+"\n"+n["body"],n["x"],n["y"]-18,n["w"],85,"text;whiteSpace=wrap;html=0;align=left;fontSize=15;fontColor=#52616b;fontFamily=Arial;")
    ET.indent(mx)
    return ET.tostring(mx,encoding="unicode",xml_declaration=True)


CONTEXT = [
    "Confirmed by the user: the previous arrangement used Jira, GitHub, and substantial manual document-based processes. The organisation is in transition; future authoritative homes for requirements, risk, and test evidence have not been decided.",
    "The purpose of the new toolset and process redesign is to keep pace with AI-powered software development. Frequent capture and independent checking should fit normal work rather than depend on retrospective document assembly.",
    "The internal compliance demo is one candidate. It uses Cloudflare D1 with the SQLite dialect for structured records and R2 for file bytes. This describes the demo, not an agreed future tool allocation.",
    "The user has reviewed the job families and regards them as a reasonable working basis. Roles, exact triggers, granularity, review authority, applicable evidence scope, pain points, and measures remain proposed for validation. No supplier coverage, delivery date, or current connector capability is assumed.",
]

SCENARIOS = [
    ("A meeting introduces a new user need", [
        "J01 captures the exact source revision, including uncertainty or disagreement. J02 resolves necessary questions and proposes a need with citations.",
        "J05 and J06 supply relevant risk and task context before J03 settles derived requirements. The agent's inner loop checks a requirement's criteria, wording, and proposed links.",
        "An outer check uses the underlying source, existing needs, risk/task evidence, and related requirements. It may find that the proposed criterion lacks a source basis or that a relevant control is missing.",
        "The responsible people disposition those findings and review the candidate versions and links. J04 and J07 receive design/test obligations; J08 receives the validation obligation. J10 can freeze a reviewed state when the selected scope is ready.",
        "The source stays attributable to its origin. Accepted need/requirement versions live in the provisional controlled-record home. Human edits, omissions, and rejections go to J15 as feedback.",
    ]),
    ("A developer proposes a significant alert-threshold change", [
        "Illustrative case: a PR changes a threshold from 30 seconds to 60 seconds. J13 records the exact old/new commit references. J09 compares the proposed change with the relevant baseline and records impact work. Where feasible, run this before merge; otherwise keep the observed mismatch explicit.",
        "The coding agent's inner loop may pass local code checks and tests. That result leaves the product meaning and wider evidence to be examined independently.",
        "The outer check inspects the requirement threshold, hazard/control assumptions, unit/integration/system test criteria, applicable usability/validation evidence, labels, and configuration. It also looks for consequences missing from the existing trace graph.",
        "Affected people decide whether the code should change back or the controlled evidence should change. J03/J04/J05/J07/J08/J12 receive only the required follow-up. New tests retain their own plan and build references.",
        "J10 reviews the new evidence state; J11 makes a separate release decision when relevant. The old baseline/release and their associated tests remain identifiable.",
        "If a label or control was repeatedly missed, J15 investigates the cause, changes context selection or checking rules, evaluates the change, and adopts a method version for future work.",
    ]),
]


def markdown():
    names={id:title for id,title,*_ in RECORDS}
    def refs(ids):return "; ".join(f"`{id}` {names[id]}" for id in ids)
    lines=["# BlueBridge jobs and information-flow map", "", f"Status: first working map, {DATE}. Confirmed context and proposed operating model are distinguished below.", "",
           "Open the [visual map](bluebridge-jobs-map.html), or edit the [three-view draw.io map](bluebridge-jobs-map.drawio). The visual map also includes expandable job details. This catalogue is the supporting reference.", "", "## Context and scope", ""]
    lines.extend("- "+x for x in CONTEXT)
    lines += ["", "This map develops the [framing brief](bluebridge-problem-framing.md). It describes jobs and their information contracts before feature selection, work-package estimation, or supplier comparison. J01–J15 preserve the starter IDs. J16 adds explicit planning, scope, and record-ownership work.", "",
              "The supplied draw.io pages 4 and 5 anchor the needs/design/test relationships. Pages 1 and 2 inform the expanded risk, usability, dataset/model, document, and release inventory. Clause annotations are not assessed here.", "",
              "## How to read the map", "",
              "The V-model view locates evidence and matching verification or validation work. The source-flow view distinguishes captured sources, candidates, independent findings, human decisions, controlled versions, and outputs. The change-loop view shows drift, impact work, correction, and method improvement.", "",
              "Arrows mean that information in the source record is used by the target record or activity. They may indicate derivation, reference, test planning, execution, review, or feedback. They do not imply copying a whole document, transferring authority, or automatic acceptance. Dashed arrows in the diagrams show context or matching trace relationships; they do not label implementation status or known gaps.", "",
              "A record code names an information type, not one file or database table. Structured items can appear in several document views. Stable item IDs, exact versions, typed links, and separately recorded decisions make those views reconcilable.", "",
              "## Information homes and authority", "",
              "Separate the original source, an observed/captured revision, a reviewed interpretation, and a rendered output. A connector can capture a reference while the source system remains authoritative for its own content. The internal tool and a bought tool can share a workflow while each controlled record has one agreed authoritative home.", "",
              "The map does not designate Jira as the future home of requirements or GitHub as the future repository. Source systems, repository/CI, work tracking, and controlled evidence management are categories whose selected products remain provisional. D1 and R2 are the current demo implementation.", ""]
    for id,title,home,unit in RECORDS:
        lines += [f"### {id}: {title}", "", f"Home and authority: {home}", "", f"Information unit: {unit}", ""]
    lines += ["## Jobs and information contracts", "", "Each job states proposed actors, trigger, inputs, outputs, decision, handoff, change behaviour, loops, and value measures. Friction statements are hypotheses to check with the team. Human role names describe responsibilities; they do not imply that every decision belongs to QA.", ""]
    for j in JOBS:
        lines += [f"### {j['id']}: {j['title']}", "", f"Actor: {j['actor']}.", "", f"Trigger: {j['trigger']}", "", f"Inputs: {refs(j['inputs'])}.", "", "Tasks:", ""]
        lines.extend(f"{i}. {step}" for i,step in enumerate(j['steps'],1))
        lines += ["", f"Outputs: {refs(j['outputs'])}.", "", f"Decision: {j['decision']}", "", f"Handoff: {j['handoff']}", "", f"When something changes: {j['change']}", "", f"Inner loop: {j['inner']}", "", f"Outer loop: {j['outer']}", "", f"Feedback to the meta-loop: {j['feedback']}", "", f"Friction hypothesis: {j['friction']}", "", f"Measure: {j['measure']}", ""]
    lines += ["## Connection register", "", "These conceptual relationships expand the main diagrams. Record presence does not establish sufficiency or acceptance. Baselines select exact controlled evidence and link versions; release records select applicable support and separate decisions. The register is a planning vocabulary, not an extension of the demo's implemented relationship policy.", ""]
    lines.extend(f"- **{f['id']}** `{f['source']}` → `{f['target']}`: {f['meaning']}. Owned work: {', '.join(f['jobs'])}." for f in FLOWS)
    lines += ["", "## Scenarios that test the map", ""]
    for title,steps in SCENARIOS:
        lines += ["### "+title, ""]
        lines.extend(f"{i}. {step}" for i,step in enumerate(steps,1)); lines.append("")
    lines += ["## Relationship to the feature map", "",
              "The [first feature map](bluebridge-feature-map.md) now maps supporting capabilities, minimum workflows, prerequisites, package outcomes, and interim coverage onto these jobs. Open its [visual reference](bluebridge-feature-map.html) to inspect features by job. The user regards these job families as a reasonable working basis; specific responsibilities and future homes remain provisional.", "",
              "Preserve each job's input, output, source reference, decision, and change path when defining a feature. Begin with the minimum complete workflow; manual capture, linking, and independent checking can supply early coverage.", "",
              "Treat record identity, revision references, link meanings, and ownership decisions as shared prerequisites. Live Slack intake is not a prerequisite for a traceability job over existing evidence. Internal evidence storage is not a prerequisite for useful drafting assistance if accepted outputs reach a bought-tool evidence home.", "",
              "Capture feedback in the first useful workflow. Broader automated outer checks depend on available evidence and usable references. Different models, prompts, and independent context selection may help establish independence; model difference alone does not establish it. Formal approval is a separate workflow decision.", "",
              "## Decisions still to validate", "",
              "1. Which evidence homes and coexistence arrangements will be selected, and who owns migration or handover?",
              "2. Who authors, independently checks, reviews, and approves each evidence type for a BBT/client engagement?",
              "3. What makes a change significant, and where should the outer check run in normal developer work?",
              "4. What granularity and link meanings give useful coverage without excessive maintenance?",
              "5. Which risk, usability, hardware, clinical, and dataset/model evidence applies to the first product scope?",
              "6. Which current jobs consume the most effort or cause repeated rework? Observe a real example before assigning benefit estimates.",
              "7. Who owns method improvements, and what evaluation is sufficient to adopt a changed prompt, rule, context strategy, or tool?", "",
              "## Sources and regeneration", "",
              "Sources: the user's framing and loop-engineering discussion; the supplied `Design_Controls_Must_Have_Traceability_v3.drawio`; the user's confirmation of previous Jira/GitHub/document processes and undecided future homes; local [product architecture](product-architecture.md), [authority model](authority-model.md), and [data model](data-model.md). Current demo statuses and supplier capabilities have not been revalidated.", "",
              "The editable planning source and generator are [build_jobs_map.py](planning/build_jobs_map.py). Run `python3 docs/planning/build_jobs_map.py` to regenerate the catalogue, visual map, draw.io file, SVG views, and JSON data. The generator checks job and record references, unique IDs, diagram endpoints, text capacity, and output structure. It does not validate the proposed operating model with stakeholders.", ""]
    return "\n".join(lines)


def html_map(ds,svgs):
    escape=html.escape
    sections=[]
    for i,(d,s) in enumerate(zip(ds,svgs)):
        sections.append(f'<details class="view" {"open" if i==0 else ""}><summary>{escape(d.title)}</summary><div class="map">{s}</div></details>')
    names={id:title for id,title,*_ in RECORDS}
    sections.append('<section><h2>Job catalogue</h2><p>Open a job to inspect its input, output, handoff, decisions, and quality loops. Diagram nodes link to the related job.</p>')
    for j in JOBS:
        parts=[f'<details id="{j["id"].lower()}" class="job"><summary><span class="jid">{j["id"]}</span> {escape(j["title"])}</summary><div class="job-body">']
        fields=[("Actor",j["actor"]),("Trigger",j["trigger"]),("Inputs","; ".join(f'{id}: {names[id]}' for id in j["inputs"])),("Outputs","; ".join(f'{id}: {names[id]}' for id in j["outputs"]))]
        parts.append('<dl>'+''.join(f'<dt>{k}</dt><dd>{escape(v)}</dd>' for k,v in fields)+'</dl>')
        parts.append('<h3>Tasks</h3><ol>'+''.join(f'<li>{escape(x)}</li>' for x in j["steps"])+'</ol>')
        for key,label in [("decision","Decision"),("handoff","Handoff"),("change","When something changes"),("inner","Inner loop"),("outer","Outer loop"),("feedback","Feedback to the meta-loop"),("friction","Friction hypothesis"),("measure","Measure")]:
            parts.append(f'<h3>{label}</h3><p>{escape(j[key])}</p>')
        parts.append('</div></details>');sections.append(''.join(parts))
    sections.append('</section>')
    return '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>BlueBridge jobs and information-flow map</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#fff;color:#243746;font:16px/1.55 system-ui,Arial,sans-serif}main{max-width:1540px;margin:auto;padding:28px 30px 60px}h1{font-size:28px;margin:0 0 8px}h2{font-size:23px;margin:30px 0 8px}h3{font-size:16px;margin:18px 0 4px}p{margin:0 0 12px;max-width:1150px}.status{color:#63717a;font-size:14px}.context{border-left:3px solid #41637c;padding:12px 18px;background:#f6f8fa;margin:22px 0}.view{border-top:1px solid #d8dfe4;margin-top:18px}.view>summary{font-weight:650;padding:14px 0;cursor:pointer}.map{overflow:auto}.map svg{display:block;width:100%;min-width:1000px;height:auto}.map a:hover rect,.map a:focus rect{stroke-width:3}.job{border-bottom:1px solid #d8dfe4;scroll-margin-top:20px}.job>summary{padding:14px 4px;cursor:pointer}.jid{display:inline-block;min-width:48px;color:#41637c;font-weight:650}.job-body{padding:0 28px 20px;max-width:1150px}.job:target{background:#f6f8fa}.job:target>.job-body{display:block}.job:target{content-visibility:visible}dl{display:grid;grid-template-columns:120px 1fr;gap:10px 16px}dt{font-weight:650}dd{margin:0}li{padding-bottom:6px}a{color:#315d7e}footer{border-top:1px solid #d8dfe4;margin-top:30px;padding-top:16px;color:#63717a;font-size:14px}@media(max-width:650px){main{padding:20px 16px}h1{font-size:24px}dl{grid-template-columns:1fr;gap:4px}.job-body{padding-left:12px}.context{padding:10px 12px}}@media print{.map svg{min-width:0}.view,.job{break-inside:avoid}.view .map,.job .job-body{display:block}summary{list-style:none}}
</style></head><body><main>
<h1>BlueBridge jobs and information-flow map</h1><p class="status">First working map · 9 October 2026 · proposed operating model, not implementation status</p>
<div class="context"><p><strong>Confirmed context.</strong> The previous arrangement used Jira, GitHub, and manual document processes. Future evidence homes are undecided. The new toolset and processes should keep pace with AI-powered development.</p><p><strong>Candidate internal home.</strong> The compliance demo uses Cloudflare D1 / SQLite for structured records and R2 for file bytes. This is a candidate, not a selected future allocation.</p><p><strong>Reading the map.</strong> Arrows describe information use. Captured sources, proposed evidence, independent findings, human decisions, baselines, and release decisions stay distinct. Dashed arrows show context or matching trace relationships.</p></div>
''' + "\n".join(sections) + '''
<footer>Source basis: user discussion and supplied design-control draw.io; local product architecture, authority model, and data model. Roles, pain points, evidence scope, and future homes remain provisional. The detailed <a href="bluebridge-jobs-map.md">catalogue and connection register</a>, <a href="bluebridge-jobs-map.drawio">editable draw.io</a>, and <a href="bluebridge-feature-map.html">supporting feature map</a> accompany this map.</footer>
</main><script>
function openJob(){const id=location.hash.slice(1);const element=document.getElementById(id);if(element&&element.classList.contains('job')){element.open=true;requestAnimationFrame(()=>element.scrollIntoView({block:'start'}));}}
window.addEventListener('hashchange',openJob);openJob();
</script></body></html>
'''


def validate(ds):
    rids=[r[0] for r in RECORDS];jids=[j["id"] for j in JOBS]
    assert len(set(rids))==len(rids) and jids==[f"J{i:02d}" for i in range(1,17)]
    assert set(rids)=={r for j in JOBS for r in j["inputs"]+j["outputs"]}
    assert set(rids)=={r for j in JOBS for r in j["outputs"]}, "Every record type needs an explicit producing job."
    for f in FLOWS:
        assert f["source"] in rids and f["target"] in rids
        assert all(j in jids for j in f["jobs"])
    assert len({f["id"] for f in FLOWS})==len(FLOWS)
    for d in ds:
        ids=[b["id"] for b in d.boxes];assert len(set(ids))==len(ids)
        for b in d.boxes:
            assert b["job"] is None or b["job"] in jids
            assert 0<=b["x"] and b["x"]+b["w"]<=d.width and 0<=b["y"] and b["y"]+b["h"]<=d.height
        for i,a in enumerate(d.boxes):
            for b in d.boxes[i+1:]:
                assert not (a["x"]<b["x"]+b["w"] and a["x"]+a["w"]>b["x"] and a["y"]<b["y"]+b["h"] and a["y"]+a["h"]>b["y"]), (d.id,a["id"],b["id"])
        for e in d.edges:assert e["source"] in ids and e["target"] in ids


def main():
    ds=diagrams();validate(ds)
    svgs=[svg(d) for d in ds]
    xml=drawio(ds);ET.fromstring(xml)
    for s in svgs:ET.fromstring(s)
    OUT.mkdir(exist_ok=True)
    (DOCS/"bluebridge-jobs-map.md").write_text(markdown())
    (DOCS/"bluebridge-jobs-map.html").write_text(html_map(ds,svgs))
    (DOCS/"bluebridge-jobs-map.drawio").write_text(xml)
    for d,s in zip(ds,svgs):(OUT/f"bluebridge-{d.id}.svg").write_text(s)
    data=dict(date=DATE,status="proposed operating model; record homes provisional",context=CONTEXT,
              records=[dict(id=id,title=t,home=h,unit=u) for id,t,h,u in RECORDS],jobs=JOBS,flows=FLOWS)
    (OUT/"bluebridge-jobs-map-data.json").write_text(json.dumps(data,indent=2)+"\n")
    print(f"Generated {len(JOBS)} jobs, {len(RECORDS)} record types, {len(FLOWS)} conceptual connections, and {len(ds)} diagram views.")
    print("Validated references, unique IDs, node bounds, non-overlapping boxes, text capacity, edge endpoints, and XML/SVG structure.")


if __name__=="__main__":main()
