CREATE TABLE `analysis_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`change_id` text NOT NULL,
	`mode` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`status` text NOT NULL,
	`output_json` text,
	`error` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_analysis_runs_change` ON `analysis_runs` (`change_id`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`details_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_events_entity` ON `audit_events` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `baseline_items` (
	`baseline_id` text NOT NULL,
	`item_id` text NOT NULL,
	`version_id` text NOT NULL,
	PRIMARY KEY(`baseline_id`, `item_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_baseline_items_version_id` ON `baseline_items` (`version_id`);--> statement-breakpoint
CREATE TABLE `baselines` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`status` text NOT NULL,
	`approved_by` text,
	`approved_at` text
);
--> statement-breakpoint
CREATE TABLE `change_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`scenario_id` text,
	`anchor_item_id` text NOT NULL,
	`title` text NOT NULL,
	`rationale` text NOT NULL,
	`proposed_text` text NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_change_requests_status` ON `change_requests` (`status`);--> statement-breakpoint
CREATE TABLE `document_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`baseline_id` text NOT NULL,
	`source_versions_json` text NOT NULL,
	`rendered_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_document_snapshots_document` ON `document_snapshots` (`document_id`);--> statement-breakpoint
CREATE TABLE `document_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`types_json` text NOT NULL,
	`exclude_flags_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `embeddings` (
	`item_id` text PRIMARY KEY NOT NULL,
	`model` text NOT NULL,
	`vector_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evidence_items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`owner` text NOT NULL,
	`criticality` text NOT NULL,
	`jurisdictions_json` text NOT NULL,
	`current_version_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_evidence_items_type` ON `evidence_items` (`type`);--> statement-breakpoint
CREATE INDEX `idx_evidence_items_criticality` ON `evidence_items` (`criticality`);--> statement-breakpoint
CREATE TABLE `evidence_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`version` text NOT NULL,
	`title` text NOT NULL,
	`statement` text NOT NULL,
	`rationale` text NOT NULL,
	`status` text NOT NULL,
	`sources_json` text NOT NULL,
	`flags_json` text NOT NULL,
	`approved_by` text,
	`approved_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_evidence_versions_item_id` ON `evidence_versions` (`item_id`);--> statement-breakpoint
CREATE TABLE `ground_truth_impacts` (
	`scenario_id` text NOT NULL,
	`item_id` text NOT NULL,
	`critical` integer NOT NULL,
	`expected_action` text NOT NULL,
	PRIMARY KEY(`scenario_id`, `item_id`)
);
--> statement-breakpoint
CREATE TABLE `impact_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`target_item_id` text NOT NULL,
	`action` text NOT NULL,
	`origin` text NOT NULL,
	`rationale` text NOT NULL,
	`path_json` text NOT NULL,
	`citations_json` text NOT NULL,
	`critical` integer NOT NULL,
	`decision` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_impact_suggestions_run` ON `impact_suggestions` (`run_id`);--> statement-breakpoint
CREATE INDEX `idx_impact_suggestions_target` ON `impact_suggestions` (`target_item_id`);--> statement-breakpoint
CREATE TABLE `proposed_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`change_id` text NOT NULL,
	`item_id` text NOT NULL,
	`from_version_id` text NOT NULL,
	`to_version` text NOT NULL,
	`proposed_text` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_proposed_updates_change` ON `proposed_updates` (`change_id`);--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`target_id` text NOT NULL,
	`type` text NOT NULL,
	`baseline_id` text NOT NULL,
	`active` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_relationships_source` ON `relationships` (`source_id`,`baseline_id`);--> statement-breakpoint
CREATE INDEX `idx_relationships_target` ON `relationships` (`target_id`,`baseline_id`);--> statement-breakpoint
CREATE TABLE `replay_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`scenario_id` text NOT NULL,
	`name` text NOT NULL,
	`model` text NOT NULL,
	`prompt_version` text NOT NULL,
	`output_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_replay_runs_scenario` ON `replay_runs` (`scenario_id`);--> statement-breakpoint
CREATE TABLE `review_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`suggestion_id` text NOT NULL,
	`decision` text NOT NULL,
	`edited_action` text,
	`reason` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_review_decisions_suggestion` ON `review_decisions` (`suggestion_id`);--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`scale` text NOT NULL,
	`anchor_id` text NOT NULL,
	`proposed_text` text NOT NULL,
	`rationale` text NOT NULL,
	`presenter` text NOT NULL,
	`non_impacts_json` text NOT NULL,
	`metrics_json` text NOT NULL
);
