import { chatWithGroq, getGroqStatus } from "@/features/ai/groq-client";
import { chatWithOllama, getOllamaStatus } from "@/features/ai/ollama-client";
import type {
	AiChatRequest,
	AiChatResponse,
	AiProviderName,
	AiProviderStatus,
} from "@/features/ai/ai-types";

function providerName(value: string | undefined, fallback?: AiProviderName): AiProviderName | undefined {
	const normalized = value?.trim().toLowerCase();
	if (normalized === "groq" || normalized === "ollama") return normalized;
	return fallback;
}

export function configuredAiProvider() {
	return providerName(process.env.AI_PROVIDER, "groq") as AiProviderName;
}

function configuredFallbackProvider(primary: AiProviderName) {
	const fallback = providerName(process.env.AI_FALLBACK_PROVIDER);
	return fallback === primary ? undefined : fallback;
}

function chatWithProvider(provider: AiProviderName, request: AiChatRequest) {
	return provider === "groq" ? chatWithGroq(request) : chatWithOllama(request);
}

function statusForProvider(provider: AiProviderName) {
	return provider === "groq" ? getGroqStatus() : getOllamaStatus();
}

export async function chatWithAi(request: AiChatRequest): Promise<AiChatResponse> {
	const primary = configuredAiProvider();
	const fallback = configuredFallbackProvider(primary);
	try {
		return await chatWithProvider(primary, request);
	} catch (error) {
		if (!fallback) throw error;
		console.warn(`[Meera AI] ${primary} failed; retrying with ${fallback}`, error);
		return chatWithProvider(fallback, request);
	}
}

export async function getAiStatus(): Promise<AiProviderStatus> {
	const primary = configuredAiProvider();
	const fallback = configuredFallbackProvider(primary);
	const primaryStatus = await statusForProvider(primary);
	if (primaryStatus.available || !fallback) {
		return {
			...primaryStatus,
			configuredProvider: primary,
			...(fallback ? { fallbackProvider: fallback } : {}),
		};
	}

	const fallbackStatus = await statusForProvider(fallback);
	if (fallbackStatus.available) {
		return {
			...fallbackStatus,
			configuredProvider: primary,
			fallbackProvider: fallback,
			fallbackActive: true,
			error: primaryStatus.error,
		};
	}

	return {
		...primaryStatus,
		configuredProvider: primary,
		fallbackProvider: fallback,
		error: [primaryStatus.error, fallbackStatus.error].filter(Boolean).join(" Fallback: "),
	};
}
