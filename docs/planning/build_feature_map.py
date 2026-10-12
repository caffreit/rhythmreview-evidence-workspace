"""Generate the BlueBridge feature map and phased workflow plan.

Run python3 docs/planning/build_feature_map.py. This is planning content, not
application implementation. The job map is read from its existing generator.
"""

from pathlib import Path
import html
import json
import runpy
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
DOCS = HERE.parent
SOURCE = runpy.run_path(str(HERE / "build_jobs_map.py"))
JOBS = SOURCE["JOBS"]
RECORDS = SOURCE["RECORDS"]
DATE = SOURCE["DATE"]


def capability(n, title, jobs, package, inputs, outputs, minimum, later, hard,
               external, example, reuse, doc, conditional=None):
    return dict(id=f"CAP-{n:02d}", title=title, jobs=jobs.split(), package=package,
                inputs=inputs.split(), outputs=outputs.split(), minimum=minimum,
                later=later, hard=hard.split(), external=external, example=example,
                reuse=reuse, doc=doc, conditional=conditional or [])


CAPS = [
    capability(1,"Record scope, evidence homes, and decision responsibilities","J16","P0","SRC SCOPE METHOD","SCOPE REVIEW",
        "A recorded agreement names product scope, record types, authoritative homes, link meanings, responsible people, and applicable checks.",
        "Configurable scope/role profiles and rules selected for each engagement.","",
        "Responsible BBT/client owners must agree the first scope and permitted decision roles.",
        "A requirement has one agreed home and named author/reviewer; the team can identify who resolves an ownership conflict.",
        "Product rules and an authority explanation are documented; engagement-level configuration is a broader proposal.","authority-model.md"),
    capability(2,"Identify and retain exact record versions","J01 J02 J03 J04 J05 J06 J07 J08 J09 J10 J11 J12 J13 J14 J15 J16","P0","SRC NEED SYS SUB LINK REVIEW","SRC NEED SYS SUB LINK REVIEW",
        "Use stable IDs, exact revisions, source references, and distinct candidate/accepted states in the selected record home. A small agreed record set is enough to start.",
        "Internal editing/history for more evidence types, with cross-system identity mappings and concurrency handling.","CAP-01",
        "The chosen home must support, or be supplemented with, usable version references and accessible history.",
        "A reviewer can open the source and requirement revisions used by a check even after the latest versions change.",
        "Evidence versions, source revisions, and retained baselines are described in the demo data model.","data-model.md"),
    capability(3,"Define trace meanings and allowed relationships","J03 J04 J05 J06 J07 J08 J09 J10 J12 J14 J16","P0","SCOPE LINK","METHOD LINK",
        "Define a small vocabulary with endpoint types, direction, meaning, and review expectations for the first workflow.",
        "Versioned policies covering additional evidence types and conditional coverage rules.","CAP-01 CAP-02",
        "Domain owners must agree what a link establishes and which links are expected for the selected scope.",
        "A need-to-requirement link means derivation, while a requirement-to-test link names verification scope; neither transfers approval.",
        "A controlled prototype relationship policy is documented; the wider map vocabulary still needs agreement.","relationship-policy.md"),
    capability(4,"Record human decisions and return work for revision","J02 J03 J04 J05 J06 J07 J08 J09 J10 J11 J12 J14 J15 J16","P0","REVIEW NEED SYS SUB LINK CHANGE","REVIEW FB",
        "Retain the named person, role, object/version, reason, and accept/revise/reject/defer outcome. An existing review process can supply the decision.",
        "Integrated review queues, reminders, permission enforcement, and authenticated decision capture for the selected deployment.","CAP-01 CAP-02",
        "A designated reviewer and an agreed decision record are required; a checker finding remains separate from approval.",
        "Editing a submitted requirement prevents an earlier acceptance from applying to the new wording.",
        "Revision-bound prototype decisions and return-to-author history are documented; simulated personas do not establish production identity.","authority-model.md"),
    capability(5,"Version processing instructions and retain run provenance","J01 J02 J03 J09 J15","P0","SRC METHOD","METHOD REVIEW",
        "Select an agreed prompt, output schema, source/context revisions, and model configuration; retain result, validation failures, and run identity.",
        "A managed policy registry, richer run comparison, and evaluated configuration changes.","CAP-01 CAP-02",
        "A method owner agrees the initial instructions, output contract, and evaluation examples.",
        "Two drafts can be compared using their exact inputs and prompt versions; a failed output does not become accepted evidence.",
        "Versioned source/context/needs/requirements/impact contracts and run records are documented.","llm-actions.md"),
    capability(6,"Capture source material manually with citations","J01 J13","P1","SRC","SRC",
        "Paste or upload supported text; retain origin, revision, captured content, and exact locators. Record duplicate capture without duplicating the interpretation work.",
        "Additional source formats and assisted selection of relevant spans.","CAP-02",
        "A usable source and the selected capture destination must be available.",
        "A pasted transcript remains identifiable, and a draft need points to the exact quoted passage.",
        "Text/Markdown source intake and source-derived provenance are documented.","product-architecture.md"),
    capability(7,"Extract source text from documents","J01 J12 J13","P1","SRC DOC","SRC",
        "Extract supported text-based PDF/DOCX content with page/paragraph locators, original file references, and visible extraction warnings.",
        "Additional formats and separately evaluated OCR where needed.","CAP-06",
        "Representative files, extraction limits, and a decision about retaining the original bytes are required.",
        "A requirement citation opens the correct paragraph in the imported document revision.",
        "WP-30 document intake and anchored extraction are recorded as local work in the delivery plan; acceptance status is not rechecked here.","delivery-plan.md"),
    capability(8,"Capture selected Slack discussions","J01 J13","P-IN","SRC","SRC",
        "Import a selected thread with message IDs, author/time, edits, and source references into the common intake path.",
        "Scoped ongoing observation, edited/deleted-message handling, and recoverable capture.","CAP-06",
        "The selected workspace, access permissions, capture scope, and retention expectations must be agreed.",
        "A thread becomes a cited source without implying that every message is an approved product decision.",
        "No live Slack connector is established by the current documentation.","product-architecture.md",
        [dict(when="Capture runs unattended",requires=["CAP-39"])]),
    capability(9,"Capture meeting transcripts and associated notes","J01 J13","P-IN","SRC","SRC",
        "Import an identified transcript/notes pair with meeting date, speaker/time locators where supplied, and revision references.",
        "A selected meeting-platform connection and recovery of later transcript corrections.","CAP-06",
        "The selected transcript source, access, and interpretation of speaker/time metadata must be agreed.",
        "A candidate decision cites a transcript passage while a later correction creates a new source revision.",
        "Manual source intake offers a reuse path; a live meeting-platform connector is not established.","product-architecture.md",
        [dict(when="Capture runs unattended",requires=["CAP-39"])]),
    capability(10,"Ask and resolve clarification questions","J01 J02 J03 J16","P1","SRC SCOPE CLAR","CLAR REVIEW",
        "Identify ambiguous or unsupported statements, assign questions, and retain answers/deferrals with their source and rationale.",
        "Assisted question generation, discipline routing, and richer conflict handling.","CAP-02 CAP-04",
        "Someone with the relevant product/domain knowledge must be available to answer material questions.",
        "An unclear alert threshold produces a question rather than an invented numeric requirement.",
        "Source-context questions with required/advisory handling are documented.","llm-actions.md"),
    capability(11,"Draft needs and requirements from agreed evidence","J02 J03","P1","SRC SCOPE CLAR NEED CTRL USE","NEED SYS SUB LINK",
        "Run an agreed prompt to produce a small structured batch of cited candidate needs/requirements and proposed links. Required clarifications and relevant risk/task inputs enter the context. Derived requirements use reviewed needs; parent acceptance does not approve the resulting requirement.",
        "Additional evidence types, tailored schemas, and improved drafting based on evaluated feedback.","CAP-05 CAP-06 CAP-10 CAP-13",
        "Agree the output type, destination, source context, and representative evaluation examples. Risk/task inputs may be supplied externally.",
        "A transcript creates a candidate need and measurable requirement with citations; the reviewer corrects unsupported detail before acceptance.",
        "Needs/requirements drafting is documented; the full risk/usability-before-requirements workflow remains broader than the existing source-first slice.","llm-actions.md"),
    capability(12,"Check and revise the worker's draft","J02 J03 J04 J12","P1","NEED SYS SUB DESIGN METHOD LINK","NEED SYS SUB DESIGN REVIEW",
        "Apply defined checks for schema, measurability, units, citations, and link rules. Record findings; a person or drafting agent revises and rechecks within a bounded loop.",
        "Targeted agent repairs, additional domain rules, and tool-assisted checking.","CAP-02 CAP-03 CAP-05",
        "Agree the check criteria and retry/escalation limits for each output type.",
        "A requirement missing a measurable criterion is revised or routed to a person; exhausting retries leaves the issue visible.",
        "Schema/provenance validation and deterministic checks are documented; a general autonomous revise/recheck loop is a proposed increment.","llm-actions.md"),
    capability(13,"Find and assemble relevant existing evidence","J02 J03 J04 J05 J06 J07 J08 J09 J10 J11 J12 J14","P1","SRC NEED SYS SUB ARCH HAZ CTRL TEST LINK BASE","SRC NEED SYS SUB ARCH HAZ CTRL TEST LINK BASE",
        "Open a curated set of referenced records and exact versions from their homes; retain the context selection and mark unavailable evidence.",
        "Search, filtering, semantic retrieval, and independently selected context bundles.","CAP-02",
        "Read access and usable references to the evidence needed by the selected job.",
        "A requirement reviewer can inspect the existing need, risk control, and related test without relying on the drafting agent's summary.",
        "Evidence browsing, graph neighborhoods, and bounded impact retrieval are documented.","product-architecture.md"),
    capability(14,"Propose and review trace-link changes","J03 J04 J05 J06 J07 J08 J09 J10 J12 J14","P1","NEED SYS SUB ARCH CTRL TEST LINK REVIEW","LINK REVIEW",
        "Create, confirm, retype, or retire a link with defined meaning, endpoint/version context, rationale, and a separate decision.",
        "Bulk proposal review and changes launched from the graph, matrix, or change work.","CAP-02 CAP-03 CAP-04",
        "The authoritative link home and reviewer must be agreed. Existing external link controls can supply this capability.",
        "Rejecting a suggested test link leaves the suggestion in history and keeps it out of the confirmed trace set.",
        "WP-10 controlled relationship lifecycle is documented as accepted at prototype scope.","delivery-plan.md"),
    capability(15,"Inspect traceability and identify defined coverage gaps","J03 J05 J06 J07 J08 J09 J10 J11 J12 J14","P2","NEED SYS SUB CTRL TEST VP LINK BASE","REVIEW DOC",
        "Show a read-only matrix/neighborhood from identifiable accepted links and report missing relationships under named scope rules.",
        "Candidate-state comparison, richer domain coverage, and explainable gap priorities.","CAP-02 CAP-03 CAP-13",
        "A usable relationship set and agreed coverage expectations. The set may be imported from a bought tool.",
        "A control lacking an applicable verification test is visible with the reason and affected version.",
        "Matrix, graph, coverage rules, and candidate projections are documented.","relationship-policy.md"),
    capability(16,"Coordinate a change and its follow-up work","J04 J05 J06 J07 J08 J09 J10 J13","P2","SRC BASE CHANGE REVIEW","CHANGE WORK REVIEW",
        "Record old/proposed states, reason, scope, impact decisions, owners, and update/relink/retest tasks; retain unresolved work.",
        "Integrated review queues, task synchronization, and workflow rules for different change classes.","CAP-02 CAP-04",
        "Agree what constitutes a significant change, the responsible disciplines, and the chosen work home.",
        "A threshold change has named requirement, risk, test, and label follow-up with separate dispositions.",
        "Controlled change, impact decisions, return-to-author, and reanalysis are documented.","product-architecture.md"),
    capability(17,"Trace the known consequences of a change","J05 J07 J09 J10","P2","CHANGE BASE LINK NEED SYS SUB CTRL TEST LABEL","REVIEW CHANGE",
        "Traverse known links under defined bounds and show why each record is in the review set.",
        "Configurable traversal and collection/configuration-aware impact context.","CAP-03 CAP-13 CAP-16",
        "Relevant links and a declared traversal policy must be available; an empty graph cannot establish absence of impact.",
        "The reviewer can follow the path from the changed requirement to a control and verification plan.",
        "Bounded graph/collection candidate selection and path origins are documented.","llm-actions.md"),
    capability(18,"Independently check a candidate or change","J02 J03 J04 J05 J06 J07 J08 J09 J10 J11 J12 J14","P1","SRC NEED SYS SUB HAZ CTRL TEST RUN LINK CHANGE METHOD","REVIEW FB",
        "Use a separate reviewer or checker with underlying sources, explicit criteria, and independently selected context. Record findings, coverage limits, and exact examined versions.",
        "Automated broader checks using separately configured model/prompt/context choices, with evaluated independence and miss/false-alarm measures.","CAP-02 CAP-04 CAP-05 CAP-13",
        "An independent checker and relevant evidence access are needed. Formal approval remains a separate decision.",
        "The outer check catches an affected control or test omitted by the worker and sends a finding to the responsible person.",
        "Impact assistance and deterministic coherence checks offer components; the documented workflow does not establish a fully independent outer-check design.","llm-actions.md",
        [dict(when="Checking a significant change with assigned follow-up",requires=["CAP-16"])]),
    capability(19,"Suggest missing relationships and unlinked impacts","J03 J05 J07 J09","P2","CHANGE SRC SYS SUB CTRL TEST LINK METHOD","LINK REVIEW",
        "Search supplied records beyond known links and propose cited possible relationships/impacts; people confirm or reject them.",
        "Improved retrieval and evaluations that measure consequential misses and unhelpful suggestions.","CAP-03 CAP-05 CAP-13 CAP-04",
        "A representative evidence corpus, review criteria, and access to records outside the current linked neighborhood.",
        "A relevant label outside the confirmed graph appears as a possible impact and stays provisional until reviewed.",
        "Semantic impact candidates are documented; similarity remains distinct from controlled traceability.","llm-actions.md"),
    capability(20,"Detect source and implementation drift","J01 J04 J09 J13","P2","SRC WORK CODE RUN BASE","SRC CHANGE REVIEW",
        "Compare captured old/new observations, distinguish duplicates from material changes, and route meaningful drift to review without rewriting accepted records.",
        "Continuous scoped observation and recoverable synchronization.","CAP-02 CAP-06 CAP-16",
        "The previous observed revision and current source access must be available.",
        "A changed transcript or commit creates review work while the prior requirement and baseline retain their original basis.",
        "Source-revision drift is documented; live work-system observations are broader planned work.","system-architecture.md",
        [dict(when="Observation runs unattended",requires=["CAP-39"])]),
    capability(21,"Connect design, work, code, and builds","J04 J07 J09 J11 J13","P3","SYS SUB ARCH DESIGN WORK CODE LINK","ARCH DESIGN WORK CODE LINK",
        "Author or reference design records and manually associate requirement/component IDs, tasks, commits, PRs, and builds with reviewed link meanings.",
        "Assisted as-built comparison and synchronized implementation references.","CAP-02 CAP-03 CAP-14",
        "Access to the selected work/repository/build systems and agreement on design granularity.",
        "A reviewer can identify the design rationale, work item, and exact implementation revision associated with a requirement.",
        "Component evidence exists in the product model; live repository/work-tracker connections remain planned in the documentation.","product-architecture.md"),
    capability(22,"Observe work-tracker records","J04 J09 J13","P-IN","WORK SRC","WORK SRC",
        "Capture a selected ticket revision, assignment/state, and controlled-record references using a defined mapping.",
        "Event-driven capture and deliberate exchange of follow-up tasks without duplicating product truth.","CAP-02 CAP-06",
        "Select the tracker, access, field mapping, and task-state authority.",
        "A ticket update becomes an observation; moving a ticket to Done does not accept a requirement.",
        "Fixture-backed work observations are planned in WP-40; no live connector is established here.","delivery-plan.md",
        [dict(when="Updates should create drift review",requires=["CAP-20"]),dict(when="Capture runs unattended",requires=["CAP-39"])]),
    capability(23,"Observe repository and PR revisions","J04 J09 J13","P-IN","CODE SRC","CODE SRC",
        "Capture exact commits, paths, PR decisions, and build references with origin and mapping metadata.",
        "Scoped event handling and assisted comparison between intended and observed implementation.","CAP-02 CAP-06",
        "Select repository/PR access and the observation scope; code presence does not establish product intent.",
        "A changed threshold is associated with its commit and relevant evidence without silently changing a requirement.",
        "Repository observation is described as planned product direction.","product-architecture.md",
        [dict(when="Changes should create drift review",requires=["CAP-20"]),dict(when="Capture runs unattended",requires=["CAP-39"])]),
    capability(24,"Capture CI executions and report evidence","J07 J11 J13","P-IN","CODE TEST RUN SRC","RUN SRC REVIEW",
        "Import a run/report bundle with exact build/test references, provenance, result checks, and file integrity; retain the execution and its review separately.",
        "A selected live CI connection with authenticated run observations and recoverable report capture.","CAP-02 CAP-06 CAP-26",
        "Agree CI report formats, required checks, test/build mappings, and read access.",
        "A green pipeline from a different commit cannot provide current evidence for the proposed build.",
        "Manual verified GitHub Actions bundle import is documented; a live CI connector is not established.","delivery-plan.md",
        [dict(when="Capture runs unattended",requires=["CAP-39"])]),
    capability(25,"Run checks in normal PR and work-item workflows","J04 J07 J09 J13","P3","WORK CODE CHANGE METHOD","REVIEW CHANGE",
        "Provide an explicit command/action from the chosen developer workflow that checks named revisions and reports findings there with evidence links.",
        "Event-triggered checks and agreed tool-native gates for defined significant changes.","CAP-16 CAP-18",
        "Select the event/command surface, criteria, write permissions for results, and ownership of any gate.",
        "A PR author sees independent requirement/risk/test findings before the significant change proceeds.",
        "Thin developer-tool controls are identified as a gap in the charter alignment notes.","sdlc-charter-alignment.md",
        [dict(when="Checks run unattended",requires=["CAP-39"]),dict(when="Checks use captured PR context",requires=["CAP-23"])]),
    capability(26,"Manage verification plans, executions, and dispositions","J07 J09 J11","P3","SYS SUB ARCH DESIGN CTRL TEST CODE LINK","TEST RUN DEFECT REVIEW LINK",
        "Maintain a test plan at a named V-model level, link its criterion to the checked item, record an exact execution/configuration, and review the outcome.",
        "More execution formats, regression selection, suite-level coverage, and stale-evidence detection.","CAP-02 CAP-03 CAP-04 CAP-14",
        "Test owners, criteria, build/environment identity, and access to original execution evidence.",
        "A failed execution creates an anomaly; a rerun is a new execution and does not erase the failure.",
        "WP-20A test-plan/execution/review controls are documented at fictional prototype scope.","delivery-plan.md"),
    capability(27,"Support risk analysis, controls, and residual-risk review","J05 J03 J07 J11 J12","P-R","SCOPE HAZ CTRL RUN VR RISK LINK","HAZ CTRL RISK LINK REVIEW",
        "Maintain or reference risk records and controls, their requirement/test links, supporting evidence, and named risk decisions.",
        "Domain-specific analysis forms, control effectiveness checks, and broader risk-change assistance.","CAP-02 CAP-03 CAP-04 CAP-14",
        "Risk owners, criteria, relevant analyses, and supporting evidence appropriate to the selected product scope.",
        "Changing a control exposes the requirement/test evidence and residual-risk decision that need review.",
        "Hazard/control evidence and WP-20B residual-risk decisions are documented; a complete risk authoring system is broader work.","delivery-plan.md"),
    capability(28,"Support tasks, UI requirements, and usability evidence","J06 J02 J03 J05 J08","P-U","USE NEED HAZ SUB VP VR","USE SUB VP VR LINK REVIEW",
        "Maintain or reference user tasks, critical tasks, UI requirements, study versions, and resulting review actions.",
        "Dedicated formative/summative workflow and assisted use-related coverage checks.","CAP-02 CAP-04 CAP-14",
        "Usability owner, task identities, study evidence, and applicability to the selected scope.",
        "A critical task can be followed through the UI requirement to its evaluation outcome.",
        "General clinical/usability evidence is in the product model; a dedicated usability workflow is not established.","product-architecture.md"),
    capability(29,"Support validation and claim-evidence review","J08 J02 J05 J11 J12","P-V","NEED SCOPE CLAIM VP VR CODE","VP VR CLAIM LINK REVIEW",
        "Maintain or reference protocols/results per need or claim, their evaluation configuration, limitations, and review decisions.",
        "Dedicated study/evidence-package workflows and domain-specific coverage checks.","CAP-02 CAP-04 CAP-14",
        "Validation/domain owners, criteria, population/scenario scope, and original evaluation evidence.",
        "A claim unsupported by the selected study remains an unresolved finding even if system tests pass.",
        "Clinical evidence and validation links appear in the product model; a full validation workflow is not established.","product-architecture.md",
        [dict(when="A usability evaluation supplies validation",requires=["CAP-28"]),dict(when="Model/data evidence supplies validation",requires=["CAP-31"])]),
    capability(30,"Author and review labelling and instructions","J03 J05 J08 J11 J12","P4","SUB CLAIM RISK LABEL LINK","LABEL LINK REVIEW",
        "Maintain controlled label content with source requirements, supported claims, limitations, risk disclosures, and separate review.",
        "Template-assisted label authoring, cross-version comparison, and broader consistency checks.","CAP-02 CAP-04 CAP-14",
        "Label owner and applicable claim/risk evidence; the authoritative content home remains provisional.",
        "Changing a performance claim identifies the label wording and supporting evidence that must be reconsidered.",
        "Label evidence/change scenarios are documented; dedicated label authoring remains broader work.","product-architecture.md",
        [dict(when="Risk disclosure is required",requires=["CAP-27"]),dict(when="Claims require validation support",requires=["CAP-29"])]),
    capability(31,"Associate model and dataset versions with product evidence","J14 J04 J05 J07 J08 J11","P-M","ML SCOPE CODE TEST RUN VR","ML LINK REVIEW",
        "Reference dataset/model identities, provenance, partitions, training configuration, locked-test criteria, and the exact build/evaluation using them.",
        "Adapters to selected registries and domain-specific split/performance/change checks.","CAP-02 CAP-04 CAP-14",
        "An applicable ML scope, accessible artifact versions, and agreed data/model ownership and criteria.",
        "A performance report tied to model A does not establish performance of a release containing model B.",
        "Dataset/model records are in the wider planning map, with no dedicated implemented workflow established here.","product-architecture.md"),
    capability(32,"Review and freeze an exact evidence baseline","J09 J10 J11 J12","P4","NEED SYS SUB ARCH LINK REVIEW CHANGE","BASE REVIEW",
        "Select exact evidence/link versions, inspect current decisions and coherence, and record a separate baseline decision while retaining the prior state.",
        "Richer baseline comparison and checks for more evidence families.","CAP-02 CAP-04 CAP-14",
        "A baseline authority and the evidence scope/decision criteria must be agreed. A bought-tool baseline can supply the capability.",
        "A later requirement edit creates new candidate work while documents from the previous baseline remain reproducible.",
        "Immutable baseline selection, projections, decisions, and retained history are documented.","authority-model.md"),
    capability(33,"Render and review baseline-linked document packages","J10 J11 J12","P4","BASE DOC REVIEW","DOC REVIEW",
        "Use an agreed template to assemble a version-identifiable document/package from exact baseline membership, then review completeness.",
        "Governed template versions, automated PDF/DOCX/ZIP outputs, and meaningful redlines.","CAP-32",
        "Document owners, required outputs, templates, and access to baseline evidence.",
        "A specification identifies the evidence versions it contains and explains differences from the prior output.",
        "WP-30 controlled snapshots/templates/packages are recorded as local work; this exercise does not revalidate acceptance.","delivery-plan.md"),
    capability(34,"Assemble release evidence and a separate decision","J11 J10 J12","P4","BASE CODE RUN VR RISK LABEL DEFECT DOC REVIEW","REL REVIEW",
        "Join the named baseline/build to applicable current support, open-issue dispositions, and required distinct release/transfer decisions.",
        "Automated freshness/readiness checks and richer transfer packages for the selected scope.","CAP-32 CAP-21 CAP-26 CAP-30 CAP-04",
        "Agree release scope, required evidence, decision authorities, and the selected release home.",
        "A changed test, label, or risk decision makes the relevant readiness assessment subject to recheck.",
        "WP-20B final-release controls are documented at fictional prototype scope, with specified support and role limits.","delivery-plan.md",
        [dict(when="Risk acceptance is required for this release",requires=["CAP-27"]),dict(when="Validation evidence is required",requires=["CAP-29"]),dict(when="A document package is required",requires=["CAP-33"]),dict(when="Model/data versions are part of the release",requires=["CAP-31"])]),
    capability(35,"Capture corrections and failure feedback","J01 J02 J03 J04 J05 J06 J07 J08 J09 J10 J11 J12 J13 J14 J15","P-L","REVIEW CHANGE RUN DEFECT SRC METHOD","FB",
        "Retain before/after, reason, relevant record/source/method versions, and subsequent outcome when someone corrects or rejects work.",
        "Structured failure categories and feedback capture embedded in every review surface.","CAP-02 CAP-04",
        "Agree a small feedback record and responsibility for completing it. Start with human edits and rejections.",
        "A reviewer changing an invented threshold records what changed and why, rather than leaving only the final wording.",
        "Audit and correction histories offer source material; a joined meta-loop feedback workflow is not established.","authority-model.md"),
    capability(36,"Review recurring corrections and failures","J15 J16","P-L","FB REVIEW RUN DEFECT","FB REVIEW",
        "A process owner periodically groups feedback, investigates causes, and records proposed improvements; a spreadsheet or simple query can suffice.",
        "Assisted pattern summaries across suitable projects, with access-aware aggregation and follow-up tracking.","CAP-35",
        "A named process owner, review cadence, sufficient context, and appropriate access to project feedback.",
        "Repeated missing control links lead to an investigation of context selection rather than repeated one-off instructions.",
        "The loop concept comes from the user's framing; a recurring cross-project review workflow is proposed.","bluebridge-problem-framing.md"),
    capability(37,"Evaluate and adopt improved working methods","J15 J16","P-L","FB METHOD REVIEW","METHOD REVIEW",
        "Propose a versioned prompt/rule/context/tool change, evaluate failure examples and previously correct cases, record adoption, and observe later regressions.",
        "A richer evaluation library, comparisons by method version, and monitored rollout.","CAP-05 CAP-35 CAP-04",
        "A method owner, representative reviewed examples, evaluation criteria, and an adoption decision.",
        "A new context rule catches the missed label while preserving correct previous decisions; it changes future methods without rewriting product records.",
        "Prompt evaluation and offline regression precedents are documented; continuous meta-loop adoption is broader work.","prompt-evaluation.md"),
    capability(38,"Exchange records and preserve a handover path","J01 J02 J03 J04 J05 J06 J07 J08 J09 J10 J11 J12 J13 J14 J16","P0","SRC NEED SYS SUB LINK REVIEW BASE","SRC NEED SYS SUB LINK REVIEW BASE",
        "Define a small import/export contract for the first workflow, preserve IDs/provenance/decisions, and record the accepted target IDs. Manual transfer can suffice.",
        "Selected API adapters, broader history/attachment exchange, and rehearsed migration of scoped record ownership.","CAP-02 CAP-03 CAP-04",
        "Agree the destination's supported format and ownership boundary; confirm access to history and relationships before a handover.",
        "Accepted drafts reach the chosen evidence home with their source references and decisions; the team can retrieve them there without a second authoritative copy.",
        "Document packages and an authority model offer pieces; supplier-neutral exchange and handover are proposed.","authority-model.md"),
    capability(39,"Run background work with visible status and recovery","J01 J04 J07 J09 J13 J15","P3","SRC CHANGE METHOD REVIEW","SRC CHANGE REVIEW",
        "Give unattended capture/check operations durable identities, explicit queued/running/failed/completed states, bounded retries, duplicate handling, and a recovery path.",
        "Broader job coordination, concurrency protection, cost limits, and operational monitoring.","CAP-02 CAP-05",
        "Agree operating environment, ownership of failed work, and recovery/retention expectations.",
        "A connector retry captures the same source revision once; a failed check remains visible and cannot be mistaken for a passing review.",
        "Run failures are documented; durable jobs/recovery and related production foundations are deferred in the delivery plan.","delivery-plan.md"),
]


def package(id, title, adds, minimum, outcome, gate, interim, later, basis, effort):
    return dict(id=id,title=title,adds=adds.split(),minimum=minimum.split(),outcome=outcome,
                gate=gate,interim=interim,later=later,basis=basis,effort=effort)


PACKAGES = [
    package("P0","Agree conventions and a usable exchange path","CAP-01 CAP-02 CAP-03 CAP-04 CAP-05 CAP-38","CAP-01 CAP-02 CAP-03 CAP-04 CAP-05 CAP-38",
        "The first workflow has agreed record identities, homes, review responsibilities, processing contracts, and a way to transfer accepted outputs.",
        "One sample source, candidate, decision, and accepted target record can be followed using exact IDs and versions, with one authoritative home per controlled record.",
        "Existing document agreements and selected bought-tool record/review functions can provide these capabilities. Internal D1 storage is an option.",
        "Broader record schemas, managed policy/role configuration, and API exchange.",
        "Shared capabilities must be available at their minimum level; they do not all require new internal software.",
        "Main drivers: ownership decisions, usable existing data, destination formats, and internal-versus-external storage choice."),
    package("P1","Turn one source into reviewed needs and requirements","CAP-06 CAP-07 CAP-10 CAP-11 CAP-12 CAP-13 CAP-14 CAP-18","CAP-06 CAP-10 CAP-11 CAP-12 CAP-13 CAP-14 CAP-18 CAP-35 CAP-38",
        "A person captures a transcript, resolves questions, obtains cited candidate needs/requirements, reviews them and their links, and saves accepted outputs to the chosen home.",
        "Complete the flow on a representative source; an independent check finds a deliberately unsupported statement; revisions receive fresh checks; accepted target IDs, citations, decisions, and correction reasons are retrievable.",
        "Manual risk/task context, existing or bought-tool evidence/review, and current test/validation/release processes cover the rest of the lifecycle.",
        "CAP-07 document formats are optional; live Slack/meeting capture can be added independently through P-IN.",
        "Drafting, checking, independent scrutiny, human acceptance, usable links, persistence/exchange, and feedback are required together for this promised outcome. AI extraction by itself is a smaller assistance feature.",
        "Main drivers: fresh application/storage setup, prompt quality, citation reliability, reviewer workflow, and target-home exchange."),
    package("P2","Inspect traces and coordinate a significant change","CAP-15 CAP-16 CAP-17 CAP-19 CAP-20","CAP-15 CAP-16 CAP-17 CAP-18 CAP-14 CAP-35",
        "A reviewer sees known traces, assesses change consequences, independently inspects wider evidence, and assigns update/relink/retest work.",
        "The threshold-change scenario exposes affected requirements, controls, tests, and labels; each finding has a version, reason, owner, and disposition. Missing context is visible.",
        "An imported external relationship set and manual review can supply initial coverage. Existing owners/tools continue to implement and execute follow-up work.",
        "CAP-19 unlinked suggestions and CAP-20 drift automation are separate increments. Initial review can be manually triggered.",
        "This package can precede P1 if existing records and links supply its inputs. P1 transcript ingestion is not a hard prerequisite.",
        "Main drivers: existing graph quality, missing-link prevalence, impact-review breadth, evaluation cases, and integration with follow-up work."),
    package("P3","Connect implementation, verification, and normal developer work","CAP-21 CAP-25 CAP-26 CAP-39","CAP-21 CAP-26",
        "A team connects requirements/design to exact work/code/build references and reviewed test plans/executions at the relevant V-model levels.",
        "A reviewer can follow a requirement to its design/build/test execution and disposition; failed and stale evidence remains distinguishable from current support.",
        "Repository, CI, and work-tracker systems retain their facts. Manual references/imports and existing reviewers can start this workflow.",
        "CAP-25 adds checks in the PR/work path; CAP-39 supports unattended operations; selected P-IN adapters can arrive separately.",
        "The minimum does not require every connector or a full automated release gate. CAP-25's developer-check workflow additionally needs change work and independent checking.",
        "Main drivers: reference/mapping quality, report formats, execution identity, workflow permissions, and background-operation needs."),
    package("P4","Review baselines and produce selected outputs","CAP-30 CAP-32 CAP-33 CAP-34","CAP-32 CAP-33",
        "A team reviews an exact evidence state and produces a version-identifiable specification/report/package. Release support is a further scoped workflow.",
        "The output identifies baseline, template, and evidence versions; a changed baseline/template produces a new output and an explainable difference.",
        "Selected bought-tool baselines, documents, label records, and release processes can continue while internal output capabilities grow.",
        "CAP-30 label authoring and CAP-34 release/transfer support have additional evidence prerequisites. Full release takeover is a separate handover decision.",
        "The baseline-to-document minimum does not depend on internal transcript intake or all automated developer integrations.",
        "Main drivers: required outputs, template governance, target formats, evidence freshness, and scope of release support."),
    package("P-IN","Add selected source and engineering adapters","CAP-08 CAP-09 CAP-22 CAP-23 CAP-24","",
        "Reduce manual capture for one selected source or engineering system using the common intake and identity contracts.",
        "For each adapter, test capture, repeated capture, source revision/configuration mapping, failure visibility, and the relevant downstream review path.",
        "Manual upload, paste, references, and report bundles remain usable between adapter deliveries.",
        "Choose Slack, meetings, tracker, repository, or CI independently according to actual friction and selected systems.",
        "This is a grouping by shared integration work, not an all-or-nothing release package. There is no minimum bundle of all five adapters.",
        "Main drivers: selected vendor APIs, permissions, field/report mappings, revision semantics, and unattended reliability."),
    package("P-R","Extend risk records and control-evidence review","CAP-27","CAP-27",
        "Support the selected risk authoring/reference and control-evidence workflow.",
        "A changed control identifies the related requirement/test evidence and risk decision to reconsider.",
        "A bought tool or existing risk process can supply reviewed risk/control inputs from the first slice.",
        "Domain forms and broader effectiveness/risk-change assistance.",
        "Risk information may be required early even when native risk authoring is delivered later.",
        "Main drivers: product scope, existing risk data, analysis conventions, reviewers, and supporting evidence."),
    package("P-U","Extend task, UI, and usability evidence","CAP-28","CAP-28",
        "Support the chosen task-to-UI-to-evaluation workflow.",
        "A critical task links to the relevant UI requirement, use-related risk, and evaluation outcome.",
        "Existing design/study processes or a bought tool provide task and usability inputs meanwhile.",
        "Dedicated formative/summative work and coverage assistance.",
        "This branch is selected by product scope and source availability, not by completion of all other domain modules.",
        "Main drivers: study/task granularity, critical-task coverage, data formats, and design-system references."),
    package("P-V","Extend validation and claim evidence","CAP-29","CAP-29",
        "Support per-need/per-claim evaluation plans, results, limitations, and decisions.",
        "A reviewer can explain the evidence basis and limitations of a need/claim for the evaluated product configuration.",
        "Existing validation/clinical processes or a bought tool continue to supply evidence and decisions.",
        "More study types and appropriate usability/model context.",
        "Validation evidence is required where applicable; native validation workflow is an optional ownership choice.",
        "Main drivers: applicable claims/needs, study types, evidence quality, and domain review responsibilities."),
    package("P-M","Extend model and dataset evidence where applicable","CAP-31","CAP-31",
        "Connect exact model/data versions with implementation, performance, risk, and evaluation evidence.",
        "A build/model/performance version mismatch is visible with the affected evidence references.",
        "Selected model/dataset registries and current ML review practices retain artifact ownership.",
        "Registry adapters and domain-specific integrity/performance checks.",
        "Conditional on product scope. A conventional software product need not build an ML module.",
        "Main drivers: registry/data access, versioning, provenance, dataset partitions, and evaluation criteria."),
    package("P-L","Learn from corrections from the first workflow","CAP-35 CAP-36 CAP-37","CAP-35 CAP-36 CAP-37",
        "Capture corrections, investigate recurring causes, and adopt evaluated changes to working methods.",
        "A real correction has source/output/method references and a reason; a proposed method change is evaluated against failure and correct cases before adoption.",
        "Manual feedback capture, a periodic human review, and an existing evaluation script/spreadsheet can supply the first meta-loop.",
        "Assisted cross-project pattern analysis and monitored method rollout.",
        "Start CAP-35 with P1 or the first delivered workflow. Periodic analysis and evaluation can grow independently; a single important failure can trigger CAP-37 without waiting for CAP-36 pattern summaries.",
        "Main drivers: feedback quality, reviewer effort, representative examples, evaluation coverage, and adoption ownership."),
]

# Workflow affinity is scheduling convenience, not a dependency.
AFFINITIES = [
    dict(features=["CAP-08","CAP-09"],reason="Conversation capture uses a common intake contract; either source can ship alone."),
    dict(features=["CAP-22","CAP-23","CAP-24"],reason="Engineering adapters share identity/provenance work; each has its own source mapping and downstream use."),
    dict(features=["CAP-15","CAP-17"],reason="A trace view helps explain impact traversal, but traversal does not need a graphical UI."),
    dict(features=["CAP-35","CAP-36","CAP-37"],reason="Feedback, pattern review, and method evaluation form a practical meta-loop; feedback capture is useful before automated pattern analysis."),
]

COVERAGE = [
    ("J01","P1 / selected P-IN adapter","Capture and citations for selected sources.","Manual capture or existing/bought source intake covers unconnected formats/systems."),
    ("J02","P1","Clarifications and reviewed need/claim candidates.","Product/domain owners still agree intended use, meaning, and claims; unsupported scope stays with the existing process."),
    ("J03","P1; broader P2 checks later","Drafting, inner checks, review, and trace links for the chosen requirement scope.","Existing/bought requirements processes cover unimplemented types or deeper decomposition."),
    ("J04","P3; P2/P-IN increments","Design/work/code references and independent significant-change checking.","Current design, repository, PR, and work processes perform implementation and their own reviews."),
    ("J05","P-R; P2 review assistance","Selected risk/control records and change/coverage assistance.","Risk owners and existing/bought risk management supply records, criteria, and decisions from day one."),
    ("J06","P-U","Selected task/UI/study references and coverage.","Existing design/usability processes conduct studies and maintain unimplemented work."),
    ("J07","P3; CI adapter separately","Versioned plans, execution associations, dispositions, and selected coverage checks.","Developers/test owners and execution systems still run tests; other test workflows stay with existing/bought tools."),
    ("J08","P-V","Selected validation/claim records and review support.","Validation/clinical/usability owners and their current or bought processes conduct and interpret evaluations."),
    ("J09","P2; P3 developer-path increment","Recorded scope, linked/unlinked impact assistance, independent findings, and follow-up.","Affected people decide consequences and complete updates/retests; existing change control covers unsupported scope."),
    ("J10","P4 baseline increment","Exact evidence-state selection and coherence/review support.","The chosen external review/baseline process remains authoritative until a scoped handover."),
    ("J11","P4 release increment after applicable prerequisites","Current evidence association and separate readiness/release decisions.","Existing/bought release/transfer process covers the complete job meanwhile, including evidence branches not yet internal."),
    ("J12","P4 output/label increments; P2 trace answers","Selected baseline documents, labels, packages, and cited trace views.","Existing/bought document and labelling processes cover remaining outputs and content types."),
    ("J13","P2; each P-IN adapter independently","Captured revision comparison and meaningful drift work.","Manual checks of unconnected systems and existing owners keep other evidence current."),
    ("J14","P-M only if applicable","Exact model/data/build/evaluation associations.","Model/dataset systems and current ML owners supply artifacts and performance evidence."),
    ("J15","P-L from first delivered workflow","Correction capture, cause investigation, and evaluated method changes.","Human process owners supply the early meta-loop; regulatory/audit signals can join project feedback."),
    ("J16","P0 and ongoing P-L feedback","Recorded scope, ownership, decision methods, and chosen exchange boundaries.","BBT/client owners agree the operating model; selecting software alone does not allocate these responsibilities."),
]


def transitive(ids, byid):
    result=set()
    def visit(id):
        if id in result:return
        result.add(id)
        for dependency in byid[id]["hard"]:visit(dependency)
    for id in ids:visit(id)
    return sorted(result)


def validate():
    jobs={j["id"] for j in JOBS};records={r[0] for r in RECORDS}
    byid={c["id"]:c for c in CAPS};pids={p["id"] for p in PACKAGES}
    assert len(byid)==len(CAPS) and len(pids)==len(PACKAGES)
    assert {j for c in CAPS for j in c["jobs"]}==jobs
    assert {j for j,*_ in COVERAGE}==jobs and len(COVERAGE)==len(jobs)
    for c in CAPS:
        assert c["package"] in pids and set(c["jobs"])<=jobs
        assert set(c["inputs"]+c["outputs"])<=records
        assert set(c["hard"])<=byid.keys() and c["id"] not in c["hard"]
        assert (DOCS/c["doc"]).exists()
        for dep in c["conditional"]:assert dep["when"] and set(dep["requires"])<=byid.keys()
    visiting=set();done=set()
    def visit(id):
        assert id not in visiting, f"Hard dependency cycle at {id}"
        if id in done:return
        visiting.add(id)
        for dep in byid[id]["hard"]:visit(dep)
        visiting.remove(id);done.add(id)
    for id in byid:visit(id)
    assigned=[]
    for p in PACKAGES:
        assert set(p["adds"]+p["minimum"])<=byid.keys()
        assert all(byid[id]["package"]==p["id"] for id in p["adds"])
        assigned.extend(p["adds"])
    assert sorted(assigned)==sorted(byid), "Each capability needs one owning package."
    for affinity in AFFINITIES:assert set(affinity["features"])<=byid.keys()
    return byid


def roadmap():
    # Reuse the job-map diagram renderer so the editable and browser views agree.
    d=SOURCE["Diagram"]("feature-roadmap","Capability availability and useful delivery packages",
        "A prerequisite can come from internal work, a bought tool, or a manual process · package numbers do not impose one serial build",width=1800,height=1120)
    d.box("p0","P0 · Agree conventions and exchange","IDs / versions / link meanings / human decisions\nProcessing contracts and accepted target references",35,130,475,115,"decision")
    d.box("p1","P1 · Source → reviewed evidence","Capture → clarify → draft → check → independent review\nHuman decision, accepted records/links, feedback",35,355,475,125)
    d.box("p2","P2 · Trace and significant-change review","Existing records and links can provide the starting point\nKnown impacts, independent findings, owned follow-up",655,355,490,125)
    d.box("p3","P3 · Implementation and verification","Exact design / task / commit / build / test references\nManual associations first; PR-path checks as an increment",1265,355,500,125)
    d.box("p4","P4 · Baseline → selected outputs","Exact reviewed state, identifiable documents/packages\nRelease support adds scope-specific prerequisites",1265,680,500,125,"decision")
    d.box("pin","P-IN · Independent adapter increments","Slack · meeting platform · tracker · repository · CI\nEach adapter has its own source and downstream prerequisites",35,680,630,115,"external")
    d.box("domains","Domain branches · provide evidence where applicable","P-R risk · P-U usability · P-V validation · P-M model/data\nEvidence can be supplied externally before native modules exist",715,680,480,145,"external")
    d.box("learn","P-L · Feedback and method improvement begin with the first workflow","Capture human corrections and failures → investigate causes → evaluate and adopt method versions\nManual review/evaluation can start immediately. Broader automated pattern analysis can follow.",35,930,1730,105)
    d.edge("p0-p1","p0","p1","minimum contracts available",[(270,245),(270,355)],(270,300))
    d.edge("p0-p2","p0","p2","minimum contracts + existing records / links",[(510,185),(900,185),(900,355)],(910,210),True)
    d.edge("p0-p3","p0","p3","minimum contracts + implementation / test evidence",[(510,155),(1520,155),(1520,355)],(1255,142),True)
    d.edge("trace-dev","p2","p3","for developer-path checks",[(1145,380),(1205,380),(1205,285),(1400,285),(1400,355)],(1310,273),True)
    d.edge("dev-release","p3","p4","implementation / tests for release increment",[(1520,480),(1520,680)],(1520,588),True)
    d.note("Baseline-to-document work can start from an external baseline","P4's document minimum does not require P1, P2, or automated P3 integrations. The release increment needs the applicable current implementation, verification, validation, risk, labels, and decisions.",35,545,1100)
    d.note("Meaning of connections","Solid = minimum prerequisite for the named workflow. Dashed = another available input path or an increment-specific prerequisite. Domain evidence and feedback apply across packages; boxes do not establish supplier coverage or implementation status.",35,1065,1730)
    return d


INTRO = [
    "The user has reviewed the job list and regards it as a reasonable working basis. This maps supporting capabilities onto those jobs; specific responsibilities and future evidence homes remain provisional.",
    "Each capability has a minimum usable version and later increments. A minimum can be supplied internally, by a bought tool, or by an existing/manual process. Dependency means the capability must be available, not that BlueBridge must build a full native module first.",
    "This is a proposal for useful workflows and sequencing. It does not replace the demo's WP-00 to WP-60 delivery plan, claim current supplier coverage, or establish product compliance. Recorded demo precedents are identified separately and have not been revalidated here.",
    "The first P0/P1/P2 estimation pass assumes a fresh build. Existing demo descriptions are design and rough timing references; that estimate credits no existing code, prompts, fixtures, or tests.",
]


def markdown(byid):
    lines=["# BlueBridge jobs, features, and phased coverage", "",f"Status: first feature-mapping proposal, {DATE}.","",
           "Open the [visual feature map](bluebridge-feature-map.html) or edit the [package dependency diagram](bluebridge-feature-roadmap.drawio). Job IDs refer to the [jobs and information-flow map](bluebridge-jobs-map.md). See the [first fresh-build estimation pass](bluebridge-estimation.md) for the minimum P0/P1/P2 path.", ""]
    lines.extend(x+"\n" for x in INTRO)
    lines += ["## Recommended first useful slice", "",
              "Start with one transcript or text source, one bounded need/requirement output schema, agreed risk/task context, and one target evidence home. Capture the source, resolve material questions, draft with citations, check/revise, independently inspect, record human decisions, confirm links, and save accepted outputs with their target IDs. Review the needs before deriving requirements; review the requirements and links in their own right. Capture correction reasons from the same workflow.", "",
              "P0 supplies the minimum agreements, identities, decisions, run contracts, and exchange path. P1 supplies the workflow; CAP-35 starts feedback capture. Manual context selection, an independent human check, and manual transfer to the chosen home can be sufficient for the first slice. Additional adapters and automation are later increments.", "",
              "Success means a person can complete the job with usable citations, decisions, and saved records, and less reconstruction/rework. Measure reviewer correction effort and consequential misses alongside elapsed time. Establish the current-process comparison before claiming a quantified saving.", "",
              "A viable alternative is P2 first if existing records and links are accessible and change review is the greater pain. P2 does not require transcript ingestion. The recommended ordering is a discovery proposal, not a fixed build schedule.", "",
              "## Dependency meanings", "",
              "- A hard prerequisite is another minimum capability that must be available.",
              "- A conditional prerequisite applies only to the stated scope or automation level. Domain evidence may be mandatory for a job even while native domain software remains deferred.",
              "- Features required together deliver the package's promised user outcome. A single part can still be useful as assistance, with the rest handled elsewhere.",
              "- Workflow affinity is convenience for delivery or shared implementation, without a dependency.",
              "- External prerequisites are people, authority decisions, access, source quality, selected systems, and agreed criteria.", "",
              "Examples: live Slack capture needs a source-capture contract, not a completed meeting connector. A trace view needs usable links, not an internal link editor. A significant-change check needs independent context and follow-up ownership; a different model alone does not establish independence.", "",
              "## Work packages and completion gates", ""]
    for p in PACKAGES:
        minimum=p["minimum"]
        available=transitive(minimum,byid) if minimum else []
        needs=[id for id in available if id not in p["adds"]]
        lines += [f"### {p['id']}: {p['title']}", "", p["outcome"], "",
                  f"Features grouped here: {', '.join(p['adds'])}.","",
                  f"Minimum for the named outcome: {', '.join(minimum) if minimum else 'Choose one adapter; no mandatory whole-group bundle'}.","",
                  f"Other minimum capabilities that must be available: {', '.join(needs) if needs else 'Check the selected feature prerequisites'}.","",
                  "Completion gate: "+p["gate"],"","Interim coverage: "+p["interim"],"",
                  "Independent later increments: "+p["later"],"","Sequencing: "+p["basis"],"",
                  ("Estimation: the [fresh-build estimation pass](bluebridge-estimation.md) covers a narrow minimum version of this package. Calendar dates remain open. " if p["id"] in {"P0", "P1", "P2"} else "Estimation: calendar dates and engineering effort ranges remain open. ")+p["effort"],""]
    lines += ["## Job coverage throughout the build", "",
              "Mapping a feature to a job means it supports that work; it does not replace the accountable person or prove the entire job is complete. During every phase, remaining scope needs an assigned existing/bought/manual process. The following assignments are provisional categories, not checked supplier claims.", ""]
    for jid,phase,internal,interim in COVERAGE:
        title=next(j["title"] for j in JOBS if j["id"]==jid)
        ids=[c["id"] for c in CAPS if jid in c["jobs"]]
        lines += [f"### {jid}: {title}","",f"Useful internal increment: {phase}. {internal}","",
                  f"Supporting features: {', '.join(ids)}.","","Remaining/interim responsibility: "+interim,""]
    lines += ["## Feature catalogue", "",
              "CAP IDs distinguish feature capabilities from the job map's F-series information connections. Minimum versions are functional contracts; later increments describe greater capability/ease. Hard/conditional dependencies are availability requirements regardless of which tool supplies them.", ""]
    for c in CAPS:
        lines += [f"### {c['id']}: {c['title']}","",f"Supports {', '.join(c['jobs'])}; grouped in {c['package']}.","",
                  "Inputs: "+", ".join(c["inputs"])+". Outputs: "+", ".join(c["outputs"])+".","",
                  "Minimum useful version: "+c["minimum"],"","Later capability: "+c["later"],"",
                  "Hard prerequisites: "+(", ".join(c["hard"]) or "None beyond agreeing the first scope")+".",""]
        for dep in c["conditional"]:lines += [f"Conditional prerequisite: {dep['when']} → {', '.join(dep['requires'])}.",""]
        lines += ["External prerequisites: "+c["external"],"","Acceptance example: "+c["example"],"",
                  f"Documented demo precedent: {c['reuse']} See [{c['doc']}]({c['doc']}).",""]
    lines += ["## Features convenient to group without a hard dependency", ""]
    lines.extend(f"- {', '.join(a['features'])}: {a['reason']}" for a in AFFINITIES)
    lines += ["", "## Hybrid ownership and handover", "",
              "Before the first slice, choose the source home, the candidate/review home, the accepted record home, and the owner of each decision. If BlueBridge drafts while a bought tool owns accepted requirements, CAP-38 must preserve the source and decision references and record the target IDs. Internal candidate records remain identifiable as proposals.", "",
              "Before transferring an authoritative workflow, demonstrate the agreed job end to end in the new home; reconcile IDs, versions, links, decisions, attachments, and historical access; disposition unresolved work; and name the cutover owner. Choose native features by actual need. Repository, CI, work tracking, study, and model systems can keep their facts throughout.", "",
              "## Decisions needed to estimate and prioritise", "",
              "1. Choose the first workflow and evidence scope. The proposal above favours P1, with P2 as an alternative if current pain/data favour change review.",
              "2. Choose an initial target home and minimum exchange method, including what remains manual.",
              "3. Name the author, independent checker, decision owner, and method owner for that scope.",
              "4. Review representative source/trace data and compare current completion/review effort.",
              "5. Review the fresh-build P0/P1/P2 estimate against its pilot scope and named staffing assumptions. Use recalled demo pace as provisional calibration, then replace it with fresh-build actuals.",
              "6. Select adapters one at a time after the toolset choice. Confirm access, mappings, and reliability needs before estimating them.","",
              "The separate estimation pass provides provisional effort scenarios for a narrow P0/P1/P2 pilot. Other increments remain unestimated. Availability of reviewers, source quality, and selected systems can change elapsed time independently of implementation effort.","",
              "## Source and regeneration", "",
              "Source basis: the user-reviewed job map, loop-engineering discussion, confirmed transition context, and local prototype documentation. Feature scope, internal/bought/manual allocation, and calendar estimates remain proposals. Supplier capabilities have not been investigated in this step.","",
              "Edit [build_feature_map.py](planning/build_feature_map.py), then run `python3 docs/planning/build_feature_map.py`. It reads the canonical job-map definitions and regenerates this reference, the visual map, JSON data, SVG, and draw.io roadmap. It checks all job/record references, feature/package coverage, unique IDs, hard-dependency cycles, and diagram structure. Conditional requirements are stated by scope; package ordering does not silently turn affinities into hard prerequisites.",""]
    return "\n".join(lines)


def html_map(byid, svg):
    esc=html.escape
    def caplink(id):return f'<a href="#{id.lower()}">{id}</a>'
    parts=['<h2>Package outcomes and sequencing</h2>',f'<div class="diagram">{svg}</div>']
    for p in PACKAGES:
        parts += [f'<details class="package" id="{p["id"].lower()}"><summary>{p["id"]} · {esc(p["title"])}</summary><div class="body"><p>{esc(p["outcome"])}</p>',
                  '<h3>Features grouped here</h3><p>'+', '.join(caplink(id) for id in p["adds"])+'</p>',
                  '<h3>Minimum outcome</h3><p>'+(', '.join(caplink(id) for id in p["minimum"]) if p["minimum"] else 'Choose one adapter; these increments ship independently.')+'</p>']
        for key,label in [("gate","Completion gate"),("basis","Sequencing"),("interim","Interim coverage"),("later","Later increments"),("effort","Effort drivers; dates remain open")]:
            parts.append(f'<h3>{label}</h3><p>{esc(p[key])}</p>')
        if p["id"] in {"P0", "P1", "P2"}:
            parts.append('<p><a href="bluebridge-estimation.md">Fresh-build effort scenarios for the narrow P0/P1/P2 pilot</a></p>')
        parts.append('</div></details>')
    parts.append('<h2>Features by job</h2><p>Open a job to see its supporting features and remaining responsibilities.</p>')
    for jid,phase,internal,interim in COVERAGE:
        j=next(j for j in JOBS if j["id"]==jid)
        parts.append(f'<details class="job" id="{jid.lower()}"><summary>{jid} · {esc(j["title"])}</summary><div class="body"><p><strong>Useful increment.</strong> {esc(phase)}. {esc(internal)}</p><ul>')
        parts.extend(f'<li>{caplink(c["id"])} {esc(c["title"])}</li>' for c in CAPS if jid in c["jobs"])
        parts.append(f'</ul><p><strong>Interim / remaining work.</strong> {esc(interim)}</p></div></details>')
    parts.append('<h2>Feature catalogue</h2><p>Minimum capability, later increments, dependencies, and concrete acceptance examples.</p>')
    for c in CAPS:
        jobs=', '.join(f'<a href="#{j.lower()}">{j}</a>' for j in c["jobs"])
        parts.append(f'<details class="feature" id="{c["id"].lower()}"><summary><span class="id">{c["id"]}</span> {esc(c["title"])}</summary><div class="body"><p class="meta">Supports {jobs} · <a href="#{c["package"].lower()}">{c["package"]}</a></p>')
        parts.append(f'<p class="meta">Inputs: {esc(", ".join(c["inputs"]))}. Outputs: {esc(", ".join(c["outputs"]))}.</p>')
        for key,label in [("minimum","Minimum useful version"),("later","Later capability")]:parts.append(f'<h3>{label}</h3><p>{esc(c[key])}</p>')
        parts.append('<h3>Hard prerequisites</h3><p>'+(', '.join(caplink(id) for id in c["hard"]) or 'Agree the first scope.')+'</p>')
        for dep in c["conditional"]:parts.append('<h3>Conditional prerequisite</h3><p>'+esc(dep["when"])+': '+', '.join(caplink(id) for id in dep["requires"])+'.</p>')
        for key,label in [("external","External prerequisites"),("example","Acceptance example"),("reuse","Documented demo precedent")]:parts.append(f'<h3>{label}</h3><p>{esc(c[key])}</p>')
        parts.append(f'<p><a href="{c["doc"]}">Source documentation</a></p></div></details>')
    return '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BlueBridge feature map and useful delivery packages</title><style>
*{box-sizing:border-box}body{margin:0;background:#fff;color:#243746;font:16px/1.55 system-ui,Arial,sans-serif}main{max-width:1540px;margin:auto;padding:28px 30px 60px}h1{font-size:28px;margin:0 0 8px}h2{font-size:23px;margin:32px 0 10px}h3{font-size:16px;margin:18px 0 4px}p{margin:0 0 12px;max-width:1150px}a{color:#315d7e}.status,.meta{color:#63717a;font-size:14px}.lead{padding:16px 20px;background:#f6f8fa;border-left:3px solid #41637c;margin:22px 0}.diagram{overflow:auto}.diagram svg{display:block;width:100%;min-width:1000px;height:auto}details{border-bottom:1px solid #d8dfe4;scroll-margin-top:20px}summary{padding:14px 4px;cursor:pointer}.package>summary{font-weight:650}.body{padding:0 28px 20px;max-width:1160px}.id{display:inline-block;min-width:78px;color:#41637c;font-weight:650}details:target{background:#f6f8fa}li{padding-bottom:5px}.first-slice{padding-left:22px}footer{margin-top:32px;border-top:1px solid #d8dfe4;padding-top:16px;color:#63717a;font-size:14px}@media(max-width:650px){main{padding:20px 16px}h1{font-size:24px}.body{padding-left:12px}.lead{padding:12px}}@media print{details{break-inside:avoid}details .body{display:block}summary{list-style:none}.diagram svg{min-width:0}}
</style></head><body><main><h1>BlueBridge feature map and useful delivery packages</h1><p class="status">First feature-mapping proposal · 9 October 2026 · responsibilities and record homes remain provisional</p>
<div class="lead"><p>The user-reviewed job list is the working basis. Each feature has a minimum version, later increments, prerequisites, and an acceptance example.</p><p>A prerequisite must be <strong>available</strong>. An existing tool or manual process can supply it while internal capability grows. Supplier coverage and delivery dates have not been established.</p><p>The <a href="bluebridge-estimation.md">first P0/P1/P2 estimation pass</a> assumes a fresh build. The demo supplies design and rough timing references, with no code-reuse saving.</p></div>
<h2>Recommended first useful slice</h2><p>One transcript or text source becomes reviewed needs and requirements, with source support, confirmed links, saved target records, and correction feedback.</p><ol class="first-slice"><li>Capture the source and resolve material questions.</li><li>Draft cited needs, check/revise, independently inspect, and review them.</li><li>Derive requirements from reviewed needs and relevant risk/task context.</li><li>Check/revise and independently inspect the requirements, then record human decisions and confirmed links.</li><li>Save accepted outputs to the chosen evidence home and retain corrections.</li></ol>
<p>Manual context, independent human checking, and manual transfer can start this workflow. Live connectors can arrive separately. Change review can start first if existing records and traces make that the more useful workflow.</p>
''' + "\n".join(parts) + '''
<footer><a href="bluebridge-feature-map.md">Full planning reference</a> · <a href="bluebridge-feature-roadmap.drawio">Editable package diagram</a> · <a href="bluebridge-jobs-map.html">Jobs and information-flow map</a> · <a href="bluebridge-estimation.md">First estimation pass</a><p>Source basis: user discussion, canonical job definitions, and local prototype documentation. Documented demo precedents have not been revalidated; the first estimate assumes a fresh build. Remaining jobs retain an existing/bought/manual owner throughout the build.</p></footer>
</main><script>function openTarget(){const e=document.getElementById(location.hash.slice(1));if(e&&e.tagName==='DETAILS'){e.open=true;requestAnimationFrame(()=>e.scrollIntoView({block:'start'}));}}window.addEventListener('hashchange',openTarget);openTarget();</script></body></html>
'''


def main():
    byid=validate();d=roadmap();SOURCE["validate"]([d])
    vector=SOURCE["svg"](d);xml=SOURCE["drawio"]([d])
    ET.fromstring(vector);ET.fromstring(xml)
    (DOCS/"bluebridge-feature-map.md").write_text(markdown(byid))
    (DOCS/"bluebridge-feature-map.html").write_text(html_map(byid,vector))
    (DOCS/"bluebridge-feature-roadmap.drawio").write_text(xml)
    (HERE/"bluebridge-feature-roadmap.svg").write_text(vector)
    data=dict(date=DATE,status="first proposal; job families reasonable working basis; responsibilities and homes provisional",features=CAPS,packages=PACKAGES,
              coverage=[dict(job=j,increment=p,internal=i,interim=x) for j,p,i,x in COVERAGE],affinities=AFFINITIES)
    (HERE/"bluebridge-feature-map-data.json").write_text(json.dumps(data,indent=2)+"\n")
    print(f"Generated {len(CAPS)} capabilities, {len(PACKAGES)} groups, and coverage for all {len(JOBS)} jobs.")
    print("Validated IDs, job/record mappings, package ownership, hard-dependency DAG, conditional references, source links, and roadmap structure.")


if __name__=="__main__":main()
