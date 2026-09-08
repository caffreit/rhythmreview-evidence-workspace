CREATE TABLE `coherence_check_results` (
	`run_id` text NOT NULL,
	`finding_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`item_id` text NOT NULL,
	`code` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`basis` text NOT NULL,
	`rule` text NOT NULL,
	`expected` text NOT NULL,
	`actual` text NOT NULL,
	PRIMARY KEY(`run_id`, `finding_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_coherence_results_fingerprint` ON `coherence_check_results` (`fingerprint`);--> statement-breakpoint
CREATE TABLE `coherence_check_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`scope_kind` text NOT NULL,
	`scope_id` text NOT NULL,
	`baseline_id` text NOT NULL,
	`change_id` text,
	`candidate_revision` integer,
	`status` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_coherence_runs_scope` ON `coherence_check_runs` (`scope_kind`,`scope_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `finding_dispositions` (
	`id` text PRIMARY KEY NOT NULL,
	`scope_kind` text NOT NULL,
	`scope_id` text NOT NULL,
	`finding_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`action` text NOT NULL,
	`reason` text NOT NULL,
	`actor` text NOT NULL,
	`run_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_finding_dispositions_scope` ON `finding_dispositions` (`scope_kind`,`scope_id`,`finding_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `analysis_runs` ADD `previous_run_id` text;--> statement-breakpoint
ALTER TABLE `analysis_runs` ADD `prior_change_status` text;--> statement-breakpoint
ALTER TABLE `audit_events` ADD `aggregate_type` text DEFAULT 'change' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_events` ADD `aggregate_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_events` ADD `schema_version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_audit_events_aggregate` ON `audit_events` (`aggregate_type`,`aggregate_id`);--> statement-breakpoint
ALTER TABLE `change_requests` ADD `updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `change_requests` ADD `revision` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `change_requests` ADD `current_analysis_run_id` text;--> statement-breakpoint
CREATE INDEX `idx_change_requests_updated_at` ON `change_requests` (`updated_at`);--> statement-breakpoint
ALTER TABLE `proposed_updates` ADD `analysis_run_id` text DEFAULT '' NOT NULL;