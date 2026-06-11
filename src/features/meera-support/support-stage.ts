import type { SupportTicketResult } from "@/features/ai/ai-types";

export type SupportStageState = "ready" | "probing" | "routing" | "ticket-created";

export type SupportStageMessage = {
	role: "user" | "assistant";
	content: string;
};

export type SupportStage = {
	state: SupportStageState;
	label: string;
	progress: number;
	activeDepartments: string[];
};

const departments = ["IT", "Registrar", "Finance", "Health", "Student Services"];

function latestText(messages: SupportStageMessage[]) {
	return messages.at(-1)?.content.toLowerCase() ?? "";
}

function departmentsFrom(text: string, ticket: SupportTicketResult | null) {
	const source = `${text} ${ticket?.office ?? ""}`.toLowerCase();
	return departments.filter((department) => source.includes(department.toLowerCase().replace("finance", "finance")) || (department === "Finance" && source.includes("billing")));
}

/**
 * Case-meter progress derived from the live conversation. Mirrors the playful "mound" meter on main,
 * but driven by the real transcript instead of a hardcoded script:
 *   0 Ready · 1 Student heard · 2 Researched · 3 Diagnosed · 4 Case packaged (ticket filed).
 * `damage` flags a transient setback (a failed send) so the meter can shake; `fixed` marks resolution.
 */
export type CaseStage = {
	stage: 0 | 1 | 2 | 3 | 4;
	damage: boolean;
	fixed: boolean;
};

// Heuristic for "Meera is handing off" language. Avoids bare department codes like "IT" because, case-
// insensitively, they collide with common words (e.g. the pronoun "it").
const ROUTING_SIGNAL = /(rout|escalat|\boffice\b|\bstaff\b|registrar|finance|billing|department|campus health|student services)/i;

export function deriveCaseStage({
	messages,
	ticket,
	hasError = false,
}: {
	messages: SupportStageMessage[];
	ticket: SupportTicketResult | null;
	hasError?: boolean;
}): CaseStage {
	if (ticket) return { stage: 4, damage: false, fixed: true };

	const userCount = messages.filter((message) => message.role === "user").length;
	const assistantCount = messages.filter((message) => message.role === "assistant").length;
	const routing = messages.some((message) => message.role === "assistant" && ROUTING_SIGNAL.test(message.content));

	let stage: CaseStage["stage"] = 0;
	if (userCount >= 1) stage = 1;
	if (assistantCount >= 1) stage = 2;
	if (assistantCount >= 2 || routing) stage = 3;

	return { stage, damage: hasError, fixed: false };
}

export function deriveSupportStage({
	messages,
	sending,
	ticket,
}: {
	messages: SupportStageMessage[];
	sending: boolean;
	ticket: SupportTicketResult | null;
}): SupportStage {
	const text = latestText(messages);
	if (ticket) {
		return {
			state: "ticket-created",
			label: "Ticket created",
			progress: 100,
			activeDepartments: departmentsFrom(text, ticket),
		};
	}
	if (text.includes("routing") || text.includes("route") || text.includes("staff review") || text.includes("office")) {
		return { state: "routing", label: "Routing to the right office", progress: 72, activeDepartments: departmentsFrom(text, null) };
	}
	if (sending || messages.some((message) => message.role === "user")) {
		return { state: "probing", label: "Probing for useful details", progress: 42, activeDepartments: departmentsFrom(text, null) };
	}
	return { state: "ready", label: "Ready for student intake", progress: 14, activeDepartments: [] };
}
