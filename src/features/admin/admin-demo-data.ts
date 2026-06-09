export type DepartmentCode = "IT" | "REG" | "MED" | "SS";

export type DepartmentFaq = {
	id: string;
	question: string;
	answer: string;
	askFor: string;
	escalateIf: string;
	lastVerified: string;
	safeForSelfService: boolean;
};

export type DepartmentTicket = {
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
};

export type AdminDepartment = {
	code: DepartmentCode;
	name: string;
	shortName: string;
	accent: "teal" | "sand" | "green" | "rose";
	responsibilities: string[];
	agentValue: string;
	faqs: DepartmentFaq[];
	tickets: DepartmentTicket[];
};

export type AdminDemoSnapshot = {
	source: "d1" | "fallback";
	departments: AdminDepartment[];
};

export const adminDemoFallback: AdminDemoSnapshot = {
	source: "fallback",
	departments: [
		{
			code: "IT",
			name: "IT Department",
			shortName: "IT",
			accent: "teal",
			responsibilities: [
				"Resolving technical issues such as network access, system outages, devices, and printers.",
				"Receiving pre-classified, fully populated tickets from the agent.",
				"Avoiding repetitive intake tasks due to agent-collected context.",
				"Focusing on issues that require hands-on technical expertise.",
			],
			agentValue: "Meera handles first-pass troubleshooting and only escalates when system access or technical expertise is needed.",
			faqs: [
				{
					id: "KA_WIFI_BASIC",
					question: "I cannot connect to campus Wi-Fi. What should I do?",
					answer: "Try toggling Wi-Fi, confirming the official campus network, forgetting and reconnecting with student credentials, checking for a browser login page, restarting the device, and testing another campus area.",
					askFor: "Student ID, email, device type, location, network name, error message, and urgency reason.",
					escalateIf: "The student still cannot connect, the issue affects an exam or deadline, multiple students report it, or the error suggests account authentication.",
					lastVerified: "2026-06-01",
					safeForSelfService: true,
				},
				{
					id: "KA_LOCKOUT",
					question: "I forgot my password or cannot log in to my student account.",
					answer: "Guide the student to the official reset flow, verify they are using the correct student email or username, and check whether MFA is working.",
					askFor: "Student ID, email, affected system, error message, reset attempt, and urgency reason.",
					escalateIf: "The account remains locked, reset instructions never arrive, MFA fails, or access is urgently needed.",
					lastVerified: "2026-06-01",
					safeForSelfService: true,
				},
			],
			tickets: [
				{
					id: "AIC-000001",
					title: "Unable to connect to campus Wi-Fi before online quiz",
					student: "alex.rivera@student.university.edu",
					status: "Escalated",
					priority: "High",
					issueSummary: "Student cannot connect laptop to campus Wi-Fi from the library before a quiz.",
					collectedInformation: "Device: laptop; Location: Library; Network: Campus-Student; Error: cannot authenticate.",
					missingInformation: "Exact device operating system version.",
					suggestedStaffAction: "Check account authentication status and nearby access point availability.",
					conversationSummary: "Meera guided the student through basic Wi-Fi troubleshooting. Issue remained unresolved.",
					confidence: 0.91,
				},
			],
		},
		{
			code: "REG",
			name: "Registrar",
			shortName: "Registrar",
			accent: "sand",
			responsibilities: [
				"Addressing academic records, enrollment issues, registration holds, and term-based queries.",
				"Receiving tickets already tagged with relevant academic context such as term, status, and urgency.",
				"Leveraging the agent to deflect repetitive, FAQ-level questions.",
			],
			agentValue: "Meera collects academic context without guessing official record status or promising policy outcomes.",
			faqs: [
				{
					id: "KA_REG_HOLD",
					question: "Why do I have a registration hold?",
					answer: "A registration hold may require review of official student records. Meera can collect details but should not guess the reason or promise removal.",
					askFor: "Student ID, email, term, program/year level, exact hold message, screenshot, and enrollment deadline.",
					escalateIf: "The hold blocks enrollment, requires official record review, or needs manual action from the Registrar.",
					lastVerified: "2026-06-01",
					safeForSelfService: true,
				},
				{
					id: "KA_REG_ENROLL",
					question: "I cannot enlist or enroll in a class.",
					answer: "Ask what class or section is affected and what message appears. Provide general causes such as prerequisites, schedule conflicts, capacity, restrictions, or account holds.",
					askFor: "Student ID, term, course/section, error message, program/year level, and deadline.",
					escalateIf: "Record checking, override approval, prerequisite validation, or manual enrollment is required.",
					lastVerified: "2026-06-01",
					safeForSelfService: true,
				},
			],
			tickets: [
				{
					id: "AIC-000003",
					title: "Registration hold blocking enrollment",
					student: "luis.delacruz@student.university.edu",
					status: "Awaiting Student Info",
					priority: "High",
					issueSummary: "Student sees a registration hold but is unsure why it appears.",
					collectedInformation: "Term: First Semester 2026; Program/year: BS Psychology, 4th Year.",
					missingInformation: "Exact hold message or screenshot.",
					suggestedStaffAction: "Review student record and identify hold source once screenshot/message is provided.",
					conversationSummary: "Meera classified the concern as Registrar and requested missing hold details.",
					confidence: 0.86,
				},
			],
		},
		{
			code: "MED",
			name: "Medical / Campus Health Services",
			shortName: "Campus Health",
			accent: "green",
			responsibilities: [
				"Handling health-related administrative inquiries such as appointment scheduling, documentation guidance, and service access.",
				"Receiving escalations only when student needs exceed available FAQ guidance.",
				"Maintaining confidentiality and policy compliance beyond the agent's scope.",
			],
			agentValue: "Meera stays administrative: it can explain process, collect minimal details, and escalates anything medical, sensitive, or policy-bound.",
			faqs: [
				{
					id: "KA_MED_CERT",
					question: "How do I request a medical certificate?",
					answer: "Provide general documentation guidance if available. Do not determine whether the student medically qualifies for a certificate.",
					askFor: "Student ID, email, absence date, requested document, and whether the student visited the clinic if relevant.",
					escalateIf: "Official issuance, medical review, staff validation, or health documentation approval is required.",
					lastVerified: "2026-06-01",
					safeForSelfService: true,
				},
				{
					id: "KA_MED_APPT",
					question: "How do I schedule a clinic appointment?",
					answer: "Provide the official appointment process if available, and redirect urgent or sensitive concerns to appropriate health support.",
					askFor: "Student ID, email, preferred date/time, type of appointment, and urgency.",
					escalateIf: "The concern is urgent, sensitive, requires staff scheduling, or goes beyond administrative guidance.",
					lastVerified: "2026-06-01",
					safeForSelfService: true,
				},
			],
			tickets: [
				{
					id: "AIC-000004",
					title: "Medical certificate guidance for absence",
					student: "bea.tan@student.university.edu",
					status: "Resolved",
					priority: "Normal",
					issueSummary: "Student asked how to request a medical certificate for an absence.",
					collectedInformation: "Absence date: 2026-06-05; document requested: medical certificate.",
					missingInformation: "None for general guidance.",
					suggestedStaffAction: "None.",
					conversationSummary: "Meera provided documentation guidance and student confirmed understanding.",
					confidence: 0.93,
				},
			],
		},
		{
			code: "SS",
			name: "Student Services",
			shortName: "Student Services",
			accent: "rose",
			responsibilities: [
				"Supporting student life concerns such as ID access, campus services, facilities, and general support requests.",
				"Using the agent as a first-line FAQ responder and intake assistant.",
				"Receiving structured tickets only when human intervention is needed.",
			],
			agentValue: "Meera classifies broad student-life issues, gathers location/time/context, and routes only staff-needed cases.",
			faqs: [
				{
					id: "KA_SS_ID",
					question: "My student ID is not working for campus access.",
					answer: "Ask where the ID failed and whether it works elsewhere. Suggest checking for card damage or trying another reader if safe and convenient.",
					askFor: "Student ID, email, building/location, time of failed access, denial message, and whether it works in other areas.",
					escalateIf: "Access permissions, ID encoding, card replacement, or manual verification is needed.",
					lastVerified: "2026-06-01",
					safeForSelfService: true,
				},
				{
					id: "KA_SS_FACILITY",
					question: "I want to report a facility issue.",
					answer: "Collect the issue, location, and when it was noticed. Ask for a photo if available but do not require one.",
					askFor: "Location, issue description, date/time noticed, optional photo, and safety urgency.",
					escalateIf: "The issue affects safety, accessibility, operations, or requires maintenance/staff action.",
					lastVerified: "2026-06-01",
					safeForSelfService: true,
				},
			],
			tickets: [
				{
					id: "AIC-000005",
					title: "Student ID not working at building entrance",
					student: "noah.garcia@student.university.edu",
					status: "Escalated",
					priority: "Normal",
					issueSummary: "Student ID failed at the entrance gate of a campus building.",
					collectedInformation: "Location: Science Building; Time: 8:15 AM; Error: access denied.",
					missingInformation: "Whether ID works in other buildings.",
					suggestedStaffAction: "Verify ID access status and building permission rules.",
					conversationSummary: "Meera collected building and time details, then escalated to Student Services.",
					confidence: 0.84,
				},
			],
		},
	],
};

type D1DatabaseLike = {
	prepare: (query: string) => {
		bind: (...values: unknown[]) => { all: <T = unknown>() => Promise<{ results?: T[] }> };
		all: <T = unknown>() => Promise<{ results?: T[] }>;
	};
};

type ArticleRow = {
	ArticleCode: string;
	OfficeCode: DepartmentCode;
	ArticleTitle: string;
	ContentSummary: string;
	EscalationBoundary: string;
	LastVerified: string;
	SafeForSelfService: string;
};

type TicketRow = {
	TicketNumber: string;
	TicketTitle: string;
	StudentEmail: string;
	ResponsibleOfficeCode: DepartmentCode;
	Status: string;
	Priority: DepartmentTicket["priority"];
	IssueSummary: string;
	CollectedInformation: string;
	MissingInformation: string;
	SuggestedStaffAction: string;
	ConversationSummary: string;
	AIConfidence: number;
};

export async function loadAdminDemoSnapshot(db?: D1DatabaseLike | null): Promise<AdminDemoSnapshot> {
	if (!db) return adminDemoFallback;

	const [articlesResult, ticketsResult] = await Promise.all([
		db.prepare("SELECT ArticleCode, OfficeCode, ArticleTitle, ContentSummary, EscalationBoundary, LastVerified, SafeForSelfService FROM aic_knowledge_article WHERE Active = 'Yes'").all<ArticleRow>(),
		db.prepare("SELECT TicketNumber, TicketTitle, StudentEmail, ResponsibleOfficeCode, Status, Priority, IssueSummary, CollectedInformation, MissingInformation, SuggestedStaffAction, ConversationSummary, AIConfidence FROM aic_support_ticket").all<TicketRow>(),
	]);

	const articles = articlesResult.results ?? [];
	const tickets = ticketsResult.results ?? [];

	return {
		source: "d1",
		departments: adminDemoFallback.departments.map((department) => ({
			...department,
			faqs: articles
				.filter((article) => article.OfficeCode === department.code)
				.map((article) => ({
					id: article.ArticleCode,
					question: article.ArticleTitle,
					answer: article.ContentSummary,
					askFor: department.faqs.at(0)?.askFor ?? "Relevant student and issue details.",
					escalateIf: article.EscalationBoundary,
					lastVerified: article.LastVerified,
					safeForSelfService: article.SafeForSelfService === "Yes",
				})),
			tickets: tickets
				.filter((ticket) => ticket.ResponsibleOfficeCode === department.code)
				.map((ticket) => ({
					id: ticket.TicketNumber,
					title: ticket.TicketTitle,
					student: ticket.StudentEmail,
					status: ticket.Status,
					priority: ticket.Priority,
					issueSummary: ticket.IssueSummary,
					collectedInformation: ticket.CollectedInformation,
					missingInformation: ticket.MissingInformation,
					suggestedStaffAction: ticket.SuggestedStaffAction,
					conversationSummary: ticket.ConversationSummary,
					confidence: ticket.AIConfidence,
				})),
		})),
	};
}
