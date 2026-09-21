# Stakeholder questions

Status: review reference

Snapshot: 18 September 2026

## Questions senior engineers and architects will ask

### What is the system of record?

There is no single system of record for every fact. D1 is the system of record for BlueBridge-controlled evidence versions, review decisions, baselines, releases, file metadata, and audit events. R2 holds immutable bytes addressed by D1 records. Imported source revisions remain attributed to their origin. Planned Git and Jira connectors preserve those systems' authority for code and work state. The current CI path imports and verifies a downloaded bundle; it is not a live connector.

### What makes a baseline immutable?

`baseline_items` freezes one `version_id` per evidence item. Relationships also carry a `baseline_id`. Approval creates a new baseline instead of editing membership in the active baseline. The application does not update approved evidence statements.

This is an application invariant, not a database guarantee. The schema has no triggers or foreign keys that forbid an accidental update. Production needs database constraints, restricted write paths, and immutability tests.

### Which value is authoritative: `evidence_items.current_version_id` or `baseline_items.version_id`?

Use `baseline_items.version_id` when reading a named baseline. `current_version_id` is a convenience pointer for the current item state. Historical rendering joins through baseline membership, not the convenience pointer.

### Why combine a graph, embeddings, and an LLM?

Each answers a different question. Graph traversal finds known trace neighbors. Embeddings find textually related records that the graph may miss. The model assigns a controlled action and rationale to the bounded candidate set. Collections add context without pretending that every member has a direct relationship.

The combination improves recall without giving the model an unbounded database query or authority to create trace links.

### Can the model invent an evidence ID or skip a difficult candidate?

Not in an accepted response. The server builds a per-candidate Zod schema with literal target IDs and type-specific actions. It also checks that every bounded candidate appears exactly once, every citation stays in the set, and each citation list includes its target. A violation fails the run and creates no suggestions.

### How are prompts versioned?

The source policies have stable names in `lib/source-analysis-policies.ts`. Impact analysis records `impact-v6`. Every processing run stores its policy or prompt version and model. The prompt text is code, not a database-managed configuration object.

The current repository does not hash the prompt text or store the exact rendered prompt with change-first runs. Source runs store structured input and output. Production provenance should store a prompt artifact digest, output-schema digest, retrieval configuration, and deployment version.

### What data leaves the application?

Live source actions send the selected source revision, relevant clarification records, and approved needs to OpenRouter. Live impact sends the proposed change and bounded evidence candidates. Embedding calls send current evidence title, statement, and rationale, plus the change query. The code sets `store: false` for Responses calls.

The prototype permits fictional data only. It has no data-classification gate, redaction service, regional routing control, or provider-contract enforcement.

### What happens when OpenRouter is down?

Transient failures get one retry. A failed source run records the failure and inserts no AI-derived records. A failed change reanalysis restores the prior workflow state and successful run. Replay never starts automatically; the user must choose it.

### Is replay a model evaluation result?

No. Replay is a saved fixture for demonstrating workflow. Its suggestions were created from the same provisional answer key used to score them, so a fully accepted replay reaches 100 percent by construction. Only separately recorded live runs can contribute model evidence, and the current evaluation remains prototype-only.

### Are change commands concurrency-safe?

Partly. Several updates include the expected current status and current run in their `WHERE` clause, which blocks some stale commands. Candidate coherence also records a revision number. There is no complete optimistic-lock contract across all aggregates, and multi-stage baseline writes are not one explicit transaction.

Before multi-user use, add a version to every mutable aggregate, require that version on commands, run approvals atomically, and define conflict recovery.

### Why use D1 and prepared SQL instead of Drizzle queries?

D1 matches the hosting target and keeps the prototype deployment compact. Drizzle owns schema generation, while direct prepared SQL gives explicit control over D1 batches and result shapes.

The split has a maintenance cost. Schema types do not flow into query results, and repository code duplicates column names and mappings. A production refactor should either use Drizzle consistently or generate typed query boundaries from the schema.

### Will semantic retrieval scale?

Not as written. The current service loads cached vectors from D1, computes cosine similarity in the Worker, and scans the eligible evidence set. That is reasonable for 72 seed items. A larger product portfolio needs a vector index, tenant and baseline filters, deterministic tie rules, and measured retrieval recall.

### How are embedding updates invalidated?

The cache key combines evidence `version_id` and embedding model. A new evidence version or a model change creates a new cache entry. Old vectors remain for historical provenance. There is no retention or storage-cost policy yet.

### Are the coherence checks all deterministic?

No. Four rule families are deterministic in code. Three findings are labelled `evaluation_fixture` and were authored to exercise timing, claim-strength, and review-date behavior. The UI and data model keep those bases separate.

### Do coherence findings block approval?

They do not block baseline approval. They do block later release states. `release-readiness-v1` blocks relationship-policy failures, high traceability gaps, and missing or unacceptable verification evidence. `final-release-v1` also blocks current high coherence findings and stale controlling records. Medium findings remain warnings.

### What is the API style?

The application uses resource reads and command-style POST endpoints under `app/api`. The local worktree has 70 route handlers. Examples include `changes/{id}/analyse`, `source-baselines/approve`, `releases/{id}/final-readiness`, `document-snapshots`, and `document-packages/{id}/decision`. Zod validates command bodies. There is no published OpenAPI contract, general pagination standard, idempotency-key contract, or external API version.

### Where do imported and generated files live?

D1 stores ownership, filename, media type, size, SHA-256, object key, and control history. R2 stores the bytes. Generated object keys do not contain the uploaded filename. Source files, release attachments, document snapshots, redlines, and ZIP packages share the `RELEASE_FILES` bucket but use separate key prefixes.

The split is deliberate, but it is not transactional. The code removes newly written R2 objects when a later D1 batch fails and removes known objects during reset. Production still needs reconciliation, retention, backup, malware scanning, and an operator-visible recovery path.

### Does PDF or DOCX extraction preserve the original document?

Yes. R2 retains the original bytes and D1 retains their SHA-256. `unpdf` extracts text-native PDF pages. Mammoth extracts raw DOCX text without storing generated HTML. BlueBridge normalizes the result into page- or paragraph-anchored blocks and records the extractor version and warnings.

The local implementation rejects empty, oversized, corrupt, encrypted, image-only, macro-enabled, or mismatched files. It does not perform OCR or preserve visual layout as structured evidence. Reviewers can download the original file when layout matters.

### What makes a document package current?

`document-package-v1` fingerprints the baseline, required approved template versions, renderer version, and package policy. The package stores exact snapshot membership and a manifest of source evidence versions and file hashes. QA can decide only the latest passing fingerprint. BlueBridge withholds the ZIP until acceptance.

The package is a controlled projection. It does not become the authoritative source for requirements, risk controls, or tests.

### What should be split first?

Split command orchestration from SQL queries before adding connectors. The next useful boundaries are an authorization service, a normalized proposal and decision model shared by both workflows, a provider interface with immutable run artifacts, and a transaction-backed baseline service.

## Questions PMs and product owners will ask

### What user problem does the prototype test?

It tests whether linked evidence, deterministic rules, and bounded AI suggestions help QA or regulatory reviewers find the full effect of a SaMD change and approve a coherent new product-evidence state with less manual searching.

### Who is the first user?

The primary reviewer is QA or RA. Product and engineering authors supply source material, propose changes, answer context questions, and prepare candidate updates. The reviewer decides generated candidates, impact scope, waivers, and baseline approval.

### What is the smallest complete product loop?

Import one source revision, resolve material questions, review generated user needs, derive and review requirements, assess impact, and approve a new immutable baseline. From that baseline, the pushed prototype supports verification readiness, residual-risk review, imported CI evidence, and fictional final release approval. The local WP-30 path also renders controlled PDF and DOCX outputs and creates a QA-reviewed ZIP package.

### What does the product automate?

It automates candidate discovery, structured drafting of needs and requirements, impact classification, provenance checks, consistency checks, release-policy evaluation, document extraction, deterministic redlines, output rendering, and package assembly. It does not automate controlled approval.

### What is the product bet?

The bet is that teams do not need another chat window. They need a reviewed product model where every suggestion has bounded inputs, provenance, a decision owner, and a place in an immutable baseline.

### How is this different from a document generator?

Documents are views over controlled objects and exact baseline versions. A document is not the primary state. The product first controls needs, requirements, relationships, decisions, and baselines. It then renders documents from that state.

### How is this different from Infera or Ketryx?

The prototype is far narrower than either commercial platform. Its intended product distinction is the explicit authority boundary: external systems retain their facts, semantic matches remain unconfirmed, AI output stays a proposal, and baseline and release approval stay separate.

Public marketing pages do not reveal every internal authority rule in Infera or Ketryx. Treat the comparison as a product-design hypothesis to test in customer discovery, not a settled competitive claim. See [The BlueBridge authority model](authority-model.md).

### What has the prototype proved?

The pushed code proves that the core record types and human review loop can work together through fictional final release approval. It includes controlled relationships, verification readiness, append-only residual-risk decisions, hashed attachments, verified CI-bundle import, two simulated attestations, and a frozen final state.

The local worktree also proves unit-level PDF and DOCX extraction, anchored citations, deterministic source and output redlines, governed template versions, rendered PDF and DOCX snapshots, package fingerprints, ZIP manifests, and QA package decisions. That WP-30 path has not yet been committed, pushed, or accepted as a work package.

It does not prove production compliance, customer value, operational scale, model generalization, identity assurance, or integration reliability.

### How should success be measured?

Use separate product and model measures.

Product measures include reviewer time, decision completion rate, returned work, provenance opening rate, unresolved blocker age, and release preparation time. Model measures include critical-impact recall, overall recall, actionable precision, unsupported-claim rate, citation validity, structural failure rate, and the number of human action corrections.

Never use acceptance rate alone. Reviewers may accept weak suggestions to clear a queue, and a conservative model may have a low acceptance rate while catching a critical omission.

### Why optimize critical-impact recall first?

A missed high-criticality impact can leave a risk, control, claim, or verification activity outside review. False positives cost reviewer time, but a critical false negative can undermine the evidence state. The current evaluation gate therefore requires 100 percent critical recall before adding more automation.

### What is the riskiest product assumption?

The riskiest assumption is that a team will maintain a controlled evidence graph detailed enough to support useful impact analysis without feeling that BlueBridge duplicates existing work. Connectors and authority-aware drift handling must reduce that burden. Otherwise the graph will decay.

### What should remain out of scope next?

Do not add autonomous approvals, OCR, broad submission publishing, or many shallow connectors while WP-30 remains unaccepted. Finish its migration, end-to-end, browser, and recovery evidence first. WP-40 should then prove convergent observations and drift handling before any production connector work.

### What is the roadmap order?

The current delivery plan orders work as follows:

1. WP-00, WP-10, and WP-20 are accepted.
2. Finish and accept WP-30 document inputs, redlines, controlled outputs, and package checks.
3. Add WP-40 fixture-backed work and implementation observations.
4. Add WP-50 identity, permissions, durable jobs, concurrency, retention, monitoring, and cost controls.
5. Add WP-60 real integrations and complete the applicable validation and quality procedures.

### What should a customer never misunderstand?

They must not mistake an AI suggestion for an approved trace link, a passing check for approval, a baseline for a shipped release, a replay fixture for live AI, or a simulated role for an electronic signature.

## Questions QA and RA leaders will ask

### Who can approve what?

The prototype requires the simulated QA reviewer for candidate decisions, impact decisions, relationship decisions, finding waivers, baseline approval, verification evidence, residual risks, CI evidence, template versions, and document packages. The author creates changes, processes sources, resolves clarifications, edits candidates, records executions, imports files, and builds packages. The simulated release approver is the only actor who can approve a fresh `final-release-v1` run. The server prevents the change author from approving the same change baseline.

These are workflow checks on actor strings. They are not authenticated permissions.

### Can an approval cascade through a hierarchy?

No. A user need, requirement, child requirement, relationship, change, coherence result, baseline, and release are distinct control objects. Each requires the review defined for that object. The hierarchy check flags a changed parent whose refining child has not been reviewed in the candidate state.

### Are audit records editable?

The application only appends audit events and review decisions. It does not expose an update or delete command for them. Database administrators and direct database access are outside the prototype's control model, so the current implementation cannot claim tamper evidence.

### How does a waiver survive a rerun?

A waiver binds to the finding ID and a fingerprint of the rule, item, basis, expected value, and actual value. The waiver carries forward only when the exact condition recurs. A changed actual value creates a different fingerprint and requires a new decision.

### Is the prompt evaluation validation evidence?

No. It is internal prototype evidence against fictional data and a provisional answer key. Production use needs independently authored and reviewed ground truth, representative datasets, defined intended use for each model action, change control, monitoring, and validation under the applicable quality system.

### Which compliance capabilities are absent?

The prototype has no verified identity, electronic signature, training control, records-retention policy, legal hold, supplier controls, validated infrastructure, access review, incident process, live work-system connector, or validated submission package. The local document ZIP is a controlled prototype package, not a regulatory submission. BlueBridge must not be presented as an eQMS or as meeting a regulation by itself.
