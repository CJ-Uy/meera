import { getDatabaseAdapter } from "@/db";
import { setSeveritySchema, withActingAdmin } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
	const parsed = await parseJsonBody(request, withActingAdmin(setSeveritySchema));
	if ("response" in parsed) return parsed.response;
	const { id } = await context.params;
	await getDatabaseAdapter().setSeverity(id, parsed.data.severity);
	return emptyOk();
}
