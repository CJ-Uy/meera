import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	name: text("name"),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const admins = sqliteTable("admins", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	dept: text("dept", { enum: ["IT", "REG", "MED", "SS", "FIN"] }).notNull(),
	role: text("role").notNull(),
});

export const tickets = sqliteTable("tickets", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	student: text("student").notNull(),
	ownerDept: text("owner_dept", { enum: ["IT", "REG", "MED", "SS", "FIN"] }).notNull(),
	tag: text("tag").notNull(),
	severity: text("severity", { enum: ["Low", "Medium", "High", "Critical"] }).notNull(),
	complexity: text("complexity", { enum: ["Low", "Medium", "High"] }).notNull(),
	status: text("status", { enum: ["New", "In progress", "Awaiting student", "Resolved"] }).notNull(),
	createdAt: integer("created_at").notNull(),
	aiSummary: text("ai_summary").notNull(),
	collectedInformation: text("collected_information").notNull(),
	missingInformation: text("missing_information").notNull(),
	suggestedActions: text("suggested_actions").notNull(),
	confidence: real("confidence").notNull(),
	claimedBy: text("claimed_by"),
	edited: integer("edited", { mode: "boolean" }).notNull().default(false),
	kbIngested: integer("kb_ingested", { mode: "boolean" }).notNull().default(false),
	crossInitiatedBy: text("cross_initiated_by"),
	crossActive: integer("cross_active", { mode: "boolean" }).notNull().default(false),
});

export const ticketMessages = sqliteTable("ticket_messages", {
	id: text("id").primaryKey(),
	ticketId: text("ticket_id").notNull(),
	role: text("role", { enum: ["student", "meera"] }).notNull(),
	text: text("text").notNull(),
	at: integer("at").notNull(),
});

export const ticketNotes = sqliteTable("ticket_notes", {
	id: text("id").primaryKey(),
	ticketId: text("ticket_id").notNull(),
	adminId: text("admin_id").notNull(),
	text: text("text").notNull(),
	at: integer("at").notNull(),
});

export const kbNodes = sqliteTable("kb_nodes", {
	id: text("id").primaryKey(),
	dept: text("dept").notNull(),
	kind: text("kind", { enum: ["faq", "procedure", "entity", "department"] }).notNull(),
	label: text("label").notNull(),
	body: text("body"),
	meta: text("meta").notNull().default("{}"),
});

export const kbEdges = sqliteTable("kb_edges", {
	id: text("id").primaryKey(),
	fromNodeId: text("from_node_id").notNull(),
	toNodeId: text("to_node_id").notNull(),
	relation: text("relation").notNull(),
});

export const crossDeptParticipants = sqliteTable(
	"cross_dept_participants",
	{
		ticketId: text("ticket_id").notNull(),
		dept: text("dept", { enum: ["IT", "REG", "MED", "SS", "FIN"] }).notNull(),
		decision: text("decision", { enum: ["pending", "accepted", "rejected"] }).notNull(),
		reason: text("reason"),
	},
	(table) => [primaryKey({ columns: [table.ticketId, table.dept] })],
);

export const tasks = sqliteTable("tasks", {
	id: text("id").primaryKey(),
	ticketId: text("ticket_id").notNull(),
	title: text("title").notNull(),
	ownerDept: text("owner_dept", { enum: ["IT", "REG", "MED", "SS", "FIN"] }).notNull(),
	assignee: text("assignee"),
	status: text("status", { enum: ["todo", "doing", "done"] }).notNull(),
	due: integer("due"),
});
