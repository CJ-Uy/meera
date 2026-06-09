import { getDatabaseAdapter } from "@/db";
import { authorizeSharedApiRequest, sharedApiUnauthorizedResponse } from "@/server/shared-api-auth";
import { getSharedApiBackendEnv } from "@/server/shared-api-backend";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
	const auth = authorizeSharedApiRequest(request);
	if (!auth.authorized) return sharedApiUnauthorizedResponse(auth);

	const { id } = await context.params;
	const db = getDatabaseAdapter(getSharedApiBackendEnv());
	const user = await db.getUserById(id);

	if (!user) return Response.json(null, { status: 404 });
	return Response.json(user);
}
