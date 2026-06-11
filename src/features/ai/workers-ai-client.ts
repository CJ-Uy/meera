import { MEERA_AI_SYSTEM_PROMPT, MEERA_SUPPORT_SYSTEM_PROMPT } from "@/features/ai/ai-prompt";
import {
	coordinateCalibration,
	immediateOverlayResponse,
	isVisionRequest,
	messagesForProvider,
	resolveProviderResponse,
	resolveSupportResponse,
} from "@/features/ai/ai-provider-utils";
import { AI_SUPPORT_TOOLS } from "@/features/ai/ai-tools";
import { buildSelectionMessages, parseSelection, SELECTION_JSON_SYSTEM_PROMPT, selectionToToolCalls } from "@/features/ai/grounding/select";
import type { AiChatRequest, AiChatResponse, AiProviderStatus, AiToolCall } from "@/features/ai/ai-types";

/**
 * Cloudflare Workers AI provider (via the `meera` AI Gateway).
 *
 * Two transport shapes, both validated against the live account:
 * - Chat + selection use the OpenAI-compatible gateway endpoint ({BASE_URL}/chat/completions). Selection
 *   uses JSON mode (response_format), NOT forced tool calls — Workers AI compat lacks reliable forced
 *   tool_choice / parallel_tool_calls.
 * - Vision uses the DIRECT Workers AI run endpoint; the gateway compat path cannot attach images. The run
 *   endpoint returns `result.response` rather than OpenAI `choices`.
 *
 * Grounding accuracy comes from OCR + region selection upstream, so the weak vision model is only used for
 * screen description and the non-text prose-recovery fallback. See docs/CF_MIGRATION_PLAN.md.
 */

type CompatContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
type CompatMessage = { role: "system" | "user" | "assistant"; content: string | CompatContentPart[] };

type CompatChatResponse = {
	model?: string;
	choices?: Array<{ finish_reason?: string | null; message?: { content?: string | null; tool_calls?: AiToolCall[] } }>;
};

type RunVisionResponse = { result?: { response?: string | null }; success?: boolean };

const DEFAULT_BASE_URL = "https://gateway.ai.cloudflare.com/v1/compat";
const DEFAULT_SUPPORT_MODEL = "workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct";
const DEFAULT_CHAT_MODEL = "workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct";
const DEFAULT_SELECTION_MODEL = "workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct";
const DEFAULT_VISION_MODEL = "workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct";
const DEFAULT_TIMEOUT_MS = 45_000;
const SELECTION_TIMEOUT_MS = 15_000;
const SELECTION_MAX_TOKENS = 256;
const DEFAULT_MAX_TOKENS = 512;

class WorkersAiHttpError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = "WorkersAiHttpError";
	}
}

class WorkersAiTimeoutError extends Error {
	constructor(readonly timeoutMs: number) {
		super(`Workers AI request timed out after ${Math.ceil(timeoutMs / 1_000)} seconds.`);
		this.name = "WorkersAiTimeoutError";
	}
}

function positiveInteger(value: string | undefined, fallback: number) {
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function config() {
	return {
		baseUrl: (process.env.WORKERS_AI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
		apiKey: process.env.WORKERS_AI_API_KEY?.trim(),
		gatewayAuthToken: process.env.WORKERS_AI_GATEWAY_AUTH_TOKEN?.trim(),
		accountId: process.env.WORKERS_AI_ACCOUNT_ID?.trim(),
		supportModel: process.env.WORKERS_AI_SUPPORT_MODEL?.trim() || DEFAULT_SUPPORT_MODEL,
		chatModel: process.env.WORKERS_AI_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL,
		selectionModel: process.env.WORKERS_AI_SELECTION_MODEL?.trim() || DEFAULT_SELECTION_MODEL,
		visionModel: process.env.WORKERS_AI_VISION_MODEL?.trim() || DEFAULT_VISION_MODEL,
		timeoutMs: positiveInteger(process.env.WORKERS_AI_REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
		maxTokens: positiveInteger(process.env.WORKERS_AI_MAX_TOKENS, DEFAULT_MAX_TOKENS),
	};
}

function requireApiKey(apiKey: string | undefined) {
	if (!apiKey) throw new Error("WORKERS_AI_API_KEY is not configured. Add it to .env.local or your deployment secrets.");
	return apiKey;
}

/** The gateway compat endpoint uses `workers-ai/@cf/...`; the direct run endpoint uses bare `@cf/...`. */
function bareModelId(model: string) {
	return model.replace(/^workers-ai\//, "");
}

function authHeaders(settings: ReturnType<typeof config>): Record<string, string> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${requireApiKey(settings.apiKey)}`,
	};
	if (settings.gatewayAuthToken) headers["cf-aig-authorization"] = `Bearer ${settings.gatewayAuthToken}`;
	return headers;
}

async function workersAiFetch(url: string, init: RequestInit, timeoutMs: number) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") throw new WorkersAiTimeoutError(timeoutMs);
		throw error;
	} finally {
		clearTimeout(timer);
	}
}

async function errorMessage(response: Response) {
	const body = await response.text().catch(() => "");
	try {
		const parsed = JSON.parse(body) as { error?: { message?: unknown } | string; errors?: Array<{ message?: unknown }> };
		if (typeof parsed.error === "string") return `Workers AI HTTP ${response.status}: ${parsed.error.slice(0, 320)}`;
		if (typeof parsed.error?.message === "string") return `Workers AI HTTP ${response.status}: ${parsed.error.message.slice(0, 320)}`;
		if (typeof parsed.errors?.[0]?.message === "string") return `Workers AI HTTP ${response.status}: ${String(parsed.errors[0].message).slice(0, 320)}`;
	} catch {
		// fall through to plain text
	}
	return `Workers AI HTTP ${response.status}: ${(body || response.statusText).slice(0, 240)}`;
}

function toCompatMessages(request: AiChatRequest, usesVision: boolean): CompatMessage[] {
	return [
		{ role: "system", content: request.mode === "support" ? MEERA_SUPPORT_SYSTEM_PROMPT : MEERA_AI_SYSTEM_PROMPT },
		...messagesForProvider(request, usesVision).map((message): CompatMessage => {
			const calibration = coordinateCalibration(message.images);
			const text = calibration ? `${message.content}\n\n${calibration}` : message.content;
			if (!message.images?.length) return { role: message.role, content: text };
			return {
				role: message.role,
				content: [
					{ type: "text", text },
					...message.images.map((image): CompatContentPart => ({ type: "image_url", image_url: { url: image.dataUrl } })),
				],
			};
		}),
	];
}

/** Chat / selection through the OpenAI-compatible gateway endpoint. */
async function compatChat(body: Record<string, unknown>, timeoutMs: number): Promise<CompatChatResponse> {
	const settings = config();
	const response = await workersAiFetch(
		`${settings.baseUrl}/chat/completions`,
		{ method: "POST", headers: authHeaders(settings), body: JSON.stringify(body) },
		timeoutMs,
	);
	if (!response.ok) throw new WorkersAiHttpError(await errorMessage(response), response.status);
	return (await response.json()) as CompatChatResponse;
}

/** Vision through the direct Workers AI run endpoint (the gateway compat path cannot attach images). */
async function runVision(request: AiChatRequest): Promise<string> {
	const settings = config();
	if (!settings.accountId) {
		throw new Error("WORKERS_AI_ACCOUNT_ID is required for vision (the direct run endpoint).");
	}
	const url = `https://api.cloudflare.com/client/v4/accounts/${settings.accountId}/ai/run/${bareModelId(settings.visionModel)}`;
	const response = await workersAiFetch(
		url,
		{
			method: "POST",
			headers: authHeaders(settings),
			body: JSON.stringify({ messages: toCompatMessages(request, true), max_tokens: settings.maxTokens }),
		},
		settings.timeoutMs,
	);
	if (!response.ok) throw new WorkersAiHttpError(await errorMessage(response), response.status);
	const data = (await response.json()) as RunVisionResponse;
	return data.result?.response?.trim() ?? "";
}

/**
 * Selection-based grounding via JSON mode (no coordinate regression). Returns null so the caller falls
 * back to the vision path when there are no candidates or the target is not among them (e.g. an icon).
 */
async function groundedSelectionResponse(request: AiChatRequest): Promise<AiChatResponse | null> {
	const candidates = request.groundingCandidates;
	if (!candidates || candidates.length === 0) return null;
	const prompt = request.messages.at(-1)?.content ?? "";
	if (!prompt.trim()) return null;

	const settings = config();
	const history = request.messages.slice(0, -1).map((message) => ({ role: message.role, content: message.content }));
	const [selectionMessage] = buildSelectionMessages(prompt, candidates, history);

	let data: CompatChatResponse;
	try {
		data = await compatChat(
			{
				model: settings.selectionModel,
				messages: [
					{ role: "system", content: SELECTION_JSON_SYSTEM_PROMPT },
					{ role: "user", content: selectionMessage.content },
				],
				response_format: { type: "json_object" },
				temperature: 0,
				max_tokens: SELECTION_MAX_TOKENS,
				stream: false,
			},
			Math.min(settings.timeoutMs, SELECTION_TIMEOUT_MS),
		);
	} catch {
		return null;
	}

	const selection = parseSelection(undefined, data.choices?.[0]?.message?.content);
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

export async function chatWithWorkersAi(request: AiChatRequest): Promise<AiChatResponse> {
	const settings = config();

	// Support mode: the orchestrator runs through the gateway compat chat with the create_support_ticket
	// tool exposed, so the model packages escalations as a native tool call (resolveSupportResponse reads
	// it; the fenced-block fallback in the system prompt covers models that decline to tool-call). Skip
	// the overlay grounding paths — support replies are conversational, not visual.
	if (request.mode === "support") {
		const data = await compatChat(
			{
				model: settings.supportModel,
				messages: toCompatMessages(request, false),
				tools: AI_SUPPORT_TOOLS,
				tool_choice: "auto",
				temperature: 0.2,
				max_tokens: settings.maxTokens,
				stream: false,
			},
			settings.timeoutMs,
		);
		const choice = data.choices?.[0];
		return resolveSupportResponse({
			content: choice?.message?.content,
			finishReason: choice?.finish_reason,
			model: data.model || settings.supportModel,
			request,
			toolCalls: choice?.message?.tool_calls,
		});
	}

	const immediateResponse = immediateOverlayResponse(request);
	if (immediateResponse) return immediateResponse;

	const grounded = await groundedSelectionResponse(request);
	if (grounded) return grounded;

	if (isVisionRequest(request)) {
		const content = await runVision(request);
		return resolveProviderResponse({ content, model: settings.visionModel, request, toolCalls: [] });
	}

	const data = await compatChat(
		{
			model: settings.chatModel,
			messages: toCompatMessages(request, false),
			temperature: 0.2,
			max_tokens: settings.maxTokens,
			stream: false,
		},
		settings.timeoutMs,
	);
	const choice = data.choices?.[0];
	return resolveProviderResponse({
		content: choice?.message?.content,
		finishReason: choice?.finish_reason,
		model: data.model || settings.chatModel,
		request,
		toolCalls: [],
	});
}

export async function getWorkersAiStatus(): Promise<AiProviderStatus> {
	const settings = config();
	const base = {
		provider: "workers-ai" as const,
		providerLabel: "Cloudflare Workers AI",
		chatModel: settings.chatModel,
		visionModel: settings.visionModel,
	};
	try {
		const response = await workersAiFetch(`${settings.baseUrl}/models`, { method: "GET", headers: authHeaders(settings) }, settings.timeoutMs);
		if (!response.ok) throw new WorkersAiHttpError(await errorMessage(response), response.status);
		const data = (await response.json()) as { data?: Array<{ id?: string }> };
		const models = data.data?.map((model) => model.id).filter((id): id is string => Boolean(id)) ?? [];
		// The gateway compat /models list is large and provider-prefixed; treat a successful listing as available.
		return { ...base, available: models.length > 0, models };
	} catch (error) {
		return { ...base, available: false, models: [], error: error instanceof Error ? error.message : "Could not reach Workers AI." };
	}
}
