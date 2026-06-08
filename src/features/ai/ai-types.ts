export type AiChatRole = "user" | "assistant";
export type AiImageSource = "upload" | "screen";

export type AiScreenFrameMetadata = {
	displayId?: number;
	displayLabel?: string;
	bounds?: { x: number; y: number; width: number; height: number };
	workArea?: { x: number; y: number; width: number; height: number };
	scaleFactor?: number;
	capturedAt?: string;
	calibrationGrid?: { columns: number; rows: number };
};

export type AiImageAttachment = {
	id: string;
	name: string;
	mimeType: "image/jpeg" | "image/png" | "image/webp";
	dataUrl: string;
	source: AiImageSource;
	width?: number;
	height?: number;
	screen?: AiScreenFrameMetadata;
};

export type AiChatInputMessage = {
	role: AiChatRole;
	content: string;
	images?: AiImageAttachment[];
};

export type AiToolCall = {
	id?: string;
	function?: {
		name?: string;
		arguments?: string | Record<string, unknown>;
	};
};

export type AiActionResult = {
	tool: string;
	ok: boolean;
	message: string;
};

export type AiChatMessage = AiChatInputMessage & {
	id: string;
	actionResults?: AiActionResult[];
	model?: string;
};

export type AiChatRequest = {
	messages: AiChatInputMessage[];
};

export type AiChatResponse = {
	message: string;
	model: string;
	toolCalls: AiToolCall[];
};

export type OllamaStatus = {
	available: boolean;
	chatModel: string;
	visionModel: string;
	models: string[];
	error?: string;
};

const ALLOWED_IMAGE_TYPES = new Set<AiImageAttachment["mimeType"]>(["image/jpeg", "image/png", "image/webp"]);
const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export const AI_LIMITS = {
	maxMessages: 16,
	maxMessageLength: 8_000,
	maxImagesPerMessage: 4,
	maxImageDataUrlLength: 8_000_000,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isPositiveInteger(value: unknown, maximum = 16_384): value is number {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= maximum;
}

function isFiniteNumber(value: unknown) {
	return typeof value === "number" && Number.isFinite(value);
}

function isRect(value: unknown): value is NonNullable<AiScreenFrameMetadata["bounds"]> {
	return (
		isRecord(value) &&
		isFiniteNumber(value.x) &&
		isFiniteNumber(value.y) &&
		isPositiveInteger(value.width, 100_000) &&
		isPositiveInteger(value.height, 100_000)
	);
}

function isScreenFrameMetadata(value: unknown): value is AiScreenFrameMetadata {
	if (value === undefined) return true;
	if (!isRecord(value)) return false;
	if (value.displayId !== undefined && !(typeof value.displayId === "number" && Number.isSafeInteger(value.displayId))) return false;
	if (value.displayLabel !== undefined && !(typeof value.displayLabel === "string" && value.displayLabel.length <= 200)) return false;
	if (value.bounds !== undefined && !isRect(value.bounds)) return false;
	if (value.workArea !== undefined && !isRect(value.workArea)) return false;
	if (value.scaleFactor !== undefined && !(typeof value.scaleFactor === "number" && Number.isFinite(value.scaleFactor) && value.scaleFactor > 0)) {
		return false;
	}
	if (value.capturedAt !== undefined && !(typeof value.capturedAt === "string" && value.capturedAt.length <= 80)) return false;
	if (
		value.calibrationGrid !== undefined &&
		!(
			isRecord(value.calibrationGrid) &&
			isPositiveInteger(value.calibrationGrid.columns, 32) &&
			isPositiveInteger(value.calibrationGrid.rows, 32)
		)
	) {
		return false;
	}
	return true;
}

function isImageAttachment(value: unknown): value is AiImageAttachment {
	if (!isRecord(value)) return false;
	if (
		typeof value.id !== "string" ||
		typeof value.name !== "string" ||
		typeof value.mimeType !== "string" ||
		typeof value.dataUrl !== "string" ||
		(value.source !== "upload" && value.source !== "screen")
	) {
		return false;
	}
	if (!ALLOWED_IMAGE_TYPES.has(value.mimeType as AiImageAttachment["mimeType"])) return false;
	if (value.name.length === 0 || value.name.length > 200 || value.dataUrl.length > AI_LIMITS.maxImageDataUrlLength) return false;
	if (value.width !== undefined && !isPositiveInteger(value.width)) return false;
	if (value.height !== undefined && !isPositiveInteger(value.height)) return false;
	if (!isScreenFrameMetadata(value.screen)) return false;
	const match = DATA_URL_PATTERN.exec(value.dataUrl);
	return Boolean(match && match[1] === value.mimeType);
}

function isInputMessage(value: unknown): value is AiChatInputMessage {
	if (!isRecord(value) || (value.role !== "user" && value.role !== "assistant") || typeof value.content !== "string") {
		return false;
	}
	if (value.content.length > AI_LIMITS.maxMessageLength) return false;
	if (value.images === undefined) return value.content.trim().length > 0;
	if (!Array.isArray(value.images) || value.images.length === 0 || value.images.length > AI_LIMITS.maxImagesPerMessage) return false;
	return value.images.every(isImageAttachment) && (value.role === "user" || value.images.length === 0);
}

export function isAiChatRequest(value: unknown): value is AiChatRequest {
	if (!isRecord(value) || !Array.isArray(value.messages)) return false;
	if (value.messages.length === 0 || value.messages.length > AI_LIMITS.maxMessages) return false;
	if (!value.messages.every(isInputMessage)) return false;
	return value.messages.at(-1)?.role === "user";
}

export function imageDataUrlToBase64(dataUrl: string) {
	const match = DATA_URL_PATTERN.exec(dataUrl);
	return match?.[2] ?? null;
}
