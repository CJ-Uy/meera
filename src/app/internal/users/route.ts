import { z } from "zod";
import { getDatabaseAdapter } from "@/db";
import { authorizeSharedApiRequest, sharedApiUnauthorizedResponse } from "@/server/shared-api-auth";
import { getSharedApiBackendEnv } from "@/server/shared-api-backend";

const createUserSchema = z.object({
	email: z.string().email(),
	name: z.string().optional().nullable(),
});

export async function GET(request: Request) {
	const auth = authorizeSharedApiRequest(request);
	if (!auth.authorized) return sharedApiUnauthorizedResponse(auth);

	const db = getDatabaseAdapter(getSharedApiBackendEnv());
	return Response.json(await db.listUsers());
}

export async function POST(request: Request) {
	const auth = authorizeSharedApiRequest(request);
	if (!auth.authorized) return sharedApiUnauthorizedResponse(auth);

	const input = createUserSchema.safeParse(await request.json().catch(() => null));
	if (!input.success) {
		return Response.json({ error: "Invalid user input." }, { status: 400 });
	}

	const db = getDatabaseAdapter(getSharedApiBackendEnv());
	return Response.json(await db.createUser(input.data), { status: 201 });
}
