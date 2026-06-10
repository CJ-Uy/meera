import { describe, expect, it } from "vitest";
import { buildInsightsMetrics, filterTicketsByWindow, synthesizeTicketOperations } from "@/features/admin/components/insights/insights-metrics";
import type { DemoTicket } from "@/features/admin/types";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 5, 10, 12, 0, 0);

function ticket(overrides: Partial<DemoTicket>): DemoTicket {
	return {
		id: "AIC-test",
		title: "Test ticket",
		student: "student@example.edu",
		ownerDept: "IT",
		tag: "Network",
		severity: "Low",
		complexity: "Low",
		status: "New",
		createdAt: NOW,
		aiSummary: "Summary",
		collectedInformation: "Collected",
		missingInformation: "Missing",
		suggestedActions: ["Review"],
		confidence: 0.9,
		conversation: [],
		notes: [],
		claimedBy: null,
		edited: false,
		kbIngested: false,
		...overrides,
	};
}

describe("insights metrics", () => {
	it("filters tickets by department visibility and selected time window", () => {
		const tickets = [
			ticket({ id: "today", ownerDept: "IT", createdAt: NOW - 2 * 60 * 60 * 1000 }),
			ticket({ id: "week", ownerDept: "IT", createdAt: NOW - 3 * DAY }),
			ticket({ id: "old", ownerDept: "IT", createdAt: NOW - 40 * DAY }),
			ticket({ id: "cross", ownerDept: "FIN", createdAt: NOW - 2 * DAY, cross: { initiatedBy: "ai", active: true, participants: [{ dept: "FIN", decision: "accepted" }, { dept: "IT", decision: "accepted" }], tasks: [] } }),
		];

		expect(filterTicketsByWindow(tickets, "IT", "today", NOW).map((item) => item.id)).toEqual(["today"]);
		expect(filterTicketsByWindow(tickets, "IT", "7d", NOW).map((item) => item.id)).toEqual(["today", "week", "cross"]);
		expect(filterTicketsByWindow(tickets, "IT", "term", NOW).map((item) => item.id)).toEqual(["today", "week", "old", "cross"]);
	});

	it("builds throughput, status, and categorical distributions", () => {
		const metrics = buildInsightsMetrics([
			ticket({ id: "resolved-1", status: "Resolved", severity: "High", complexity: "Low", tag: "Network", confidence: 0.92, kbIngested: true }),
			ticket({ id: "open-1", status: "In progress", severity: "Critical", complexity: "High", tag: "Access", confidence: 0.48, claimedBy: "admin-it-owen" }),
			ticket({ id: "open-2", status: "New", severity: "Medium", complexity: "Low", tag: "Network", confidence: 0.74 }),
		], "IT", "30d", NOW);

		expect(metrics.summary.opened).toBe(3);
		expect(metrics.summary.resolved).toBe(1);
		expect(metrics.summary.escalationRate).toBeCloseTo(2 / 3, 5);
		expect(metrics.summary.deflectionRate).toBeCloseTo(1 / 3, 5);
		expect(metrics.byTag).toEqual([
			{ label: "Network", count: 2 },
			{ label: "Access", count: 1 },
		]);
		expect(metrics.severityDistribution.find((item) => item.label === "Critical")?.count).toBe(1);
		expect(metrics.complexityDistribution.find((item) => item.label === "Low")?.count).toBe(2);
		expect(metrics.confidenceBuckets).toContainEqual({ label: "40-59", count: 1 });
		expect(metrics.teamLoad).toContainEqual({ adminId: "unclaimed", name: "Unclaimed", count: 2 });
	});

	it("fills the severity by complexity heatmap with zero-count buckets", () => {
		const metrics = buildInsightsMetrics([
			ticket({ id: "critical-high", severity: "Critical", complexity: "High" }),
			ticket({ id: "critical-high-2", severity: "Critical", complexity: "High" }),
			ticket({ id: "low-low", severity: "Low", complexity: "Low" }),
		], "IT", "30d", NOW);

		expect(metrics.severityComplexityHeatmap).toContainEqual({ severity: "Critical", complexity: "High", count: 2 });
		expect(metrics.severityComplexityHeatmap).toContainEqual({ severity: "High", complexity: "Medium", count: 0 });
		expect(metrics.severityComplexityMax).toBe(2);
	});

	it("creates deterministic synthesized operational values from stable ticket fields", () => {
		const source = ticket({ id: "stable", createdAt: NOW - DAY, status: "Resolved", confidence: 0.82, severity: "High", complexity: "Medium" });

		expect(synthesizeTicketOperations(source)).toEqual(synthesizeTicketOperations(source));
		expect(synthesizeTicketOperations(source).resolutionMinutes).toBeGreaterThan(synthesizeTicketOperations(source).firstResponseMinutes);
		expect(synthesizeTicketOperations({ ...source, id: "stable-other" })).not.toEqual(synthesizeTicketOperations(source));
	});

	it("builds backlog, knowledge-gap, cross-department, and daily volume metrics", () => {
		const metrics = buildInsightsMetrics([
			ticket({ id: "new", status: "New", createdAt: NOW - 2 * 60 * 60 * 1000, confidence: 0.41, kbIngested: false, tag: "Network" }),
			ticket({ id: "aging", status: "Awaiting student", createdAt: NOW - 5 * DAY, confidence: 0.52, kbIngested: false, tag: "Access" }),
			ticket({ id: "cross", status: "Resolved", createdAt: NOW - DAY, cross: { initiatedBy: "ai", active: true, participants: [{ dept: "IT", decision: "accepted" }, { dept: "REG", decision: "accepted" }], tasks: [] } }),
		], "IT", "7d", NOW);

		expect(metrics.backlogAging).toContainEqual({ label: "<1d", count: 1 });
		expect(metrics.backlogAging).toContainEqual({ label: "3-7d", count: 1 });
		expect(metrics.crossDepartmentCount).toBe(1);
		expect(metrics.kbCoverageGaps.map((gap) => gap.tag)).toEqual(["Network", "Access"]);
		expect(metrics.volumeOverTime.reduce((sum, point) => sum + point.opened, 0)).toBe(3);
		expect(metrics.volumeOverTime.reduce((sum, point) => sum + point.resolved, 0)).toBe(1);
	});
});
