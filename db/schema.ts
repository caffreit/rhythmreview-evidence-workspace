import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const baselines = sqliteTable('baselines', {
  id: text('id').primaryKey(), label: text('label').notNull(), status: text('status').notNull(),
  approvedBy: text('approved_by'), approvedAt: text('approved_at'),
});

export const evidenceItems = sqliteTable('evidence_items', {
  id: text('id').primaryKey(), type: text('type').notNull(), owner: text('owner').notNull(),
  criticality: text('criticality').notNull(), jurisdictionsJson: text('jurisdictions_json').notNull(),
  currentVersionId: text('current_version_id').notNull(),
}, (table) => [index('idx_evidence_items_type').on(table.type), index('idx_evidence_items_criticality').on(table.criticality)]);

export const evidenceVersions = sqliteTable('evidence_versions', {
  id: text('id').primaryKey(), itemId: text('item_id').notNull(), version: text('version').notNull(),
  title: text('title').notNull(), statement: text('statement').notNull(), rationale: text('rationale').notNull(),
  status: text('status').notNull(), sourcesJson: text('sources_json').notNull(), flagsJson: text('flags_json').notNull(),
  approvedBy: text('approved_by'), approvedAt: text('approved_at'),
}, (table) => [index('idx_evidence_versions_item_id').on(table.itemId)]);

export const baselineItems = sqliteTable('baseline_items', {
  baselineId: text('baseline_id').notNull(), itemId: text('item_id').notNull(), versionId: text('version_id').notNull(),
}, (table) => [primaryKey({ columns: [table.baselineId, table.itemId] }), index('idx_baseline_items_version_id').on(table.versionId)]);

export const relationships = sqliteTable('relationships', {
  id: text('id').primaryKey(), sourceId: text('source_id').notNull(), targetId: text('target_id').notNull(),
  type: text('type').notNull(), baselineId: text('baseline_id').notNull(), active: integer('active', { mode: 'boolean' }).notNull(),
}, (table) => [index('idx_relationships_source').on(table.sourceId, table.baselineId), index('idx_relationships_target').on(table.targetId, table.baselineId)]);

export const documentTemplates = sqliteTable('document_templates', {
  id: text('id').primaryKey(), code: text('code').notNull(), title: text('title').notNull(), description: text('description').notNull(),
  typesJson: text('types_json').notNull(), excludeFlagsJson: text('exclude_flags_json').notNull(),
});

export const documentSnapshots = sqliteTable('document_snapshots', {
  id: text('id').primaryKey(), documentId: text('document_id').notNull(), baselineId: text('baseline_id').notNull(),
  sourceVersionsJson: text('source_versions_json').notNull(), renderedAt: text('rendered_at').notNull(),
}, (table) => [index('idx_document_snapshots_document').on(table.documentId)]);

export const scenarios = sqliteTable('scenarios', {
  id: text('id').primaryKey(), number: text('number').notNull(), slug: text('slug').notNull(), title: text('title').notNull(),
  scale: text('scale').notNull(), anchorId: text('anchor_id').notNull(), proposedText: text('proposed_text').notNull(),
  rationale: text('rationale').notNull(), presenter: text('presenter').notNull(), nonImpactsJson: text('non_impacts_json').notNull(), draftsJson: text('drafts_json').notNull().default('[]'),
  metricsJson: text('metrics_json').notNull(),
});

export const groundTruthImpacts = sqliteTable('ground_truth_impacts', {
  scenarioId: text('scenario_id').notNull(), itemId: text('item_id').notNull(),
  critical: integer('critical', { mode: 'boolean' }).notNull(), expectedAction: text('expected_action').notNull(),
}, (table) => [primaryKey({ columns: [table.scenarioId, table.itemId] })]);

export const replayRuns = sqliteTable('replay_runs', {
  id: text('id').primaryKey(), scenarioId: text('scenario_id').notNull(), name: text('name').notNull(),
  model: text('model').notNull(), promptVersion: text('prompt_version').notNull(), outputJson: text('output_json').notNull(),
}, (table) => [index('idx_replay_runs_scenario').on(table.scenarioId)]);

export const changeRequests = sqliteTable('change_requests', {
  id: text('id').primaryKey(), scenarioId: text('scenario_id'), anchorItemId: text('anchor_item_id').notNull(),
  title: text('title').notNull(), rationale: text('rationale').notNull(), proposedText: text('proposed_text').notNull(),
  status: text('status').notNull(), createdBy: text('created_by').notNull(), createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull().default(''), revision: integer('revision').notNull().default(1),
  currentAnalysisRunId: text('current_analysis_run_id'),
}, (table) => [index('idx_change_requests_status').on(table.status),index('idx_change_requests_updated_at').on(table.updatedAt)]);

export const analysisRuns = sqliteTable('analysis_runs', {
  id: text('id').primaryKey(), changeId: text('change_id').notNull(), mode: text('mode').notNull(), model: text('model').notNull(),
  promptVersion: text('prompt_version').notNull(), status: text('status').notNull(), outputJson: text('output_json'),
  error: text('error'), previousRunId: text('previous_run_id'), priorChangeStatus: text('prior_change_status'), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_analysis_runs_change').on(table.changeId)]);

export const impactSuggestions = sqliteTable('impact_suggestions', {
  id: text('id').primaryKey(), runId: text('run_id').notNull(), targetItemId: text('target_item_id').notNull(),
  action: text('action').notNull(), origin: text('origin').notNull(), rationale: text('rationale').notNull(),
  pathJson: text('path_json').notNull(), citationsJson: text('citations_json').notNull(),
  critical: integer('critical', { mode: 'boolean' }).notNull(), decision: text('decision').notNull(),
}, (table) => [index('idx_impact_suggestions_run').on(table.runId), index('idx_impact_suggestions_target').on(table.targetItemId)]);

export const reviewDecisions = sqliteTable('review_decisions', {
  id: text('id').primaryKey(), suggestionId: text('suggestion_id').notNull(), decision: text('decision').notNull(),
  editedAction: text('edited_action'), reason: text('reason').notNull(), actor: text('actor').notNull(), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_review_decisions_suggestion').on(table.suggestionId)]);

export const proposedUpdates = sqliteTable('proposed_updates', {
  id: text('id').primaryKey(), changeId: text('change_id').notNull(), itemId: text('item_id').notNull(),
  analysisRunId:text('analysis_run_id').notNull().default(''),
  fromVersionId: text('from_version_id').notNull(), toVersion: text('to_version').notNull(),
  originalText: text('original_text').notNull().default(''), proposedText: text('proposed_text').notNull(),
  draftOrigin: text('draft_origin').notNull().default('replay_fixture'), createdBy: text('created_by').notNull().default('Alex Morgan · Author'),
  createdAt: text('created_at').notNull().default(''), editedBy: text('edited_by'), editReason: text('edit_reason'), editedAt: text('edited_at'),
  status: text('status').notNull(),
}, (table) => [index('idx_proposed_updates_change').on(table.changeId)]);

export const auditEvents = sqliteTable('audit_events', {
  id: text('id').primaryKey(), entityType: text('entity_type').notNull(), entityId: text('entity_id').notNull(),
  aggregateType: text('aggregate_type').notNull().default('change'), aggregateId: text('aggregate_id').notNull().default(''),
  action: text('action').notNull(), actor: text('actor').notNull(), detailsJson: text('details_json').notNull(),
  schemaVersion: integer('schema_version').notNull().default(1), createdAt: text('created_at').notNull(),
}, (table) => [index('idx_audit_events_entity').on(table.entityType, table.entityId),index('idx_audit_events_aggregate').on(table.aggregateType,table.aggregateId)]);

export const coherenceCheckRuns = sqliteTable('coherence_check_runs', {
  id:text('id').primaryKey(), scopeKind:text('scope_kind').notNull(), scopeId:text('scope_id').notNull(),
  baselineId:text('baseline_id').notNull(), changeId:text('change_id'), candidateRevision:integer('candidate_revision'),
  status:text('status').notNull(), actor:text('actor').notNull(), createdAt:text('created_at').notNull(),
}, (table) => [index('idx_coherence_runs_scope').on(table.scopeKind,table.scopeId,table.createdAt)]);

export const coherenceCheckResults = sqliteTable('coherence_check_results', {
  runId:text('run_id').notNull(), findingId:text('finding_id').notNull(), fingerprint:text('fingerprint').notNull(),
  itemId:text('item_id').notNull(), code:text('code').notNull(), severity:text('severity').notNull(), title:text('title').notNull(),
  detail:text('detail').notNull(), basis:text('basis').notNull(), rule:text('rule').notNull(), expected:text('expected').notNull(), actual:text('actual').notNull(),
}, (table) => [primaryKey({ columns:[table.runId,table.findingId] }),index('idx_coherence_results_fingerprint').on(table.fingerprint)]);

export const findingDispositions = sqliteTable('finding_dispositions', {
  id:text('id').primaryKey(), scopeKind:text('scope_kind').notNull(), scopeId:text('scope_id').notNull(),
  findingId:text('finding_id').notNull(), fingerprint:text('fingerprint').notNull(), action:text('action').notNull(),
  reason:text('reason').notNull(), actor:text('actor').notNull(), runId:text('run_id').notNull(), createdAt:text('created_at').notNull(),
}, (table) => [index('idx_finding_dispositions_scope').on(table.scopeKind,table.scopeId,table.findingId,table.createdAt)]);

export const embeddings = sqliteTable('embeddings', {
  itemId: text('item_id').primaryKey(), model: text('model').notNull(), vectorJson: text('vector_json').notNull(), createdAt: text('created_at').notNull(),
});
