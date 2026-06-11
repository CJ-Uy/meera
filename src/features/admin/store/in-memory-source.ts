import { adminSeedSnapshot } from "@/features/admin/data/seed";
import type { AdminDataSource, TicketPatch } from "@/features/admin/store/data-source";
import { adminReducer, initialAdminStoreState } from "@/features/admin/store/reducer";
import type { AdminNote, AdminSnapshot, Complexity, DemoTicket, DepartmentCode, KbEdge, KbNode, Severity, Task } from "@/features/admin/types";

let snapshot: AdminSnapshot = structuredClone(adminSeedSnapshot);

function mutate(action: Parameters<typeof adminReducer>[1]) {
	const next = adminReducer({ ...initialAdminStoreState, ...snapshot, loading: false }, action);
	snapshot = {
		admins: next.admins,
		tickets: next.tickets,
		kb: next.kb,
	};
}

/**
 * Pull tickets persisted by the live support orchestrator (student demo → shared dev D1) and merge
 * them into the seeded demo snapshot, deduped by id. Without this, student-created tickets are written
 * to the database but never surface in the admin inbox, because the demo dashboard reads this in-memory
 * seed rather than the database. Demo seed content (admins, KB, cross-dept examples) is preserved.
 */
async function mergeLiveTickets() {
	if (typeof fetch !== "function") return;
	try {
		const response = await fetch("/api/admin/snapshot", { headers: { Accept: "application/json" } });
		if (!response.ok) return;
		const live = (await response.json()) as Partial<AdminSnapshot>;
		const liveTickets = Array.isArray(live.tickets) ? live.tickets : [];
		if (liveTickets.length === 0) return;
		const byId = new Map<string, DemoTicket>();
		for (const ticket of snapshot.tickets) byId.set(ticket.id, ticket);
		for (const ticket of liveTickets) byId.set(ticket.id, ticket); // database is source of truth for live tickets
		snapshot = { ...snapshot, tickets: [...byId.values()] };
	} catch {
		// Offline / SSR / shared API unavailable: fall back to the seeded demo tickets only.
	}
}

export const inMemoryAdminDataSource: AdminDataSource = {
	async loadSnapshot() {
		await mergeLiveTickets();
		return structuredClone(snapshot);
	},
	async claimTicket(id: string, adminId: string) {
		mutate({ type: "claimTicket", id, adminId });
	},
	async releaseTicket(id: string) {
		mutate({ type: "releaseTicket", id });
	},
	async addNote(id: string, note: AdminNote) {
		mutate({ type: "addNote", id, note });
	},
	async setSeverity(id: string, severity: Severity) {
		mutate({ type: "setSeverity", id, severity });
	},
	async setComplexity(id: string, complexity: Complexity) {
		mutate({ type: "setComplexity", id, complexity });
	},
	async updateTicket(id: string, patch: TicketPatch) {
		mutate({ type: "updateTicket", id, patch });
	},
	async resolveTicket(id: string) {
		mutate({ type: "resolveTicket", id });
	},
	async ingestKb(node: KbNode) {
		mutate({ type: "ingestKb", node });
	},
	async createKbNode(node: KbNode, edges: KbEdge[]) {
		mutate({ type: "createKbNode", node, edges });
	},
	async deleteKbNode(id: string) {
		mutate({ type: "deleteKbNode", id });
	},
	async escalateCrossDept(id: string, depts: DepartmentCode[], by: "ai" | string, reason: string) {
		mutate({ type: "escalateCrossDept", id, depts, by, reason });
	},
	async respondCrossDept(id: string, dept: DepartmentCode, decision: "accepted" | "rejected", reason?: string) {
		mutate({ type: "respondCrossDept", id, dept, decision, reason });
	},
	async addTask(id: string, task: Task) {
		mutate({ type: "addTask", id, task });
	},
	async updateTask(id: string, taskId: string, patch: Partial<Task>) {
		mutate({ type: "updateTask", id, taskId, patch });
	},
};
