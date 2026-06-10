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
					{ dept: "SS", decision: "pending", reason: "Student Services may need to help the student navigate the deadline." },
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

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

const departmentNodes: KbNode[] = DEPARTMENT_CODES.map((dept) => ({
	id: `dept-${dept}`,
	dept: "shared",
	kind: "department",
	label: DEPARTMENT_LABELS[dept],
}));

const faqNodes: KbNode[] = sourceFaqs.map((faq) => ({
	id: `faq-${faq.dept.toLowerCase()}-${slugify(faq.question)}`,
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

const procedureTemplates: Record<DepartmentCode, { label: string; body: string; meta: Record<string, string> }[]> = {
	IT: [
		{ label: "Network authentication escalation", body: "Confirm device, location, network name, and account status before routing to the network specialist queue.", meta: { owner: "Help Desk Lead", sla: "Same business day" } },
		{ label: "Student account lockout reset", body: "Validate student identity, check MFA delivery, then trigger the official reset workflow or escalate locked accounts.", meta: { owner: "Identity Access", sla: "4 hours" } },
	],
	REG: [
		{ label: "Registration hold review", body: "Collect hold message, term, program, and deadline before checking official records or coordinating another office.", meta: { owner: "Records Analyst", sla: "1 business day" } },
		{ label: "Manual enrollment override", body: "Verify course, section, prerequisite note, and approval evidence before opening an override task.", meta: { owner: "Registrar Coordinator", sla: "2 business days" } },
	],
	MED: [
		{ label: "Clinic appointment triage", body: "Keep intake administrative, collect preferred times, and redirect urgent medical concerns to emergency guidance.", meta: { owner: "Clinic Admin", sla: "Same business day" } },
		{ label: "Medical certificate request", body: "Collect absence date and requested document, then route issuance decisions to authorized clinic staff.", meta: { owner: "Health Services Lead", sla: "2 business days" } },
	],
	SS: [
		{ label: "Campus access card review", body: "Collect building, time, reader behavior, and whether the ID works elsewhere before checking card permissions.", meta: { owner: "Campus Access Coordinator", sla: "Same business day" } },
		{ label: "Facilities issue intake", body: "Capture location, safety urgency, and an optional photo before routing to the student services operations queue.", meta: { owner: "Student Services Lead", sla: "1 business day" } },
	],
	FIN: [
		{ label: "Payment plan verification", body: "Check balance, term, payment confirmation, and active plan status before coordinating hold release.", meta: { owner: "Student Accounts Analyst", sla: "Same business day" } },
		{ label: "Refund queue lookup", body: "Confirm withdrawal date, refund method, and queue reference before escalating overdue refunds.", meta: { owner: "Bursar Lead", sla: "3 business days" } },
	],
};

const procedureNodes: KbNode[] = DEPARTMENT_CODES.flatMap((dept) =>
	procedureTemplates[dept].map((procedure, index) => ({
		id: `proc-${dept.toLowerCase()}-${index + 1}`,
		dept,
		kind: "procedure" as const,
		label: procedure.label,
		body: procedure.body,
		meta: procedure.meta,
	})),
);

const entityNodes: KbNode[] = [
	{ id: "ent-student-portal", dept: "shared", kind: "entity", label: "Student Portal", body: "Primary self-service system for records, account balances, holds, and student requests.", meta: { systems: "Records, Finance, IT" } },
	{ id: "ent-registration-hold", dept: "shared", kind: "entity", label: "Registration Hold", body: "A blocking condition that may originate from records, finance, health documentation, or student services.", meta: { bridge: "Registrar, Finance, Campus Health, Student Services" } },
	{ id: "ent-campus-access", dept: "shared", kind: "entity", label: "Campus Access", body: "Physical and digital access permissions for buildings, IDs, Wi-Fi, and shared campus services.", meta: { bridge: "IT, Student Services" } },
	{ id: "ent-payment-plan", dept: "shared", kind: "entity", label: "Payment Plan", body: "Finance arrangement that may unblock registration once verified and synchronized with records.", meta: { bridge: "Finance, Registrar" } },
];

const faqEdges: KbEdge[] = faqNodes.map((node) => ({
	id: `edge-dept-${node.dept.toLowerCase()}-${node.id}`,
	from: `dept-${node.dept}`,
	to: node.id,
	relation: "owns",
}));

const procedureEdges: KbEdge[] = procedureNodes.map((node) => ({
	id: `edge-dept-${node.dept.toLowerCase()}-${node.id}`,
	from: `dept-${node.dept}`,
	to: node.id,
	relation: "owns",
}));

const sharedEdges: KbEdge[] = [
	{ id: "edge-ent-student-portal-dept-it", from: "ent-student-portal", to: "dept-IT", relation: "used-by" },
	{ id: "edge-ent-student-portal-dept-reg", from: "ent-student-portal", to: "dept-REG", relation: "used-by" },
	{ id: "edge-ent-student-portal-dept-fin", from: "ent-student-portal", to: "dept-FIN", relation: "used-by" },
	{ id: "edge-ent-registration-hold-dept-reg", from: "ent-registration-hold", to: "dept-REG", relation: "shared-policy" },
	{ id: "edge-ent-registration-hold-dept-fin", from: "ent-registration-hold", to: "dept-FIN", relation: "shared-policy" },
	{ id: "edge-ent-registration-hold-dept-med", from: "ent-registration-hold", to: "dept-MED", relation: "shared-policy" },
	{ id: "edge-ent-campus-access-dept-it", from: "ent-campus-access", to: "dept-IT", relation: "used-by" },
	{ id: "edge-ent-campus-access-dept-ss", from: "ent-campus-access", to: "dept-SS", relation: "used-by" },
	{ id: "edge-ent-payment-plan-dept-fin", from: "ent-payment-plan", to: "dept-FIN", relation: "shared-policy" },
	{ id: "edge-ent-payment-plan-dept-reg", from: "ent-payment-plan", to: "dept-REG", relation: "shared-policy" },
	{ id: "edge-proc-fin-1-ent-payment-plan", from: "proc-fin-1", to: "ent-payment-plan", relation: "references" },
	{ id: "edge-proc-reg-1-ent-registration-hold", from: "proc-reg-1", to: "ent-registration-hold", relation: "references" },
	{ id: "edge-proc-ss-1-ent-campus-access", from: "proc-ss-1", to: "ent-campus-access", relation: "references" },
];

export const adminSeedSnapshot: AdminSnapshot = {
	admins,
	tickets,
	kb: {
		nodes: [...departmentNodes, ...faqNodes, ...procedureNodes, ...entityNodes],
		edges: [...faqEdges, ...procedureEdges, ...sharedEdges],
	},
};
