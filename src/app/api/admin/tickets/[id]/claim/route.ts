import { getDatabaseAdapter } from "@/db";
import { claimTicketSchema, withActingAdmin } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
	const parsed = await parseJsonBody(request, withActingAdmin(claimTicketSchema));
	if ("response" in parsed) return parsed.response;
	const { id } = await context.params;
	await getDatabaseAdapter().claimTicket(id, parsed.data.adminId);
	return emptyOk();
}
