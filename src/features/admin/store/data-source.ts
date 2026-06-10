import type { AdminNote, AdminSnapshot, Complexity, DepartmentCode, DemoTicket, KbEdge, KbNode, Severity, Task } from "@/features/admin/types";

export type TicketPatch = Partial<Omit<DemoTicket, "id" | "notes" | "conversation" | "cross">>;

export interface AdminDataSource {
	loadSnapshot(): Promise<AdminSnapshot>;
	claimTicket(id: string, adminId: string): Promise<void>;
	releaseTicket(id: string): Promise<void>;
	addNote(id: string, note: AdminNote): Promise<void>;
	setSeverity(id: string, severity: Severity): Promise<void>;
	setComplexity(id: string, complexity: Complexity): Promise<void>;
	updateTicket(id: string, patch: TicketPatch): Promise<void>;
	resolveTicket(id: string): Promise<void>;
	ingestKb(node: KbNode): Promise<void>;
	createKbNode(node: KbNode, edges: KbEdge[]): Promise<void>;
	deleteKbNode(id: string): Promise<void>;
	escalateCrossDept(id: string, depts: DepartmentCode[], by: "ai" | string, reason: string): Promise<void>;
	respondCrossDept(id: string, dept: DepartmentCode, decision: "accepted" | "rejected", reason?: string): Promise<void>;
	addTask(id: string, task: Task): Promise<void>;
	updateTask(id: string, taskId: string, patch: Partial<Task>): Promise<void>;
}
