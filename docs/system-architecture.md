# BlueBridge system architecture

Status: implementation reference

Snapshot: 18 September 2026

## What exists

BlueBridge is a single-product web prototype for controlled SaMD evidence. A React client calls server routes in the same application. Cloudflare D1 stores structured records. Cloudflare R2 stores immutable file bytes. The server makes optional OpenRouter calls for four bounded AI actions.

The local product has four connected paths:

- The source-first path turns text, Markdown, PDF, or DOCX revisions into reviewed user needs and requirements.
- The change-first path assesses the effect of a proposed change on an approved evidence baseline.
- The release path adds verification, residual-risk decisions, imported CI evidence, and final approval to an approved baseline.
- The document path governs templates, renders baseline-linked PDF and DOCX snapshots, creates redlines, and assembles a QA-reviewed ZIP package.

Every path ends in a human decision. A model cannot approve evidence, create a confirmed trace relationship, approve a baseline, accept a document package, or approve a release.

GitHub `master` contains WP-20B at commit `b302d25`. The WP-30 document path exists only in the uncommitted local worktree at this snapshot.

## System context

```mermaid
flowchart LR
    Author["Author<br/>Alex Morgan, simulated"] --> UI[BlueBridge web workspace]
    QA["QA reviewer<br/>Jamie Chen, simulated"] --> UI
    UI --> API[Server route handlers]
    API --> D1[("Cloudflare D1<br/>structured records and file metadata")]
    API --> R2[("Cloudflare R2<br/>immutable file bytes")]
    API --> OR["OpenRouter<br/>Responses and embeddings APIs"]
    Source["Text, Markdown, PDF, or DOCX<br/>fictional source material"] --> UI
    Git[GitHub or Git] -. planned observation .-> API
    Jira[Jira] -. planned work reference .-> API
    CI["GitHub Actions bundle<br/>manual verified import"] --> API

    classDef planned stroke-dasharray: 5 5,color:#666;
    class Git,Jira planned;
```

The dashed integrations are product direction, not working connectors. The CI path accepts a downloaded `ci-evidence-v1` bundle and verifies its manifest, commit, conclusion, checks, and report hash. It does not authenticate GitHub or fetch a run. Live model calls send source or candidate evidence to OpenRouter. The prototype policy permits fictional data only.

## Deployed parts

```mermaid
flowchart TB
    subgraph Browser
        Workspace["React workspace<br/>components/workspace.tsx"]
        SourceUI["Source, release, and document views"]
        TemplateUI["Governed templates<br/>components/template-workspace.tsx"]
        Guide[Guided walkthrough]
    end

    subgraph Cloudflare Worker
        Router["70 app route handlers<br/>app/api routes"]
        ChangeService[Change analysis service]
        Repositories["Repository modules<br/>workflow and SQL"]
        Policies[Zod domain and output schemas]
        Coherence[Deterministic coherence rules]
        Documents["Extraction, rendering,<br/>redline, and package rules"]
        Provider[OpenRouter adapter]
    end

    subgraph Storage
        Database[(D1 / SQLite)]
        Files[(R2 object storage)]
        Seed[Versioned fictional seed JSON]
        Migrations[Embedded Drizzle migrations]
    end

    Workspace --> Router
    SourceUI --> Router
    TemplateUI --> Router
    Guide --> Workspace
    Router --> ChangeService
    Router --> Repositories
    ChangeService --> Provider
    ChangeService --> Repositories
    Repositories --> Coherence
    Repositories --> Documents
    Repositories --> Policies
    Repositories --> Database
    Repositories --> Files
    Provider --> Database
    Seed --> Repositories
    Migrations --> Repositories
    Provider --> OpenRouter[OpenRouter API]
```

### Client

`app/page.tsx` mounts one client-side workspace. `components/workspace.tsx` owns navigation and the guided demonstration. Central actor definitions provide Author, QA reviewer, and Release approver identities to every workspace. Dedicated release UI separates prerequisites, residual risk, evidence, QA attestation, and the final decision. `components/template-workspace.tsx` exposes the template lifecycle. The source UI handles original document import, revision history, anchored blocks, and source redlines.

The client validates every successful response with Zod before rendering it. The role selector changes the actor value sent to the server. It does not authenticate a person.

### Server

The route handlers translate HTTP requests into repository calls. Zod schemas validate JSON and multipart input at the server boundary. `lib/final-release-repository.ts` owns residual-risk revisions and decisions, attachment persistence, CI import verification, attestations, final-readiness runs, approval, and reset cleanup. `lib/document-source-repository.ts` owns imported document revisions and source redlines. `lib/document-repository.ts` owns template decisions, snapshots, controlled redlines, packages, and document files. Server checks repeat every UI role restriction.

The repository modules contain SQL and workflow rules together. There is no separate service layer for most commands. This keeps the prototype direct, but it will become hard to test and evolve when integrations and permissions expand.

### Storage

Cloudflare D1 stores controlled records and file metadata. R2 stores release attachments, original source files, rendered snapshots, redlines, and packages. Drizzle defines D1. Runtime code uses prepared SQL. R2 object keys are generated and never use uploaded filenames. D1 retains the normalized filename, media type, size, SHA-256, and ownership. Downloads force attachment disposition.

`db/runtime-schema.ts` is generated from the Drizzle migrations. Do not edit it by hand. See [Data model and database](data-model.md) for the tables and integrity limits.

### Model provider

`lib/openrouter-provider.ts` and `lib/source-ai.ts` use the OpenAI SDK against OpenRouter's OpenAI-compatible API. The current code has no provider-neutral adapter. Configuration selects the model, embedding model, reasoning effort, base URL, site URL, and application name.

## Source-first workflow

```mermaid
sequenceDiagram
    actor A as Author
    actor Q as QA reviewer
    participant B as BlueBridge
    participant M as OpenRouter
    participant D as D1

    A->>B: Import text, Markdown, PDF, or DOCX
    B->>B: Validate and extract the file when present
    B->>D: Save immutable revision, hash, and anchored blocks
    A->>B: Run context analysis
    B->>M: Source revision plus citation contract
    M-->>B: Required and advisory questions
    B->>B: Validate schema and exact quotes
    B->>D: Save processing run and questions
    A->>B: Answer, defer, or dismiss questions
    A->>B: Generate user needs
    B->>M: Source, resolved context, and output contract
    M-->>B: Cited user-need candidates
    Q->>B: Approve, reject, or request revision
    A->>B: Derive requirements
    B->>M: Approved needs, source, context, and contract
    M-->>B: Atomic cited requirements
    Q->>B: Decide each requirement
    B->>M: Classify bounded impacts
    Q->>B: Decide each impact suggestion
    Q->>B: Approve candidate baseline
    B->>D: Copy baseline, add approved versions and links
    B->>D: Supersede old baseline
    A->>D: Explicitly create planned release for approved baseline
```

Required questions block generation only while they remain open. The author can defer one with a reason. Advisory questions do not block generation and remain attached to downstream candidates.

A new source revision never edits evidence from an approved baseline. BlueBridge records the new revision, computes a source-drift work item, and requires the source flow to run again. For PDF and DOCX sources, R2 retains the original bytes. D1 retains the extraction result, extractor version, page or paragraph locators, and deterministic source redline.

## Document-control workflow

```mermaid
sequenceDiagram
    actor A as Author
    actor Q as QA reviewer
    participant B as BlueBridge
    participant D as D1
    participant F as R2

    A->>B: Create and edit a template version
    A->>B: Submit the version to QA
    Q->>B: Accept or reject the template version
    A->>B: Render an approved version for an approved baseline
    B->>D: Freeze template, baseline, evidence versions, model, and fingerprint
    B->>F: Store PDF and DOCX outputs with hashes
    A->>B: Compare two snapshots
    B->>F: Store PDF and DOCX redline reports
    A->>B: Build document-package-v1
    B->>B: Check required templates, outputs, fingerprints, and R2 metadata
    B->>F: Store ZIP and manifest
    Q->>B: Accept or reject the latest passing package fingerprint
```

The package ID derives from the baseline, required approved template versions, renderer version, and package policy. Repeating the same command returns the same package. A changed template selection produces a new fingerprint. BlueBridge withholds the ZIP until QA accepts the latest passing package.

## Change-first workflow

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> analysing: start analysis
    analysing --> ready_for_review: completed
    analysing --> draft: failed, restore prior state
    ready_for_review --> under_review: first QA decision
    under_review --> updates_proposed: draft updates
    ready_for_review --> updates_proposed: draft updates
    updates_proposed --> qa_review: submit
    qa_review --> returned_to_author: QA returns
    returned_to_author --> qa_review: resubmit
    ready_for_review --> analysing: reopen
    under_review --> analysing: reopen
    updates_proposed --> analysing: reopen
    returned_to_author --> analysing: reopen
    qa_review --> approved: QA approves baseline
```

The analysis pipeline collects direct graph neighbors to depth three, semantic neighbors from embeddings, and members of the same controlled collections. The model classifies the bounded graph and semantic set. Collection suggestions are deterministic additions. QA accepts, rejects, or changes each action and records a reason.

Accepted `update` and `retest` decisions create author-editable candidate drafts. The current draft endpoint does not call a model. Guided scenarios can load saved draft fixtures; other flows use an author template.

Before approval, the server creates a candidate baseline by copying current membership and substituting proposed versions. QA approval marks those versions approved, supersedes the prior baseline, and records the old and new membership in the audit event.

## Coherence checks

The prototype runs repeatable checks for missing verification links, superseded evidence in document views, component inventory gaps, and stale child review after a parent change. It also contains three human-authored evaluation fixtures for timing, claim strength, and review-date consistency.

Candidate checks use an in-memory overlay of proposed statements on the active baseline. Editing a candidate increments the change revision and makes an older check stale. A waiver applies only to the exact finding fingerprint. If the rule inputs change, the waiver does not carry forward.

Baseline approval remains narrower than release approval. `final-release-v1` enforces the accepted WP-20A readiness fingerprint, relationship policy, high traceability gaps, high coherence findings, current accepted residual risks, a risk-support attachment, current valid QA-accepted CI evidence, and a current QA risk attestation. Medium coherence findings remain visible warnings. `document-package-v1` separately checks required document outputs and the current package fingerprint. The final-release policy does not yet require an accepted document package.

## Failure behavior

Live model calls retry once for transient HTTP failures. A structural, citation, or provenance failure does not retry. Failed runs store metadata and a safe error, but create no AI-derived questions, candidates, or suggestions.

Replay is a separate user choice. The server never changes a failed live request into replay output. On change reanalysis failure, the server restores the prior change state and current analysis run.

## Trust and control boundaries

| Boundary | Control in the prototype | Production gap |
| --- | --- | --- |
| Browser to server | Zod-valid request and response shapes | No authenticated session or authorization service |
| Server to model | Bounded input, strict structured output, exact citation checks, `store: false` | No data classification, DLP, provider contract control, or key rotation workflow |
| Server to database | Prepared statements and domain parsing on reads | No declared foreign keys and no transaction spanning multi-batch baseline writes |
| D1 to R2 | Generated object keys, SHA-256 metadata, cleanup on failed writes, and object checks during document packaging | No atomic transaction across D1 and R2, retention policy, legal hold, malware scan, or independent integrity monitor |
| AI to controlled evidence | AI records stay pending until a QA decision | Simulated identities do not prove who decided |
| External systems to BlueBridge | Imported source bytes and CI bundles retain hashes and provenance; CI manifests and reports are schema-, commit-, conclusion-, and hash-checked | No live GitHub, Jira, or document-system connector and no independent run authentication |
| Baseline to release | Two versioned policies, current-record fingerprints, separate simulated QA and release-approver decisions, and immutable final state | No authenticated identity, compliant e-signature, deployment evidence, or production validation |
| Baseline to document package | Approved template versions, exact evidence membership, renderer version, file hashes, manifest, package fingerprint, and QA package decision | Local WP-30 only; no production validation, qualified renderer, or submission-package claim |

## Planned expansion

The approved product direction still adds client and product tenancy, real source connections, a complete risk lifecycle, repository observations, durable jobs, permissions, electronic signatures, and validated operations. WP-30 must first be committed and accepted. [Delivery plan](delivery-plan.md) records the dependency order. [Product architecture](product-architecture.md) records the target domain and information architecture.
