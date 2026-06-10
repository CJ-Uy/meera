import { getDatabaseAdapter } from "@/db";
import { withActingAdmin } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
	const parsed = await parseJsonBody(request, withActingAdmin(z.object({})));
	if ("response" in parsed) return parsed.response;
	const { id } = await context.params;
	await getDatabaseAdapter().deleteKbNode(id);
	return emptyOk();
}
