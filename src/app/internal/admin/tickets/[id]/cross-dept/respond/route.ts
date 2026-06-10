import { respondCrossDeptSchema } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";
import { authorizeInternalAdmin } from "../../../../_helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
	const auth = authorizeInternalAdmin(request);
	if ("response" in auth) return auth.response;
	const parsed = await parseJsonBody(request, respondCrossDeptSchema);
	if ("response" in parsed) return parsed.response;
	const { id } = await context.params;
	await auth.db.respondCrossDept(id, parsed.data.dept, parsed.data.decision, parsed.data.reason);
	return emptyOk();
}
