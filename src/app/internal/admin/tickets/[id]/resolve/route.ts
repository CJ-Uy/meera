import { emptyOk } from "@/features/admin/api/route-utils";
import { authorizeInternalAdmin } from "../../../_helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
	const auth = authorizeInternalAdmin(request);
	if ("response" in auth) return auth.response;
	const { id } = await context.params;
	await auth.db.resolveTicket(id);
	return emptyOk();
}
