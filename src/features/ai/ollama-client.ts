import { MEERA_AI_SYSTEM_PROMPT } from "@/features/ai/ai-prompt";
import {
	normalizeOverlayToolCalls,
	OLLAMA_OVERLAY_TOOLS,
	reconcileOverlayToolCalls,
	recoverOverlayToolCallsFromText,
	type OverlayCoordinateContext,
} from "@/features/ai/ai-tools";
import {
	imageDataUrlToBase64,
	type AiChatRequest,
	type AiChatResponse,
	type AiImageAttachment,
	type AiToolCall,
	type OllamaStatus,
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

function latestScreenFrameContext(request: AiChatRequest): OverlayCoordinateContext | undefined {
	for (const message of [...request.messages].reverse()) {
		for (const image of [...(message.images ?? [])].reverse()) {
			if (image.source === "screen" && image.width && image.height) {
				return {
					imageWidth: image.width,
					imageHeight: image.height,
					displayId: image.screen?.displayId,
					gridColumns: image.screen?.calibrationGrid?.columns,
					gridRows: image.screen?.calibrationGrid?.rows,
				};
			}
		}
	}
	return undefined;
}

function coordinateCalibration(images: AiImageAttachment[] | undefined) {
	const screenFrames = images?.filter((image) => image.source === "screen" && image.width && image.height) ?? [];
	if (screenFrames.length === 0) return "";

	return screenFrames
		.map((image, index) => {
			const label = image.screen?.displayLabel ? ` on ${image.screen.displayLabel}` : "";
			const grid = image.screen?.calibrationGrid;
			const gridText = grid
				? `
- The screenshot has a visible ${grid.columns} column x ${grid.rows} row calibration grid. Columns are letters from A, rows are numbers from 1.
- If exact pixels are hard, choose the nearest grid cell and pass gridCell, gridColumn/gridRow, or the cell center as coordinates.
`
				: "";
			return `

[Screen frame ${index + 1} coordinate calibration${label}]
- The attached desktop screenshot image is exactly ${image.width}x${image.height} pixels.
- For arrow, cursor, and bubble tools, target the CENTER of the visible thing.
- For highlight tools, x/y must be the TOP-LEFT of the rectangle and width/height must cover the visible thing.
- Preferred normalized formula: x = pixel_x / ${image.width}; y = pixel_y / ${image.height}; width = pixel_width / ${image.width}; height = pixel_height / ${image.height}.
- Qwen3-VL visual grounding uses relative coordinates from 0 to 1000. Prefer those values with coordinateSpace "relative_1000".
- You may also pass pixel values directly by setting coordinateSpace to "image_pixels".
- Never use the center of the image as a placeholder. Use the actual visible target.
- Do not compensate for the Meera chat window; it is hidden during capture.
${gridText}
`.trim();
		})
		.join("\n\n");
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

function messagesForOllama(request: AiChatRequest, usesVision: boolean) {
	if (!usesVision) return request.messages;
	const latestIndex = request.messages.length - 1;
	return request.messages.map((message, index) =>
		index === latestIndex ? message : { role: message.role, content: message.content },
	);
}

function toOllamaMessages(request: AiChatRequest, usesVision: boolean): OllamaMessage[] {
	return [
		{ role: "system", content: MEERA_AI_SYSTEM_PROMPT },
		...messagesForOllama(request, usesVision).map((message) => {
			const images = message.images?.map((image) => imageDataUrlToBase64(image.dataUrl)).filter((image): image is string => Boolean(image));
			const calibration = coordinateCalibration(message.images);
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
						tools: OLLAMA_OVERLAY_TOOLS,
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
	const usesVision = Boolean(request.messages.at(-1)?.images?.length);
	const model = usesVision ? settings.visionModel : settings.chatModel;
	const coordinateContext = latestScreenFrameContext(request);
	const prompt = request.messages.at(-1)?.content ?? "";
	const immediateToolCalls = usesVision ? [] : recoverOverlayToolCallsFromText({ prompt, content: "", context: coordinateContext });
	if (immediateToolCalls.length > 0) {
		return {
			message: "I applied that desktop guidance.",
			model: "meera-overlay",
			toolCalls: reconcileOverlayToolCalls({ prompt, content: "", context: coordinateContext, toolCalls: immediateToolCalls }),
		};
	}

	// Qwen3-VL can spend hundreds of generated tokens in its hidden thinking field.
	// Leave vision output uncapped so it can reach the actual tool call.
	const data = await requestOllamaChat({
		maxTokens: usesVision ? undefined : settings.maxTokens,
		model,
		request,
		settings,
		usesVision,
	});
	const nativeToolCalls = Array.isArray(data.message?.tool_calls)
		? normalizeOverlayToolCalls(data.message.tool_calls, coordinateContext)
		: [];
	const content = data.message?.content?.trim();
	const recoveredToolCalls =
		nativeToolCalls.length === 0
			? recoverOverlayToolCallsFromText({ prompt, content: content ?? "", context: coordinateContext })
			: [];
	const toolCalls = reconcileOverlayToolCalls({
		prompt,
		content: content ?? "",
		context: coordinateContext,
		toolCalls: nativeToolCalls.length ? nativeToolCalls : recoveredToolCalls,
	});
	if (!content && toolCalls.length === 0) {
		if (usesVision && data.done_reason === "length") {
			throw new Error("The vision model used its full response budget before choosing an overlay. Please try the request again.");
		}
		throw new Error("Ollama returned an empty response.");
	}

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
