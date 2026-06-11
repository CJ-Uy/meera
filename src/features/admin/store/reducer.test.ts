import { describe, expect, it } from "vitest";
import { adminReducer, initialAdminStoreState } from "@/features/admin/store/reducer";
import type { AdminStoreState } from "@/features/admin/store/reducer";
import type { Admin, DemoTicket, KbNode } from "@/features/admin/types";

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

describe("admin reducer ticket deletion", () => {
	it("removes the selected ticket and selects the next visible ticket", () => {
		const state: AdminStoreState = {
			...initialAdminStoreState,
			activeDepartment: "IT",
			selectedTicketId: "AIC-1",
			tickets: [
				ticket({ id: "AIC-1", ownerDept: "IT" }),
				ticket({ id: "AIC-2", ownerDept: "IT", status: "New" }),
			],
			loading: false,
		};

		const next = adminReducer(state, { type: "deleteTicket", id: "AIC-1" });

		expect(next.tickets.map((item) => item.id)).toEqual(["AIC-2"]);
		expect(next.selectedTicketId).toBe("AIC-2");
	});
});

describe("admin reducer cross-department flow", () => {
	it("auto-accepts the last pending department after an AI-initiated ticket is rejected by the other targets", () => {
		const state: AdminStoreState = {
			...initialAdminStoreState,
			tickets: [ticket()],
			loading: false,
		};
		const escalated = adminReducer(state, { type: "escalateCrossDept", id: "AIC-TEST", depts: ["REG", "MED", "SS"], by: "ai", reason: "Needs multi-office review" });
		const afterFirstReject = adminReducer(escalated, { type: "respondCrossDept", id: "AIC-TEST", dept: "REG", decision: "rejected", reason: "Not a records issue" });

		const next = adminReducer(afterFirstReject, { type: "respondCrossDept", id: "AIC-TEST", dept: "MED", decision: "rejected", reason: "No clinical action needed" });

		const participants = next.tickets[0]?.cross?.participants;
		expect(participants).toEqual([
			{ dept: "IT", decision: "accepted" },
			{ dept: "REG", decision: "rejected", reason: "Not a records issue" },
			{ dept: "MED", decision: "rejected", reason: "No clinical action needed" },
			{ dept: "SS", decision: "accepted", reason: "Needs multi-office review" },
		]);
		expect(next.tickets[0]?.cross?.active).toBe(true);
	});

	it("activates an admin-initiated ticket when one target department accepts", () => {
		const admins: Admin[] = [{ id: "admin-reg-ana", name: "Ana Reyes", dept: "REG", role: "Registrar Coordinator" }];
		const state: AdminStoreState = {
			...initialAdminStoreState,
			admins,
			tickets: [ticket({ ownerDept: "IT" })],
			loading: false,
		};
		const escalated = adminReducer(state, { type: "escalateCrossDept", id: "AIC-TEST", depts: ["FIN"], by: "admin-reg-ana", reason: "Finance needs to confirm hold status" });

		const next = adminReducer(escalated, { type: "respondCrossDept", id: "AIC-TEST", dept: "FIN", decision: "accepted" });

		expect(next.tickets[0]?.cross?.participants).toEqual([
			{ dept: "REG", decision: "accepted" },
			{ dept: "FIN", decision: "accepted", reason: "Finance needs to confirm hold status" },
		]);
		expect(next.tickets[0]?.cross?.active).toBe(true);
	});
});
