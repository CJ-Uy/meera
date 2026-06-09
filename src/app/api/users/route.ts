import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabaseAdapter } from "@/db";

const createUserSchema = z.object({
	email: z.string().email(),
	name: z.string().optional().nullable(),
});

export async function GET() {
	const db = getDatabaseAdapter();
	return NextResponse.json(await db.listUsers());
}

export async function POST(request: Request) {
	const input = createUserSchema.safeParse(await request.json().catch(() => null));
	if (!input.success) {
		return NextResponse.json({ error: "Invalid user input." }, { status: 400 });
	}

	const db = getDatabaseAdapter();
	return NextResponse.json(await db.createUser(input.data), { status: 201 });
}
