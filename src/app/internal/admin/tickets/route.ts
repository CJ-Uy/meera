import type { DemoTicket } from "@/features/admin/types";
import { authorizeInternalAdmin } from "../_helpers";

export async function POST(request: Request) {
	const auth = authorizeInternalAdmin(request);
	if ("response" in auth) return auth.response;
	const input = (await request.json().catch(() => null)) as { ticket?: DemoTicket } | null;
	if (!input?.ticket?.id || !input.ticket.title) {
		return Response.json({ error: "A support ticket payload is required." }, { status: 400 });
	}
	const result = await auth.db.createTicket(input.ticket);
	return Response.json(result);
}
