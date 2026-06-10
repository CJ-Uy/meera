import { DEPARTMENT_CODES, type Admin, type AdminNote, type AdminSnapshot, type Complexity, type DepartmentCode, type DemoTicket, type KbEdge, type KbNode, type Severity, type Task } from "@/features/admin/types";
import type { TicketPatch } from "@/features/admin/store/data-source";

export type AdminStoreState = AdminSnapshot & {
	activeDepartment: DepartmentCode;
	actingAdminId: string | null;
	selectedTicketId: string | null;
	loading: boolean;
};

export type AdminAction =
	| { type: "load"; snapshot: AdminSnapshot }
	| { type: "setDepartment"; department: DepartmentCode }
	| { type: "setActingAdmin"; adminId: string }
	| { type: "selectTicket"; ticketId: string }
	| { type: "claimTicket"; id: string; adminId: string }
	| { type: "releaseTicket"; id: string }
	| { type: "addNote"; id: string; note: AdminNote }
	| { type: "setSeverity"; id: string; severity: Severity }
	| { type: "setComplexity"; id: string; complexity: Complexity }
	| { type: "updateTicket"; id: string; patch: TicketPatch }
	| { type: "resolveTicket"; id: string }
	| { type: "ingestKb"; node: KbNode }
	| { type: "createKbNode"; node: KbNode; edges: KbEdge[] }
	| { type: "deleteKbNode"; id: string }
	| { type: "escalateCrossDept"; id: string; depts: DepartmentCode[]; by: "ai" | string; reason: string }
	| { type: "respondCrossDept"; id: string; dept: DepartmentCode; decision: "accepted" | "rejected"; reason?: string }
	| { type: "addTask"; id: string; task: Task }
	| { type: "updateTask"; id: string; taskId: string; patch: Partial<Task> };

export const initialAdminStoreState: AdminStoreState = {
	admins: [],
	tickets: [],
	kb: { nodes: [], edges: [] },
	activeDepartment: "IT",
	actingAdminId: null,
	selectedTicketId: null,
	loading: true,
};

function adminsForDepartment(admins: Admin[], department: DepartmentCode) {
	return admins.filter((admin) => admin.dept === department);
}

function ticketVisibleInDepartment(ticket: DemoTicket, department: DepartmentCode) {
	return ticket.ownerDept === department || Boolean(ticket.cross?.participants.some((participant) => participant.dept === department));
}

function firstTicketId(tickets: DemoTicket[], department: DepartmentCode) {
	return tickets.find((ticket) => ticketVisibleInDepartment(ticket, department) && ticket.status !== "Resolved")?.id ?? tickets.find((ticket) => ticketVisibleInDepartment(ticket, department))?.id ?? null;
}

function withTicket(tickets: DemoTicket[], id: string, update: (ticket: DemoTicket) => DemoTicket) {
	return tickets.map((ticket) => (ticket.id === id ? update(ticket) : ticket));
}

function normalizeCrossActive(ticket: DemoTicket): DemoTicket {
	if (!ticket.cross) return ticket;
	const accepted = ticket.cross.participants.filter((participant) => participant.decision === "accepted");
	return {
		...ticket,
		cross: {
			...ticket.cross,
			active: accepted.length > 1 || ticket.cross.active,
		},
	};
}

export function adminReducer(state: AdminStoreState, action: AdminAction): AdminStoreState {
	switch (action.type) {
		case "load": {
			const activeDepartment = DEPARTMENT_CODES.includes(state.activeDepartment) ? state.activeDepartment : "IT";
			const actingAdminId = adminsForDepartment(action.snapshot.admins, activeDepartment).at(0)?.id ?? null;
			return {
				...action.snapshot,
				activeDepartment,
				actingAdminId,
				selectedTicketId: firstTicketId(action.snapshot.tickets, activeDepartment),
				loading: false,
			};
		}
		case "setDepartment": {
			return {
				...state,
				activeDepartment: action.department,
				actingAdminId: adminsForDepartment(state.admins, action.department).at(0)?.id ?? null,
				selectedTicketId: firstTicketId(state.tickets, action.department),
			};
		}
		case "setActingAdmin":
			return { ...state, actingAdminId: action.adminId };
		case "selectTicket":
			return { ...state, selectedTicketId: action.ticketId };
		case "claimTicket":
			return { ...state, tickets: withTicket(state.tickets, action.id, (ticket) => ({ ...ticket, claimedBy: action.adminId, status: ticket.status === "New" ? "In progress" : ticket.status })) };
		case "releaseTicket":
			return { ...state, tickets: withTicket(state.tickets, action.id, (ticket) => ({ ...ticket, claimedBy: null })) };
		case "addNote":
			return { ...state, tickets: withTicket(state.tickets, action.id, (ticket) => ({ ...ticket, notes: [...ticket.notes, action.note] })) };
		case "setSeverity":
			return { ...state, tickets: withTicket(state.tickets, action.id, (ticket) => ({ ...ticket, severity: action.severity, edited: true })) };
		case "setComplexity":
			return { ...state, tickets: withTicket(state.tickets, action.id, (ticket) => ({ ...ticket, complexity: action.complexity, edited: true })) };
		case "updateTicket":
			return { ...state, tickets: withTicket(state.tickets, action.id, (ticket) => ({ ...ticket, ...action.patch, edited: true })) };
		case "resolveTicket":
			return { ...state, tickets: withTicket(state.tickets, action.id, (ticket) => ({ ...ticket, status: "Resolved" })) };
		case "ingestKb":
			return {
				...state,
				kb: { ...state.kb, nodes: [...state.kb.nodes, action.node] },
				tickets: withTicket(state.tickets, action.node.meta?.sourceTicketId ?? action.node.meta?.sourceTicket ?? "", (ticket) => ({ ...ticket, kbIngested: true })),
			};
		case "createKbNode":
			return { ...state, kb: { nodes: [...state.kb.nodes, action.node], edges: [...state.kb.edges, ...action.edges] } };
		case "deleteKbNode":
			return { ...state, kb: { nodes: state.kb.nodes.filter((node) => node.id !== action.id), edges: state.kb.edges.filter((edge) => edge.from !== action.id && edge.to !== action.id) } };
		case "escalateCrossDept":
			return {
				...state,
				tickets: withTicket(state.tickets, action.id, (ticket) =>
					normalizeCrossActive({
						...ticket,
						cross: {
							initiatedBy: action.by,
							participants: Array.from(new Set([ticket.ownerDept, ...action.depts])).map((dept) => ({
								dept,
								decision: dept === ticket.ownerDept ? "accepted" : "pending",
								reason: dept === ticket.ownerDept ? undefined : action.reason,
							})),
							active: false,
							tasks: ticket.cross?.tasks ?? [],
						},
					}),
				),
			};
		case "respondCrossDept":
			return {
				...state,
				tickets: withTicket(state.tickets, action.id, (ticket) => {
					if (!ticket.cross) return ticket;
					let participants = ticket.cross.participants.map((participant) => (participant.dept === action.dept ? { ...participant, decision: action.decision, reason: action.reason } : participant));
					const accepted = participants.filter((participant) => participant.decision === "accepted");
					const pending = participants.filter((participant) => participant.decision === "pending");
					if (action.decision === "rejected" && accepted.length === 1 && pending.length === 1) {
						participants = participants.map((participant) => (participant.decision === "pending" ? { ...participant, decision: "accepted" } : participant));
					}
					const next = { ...ticket, cross: { ...ticket.cross, participants, active: participants.filter((participant) => participant.decision === "accepted").length > 1 } };
					return next;
				}),
			};
		case "addTask":
			return { ...state, tickets: withTicket(state.tickets, action.id, (ticket) => (ticket.cross ? { ...ticket, cross: { ...ticket.cross, tasks: [...ticket.cross.tasks, action.task] } } : ticket)) };
		case "updateTask":
			return {
				...state,
				tickets: withTicket(state.tickets, action.id, (ticket) =>
					ticket.cross
						? {
								...ticket,
								cross: {
									...ticket.cross,
									tasks: ticket.cross.tasks.map((task) => (task.id === action.taskId ? { ...task, ...action.patch } : task)),
								},
							}
						: ticket,
				),
			};
		default:
			return state;
	}
}
