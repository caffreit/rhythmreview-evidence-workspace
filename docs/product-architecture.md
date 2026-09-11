# BlueBridge product architecture

Status: approved prototype direction  
Last updated: 11 September 2026

## Product intent

BlueBridge is a controlled product-evidence workspace for medical-device teams. It turns source material and observed implementation facts into reviewable evidence, preserves the decisions that produced each controlled version, and freezes coherent product states as baselines. It is not a production eQMS and must not describe its prototype approvals as compliant electronic signatures.

The next prototype proves one complete path:

```text
fictional source material
  -> context questions
  -> reviewed user needs
  -> derived requirements
  -> item approval
  -> impact review
  -> coherent baseline
  -> release record
```

## Split authority

Authority belongs to the system that created each fact. BlueBridge records immutable references to external facts and controls the design-control decisions derived from them.

| System | Authoritative for | BlueBridge behaviour |
| --- | --- | --- |
| Client documents, transcripts and email | Supplied content and source revisions | Preserve each imported revision and exact citations |
| Git repository | Code present at a commit | Record repository, path and commit observations; raise drift rather than overwrite controlled components |
| Jira | Work status, assignment and ticket content | Treat tickets as linked work records, not approved design evidence |
| BlueBridge | Evidence versions, trace links, reviews, change sets, baselines and releases | Keep approved versions immutable and audit every controlled decision |

An updated external source creates a new observation. It may create drift findings, impact suggestions or candidate changes. It never alters an approved evidence version by itself.

## Workspace hierarchy

```text
Client
└── Product workspace
    ├── Working state
    │   ├── source revisions and observations
    │   ├── candidate evidence and links
    │   ├── review tasks
    │   └── change sets
    ├── Immutable baselines
    └── Releases
```

A baseline freezes approved evidence versions, active relationships and collection membership. A release references one baseline together with the relevant code revision, test executions, approvals and output documents. Design-review baselines may exist without a release.

## Domain model

### Inputs and processing

- `SourceConnection` identifies a manual import, document store, work tracker, repository, cloud environment or CI system.
- `SourceArtifact` is a stable external or imported source identity.
- `SourceRevision` is immutable content with its hash, external version, capture time and importer.
- `ProcessingRun` records its exact source revisions, analysis policy, model, reasoning effort, structured input and output, failure state and timestamps.
- `Clarification` records a contradiction, ambiguity, missing decision or scope question. Required questions must be answered or deferred with a reason before generation. Advisory questions may remain open and mark downstream candidates.

### Controlled product evidence

`EvidenceItem` is the stable identity. `EvidenceVersion` contains immutable content and its control state. Evidence types are:

- intended use
- claim
- user need
- requirement
- component
- hazard
- risk control
- test case
- clinical or usability evidence
- labelling
- anomaly

Requirements use product, system and subsystem levels. Components replace the prototype's former "Design component" label and may form system, subsystem and module hierarchies. Architecture specifications remain documents.

Every evidence version records:

- type, level, title, statement and rationale
- owner and responsible discipline
- human-authored, imported, AI-derived or code-observed origin
- source spans and processing-run provenance
- created, reviewed and approved timestamps
- incoming and outgoing relationships
- version and change-set history
- baseline, release and document usage

### Relationships and collections

Relationships are typed, version-controlled and reviewable. The core vocabulary is `REFINES`, `ALLOCATED_TO`, `IMPLEMENTS`, `MITIGATES`, `VERIFIES`, `VALIDATES`, `SUPPORTED_BY`, `DISCLOSED_IN`, `DEPENDS_ON` and `MAY_AFFECT`.

`Collection` models a test suite, requirement family, subsystem, processing batch or release scope. Membership is explicit and versioned. A change to one member creates a contextual impact candidate for the other members without claiming that each pair has a direct trace link.

### Controlled work

- `ChangeSet` owns candidate evidence versions, relationship changes, collection changes and analysis runs.
- `ReviewTask` targets a clarification, candidate evidence version, relationship, impact suggestion or change set.
- `ReviewDecision` records accept, reject, revise, defer or approve with actor, permission, discipline, rationale and time.
- `Baseline` is an immutable approved snapshot.
- `Release` references a baseline and the implementation and verification records shipped with it.
- `DocumentTemplate` queries controlled objects; `DocumentSnapshot` freezes a rendered output against a baseline.

Authors, reviewers, approvers, viewers and administrators are permission roles. Product, clinical, software, test and QA/RA are disciplines used for ownership and routing. Job titles do not grant permissions directly. Parent and child objects require independent review; approval never cascades.

## Lifecycle lens and information architecture

The persistent lifecycle strip is an iterative coverage lens, not a prescribed sequence:

1. Definition
2. Requirements
3. Architecture
4. Risk
5. Verification
6. Validation
7. Release

Each segment displays controlled-item counts, open review work and blockers for the selected product context. Selecting a segment filters the current view.

The global header contains client, product and baseline or release context, global search, open review count, and current persona.

The sidebar is grouped as follows:

- Overview
- Inputs: Source inbox, Connected systems
- Work: Review centre, Changes
- Design controls: Product definition, Requirements, Components, Risk, Verification, Clinical and usability
- Traceability: Matrix, Graph, Coverage and gaps
- Controlled outputs: Baselines, Releases, Documents, Design reviews
- Administration: Integration setup, Analysis policies, Templates, People and roles

Connected systems is the operational view of repositories, commits, tickets and sync runs. Integration setup contains credentials and mappings.

Navigation has three depths: product overview, module list or queue, and individual record detail. Evidence details use consistent Content, Relationships, Provenance, History, and Usage sections.

## Representative workflows

### Source-first

Import a source revision, analyze it for missing context, resolve required questions, generate user needs, review them, then derive requirements only from accepted needs and cited source content.

### Code-first

Observe a repository revision, derive an as-built component model, compare it with approved components and requirements, then propose missing links, requirements or tests. Code proves what exists, not why it exists.

### Change-first

Submit a material change to an evidence object or relationship. Deterministic and semantic analysis identifies review, update, relink and retest work. Reviewers decide each suggestion before candidate versions proceed.

### Remediation

Import existing documents and code observations, normalize them into the product graph, and resolve conflicts, missing ownership and traceability gaps. This composes the source-first and code-first machinery.

### Release

Collect approved changes, run coherence and readiness checks, freeze a baseline, then create a release record that references the baseline, code revision, test executions, approvals and output package.

## AI policies and provenance

BlueBridge calls OpenRouter through its OpenAI-compatible API, without a provider-neutral application layer. `OPENROUTER_API_KEY` is an environment secret. The default analysis model is `openai/gpt-5.6-luna` with medium reasoning, and semantic retrieval uses `openai/text-embedding-3-small`. The model remains configurable for testing. Each policy has a stable name, explicit version and strict structured-output schema.

1. `source-context-v1` extracts facts and cited contradictions, ambiguities, missing decisions and scope questions.
2. `user-needs-v1` generates cited user-need candidates after the context gate passes.
3. `requirements-v1` derives product, system and subsystem requirements from accepted user needs, source content and recorded answers.
4. `impact-v2` classifies bounded candidates across hierarchy, functional overlap, interfaces and data flow, shared risk or controls, verification coverage, conflicting constraints, collection membership and release coupling.

The impact engine combines deterministic graph traversal, hierarchy and coverage rules, collection membership, baseline and release usage, and semantic retrieval. The model evaluates the bounded set. Every suggestion includes target, category, action, rationale and citations. Accepting a suggestion creates controlled work; it never changes evidence or a trace link silently.

Analysis runs start when a candidate enters review and restart after material content, relationship or collection changes. They do not run after every keystroke. A failed live run preserves the prior controlled state. The last successful structured run may be replayed only when the interface labels it as saved output.

## Capability boundaries

The first functional slice implements fictional source ingestion, text and Markdown import, clarification, sequential user-need and requirement review, source provenance, impact analysis, candidate-baseline approval and a release record.

The interface may show conceptual pages for repository observations, risk, verification, clinical and usability, design reviews, integration setup, policy management and role administration. Each conceptual page must say "Conceptual — not implemented".

The prototype defers real Jira, GitHub and CI synchronization, PDF and DOCX parsing, risk generation, SBOM, real authentication, electronic signatures and submission-ready DHF generation.

## Decision log

| Decision | Outcome |
| --- | --- |
| Authority | Split by fact source; BlueBridge controls reviewed evidence |
| Primary organization | Client -> product -> baseline/release |
| Navigation | Object-first sidebar with a persistent lifecycle lens |
| Input entry | Separate Source inbox and Connected systems pages |
| Source sequence | Questions before drafts |
| Approval | Individual versions plus coherent baseline approval |
| Impact trigger | Submission and subsequent material edits |
| Release model | Baseline and release are separate |
| People | Permission roles plus disciplines and ownership |
| Generation | Review user needs before deriving requirements |
| Lifecycle labels | Definition through Release object-flow stages |
| Grouping | Typed, versioned collections |
| Clarification gate | Required and advisory questions |
| Source support | Fictional seed pack plus text and Markdown import |
| AI availability | Live by default, labelled saved replay fallback |
| Design-output type | Rename Design component to Component |
| Demonstration | Source to baseline and release record |
| Requirement hierarchy | Product, system and subsystem |
| Architecture artifact | One living record with separate wireframes |
| AI gateway | OpenRouter via its OpenAI-compatible Responses and embeddings endpoints; no multi-provider adapter |
