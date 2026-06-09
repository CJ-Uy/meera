import { getOptionalCloudflareEnv } from "@/server/cloudflare";
import { getAppEnv, type AppEnv } from "@/server/env";
import { D1DatabaseAdapter } from "./adapters/d1";
import { SharedApiDatabaseAdapter } from "./adapters/shared-api";
import type { CreateUserInput, DatabaseAdapter, User } from "./types";

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
