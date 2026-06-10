import type { Complexity, DemoTicket, Severity } from "@/features/admin/types";

export type InboxSortMode = "recency" | "severity" | "do-first";

export const severityWeights: Record<Severity, number> = {
	Critical: 4,
	High: 3,
	Medium: 2,
	Low: 1,
};

export const complexityWeights: Record<Complexity, number> = {
	Low: 3,
	Medium: 2,
	High: 1,
};

export function compositePriorityScore(ticket: Pick<DemoTicket, "severity" | "complexity">) {
	return severityWeights[ticket.severity] * 10 + complexityWeights[ticket.complexity];
}

export function compareTicketsByPriority(a: DemoTicket, b: DemoTicket) {
	const priorityDelta = compositePriorityScore(b) - compositePriorityScore(a);
	if (priorityDelta !== 0) return priorityDelta;
	return b.createdAt - a.createdAt;
}

export function sortTickets(tickets: DemoTicket[], mode: InboxSortMode) {
	const sorted = [...tickets];
	if (mode === "severity") {
		return sorted.sort((a, b) => severityWeights[b.severity] - severityWeights[a.severity] || b.createdAt - a.createdAt);
	}
	if (mode === "do-first") {
		return sorted.sort(compareTicketsByPriority);
	}
	return sorted.sort((a, b) => b.createdAt - a.createdAt);
}
