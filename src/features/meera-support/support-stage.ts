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
 *   0 Ready · 1 Student heard · 2 Researched · 3 Diagnosed · 4 Done (ticket filed OR self-resolved).
 * `damage` flags a transient setback (a failed send) so the meter can shake; `fixed` marks the done
 * state; `resolution` distinguishes a filed ticket from a self-service fix that needs no ticket so the
 * UI can still say "you're done" when no ticket exists. `activeDepartments` is the KB(s) Meera engaged.
 */
export type CaseResolution = "ticket" | "self-serve" | null;

export type CaseStage = {
	stage: 0 | 1 | 2 | 3 | 4;
	damage: boolean;
	fixed: boolean;
	resolution: CaseResolution;
	activeDepartments: string[];
};

/** Departments whose knowledge bases the case meter surfaces, in display order. */
export const CASE_DEPARTMENTS = ["IT", "Registrar", "Finance", "Health", "Student Services"] as const;

// Heuristic for "Meera is handing off" language. Avoids bare department codes like "IT" because, case-
// insensitively, they collide with common words (e.g. the pronoun "it").
const ROUTING_SIGNAL = /(rout|escalat|\boffice\b|\bstaff\b|registrar|finance|billing|department|campus health|student services)/i;

// Strong closing language that means Meera believes the issue is solved without filing a ticket.
const RESOLUTION_SIGNAL =
	/(all set|glad i could help|glad to help|happy i could help|hope (that|this) helps|that should (fix|resolve|sort|do it)|should be (good to go|all set|resolved|fixed|working)|is there anything else|anything else i can help|you'?re good to go|problem solved|that did the trick|no ticket needed|you should be able to|that resolves it|reach out again if)/i;

const DEPARTMENT_KEYWORDS: { dept: string; match: RegExp }[] = [
	{ dept: "IT", match: /(wi-?fi|password|log ?in|laptop|network|printer|\bdevice\b|portal|account|internet|computer|\bemail\b|outage|\bvpn\b|software|browser)/i },
	{ dept: "Registrar", match: /(registrar|enroll|enrol|registration|\bhold\b|\bgrade|transcript|\bcourse\b|\bclass\b|section|prerequisite|enlist)/i },
	{ dept: "Finance", match: /(financ|billing|payment|tuition|\bfee\b|bursar|balance|invoice|refund|\bpaid\b|\bpay\b|charge)/i },
	{ dept: "Health", match: /(medical|\bhealth\b|clinic|appointment|certificate|\bsick\b|\bnurse\b|\bdoctor\b)/i },
	{ dept: "Student Services", match: /(student services|\bid card\b|facilit|\bdorm\b|housing|campus life|locker)/i },
];

const OFFICE_TO_CASE_DEPARTMENT: Record<string, string> = {
	IT: "IT",
	Registrar: "Registrar",
	"Finance/Billing": "Finance",
	"Medical/Campus Health": "Health",
	"Student Services": "Student Services",
	"General Support": "Student Services",
};

function activeDepartmentsFrom(messages: SupportStageMessage[], ticket: SupportTicketResult | null): string[] {
	if (ticket) {
		const mapped = OFFICE_TO_CASE_DEPARTMENT[ticket.office];
		return mapped ? [mapped] : [];
	}
	const text = messages.map((message) => message.content).join(" ");
	return DEPARTMENT_KEYWORDS.filter(({ match }) => match.test(text)).map(({ dept }) => dept);
}

export function deriveCaseStage({
	messages,
	ticket,
	hasError = false,
}: {
	messages: SupportStageMessage[];
	ticket: SupportTicketResult | null;
	hasError?: boolean;
}): CaseStage {
	const activeDepartments = activeDepartmentsFrom(messages, ticket);
	if (ticket) return { stage: 4, damage: false, fixed: true, resolution: "ticket", activeDepartments };

	const userCount = messages.filter((message) => message.role === "user").length;
	const assistantCount = messages.filter((message) => message.role === "assistant").length;
	const routing = messages.some((message) => message.role === "assistant" && ROUTING_SIGNAL.test(message.content));
	const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
	const resolvedSelfServe = !hasError && userCount >= 1 && Boolean(lastAssistant) && RESOLUTION_SIGNAL.test(lastAssistant!.content);
	if (resolvedSelfServe) return { stage: 4, damage: false, fixed: true, resolution: "self-serve", activeDepartments };

	let stage: CaseStage["stage"] = 0;
	if (userCount >= 1) stage = 1;
	if (assistantCount >= 1) stage = 2;
	if (assistantCount >= 2 || routing) stage = 3;

	return { stage, damage: hasError, fixed: false, resolution: null, activeDepartments };
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
