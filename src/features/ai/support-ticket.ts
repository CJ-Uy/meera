import { createId } from "@/lib/ids";
import type { AiChatInputMessage, AiToolCall, SupportOffice, SupportPriority, SupportTicketArgs } from "@/features/ai/ai-types";
import type { ChatMessage, DemoTicket, DepartmentCode, Severity } from "@/features/admin/types";

const SUPPORT_OFFICES: SupportOffice[] = ["IT", "Registrar", "Finance/Billing", "Medical/Campus Health", "Student Services", "General Support"];
const SUPPORT_PRIORITIES: SupportPriority[] = ["Low", "Normal", "High", "Critical"];

const OFFICE_TO_DEPT: Record<SupportOffice, DepartmentCode> = {
	IT: "IT",
	Registrar: "REG",
	"Finance/Billing": "FIN",
	"Medical/Campus Health": "MED",
	"Student Services": "SS",
	// No dedicated triage department in the schema; route the catch-all to Student Services and flag it.
	"General Support": "SS",
};

const PRIORITY_TO_SEVERITY: Record<SupportPriority, Severity> = {
	Low: "Low",
	Normal: "Medium",
	High: "High",
	Critical: "Critical",
};

export function officeToDept(office: SupportOffice): DepartmentCode {
	return OFFICE_TO_DEPT[office];
}

export function priorityToSeverity(priority: SupportPriority): Severity {
	return PRIORITY_TO_SEVERITY[priority];
}

function asStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.map((entry) => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean);
}

function asString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Normalize a loose object (from a tool call or a fenced block) into validated SupportTicketArgs, or null. */
export function coerceSupportTicketArgs(value: unknown): SupportTicketArgs | null {
	if (!value || typeof value !== "object") return null;
	const raw = value as Record<string, unknown>;

	const office = SUPPORT_OFFICES.find((entry) => entry === raw.responsibleOffice) ?? "General Support";
	const issueSummary = asString(raw.issueSummary) ?? asString(raw.studentFacingSummary);
	if (!issueSummary) return null;

	const priority = SUPPORT_PRIORITIES.find((entry) => entry === raw.priority) ?? "Normal";

	return {
		ticketTitle: asString(raw.ticketTitle) ?? issueSummary.slice(0, 80),
		responsibleOffice: office,
		category: asString(raw.category) ?? "General concern",
		priority,
		urgencyReason: asString(raw.urgencyReason),
		studentName: asString(raw.studentName) ?? null,
		studentId: asString(raw.studentId) ?? null,
		studentEmail: asString(raw.studentEmail) ?? null,
		issueSummary,
		collectedInformation: asStringArray(raw.collectedInformation),
		missingInformation: asStringArray(raw.missingInformation),
		guidanceOrTroubleshootingAttempted: asStringArray(raw.guidanceOrTroubleshootingAttempted),
		escalationReason: asString(raw.escalationReason),
		suggestedStaffAction: asString(raw.suggestedStaffAction),
		conversationSummary: asString(raw.conversationSummary),
		studentFacingSummary: asString(raw.studentFacingSummary) ?? issueSummary,
	};
}

function parseToolArguments(args: string | Record<string, unknown> | undefined): unknown {
	if (!args) return null;
	if (typeof args !== "string") return args;
	try {
		return JSON.parse(args);
	} catch {
		return null;
	}
}

const TICKET_BLOCK_PATTERN = /```(?:ticket|json)\s*([\s\S]*?)```/i;

/**
 * Extract a support-ticket payload from a provider response. Prefers a native create_support_ticket
 * tool call (Groq); falls back to a fenced ```ticket / ```json block in the message content so the
 * Workers AI compat path (content-only, no tool calls) still works.
 */
export function parseSupportTicketArgs(toolCalls: AiToolCall[] | undefined, content: string | null | undefined): SupportTicketArgs | null {
	const ticketCall = toolCalls?.find((call) => call.function?.name === "create_support_ticket");
	if (ticketCall) {
		const parsed = coerceSupportTicketArgs(parseToolArguments(ticketCall.function?.arguments));
		if (parsed) return parsed;
	}

	const match = content ? TICKET_BLOCK_PATTERN.exec(content) : null;
	if (match?.[1]) {
		try {
			return coerceSupportTicketArgs(JSON.parse(match[1].trim()));
		} catch {
			return null;
		}
	}
	return null;
}

/** Remove the internal fenced ticket block from a message so the student never sees raw JSON. */
export function stripTicketBlock(content: string): string {
	return content.replace(TICKET_BLOCK_PATTERN, "").replace(/\n{3,}/g, "\n\n").trim();
}

function joinLines(lines: string[] | undefined): string {
	return (lines ?? []).join("\n");
}

/** Map a validated ticket payload (+ the conversation transcript) onto a DemoTicket for persistence. */
export function supportTicketToDemoTicket(args: SupportTicketArgs, messages: AiChatInputMessage[] = []): DemoTicket {
	const dept = officeToDept(args.responsibleOffice);
	const missing = [...(args.missingInformation ?? [])];
	if (args.responsibleOffice === "General Support") {
		missing.push("Needs triage — office not confidently classified.");
	}

	const suggestedActions = [
		args.suggestedStaffAction,
		args.escalationReason ? `Why escalated: ${args.escalationReason}` : undefined,
		args.guidanceOrTroubleshootingAttempted?.length ? `Already tried: ${args.guidanceOrTroubleshootingAttempted.join("; ")}` : undefined,
	].filter((entry): entry is string => Boolean(entry));

	const aiSummary = [args.issueSummary, args.urgencyReason ? `Urgency: ${args.urgencyReason}` : undefined, args.conversationSummary]
		.filter((entry): entry is string => Boolean(entry))
		.join("\n");

	const conversation: ChatMessage[] = messages
		.filter((message) => message.content.trim())
		.map((message) => ({ role: message.role === "assistant" ? "meera" : "student", text: message.content.trim(), at: Date.now() }));

	return {
		id: createId("tkt"),
		title: args.ticketTitle,
		student: args.studentName ?? "Anonymous student",
		ownerDept: dept,
		tag: args.category,
		severity: priorityToSeverity(args.priority),
		complexity: "Medium",
		status: "New",
		createdAt: Date.now(),
		aiSummary,
		collectedInformation: joinLines(args.collectedInformation),
		missingInformation: joinLines(missing),
		suggestedActions,
		confidence: 0.7,
		conversation,
		notes: [],
		claimedBy: null,
		edited: false,
		kbIngested: false,
	};
}
