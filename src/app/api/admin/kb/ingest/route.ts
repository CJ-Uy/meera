import { getDatabaseAdapter } from "@/db";
import { ingestKbSchema, withActingAdmin } from "@/features/admin/api/schemas";
import { emptyOk, parseJsonBody } from "@/features/admin/api/route-utils";

export async function POST(request: Request) {
	const parsed = await parseJsonBody(request, withActingAdmin(ingestKbSchema));
	if ("response" in parsed) return parsed.response;
	await getDatabaseAdapter().ingestKb(parsed.data.node);
	return emptyOk();
}
