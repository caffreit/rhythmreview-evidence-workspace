CREATE TABLE `release_readiness_results` (
	`run_id` text NOT NULL,
	`result_id` text NOT NULL,
	`code` text NOT NULL,
	`severity` text NOT NULL,
	`status` text NOT NULL,
	`subject_id` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	PRIMARY KEY(`run_id`, `result_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_release_readiness_results_run` ON `release_readiness_results` (`run_id`,`status`);--> statement-breakpoint
CREATE TABLE `release_readiness_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`baseline_id` text NOT NULL,
	`policy_id` text NOT NULL,
	`policy_version` text NOT NULL,
	`input_fingerprint` text NOT NULL,
	`status` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_release_readiness_runs_release` ON `release_readiness_runs` (`release_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `verification_execution_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`execution_id` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_verification_execution_decisions_execution` ON `verification_execution_decisions` (`execution_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `verification_executions` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`baseline_id` text NOT NULL,
	`test_item_id` text NOT NULL,
	`test_version_id` text NOT NULL,
	`outcome` text NOT NULL,
	`environment` text NOT NULL,
	`build_id` text NOT NULL,
	`observed_result` text NOT NULL,
	`executed_at` text NOT NULL,
	`evidence_reference` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_verification_executions_release` ON `verification_executions` (`release_id`,`test_item_id`,`executed_at`);--> statement-breakpoint
CREATE TABLE `verification_plan_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`change_id` text NOT NULL,
	`proposed_item_id` text NOT NULL,
	`target_risk_control_id` text NOT NULL,
	`relationship_proposal_id` text NOT NULL,
	`title` text NOT NULL,
	`objective` text NOT NULL,
	`method` text NOT NULL,
	`acceptance_criteria` text NOT NULL,
	`rationale` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_by` text,
	`update_reason` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_verification_plan_candidates_change` ON `verification_plan_candidates` (`change_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_verification_plan_candidates_item` ON `verification_plan_candidates` (`proposed_item_id`);--> statement-breakpoint
CREATE TABLE `verification_plan_versions` (
	`evidence_version_id` text PRIMARY KEY NOT NULL,
	`test_item_id` text NOT NULL,
	`objective` text NOT NULL,
	`method` text NOT NULL,
	`acceptance_criteria` text NOT NULL,
	`target_risk_control_id` text NOT NULL,
	`approved_by` text NOT NULL,
	`approved_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_verification_plan_versions_item` ON `verification_plan_versions` (`test_item_id`);--> statement-breakpoint
CREATE INDEX `idx_verification_plan_versions_control` ON `verification_plan_versions` (`target_risk_control_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`baseline_id` text NOT NULL,
	`status` text NOT NULL,
	`code_revision` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`readiness_run_id` text,
	`verification_ready_by` text,
	`verification_ready_at` text
);
--> statement-breakpoint
INSERT INTO `__new_releases`("id", "label", "baseline_id", "status", "code_revision", "created_by", "created_at", "readiness_run_id", "verification_ready_by", "verification_ready_at") SELECT "id", "label", "baseline_id", "status", coalesce("code_revision",'unrecorded legacy reference'), "approved_by", "created_at", NULL, NULL, NULL FROM `releases`;--> statement-breakpoint
DROP TABLE `releases`;--> statement-breakpoint
ALTER TABLE `__new_releases` RENAME TO `releases`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_releases_baseline` ON `releases` (`baseline_id`);
