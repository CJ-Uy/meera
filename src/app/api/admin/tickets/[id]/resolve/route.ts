import { z } from "zod";
import { getDatabaseAdapter } from "@/db";
import { withActingAdmin } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
	const parsed = await parseJsonBody(request, withActingAdmin(z.object({})));
	if ("response" in parsed) return parsed.response;
	const { id } = await context.params;
	await getDatabaseAdapter().resolveTicket(id);
	return emptyOk();
}
