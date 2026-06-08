import { NextResponse } from "next/server";
import { chatWithAi, getAiStatus } from "@/features/ai/ai-service";
import { isAiChatRequest } from "@/features/ai/ai-types";

export async function GET() {
	return NextResponse.json(await getAiStatus());
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as unknown;
		if (!isAiChatRequest(body)) {
			return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
		}
		return NextResponse.json(await chatWithAi(body));
	} catch (error) {
		console.error("[Meera AI] chat request failed", error);
		const message = error instanceof Error ? error.message : "Meera could not reach the AI provider.";
		return NextResponse.json({ error: message }, { status: 502 });
	}
}
