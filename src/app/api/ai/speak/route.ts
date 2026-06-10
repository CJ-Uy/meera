import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/features/ai/workers-ai-audio";

const MAX_TEXT_LENGTH = 2_000;

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as unknown;
		const text = typeof body === "object" && body !== null && typeof (body as { text?: unknown }).text === "string"
			? (body as { text: string }).text.trim()
			: "";
		if (!text || text.length > MAX_TEXT_LENGTH) {
			return NextResponse.json({ error: "Provide text between 1 and 2000 characters." }, { status: 400 });
		}
		const { bytes, contentType } = await synthesizeSpeech(text);
		return new Response(bytes, { headers: { "Content-Type": contentType, "Cache-Control": "no-store" } });
	} catch (error) {
		console.error("[Meera AI] speak request failed", error);
		const message = error instanceof Error ? error.message : "Could not synthesize speech.";
		return NextResponse.json({ error: message }, { status: 502 });
	}
}
