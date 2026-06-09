import { chatWithGroq, getGroqStatus } from "@/features/ai/groq-client";
import type {
	AiChatRequest,
	AiChatResponse,
	AiProviderName,
	AiProviderStatus,
} from "@/features/ai/ai-types";

export function configuredAiProvider(): AiProviderName {
	return "groq";
}

export async function chatWithAi(request: AiChatRequest): Promise<AiChatResponse> {
	return chatWithGroq(request);
}

export async function getAiStatus(): Promise<AiProviderStatus> {
	const status = await getGroqStatus();
	return { ...status, configuredProvider: "groq" };
}
