import { adminSeedSnapshot } from "@/features/admin/data/seed";
import type { AdminDataSource, TicketPatch } from "@/features/admin/store/data-source";
import { adminReducer, initialAdminStoreState } from "@/features/admin/store/reducer";
import type { AdminNote, AdminSnapshot, Complexity, DepartmentCode, KbEdge, KbNode, Severity, Task } from "@/features/admin/types";

let snapshot: AdminSnapshot = structuredClone(adminSeedSnapshot);

function mutate(action: Parameters<typeof adminReducer>[1]) {
	const next = adminReducer({ ...initialAdminStoreState, ...snapshot, loading: false }, action);
	snapshot = {
		admins: next.admins,
		tickets: next.tickets,
		kb: next.kb,
	};
}

export const inMemoryAdminDataSource: AdminDataSource = {
	async loadSnapshot() {
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
