import { MEERA_AI_SYSTEM_PROMPT } from "@/features/ai/ai-prompt";
import {
	coordinateCalibration,
	immediateOverlayResponse,
	isVisionRequest,
	messagesForProvider,
	resolveProviderResponse,
} from "@/features/ai/ai-provider-utils";
import { AI_OVERLAY_TOOLS } from "@/features/ai/ai-tools";
import {
	imageDataUrlToBase64,
	type AiChatRequest,
	type AiChatResponse,
	type AiProviderStatus,
	type AiToolCall,
} from "@/features/ai/ai-types";

type OllamaMessage = {
	role: "system" | "user" | "assistant";
	content: string;
	images?: string[];
};

type OllamaChatResponse = {
	message?: {
		content?: string;
		thinking?: string;
		tool_calls?: AiToolCall[];
	};
	done_reason?: string;
};

const DEFAULT_BASE_URL = "https://ollama.cjuy.dev";
const DEFAULT_CHAT_MODEL = "qwen3.5:9b";
const DEFAULT_VISION_MODEL = "qwen3-vl:8b";
const DEFAULT_TIMEOUT_MS = 85_000;
const DEFAULT_MAX_TOKENS = 256;
const OLLAMA_RETRY_DELAY_MS = 500;
const VISION_FIRST_ATTEMPT_TIMEOUT_MS = 30_000;

class OllamaHttpError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = "OllamaHttpError";
	}
}

class OllamaTimeoutError extends Error {
	constructor(readonly timeoutMs: number) {
		super(`Ollama request timed out after ${Math.ceil(timeoutMs / 1_000)} seconds.`);
		this.name = "OllamaTimeoutError";
	}
}

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
		maxTokens: positiveInteger(process.env.OLLAMA_MAX_TOKENS, DEFAULT_MAX_TOKENS),
		timeoutMs: positiveInteger(process.env.OLLAMA_REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
		apiKey: process.env.OLLAMA_API_KEY?.trim(),
	};
}

function headers(apiKey?: string) {
	return {
		"Content-Type": "application/json",
		...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
	};
}

async function ollamaFetch(path: string, init: RequestInit = {}, timeoutMs = config().timeoutMs) {
	const settings = config();
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(`${settings.baseUrl}${path}`, {
			...init,
			headers: { ...headers(settings.apiKey), ...init.headers },
			signal: controller.signal,
		});
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") throw new OllamaTimeoutError(timeoutMs);
		throw error;
	} finally {
		clearTimeout(timer);
	}
}

async function ollamaErrorMessage(response: Response) {
	const body = await response.text().catch(() => "");
	let providerError = "";
	try {
		const parsed = JSON.parse(body) as { error?: unknown };
		if (typeof parsed.error === "string") providerError = parsed.error.trim();
	} catch {
		// The proxy may return an HTML or plain-text error page.
	}
	if (providerError) return `Ollama HTTP ${response.status}: ${providerError.slice(0, 320)}`;
	if (response.status === 524) {
		return "Ollama timed out before it could finish the vision request. Try again, or use a more specific target so the request is cheaper.";
	}
	if (response.status === 502 || response.status === 503 || response.status === 504) {
		return `Ollama is temporarily unavailable or timed out (${response.status}). Try again in a moment.`;
	}
	const plainText = body
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	return `Ollama HTTP ${response.status}: ${(plainText || response.statusText).slice(0, 240)}`;
}

function toOllamaMessages(request: AiChatRequest, usesVision: boolean): OllamaMessage[] {
	return [
		{ role: "system", content: MEERA_AI_SYSTEM_PROMPT },
		...messagesForProvider(request, usesVision).map((message) => {
			const images = message.images?.map((image) => imageDataUrlToBase64(image.dataUrl)).filter((image): image is string => Boolean(image));
			const calibration = coordinateCalibration(message.images, { preferRelative1000: true });
			return {
				role: message.role,
				content: calibration ? `${message.content}\n\n${calibration}` : message.content,
				...(images?.length ? { images } : {}),
			};
		}),
	];
}

function isRetryableStatus(status: number) {
	return status === 500 || status === 502 || status === 503 || status === 504 || status === 524;
}

function visionAttemptTimeouts(totalTimeoutMs: number) {
	const availableMs = Math.max(2, totalTimeoutMs - OLLAMA_RETRY_DELAY_MS);
	const firstAttemptMs = Math.max(1, Math.min(VISION_FIRST_ATTEMPT_TIMEOUT_MS, Math.floor(availableMs / 2)));
	return [firstAttemptMs, Math.max(1, availableMs - firstAttemptMs)];
}

async function requestOllamaChat({
	maxTokens,
	model,
	request,
	settings,
	usesVision,
}: {
	maxTokens?: number;
	model: string;
	request: AiChatRequest;
	settings: ReturnType<typeof config>;
	usesVision: boolean;
}) {
	let lastError: Error | null = null;
	const attemptTimeouts = usesVision ? visionAttemptTimeouts(settings.timeoutMs) : [settings.timeoutMs, settings.timeoutMs];
	for (let attempt = 0; attempt < attemptTimeouts.length; attempt += 1) {
		let response: Response;
		try {
			response = await ollamaFetch(
				"/api/chat",
				{
					method: "POST",
					body: JSON.stringify({
						model,
						stream: false,
						think: false,
						options: {
							num_ctx: usesVision ? settings.visionContext : settings.chatContext,
							...(maxTokens ? { num_predict: maxTokens } : {}),
							temperature: 0.2,
						},
						messages: toOllamaMessages(request, usesVision),
						tools: AI_OVERLAY_TOOLS,
					}),
				},
				attemptTimeouts[attempt],
			);
		} catch (error) {
			lastError = error instanceof Error ? error : new Error("Ollama request failed.");
			const canRetryTimeout = usesVision && error instanceof OllamaTimeoutError && attempt === 0;
			if (!canRetryTimeout) {
				if (usesVision && error instanceof OllamaTimeoutError) {
					throw new Error(
						`Ollama vision request timed out twice within ${Math.ceil(settings.timeoutMs / 1_000)} seconds. The remote vision model may be busy; please try again.`,
					);
				}
				throw lastError;
			}
			await new Promise((resolve) => setTimeout(resolve, OLLAMA_RETRY_DELAY_MS));
			continue;
		}

		if (response.ok) return (await response.json()) as OllamaChatResponse;
		lastError = new OllamaHttpError(await ollamaErrorMessage(response), response.status);
		if (!isRetryableStatus(response.status) || attempt === attemptTimeouts.length - 1) throw lastError;
		await new Promise((resolve) => setTimeout(resolve, OLLAMA_RETRY_DELAY_MS));
	}
	throw lastError ?? new Error("Ollama chat request failed.");
}

export async function chatWithOllama(request: AiChatRequest): Promise<AiChatResponse> {
	const settings = config();
	const immediateResponse = immediateOverlayResponse(request);
	if (immediateResponse) return immediateResponse;

	const usesVision = isVisionRequest(request);
	const model = usesVision ? settings.visionModel : settings.chatModel;

	// Qwen3-VL can spend hundreds of generated tokens in its hidden thinking field.
	// Leave vision output uncapped so it can reach the actual tool call.
	const data = await requestOllamaChat({
		maxTokens: usesVision ? undefined : settings.maxTokens,
		model,
		request,
		settings,
		usesVision,
	});
	return resolveProviderResponse({
		content: data.message?.content,
		finishReason: data.done_reason,
		model,
		request,
		toolCalls: data.message?.tool_calls,
	});
}

export async function getOllamaStatus(): Promise<AiProviderStatus> {
	const settings = config();
	try {
		const response = await ollamaFetch("/api/tags");
		if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
		const data = (await response.json()) as { models?: Array<{ name?: string }> };
		const models = data.models?.map((model) => model.name).filter((name): name is string => Boolean(name)) ?? [];
		return {
			available: models.includes(settings.chatModel) && models.includes(settings.visionModel),
			provider: "ollama",
			providerLabel: "Ollama",
			chatModel: settings.chatModel,
			visionModel: settings.visionModel,
			models,
		};
	} catch (error) {
		return {
			available: false,
			provider: "ollama",
			providerLabel: "Ollama",
			chatModel: settings.chatModel,
			visionModel: settings.visionModel,
			models: [],
			error: error instanceof Error ? error.message : "Could not reach Ollama.",
		};
	}
}
