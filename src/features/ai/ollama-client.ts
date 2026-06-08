import { MEERA_AI_SYSTEM_PROMPT } from "@/features/ai/ai-prompt";
import {
	normalizeOverlayToolCalls,
	OLLAMA_OVERLAY_TOOLS,
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
		tool_calls?: AiToolCall[];
	};
};

const DEFAULT_BASE_URL = "https://ollama.cjuy.dev";
const DEFAULT_CHAT_MODEL = "qwen3.5:9b";
const DEFAULT_VISION_MODEL = "qwen3-vl:8b";
const DEFAULT_TIMEOUT_MS = 85_000;

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
- You may also pass pixel values directly by setting coordinateSpace to "image_pixels".
- Do not compensate for the Meera chat window; it is hidden during capture.
${gridText}
`.trim();
		})
		.join("\n\n");
}

async function ollamaErrorMessage(response: Response) {
	if (response.status === 524) {
		return "Ollama timed out before it could finish the vision request. Try again, or use a more specific target so the request is cheaper.";
	}
	if (response.status === 502 || response.status === 503 || response.status === 504) {
		return `Ollama is temporarily unavailable or timed out (${response.status}). Try again in a moment.`;
	}
	const body = await response.text().catch(() => "");
	const plainText = body
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	return `Ollama HTTP ${response.status}: ${(plainText || response.statusText).slice(0, 240)}`;
}

function toOllamaMessages(request: AiChatRequest): OllamaMessage[] {
	return [
		{ role: "system", content: MEERA_AI_SYSTEM_PROMPT },
		...request.messages.map((message) => {
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

export async function chatWithOllama(request: AiChatRequest): Promise<AiChatResponse> {
	const settings = config();
	const usesVision = request.messages.some((message) => Boolean(message.images?.length));
	const model = usesVision ? settings.visionModel : settings.chatModel;
	const coordinateContext = latestScreenFrameContext(request);
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
		throw new Error(await ollamaErrorMessage(response));
	}

	const data = (await response.json()) as OllamaChatResponse;
	const nativeToolCalls = Array.isArray(data.message?.tool_calls)
		? normalizeOverlayToolCalls(data.message.tool_calls, coordinateContext)
		: [];
	const content = data.message?.content?.trim();
	const recoveredToolCalls =
		nativeToolCalls.length === 0
			? recoverOverlayToolCallsFromText({ prompt: request.messages.at(-1)?.content ?? "", content: content ?? "", context: coordinateContext })
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
