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
