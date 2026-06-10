import { getDatabaseAdapter } from "@/db";
import { escalateCrossDeptSchema, withActingAdmin } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
	const parsed = await parseJsonBody(request, withActingAdmin(escalateCrossDeptSchema));
	if ("response" in parsed) return parsed.response;
	const { id } = await context.params;
	await getDatabaseAdapter().escalateCrossDept(id, parsed.data.depts, parsed.data.by, parsed.data.reason);
	return emptyOk();
}
