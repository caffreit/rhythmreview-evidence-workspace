CREATE TABLE `ci_evidence_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`ci_evidence_id` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ci_evidence_decisions_record` ON `ci_evidence_decisions` (`ci_evidence_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `ci_evidence_records` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`manifest_attachment_id` text NOT NULL,
	`manifest_json` text NOT NULL,
	`commit_sha` text NOT NULL,
	`conclusion` text NOT NULL,
	`validation_status` text NOT NULL,
	`validation_error` text,
	`supersedes_ci_evidence_id` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ci_evidence_release` ON `ci_evidence_records` (`release_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `final_readiness_results` (
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
CREATE INDEX `idx_final_readiness_results_run` ON `final_readiness_results` (`run_id`,`status`);--> statement-breakpoint
CREATE TABLE `final_readiness_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`policy_id` text NOT NULL,
	`policy_version` text NOT NULL,
	`input_fingerprint` text NOT NULL,
	`status` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_final_readiness_runs_release` ON `final_readiness_runs` (`release_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `prototype_attestations` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`kind` text NOT NULL,
	`statement_version` text NOT NULL,
	`statement` text NOT NULL,
	`actor` text NOT NULL,
	`role` text NOT NULL,
	`reason` text NOT NULL,
	`input_fingerprint` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_prototype_attestations_release` ON `prototype_attestations` (`release_id`,`kind`,`created_at`);--> statement-breakpoint
CREATE TABLE `release_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`category` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`sha256` text NOT NULL,
	`object_key` text NOT NULL,
	`supersedes_attachment_id` text,
	`ci_evidence_id` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_release_attachments_release` ON `release_attachments` (`release_id`,`category`,`created_at`);--> statement-breakpoint
CREATE TABLE `residual_risk_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`hazard_item_id` text NOT NULL,
	`hazard_version_id` text NOT NULL,
	`revision` integer NOT NULL,
	`classification` text NOT NULL,
	`rationale` text NOT NULL,
	`benefit_risk_conclusion` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_residual_risks_release_hazard` ON `residual_risk_assessments` (`release_id`,`hazard_item_id`,`revision`);--> statement-breakpoint
CREATE TABLE `residual_risk_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_residual_risk_decisions_assessment` ON `residual_risk_decisions` (`assessment_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `releases` ADD `final_readiness_run_id` text;--> statement-breakpoint
ALTER TABLE `releases` ADD `release_approved_by` text;--> statement-breakpoint
ALTER TABLE `releases` ADD `release_approved_at` text;