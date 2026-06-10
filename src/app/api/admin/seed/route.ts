import { getDatabaseAdapter } from "@/db";
import { adminSeedSnapshot } from "@/features/admin/data/seed";
import { emptyOk } from "@/features/admin/api/route-utils";

export async function POST(request: Request) {
	const expected = process.env.ADMIN_SEED_TOKEN ?? process.env.SHARED_API_TOKEN;
	if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
		return Response.json({ error: "Unauthorized." }, { status: 401 });
	}

	await getDatabaseAdapter().seedAdminSnapshot(adminSeedSnapshot);
	return emptyOk();
}
