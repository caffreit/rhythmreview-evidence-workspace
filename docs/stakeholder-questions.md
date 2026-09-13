# Stakeholder questions

Status: review reference

Snapshot: 13 September 2026

## Questions senior engineers and architects will ask

### What is the system of record?

There is no single system of record for every fact. D1 is the system of record for BlueBridge-controlled evidence versions, review decisions, baselines, releases, and audit events. Imported source revisions remain attributed to their origin. Planned Git, Jira, and CI connectors preserve those systems' authority for code, work state, and executions.

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

No. The prototype lets a reviewer run, inspect, and waive candidate findings, but the approval endpoint does not require a current run or a clear or waived disposition. Enforced release gates are planned after the relationship policy, risk, and verification model exist.

### What is the API style?

The application uses resource reads and command-style POST endpoints under `app/api`. Examples include `changes/{id}/analyse`, `changes/{id}/submit`, and `source-baselines/approve`. Zod validates command bodies. There is no published OpenAPI contract, pagination standard beyond recent changes, idempotency key, or external API version.

### What should be split first?

Split command orchestration from SQL queries before adding connectors. The next useful boundaries are an authorization service, a normalized proposal and decision model shared by both workflows, a provider interface with immutable run artifacts, and a transaction-backed baseline service.

## Questions PMs and product owners will ask

### What user problem does the prototype test?

It tests whether linked evidence, deterministic rules, and bounded AI suggestions help QA or regulatory reviewers find the full effect of a SaMD change and approve a coherent new product-evidence state with less manual searching.

### Who is the first user?

The primary reviewer is QA or RA. Product and engineering authors supply source material, propose changes, answer context questions, and prepare candidate updates. The reviewer decides generated candidates, impact scope, waivers, and baseline approval.

### What is the smallest complete product loop?

Import one source revision, resolve material questions, review generated user needs, derive and review requirements, assess impact on the existing baseline, and approve a new immutable baseline. The source-first prototype completes that loop and creates a planned release record.

### What does the product automate?

It automates candidate discovery, structured drafting of needs and requirements, impact classification, provenance checks, consistency checks, and assembly of a candidate baseline. It does not automate controlled approval.

### What is the product bet?

The bet is that teams do not need another chat window. They need a reviewed product model where every suggestion has bounded inputs, provenance, a decision owner, and a place in an immutable baseline.

### How is this different from a document generator?

Documents are views over controlled objects and exact baseline versions. A document is not the primary state. The product first controls needs, requirements, relationships, decisions, and baselines. It then renders documents from that state.

### How is this different from Infera or Ketryx?

The prototype is far narrower than either commercial platform. Its intended product distinction is the explicit authority boundary: external systems retain their facts, semantic matches remain unconfirmed, AI output stays a proposal, and baseline and release approval stay separate.

Public marketing pages do not reveal every internal authority rule in Infera or Ketryx. Treat the comparison as a product-design hypothesis to test in customer discovery, not a settled competitive claim. See [The BlueBridge authority model](authority-model.md).

### What has the prototype proved?

It proves that the core record types and human review loop can work together. It also proves strict structured model output, exact citation checks, explicit live failure, replay separation, audit capture, baseline versioning, and a live fictional source-to-baseline run.

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

Do not add autonomous approvals, broad document generation, or many shallow connectors before the relationship policy and trace editor work. The next package should make link semantics, gaps, and baseline-aware traceability trustworthy. Risk, verification, and release gates depend on that base.

### What is the roadmap order?

The current delivery plan orders work as follows:

1. Ratify relationship semantics and implement controlled traceability.
2. Add structured risk, verification, and release readiness.
3. Add document inputs, redlines, controlled outputs, and package checks.
4. Add fixture-backed work and implementation observations.
5. Add identity, permissions, durable jobs, concurrency, retention, monitoring, and cost controls.
6. Add real integrations and complete the applicable validation and quality procedures.

### What should a customer never misunderstand?

They must not mistake an AI suggestion for an approved trace link, a passing check for approval, a baseline for a shipped release, a replay fixture for live AI, or a simulated role for an electronic signature.

## Questions QA and RA leaders will ask

### Who can approve what?

The prototype requires the simulated QA reviewer for candidate decisions, impact decisions, finding waivers, and baseline approval. The author creates changes, processes sources, resolves clarifications, and edits candidates. The server prevents the change author from approving the same change baseline.

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

The prototype has no verified identity, electronic signature, training control, records-retention policy, legal hold, supplier controls, validated infrastructure, access review, incident process, submission package, or production connector controls. It must not be presented as an eQMS or as meeting a regulation by itself.
