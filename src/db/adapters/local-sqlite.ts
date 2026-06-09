import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createId } from "@/lib/ids";
import { users } from "../schema";
import type { CreateUserInput, DatabaseAdapter, User } from "../types";

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
		`);
		this.db = drizzle(sqlite);
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
}
