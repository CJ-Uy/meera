import { getOptionalCloudflareEnv } from "@/server/cloudflare";
import { getAppEnv, type AppEnv } from "@/server/env";
import { D1DatabaseAdapter } from "./adapters/d1";
import { SharedApiDatabaseAdapter } from "./adapters/shared-api";
import type { CreateUserInput, DatabaseAdapter, User } from "./types";
import type { TicketPatch } from "@/features/admin/store/data-source";
import type { AdminNote, AdminSnapshot, Complexity, DemoTicket, DepartmentCode, KbEdge, KbNode, Severity, Task } from "@/features/admin/types";

class LazyLocalSqliteDatabaseAdapter implements DatabaseAdapter {
	readonly adapterName = "local-sqlite";
	private adapter?: Promise<DatabaseAdapter>;

	constructor(private readonly sqlitePath: string) {}

	private getAdapter() {
		this.adapter ??= import("./adapters/local-sqlite").then(({ LocalSqliteDatabaseAdapter }) => new LocalSqliteDatabaseAdapter(this.sqlitePath));
		return this.adapter;
	}

	async listUsers(): Promise<User[]> {
		return (await this.getAdapter()).listUsers();
	}

	async createUser(input: CreateUserInput): Promise<User> {
		return (await this.getAdapter()).createUser(input);
	}

	async getUserById(id: string): Promise<User | null> {
		return (await this.getAdapter()).getUserById(id);
	}

	async loadAdminSnapshot(): Promise<AdminSnapshot> {
		return (await this.getAdapter()).loadAdminSnapshot();
	}

	async createTicket(ticket: DemoTicket): Promise<{ id: string }> {
		return (await this.getAdapter()).createTicket(ticket);
	}

	async claimTicket(id: string, adminId: string): Promise<void> {
		return (await this.getAdapter()).claimTicket(id, adminId);
	}

	async releaseTicket(id: string): Promise<void> {
		return (await this.getAdapter()).releaseTicket(id);
	}

	async addNote(id: string, note: AdminNote): Promise<void> {
		return (await this.getAdapter()).addNote(id, note);
	}

	async setSeverity(id: string, severity: Severity): Promise<void> {
		return (await this.getAdapter()).setSeverity(id, severity);
	}

	async setComplexity(id: string, complexity: Complexity): Promise<void> {
		return (await this.getAdapter()).setComplexity(id, complexity);
	}

	async updateTicket(id: string, patch: TicketPatch): Promise<void> {
		return (await this.getAdapter()).updateTicket(id, patch);
	}

	async resolveTicket(id: string): Promise<void> {
		return (await this.getAdapter()).resolveTicket(id);
	}

	async ingestKb(node: KbNode): Promise<void> {
		return (await this.getAdapter()).ingestKb(node);
	}

	async createKbNode(node: KbNode, edges: KbEdge[]): Promise<void> {
		return (await this.getAdapter()).createKbNode(node, edges);
	}

	async deleteKbNode(id: string): Promise<void> {
		return (await this.getAdapter()).deleteKbNode(id);
	}

	async escalateCrossDept(id: string, depts: DepartmentCode[], by: "ai" | string, reason: string): Promise<void> {
		return (await this.getAdapter()).escalateCrossDept(id, depts, by, reason);
	}

	async respondCrossDept(id: string, dept: DepartmentCode, decision: "accepted" | "rejected", reason?: string): Promise<void> {
		return (await this.getAdapter()).respondCrossDept(id, dept, decision, reason);
	}

	async addTask(id: string, task: Task): Promise<void> {
		return (await this.getAdapter()).addTask(id, task);
	}

	async updateTask(id: string, taskId: string, patch: Partial<Task>): Promise<void> {
		return (await this.getAdapter()).updateTask(id, taskId, patch);
	}

	async seedAdminSnapshot(snapshot: AdminSnapshot): Promise<void> {
		return (await this.getAdapter()).seedAdminSnapshot(snapshot);
	}
}

export function getDatabaseAdapterName(env: AppEnv = getAppEnv(), hasD1Binding = Boolean(getOptionalCloudflareEnv()?.DB)) {
	if (env.APP_ENV === "production") return "d1";
	if (env.APP_ENV === "shared") return "shared-api";
	if (hasD1Binding) return "d1";
	return "local-sqlite";
}

export function getDatabaseAdapter(env: AppEnv = getAppEnv()): DatabaseAdapter {
	const adapterName = getDatabaseAdapterName(env);

	if (adapterName === "shared-api") {
		if (!env.SHARED_API_BASE_URL || !env.SHARED_API_TOKEN) throw new Error("Shared database API credentials are not configured.");
		return new SharedApiDatabaseAdapter({ baseUrl: env.SHARED_API_BASE_URL, token: env.SHARED_API_TOKEN });
	}

	if (adapterName === "d1") {
		const binding = getOptionalCloudflareEnv()?.DB;
		if (!binding) throw new Error("Cloudflare D1 binding DB is required for this database mode.");
		return new D1DatabaseAdapter(binding);
	}

	return new LazyLocalSqliteDatabaseAdapter(env.LOCAL_SQLITE_PATH);
}

export type { CreateUserInput, DatabaseAdapter, User } from "./types";
