import { authorizeInternalAdmin } from "../_helpers";

export async function GET(request: Request) {
	const auth = authorizeInternalAdmin(request);
	if ("response" in auth) return auth.response;
	return Response.json(await auth.db.loadAdminSnapshot());
}
