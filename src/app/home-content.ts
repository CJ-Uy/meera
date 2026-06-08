export const landingSections = [
	"Navbar",
	"Hero",
	"Problem",
	"Solution Workflow",
	"Product Demo Preview",
	"Integrations",
	"Use Cases",
	"Differentiation",
	"Trust and Boundaries",
	"Architecture Preview",
	"Demo CTA",
	"Final CTA",
	"Footer",
] as const;

export type WorkflowStep = {
	title: string;
	description: string;
};

export type UseCase = {
	title: string;
	description: string;
	examples: string[];
};

export type Integration = {
	name: string;
	description: string;
};

export type TicketPreview = {
	title: string;
	office: string;
	category: string;
	priority: "Low" | "Normal" | "High" | "Critical";
	summary: string;
	escalationReason: string;
	suggestedAction: string;
};

export const meeraIconAsset = {
	src: "/assets/meera/meera_icon.svg",
	alt: "Meera mascot icon",
} as const;

export const problemCards = [
	{
		title: "Unstructured Requests",
		description: "Users describe issues in their own words, often without department, urgency, or system details.",
	},
	{
		title: "Manual Intake",
		description: "Staff repeatedly ask for IDs, screenshots, device details, payment references, or deadlines.",
	},
	{
		title: "Delayed Escalation",
		description: "Urgent issues can get stuck behind routine questions and incomplete tickets.",
	},
] as const;

export const workflowSteps: WorkflowStep[] = [
	{
		title: "Understand",
		description: "Meera interprets natural-language concerns, even when requests are vague or emotional.",
	},
	{
		title: "Classify",
		description: "It identifies the responsible office, category, urgency, and missing details.",
	},
	{
		title: "Resolve",
		description: "Approved knowledge guides safe self-service steps before staff time is used.",
	},
	{
		title: "Package",
		description: "When human support is needed, Meera prepares a structured escalation package.",
	},
	{
		title: "Route",
		description: "Staff receive a complete, prioritized case inside the connected workflow.",
	},
];

export const integrations: Integration[] = [
	{ name: "Microsoft Copilot Studio", description: "Agent authoring and conversational orchestration." },
	{ name: "Power Automate", description: "Routing, notifications, approvals, and workflow triggers." },
	{ name: "Dataverse", description: "Structured records for users, concerns, tickets, and evidence." },
	{ name: "Microsoft Teams", description: "Staff handoffs and internal support collaboration." },
	{ name: "SharePoint Knowledge Base", description: "Approved answers, procedures, and escalation rules." },
	{ name: "Email Inbox", description: "Capture requests from existing support addresses." },
	{ name: "Ticketing Systems", description: "Create cases without replacing current service desk tools." },
	{ name: "Internal Databases", description: "Reference secure operational data through governed connectors." },
];

export const useCases: UseCase[] = [
	{
		title: "IT Helpdesk",
		description: "Resolve common access and device problems before they become tickets.",
		examples: ["Login issues", "Wi-Fi problems", "Account lockouts", "Software access", "Printer outages"],
	},
	{
		title: "Registrar / Academic Operations",
		description: "Collect term, course, and record details before escalating academic concerns.",
		examples: ["Enrollment concerns", "Registration holds", "Transcript requests", "Term status questions"],
	},
	{
		title: "Finance / Billing",
		description: "Prepare payment concerns for verification without claiming to validate funds.",
		examples: ["Tuition balance", "Payment posting", "Proof of payment", "Assessment concerns"],
	},
	{
		title: "Campus Health / Medical Admin",
		description: "Guide administrative health requests while escalating sensitive judgment calls.",
		examples: ["Appointment guidance", "Certificate requirements", "Clinic access", "Documentation guidance"],
	},
	{
		title: "Student Services / General Operations",
		description: "Route campus-life and facilities issues with the right context attached.",
		examples: ["ID concerns", "Campus access", "Facilities", "General support routing"],
	},
	{
		title: "Enterprise Operations",
		description: "Adapt the same intake pattern to departments beyond education.",
		examples: ["HR support", "Finance ops", "Facilities", "Customer support", "ITSM"],
	},
];

export const comparisonRows = [
	["Makes users pick a department", "Understands concerns in natural language"],
	["Routes immediately", "Attempts safe resolution first"],
	["Collects generic information", "Asks only for relevant missing details"],
	["Produces incomplete tickets", "Creates structured escalation packages"],
	["Has weak context", "Includes urgency, category, summary, and attempted steps"],
	["Feels transactional", "Feels like a friendly support companion"],
] as const;

export const boundaryCards = [
	"Does not approve requests",
	"Does not change official records",
	"Does not validate payments",
	"Does not make medical judgments",
	"Does not override systems",
	"Escalates sensitive or urgent issues",
] as const;

export const architectureFlow = [
	"User Message",
	"Meera Orchestrator",
	"Intent Classification",
	"Knowledge Retrieval",
	"Safe Self-Service Guidance",
	"Resolution Check",
	"Structured Escalation Package",
	"Power Automate / Dataverse / Ticketing System",
	"Staff Dashboard",
] as const;

export const ticketPreview: TicketPreview = {
	title: "Tuition payment not reflected",
	office: "Finance / Billing Support",
	category: "Payment posting concern",
	priority: "Normal",
	summary: "Student reports payment was made but their account still shows unpaid.",
	escalationReason: "Payment verification requires staff review",
	suggestedAction: "Verify payment record and update the student if posting is delayed.",
};

export const demoPrompts = [
	"I can't connect to the Wi-Fi and I have an exam soon.",
	"I paid my tuition but it still says unpaid.",
	"Why do I have a registration hold?",
	"Can I get a medical certificate for my absence?",
	"My ID is not working at the gate.",
] as const;
