import type { CreateUserInput, DatabaseAdapter, User } from "../types";
import type { TicketPatch } from "@/features/admin/store/data-source";
import type { AdminNote, AdminSnapshot, Complexity, DepartmentCode, KbEdge, KbNode, Severity, Task } from "@/features/admin/types";

type SharedApiOptions = {
	baseUrl: string;
	token: string;
};

export class SharedApiDatabaseAdapter implements DatabaseAdapter {
	readonly adapterName = "shared-api";

	private readonly baseUrl: string;
	private readonly token: string;

	constructor(options: SharedApiOptions) {
		this.baseUrl = options.baseUrl.replace(/\/+$/, "");
		this.token = options.token;
	}

	async listUsers(): Promise<User[]> {
		return this.request<User[]>("/internal/users");
	}

	async createUser(input: CreateUserInput): Promise<User> {
		return this.request<User>("/internal/users", {
			method: "POST",
			body: JSON.stringify(input),
		});
	}

	async getUserById(id: string): Promise<User | null> {
		return this.request<User | null>(`/internal/users/${encodeURIComponent(id)}`);
	}

	async loadAdminSnapshot(): Promise<AdminSnapshot> {
		return this.request<AdminSnapshot>("/internal/admin/snapshot");
	}

	async claimTicket(id: string, adminId: string): Promise<void> {
		await this.request<void>(`/internal/admin/tickets/${encodeURIComponent(id)}/claim`, { method: "POST", body: JSON.stringify({ adminId }) });
	}

	async releaseTicket(id: string): Promise<void> {
		await this.request<void>(`/internal/admin/tickets/${encodeURIComponent(id)}/release`, { method: "POST", body: JSON.stringify({}) });
	}

	async addNote(id: string, note: AdminNote): Promise<void> {
		await this.request<void>(`/internal/admin/tickets/${encodeURIComponent(id)}/notes`, { method: "POST", body: JSON.stringify({ note }) });
	}

	async setSeverity(id: string, severity: Severity): Promise<void> {
		await this.request<void>(`/internal/admin/tickets/${encodeURIComponent(id)}/severity`, { method: "POST", body: JSON.stringify({ severity }) });
	}

	async setComplexity(id: string, complexity: Complexity): Promise<void> {
		await this.request<void>(`/internal/admin/tickets/${encodeURIComponent(id)}/complexity`, { method: "POST", body: JSON.stringify({ complexity }) });
	}

	async updateTicket(id: string, patch: TicketPatch): Promise<void> {
		await this.request<void>(`/internal/admin/tickets/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ patch }) });
	}

	async resolveTicket(id: string): Promise<void> {
		await this.request<void>(`/internal/admin/tickets/${encodeURIComponent(id)}/resolve`, { method: "POST", body: JSON.stringify({}) });
	}

	async ingestKb(node: KbNode): Promise<void> {
		await this.request<void>("/internal/admin/kb/ingest", { method: "POST", body: JSON.stringify({ node }) });
	}

	async createKbNode(node: KbNode, edges: KbEdge[]): Promise<void> {
		await this.request<void>("/internal/admin/kb/nodes", { method: "POST", body: JSON.stringify({ node, edges }) });
	}

	async deleteKbNode(id: string): Promise<void> {
		await this.request<void>(`/internal/admin/kb/nodes/${encodeURIComponent(id)}`, { method: "DELETE" });
	}

	async escalateCrossDept(id: string, depts: DepartmentCode[], by: "ai" | string, reason: string): Promise<void> {
		await this.request<void>(`/internal/admin/tickets/${encodeURIComponent(id)}/cross-dept/escalate`, { method: "POST", body: JSON.stringify({ depts, by, reason }) });
	}

	async respondCrossDept(id: string, dept: DepartmentCode, decision: "accepted" | "rejected", reason?: string): Promise<void> {
		await this.request<void>(`/internal/admin/tickets/${encodeURIComponent(id)}/cross-dept/respond`, { method: "POST", body: JSON.stringify({ dept, decision, reason }) });
	}

	async addTask(id: string, task: Task): Promise<void> {
		await this.request<void>(`/internal/admin/tickets/${encodeURIComponent(id)}/tasks`, { method: "POST", body: JSON.stringify({ task }) });
	}

	async updateTask(id: string, taskId: string, patch: Partial<Task>): Promise<void> {
		await this.request<void>(`/internal/admin/tickets/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}`, { method: "PATCH", body: JSON.stringify({ patch }) });
	}

	async seedAdminSnapshot(snapshot: AdminSnapshot): Promise<void> {
		await this.request<void>("/internal/admin/seed", { method: "POST", body: JSON.stringify({ snapshot }) });
	}

	private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			...init,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.token}`,
				...init.headers,
			},
		});

		if (!response.ok) {
			throw new Error(`Shared database API request failed with HTTP ${response.status}.`);
		}

		if (response.status === 204) return undefined as T;
		return (await response.json()) as T;
	}
}
