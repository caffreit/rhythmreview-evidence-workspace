CREATE TABLE `relationship_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`change_id` text NOT NULL,
	`analysis_run_id` text,
	`base_baseline_id` text NOT NULL,
	`operation` text NOT NULL,
	`base_relationship_id` text,
	`source_id` text NOT NULL,
	`target_id` text NOT NULL,
	`source_version_id` text NOT NULL,
	`target_version_id` text NOT NULL,
	`base_type` text,
	`proposed_type` text,
	`revision` integer DEFAULT 1 NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`rationale` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_by` text,
	`update_reason` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_relationship_proposals_change` ON `relationship_proposals` (`change_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_relationship_proposals_base` ON `relationship_proposals` (`base_relationship_id`);--> statement-breakpoint
CREATE TABLE `relationship_review_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`proposal_revision` integer NOT NULL,
	`decision` text NOT NULL,
	`edited_type` text,
	`reason` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_relationship_review_decisions_proposal` ON `relationship_review_decisions` (`proposal_id`,`proposal_revision`,`created_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_change_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`scenario_id` text,
	`anchor_item_id` text NOT NULL,
	`subject_kind` text DEFAULT 'evidence' NOT NULL,
	`base_baseline_id` text DEFAULT 'BL-RR-1.0' NOT NULL,
	`title` text NOT NULL,
	`rationale` text NOT NULL,
	`proposed_text` text,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`current_analysis_run_id` text
);
--> statement-breakpoint
INSERT INTO `__new_change_requests`("id", "scenario_id", "anchor_item_id", "subject_kind", "base_baseline_id", "title", "rationale", "proposed_text", "status", "created_by", "created_at", "updated_at", "revision", "current_analysis_run_id") SELECT "id", "scenario_id", "anchor_item_id", 'evidence', 'BL-RR-1.0', "title", "rationale", "proposed_text", "status", "created_by", "created_at", "updated_at", "revision", "current_analysis_run_id" FROM `change_requests`;--> statement-breakpoint
DROP TABLE `change_requests`;--> statement-breakpoint
ALTER TABLE `__new_change_requests` RENAME TO `change_requests`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_change_requests_status` ON `change_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_change_requests_updated_at` ON `change_requests` (`updated_at`);--> statement-breakpoint
ALTER TABLE `relationships` ADD `policy_id` text DEFAULT 'relationship-policy-v1.0' NOT NULL;--> statement-breakpoint
ALTER TABLE `relationships` ADD `policy_version` text DEFAULT '1.0' NOT NULL;--> statement-breakpoint
ALTER TABLE `relationships` ADD `rationale` text DEFAULT 'Legacy prototype relationship.' NOT NULL;--> statement-breakpoint
ALTER TABLE `relationships` ADD `origin` text DEFAULT 'legacy_fixture' NOT NULL;--> statement-breakpoint
ALTER TABLE `relationships` ADD `predecessor_relationship_id` text;--> statement-breakpoint
ALTER TABLE `relationships` ADD `approved_by` text;--> statement-breakpoint
ALTER TABLE `relationships` ADD `approved_at` text;--> statement-breakpoint
CREATE INDEX `idx_relationships_baseline_type` ON `relationships` (`baseline_id`,`type`);
