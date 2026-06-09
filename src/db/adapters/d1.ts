import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { createId } from "@/lib/ids";
import * as schema from "../schema";
import { users } from "../schema";
import type { CreateUserInput, DatabaseAdapter, User } from "../types";

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
}
