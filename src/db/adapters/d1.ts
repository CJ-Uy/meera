import { and, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { createId } from "@/lib/ids";
import { adminFromRow, kbEdgeFromRow, kbNodeFromRow, messageFromRow, messageId, noteFromRow, serializeMeta, taskFromRow, ticketFromRows, ticketInsertFromDemo, ticketUpdateFromPatch } from "../admin-records";
import * as schema from "../schema";
import { admins, crossDeptParticipants, kbEdges, kbNodes, tasks, ticketMessages, ticketNotes, tickets, users } from "../schema";
import type { CreateUserInput, DatabaseAdapter, User } from "../types";
import type { AdminNote, AdminSnapshot, DemoTicket, DepartmentCode, KbEdge, KbNode, Severity, Complexity, Task } from "@/features/admin/types";
import type { TicketPatch } from "@/features/admin/store/data-source";

export class D1DatabaseAdapter implements DatabaseAdapter {
	readonly adapterName = "d1";

	private readonly db;

	constructor(binding: D1Database) {
		this.db = drizzle(binding, { schema });
	}

	async listUsers(): Promise<User[]> {
		return this.db.select().from(users).orderBy(users.createdAt);
	}

	async createUser(input: CreateUserInput): Promise<User> {
		const [created] = await this.db
			.insert(users)
			.values({
				id: createId("usr"),
				email: input.email,
				name: input.name ?? null,
				createdAt: new Date(),
			})
			.returning();

		return created;
	}

	async getUserById(id: string): Promise<User | null> {
		const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
		return user ?? null;
	}

	async loadAdminSnapshot(): Promise<AdminSnapshot> {
		const [adminRows, ticketRows, messageRows, noteRows, nodeRows, edgeRows, participantRows, taskRows] = await Promise.all([
			this.db.select().from(admins).orderBy(admins.dept, admins.name),
			this.db.select().from(tickets).orderBy(tickets.createdAt),
			this.db.select().from(ticketMessages).orderBy(ticketMessages.at),
			this.db.select().from(ticketNotes).orderBy(ticketNotes.at),
			this.db.select().from(kbNodes).orderBy(kbNodes.dept, kbNodes.label),
			this.db.select().from(kbEdges).orderBy(kbEdges.id),
			this.db.select().from(crossDeptParticipants).orderBy(crossDeptParticipants.ticketId, crossDeptParticipants.dept),
			this.db.select().from(tasks).orderBy(tasks.id),
		]);

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
		await this.db.insert(tickets).values(ticketInsertFromDemo(ticket));
		const messages = ticket.conversation.map((message, index) => ({
			id: messageId(ticket.id, index),
			ticketId: ticket.id,
			role: message.role,
			text: message.text,
			at: message.at,
		}));
		if (messages.length > 0) await this.db.insert(ticketMessages).values(messages);
		return { id: ticket.id };
	}

	async claimTicket(id: string, adminId: string): Promise<void> {
		const [ticket] = await this.db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
		if (!ticket) return;
		await this.db.update(tickets).set({ claimedBy: adminId, status: ticket.status === "New" ? "In progress" : ticket.status }).where(eq(tickets.id, id));
	}

	async releaseTicket(id: string): Promise<void> {
		await this.db.update(tickets).set({ claimedBy: null }).where(eq(tickets.id, id));
	}

	async addNote(id: string, note: AdminNote): Promise<void> {
		await this.db.insert(ticketNotes).values({ id: note.id, ticketId: id, adminId: note.adminId, text: note.text, at: note.at });
	}

	async setSeverity(id: string, severity: Severity): Promise<void> {
		await this.db.update(tickets).set({ severity, edited: true }).where(eq(tickets.id, id));
	}

	async setComplexity(id: string, complexity: Complexity): Promise<void> {
		await this.db.update(tickets).set({ complexity, edited: true }).where(eq(tickets.id, id));
	}

	async updateTicket(id: string, patch: TicketPatch): Promise<void> {
		await this.db.update(tickets).set(ticketUpdateFromPatch(patch)).where(eq(tickets.id, id));
	}

	async deleteTicket(id: string): Promise<void> {
		await this.db.delete(tasks).where(eq(tasks.ticketId, id));
		await this.db.delete(crossDeptParticipants).where(eq(crossDeptParticipants.ticketId, id));
		await this.db.delete(ticketNotes).where(eq(ticketNotes.ticketId, id));
		await this.db.delete(ticketMessages).where(eq(ticketMessages.ticketId, id));
		await this.db.delete(tickets).where(eq(tickets.id, id));
	}

	async resolveTicket(id: string): Promise<void> {
		await this.db.update(tickets).set({ status: "Resolved" }).where(eq(tickets.id, id));
	}

	async ingestKb(node: KbNode): Promise<void> {
		await this.insertKbNode(node);
		const sourceTicketId = node.meta?.sourceTicketId ?? node.meta?.sourceTicket;
		if (sourceTicketId) await this.db.update(tickets).set({ kbIngested: true }).where(eq(tickets.id, sourceTicketId));
	}

	async createKbNode(node: KbNode, edges: KbEdge[]): Promise<void> {
		await this.insertKbNode(node);
		if (edges.length > 0) await this.db.insert(kbEdges).values(edges.map((edge) => ({ id: edge.id, fromNodeId: edge.from, toNodeId: edge.to, relation: edge.relation })));
	}

	async deleteKbNode(id: string): Promise<void> {
		await this.db.delete(kbEdges).where(or(eq(kbEdges.fromNodeId, id), eq(kbEdges.toNodeId, id)));
		await this.db.delete(kbNodes).where(eq(kbNodes.id, id));
	}

	async escalateCrossDept(id: string, depts: DepartmentCode[], by: "ai" | string, reason: string): Promise<void> {
		const [ticket] = await this.db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
		if (!ticket || ticket.crossInitiatedBy) return;

		const initiatorDept = by === "ai" ? ticket.ownerDept : (await this.adminDepartment(by)) ?? ticket.ownerDept;
		const participantDepts = Array.from(new Set([initiatorDept, ...depts.filter((dept) => dept !== initiatorDept)]));

		await this.db.update(tickets).set({ crossInitiatedBy: by, crossActive: false }).where(eq(tickets.id, id));
		await this.db.insert(crossDeptParticipants).values(
			participantDepts.map((dept) => ({
				ticketId: id,
				dept,
				decision: (dept === initiatorDept ? "accepted" : "pending") as "accepted" | "pending",
				reason: dept === initiatorDept ? null : reason,
			})),
		);
	}

	async respondCrossDept(id: string, dept: DepartmentCode, decision: "accepted" | "rejected", reason?: string): Promise<void> {
		const [ticket] = await this.db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
		if (!ticket?.crossInitiatedBy) return;

		const existing = await this.db.select().from(crossDeptParticipants).where(eq(crossDeptParticipants.ticketId, id));
		const initiatorDept = ticket.crossInitiatedBy === "ai" ? ticket.ownerDept : (await this.adminDepartment(ticket.crossInitiatedBy)) ?? ticket.ownerDept;
		let participants = existing.map((participant) => (participant.dept === dept ? { ...participant, decision, reason: reason ?? participant.reason } : participant));
		const acceptedTargets = participants.filter((participant) => participant.dept !== initiatorDept && participant.decision === "accepted");
		const pendingTargets = participants.filter((participant) => participant.dept !== initiatorDept && participant.decision === "pending");
		const autoAcceptLast = decision === "rejected" && acceptedTargets.length === 0 && pendingTargets.length === 1;
		if (autoAcceptLast) {
			participants = participants.map((participant) => (participant.decision === "pending" ? { ...participant, decision: "accepted" } : participant));
		}
		const active = ticket.crossActive || autoAcceptLast || participants.some((participant) => participant.dept !== initiatorDept && participant.decision === "accepted");

		for (const participant of participants) {
			await this.db
				.update(crossDeptParticipants)
				.set({ decision: participant.decision, reason: participant.reason ?? null })
				.where(and(eq(crossDeptParticipants.ticketId, id), eq(crossDeptParticipants.dept, participant.dept)));
		}
		await this.db.update(tickets).set({ crossActive: active }).where(eq(tickets.id, id));
	}

	async addTask(id: string, task: Task): Promise<void> {
		await this.db.insert(tasks).values({ id: task.id, ticketId: id, title: task.title, ownerDept: task.ownerDept, assignee: task.assignee ?? null, status: task.status, due: task.due ?? null });
	}

	async updateTask(id: string, taskId: string, patch: Partial<Task>): Promise<void> {
		await this.db
			.update(tasks)
			.set({
				...(patch.title === undefined ? {} : { title: patch.title }),
				...(patch.ownerDept === undefined ? {} : { ownerDept: patch.ownerDept }),
				...(patch.assignee === undefined ? {} : { assignee: patch.assignee ?? null }),
				...(patch.status === undefined ? {} : { status: patch.status }),
				...(patch.due === undefined ? {} : { due: patch.due ?? null }),
			})
			.where(and(eq(tasks.ticketId, id), eq(tasks.id, taskId)));
	}

	async seedAdminSnapshot(snapshot: AdminSnapshot): Promise<void> {
		await this.db.delete(tasks);
		await this.db.delete(crossDeptParticipants);
		await this.db.delete(ticketNotes);
		await this.db.delete(ticketMessages);
		await this.db.delete(tickets);
		await this.db.delete(kbEdges);
		await this.db.delete(kbNodes);
		await this.db.delete(admins);

		if (snapshot.admins.length > 0) await this.db.insert(admins).values(snapshot.admins);
		if (snapshot.tickets.length > 0) await this.db.insert(tickets).values(snapshot.tickets.map(ticketInsertFromDemo));
		const messages = snapshot.tickets.flatMap((ticket) => ticket.conversation.map((message, index) => ({ id: messageId(ticket.id, index), ticketId: ticket.id, role: message.role, text: message.text, at: message.at })));
		if (messages.length > 0) await this.db.insert(ticketMessages).values(messages);
		const notes = snapshot.tickets.flatMap((ticket) => ticket.notes.map((note) => ({ id: note.id, ticketId: ticket.id, adminId: note.adminId, text: note.text, at: note.at })));
		if (notes.length > 0) await this.db.insert(ticketNotes).values(notes);
		const participants = snapshot.tickets.flatMap((ticket) => ticket.cross?.participants.map((participant) => ({ ticketId: ticket.id, dept: participant.dept, decision: participant.decision, reason: participant.reason ?? null })) ?? []);
		if (participants.length > 0) await this.db.insert(crossDeptParticipants).values(participants);
		const ticketTasks = snapshot.tickets.flatMap((ticket) => ticket.cross?.tasks.map((task) => ({ id: task.id, ticketId: ticket.id, title: task.title, ownerDept: task.ownerDept, assignee: task.assignee ?? null, status: task.status, due: task.due ?? null })) ?? []);
		if (ticketTasks.length > 0) await this.db.insert(tasks).values(ticketTasks);
		if (snapshot.kb.nodes.length > 0) await this.db.insert(kbNodes).values(snapshot.kb.nodes.map((node) => ({ id: node.id, dept: node.dept, kind: node.kind, label: node.label, body: node.body ?? null, meta: serializeMeta(node.meta) })));
		if (snapshot.kb.edges.length > 0) await this.db.insert(kbEdges).values(snapshot.kb.edges.map((edge) => ({ id: edge.id, fromNodeId: edge.from, toNodeId: edge.to, relation: edge.relation })));
	}

	private async insertKbNode(node: KbNode) {
		await this.db.insert(kbNodes).values({ id: node.id, dept: node.dept, kind: node.kind, label: node.label, body: node.body ?? null, meta: serializeMeta(node.meta) });
	}

	private async adminDepartment(adminId: string) {
		const [admin] = await this.db.select().from(admins).where(eq(admins.id, adminId)).limit(1);
		return admin?.dept ?? null;
	}
}
