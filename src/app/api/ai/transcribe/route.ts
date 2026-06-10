import { NextResponse } from "next/server";
import { transcribeAudio } from "@/features/ai/workers-ai-audio";

// ~9 MB of audio once base64-encoded. Voice input is meant for short utterances.
const MAX_AUDIO_BASE64 = 12_000_000;

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as unknown;
		if (typeof body !== "object" || body === null) {
			return NextResponse.json({ error: "Invalid request." }, { status: 400 });
		}
		const { audio, language } = body as { audio?: unknown; language?: unknown };
		if (typeof audio !== "string" || audio.length === 0 || audio.length > MAX_AUDIO_BASE64) {
			return NextResponse.json({ error: "Invalid audio payload." }, { status: 400 });
		}
		// Accept either a raw base64 string or a data URL.
		const base64 = audio.replace(/^data:[^,]+,/, "");
		const text = await transcribeAudio(base64, typeof language === "string" ? { language: language.slice(0, 8) } : undefined);
		return NextResponse.json({ text });
	} catch (error) {
		console.error("[Meera AI] transcribe request failed", error);
		const message = error instanceof Error ? error.message : "Could not transcribe the audio.";
		return NextResponse.json({ error: message }, { status: 502 });
	}
}
