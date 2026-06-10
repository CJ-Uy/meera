import { getDatabaseAdapter } from "@/db";

export async function GET() {
	const db = getDatabaseAdapter();
	return Response.json(await db.loadAdminSnapshot());
}
