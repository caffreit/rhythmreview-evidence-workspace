CREATE TABLE `collection_members` (
	`collection_id` text NOT NULL,
	`item_id` text NOT NULL,
	`member_kind` text NOT NULL,
	PRIMARY KEY(`collection_id`, `item_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_collection_members_item` ON `collection_members` (`item_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`version` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_collections_kind` ON `collections` (`kind`);--> statement-breakpoint
CREATE TABLE `releases` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`baseline_id` text NOT NULL,
	`status` text NOT NULL,
	`code_revision` text,
	`ci_status` text,
	`approved_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_releases_baseline` ON `releases` (`baseline_id`);--> statement-breakpoint
CREATE TABLE `source_artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`latest_revision_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_source_artifacts_status` ON `source_artifacts` (`status`);--> statement-breakpoint
CREATE TABLE `source_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`source_id` text NOT NULL,
	`type` text NOT NULL,
	`level` text NOT NULL,
	`title` text NOT NULL,
	`statement` text NOT NULL,
	`rationale` text NOT NULL,
	`origin` text NOT NULL,
	`status` text NOT NULL,
	`parent_ids_json` text NOT NULL,
	`citations_json` text NOT NULL,
	`advisory_clarification_ids_json` text NOT NULL,
	`model` text NOT NULL,
	`policy_version` text NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`review_reason` text
);
--> statement-breakpoint
CREATE INDEX `idx_source_candidates_source` ON `source_candidates` (`source_id`,`type`,`status`);--> statement-breakpoint
CREATE TABLE `source_clarifications` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`source_id` text NOT NULL,
	`kind` text NOT NULL,
	`severity` text NOT NULL,
	`question` text NOT NULL,
	`rationale` text NOT NULL,
	`citations_json` text NOT NULL,
	`status` text NOT NULL,
	`answer` text,
	`decision_reason` text,
	`actor` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_source_clarifications_source` ON `source_clarifications` (`source_id`,`status`);--> statement-breakpoint
CREATE TABLE `source_processing_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`revision_id` text NOT NULL,
	`kind` text NOT NULL,
	`mode` text NOT NULL,
	`model` text NOT NULL,
	`reasoning_effort` text NOT NULL,
	`policy_version` text NOT NULL,
	`status` text NOT NULL,
	`input_json` text NOT NULL,
	`output_json` text,
	`error` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_source_runs_source` ON `source_processing_runs` (`source_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `source_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`revision` integer NOT NULL,
	`content` text NOT NULL,
	`content_hash` text NOT NULL,
	`origin` text NOT NULL,
	`captured_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_source_revisions_source` ON `source_revisions` (`source_id`,`revision`);