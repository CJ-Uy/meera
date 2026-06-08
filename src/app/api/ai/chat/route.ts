import { NextResponse } from "next/server";
import { isAiChatRequest } from "@/features/ai/ai-types";
import { chatWithOllama, getOllamaStatus } from "@/features/ai/ollama-client";

export async function GET() {
	return NextResponse.json(await getOllamaStatus());
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as unknown;
		if (!isAiChatRequest(body)) {
			return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
		}
		return NextResponse.json(await chatWithOllama(body));
	} catch (error) {
		console.error("[Meera AI] chat request failed", error);
		const message = error instanceof Error ? error.message : "Meera could not reach Ollama.";
		return NextResponse.json({ error: message }, { status: 502 });
	}
}
