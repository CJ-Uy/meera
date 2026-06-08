import { isOverlayCommand, type OverlayCommand, type OverlayDisplayTarget, type OverlayPlacement } from "@/features/overlay/overlay-protocol";
import type { AiToolCall } from "@/features/ai/ai-types";

type OllamaTool = {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: Record<string, unknown>;
	};
};

const displayProperty = {
	type: "string",
	enum: ["primary", "all"],
	description: "Target the primary display unless the user explicitly requests every display.",
};
const pointProperties = {
	x: { type: "number", description: "Normalized horizontal position from 0 to 1." },
	y: { type: "number", description: "Normalized vertical position from 0 to 1." },
};
const placementProperty = { type: "string", enum: ["top", "right", "bottom", "left"] };

export const OLLAMA_OVERLAY_TOOLS: OllamaTool[] = [
	{
		type: "function",
		function: {
			name: "overlay_move_cursor",
			description: "Move Meera's visible AI cursor to a location on the desktop.",
			parameters: {
				type: "object",
				required: ["x", "y"],
				properties: {
					...pointProperties,
					label: { type: "string", description: "Short cursor label. Defaults to Meera." },
					animationMs: { type: "number", description: "Movement duration in milliseconds." },
					display: displayProperty,
				},
			},
		},
	},
	{
		type: "function",
		function: {
			name: "overlay_hide_cursor",
			description: "Hide Meera's AI cursor.",
			parameters: { type: "object", properties: { display: displayProperty } },
		},
	},
	{
		type: "function",
		function: {
			name: "overlay_show_arrow",
			description: "Show an arrow pointing at a desktop location.",
			parameters: {
				type: "object",
				required: ["x", "y"],
				properties: {
					...pointProperties,
					id: { type: "string" },
					direction: placementProperty,
					message: { type: "string" },
					ttlMs: { type: "number" },
					display: displayProperty,
				},
			},
		},
	},
	{
		type: "function",
		function: {
			name: "overlay_show_highlight",
			description: "Highlight a rectangular area of the desktop.",
			parameters: {
				type: "object",
				required: ["x", "y", "width", "height"],
				properties: {
					...pointProperties,
					width: { type: "number", description: "Normalized width from 0 to 1." },
					height: { type: "number", description: "Normalized height from 0 to 1." },
					id: { type: "string" },
					message: { type: "string" },
					ttlMs: { type: "number" },
					display: displayProperty,
				},
			},
		},
	},
	{
		type: "function",
		function: {
			name: "overlay_show_bubble",
			description: "Show a desktop chat bubble with a short guidance message.",
			parameters: {
				type: "object",
				required: ["x", "y", "message"],
				properties: {
					...pointProperties,
					id: { type: "string" },
					message: { type: "string" },
					placement: placementProperty,
					ttlMs: { type: "number" },
					display: displayProperty,
				},
			},
		},
	},
	{
		type: "function",
		function: {
			name: "overlay_remove",
			description: "Remove one overlay annotation by its id.",
			parameters: {
				type: "object",
				required: ["id"],
				properties: { id: { type: "string" }, display: displayProperty },
			},
		},
	},
	{
		type: "function",
		function: {
			name: "overlay_clear",
			description: "Clear the cursor and every annotation from the desktop overlay.",
			parameters: { type: "object", properties: { display: displayProperty } },
		},
	},
];

function parseArguments(value: string | Record<string, unknown> | undefined): Record<string, unknown> {
	if (typeof value !== "string") return value ?? {};
	try {
		const parsed = JSON.parse(value) as unknown;
		return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
	} catch {
		return {};
	}
}

function clamp(value: unknown, fallback: number, minimum = 0, maximum = 1) {
	return typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
}

function optionalString(value: unknown, maximumLength: number) {
	return typeof value === "string" && value.trim() ? value.trim().slice(0, maximumLength) : undefined;
}

function displayTarget(value: unknown): OverlayDisplayTarget | undefined {
	return value === "all" || value === "primary" ? value : undefined;
}

function placement(value: unknown): OverlayPlacement | undefined {
	return value === "top" || value === "right" || value === "bottom" || value === "left" ? value : undefined;
}

function annotationId(value: unknown, toolName: string) {
	return optionalString(value, 100) ?? `ai-${toolName}-${Date.now()}`;
}

function ttl(value: unknown, fallback = 6_000) {
	return Math.round(clamp(value, fallback, 0, 60_000));
}

function withDisplay<T extends OverlayCommand>(command: T, value: unknown): T {
	const displayId = displayTarget(value);
	return displayId ? { ...command, displayId } : command;
}

function overlayToolCall(name: string, args: Record<string, unknown>): AiToolCall {
	return { function: { name, arguments: args } };
}

const normalizedNumberPattern = "(\\d+(?:\\.\\d+)?%?)";
const coordinatePairPatterns = [
	new RegExp(`\\bx\\s*[:=]\\s*${normalizedNumberPattern}\\s*(?:,|;|\\s+)\\s*y\\s*[:=]\\s*${normalizedNumberPattern}`, "i"),
	new RegExp(`\\bcoordinates?\\b[^\\n\\d]*${normalizedNumberPattern}\\s*(?:,|;|/)\\s*${normalizedNumberPattern}`, "i"),
	new RegExp(`\\(\\s*${normalizedNumberPattern}\\s*,\\s*${normalizedNumberPattern}\\s*\\)`, "i"),
] as const;

function parseNormalizedNumber(value: string) {
	const parsed = Number(value.replace("%", ""));
	if (!Number.isFinite(parsed)) return null;
	const normalized = value.includes("%") || parsed > 1 ? parsed / 100 : parsed;
	return Math.min(1, Math.max(0, normalized));
}

function extractPoint(text: string) {
	for (const pattern of coordinatePairPatterns) {
		const match = pattern.exec(text);
		const x = match?.[1] ? parseNormalizedNumber(match[1]) : null;
		const y = match?.[2] ? parseNormalizedNumber(match[2]) : null;
		if (x !== null && y !== null) return { x, y };
	}
	return null;
}

function extractSize(text: string) {
	const pattern = new RegExp(`\\bwidth\\s*[:=]\\s*${normalizedNumberPattern}[^\\n\\d]+height\\s*[:=]\\s*${normalizedNumberPattern}`, "i");
	const match = pattern.exec(text);
	const width = match?.[1] ? parseNormalizedNumber(match[1]) : null;
	const height = match?.[2] ? parseNormalizedNumber(match[2]) : null;
	if (width === null || height === null) return null;
	return { width: Math.max(0.04, width), height: Math.max(0.04, height) };
}

function compactOverlayMessage(content: string) {
	const candidates = content
		.split(/\r?\n/)
		.map((line) => line.replace(/[`*_>#\[\]]/g, "").replace(/\s+/g, " ").trim())
		.filter((line) => line && !/^coordinates?\b/i.test(line) && !/^x\s*[:=]/i.test(line) && !/^let me know\b/i.test(line));
	const selected = candidates.find((line) => /\b(pick|selected|click|target|look|random|highlight|arrow)\b/i.test(line)) ?? candidates[0];
	if (!selected) return "Look here.";
	return selected.slice(0, 90);
}

function hasOverlayActionIntent(prompt: string, content: string) {
	const promptHasAction = /\b(show|put|place|add|draw|display|move|point|highlight|mark|circle|pick|choose|guide|overlay|clear|remove|hide|click)\b/i.test(
		prompt,
	);
	const promptHasOverlayTarget = /\b(overlay|arrow|highlight|cursor|bubble|point|mark|circle|annotation|screen|desktop|youtube|button|click)\b/i.test(
		prompt,
	);
	const contentLooksLikeOverlayPlan =
		Boolean(extractPoint(content)) && /\b(coordinates?|arrow|highlight|overlay|points?|target|thumbnail|button|video)\b/i.test(content);
	return promptHasAction && (promptHasOverlayTarget || contentLooksLikeOverlayPlan);
}

function highlightArgsFromPoint(point: { x: number; y: number }, content: string) {
	const size = extractSize(content) ?? { width: 0.22, height: 0.16 };
	return {
		x: Math.max(0, point.x - size.width / 2),
		y: Math.max(0, point.y - size.height / 2),
		width: size.width,
		height: size.height,
		message: compactOverlayMessage(content),
	};
}

export function recoverOverlayToolCallsFromText({
	content,
	prompt,
}: {
	content: string;
	prompt: string;
}): AiToolCall[] {
	const text = `${prompt}\n${content}`;
	if (!hasOverlayActionIntent(prompt, content)) return [];

	if (/\b(show|test|display)\b/i.test(prompt) && /\b(every|all)\b/i.test(prompt) && /\boverlay\b/i.test(prompt)) {
		return [
			overlayToolCall("overlay_move_cursor", { x: 0.24, y: 0.28, label: "Meera" }),
			overlayToolCall("overlay_show_arrow", { x: 0.72, y: 0.28, message: "Arrow" }),
			overlayToolCall("overlay_show_highlight", { x: 0.54, y: 0.56, width: 0.28, height: 0.18, message: "Highlight" }),
			overlayToolCall("overlay_show_bubble", { x: 0.35, y: 0.74, message: "Chat bubble" }),
		];
	}

	if (/\b(clear|erase|remove)\b/i.test(prompt) && /\b(overlay|guidance|annotation|all)\b/i.test(prompt)) {
		return [overlayToolCall("overlay_clear", {})];
	}

	if (/\bhide\b/i.test(prompt) && /\bcursor\b/i.test(prompt)) {
		return [overlayToolCall("overlay_hide_cursor", {})];
	}

	const point = extractPoint(content) ?? extractPoint(prompt) ?? { x: 0.5, y: 0.5 };
	const message = compactOverlayMessage(content);
	const calls: AiToolCall[] = [];

	if (/\bcursor\b/i.test(text)) calls.push(overlayToolCall("overlay_move_cursor", { x: point.x, y: point.y, label: "Meera" }));
	if (/\b(highlight|circle|box)\b/i.test(text)) calls.push(overlayToolCall("overlay_show_highlight", highlightArgsFromPoint(point, content)));
	if (/\b(bubble|message|label|note)\b/i.test(text)) calls.push(overlayToolCall("overlay_show_bubble", { x: point.x, y: point.y, message }));
	if (calls.length === 0 || /\b(arrow|point|mark|pick|choose|overlay)\b/i.test(text)) {
		calls.unshift(overlayToolCall("overlay_show_arrow", { x: point.x, y: point.y, message }));
	}

	return calls;
}

export function toolCallToOverlayCommand(toolCall: AiToolCall): OverlayCommand | null {
	const name = toolCall.function?.name;
	if (!name) return null;
	const args = parseArguments(toolCall.function?.arguments);
	let command: OverlayCommand | null = null;

	switch (name) {
		case "overlay_move_cursor":
			command = withDisplay(
				{
					type: "cursor.move",
					target: { x: clamp(args.x, 0.5), y: clamp(args.y, 0.5) },
					animationMs: Math.round(clamp(args.animationMs, 700, 0, 60_000)),
					label: optionalString(args.label, 100) ?? "Meera",
				},
				args.display,
			);
			break;
		case "overlay_hide_cursor":
			command = withDisplay({ type: "cursor.hide" }, args.display);
			break;
		case "overlay_show_arrow":
			command = withDisplay(
				{
					type: "arrow.show",
					id: annotationId(args.id, "arrow"),
					target: { x: clamp(args.x, 0.5), y: clamp(args.y, 0.5) },
					direction: placement(args.direction),
					message: optionalString(args.message, 500),
					ttlMs: ttl(args.ttlMs),
				},
				args.display,
			);
			break;
		case "overlay_show_highlight": {
			const x = clamp(args.x, 0.25);
			const y = clamp(args.y, 0.25);
			command = withDisplay(
				{
					type: "highlight.show",
					id: annotationId(args.id, "highlight"),
					rect: {
						x,
						y,
						width: clamp(args.width, 0.3, 0, 1 - x),
						height: clamp(args.height, 0.2, 0, 1 - y),
					},
					message: optionalString(args.message, 500),
					ttlMs: ttl(args.ttlMs),
				},
				args.display,
			);
			break;
		}
		case "overlay_show_bubble":
			command = withDisplay(
				{
					type: "bubble.show",
					id: annotationId(args.id, "bubble"),
					target: { x: clamp(args.x, 0.5), y: clamp(args.y, 0.5) },
					message: optionalString(args.message, 500) ?? "Look here.",
					placement: placement(args.placement),
					ttlMs: ttl(args.ttlMs),
				},
				args.display,
			);
			break;
		case "overlay_remove": {
			const id = optionalString(args.id, 100);
			if (id) command = withDisplay({ type: "overlay.remove", id }, args.display);
			break;
		}
		case "overlay_clear":
			command = withDisplay({ type: "overlay.clear" }, args.display);
			break;
		default:
			return null;
	}

	return command && isOverlayCommand(command) ? command : null;
}
