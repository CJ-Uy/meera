import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { and, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createId } from "@/lib/ids";
import { adminFromRow, kbEdgeFromRow, kbNodeFromRow, messageFromRow, messageId, noteFromRow, serializeMeta, taskFromRow, ticketFromRows, ticketInsertFromDemo, ticketUpdateFromPatch } from "../admin-records";
import * as schema from "../schema";
import { admins, crossDeptParticipants, kbEdges, kbNodes, tasks, ticketMessages, ticketNotes, tickets, users } from "../schema";
import type { CreateUserInput, DatabaseAdapter, User } from "../types";
import type { TicketPatch } from "@/features/admin/store/data-source";
import type { AdminNote, AdminSnapshot, Complexity, DemoTicket, DepartmentCode, KbEdge, KbNode, Severity, Task } from "@/features/admin/types";

export class LocalSqliteDatabaseAdapter implements DatabaseAdapter {
	readonly adapterName = "local-sqlite";

	private readonly db;

	constructor(sqlitePath: string) {
		fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
		const sqlite = new Database(sqlitePath);
		sqlite.exec(`
			CREATE TABLE IF NOT EXISTS users (
				id TEXT PRIMARY KEY NOT NULL,
				email TEXT NOT NULL UNIQUE,
				name TEXT,
				created_at INTEGER NOT NULL
			);
			CREATE TABLE IF NOT EXISTS admins (
				id TEXT PRIMARY KEY NOT NULL,
				name TEXT NOT NULL,
				dept TEXT NOT NULL,
				role TEXT NOT NULL
			);
			CREATE TABLE IF NOT EXISTS tickets (
				id TEXT PRIMARY KEY NOT NULL,
				title TEXT NOT NULL,
				student TEXT NOT NULL,
				owner_dept TEXT NOT NULL,
				tag TEXT NOT NULL,
				severity TEXT NOT NULL,
				complexity TEXT NOT NULL,
				status TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				ai_summary TEXT NOT NULL,
				collected_information TEXT NOT NULL,
				missing_information TEXT NOT NULL,
				suggested_actions TEXT NOT NULL,
				confidence REAL NOT NULL,
				claimed_by TEXT,
				edited INTEGER NOT NULL DEFAULT 0,
				kb_ingested INTEGER NOT NULL DEFAULT 0,
				cross_initiated_by TEXT,
				cross_active INTEGER NOT NULL DEFAULT 0
			);
			CREATE TABLE IF NOT EXISTS ticket_messages (
				id TEXT PRIMARY KEY NOT NULL,
				ticket_id TEXT NOT NULL,
				role TEXT NOT NULL,
				text TEXT NOT NULL,
				at INTEGER NOT NULL
			);
			CREATE TABLE IF NOT EXISTS ticket_notes (
				id TEXT PRIMARY KEY NOT NULL,
				ticket_id TEXT NOT NULL,
				admin_id TEXT NOT NULL,
				text TEXT NOT NULL,
				at INTEGER NOT NULL
			);
			CREATE TABLE IF NOT EXISTS kb_nodes (
				id TEXT PRIMARY KEY NOT NULL,
				dept TEXT NOT NULL,
				kind TEXT NOT NULL,
				label TEXT NOT NULL,
				body TEXT,
				meta TEXT NOT NULL DEFAULT '{}'
			);
			CREATE TABLE IF NOT EXISTS kb_edges (
				id TEXT PRIMARY KEY NOT NULL,
				from_node_id TEXT NOT NULL,
				to_node_id TEXT NOT NULL,
				relation TEXT NOT NULL
			);
			CREATE TABLE IF NOT EXISTS cross_dept_participants (
				ticket_id TEXT NOT NULL,
				dept TEXT NOT NULL,
				decision TEXT NOT NULL,
				reason TEXT,
				PRIMARY KEY (ticket_id, dept)
			);
			CREATE TABLE IF NOT EXISTS tasks (
				id TEXT PRIMARY KEY NOT NULL,
				ticket_id TEXT NOT NULL,
				title TEXT NOT NULL,
				owner_dept TEXT NOT NULL,
				assignee TEXT,
				status TEXT NOT NULL,
				due INTEGER
			);
		`);
		this.db = drizzle(sqlite, { schema });
	}

	async listUsers(): Promise<User[]> {
		return this.db.select().from(users).orderBy(users.createdAt);
	}

	async createUser(input: CreateUserInput): Promise<User> {
		const [created] = this.db
			.insert(users)
			.values({
				id: createId("usr"),
				email: input.email,
				name: input.name ?? null,
				createdAt: new Date(),
			})
			.returning()
			.all();
		return created;
	}

	async getUserById(id: string): Promise<User | null> {
		const [user] = this.db.select().from(users).where(eq(users.id, id)).limit(1).all();
		return user ?? null;
	}

	async loadAdminSnapshot(): Promise<AdminSnapshot> {
		const adminRows = this.db.select().from(admins).orderBy(admins.dept, admins.name).all();
		const ticketRows = this.db.select().from(tickets).orderBy(tickets.createdAt).all();
		const messageRows = this.db.select().from(ticketMessages).orderBy(ticketMessages.at).all();
		const noteRows = this.db.select().from(ticketNotes).orderBy(ticketNotes.at).all();
		const nodeRows = this.db.select().from(kbNodes).orderBy(kbNodes.dept, kbNodes.label).all();
		const edgeRows = this.db.select().from(kbEdges).orderBy(kbEdges.id).all();
		const participantRows = this.db.select().from(crossDeptParticipants).orderBy(crossDeptParticipants.ticketId, crossDeptParticipants.dept).all();
		const taskRows = this.db.select().from(tasks).orderBy(tasks.id).all();

		return {
			admins: adminRows.map(adminFromRow),
			tickets: ticketRows.map((ticket) =>
				ticketFromRows(
					ticket,
					messageRows.filter((message) => message.ticketId === ticket.id).map(messageFromRow),
					noteRows.filter((note) => note.ticketId === ticket.id).map(noteFromRow),
					participantRows.filter((participant) => participant.ticketId === ticket.id),
					taskRows.filter((task) => task.ticketId === ticket.id).map(taskFromRow),
				),
			),
			kb: {
				nodes: nodeRows.map(kbNodeFromRow),
				edges: edgeRows.map(kbEdgeFromRow),
			},
		};
	}

	async createTicket(ticket: DemoTicket): Promise<{ id: string }> {
		this.db.insert(tickets).values(ticketInsertFromDemo(ticket)).run();
		const messages = ticket.conversation.map((message, index) => ({
			id: messageId(ticket.id, index),
			ticketId: ticket.id,
			role: message.role,
			text: message.text,
			at: message.at,
		}));
		if (messages.length > 0) this.db.insert(ticketMessages).values(messages).run();
		return { id: ticket.id };
	}

	async claimTicket(id: string, adminId: string): Promise<void> {
		const [ticket] = this.db.select().from(tickets).where(eq(tickets.id, id)).limit(1).all();
		if (!ticket) return;
		this.db.update(tickets).set({ claimedBy: adminId, status: ticket.status === "New" ? "In progress" : ticket.status }).where(eq(tickets.id, id)).run();
	}

	async releaseTicket(id: string): Promise<void> {
		this.db.update(tickets).set({ claimedBy: null }).where(eq(tickets.id, id)).run();
	}

	async addNote(id: string, note: AdminNote): Promise<void> {
		this.db.insert(ticketNotes).values({ id: note.id, ticketId: id, adminId: note.adminId, text: note.text, at: note.at }).run();
	}

	async setSeverity(id: string, severity: Severity): Promise<void> {
		this.db.update(tickets).set({ severity, edited: true }).where(eq(tickets.id, id)).run();
	}

	async setComplexity(id: string, complexity: Complexity): Promise<void> {
		this.db.update(tickets).set({ complexity, edited: true }).where(eq(tickets.id, id)).run();
	}

	async updateTicket(id: string, patch: TicketPatch): Promise<void> {
		this.db.update(tickets).set(ticketUpdateFromPatch(patch)).where(eq(tickets.id, id)).run();
	}

	async deleteTicket(id: string): Promise<void> {
		this.db.delete(tasks).where(eq(tasks.ticketId, id)).run();
		this.db.delete(crossDeptParticipants).where(eq(crossDeptParticipants.ticketId, id)).run();
		this.db.delete(ticketNotes).where(eq(ticketNotes.ticketId, id)).run();
		this.db.delete(ticketMessages).where(eq(ticketMessages.ticketId, id)).run();
		this.db.delete(tickets).where(eq(tickets.id, id)).run();
	}

	async resolveTicket(id: string): Promise<void> {
		this.db.update(tickets).set({ status: "Resolved" }).where(eq(tickets.id, id)).run();
	}

	async ingestKb(node: KbNode): Promise<void> {
		this.insertKbNode(node);
		const sourceTicketId = node.meta?.sourceTicketId ?? node.meta?.sourceTicket;
		if (sourceTicketId) this.db.update(tickets).set({ kbIngested: true }).where(eq(tickets.id, sourceTicketId)).run();
	}

	async createKbNode(node: KbNode, edges: KbEdge[]): Promise<void> {
		this.insertKbNode(node);
		if (edges.length > 0) this.db.insert(kbEdges).values(edges.map((edge) => ({ id: edge.id, fromNodeId: edge.from, toNodeId: edge.to, relation: edge.relation }))).run();
	}

	async deleteKbNode(id: string): Promise<void> {
		this.db.delete(kbEdges).where(or(eq(kbEdges.fromNodeId, id), eq(kbEdges.toNodeId, id))).run();
		this.db.delete(kbNodes).where(eq(kbNodes.id, id)).run();
	}

	async escalateCrossDept(id: string, depts: DepartmentCode[], by: "ai" | string, reason: string): Promise<void> {
		const [ticket] = this.db.select().from(tickets).where(eq(tickets.id, id)).limit(1).all();
		if (!ticket) return;

		const initiatorDept = by === "ai" ? ticket.ownerDept : this.adminDepartment(by) ?? ticket.ownerDept;
		if (ticket.crossInitiatedBy) {
			const existing = this.db.select().from(crossDeptParticipants).where(eq(crossDeptParticipants.ticketId, id)).all();
			const existingDepts = new Set(existing.map((participant) => participant.dept));
			const newParticipantDepts = depts.filter((dept) => dept !== initiatorDept && !existingDepts.has(dept));
			if (newParticipantDepts.length > 0) {
				this.db.insert(crossDeptParticipants).values(
					newParticipantDepts.map((dept) => ({
						ticketId: id,
						dept,
						decision: "pending" as const,
						reason,
					})),
				).run();
			}
			return;
		}

		const participantDepts = Array.from(new Set([initiatorDept, ...depts.filter((dept) => dept !== initiatorDept)]));

		this.db.update(tickets).set({ crossInitiatedBy: by, crossActive: false }).where(eq(tickets.id, id)).run();
		this.db.insert(crossDeptParticipants).values(
			participantDepts.map((dept) => ({
				ticketId: id,
				dept,
				decision: (dept === initiatorDept ? "accepted" : "pending") as "accepted" | "pending",
				reason: dept === initiatorDept ? null : reason,
			})),
		).run();
	}

	async respondCrossDept(id: string, dept: DepartmentCode, decision: "accepted" | "rejected", reason?: string): Promise<void> {
		const [ticket] = this.db.select().from(tickets).where(eq(tickets.id, id)).limit(1).all();
		if (!ticket?.crossInitiatedBy) return;

		const existing = this.db.select().from(crossDeptParticipants).where(eq(crossDeptParticipants.ticketId, id)).all();
		const initiatorDept = ticket.crossInitiatedBy === "ai" ? ticket.ownerDept : this.adminDepartment(ticket.crossInitiatedBy) ?? ticket.ownerDept;
		let participants = existing.map((participant) => (participant.dept === dept ? { ...participant, decision, reason: reason ?? participant.reason } : participant));
		const acceptedTargets = participants.filter((participant) => participant.dept !== initiatorDept && participant.decision === "accepted");
		const pendingTargets = participants.filter((participant) => participant.dept !== initiatorDept && participant.decision === "pending");
		const autoAcceptLast = decision === "rejected" && acceptedTargets.length === 0 && pendingTargets.length === 1;
		if (autoAcceptLast) participants = participants.map((participant) => (participant.decision === "pending" ? { ...participant, decision: "accepted" } : participant));
		const active = ticket.crossActive || autoAcceptLast || participants.some((participant) => participant.dept !== initiatorDept && participant.decision === "accepted");

		for (const participant of participants) {
			this.db
				.update(crossDeptParticipants)
				.set({ decision: participant.decision, reason: participant.reason ?? null })
				.where(and(eq(crossDeptParticipants.ticketId, id), eq(crossDeptParticipants.dept, participant.dept)))
				.run();
		}
		this.db.update(tickets).set({ crossActive: active }).where(eq(tickets.id, id)).run();
	}

	async addTask(id: string, task: Task): Promise<void> {
		this.db.insert(tasks).values({ id: task.id, ticketId: id, title: task.title, ownerDept: task.ownerDept, assignee: task.assignee ?? null, status: task.status, due: task.due ?? null }).run();
	}

	async updateTask(id: string, taskId: string, patch: Partial<Task>): Promise<void> {
		this.db
			.update(tasks)
			.set({
				...(patch.title === undefined ? {} : { title: patch.title }),
				...(patch.ownerDept === undefined ? {} : { ownerDept: patch.ownerDept }),
				...(patch.assignee === undefined ? {} : { assignee: patch.assignee ?? null }),
				...(patch.status === undefined ? {} : { status: patch.status }),
				...(patch.due === undefined ? {} : { due: patch.due ?? null }),
			})
			.where(and(eq(tasks.ticketId, id), eq(tasks.id, taskId)))
			.run();
	}

	async seedAdminSnapshot(snapshot: AdminSnapshot): Promise<void> {
		this.db.delete(tasks).run();
		this.db.delete(crossDeptParticipants).run();
		this.db.delete(ticketNotes).run();
		this.db.delete(ticketMessages).run();
		this.db.delete(tickets).run();
		this.db.delete(kbEdges).run();
		this.db.delete(kbNodes).run();
		this.db.delete(admins).run();

		if (snapshot.admins.length > 0) this.db.insert(admins).values(snapshot.admins).run();
		if (snapshot.tickets.length > 0) this.db.insert(tickets).values(snapshot.tickets.map(ticketInsertFromDemo)).run();
		const messages = snapshot.tickets.flatMap((ticket) => ticket.conversation.map((message, index) => ({ id: messageId(ticket.id, index), ticketId: ticket.id, role: message.role, text: message.text, at: message.at })));
		if (messages.length > 0) this.db.insert(ticketMessages).values(messages).run();
		const notes = snapshot.tickets.flatMap((ticket) => ticket.notes.map((note) => ({ id: note.id, ticketId: ticket.id, adminId: note.adminId, text: note.text, at: note.at })));
		if (notes.length > 0) this.db.insert(ticketNotes).values(notes).run();
		const participants = snapshot.tickets.flatMap((ticket) => ticket.cross?.participants.map((participant) => ({ ticketId: ticket.id, dept: participant.dept, decision: participant.decision, reason: participant.reason ?? null })) ?? []);
		if (participants.length > 0) this.db.insert(crossDeptParticipants).values(participants).run();
		const ticketTasks = snapshot.tickets.flatMap((ticket) => ticket.cross?.tasks.map((task) => ({ id: task.id, ticketId: ticket.id, title: task.title, ownerDept: task.ownerDept, assignee: task.assignee ?? null, status: task.status, due: task.due ?? null })) ?? []);
		if (ticketTasks.length > 0) this.db.insert(tasks).values(ticketTasks).run();
		if (snapshot.kb.nodes.length > 0) this.db.insert(kbNodes).values(snapshot.kb.nodes.map((node) => ({ id: node.id, dept: node.dept, kind: node.kind, label: node.label, body: node.body ?? null, meta: serializeMeta(node.meta) }))).run();
		if (snapshot.kb.edges.length > 0) this.db.insert(kbEdges).values(snapshot.kb.edges.map((edge) => ({ id: edge.id, fromNodeId: edge.from, toNodeId: edge.to, relation: edge.relation }))).run();
	}

	private insertKbNode(node: KbNode) {
		this.db.insert(kbNodes).values({ id: node.id, dept: node.dept, kind: node.kind, label: node.label, body: node.body ?? null, meta: serializeMeta(node.meta) }).run();
	}

	private adminDepartment(adminId: string) {
		const [admin] = this.db.select().from(admins).where(eq(admins.id, adminId)).limit(1).all();
		return admin?.dept ?? null;
	}
}
