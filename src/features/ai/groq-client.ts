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
	buildSelectionMessages,
	parseSelection,
	SELECT_OVERLAY_TARGET_TOOL,
	SELECTION_SYSTEM_PROMPT,
	selectionToToolCalls,
} from "@/features/ai/grounding/select";
import type {
	AiChatRequest,
	AiChatResponse,
	AiProviderStatus,
	AiToolCall,
} from "@/features/ai/ai-types";

type GroqContentPart =
	| { type: "text"; text: string }
	| { type: "image_url"; image_url: { url: string } };

type GroqMessage = {
	role: "system" | "user" | "assistant";
	content: string | GroqContentPart[];
};

type GroqChatResponse = {
	model?: string;
	choices?: Array<{
		finish_reason?: string | null;
		message?: {
			content?: string | null;
			tool_calls?: AiToolCall[];
		};
	}>;
};

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_CHAT_MODEL = "llama-3.1-8b-instant";
const DEFAULT_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
// Stronger text reasoner used to SELECT an element from the candidate list (no coordinate regression).
const DEFAULT_SELECTION_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_TIMEOUT_MS = 30_000;
const SELECTION_TIMEOUT_MS = 12_000;
const SELECTION_MAX_TOKENS = 256;
const DEFAULT_MAX_TOKENS = 512;
const GROQ_RETRY_DELAY_MS = 400;
const GROQ_FIRST_ATTEMPT_TIMEOUT_MS = 10_000;

class GroqHttpError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = "GroqHttpError";
	}
}

class GroqTimeoutError extends Error {
	constructor(readonly timeoutMs: number) {
		super(`Groq request timed out after ${Math.ceil(timeoutMs / 1_000)} seconds.`);
		this.name = "GroqTimeoutError";
	}
}

function positiveInteger(value: string | undefined, fallback: number) {
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function config() {
	return {
		baseUrl: (process.env.GROQ_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
		apiKey: process.env.GROQ_API_KEY?.trim(),
		chatModel: process.env.GROQ_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL,
		visionModel: process.env.GROQ_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL,
		selectionModel: process.env.GROQ_SELECTION_MODEL?.trim() || DEFAULT_SELECTION_MODEL,
		timeoutMs: positiveInteger(process.env.GROQ_REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
		maxTokens: positiveInteger(process.env.GROQ_MAX_TOKENS, DEFAULT_MAX_TOKENS),
	};
}

function requireApiKey(apiKey: string | undefined) {
	if (!apiKey) {
		throw new Error("GROQ_API_KEY is not configured. Add it to .env.local or your deployment secrets.");
	}
	return apiKey;
}

async function groqFetch(path: string, init: RequestInit = {}, timeoutMs = config().timeoutMs) {
	const settings = config();
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(`${settings.baseUrl}${path}`, {
			...init,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${requireApiKey(settings.apiKey)}`,
				...init.headers,
			},
			signal: controller.signal,
		});
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") throw new GroqTimeoutError(timeoutMs);
		throw error;
	} finally {
		clearTimeout(timer);
	}
}

async function groqErrorMessage(response: Response) {
	const body = await response.text().catch(() => "");
	try {
		const parsed = JSON.parse(body) as { error?: { message?: unknown } | string };
		if (typeof parsed.error === "string") return `Groq HTTP ${response.status}: ${parsed.error.slice(0, 320)}`;
		if (typeof parsed.error?.message === "string") return `Groq HTTP ${response.status}: ${parsed.error.message.slice(0, 320)}`;
	} catch {
		// Groq may be fronted by a proxy that returns plain text or HTML.
	}
	const plainText = body
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	return `Groq HTTP ${response.status}: ${(plainText || response.statusText).slice(0, 240)}`;
}

function toGroqMessages(request: AiChatRequest, usesVision: boolean): GroqMessage[] {
	return [
		{ role: "system", content: MEERA_AI_SYSTEM_PROMPT },
		...messagesForProvider(request, usesVision).map((message): GroqMessage => {
			const calibration = coordinateCalibration(message.images);
			const text = calibration ? `${message.content}\n\n${calibration}` : message.content;
			if (!message.images?.length) return { role: message.role, content: text };
			return {
				role: message.role,
				content: [
					{ type: "text", text },
					...message.images.map((image): GroqContentPart => ({
						type: "image_url",
						image_url: { url: image.dataUrl },
					})),
				],
			};
		}),
	];
}

function isRetryableStatus(status: number) {
	return status === 408 || status === 409 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function isToolValidationError(error: GroqHttpError) {
	return error.status === 400 && /tool call|tool_call|failed_generation/i.test(error.message);
}

function allowNumericStrings(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(allowNumericStrings);
	if (!value || typeof value !== "object") return value;

	const schema = value as Record<string, unknown>;
	const transformed = Object.fromEntries(Object.entries(schema).map(([key, entry]) => [key, allowNumericStrings(entry)]));
	if (schema.type !== "number" && schema.type !== "integer") return transformed;

	const { type, ...rest } = transformed;
	return {
		...rest,
		anyOf: [{ type }, { type: "string" }],
	};
}

function groqOverlayTools() {
	return allowNumericStrings(AI_OVERLAY_TOOLS);
}

function attemptTimeouts(totalTimeoutMs: number) {
	const availableMs = Math.max(2, totalTimeoutMs - GROQ_RETRY_DELAY_MS);
	const firstAttemptMs = Math.max(1, Math.min(GROQ_FIRST_ATTEMPT_TIMEOUT_MS, Math.floor(availableMs / 2)));
	return [firstAttemptMs, Math.max(1, availableMs - firstAttemptMs)];
}

async function requestGroqChat(request: AiChatRequest, usesVision: boolean) {
	const settings = config();
	const model = usesVision ? settings.visionModel : settings.chatModel;
	const timeouts = attemptTimeouts(settings.timeoutMs);
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < timeouts.length; attempt += 1) {
		let response: Response;
		try {
			response = await groqFetch(
				"/chat/completions",
				{
					method: "POST",
					body: JSON.stringify({
						model,
						messages: toGroqMessages(request, usesVision),
						tools: groqOverlayTools(),
						tool_choice: "auto",
						parallel_tool_calls: true,
						// Grounding must be deterministic; only let text chat explore on the first attempt.
						temperature: usesVision ? 0 : attempt === 0 ? 0.2 : 0,
						max_completion_tokens: settings.maxTokens,
						stream: false,
					}),
				},
				timeouts[attempt],
			);
		} catch (error) {
			lastError = error instanceof Error ? error : new Error("Groq request failed.");
			const retryableNetworkError = error instanceof GroqTimeoutError || error instanceof TypeError;
			if (!retryableNetworkError || attempt === timeouts.length - 1) {
				if (error instanceof GroqTimeoutError) {
					throw new Error(
						`Groq request timed out twice within ${Math.ceil(settings.timeoutMs / 1_000)} seconds. Please try again.`,
					);
				}
				throw lastError;
			}
			await new Promise((resolve) => setTimeout(resolve, GROQ_RETRY_DELAY_MS));
			continue;
		}

		if (response.ok) return { data: (await response.json()) as GroqChatResponse, model };
		const responseError = new GroqHttpError(await groqErrorMessage(response), response.status);
		lastError = responseError;
		if ((!isRetryableStatus(response.status) && !isToolValidationError(responseError)) || attempt === timeouts.length - 1) throw responseError;
		await new Promise((resolve) => setTimeout(resolve, GROQ_RETRY_DELAY_MS));
	}

	throw lastError ?? new Error("Groq chat request failed.");
}

/**
 * Selection-based grounding: ask the strong TEXT model to pick which detected element the user means.
 * The chosen candidate's rect supplies exact coordinates, so this never regresses pixel positions.
 * Returns null (so the caller falls back to the vision path) on any failure or when the target is not
 * among the candidates — e.g. an icon with no OCR text.
 */
async function groundedSelectionResponse(request: AiChatRequest): Promise<AiChatResponse | null> {
	const candidates = request.groundingCandidates;
	if (!candidates || candidates.length === 0) return null;
	const prompt = request.messages.at(-1)?.content ?? "";
	if (!prompt.trim()) return null;

	const settings = config();
	const history = request.messages.slice(0, -1).map((message) => ({ role: message.role, content: message.content }));
	const [selectionMessage] = buildSelectionMessages(prompt, candidates, history);

	let data: GroqChatResponse;
	try {
		const response = await groqFetch(
			"/chat/completions",
			{
				method: "POST",
				body: JSON.stringify({
					model: settings.selectionModel,
					messages: [
						{ role: "system", content: SELECTION_SYSTEM_PROMPT },
						{ role: "user", content: selectionMessage.content },
					],
					tools: [SELECT_OVERLAY_TARGET_TOOL],
					tool_choice: { type: "function", function: { name: "select_overlay_target" } },
					temperature: 0,
					max_completion_tokens: SELECTION_MAX_TOKENS,
					stream: false,
				}),
			},
			Math.min(settings.timeoutMs, SELECTION_TIMEOUT_MS),
		);
		if (!response.ok) return null;
		data = (await response.json()) as GroqChatResponse;
	} catch {
		return null;
	}

	const choice = data.choices?.[0];
	const selection = parseSelection(choice?.message?.tool_calls, choice?.message?.content);
	const toolCalls = selectionToToolCalls(selection, candidates);
	console.log(
		`[Meera grounding] candidates=${candidates.length} action=${selection?.action ?? "?"} elementId=${selection?.elementId || "-"} matched=${toolCalls.length > 0}`,
	);
	if (toolCalls.length === 0) return null;

	return {
		message: selection?.message?.trim() || "I marked that on your desktop.",
		model: data.model || settings.selectionModel,
		toolCalls,
		grounding: "ocr",
		selectedElementId: selection?.elementId,
	};
}

export async function chatWithGroq(request: AiChatRequest): Promise<AiChatResponse> {
	const immediateResponse = immediateOverlayResponse(request);
	if (immediateResponse) return immediateResponse;

	const grounded = await groundedSelectionResponse(request);
	if (grounded) return grounded;

	const { data, model } = await requestGroqChat(request, isVisionRequest(request));
	const choice = data.choices?.[0];
	return resolveProviderResponse({
		content: choice?.message?.content,
		finishReason: choice?.finish_reason,
		model: data.model || model,
		request,
		toolCalls: choice?.message?.tool_calls,
	});
}

export async function getGroqStatus(): Promise<AiProviderStatus> {
	const settings = config();
	try {
		const response = await groqFetch("/models");
		if (!response.ok) throw new GroqHttpError(await groqErrorMessage(response), response.status);
		const data = (await response.json()) as { data?: Array<{ id?: string; active?: boolean }> };
		const models =
			data.data
				?.filter((model) => model.active !== false)
				.map((model) => model.id)
				.filter((name): name is string => Boolean(name)) ?? [];
		return {
			available: models.includes(settings.chatModel) && models.includes(settings.visionModel),
			provider: "groq",
			providerLabel: "Groq",
			chatModel: settings.chatModel,
			visionModel: settings.visionModel,
			models,
		};
	} catch (error) {
		return {
			available: false,
			provider: "groq",
			providerLabel: "Groq",
			chatModel: settings.chatModel,
			visionModel: settings.visionModel,
			models: [],
			error: error instanceof Error ? error.message : "Could not reach Groq.",
		};
	}
}
