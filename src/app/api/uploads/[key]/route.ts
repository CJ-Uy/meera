import { getStorageAdapter } from "@/storage";

type RouteContext = {
	params: Promise<{ key: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
	const { key } = await context.params;
	const storage = getStorageAdapter();
	const object = await storage.getObject(key);

	if (!object.body) {
		return Response.json({ error: "Object not found." }, { status: 404 });
	}

	return new Response(object.body, {
		headers: object.contentType ? { "Content-Type": object.contentType } : undefined,
	});
}

export async function DELETE(_request: Request, context: RouteContext) {
	const { key } = await context.params;
	const storage = getStorageAdapter();
	await storage.deleteObject(key);
	return new Response(null, { status: 204 });
}
