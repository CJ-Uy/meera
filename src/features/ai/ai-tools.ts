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
