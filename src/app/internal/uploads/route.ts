import { createId } from "@/lib/ids";
import { authorizeSharedApiRequest, sharedApiUnauthorizedResponse } from "@/server/shared-api-auth";
import { getSharedApiBackendEnv } from "@/server/shared-api-backend";
import { getStorageAdapter } from "@/storage";

function safeObjectKey(value?: string | null) {
	const key = value?.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+|-+$/g, "");
	return key || createId("obj");
}

export async function POST(request: Request) {
	const auth = authorizeSharedApiRequest(request);
	if (!auth.authorized) return sharedApiUnauthorizedResponse(auth);

	const storage = getStorageAdapter(getSharedApiBackendEnv());
	const contentType = request.headers.get("content-type") ?? "application/octet-stream";
	const key = safeObjectKey(request.headers.get("x-object-key"));

	const result = await storage.putObject({
		key,
		body: await request.arrayBuffer(),
		contentType,
	});

	return Response.json(result, { status: 201 });
}
