CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`dept` text NOT NULL,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cross_dept_participants` (
	`ticket_id` text NOT NULL,
	`dept` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text,
	PRIMARY KEY(`ticket_id`, `dept`)
);
--> statement-breakpoint
CREATE TABLE `kb_edges` (
	`id` text PRIMARY KEY NOT NULL,
	`from_node_id` text NOT NULL,
	`to_node_id` text NOT NULL,
	`relation` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kb_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`dept` text NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`body` text,
	`meta` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`title` text NOT NULL,
	`owner_dept` text NOT NULL,
	`assignee` text,
	`status` text NOT NULL,
	`due` integer
);
--> statement-breakpoint
CREATE TABLE `ticket_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`role` text NOT NULL,
	`text` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ticket_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`admin_id` text NOT NULL,
	`text` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`student` text NOT NULL,
	`owner_dept` text NOT NULL,
	`tag` text NOT NULL,
	`severity` text NOT NULL,
	`complexity` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`ai_summary` text NOT NULL,
	`collected_information` text NOT NULL,
	`missing_information` text NOT NULL,
	`suggested_actions` text NOT NULL,
	`confidence` real NOT NULL,
	`claimed_by` text,
	`edited` integer DEFAULT false NOT NULL,
	`kb_ingested` integer DEFAULT false NOT NULL,
	`cross_initiated_by` text,
	`cross_active` integer DEFAULT false NOT NULL
);
