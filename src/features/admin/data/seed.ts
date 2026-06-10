import { adminDemoFallback } from "@/features/admin/admin-demo-data";
import { DEPARTMENT_CODES, DEPARTMENT_LABELS, type Admin, type AdminSnapshot, type ChatMessage, type Complexity, type DepartmentCode, type DemoTicket, type KbEdge, type KbNode, type Severity, type TicketStatus } from "@/features/admin/types";

const now = Date.UTC(2026, 5, 10, 9, 0, 0);

const departmentMeta: Record<DepartmentCode, { tag: string; severity: Severity; complexity: Complexity; status: TicketStatus }> = {
	IT: { tag: "Network", severity: "High", complexity: "Medium", status: "New" },
	REG: { tag: "Holds", severity: "High", complexity: "Low", status: "Awaiting student" },
	MED: { tag: "Documentation", severity: "Medium", complexity: "Low", status: "Resolved" },
	SS: { tag: "ID Access", severity: "Medium", complexity: "Medium", status: "In progress" },
	FIN: { tag: "Billing", severity: "High", complexity: "Low", status: "New" },
};

const admins: Admin[] = [
	{ id: "admin-it-maya", name: "Maya Chen", dept: "IT", role: "Help Desk Lead" },
	{ id: "admin-it-owen", name: "Owen Patel", dept: "IT", role: "Network Specialist" },
	{ id: "admin-reg-ana", name: "Ana Reyes", dept: "REG", role: "Registrar Coordinator" },
	{ id: "admin-reg-miles", name: "Miles Grant", dept: "REG", role: "Records Analyst" },
	{ id: "admin-med-jo", name: "Jo Kim", dept: "MED", role: "Clinic Admin" },
	{ id: "admin-med-samira", name: "Samira Okafor", dept: "MED", role: "Health Services Lead" },
	{ id: "admin-ss-nora", name: "Nora Williams", dept: "SS", role: "Student Services Lead" },
	{ id: "admin-ss-eli", name: "Eli Santos", dept: "SS", role: "Campus Access Coordinator" },
	{ id: "admin-fin-priya", name: "Priya Nair", dept: "FIN", role: "Bursar Lead" },
	{ id: "admin-fin-caleb", name: "Caleb Brooks", dept: "FIN", role: "Student Accounts Analyst" },
];

const financeTickets = [
	{
		id: "AIC-000006",
		title: "$310 balance blocking fall registration",
		student: "maria.santos@student.university.edu",
		status: "Escalated",
		priority: "High" as const,
		issueSummary: "Student has a small overdue balance that triggered a registration hold before the Fall 2026 deadline.",
		collectedInformation: "Balance: $310; Deadline: 2026-06-11 5:00 PM; Student says payment plan was approved last week.",
		missingInformation: "Payment plan confirmation number.",
		suggestedStaffAction: "Review student account, verify payment plan approval, and coordinate hold release with Registrar.",
		conversationSummary: "Meera confirmed the hold amount and deadline, then escalated because account review is required.",
		confidence: 0.9,
	},
	{
		id: "AIC-000007",
		title: "Refund request still pending after withdrawal",
		student: "dylan.lee@student.university.edu",
		status: "Escalated",
		priority: "Normal" as const,
		issueSummary: "Student withdrew during the refund window but does not see a refund in the portal.",
		collectedInformation: "Withdrawal date: 2026-06-03; Course: BIO-210; Bank details unchanged.",
		missingInformation: "Refund queue reference from Finance.",
		suggestedStaffAction: "Check refund queue status and confirm whether manual release is needed.",
		conversationSummary: "Meera verified the withdrawal date and routed to Finance for account-specific review.",
		confidence: 0.87,
	},
];

function transcript(title: string, summary: string, missing: string, createdAt: number): ChatMessage[] {
	return [
		{ role: "student", text: `I need help with this: ${title}.`, at: createdAt },
		{ role: "meera", text: "I can help gather the details before routing this to the right office. What have you already tried?", at: createdAt + 60_000 },
		{ role: "student", text: summary, at: createdAt + 140_000 },
		{ role: "meera", text: missing === "None for general guidance." ? "I found enough information to provide guidance and will summarize the outcome." : `Thanks. I still need: ${missing}`, at: createdAt + 220_000 },
	];
}

function statusFromSource(status: string, fallback: TicketStatus): TicketStatus {
	if (status === "Awaiting Student Info") return "Awaiting student";
	if (status === "Resolved") return "Resolved";
	if (status === "Escalated") return fallback === "Resolved" ? "Resolved" : "New";
	return fallback;
}

function ticketFromSource(source: {
	id: string;
	title: string;
	student: string;
	status: string;
	priority: "Low" | "Normal" | "High" | "Critical";
	issueSummary: string;
	collectedInformation: string;
	missingInformation: string;
	suggestedStaffAction: string;
	conversationSummary: string;
	confidence: number;
}, ownerDept: DepartmentCode, index: number): DemoTicket {
	const meta = departmentMeta[ownerDept];
	const createdAt = now - (index + 1) * 38 * 60_000;
	return {
		id: source.id,
		title: source.title,
		student: source.student,
		ownerDept,
		tag: meta.tag,
		severity: source.priority === "Critical" ? "Critical" : source.priority === "High" ? "High" : meta.severity,
		complexity: meta.complexity,
		status: statusFromSource(source.status, meta.status),
		createdAt,
		aiSummary: source.issueSummary,
		collectedInformation: source.collectedInformation,
		missingInformation: source.missingInformation,
		suggestedActions: [source.suggestedStaffAction],
		confidence: source.confidence,
		conversation: transcript(source.title, source.conversationSummary, source.missingInformation, createdAt),
		notes: [],
		claimedBy: null,
		edited: false,
		kbIngested: false,
	};
}

const baseTickets = adminDemoFallback.departments.flatMap((department, deptIndex) =>
	department.tickets.map((ticket, ticketIndex) => ticketFromSource(ticket, department.code as DepartmentCode, deptIndex * 3 + ticketIndex)),
);

const financeSeedTickets = financeTickets.map((ticket, index) => ticketFromSource(ticket, "FIN", baseTickets.length + index));

const tickets: DemoTicket[] = [...baseTickets, ...financeSeedTickets].map((ticket) => {
	if (ticket.id === "AIC-000001") {
		return {
			...ticket,
			cross: {
				initiatedBy: "ai",
				participants: [
					{ dept: "IT", decision: "accepted" },
					{ dept: "SS", decision: "pending", reason: "Library access point location needs Student Services confirmation." },
				],
				active: false,
				tasks: [],
			},
		};
	}
	if (ticket.id === "AIC-000003") {
		return {
			...ticket,
			cross: {
				initiatedBy: "ai",
				participants: [
					{ dept: "REG", decision: "accepted" },
					{ dept: "FIN", decision: "pending", reason: "Registrar needs Finance to confirm whether the hold is financial." },
				],
				active: false,
				tasks: [],
			},
		};
	}
	if (ticket.id === "AIC-000006") {
		return {
			...ticket,
			cross: {
				initiatedBy: "ai",
				participants: [
					{ dept: "FIN", decision: "accepted" },
					{ dept: "REG", decision: "pending", reason: "Registration submission depends on hold release." },
				],
				active: false,
				tasks: [],
			},
		};
	}
	return ticket;
});

const sourceFaqs = [
	...adminDemoFallback.departments.flatMap((department) => department.faqs.map((faq) => ({ ...faq, dept: department.code as DepartmentCode }))),
	{
		id: "KA_FIN_HOLD",
		dept: "FIN" as DepartmentCode,
		question: "How do I clear a financial hold?",
		answer: "Students should review their balance, payment plan, and due dates. Finance must verify account-specific hold removal.",
		askFor: "Student ID, balance shown, term, deadline, payment confirmation, and whether registration is blocked.",
		escalateIf: "A hold blocks registration, a payment plan needs verification, or manual release may be required.",
		lastVerified: "2026-06-01",
		safeForSelfService: true,
	},
	{
		id: "KA_FIN_REFUND",
		dept: "FIN" as DepartmentCode,
		question: "When will my tuition refund be processed?",
		answer: "Give general refund-window guidance, then collect withdrawal date and payment destination before staff review.",
		askFor: "Student ID, withdrawal date, course or term, and refund method.",
		escalateIf: "The refund is overdue, account review is needed, or bank details must be confirmed.",
		lastVerified: "2026-06-01",
		safeForSelfService: true,
	},
];

const departmentNodes: KbNode[] = DEPARTMENT_CODES.map((dept) => ({
	id: `dept-${dept}`,
	dept: "shared",
	kind: "department",
	label: DEPARTMENT_LABELS[dept],
}));

const faqNodes: KbNode[] = sourceFaqs.map((faq) => ({
	id: faq.id,
	dept: faq.dept,
	kind: "faq",
	label: faq.question,
	body: faq.answer,
	meta: {
		askFor: faq.askFor,
		escalateIf: faq.escalateIf,
		lastVerified: faq.lastVerified,
		safeForSelfService: String(faq.safeForSelfService),
	},
}));

const faqEdges: KbEdge[] = sourceFaqs.map((faq) => ({
	id: `edge-${faq.dept}-${faq.id}`,
	from: `dept-${faq.dept}`,
	to: faq.id,
	relation: "owns",
}));

export const adminSeedSnapshot: AdminSnapshot = {
	admins,
	tickets,
	kb: {
		nodes: [...departmentNodes, ...faqNodes],
		edges: faqEdges,
	},
};
