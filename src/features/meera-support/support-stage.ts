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
