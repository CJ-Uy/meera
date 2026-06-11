import type { users } from "./schema";
import type { AdminDataSource, TicketPatch } from "@/features/admin/store/data-source";
import type { AdminSnapshot, DemoTicket } from "@/features/admin/types";

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
	loadAdminSnapshot(): Promise<AdminSnapshot>;
	/** Persist a Meera-generated support ticket (and its conversation) created from a student chat. */
	createTicket(ticket: DemoTicket): Promise<{ id: string }>;
	claimTicket: AdminDataSource["claimTicket"];
	releaseTicket: AdminDataSource["releaseTicket"];
	addNote: AdminDataSource["addNote"];
	setSeverity: AdminDataSource["setSeverity"];
	setComplexity: AdminDataSource["setComplexity"];
	updateTicket(id: string, patch: TicketPatch): Promise<void>;
	deleteTicket: AdminDataSource["deleteTicket"];
	resolveTicket: AdminDataSource["resolveTicket"];
	ingestKb: AdminDataSource["ingestKb"];
	createKbNode: AdminDataSource["createKbNode"];
	deleteKbNode: AdminDataSource["deleteKbNode"];
	escalateCrossDept: AdminDataSource["escalateCrossDept"];
	respondCrossDept: AdminDataSource["respondCrossDept"];
	addTask: AdminDataSource["addTask"];
	updateTask: AdminDataSource["updateTask"];
	seedAdminSnapshot(snapshot: AdminSnapshot): Promise<void>;
}
