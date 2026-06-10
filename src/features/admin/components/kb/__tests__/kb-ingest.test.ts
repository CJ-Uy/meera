import { describe, expect, it } from "vitest";
import { buildKbIngestDraft, buildKbNodeFromDraft } from "@/features/admin/components/kb/kb-ingest";
import type { DemoTicket } from "@/features/admin/types";

function ticket(overrides: Partial<DemoTicket> = {}): DemoTicket {
	return {
		id: "AIC-TEST",
		title: "VPN access fails during finals",
		student: "student@example.edu",
		ownerDept: "IT",
		tag: "Network",
		severity: "High",
		complexity: "Low",
		status: "Resolved",
		createdAt: 0,
		aiSummary: "Student cannot connect to campus VPN from off campus.",
		collectedInformation: "Laptop: Windows; Error: MFA timeout.",
		missingInformation: "None for general guidance.",
		suggestedActions: ["Reset MFA enrollment.", "Send VPN troubleshooting steps."],
		confidence: 0.91,
		conversation: [],
		notes: [],
		claimedBy: null,
		edited: false,
		kbIngested: false,
		...overrides,
	};
}

describe("KB ingest mapping", () => {
	it("prefills an editable draft from ticket context", () => {
		const draft = buildKbIngestDraft(ticket());

		expect(draft.label).toBe("VPN access fails during finals");
		expect(draft.body).toContain("Reset MFA enrollment.");
		expect(draft.body).toContain("Send VPN troubleshooting steps.");
		expect(draft.askFor).toBe("None for general guidance.");
		expect(draft.escalateIf).toContain("Student cannot connect");
		expect(draft.kind).toBe("faq");
	});

	it("builds a KbNode with sourceTicketId metadata", () => {
		const node = buildKbNodeFromDraft(ticket(), {
			kind: "procedure",
			label: "VPN recovery steps",
			body: "Reset MFA, then retry VPN.",
			askFor: "Device, error, MFA status",
			escalateIf: "MFA reset does not work",
		});

		expect(node).toMatchObject({
			dept: "IT",
			kind: "procedure",
			label: "VPN recovery steps",
			body: "Reset MFA, then retry VPN.",
			meta: {
				sourceTicketId: "AIC-TEST",
				askFor: "Device, error, MFA status",
				escalateIf: "MFA reset does not work",
			},
		});
	});
});
