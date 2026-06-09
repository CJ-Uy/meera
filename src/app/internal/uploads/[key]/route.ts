import { authorizeSharedApiRequest, sharedApiUnauthorizedResponse } from "@/server/shared-api-auth";
import { getSharedApiBackendEnv } from "@/server/shared-api-backend";
import { getStorageAdapter } from "@/storage";

type RouteContext = {
	params: Promise<{ key: string }>;
};

export async function GET(request: Request, context: RouteContext) {
	const auth = authorizeSharedApiRequest(request);
	if (!auth.authorized) return sharedApiUnauthorizedResponse(auth);

	const { key } = await context.params;
	const storage = getStorageAdapter(getSharedApiBackendEnv());
	const object = await storage.getObject(key);

	if (!object.body) return Response.json({ error: "Object not found." }, { status: 404 });

	return new Response(object.body, {
		headers: object.contentType ? { "Content-Type": object.contentType } : undefined,
	});
}

export async function DELETE(request: Request, context: RouteContext) {
	const auth = authorizeSharedApiRequest(request);
	if (!auth.authorized) return sharedApiUnauthorizedResponse(auth);

	const { key } = await context.params;
	const storage = getStorageAdapter(getSharedApiBackendEnv());
	await storage.deleteObject(key);
	return new Response(null, { status: 204 });
}
