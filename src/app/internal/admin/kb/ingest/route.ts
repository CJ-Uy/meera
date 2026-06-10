import { ingestKbSchema } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";
import { authorizeInternalAdmin } from "../../_helpers";

export async function POST(request: Request) {
	const auth = authorizeInternalAdmin(request);
	if ("response" in auth) return auth.response;
	const parsed = await parseJsonBody(request, ingestKbSchema);
	if ("response" in parsed) return parsed.response;
	await auth.db.ingestKb(parsed.data.node);
	return emptyOk();
}
