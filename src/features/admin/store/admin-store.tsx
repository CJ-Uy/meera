"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { inMemoryAdminDataSource } from "@/features/admin/store/in-memory-source";
import { adminReducer, initialAdminStoreState, type AdminStoreState } from "@/features/admin/store/reducer";
import type { AdminNote, Complexity, DepartmentCode, KbEdge, KbNode, Severity, Task } from "@/features/admin/types";
import type { TicketPatch } from "@/features/admin/store/data-source";

type AdminStoreContextValue = AdminStoreState & {
	setDepartment: (department: DepartmentCode) => void;
	setActingAdmin: (adminId: string) => void;
	selectTicket: (ticketId: string) => void;
	claimTicket: (id: string, adminId: string) => Promise<void>;
	releaseTicket: (id: string) => Promise<void>;
	addNote: (id: string, text: string) => Promise<void>;
	setSeverity: (id: string, severity: Severity) => Promise<void>;
	setComplexity: (id: string, complexity: Complexity) => Promise<void>;
	updateTicket: (id: string, patch: TicketPatch) => Promise<void>;
	resolveTicket: (id: string) => Promise<void>;
	ingestKb: (node: KbNode) => Promise<void>;
	createKbNode: (node: KbNode, edges: KbEdge[]) => Promise<void>;
	deleteKbNode: (id: string) => Promise<void>;
	escalateCrossDept: (id: string, depts: DepartmentCode[], by: "ai" | string, reason: string) => Promise<void>;
	respondCrossDept: (id: string, dept: DepartmentCode, decision: "accepted" | "rejected", reason?: string) => Promise<void>;
	addTask: (id: string, task: Task) => Promise<void>;
	updateTask: (id: string, taskId: string, patch: Partial<Task>) => Promise<void>;
};

const AdminStoreContext = createContext<AdminStoreContextValue | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(adminReducer, initialAdminStoreState);

	useEffect(() => {
		let mounted = true;
		inMemoryAdminDataSource.loadSnapshot().then((snapshot) => {
			if (mounted) dispatch({ type: "load", snapshot });
		});
		return () => {
			mounted = false;
		};
	}, []);

	const value = useMemo<AdminStoreContextValue>(() => ({
		...state,
		setDepartment: (department) => dispatch({ type: "setDepartment", department }),
		setActingAdmin: (adminId) => dispatch({ type: "setActingAdmin", adminId }),
		selectTicket: (ticketId) => dispatch({ type: "selectTicket", ticketId }),
		claimTicket: async (id, adminId) => {
			await inMemoryAdminDataSource.claimTicket(id, adminId);
			dispatch({ type: "claimTicket", id, adminId });
		},
		releaseTicket: async (id) => {
			await inMemoryAdminDataSource.releaseTicket(id);
			dispatch({ type: "releaseTicket", id });
		},
		addNote: async (id, text) => {
			const note: AdminNote = { id: `note-${Date.now()}`, adminId: state.actingAdminId ?? "unknown", text, at: Date.now() };
			await inMemoryAdminDataSource.addNote(id, note);
			dispatch({ type: "addNote", id, note });
		},
		setSeverity: async (id, severity) => {
			await inMemoryAdminDataSource.setSeverity(id, severity);
			dispatch({ type: "setSeverity", id, severity });
		},
		setComplexity: async (id, complexity) => {
			await inMemoryAdminDataSource.setComplexity(id, complexity);
			dispatch({ type: "setComplexity", id, complexity });
		},
		updateTicket: async (id, patch) => {
			await inMemoryAdminDataSource.updateTicket(id, patch);
			dispatch({ type: "updateTicket", id, patch });
		},
		resolveTicket: async (id) => {
			await inMemoryAdminDataSource.resolveTicket(id);
			dispatch({ type: "resolveTicket", id });
		},
		ingestKb: async (node) => {
			await inMemoryAdminDataSource.ingestKb(node);
			dispatch({ type: "ingestKb", node });
		},
		createKbNode: async (node, edges) => {
			await inMemoryAdminDataSource.createKbNode(node, edges);
			dispatch({ type: "createKbNode", node, edges });
		},
		deleteKbNode: async (id) => {
			await inMemoryAdminDataSource.deleteKbNode(id);
			dispatch({ type: "deleteKbNode", id });
		},
		escalateCrossDept: async (id, depts, by, reason) => {
			await inMemoryAdminDataSource.escalateCrossDept(id, depts, by, reason);
			dispatch({ type: "escalateCrossDept", id, depts, by, reason });
		},
		respondCrossDept: async (id, dept, decision, reason) => {
			await inMemoryAdminDataSource.respondCrossDept(id, dept, decision, reason);
			dispatch({ type: "respondCrossDept", id, dept, decision, reason });
		},
		addTask: async (id, task) => {
			await inMemoryAdminDataSource.addTask(id, task);
			dispatch({ type: "addTask", id, task });
		},
		updateTask: async (id, taskId, patch) => {
			await inMemoryAdminDataSource.updateTask(id, taskId, patch);
			dispatch({ type: "updateTask", id, taskId, patch });
		},
	}), [state]);

	return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export function useAdmin() {
	const context = useContext(AdminStoreContext);
	if (!context) throw new Error("useAdmin must be used within AdminStoreProvider");
	return context;
}

export function useActingAdmin() {
	const admin = useAdmin();
	return admin.admins.find((person) => person.id === admin.actingAdminId) ?? null;
}
