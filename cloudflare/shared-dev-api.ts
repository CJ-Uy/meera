type Env = {
	DB: D1Database;
	BUCKET: R2Bucket;
	SHARED_API_TOKEN: string;
};

type UserRow = {
	id: string;
	email: string;
	name: string | null;
	created_at: number;
};

type AdminRow = { id: string; name: string; dept: string; role: string };
type TicketRow = {
	id: string;
	title: string;
	student: string;
	owner_dept: string;
	tag: string;
	severity: string;
	complexity: string;
	status: string;
	created_at: number;
	ai_summary: string;
	collected_information: string;
	missing_information: string;
	suggested_actions: string;
	confidence: number;
	claimed_by: string | null;
	edited: number;
	kb_ingested: number;
	cross_initiated_by: string | null;
	cross_active: number;
};
type MessageRow = { id: string; ticket_id: string; role: string; text: string; at: number };
type NoteRow = { id: string; ticket_id: string; admin_id: string; text: string; at: number };
type KbNodeRow = { id: string; dept: string; kind: string; label: string; body: string | null; meta: string };
type KbEdgeRow = { id: string; from_node_id: string; to_node_id: string; relation: string };
type ParticipantRow = { ticket_id: string; dept: string; decision: "pending" | "accepted" | "rejected"; reason: string | null };
type TaskRow = { id: string; ticket_id: string; title: string; owner_dept: string; assignee: string | null; status: string; due: number | null };

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Authorization, Content-Type, X-Object-Key",
};

function json(body: unknown, init: ResponseInit = {}) {
	return Response.json(body, { ...init, headers: { ...corsHeaders, ...init.headers } });
}

function authorize(request: Request, env: Env) {
	const expectedToken = env.SHARED_API_TOKEN?.trim();
	return Boolean(expectedToken && request.headers.get("authorization") === `Bearer ${expectedToken}`);
}

function userFromRow(row: UserRow) {
	return {
		id: row.id,
		email: row.email,
		name: row.name,
		createdAt: new Date(row.created_at).toISOString(),
	};
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
	if (!value) return fallback;
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
}

function ticketFromRows(row: TicketRow, messages: MessageRow[], notes: NoteRow[], participants: ParticipantRow[], tasks: TaskRow[]) {
	const cross = row.cross_initiated_by
		? {
				initiatedBy: row.cross_initiated_by,
				participants: participants.map((participant) => ({
					dept: participant.dept,
					decision: participant.decision,
					...(participant.reason ? { reason: participant.reason } : {}),
				})),
				active: Boolean(row.cross_active),
				tasks: tasks.map(taskFromRow),
			}
		: undefined;
	return {
		id: row.id,
		title: row.title,
		student: row.student,
		ownerDept: row.owner_dept,
		tag: row.tag,
		severity: row.severity,
		complexity: row.complexity,
		status: row.status,
		createdAt: row.created_at,
		aiSummary: row.ai_summary,
		collectedInformation: row.collected_information,
		missingInformation: row.missing_information,
		suggestedActions: parseJson<string[]>(row.suggested_actions, []),
		confidence: row.confidence,
		conversation: messages.map((message) => ({ role: message.role, text: message.text, at: message.at })),
		notes: notes.map((note) => ({ id: note.id, adminId: note.admin_id, text: note.text, at: note.at })),
		claimedBy: row.claimed_by,
		edited: Boolean(row.edited),
		kbIngested: Boolean(row.kb_ingested),
		...(cross ? { cross } : {}),
	};
}

function taskFromRow(row: TaskRow) {
	return {
		id: row.id,
		title: row.title,
		ownerDept: row.owner_dept,
		...(row.assignee ? { assignee: row.assignee } : {}),
		status: row.status,
		...(row.due === null ? {} : { due: row.due }),
	};
}

async function adminDepartment(env: Env, adminId: string) {
	const row = await env.DB.prepare("SELECT dept FROM admins WHERE id = ? LIMIT 1").bind(adminId).first<{ dept: string }>();
	return row?.dept ?? null;
}

async function adminSnapshot(env: Env) {
	const [admins, tickets, messages, notes, nodes, edges, participants, tasks] = await Promise.all([
		env.DB.prepare("SELECT id, name, dept, role FROM admins ORDER BY dept, name").all<AdminRow>(),
		env.DB.prepare("SELECT * FROM tickets ORDER BY created_at").all<TicketRow>(),
		env.DB.prepare("SELECT * FROM ticket_messages ORDER BY at").all<MessageRow>(),
		env.DB.prepare("SELECT * FROM ticket_notes ORDER BY at").all<NoteRow>(),
		env.DB.prepare("SELECT * FROM kb_nodes ORDER BY dept, label").all<KbNodeRow>(),
		env.DB.prepare("SELECT * FROM kb_edges ORDER BY id").all<KbEdgeRow>(),
		env.DB.prepare("SELECT * FROM cross_dept_participants ORDER BY ticket_id, dept").all<ParticipantRow>(),
		env.DB.prepare("SELECT * FROM tasks ORDER BY id").all<TaskRow>(),
	]);
	const messageRows = messages.results ?? [];
	const noteRows = notes.results ?? [];
	const participantRows = participants.results ?? [];
	const taskRows = tasks.results ?? [];
	return {
		admins: admins.results ?? [],
		tickets: (tickets.results ?? []).map((ticket) =>
			ticketFromRows(
				ticket,
				messageRows.filter((message) => message.ticket_id === ticket.id),
				noteRows.filter((note) => note.ticket_id === ticket.id),
				participantRows.filter((participant) => participant.ticket_id === ticket.id),
				taskRows.filter((task) => task.ticket_id === ticket.id),
			),
		),
		kb: {
			nodes: (nodes.results ?? []).map((node) => ({ id: node.id, dept: node.dept, kind: node.kind, label: node.label, ...(node.body ? { body: node.body } : {}), meta: parseJson<Record<string, string>>(node.meta, {}) })),
			edges: (edges.results ?? []).map((edge) => ({ id: edge.id, from: edge.from_node_id, to: edge.to_node_id, relation: edge.relation })),
		},
	};
}

async function updateTicketPatch(env: Env, id: string, patch: Record<string, unknown>) {
	const columns: Record<string, unknown> = {
		title: patch.title,
		student: patch.student,
		owner_dept: patch.ownerDept,
		tag: patch.tag,
		severity: patch.severity,
		complexity: patch.complexity,
		status: patch.status,
		created_at: patch.createdAt,
		ai_summary: patch.aiSummary,
		collected_information: patch.collectedInformation,
		missing_information: patch.missingInformation,
		suggested_actions: Array.isArray(patch.suggestedActions) ? JSON.stringify(patch.suggestedActions) : undefined,
		confidence: patch.confidence,
		claimed_by: patch.claimedBy,
		edited: patch.edited === undefined ? 1 : Number(Boolean(patch.edited)),
		kb_ingested: patch.kbIngested === undefined ? undefined : Number(Boolean(patch.kbIngested)),
	};
	const entries = Object.entries(columns).filter((entry): entry is [string, unknown] => entry[1] !== undefined);
	if (entries.length === 0) return;
	await env.DB.prepare(`UPDATE tickets SET ${entries.map(([key]) => `${key} = ?`).join(", ")} WHERE id = ?`).bind(...entries.map(([, value]) => value), id).run();
}

async function seedAdminSnapshot(env: Env, snapshot: Record<string, unknown>) {
	const admins = Array.isArray(snapshot.admins) ? snapshot.admins as Record<string, unknown>[] : [];
	const tickets = Array.isArray(snapshot.tickets) ? snapshot.tickets as Record<string, unknown>[] : [];
	const kb = snapshot.kb && typeof snapshot.kb === "object" ? snapshot.kb as Record<string, unknown> : {};
	const nodes = Array.isArray(kb.nodes) ? kb.nodes as Record<string, unknown>[] : [];
	const edges = Array.isArray(kb.edges) ? kb.edges as Record<string, unknown>[] : [];

	await env.DB.prepare("DELETE FROM tasks").run();
	await env.DB.prepare("DELETE FROM cross_dept_participants").run();
	await env.DB.prepare("DELETE FROM ticket_notes").run();
	await env.DB.prepare("DELETE FROM ticket_messages").run();
	await env.DB.prepare("DELETE FROM tickets").run();
	await env.DB.prepare("DELETE FROM kb_edges").run();
	await env.DB.prepare("DELETE FROM kb_nodes").run();
	await env.DB.prepare("DELETE FROM admins").run();

	for (const admin of admins) {
		if (typeof admin.id === "string" && typeof admin.name === "string" && typeof admin.dept === "string" && typeof admin.role === "string") {
			await env.DB.prepare("INSERT INTO admins (id, name, dept, role) VALUES (?, ?, ?, ?)").bind(admin.id, admin.name, admin.dept, admin.role).run();
		}
	}

	for (const ticket of tickets) {
		if (typeof ticket.id !== "string") continue;
		const cross = ticket.cross && typeof ticket.cross === "object" ? ticket.cross as Record<string, unknown> : null;
		await env.DB.prepare(`
			INSERT INTO tickets (
				id, title, student, owner_dept, tag, severity, complexity, status, created_at,
				ai_summary, collected_information, missing_information, suggested_actions, confidence,
				claimed_by, edited, kb_ingested, cross_initiated_by, cross_active
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(
			ticket.id,
			ticket.title,
			ticket.student,
			ticket.ownerDept,
			ticket.tag,
			ticket.severity,
			ticket.complexity,
			ticket.status,
			ticket.createdAt,
			ticket.aiSummary,
			ticket.collectedInformation,
			ticket.missingInformation,
			JSON.stringify(Array.isArray(ticket.suggestedActions) ? ticket.suggestedActions : []),
			ticket.confidence,
			typeof ticket.claimedBy === "string" ? ticket.claimedBy : null,
			Number(Boolean(ticket.edited)),
			Number(Boolean(ticket.kbIngested)),
			typeof cross?.initiatedBy === "string" ? cross.initiatedBy : null,
			Number(Boolean(cross?.active)),
		).run();

		const conversation = Array.isArray(ticket.conversation) ? ticket.conversation as Record<string, unknown>[] : [];
		for (const [index, message] of conversation.entries()) {
			if (typeof message.role === "string" && typeof message.text === "string" && typeof message.at === "number") {
				await env.DB.prepare("INSERT INTO ticket_messages (id, ticket_id, role, text, at) VALUES (?, ?, ?, ?, ?)").bind(`msg-${ticket.id}-${index}`.replace(/[^a-zA-Z0-9_-]/g, "-"), ticket.id, message.role, message.text, message.at).run();
			}
		}

		const notes = Array.isArray(ticket.notes) ? ticket.notes as Record<string, unknown>[] : [];
		for (const note of notes) {
			if (typeof note.id === "string" && typeof note.adminId === "string" && typeof note.text === "string" && typeof note.at === "number") {
				await env.DB.prepare("INSERT INTO ticket_notes (id, ticket_id, admin_id, text, at) VALUES (?, ?, ?, ?, ?)").bind(note.id, ticket.id, note.adminId, note.text, note.at).run();
			}
		}

		const participants = Array.isArray(cross?.participants) ? cross.participants as Record<string, unknown>[] : [];
		for (const participant of participants) {
			if (typeof participant.dept === "string" && typeof participant.decision === "string") {
				await env.DB.prepare("INSERT INTO cross_dept_participants (ticket_id, dept, decision, reason) VALUES (?, ?, ?, ?)").bind(ticket.id, participant.dept, participant.decision, typeof participant.reason === "string" ? participant.reason : null).run();
			}
		}

		const taskRows = Array.isArray(cross?.tasks) ? cross.tasks as Record<string, unknown>[] : [];
		for (const task of taskRows) {
			if (typeof task.id === "string" && typeof task.title === "string" && typeof task.ownerDept === "string" && typeof task.status === "string") {
				await env.DB.prepare("INSERT INTO tasks (id, ticket_id, title, owner_dept, assignee, status, due) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(task.id, ticket.id, task.title, task.ownerDept, typeof task.assignee === "string" ? task.assignee : null, task.status, typeof task.due === "number" ? task.due : null).run();
			}
		}
	}

	for (const node of nodes) {
		if (typeof node.id === "string" && typeof node.dept === "string" && typeof node.kind === "string" && typeof node.label === "string") {
			await env.DB.prepare("INSERT INTO kb_nodes (id, dept, kind, label, body, meta) VALUES (?, ?, ?, ?, ?, ?)").bind(node.id, node.dept, node.kind, node.label, typeof node.body === "string" ? node.body : null, JSON.stringify(typeof node.meta === "object" && node.meta ? node.meta : {})).run();
		}
	}

	for (const edge of edges) {
		if (typeof edge.id === "string" && typeof edge.from === "string" && typeof edge.to === "string" && typeof edge.relation === "string") {
			await env.DB.prepare("INSERT INTO kb_edges (id, from_node_id, to_node_id, relation) VALUES (?, ?, ?, ?)").bind(edge.id, edge.from, edge.to, edge.relation).run();
		}
	}
}

function objectKeyFromPath(pathname: string, prefix: string) {
	return decodeURIComponent(pathname.slice(prefix.length)).replace(/^\/+/, "");
}

const sharedDevApi = {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
		if (!authorize(request, env)) return json({ error: "Unauthorized." }, { status: 401 });

		const url = new URL(request.url);

		if (url.pathname === "/internal/users" && request.method === "GET") {
			const result = await env.DB.prepare("SELECT id, email, name, created_at FROM users ORDER BY created_at").all<UserRow>();
			return json((result.results ?? []).map(userFromRow));
		}

		if (url.pathname === "/internal/users" && request.method === "POST") {
			const input = await request.json<{ email?: unknown; name?: unknown }>().catch(() => null);
			if (!input || typeof input.email !== "string" || !input.email.includes("@")) {
				return json({ error: "Valid email is required." }, { status: 400 });
			}

			const id = `usr_${crypto.randomUUID()}`;
			const name = typeof input.name === "string" ? input.name : null;
			const createdAt = Date.now();

			await env.DB.prepare("INSERT INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)")
				.bind(id, input.email, name, createdAt)
				.run();

			return json({ id, email: input.email, name, createdAt: new Date(createdAt).toISOString() }, { status: 201 });
		}

		if (url.pathname.startsWith("/internal/users/") && request.method === "GET") {
			const id = objectKeyFromPath(url.pathname, "/internal/users/");
			const row = await env.DB.prepare("SELECT id, email, name, created_at FROM users WHERE id = ? LIMIT 1").bind(id).first<UserRow>();
			if (!row) return json(null, { status: 404 });
			return json(userFromRow(row));
		}

		if (url.pathname === "/internal/admin/snapshot" && request.method === "GET") {
			return json(await adminSnapshot(env));
		}

		if (url.pathname === "/internal/admin/seed" && request.method === "POST") {
			const input = await request.json<{ snapshot?: Record<string, unknown> }>().catch(() => null);
			if (!input?.snapshot) return json({ error: "Valid admin snapshot is required." }, { status: 400 });
			await seedAdminSnapshot(env, input.snapshot);
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const ticketClaim = url.pathname.match(/^\/internal\/admin\/tickets\/([^/]+)\/claim$/);
		if (ticketClaim && request.method === "POST") {
			const input = await request.json<{ adminId?: unknown }>().catch(() => null);
			if (!input || typeof input.adminId !== "string") return json({ error: "Valid adminId is required." }, { status: 400 });
			const id = decodeURIComponent(ticketClaim[1]);
			const ticket = await env.DB.prepare("SELECT status FROM tickets WHERE id = ? LIMIT 1").bind(id).first<{ status: string }>();
			if (!ticket) return new Response(null, { status: 204, headers: corsHeaders });
			await env.DB.prepare("UPDATE tickets SET claimed_by = ?, status = ? WHERE id = ?").bind(input.adminId, ticket.status === "New" ? "In progress" : ticket.status, id).run();
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const ticketRelease = url.pathname.match(/^\/internal\/admin\/tickets\/([^/]+)\/release$/);
		if (ticketRelease && request.method === "POST") {
			await env.DB.prepare("UPDATE tickets SET claimed_by = NULL WHERE id = ?").bind(decodeURIComponent(ticketRelease[1])).run();
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const ticketNotes = url.pathname.match(/^\/internal\/admin\/tickets\/([^/]+)\/notes$/);
		if (ticketNotes && request.method === "POST") {
			const input = await request.json<{ note?: { id?: unknown; adminId?: unknown; text?: unknown; at?: unknown } }>().catch(() => null);
			const note = input?.note;
			if (!note || typeof note.id !== "string" || typeof note.adminId !== "string" || typeof note.text !== "string" || typeof note.at !== "number") return json({ error: "Valid note is required." }, { status: 400 });
			await env.DB.prepare("INSERT INTO ticket_notes (id, ticket_id, admin_id, text, at) VALUES (?, ?, ?, ?, ?)").bind(note.id, decodeURIComponent(ticketNotes[1]), note.adminId, note.text, note.at).run();
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const ticketSeverity = url.pathname.match(/^\/internal\/admin\/tickets\/([^/]+)\/severity$/);
		if (ticketSeverity && request.method === "POST") {
			const input = await request.json<{ severity?: unknown }>().catch(() => null);
			if (typeof input?.severity !== "string") return json({ error: "Valid severity is required." }, { status: 400 });
			await env.DB.prepare("UPDATE tickets SET severity = ?, edited = 1 WHERE id = ?").bind(input.severity, decodeURIComponent(ticketSeverity[1])).run();
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const ticketComplexity = url.pathname.match(/^\/internal\/admin\/tickets\/([^/]+)\/complexity$/);
		if (ticketComplexity && request.method === "POST") {
			const input = await request.json<{ complexity?: unknown }>().catch(() => null);
			if (typeof input?.complexity !== "string") return json({ error: "Valid complexity is required." }, { status: 400 });
			await env.DB.prepare("UPDATE tickets SET complexity = ?, edited = 1 WHERE id = ?").bind(input.complexity, decodeURIComponent(ticketComplexity[1])).run();
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const ticketResolve = url.pathname.match(/^\/internal\/admin\/tickets\/([^/]+)\/resolve$/);
		if (ticketResolve && request.method === "POST") {
			await env.DB.prepare("UPDATE tickets SET status = ? WHERE id = ?").bind("Resolved", decodeURIComponent(ticketResolve[1])).run();
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const ticketUpdate = url.pathname.match(/^\/internal\/admin\/tickets\/([^/]+)$/);
		if (ticketUpdate && request.method === "PATCH") {
			const input = await request.json<{ patch?: Record<string, unknown> }>().catch(() => null);
			if (!input?.patch) return json({ error: "Valid patch is required." }, { status: 400 });
			await updateTicketPatch(env, decodeURIComponent(ticketUpdate[1]), input.patch);
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const crossEscalate = url.pathname.match(/^\/internal\/admin\/tickets\/([^/]+)\/cross-dept\/escalate$/);
		if (crossEscalate && request.method === "POST") {
			const id = decodeURIComponent(crossEscalate[1]);
			const input = await request.json<{ depts?: unknown; by?: unknown; reason?: unknown }>().catch(() => null);
			if (!Array.isArray(input?.depts) || typeof input.by !== "string" || typeof input.reason !== "string") return json({ error: "Valid escalation input is required." }, { status: 400 });
			const ticket = await env.DB.prepare("SELECT owner_dept, cross_initiated_by FROM tickets WHERE id = ? LIMIT 1").bind(id).first<{ owner_dept: string; cross_initiated_by: string | null }>();
			if (!ticket || ticket.cross_initiated_by) return new Response(null, { status: 204, headers: corsHeaders });
			const initiatorDept = input.by === "ai" ? ticket.owner_dept : (await adminDepartment(env, input.by)) ?? ticket.owner_dept;
			const participantDepts = Array.from(new Set([initiatorDept, ...input.depts.filter((dept): dept is string => typeof dept === "string" && dept !== initiatorDept)]));
			await env.DB.prepare("UPDATE tickets SET cross_initiated_by = ?, cross_active = 0 WHERE id = ?").bind(input.by, id).run();
			for (const dept of participantDepts) {
				await env.DB.prepare("INSERT INTO cross_dept_participants (ticket_id, dept, decision, reason) VALUES (?, ?, ?, ?)").bind(id, dept, dept === initiatorDept ? "accepted" : "pending", dept === initiatorDept ? null : input.reason).run();
			}
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const crossRespond = url.pathname.match(/^\/internal\/admin\/tickets\/([^/]+)\/cross-dept\/respond$/);
		if (crossRespond && request.method === "POST") {
			const id = decodeURIComponent(crossRespond[1]);
			const input = await request.json<{ dept?: unknown; decision?: unknown; reason?: unknown }>().catch(() => null);
			if (typeof input?.dept !== "string" || (input.decision !== "accepted" && input.decision !== "rejected")) return json({ error: "Valid response input is required." }, { status: 400 });
			const ticket = await env.DB.prepare("SELECT owner_dept, cross_initiated_by, cross_active FROM tickets WHERE id = ? LIMIT 1").bind(id).first<{ owner_dept: string; cross_initiated_by: string | null; cross_active: number }>();
			if (!ticket?.cross_initiated_by) return new Response(null, { status: 204, headers: corsHeaders });
			const rows = (await env.DB.prepare("SELECT * FROM cross_dept_participants WHERE ticket_id = ?").bind(id).all<ParticipantRow>()).results ?? [];
			const initiatorDept = ticket.cross_initiated_by === "ai" ? ticket.owner_dept : (await adminDepartment(env, ticket.cross_initiated_by)) ?? ticket.owner_dept;
			let participants = rows.map((participant) => (participant.dept === input.dept ? { ...participant, decision: input.decision as "accepted" | "rejected", reason: typeof input.reason === "string" ? input.reason : participant.reason } : participant));
			const acceptedTargets = participants.filter((participant) => participant.dept !== initiatorDept && participant.decision === "accepted");
			const pendingTargets = participants.filter((participant) => participant.dept !== initiatorDept && participant.decision === "pending");
			const autoAcceptLast = input.decision === "rejected" && acceptedTargets.length === 0 && pendingTargets.length === 1;
			if (autoAcceptLast) participants = participants.map((participant) => (participant.decision === "pending" ? { ...participant, decision: "accepted" } : participant));
			const active = Boolean(ticket.cross_active) || autoAcceptLast || participants.some((participant) => participant.dept !== initiatorDept && participant.decision === "accepted");
			for (const participant of participants) {
				await env.DB.prepare("UPDATE cross_dept_participants SET decision = ?, reason = ? WHERE ticket_id = ? AND dept = ?").bind(participant.decision, participant.reason, id, participant.dept).run();
			}
			await env.DB.prepare("UPDATE tickets SET cross_active = ? WHERE id = ?").bind(Number(active), id).run();
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const ticketTasks = url.pathname.match(/^\/internal\/admin\/tickets\/([^/]+)\/tasks$/);
		if (ticketTasks && request.method === "POST") {
			const input = await request.json<{ task?: Record<string, unknown> }>().catch(() => null);
			const task = input?.task;
			if (!task || typeof task.id !== "string" || typeof task.title !== "string" || typeof task.ownerDept !== "string" || typeof task.status !== "string") return json({ error: "Valid task is required." }, { status: 400 });
			await env.DB.prepare("INSERT INTO tasks (id, ticket_id, title, owner_dept, assignee, status, due) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(task.id, decodeURIComponent(ticketTasks[1]), task.title, task.ownerDept, typeof task.assignee === "string" ? task.assignee : null, task.status, typeof task.due === "number" ? task.due : null).run();
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const ticketTaskUpdate = url.pathname.match(/^\/internal\/admin\/tickets\/([^/]+)\/tasks\/([^/]+)$/);
		if (ticketTaskUpdate && request.method === "PATCH") {
			const input = await request.json<{ patch?: Record<string, unknown> }>().catch(() => null);
			const patch = input?.patch ?? {};
			const columns: Record<string, unknown> = { title: patch.title, owner_dept: patch.ownerDept, assignee: patch.assignee, status: patch.status, due: patch.due };
			const entries = Object.entries(columns).filter((entry): entry is [string, unknown] => entry[1] !== undefined);
			if (entries.length > 0) await env.DB.prepare(`UPDATE tasks SET ${entries.map(([key]) => `${key} = ?`).join(", ")} WHERE ticket_id = ? AND id = ?`).bind(...entries.map(([, value]) => value), decodeURIComponent(ticketTaskUpdate[1]), decodeURIComponent(ticketTaskUpdate[2])).run();
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		if (url.pathname === "/internal/admin/kb/ingest" && request.method === "POST") {
			const input = await request.json<{ node?: Record<string, unknown> }>().catch(() => null);
			const node = input?.node;
			if (!node || typeof node.id !== "string" || typeof node.dept !== "string" || typeof node.kind !== "string" || typeof node.label !== "string") return json({ error: "Valid KB node is required." }, { status: 400 });
			await env.DB.prepare("INSERT INTO kb_nodes (id, dept, kind, label, body, meta) VALUES (?, ?, ?, ?, ?, ?)").bind(node.id, node.dept, node.kind, node.label, typeof node.body === "string" ? node.body : null, JSON.stringify(typeof node.meta === "object" && node.meta ? node.meta : {})).run();
			const meta = typeof node.meta === "object" && node.meta ? node.meta as Record<string, unknown> : {};
			const sourceTicketId = typeof meta.sourceTicketId === "string" ? meta.sourceTicketId : typeof meta.sourceTicket === "string" ? meta.sourceTicket : null;
			if (sourceTicketId) await env.DB.prepare("UPDATE tickets SET kb_ingested = 1 WHERE id = ?").bind(sourceTicketId).run();
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		if (url.pathname === "/internal/admin/kb/nodes" && request.method === "POST") {
			const input = await request.json<{ node?: Record<string, unknown>; edges?: unknown }>().catch(() => null);
			const node = input?.node;
			if (!node || typeof node.id !== "string" || typeof node.dept !== "string" || typeof node.kind !== "string" || typeof node.label !== "string" || !Array.isArray(input.edges)) return json({ error: "Valid KB input is required." }, { status: 400 });
			await env.DB.prepare("INSERT INTO kb_nodes (id, dept, kind, label, body, meta) VALUES (?, ?, ?, ?, ?, ?)").bind(node.id, node.dept, node.kind, node.label, typeof node.body === "string" ? node.body : null, JSON.stringify(typeof node.meta === "object" && node.meta ? node.meta : {})).run();
			for (const edge of input.edges) {
				if (edge && typeof edge === "object" && "id" in edge && "from" in edge && "to" in edge && "relation" in edge) {
					const typed = edge as Record<string, unknown>;
					if (typeof typed.id === "string" && typeof typed.from === "string" && typeof typed.to === "string" && typeof typed.relation === "string") {
						await env.DB.prepare("INSERT INTO kb_edges (id, from_node_id, to_node_id, relation) VALUES (?, ?, ?, ?)").bind(typed.id, typed.from, typed.to, typed.relation).run();
					}
				}
			}
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		const kbNodeDelete = url.pathname.match(/^\/internal\/admin\/kb\/nodes\/([^/]+)$/);
		if (kbNodeDelete && request.method === "DELETE") {
			const id = decodeURIComponent(kbNodeDelete[1]);
			await env.DB.prepare("DELETE FROM kb_edges WHERE from_node_id = ? OR to_node_id = ?").bind(id, id).run();
			await env.DB.prepare("DELETE FROM kb_nodes WHERE id = ?").bind(id).run();
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		if (url.pathname === "/internal/uploads" && request.method === "POST") {
			const key = request.headers.get("x-object-key")?.replace(/[^a-zA-Z0-9._-]/g, "-") || `obj_${crypto.randomUUID()}`;
			const contentType = request.headers.get("content-type") ?? "application/octet-stream";
			await env.BUCKET.put(key, await request.arrayBuffer(), {
				httpMetadata: { contentType },
			});
			return json({ key }, { status: 201 });
		}

		if (url.pathname.startsWith("/internal/uploads/") && request.method === "GET") {
			const key = objectKeyFromPath(url.pathname, "/internal/uploads/");
			const object = await env.BUCKET.get(key);
			if (!object) return json({ error: "Object not found." }, { status: 404 });
			return new Response(object.body, {
				headers: {
					...corsHeaders,
					"Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
				},
			});
		}

		if (url.pathname.startsWith("/internal/uploads/") && request.method === "DELETE") {
			const key = objectKeyFromPath(url.pathname, "/internal/uploads/");
			await env.BUCKET.delete(key);
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		return json({ error: "Not found." }, { status: 404 });
	},
};

export default sharedDevApi;
