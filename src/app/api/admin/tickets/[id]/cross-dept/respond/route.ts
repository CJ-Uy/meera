import { getDatabaseAdapter } from "@/db";
import { respondCrossDeptSchema, withActingAdmin } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
	const parsed = await parseJsonBody(request, withActingAdmin(respondCrossDeptSchema));
	if ("response" in parsed) return parsed.response;
	const { id } = await context.params;
	await getDatabaseAdapter().respondCrossDept(id, parsed.data.dept, parsed.data.decision, parsed.data.reason);
	return emptyOk();
}
