import { getDatabaseAdapter } from "@/db";
import { updateTaskSchema, withActingAdmin } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
	const parsed = await parseJsonBody(request, withActingAdmin(updateTaskSchema));
	if ("response" in parsed) return parsed.response;
	const { id, taskId } = await context.params;
	await getDatabaseAdapter().updateTask(id, taskId, parsed.data.patch);
	return emptyOk();
}
