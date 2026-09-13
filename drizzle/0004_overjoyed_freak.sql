PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_embeddings` (
	`item_id` text NOT NULL,
	`version_id` text NOT NULL,
	`model` text NOT NULL,
	`vector_json` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`version_id`, `model`)
);
--> statement-breakpoint
INSERT INTO `__new_embeddings`("item_id", "version_id", "model", "vector_json", "created_at") SELECT e."item_id", i."current_version_id", e."model", e."vector_json", e."created_at" FROM `embeddings` e JOIN `evidence_items` i ON i."id"=e."item_id";--> statement-breakpoint
DROP TABLE `embeddings`;--> statement-breakpoint
ALTER TABLE `__new_embeddings` RENAME TO `embeddings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_embeddings_item` ON `embeddings` (`item_id`);--> statement-breakpoint
CREATE TABLE `__new_source_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`source_id` text NOT NULL,
	`type` text NOT NULL,
	`level` text,
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
INSERT INTO `__new_source_candidates`("id", "run_id", "source_id", "type", "level", "title", "statement", "rationale", "origin", "status", "parent_ids_json", "citations_json", "advisory_clarification_ids_json", "model", "policy_version", "reviewed_by", "reviewed_at", "review_reason") SELECT "id", "run_id", "source_id", "type", "level", "title", "statement", "rationale", "origin", "status", "parent_ids_json", "citations_json", "advisory_clarification_ids_json", "model", "policy_version", "reviewed_by", "reviewed_at", "review_reason" FROM `source_candidates`;--> statement-breakpoint
DROP TABLE `source_candidates`;--> statement-breakpoint
ALTER TABLE `__new_source_candidates` RENAME TO `source_candidates`;--> statement-breakpoint
CREATE INDEX `idx_source_candidates_source` ON `source_candidates` (`source_id`,`type`,`status`);--> statement-breakpoint
ALTER TABLE `analysis_runs` ADD `provider_request_id` text;--> statement-breakpoint
ALTER TABLE `analysis_runs` ADD `duration_ms` integer;--> statement-breakpoint
ALTER TABLE `analysis_runs` ADD `attempt_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `analysis_runs` ADD `input_tokens` integer;--> statement-breakpoint
ALTER TABLE `analysis_runs` ADD `output_tokens` integer;--> statement-breakpoint
ALTER TABLE `analysis_runs` ADD `embedding_tokens` integer;--> statement-breakpoint
ALTER TABLE `impact_suggestions` ADD `category` text DEFAULT 'functional_overlap' NOT NULL;--> statement-breakpoint
ALTER TABLE `source_processing_runs` ADD `provider_request_id` text;--> statement-breakpoint
ALTER TABLE `source_processing_runs` ADD `duration_ms` integer;--> statement-breakpoint
ALTER TABLE `source_processing_runs` ADD `attempt_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `source_processing_runs` ADD `input_tokens` integer;--> statement-breakpoint
ALTER TABLE `source_processing_runs` ADD `output_tokens` integer;--> statement-breakpoint
ALTER TABLE `source_processing_runs` ADD `embedding_tokens` integer;--> statement-breakpoint
UPDATE `source_processing_runs` SET `reasoning_effort`='not_run' WHERE `reasoning_effort`='not-run';--> statement-breakpoint
UPDATE `source_candidates` SET `level`=NULL,`parent_ids_json`='[]' WHERE `type`='user_need';--> statement-breakpoint
UPDATE `source_clarifications` SET `citations_json`=(SELECT json_group_array(json_object('kind','source_span','sourceRevisionId',json_extract(value,'$.sourceRevisionId'),'quote',json_extract(value,'$.quote'))) FROM json_each(`source_clarifications`.`citations_json`)) WHERE json_extract(`citations_json`,'$[0].kind') IS NULL;--> statement-breakpoint
UPDATE `source_candidates` SET `citations_json`=(SELECT json_group_array(json_object('kind','source_span','sourceRevisionId',json_extract(value,'$.sourceRevisionId'),'quote',json_extract(value,'$.quote'))) FROM json_each(`source_candidates`.`citations_json`)) WHERE json_extract(`citations_json`,'$[0].kind') IS NULL;
