import { z } from "zod";

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>) {
	const input = schema.safeParse(await request.json().catch(() => null));
	if (!input.success) return { response: Response.json({ error: "Invalid admin input." }, { status: 400 }) };
	return { data: input.data };
}

export function emptyOk() {
	return new Response(null, { status: 204 });
}
