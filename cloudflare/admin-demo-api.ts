type Env = {
	DB: D1Database;
};

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

const departments = [
	{
		code: "IT",
		name: "IT Department",
		shortName: "IT",
		accent: "teal",
		askFor: "Student ID, email, device type, location, network name, error message, and urgency reason.",
		responsibilities: [
			"Resolving technical issues such as network access, system outages, devices, and printers.",
			"Receiving pre-classified, fully populated tickets from the agent.",
			"Avoiding repetitive intake tasks due to agent-collected context.",
			"Focusing on issues that require hands-on technical expertise.",
		],
		agentValue: "Meera handles first-pass troubleshooting and only escalates when system access or technical expertise is needed.",
	},
	{
		code: "REG",
		name: "Registrar",
		shortName: "Registrar",
		accent: "sand",
		askFor: "Student ID, email, term, program/year level, exact hold message, screenshot, and enrollment deadline.",
		responsibilities: [
			"Addressing academic records, enrollment issues, registration holds, and term-based queries.",
			"Receiving tickets already tagged with relevant academic context such as term, status, and urgency.",
			"Leveraging the agent to deflect repetitive, FAQ-level questions.",
		],
		agentValue: "Meera collects academic context without guessing official record status or promising policy outcomes.",
	},
	{
		code: "MED",
		name: "Medical / Campus Health Services",
		shortName: "Campus Health",
		accent: "green",
		askFor: "Student ID, email, absence date, requested document, appointment context, and urgency.",
		responsibilities: [
			"Handling health-related administrative inquiries such as appointment scheduling, documentation guidance, and service access.",
			"Receiving escalations only when student needs exceed available FAQ guidance.",
			"Maintaining confidentiality and policy compliance beyond the agent's scope.",
		],
		agentValue: "Meera stays administrative: it can explain process, collect minimal details, and escalates anything medical, sensitive, or policy-bound.",
	},
	{
		code: "SS",
		name: "Student Services",
		shortName: "Student Services",
		accent: "rose",
		askFor: "Student ID, email, location, time, issue details, and safety urgency if relevant.",
		responsibilities: [
			"Supporting student life concerns such as ID access, campus services, facilities, and general support requests.",
			"Using the agent as a first-line FAQ responder and intake assistant.",
			"Receiving structured tickets only when human intervention is needed.",
		],
		agentValue: "Meera classifies broad student-life issues, gathers location/time/context, and routes only staff-needed cases.",
	},
] as const;

type ArticleRow = {
	ArticleCode: string;
	OfficeCode: string;
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
	ResponsibleOfficeCode: string;
	Status: string;
	Priority: string;
	IssueSummary: string;
	CollectedInformation: string;
	MissingInformation: string;
	SuggestedStaffAction: string;
	ConversationSummary: string;
	AIConfidence: number;
};

function json(body: unknown, init: ResponseInit = {}) {
	return Response.json(body, { ...init, headers: { ...corsHeaders, ...init.headers } });
}

async function loadSnapshot(db: D1Database) {
	const [articleResult, ticketResult] = await Promise.all([
		db.prepare("SELECT ArticleCode, OfficeCode, ArticleTitle, ContentSummary, EscalationBoundary, LastVerified, SafeForSelfService FROM aic_knowledge_article WHERE Active = 'Yes'").all<ArticleRow>(),
		db.prepare("SELECT TicketNumber, TicketTitle, StudentEmail, ResponsibleOfficeCode, Status, Priority, IssueSummary, CollectedInformation, MissingInformation, SuggestedStaffAction, ConversationSummary, AIConfidence FROM aic_support_ticket").all<TicketRow>(),
	]);

	const articles = articleResult.results ?? [];
	const tickets = ticketResult.results ?? [];

	return {
		source: "d1",
		departments: departments.map((department) => ({
			...department,
			faqs: articles
				.filter((article) => article.OfficeCode === department.code)
				.map((article) => ({
					id: article.ArticleCode,
					question: article.ArticleTitle,
					answer: article.ContentSummary,
					askFor: department.askFor,
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

const adminDemoApi = {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

		const url = new URL(request.url);
		if (url.pathname !== "/" && url.pathname !== "/api/admin-demo") return json({ error: "Not found" }, { status: 404 });

		if (request.method === "GET") return json(await loadSnapshot(env.DB));

		if (request.method === "PUT") {
			const draft = await request.json<{ faqId?: string; answer?: string; escalateIf?: string }>().catch(() => null);
			if (!draft?.faqId) return json({ ok: false, error: "faqId is required" }, { status: 400 });

			await env.DB
				.prepare("UPDATE aic_knowledge_article SET ContentSummary = ?, EscalationBoundary = ?, LastVerified = ? WHERE ArticleCode = ?")
				.bind(draft.answer ?? "", draft.escalateIf ?? "", new Date().toISOString().slice(0, 10), draft.faqId)
				.run();

			return json({ ok: true, source: "d1", draft });
		}

		return json({ error: "Method not allowed" }, { status: 405 });
	},
};

export default adminDemoApi;
