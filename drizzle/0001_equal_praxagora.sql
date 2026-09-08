ALTER TABLE `proposed_updates` ADD `original_text` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposed_updates` ADD `draft_origin` text DEFAULT 'replay_fixture' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposed_updates` ADD `created_by` text DEFAULT 'Alex Morgan · Author' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposed_updates` ADD `created_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `proposed_updates` ADD `edited_by` text;--> statement-breakpoint
ALTER TABLE `proposed_updates` ADD `edit_reason` text;--> statement-breakpoint
ALTER TABLE `proposed_updates` ADD `edited_at` text;--> statement-breakpoint
ALTER TABLE `scenarios` ADD `drafts_json` text DEFAULT '[]' NOT NULL;