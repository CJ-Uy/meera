import type { Complexity, DemoTicket, DepartmentCode, Severity } from "@/features/admin/types";

export type InsightsTimeWindow = "today" | "7d" | "30d" | "term";

export type CountDatum = {
	label: string;
	count: number;
};

export type VolumeDatum = {
	date: string;
	label: string;
	opened: number;
	resolved: number;
};

export type HeatmapDatum = {
	severity: Severity;
	complexity: Complexity;
	count: number;
};

export type KbCoverageGap = {
	tag: string;
	count: number;
	avgConfidence: number;
	examples: string[];
};

export type TeamLoadDatum = {
	adminId: string;
	name: string;
	count: number;
};

export type SynthesizedTicketOperations = {
	firstResponseMinutes: number;
	resolutionMinutes: number;
	reopened: boolean;
	handledByAi: boolean;
};

export type InsightsMetrics = {
	window: InsightsTimeWindow;
	department: DepartmentCode;
	ticketCount: number;
	summary: {
		opened: number;
		resolved: number;
		open: number;
		avgFirstResponseMinutes: number;
		avgResolutionMinutes: number;
		deflectionRate: number;
		escalationRate: number;
		reopenRate: number;
		claimed: number;
		unclaimed: number;
	};
	volumeOverTime: VolumeDatum[];
	byTag: CountDatum[];
	byDepartment: CountDatum[];
	severityDistribution: CountDatum[];
	complexityDistribution: CountDatum[];
	severityComplexityHeatmap: HeatmapDatum[];
	severityComplexityMax: number;
	confidenceBuckets: CountDatum[];
	backlogAging: CountDatum[];
	crossDepartmentCount: number;
	kbCoverageGaps: KbCoverageGap[];
	teamLoad: TeamLoadDatum[];
};

const DAY = 24 * 60 * 60 * 1000;
const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];
const COMPLEXITIES: Complexity[] = ["Low", "Medium", "High"];
const CONFIDENCE_BUCKETS = [
	{ label: "0-39", min: 0, max: 39 },
	{ label: "40-59", min: 40, max: 59 },
	{ label: "60-79", min: 60, max: 79 },
	{ label: "80-100", min: 80, max: 100 },
];
const BACKLOG_BUCKETS = ["<1d", "1-3d", "3-7d", "7d+"] as const;

function startOfUtcDay(value: number) {
	const date = new Date(value);
	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function dateKey(value: number) {
	return new Date(startOfUtcDay(value)).toISOString().slice(0, 10);
}

function shortDateLabel(value: number) {
	return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(value);
}

function windowStart(tickets: DemoTicket[], timeWindow: InsightsTimeWindow, asOf: number) {
	const today = startOfUtcDay(asOf);
	if (timeWindow === "today") return today;
	if (timeWindow === "7d") return today - 6 * DAY;
	if (timeWindow === "30d") return today - 29 * DAY;
	return tickets.length > 0 ? Math.min(...tickets.map((ticket) => startOfUtcDay(ticket.createdAt))) : today;
}

function ticketVisibleInDepartment(ticket: DemoTicket, department: DepartmentCode) {
	return ticket.ownerDept === department || Boolean(ticket.cross?.participants.some((participant) => participant.dept === department));
}

function isResolved(ticket: DemoTicket) {
	return ticket.status === "Resolved";
}

function isOpen(ticket: DemoTicket) {
	return !isResolved(ticket);
}

function hashStable(value: string) {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

function avg(values: number[]) {
	if (values.length === 0) return 0;
	return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percentage(numerator: number, denominator: number) {
	return denominator === 0 ? 0 : numerator / denominator;
}

function countBy<T extends string>(items: DemoTicket[], getKey: (ticket: DemoTicket) => T, order?: readonly T[]): CountDatum[] {
	const counts = new Map<T, number>();
	for (const item of items) counts.set(getKey(item), (counts.get(getKey(item)) ?? 0) + 1);
	const labels = order ?? Array.from(counts.keys());
	return labels.map((label) => ({ label, count: counts.get(label) ?? 0 }));
}

function sortedCountBy(items: DemoTicket[], getKey: (ticket: DemoTicket) => string): CountDatum[] {
	return Array.from(items.reduce((counts, ticket) => {
		const key = getKey(ticket);
		counts.set(key, (counts.get(key) ?? 0) + 1);
		return counts;
	}, new Map<string, number>()))
		.map(([label, count]) => ({ label, count }))
		.sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function buildVolume(tickets: DemoTicket[], timeWindow: InsightsTimeWindow, asOf: number): VolumeDatum[] {
	const start = windowStart(tickets, timeWindow, asOf);
	const end = startOfUtcDay(asOf);
	const points = new Map<string, VolumeDatum>();
	for (let day = start; day <= end; day += DAY) {
		points.set(dateKey(day), { date: dateKey(day), label: shortDateLabel(day), opened: 0, resolved: 0 });
	}
	for (const ticket of tickets) {
		const key = dateKey(ticket.createdAt);
		const point = points.get(key);
		if (!point) continue;
		point.opened += 1;
		if (isResolved(ticket)) point.resolved += 1;
	}
	return Array.from(points.values());
}

function buildHeatmap(tickets: DemoTicket[]) {
	const cells: HeatmapDatum[] = [];
	for (const severity of SEVERITIES) {
		for (const complexity of COMPLEXITIES) {
			cells.push({
				severity,
				complexity,
				count: tickets.filter((ticket) => ticket.severity === severity && ticket.complexity === complexity).length,
			});
		}
	}
	return cells;
}

function buildConfidenceBuckets(tickets: DemoTicket[]): CountDatum[] {
	return CONFIDENCE_BUCKETS.map((bucket) => ({
		label: bucket.label,
		count: tickets.filter((ticket) => {
			const confidence = Math.round(ticket.confidence * 100);
			return confidence >= bucket.min && confidence <= bucket.max;
		}).length,
	}));
}

function buildBacklogAging(tickets: DemoTicket[], asOf: number): CountDatum[] {
	const counts: Record<(typeof BACKLOG_BUCKETS)[number], number> = { "<1d": 0, "1-3d": 0, "3-7d": 0, "7d+": 0 };
	for (const ticket of tickets.filter(isOpen)) {
		const ageDays = Math.max(0, (asOf - ticket.createdAt) / DAY);
		if (ageDays < 1) counts["<1d"] += 1;
		else if (ageDays < 3) counts["1-3d"] += 1;
		else if (ageDays < 7) counts["3-7d"] += 1;
		else counts["7d+"] += 1;
	}
	return BACKLOG_BUCKETS.map((label) => ({ label, count: counts[label] }));
}

function buildKbCoverageGaps(tickets: DemoTicket[]): KbCoverageGap[] {
	const groups = new Map<string, DemoTicket[]>();
	for (const ticket of tickets) {
		if (ticket.kbIngested || ticket.confidence >= 0.7) continue;
		groups.set(ticket.tag, [...(groups.get(ticket.tag) ?? []), ticket]);
	}
	return Array.from(groups.entries())
		.map(([tag, group]) => ({
			tag,
			count: group.length,
			avgConfidence: Math.round((group.reduce((sum, ticket) => sum + ticket.confidence, 0) / group.length) * 100),
			examples: group.slice(0, 3).map((ticket) => ticket.title),
		}))
		.sort((left, right) => right.count - left.count || left.avgConfidence - right.avgConfidence);
}

function buildTeamLoad(tickets: DemoTicket[]): TeamLoadDatum[] {
	const counts = new Map<string, number>();
	for (const ticket of tickets) {
		const adminId = ticket.claimedBy ?? "unclaimed";
		counts.set(adminId, (counts.get(adminId) ?? 0) + 1);
	}
	return Array.from(counts.entries())
		.map(([adminId, count]) => ({ adminId, name: adminId === "unclaimed" ? "Unclaimed" : adminId, count }))
		.sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

export function filterTicketsByWindow(tickets: DemoTicket[], department: DepartmentCode, timeWindow: InsightsTimeWindow, asOf = Date.now()): DemoTicket[] {
	const visibleTickets = tickets.filter((ticket) => ticketVisibleInDepartment(ticket, department));
	const start = windowStart(visibleTickets, timeWindow, asOf);
	return visibleTickets.filter((ticket) => ticket.createdAt >= start && ticket.createdAt <= asOf);
}

export function synthesizeTicketOperations(ticket: DemoTicket): SynthesizedTicketOperations {
	const hash = hashStable(`${ticket.id}:${ticket.createdAt}`);
	const severityWeight = SEVERITIES.indexOf(ticket.severity) + 1;
	const complexityWeight = COMPLEXITIES.indexOf(ticket.complexity) + 1;
	const firstResponseMinutes = 4 + (hash % 23) + complexityWeight * 3;
	const resolutionMinutes = firstResponseMinutes + 45 + ((hash >>> 4) % 240) + severityWeight * 18 + complexityWeight * 22;
	const reopenRisk = Math.max(4, 18 - Math.round(ticket.confidence * 12) + complexityWeight * 2);
	return {
		firstResponseMinutes,
		resolutionMinutes,
		reopened: isResolved(ticket) && (hash % 100) < reopenRisk,
		handledByAi: isResolved(ticket) && !ticket.claimedBy && !ticket.cross && ticket.confidence >= 0.78,
	};
}

export function buildInsightsMetrics(tickets: DemoTicket[], department: DepartmentCode, timeWindow: InsightsTimeWindow, asOf = Date.now()): InsightsMetrics {
	const scopedTickets = filterTicketsByWindow(tickets, department, timeWindow, asOf);
	const operations = scopedTickets.map((ticket) => ({ ticket, operations: synthesizeTicketOperations(ticket) }));
	const resolvedTickets = operations.filter(({ ticket }) => isResolved(ticket));
	const opened = scopedTickets.length;
	const resolved = resolvedTickets.length;
	const heatmap = buildHeatmap(scopedTickets);
	const claimed = scopedTickets.filter((ticket) => ticket.claimedBy).length;

	return {
		window: timeWindow,
		department,
		ticketCount: scopedTickets.length,
		summary: {
			opened,
			resolved,
			open: opened - resolved,
			avgFirstResponseMinutes: avg(operations.map(({ operations: item }) => item.firstResponseMinutes)),
			avgResolutionMinutes: avg(resolvedTickets.map(({ operations: item }) => item.resolutionMinutes)),
			deflectionRate: percentage(operations.filter(({ operations: item }) => item.handledByAi).length, opened),
			escalationRate: percentage(scopedTickets.filter(isOpen).length, opened),
			reopenRate: percentage(operations.filter(({ operations: item }) => item.reopened).length, resolved),
			claimed,
			unclaimed: opened - claimed,
		},
		volumeOverTime: buildVolume(scopedTickets, timeWindow, asOf),
		byTag: sortedCountBy(scopedTickets, (ticket) => ticket.tag),
		byDepartment: sortedCountBy(scopedTickets, (ticket) => ticket.ownerDept),
		severityDistribution: countBy(scopedTickets, (ticket) => ticket.severity, SEVERITIES),
		complexityDistribution: countBy(scopedTickets, (ticket) => ticket.complexity, COMPLEXITIES),
		severityComplexityHeatmap: heatmap,
		severityComplexityMax: Math.max(0, ...heatmap.map((cell) => cell.count)),
		confidenceBuckets: buildConfidenceBuckets(scopedTickets),
		backlogAging: buildBacklogAging(scopedTickets, asOf),
		crossDepartmentCount: scopedTickets.filter((ticket) => ticket.cross).length,
		kbCoverageGaps: buildKbCoverageGaps(scopedTickets),
		teamLoad: buildTeamLoad(scopedTickets),
	};
}
