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
	| { type: "deleteTicket"; id: string }
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

function initiatorDepartment(ticket: DemoTicket, state: AdminStoreState, initiatedBy: "ai" | string) {
	if (initiatedBy === "ai") return ticket.ownerDept;
	return state.admins.find((admin) => admin.id === initiatedBy)?.dept ?? ticket.ownerDept;
}

function hasAcceptedParticipantBeyondInitiator(ticket: DemoTicket, state: AdminStoreState, participants = ticket.cross?.participants ?? []) {
	const initiatorDept = ticket.cross ? initiatorDepartment(ticket, state, ticket.cross.initiatedBy) : ticket.ownerDept;
	return participants.some((participant) => participant.dept !== initiatorDept && participant.decision === "accepted");
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
		case "deleteTicket": {
			const tickets = state.tickets.filter((ticket) => ticket.id !== action.id);
			const selectedTicketId = state.selectedTicketId === action.id ? firstTicketId(tickets, state.activeDepartment) : state.selectedTicketId;
			return { ...state, tickets, selectedTicketId };
		}
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
				tickets: withTicket(state.tickets, action.id, (ticket) => {
					const initiatorDept = initiatorDepartment(ticket, state, action.by);
					if (ticket.cross) {
						const existingDepts = new Set(ticket.cross.participants.map((participant) => participant.dept));
						const newParticipants = action.depts
							.filter((dept) => dept !== initiatorDept && !existingDepts.has(dept))
							.map((dept) => ({ dept, decision: "pending" as const, reason: action.reason }));
						if (newParticipants.length === 0) return ticket;
						return {
							...ticket,
							cross: {
								...ticket.cross,
								participants: [...ticket.cross.participants, ...newParticipants],
							},
						};
					}
					const participants = Array.from(new Set([initiatorDept, ...action.depts.filter((dept) => dept !== initiatorDept)])).map((dept) => ({
						dept,
						decision: dept === initiatorDept ? "accepted" as const : "pending" as const,
						...(dept === initiatorDept ? {} : { reason: action.reason }),
					}));
					return {
						...ticket,
						cross: {
							initiatedBy: action.by,
							participants,
							active: false,
							tasks: [],
						},
					};
				}),
			};
		case "respondCrossDept":
			return {
				...state,
				tickets: withTicket(state.tickets, action.id, (ticket) => {
					if (!ticket.cross) return ticket;
					let participants = ticket.cross.participants.map((participant) =>
						participant.dept === action.dept
							? { ...participant, decision: action.decision, reason: action.reason ?? participant.reason }
							: participant,
					);
					const initiatorDept = initiatorDepartment(ticket, state, ticket.cross.initiatedBy);
					const acceptedTargets = participants.filter((participant) => participant.dept !== initiatorDept && participant.decision === "accepted");
					const pendingTargets = participants.filter((participant) => participant.dept !== initiatorDept && participant.decision === "pending");
					const autoAcceptLast = action.decision === "rejected" && acceptedTargets.length === 0 && pendingTargets.length === 1;
					if (autoAcceptLast) {
						participants = participants.map((participant) => (participant.decision === "pending" ? { ...participant, decision: "accepted" } : participant));
					}
					const next = { ...ticket, cross: { ...ticket.cross, participants, active: ticket.cross.active || autoAcceptLast || hasAcceptedParticipantBeyondInitiator(ticket, state, participants) } };
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
