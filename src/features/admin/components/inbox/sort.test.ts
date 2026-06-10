import { describe, expect, it } from "vitest";
import { compositePriorityScore, sortTickets } from "@/features/admin/components/inbox/sort";
import type { DemoTicket } from "@/features/admin/types";

function ticket(overrides: Partial<DemoTicket>): DemoTicket {
	return {
		id: "AIC-test",
		title: "Test ticket",
		student: "student@example.edu",
		ownerDept: "IT",
		tag: "Network",
		severity: "Low",
		complexity: "High",
		status: "New",
		createdAt: 0,
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

describe("admin inbox sorting", () => {
	it("scores high severity and low complexity above equally severe harder work", () => {
		const quickWin = ticket({ severity: "High", complexity: "Low" });
		const harder = ticket({ severity: "High", complexity: "High" });

		expect(compositePriorityScore(quickWin)).toBeGreaterThan(compositePriorityScore(harder));
	});

	it("sorts composite do-first by severity weight, then lower complexity", () => {
		const sorted = sortTickets([
			ticket({ id: "medium-low", severity: "Medium", complexity: "Low", createdAt: 3 }),
			ticket({ id: "high-high", severity: "High", complexity: "High", createdAt: 2 }),
			ticket({ id: "high-low", severity: "High", complexity: "Low", createdAt: 1 }),
			ticket({ id: "low-low", severity: "Low", complexity: "Low", createdAt: 4 }),
		], "do-first");

		expect(sorted.map((item) => item.id)).toEqual(["high-low", "high-high", "medium-low", "low-low"]);
	});
});
