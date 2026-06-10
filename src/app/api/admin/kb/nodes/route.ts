import { getDatabaseAdapter } from "@/db";
import { createKbNodeSchema, withActingAdmin } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";

export async function POST(request: Request) {
	const parsed = await parseJsonBody(request, withActingAdmin(createKbNodeSchema));
	if ("response" in parsed) return parsed.response;
	await getDatabaseAdapter().createKbNode(parsed.data.node, parsed.data.edges);
	return emptyOk();
}
