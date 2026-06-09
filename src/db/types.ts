import type { users } from "./schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type CreateUserInput = {
	email: string;
	name?: string | null;
};

export interface DatabaseAdapter {
	readonly adapterName: string;
	listUsers(): Promise<User[]>;
	createUser(input: CreateUserInput): Promise<User>;
	getUserById(id: string): Promise<User | null>;
}
