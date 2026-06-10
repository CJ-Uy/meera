import type { Admin, AdminNote, ChatMessage, CrossDeptState, DemoTicket, KbEdge, KbNode, Task } from "@/features/admin/types";
import type { TicketPatch } from "@/features/admin/store/data-source";
import type { admins, crossDeptParticipants, kbEdges, kbNodes, tasks, ticketMessages, ticketNotes, tickets } from "./schema";

export type AdminRow = typeof admins.$inferSelect;
export type TicketRow = typeof tickets.$inferSelect;
export type TicketMessageRow = typeof ticketMessages.$inferSelect;
export type TicketNoteRow = typeof ticketNotes.$inferSelect;
export type KbNodeRow = typeof kbNodes.$inferSelect;
export type KbEdgeRow = typeof kbEdges.$inferSelect;
export type CrossDeptParticipantRow = typeof crossDeptParticipants.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;

function parseJson<T>(value: string | null | undefined, fallback: T): T {
	if (!value) return fallback;
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
}

export function serializeSuggestedActions(actions: string[]) {
	return JSON.stringify(actions);
}

export function serializeMeta(meta: Record<string, string> | undefined) {
	return JSON.stringify(meta ?? {});
}

export function ticketUpdateFromPatch(patch: TicketPatch): Partial<typeof tickets.$inferInsert> {
	return {
		...(patch.title === undefined ? {} : { title: patch.title }),
		...(patch.student === undefined ? {} : { student: patch.student }),
		...(patch.ownerDept === undefined ? {} : { ownerDept: patch.ownerDept }),
		...(patch.tag === undefined ? {} : { tag: patch.tag }),
		...(patch.severity === undefined ? {} : { severity: patch.severity }),
		...(patch.complexity === undefined ? {} : { complexity: patch.complexity }),
		...(patch.status === undefined ? {} : { status: patch.status }),
		...(patch.createdAt === undefined ? {} : { createdAt: patch.createdAt }),
		...(patch.aiSummary === undefined ? {} : { aiSummary: patch.aiSummary }),
		...(patch.collectedInformation === undefined ? {} : { collectedInformation: patch.collectedInformation }),
		...(patch.missingInformation === undefined ? {} : { missingInformation: patch.missingInformation }),
		...(patch.suggestedActions === undefined ? {} : { suggestedActions: serializeSuggestedActions(patch.suggestedActions) }),
		...(patch.confidence === undefined ? {} : { confidence: patch.confidence }),
		...(patch.claimedBy === undefined ? {} : { claimedBy: patch.claimedBy }),
		...(patch.edited === undefined ? { edited: true } : { edited: patch.edited }),
		...(patch.kbIngested === undefined ? {} : { kbIngested: patch.kbIngested }),
	};
}

export function messageId(ticketId: string, index: number) {
	return `msg-${ticketId}-${index}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function ticketInsertFromDemo(ticket: DemoTicket): typeof tickets.$inferInsert {
	return {
		id: ticket.id,
		title: ticket.title,
		student: ticket.student,
		ownerDept: ticket.ownerDept,
		tag: ticket.tag,
		severity: ticket.severity,
		complexity: ticket.complexity,
		status: ticket.status,
		createdAt: ticket.createdAt,
		aiSummary: ticket.aiSummary,
		collectedInformation: ticket.collectedInformation,
		missingInformation: ticket.missingInformation,
		suggestedActions: serializeSuggestedActions(ticket.suggestedActions),
		confidence: ticket.confidence,
		claimedBy: ticket.claimedBy,
		edited: ticket.edited,
		kbIngested: ticket.kbIngested,
		crossInitiatedBy: ticket.cross?.initiatedBy ?? null,
		crossActive: ticket.cross?.active ?? false,
	};
}

export function adminFromRow(row: AdminRow): Admin {
	return row;
}

export function messageFromRow(row: TicketMessageRow): ChatMessage {
	return {
		role: row.role,
		text: row.text,
		at: row.at,
	};
}

export function noteFromRow(row: TicketNoteRow): AdminNote {
	return {
		id: row.id,
		adminId: row.adminId,
		text: row.text,
		at: row.at,
	};
}

export function taskFromRow(row: TaskRow): Task {
	return {
		id: row.id,
		title: row.title,
		ownerDept: row.ownerDept,
		...(row.assignee ? { assignee: row.assignee } : {}),
		status: row.status,
		...(row.due === null ? {} : { due: row.due }),
	};
}

export function kbNodeFromRow(row: KbNodeRow): KbNode {
	return {
		id: row.id,
		dept: row.dept as KbNode["dept"],
		kind: row.kind,
		label: row.label,
		...(row.body ? { body: row.body } : {}),
		meta: parseJson<Record<string, string>>(row.meta, {}),
	};
}

export function kbEdgeFromRow(row: KbEdgeRow): KbEdge {
	return {
		id: row.id,
		from: row.fromNodeId,
		to: row.toNodeId,
		relation: row.relation,
	};
}

export function ticketFromRows(
	row: TicketRow,
	messages: ChatMessage[],
	notes: AdminNote[],
	participants: CrossDeptParticipantRow[],
	ticketTasks: Task[],
): DemoTicket {
	const cross: CrossDeptState | undefined = row.crossInitiatedBy
		? {
				initiatedBy: row.crossInitiatedBy,
				participants: participants.map((participant) => ({
					dept: participant.dept,
					decision: participant.decision,
					...(participant.reason ? { reason: participant.reason } : {}),
				})),
				active: row.crossActive,
				tasks: ticketTasks,
			}
		: undefined;

	return {
		id: row.id,
		title: row.title,
		student: row.student,
		ownerDept: row.ownerDept,
		tag: row.tag,
		severity: row.severity,
		complexity: row.complexity,
		status: row.status,
		createdAt: row.createdAt,
		aiSummary: row.aiSummary,
		collectedInformation: row.collectedInformation,
		missingInformation: row.missingInformation,
		suggestedActions: parseJson<string[]>(row.suggestedActions, []),
		confidence: row.confidence,
		conversation: messages,
		notes,
		claimedBy: row.claimedBy,
		edited: row.edited,
		kbIngested: row.kbIngested,
		...(cross ? { cross } : {}),
	};
}
