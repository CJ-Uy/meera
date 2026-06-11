"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { createConfiguredAdminDataSource } from "@/features/admin/store/source-selection";
import { adminReducer, initialAdminStoreState, type AdminStoreState } from "@/features/admin/store/reducer";
import type { AdminNote, Complexity, DepartmentCode, KbEdge, KbNode, Severity, Task } from "@/features/admin/types";
import type { AdminDataSource, TicketPatch } from "@/features/admin/store/data-source";

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
	deleteTicket: (id: string) => Promise<void>;
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
	const actingAdminIdRef = useRef<string | null>(null);
	const dataSourceRef = useRef<AdminDataSource | null>(null);
	actingAdminIdRef.current = state.actingAdminId;
	dataSourceRef.current ??= createConfiguredAdminDataSource(() => actingAdminIdRef.current);
	const adminDataSource = dataSourceRef.current;

	useEffect(() => {
		let mounted = true;
		adminDataSource.loadSnapshot().then((snapshot) => {
			if (mounted) dispatch({ type: "load", snapshot });
		});
		return () => {
			mounted = false;
		};
	}, [adminDataSource]);

	const value = useMemo<AdminStoreContextValue>(() => ({
		...state,
		setDepartment: (department) => dispatch({ type: "setDepartment", department }),
		setActingAdmin: (adminId) => dispatch({ type: "setActingAdmin", adminId }),
		selectTicket: (ticketId) => dispatch({ type: "selectTicket", ticketId }),
		claimTicket: async (id, adminId) => {
			await adminDataSource.claimTicket(id, adminId);
			dispatch({ type: "claimTicket", id, adminId });
		},
		releaseTicket: async (id) => {
			await adminDataSource.releaseTicket(id);
			dispatch({ type: "releaseTicket", id });
		},
		addNote: async (id, text) => {
			const note: AdminNote = { id: `note-${Date.now()}`, adminId: state.actingAdminId ?? "unknown", text, at: Date.now() };
			await adminDataSource.addNote(id, note);
			dispatch({ type: "addNote", id, note });
		},
		setSeverity: async (id, severity) => {
			await adminDataSource.setSeverity(id, severity);
			dispatch({ type: "setSeverity", id, severity });
		},
		setComplexity: async (id, complexity) => {
			await adminDataSource.setComplexity(id, complexity);
			dispatch({ type: "setComplexity", id, complexity });
		},
		updateTicket: async (id, patch) => {
			await adminDataSource.updateTicket(id, patch);
			dispatch({ type: "updateTicket", id, patch });
		},
		deleteTicket: async (id) => {
			await adminDataSource.deleteTicket(id);
			dispatch({ type: "deleteTicket", id });
		},
		resolveTicket: async (id) => {
			await adminDataSource.resolveTicket(id);
			dispatch({ type: "resolveTicket", id });
		},
		ingestKb: async (node) => {
			await adminDataSource.ingestKb(node);
			dispatch({ type: "ingestKb", node });
		},
		createKbNode: async (node, edges) => {
			await adminDataSource.createKbNode(node, edges);
			dispatch({ type: "createKbNode", node, edges });
		},
		deleteKbNode: async (id) => {
			await adminDataSource.deleteKbNode(id);
			dispatch({ type: "deleteKbNode", id });
		},
		escalateCrossDept: async (id, depts, by, reason) => {
			await adminDataSource.escalateCrossDept(id, depts, by, reason);
			dispatch({ type: "escalateCrossDept", id, depts, by, reason });
		},
		respondCrossDept: async (id, dept, decision, reason) => {
			await adminDataSource.respondCrossDept(id, dept, decision, reason);
			dispatch({ type: "respondCrossDept", id, dept, decision, reason });
		},
		addTask: async (id, task) => {
			await adminDataSource.addTask(id, task);
			dispatch({ type: "addTask", id, task });
		},
		updateTask: async (id, taskId, patch) => {
			await adminDataSource.updateTask(id, taskId, patch);
			dispatch({ type: "updateTask", id, taskId, patch });
		},
	}), [adminDataSource, state]);

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
