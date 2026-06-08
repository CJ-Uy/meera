import { MEERA_AI_SYSTEM_PROMPT } from "@/features/ai/ai-prompt";
import { OLLAMA_OVERLAY_TOOLS, recoverOverlayToolCallsFromText } from "@/features/ai/ai-tools";
import { imageDataUrlToBase64, type AiChatRequest, type AiChatResponse, type AiToolCall, type OllamaStatus } from "@/features/ai/ai-types";

type OllamaMessage = {
	role: "system" | "user" | "assistant";
	content: string;
	images?: string[];
};

type OllamaChatResponse = {
	message?: {
		content?: string;
		tool_calls?: AiToolCall[];
	};
};

const DEFAULT_BASE_URL = "https://ollama.cjuy.dev";
const DEFAULT_CHAT_MODEL = "qwen3.5:9b";
const DEFAULT_VISION_MODEL = "qwen3-vl:8b";

function positiveInteger(value: string | undefined, fallback: number) {
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function config() {
	return {
		baseUrl: (process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
		chatModel: process.env.OLLAMA_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL,
		visionModel: process.env.OLLAMA_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL,
		chatContext: positiveInteger(process.env.OLLAMA_CHAT_CONTEXT, 8_192),
		visionContext: positiveInteger(process.env.OLLAMA_VISION_CONTEXT, 4_096),
		timeoutMs: positiveInteger(process.env.OLLAMA_REQUEST_TIMEOUT_MS, 180_000),
		apiKey: process.env.OLLAMA_API_KEY?.trim(),
	};
}

function headers(apiKey?: string) {
	return {
		"Content-Type": "application/json",
		...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
	};
}

async function ollamaFetch(path: string, init: RequestInit = {}) {
	const settings = config();
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), settings.timeoutMs);
	try {
		return await fetch(`${settings.baseUrl}${path}`, {
			...init,
			headers: { ...headers(settings.apiKey), ...init.headers },
			signal: controller.signal,
		});
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") throw new Error("Ollama request timed out.");
		throw error;
	} finally {
		clearTimeout(timer);
	}
}

function toOllamaMessages(request: AiChatRequest): OllamaMessage[] {
	return [
		{ role: "system", content: MEERA_AI_SYSTEM_PROMPT },
		...request.messages.map((message) => {
			const images = message.images?.map((image) => imageDataUrlToBase64(image.dataUrl)).filter((image): image is string => Boolean(image));
			return {
				role: message.role,
				content: message.content,
				...(images?.length ? { images } : {}),
			};
		}),
	];
}

export async function chatWithOllama(request: AiChatRequest): Promise<AiChatResponse> {
	const settings = config();
	const usesVision = request.messages.some((message) => Boolean(message.images?.length));
	const model = usesVision ? settings.visionModel : settings.chatModel;
	const response = await ollamaFetch("/api/chat", {
		method: "POST",
		body: JSON.stringify({
			model,
			stream: false,
			think: false,
			options: {
				num_ctx: usesVision ? settings.visionContext : settings.chatContext,
				temperature: 0.2,
			},
			messages: toOllamaMessages(request),
			tools: OLLAMA_OVERLAY_TOOLS,
		}),
	});

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new Error(`Ollama HTTP ${response.status}: ${body.slice(0, 300) || response.statusText}`);
	}

	const data = (await response.json()) as OllamaChatResponse;
	const nativeToolCalls = Array.isArray(data.message?.tool_calls) ? data.message.tool_calls : [];
	const content = data.message?.content?.trim();
	const recoveredToolCalls =
		nativeToolCalls.length === 0
			? recoverOverlayToolCallsFromText({ prompt: request.messages.at(-1)?.content ?? "", content: content ?? "" })
			: [];
	const toolCalls = nativeToolCalls.length ? nativeToolCalls : recoveredToolCalls;
	if (!content && toolCalls.length === 0) throw new Error("Ollama returned an empty response.");

	return {
		message: recoveredToolCalls.length ? "I marked that on your desktop." : content || "I sent the requested guidance to the desktop overlay.",
		model,
		toolCalls,
	};
}

export async function getOllamaStatus(): Promise<OllamaStatus> {
	const settings = config();
	try {
		const response = await ollamaFetch("/api/tags");
		if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
		const data = (await response.json()) as { models?: Array<{ name?: string }> };
		const models = data.models?.map((model) => model.name).filter((name): name is string => Boolean(name)) ?? [];
		return {
			available: models.includes(settings.chatModel) && models.includes(settings.visionModel),
			chatModel: settings.chatModel,
			visionModel: settings.visionModel,
			models,
		};
	} catch (error) {
		return {
			available: false,
			chatModel: settings.chatModel,
			visionModel: settings.visionModel,
			models: [],
			error: error instanceof Error ? error.message : "Could not reach Ollama.",
		};
	}
}
