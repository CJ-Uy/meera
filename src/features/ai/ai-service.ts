import { chatWithGroq, getGroqStatus } from "@/features/ai/groq-client";
import { chatWithWorkersAi, getWorkersAiStatus } from "@/features/ai/workers-ai-client";
import type {
	AiChatRequest,
	AiChatResponse,
	AiProviderName,
	AiProviderStatus,
} from "@/features/ai/ai-types";

/**
 * Provider seam. Defaults to Cloudflare Workers AI; set AI_PROVIDER=groq to fall back to Groq during the
 * migration (lets us A/B and roll back instantly without code changes).
 */
export function configuredAiProvider(): AiProviderName {
	return process.env.AI_PROVIDER?.trim() === "groq" ? "groq" : "workers-ai";
}

export async function chatWithAi(request: AiChatRequest): Promise<AiChatResponse> {
	return configuredAiProvider() === "groq" ? chatWithGroq(request) : chatWithWorkersAi(request);
}

export async function getAiStatus(): Promise<AiProviderStatus> {
	const provider = configuredAiProvider();
	const status = provider === "groq" ? await getGroqStatus() : await getWorkersAiStatus();
	return { ...status, configuredProvider: provider };
}
