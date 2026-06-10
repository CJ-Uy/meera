import { getDatabaseAdapter } from "@/db";
import { authorizeSharedApiRequest, sharedApiUnauthorizedResponse } from "@/server/shared-api-auth";
import { getSharedApiBackendEnv } from "@/server/shared-api-backend";

export function authorizeInternalAdmin(request: Request) {
	const auth = authorizeSharedApiRequest(request);
	if (!auth.authorized) return { response: sharedApiUnauthorizedResponse(auth) };
	return { db: getDatabaseAdapter(getSharedApiBackendEnv()) };
}
