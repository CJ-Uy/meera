import { describe, expect, it } from "vitest";
import { adminReducer, initialAdminStoreState } from "@/features/admin/store/reducer";
import type { AdminStoreState } from "@/features/admin/store/reducer";
import type { DemoTicket, KbNode } from "@/features/admin/types";

function ticket(overrides: Partial<DemoTicket> = {}): DemoTicket {
	return {
		id: "AIC-TEST",
		title: "Test ticket",
		student: "student@example.edu",
		ownerDept: "IT",
		tag: "Network",
		severity: "High",
		complexity: "Low",
		status: "Resolved",
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

describe("admin reducer KB ingest", () => {
	it("marks the source ticket as ingested from sourceTicketId metadata", () => {
		const state: AdminStoreState = {
			...initialAdminStoreState,
			tickets: [ticket()],
			loading: false,
		};
		const node: KbNode = {
			id: "kb-AIC-TEST",
			dept: "IT",
			kind: "faq",
			label: "Test KB node",
			body: "Answer",
			meta: { sourceTicketId: "AIC-TEST" },
		};

		const next = adminReducer(state, { type: "ingestKb", node });

		expect(next.tickets[0]?.kbIngested).toBe(true);
		expect(next.kb.nodes).toContainEqual(node);
	});
});
