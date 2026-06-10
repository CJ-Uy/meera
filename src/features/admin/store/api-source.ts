import type { AdminDataSource, TicketPatch } from "@/features/admin/store/data-source";
import type { AdminNote, AdminSnapshot, Complexity, DepartmentCode, KbEdge, KbNode, Severity, Task } from "@/features/admin/types";

function assertActingAdminId(value: string | null) {
	if (!value) throw new Error("An acting admin is required for admin mutations.");
	return value;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const response = await fetch(path, {
		...init,
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			...init.headers,
		},
	});

	if (!response.ok) throw new Error(`Admin API request failed with HTTP ${response.status}.`);
	if (response.status === 204) return undefined as T;
	return (await response.json()) as T;
}

export function createApiAdminDataSource(getActingAdminId: () => string | null): AdminDataSource {
	const withActor = <T extends Record<string, unknown>>(body: T) => JSON.stringify({ ...body, actingAdminId: assertActingAdminId(getActingAdminId()) });

	return {
		loadSnapshot() {
			return request<AdminSnapshot>("/api/admin/snapshot");
		},
		claimTicket(id: string, adminId: string) {
			return request<void>(`/api/admin/tickets/${encodeURIComponent(id)}/claim`, { method: "POST", body: withActor({ adminId }) });
		},
		releaseTicket(id: string) {
			return request<void>(`/api/admin/tickets/${encodeURIComponent(id)}/release`, { method: "POST", body: withActor({}) });
		},
		addNote(id: string, note: AdminNote) {
			return request<void>(`/api/admin/tickets/${encodeURIComponent(id)}/notes`, { method: "POST", body: withActor({ note }) });
		},
		setSeverity(id: string, severity: Severity) {
			return request<void>(`/api/admin/tickets/${encodeURIComponent(id)}/severity`, { method: "POST", body: withActor({ severity }) });
		},
		setComplexity(id: string, complexity: Complexity) {
			return request<void>(`/api/admin/tickets/${encodeURIComponent(id)}/complexity`, { method: "POST", body: withActor({ complexity }) });
		},
		updateTicket(id: string, patch: TicketPatch) {
			return request<void>(`/api/admin/tickets/${encodeURIComponent(id)}`, { method: "PATCH", body: withActor({ patch }) });
		},
		resolveTicket(id: string) {
			return request<void>(`/api/admin/tickets/${encodeURIComponent(id)}/resolve`, { method: "POST", body: withActor({}) });
		},
		ingestKb(node: KbNode) {
			return request<void>("/api/admin/kb/ingest", { method: "POST", body: withActor({ node }) });
		},
		createKbNode(node: KbNode, edges: KbEdge[]) {
			return request<void>("/api/admin/kb/nodes", { method: "POST", body: withActor({ node, edges }) });
		},
		deleteKbNode(id: string) {
			return request<void>(`/api/admin/kb/nodes/${encodeURIComponent(id)}`, { method: "DELETE", body: withActor({}) });
		},
		escalateCrossDept(id: string, depts: DepartmentCode[], by: "ai" | string, reason: string) {
			return request<void>(`/api/admin/tickets/${encodeURIComponent(id)}/cross-dept/escalate`, { method: "POST", body: withActor({ depts, by, reason }) });
		},
		respondCrossDept(id: string, dept: DepartmentCode, decision: "accepted" | "rejected", reason?: string) {
			return request<void>(`/api/admin/tickets/${encodeURIComponent(id)}/cross-dept/respond`, { method: "POST", body: withActor({ dept, decision, ...(reason ? { reason } : {}) }) });
		},
		addTask(id: string, task: Task) {
			return request<void>(`/api/admin/tickets/${encodeURIComponent(id)}/tasks`, { method: "POST", body: withActor({ task }) });
		},
		updateTask(id: string, taskId: string, patch: Partial<Task>) {
			return request<void>(`/api/admin/tickets/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}`, { method: "PATCH", body: withActor({ patch }) });
		},
	};
}
