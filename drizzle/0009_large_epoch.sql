ALTER TABLE `document_snapshots` ADD `template_version_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `document_templates` ADD `version_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `document_templates` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `document_templates` ADD `status` text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
UPDATE `document_templates` SET `version_id`='DTV-' || `id` || '-1' WHERE `version_id`='';--> statement-breakpoint
UPDATE `document_snapshots` SET `template_version_id`='DTV-' || `document_id` || '-1' WHERE `template_version_id`='';
