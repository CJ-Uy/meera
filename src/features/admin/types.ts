export const DEPARTMENT_CODES = ["IT", "REG", "MED", "SS", "FIN"] as const;

export type DepartmentCode = (typeof DEPARTMENT_CODES)[number];

export const DEPARTMENT_LABELS: Record<DepartmentCode, string> = {
	IT: "IT Help Desk",
	REG: "Registrar",
	MED: "Campus Health",
	SS: "Student Services",
	FIN: "Finance / Bursar",
};

export type Severity = "Low" | "Medium" | "High" | "Critical";
export type Complexity = "Low" | "Medium" | "High";
export type TicketStatus = "New" | "In progress" | "Awaiting student" | "Resolved";

export type ChatMessage = {
	role: "student" | "meera";
	text: string;
	at: number;
};

export type AdminNote = {
	id: string;
	adminId: string;
	text: string;
	at: number;
};

export type Admin = {
	id: string;
	name: string;
	dept: DepartmentCode;
	role: string;
};

export type CrossDeptDecision = "pending" | "accepted" | "rejected";

export type Task = {
	id: string;
	title: string;
	ownerDept: DepartmentCode;
	assignee?: string;
	status: "todo" | "doing" | "done";
	due?: number;
};

export type CrossDeptState = {
	initiatedBy: "ai" | string;
	participants: {
		dept: DepartmentCode;
		decision: CrossDeptDecision;
		reason?: string;
	}[];
	active: boolean;
	tasks: Task[];
};

export type DemoTicket = {
	id: string;
	title: string;
	student: string;
	ownerDept: DepartmentCode;
	tag: string;
	severity: Severity;
	complexity: Complexity;
	status: TicketStatus;
	createdAt: number;
	aiSummary: string;
	collectedInformation: string;
	missingInformation: string;
	suggestedActions: string[];
	confidence: number;
	conversation: ChatMessage[];
	notes: AdminNote[];
	claimedBy: string | null;
	edited: boolean;
	kbIngested: boolean;
	cross?: CrossDeptState;
};

export type KbNode = {
	id: string;
	dept: DepartmentCode | "shared";
	kind: "faq" | "procedure" | "entity" | "department";
	label: string;
	body?: string;
	meta?: Record<string, string>;
};

export type KbEdge = {
	id: string;
	from: string;
	to: string;
	relation: string;
};

export type AdminSnapshot = {
	admins: Admin[];
	tickets: DemoTicket[];
	kb: {
		nodes: KbNode[];
		edges: KbEdge[];
	};
};
