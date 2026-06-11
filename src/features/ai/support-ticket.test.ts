import { describe, expect, it } from "vitest";
import {
	coerceSupportTicketArgs,
	officeToDept,
	parseSupportTicketArgs,
	priorityToSeverity,
	stripTicketBlock,
	supportTicketToDemoTicket,
} from "@/features/ai/support-ticket";
import type { SupportOffice, SupportPriority } from "@/features/ai/ai-types";

describe("office and priority mapping", () => {
	const officeCases: [SupportOffice, string][] = [
		["IT", "IT"],
		["Registrar", "REG"],
		["Finance/Billing", "FIN"],
		["Medical/Campus Health", "MED"],
		["Student Services", "SS"],
		["General Support", "SS"],
	];
	it.each(officeCases)("maps office %s to dept %s", (office, dept) => {
		expect(officeToDept(office)).toBe(dept);
	});

	const priorityCases: [SupportPriority, string][] = [
		["Low", "Low"],
		["Normal", "Medium"],
		["High", "High"],
		["Critical", "Critical"],
	];
	it.each(priorityCases)("maps priority %s to severity %s", (priority, severity) => {
		expect(priorityToSeverity(priority)).toBe(severity);
	});
});

describe("coerceSupportTicketArgs", () => {
	it("returns null without an issue summary", () => {
		expect(coerceSupportTicketArgs({ responsibleOffice: "IT" })).toBeNull();
	});

	it("defaults unknown office/priority to General Support / Normal", () => {
		const args = coerceSupportTicketArgs({ responsibleOffice: "Bursar", priority: "Urgent", issueSummary: "Help" });
		expect(args?.responsibleOffice).toBe("General Support");
		expect(args?.priority).toBe("Normal");
	});

	it("normalizes array fields and trims strings", () => {
		const args = coerceSupportTicketArgs({
			responsibleOffice: "Finance/Billing",
			issueSummary: "  Payment not reflected  ",
			collectedInformation: ["Paid via GCash", "", 5],
		});
		expect(args?.issueSummary).toBe("Payment not reflected");
		expect(args?.collectedInformation).toEqual(["Paid via GCash"]);
	});
});

describe("parseSupportTicketArgs", () => {
	it("reads a native create_support_ticket tool call", () => {
		const args = parseSupportTicketArgs(
			[{ function: { name: "create_support_ticket", arguments: JSON.stringify({ responsibleOffice: "Registrar", issueSummary: "Hold blocks enrollment" }) } }],
			null,
		);
		expect(args?.responsibleOffice).toBe("Registrar");
	});

	it("falls back to a fenced ticket block in the content", () => {
		const content = "Sure, I'll escalate this.\n```ticket\n{\"responsibleOffice\":\"IT\",\"issueSummary\":\"Wi-Fi down\"}\n```";
		const args = parseSupportTicketArgs([], content);
		expect(args?.responsibleOffice).toBe("IT");
	});

	it("returns null when neither a tool call nor a block is present", () => {
		expect(parseSupportTicketArgs([], "Just a normal reply.")).toBeNull();
	});
});

describe("stripTicketBlock", () => {
	it("removes the fenced ticket block from student-facing text", () => {
		const content = "Got it.\n```ticket\n{\"responsibleOffice\":\"IT\"}\n```\nStaff will follow up.";
		expect(stripTicketBlock(content)).toBe("Got it.\n\nStaff will follow up.");
	});
});

describe("supportTicketToDemoTicket", () => {
	it("maps a payload onto a persistable DemoTicket and flags General Support triage", () => {
		const args = coerceSupportTicketArgs({
			ticketTitle: "Tuition not reflected",
			responsibleOffice: "General Support",
			category: "Unknown",
			priority: "High",
			issueSummary: "Payment not posted",
			missingInformation: ["Reference number"],
			suggestedStaffAction: "Verify payment record",
			escalationReason: "Payment verification requires staff",
		});
		const ticket = supportTicketToDemoTicket(args!, [
			{ role: "user", content: "I paid but it says unpaid" },
			{ role: "assistant", content: "I'll package this for the bursar." },
		]);

		expect(ticket.ownerDept).toBe("SS");
		expect(ticket.severity).toBe("High");
		expect(ticket.status).toBe("New");
		expect(ticket.missingInformation).toContain("Needs triage");
		expect(ticket.suggestedActions).toContain("Verify payment record");
		expect(ticket.conversation).toHaveLength(2);
		expect(ticket.conversation[1].role).toBe("meera");
	});
});
