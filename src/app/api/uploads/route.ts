import { NextResponse } from "next/server";
import { createId } from "@/lib/ids";
import { getStorageAdapter } from "@/storage";

function safeUploadKey(name?: string | null) {
	const filename = name?.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+|-+$/g, "");
	return filename ? `${createId("obj")}-${filename}` : createId("obj");
}

export async function POST(request: Request) {
	const storage = getStorageAdapter();
	const contentType = request.headers.get("content-type") ?? undefined;

	if (contentType?.includes("multipart/form-data")) {
		const formData = await request.formData();
		const file = formData.get("file");
		if (!(file instanceof File)) {
			return NextResponse.json({ error: "Expected multipart field named file." }, { status: 400 });
		}

		const result = await storage.putObject({
			key: safeUploadKey(file.name),
			body: file,
			contentType: file.type || "application/octet-stream",
		});
		return NextResponse.json(result, { status: 201 });
	}

	const key = safeUploadKey(request.headers.get("x-file-name"));
	const result = await storage.putObject({
		key,
		body: await request.arrayBuffer(),
		contentType: contentType ?? "application/octet-stream",
	});
	return NextResponse.json(result, { status: 201 });
}
