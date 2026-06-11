import { getDatabaseAdapter } from "@/db";
import { actingAdminSchema, updateTicketSchema, withActingAdmin } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
	const parsed = await parseJsonBody(request, withActingAdmin(updateTicketSchema));
	if ("response" in parsed) return parsed.response;
	const { id } = await context.params;
	await getDatabaseAdapter().updateTicket(id, parsed.data.patch);
	return emptyOk();
}

export async function DELETE(request: Request, context: RouteContext) {
	const parsed = await parseJsonBody(request, actingAdminSchema);
	if ("response" in parsed) return parsed.response;
	const { id } = await context.params;
	await getDatabaseAdapter().deleteTicket(id);
	return emptyOk();
}
