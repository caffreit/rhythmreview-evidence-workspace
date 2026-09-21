CREATE TABLE `document_files` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_kind` text NOT NULL,
	`owner_id` text NOT NULL,
	`format` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`sha256` text NOT NULL,
	`object_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_document_files_owner_format` ON `document_files` (`owner_kind`,`owner_id`,`format`);--> statement-breakpoint
CREATE INDEX `idx_document_files_owner` ON `document_files` (`owner_id`);--> statement-breakpoint
CREATE TABLE `document_package_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`package_id` text NOT NULL,
	`input_fingerprint` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_document_package_decisions_package` ON `document_package_decisions` (`package_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `document_package_entries` (
	`package_id` text NOT NULL,
	`template_id` text NOT NULL,
	`template_version_id` text NOT NULL,
	`snapshot_id` text NOT NULL,
	PRIMARY KEY(`package_id`, `template_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_document_package_entries_snapshot` ON `document_package_entries` (`snapshot_id`);--> statement-breakpoint
CREATE TABLE `document_package_results` (
	`package_id` text NOT NULL,
	`result_id` text NOT NULL,
	`code` text NOT NULL,
	`status` text NOT NULL,
	`subject_id` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	PRIMARY KEY(`package_id`, `result_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_document_package_results_status` ON `document_package_results` (`package_id`,`status`);--> statement-breakpoint
CREATE TABLE `document_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`baseline_id` text NOT NULL,
	`policy_id` text NOT NULL,
	`policy_version` text NOT NULL,
	`renderer_version` text NOT NULL,
	`input_fingerprint` text NOT NULL,
	`status` text NOT NULL,
	`manifest_json` text,
	`zip_file_id` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_document_packages_fingerprint` ON `document_packages` (`input_fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_document_packages_baseline` ON `document_packages` (`baseline_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `document_redlines` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`from_snapshot_id` text NOT NULL,
	`to_snapshot_id` text NOT NULL,
	`algorithm_version` text NOT NULL,
	`fingerprint` text NOT NULL,
	`changes_json` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_document_redlines_pair` ON `document_redlines` (`from_snapshot_id`,`to_snapshot_id`,`algorithm_version`);--> statement-breakpoint
CREATE TABLE `document_template_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`template_version_id` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_document_template_decisions_version` ON `document_template_decisions` (`template_version_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `document_template_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`version` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`types_json` text NOT NULL,
	`exclude_flags_json` text NOT NULL,
	`section_order_json` text NOT NULL,
	`required_in_package` integer NOT NULL,
	`status` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`submitted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_document_template_versions_number` ON `document_template_versions` (`template_id`,`version`);--> statement-breakpoint
CREATE INDEX `idx_document_template_versions_status` ON `document_template_versions` (`template_id`,`status`);--> statement-breakpoint
INSERT INTO `document_template_versions` (`id`,`template_id`,`version`,`title`,`description`,`types_json`,`exclude_flags_json`,`section_order_json`,`required_in_package`,`status`,`created_by`,`created_at`,`submitted_at`)
SELECT `version_id`,`id`,`version`,`title`,`description`,`types_json`,`exclude_flags_json`,`types_json`,1,'approved','Jamie Chen · QA reviewer','2026-08-14T10:00:00.000Z','2026-08-14T10:00:00.000Z' FROM `document_templates`;--> statement-breakpoint
CREATE TABLE `source_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`revision_id` text NOT NULL,
	`ordinal` integer NOT NULL,
	`locator` text NOT NULL,
	`text` text NOT NULL,
	`text_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_source_blocks_revision_ordinal` ON `source_blocks` (`revision_id`,`ordinal`);--> statement-breakpoint
CREATE TABLE `source_redlines` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`from_revision_id` text NOT NULL,
	`to_revision_id` text NOT NULL,
	`algorithm_version` text NOT NULL,
	`fingerprint` text NOT NULL,
	`changes_json` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_source_redlines_pair` ON `source_redlines` (`from_revision_id`,`to_revision_id`,`algorithm_version`);--> statement-breakpoint
CREATE INDEX `idx_source_redlines_source` ON `source_redlines` (`source_id`,`created_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_document_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`current_version_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`retired_by` text,
	`retired_at` text,
	`retirement_reason` text
);
--> statement-breakpoint
INSERT INTO `__new_document_templates`("id", "code", "current_version_id", "status", "retired_by", "retired_at", "retirement_reason") SELECT "id", "code", "version_id", 'active', NULL, NULL, NULL FROM `document_templates`;--> statement-breakpoint
DROP TABLE `document_templates`;--> statement-breakpoint
ALTER TABLE `__new_document_templates` RENAME TO `document_templates`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_document_templates_code` ON `document_templates` (`code`);--> statement-breakpoint
ALTER TABLE `document_snapshots` ADD `renderer_version` text DEFAULT 'document-renderer-v1' NOT NULL;--> statement-breakpoint
ALTER TABLE `document_snapshots` ADD `fingerprint` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `document_snapshots` ADD `rendered_model_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `source_revisions` ADD `filename` text;--> statement-breakpoint
ALTER TABLE `source_revisions` ADD `content_type` text;--> statement-breakpoint
ALTER TABLE `source_revisions` ADD `size` integer;--> statement-breakpoint
ALTER TABLE `source_revisions` ADD `sha256` text;--> statement-breakpoint
ALTER TABLE `source_revisions` ADD `object_key` text;--> statement-breakpoint
ALTER TABLE `source_revisions` ADD `extractor_id` text;--> statement-breakpoint
ALTER TABLE `source_revisions` ADD `extractor_version` text;--> statement-breakpoint
ALTER TABLE `source_revisions` ADD `warnings_json` text DEFAULT '[]' NOT NULL;
