import { adminSeedSnapshot } from "@/features/admin/data/seed";
import { emptyOk } from "@/features/admin/api/route-utils";
import type { AdminSnapshot } from "@/features/admin/types";
import { authorizeInternalAdmin } from "../_helpers";

export async function POST(request: Request) {
	const auth = authorizeInternalAdmin(request);
	if ("response" in auth) return auth.response;
	const input = await request.json().catch(() => null) as { snapshot?: AdminSnapshot } | null;
	await auth.db.seedAdminSnapshot(input?.snapshot ?? adminSeedSnapshot);
	return emptyOk();
}
