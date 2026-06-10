import { isOverlayCommand, type OverlayCommand, type OverlayDisplayTarget, type OverlayPlacement } from "@/features/overlay/overlay-protocol";
import type { AiToolCall } from "@/features/ai/ai-types";

export type AiToolDefinition = {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: Record<string, unknown>;
	};
};

export type OverlayCoordinateContext = {
	imageWidth: number;
	imageHeight: number;
	displayId?: OverlayDisplayTarget;
	gridColumns?: number;
	gridRows?: number;
};

type OverlayCoordinateSpace = "normalized" | "percent" | "image_pixels" | "relative_1000";
type VisualOverlayToolName = "overlay_move_cursor" | "overlay_show_arrow" | "overlay_show_highlight" | "overlay_show_bubble";

const displayProperty = {
	type: "string",
	enum: ["primary", "all"],
	description: "Target the primary display unless the user explicitly requests every display.",
};
const coordinateSpaceProperty = {
	type: "string",
	enum: ["normalized", "percent", "image_pixels", "relative_1000"],
	description:
		"Use normalized for 0-1 coordinates, percent for 0-100, image_pixels for pixels in the attached screen image, or relative_1000 only when instructed.",
};
const imageSizeProperties = {
	imageWidth: { type: "number", description: "Width in pixels of the attached screen image when using image_pixels." },
	imageHeight: { type: "number", description: "Height in pixels of the attached screen image when using image_pixels." },
};
const pointProperties = {
	x: { type: "number", description: "Target horizontal coordinate using coordinateSpace." },
	y: { type: "number", description: "Target vertical coordinate using coordinateSpace." },
	coordinateSpace: coordinateSpaceProperty,
	gridCell: { type: "string", description: "Optional visible calibration grid cell label, such as A1 or J3." },
	gridColumn: { type: "string", description: "Optional visible calibration grid column label, such as A or J." },
	gridRow: { type: "number", description: "Optional visible calibration grid row number." },
	gridColumns: { type: "number", description: "Number of visible calibration grid columns." },
	gridRows: { type: "number", description: "Number of visible calibration grid rows." },
	...imageSizeProperties,
};
const placementProperty = { type: "string", enum: ["top", "right", "bottom", "left"] };

export const AI_OVERLAY_TOOLS: AiToolDefinition[] = [
	{
		type: "function",
		function: {
			name: "overlay_move_cursor",
			description: "Move Meera's visible AI cursor to a location on the desktop.",
			parameters: {
				type: "object",
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
			description: "Show an arrow pointing at a desktop location. Use this only for arrow, pointer, pointing, picking, or click-target guidance.",
			parameters: {
				type: "object",
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
			description: "Highlight a rectangular area of the desktop. Use this for highlight, box, rectangle, outline, circle, or focus-area requests.",
			parameters: {
				type: "object",
				properties: {
					...pointProperties,
					width: { type: "number", description: "Target width using coordinateSpace. Normalized 0-1 values are also accepted." },
					height: { type: "number", description: "Target height using coordinateSpace. Normalized 0-1 values are also accepted." },
					centerX: { type: "number", description: "Optional horizontal center coordinate when x/y are not top-left." },
					centerY: { type: "number", description: "Optional vertical center coordinate when x/y are not top-left." },
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
			description: "Show a desktop chat bubble with a short guidance message. Use this for text, message, label, caption, note, or chat-bubble overlays.",
			parameters: {
				type: "object",
				required: ["message"],
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

function numeric(value: unknown) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value !== "string") return null;
	const parsed = Number(value.trim().replace(/%$/, ""));
	return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: unknown, fallback: number, minimum = 0, maximum = 1) {
	const parsed = numeric(value);
	return parsed !== null ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

function optionalString(value: unknown, maximumLength: number) {
	return typeof value === "string" && value.trim() ? value.trim().slice(0, maximumLength) : undefined;
}

function displayTarget(value: unknown): OverlayDisplayTarget | undefined {
	if (typeof value === "number" && Number.isSafeInteger(value)) return value;
	return value === "all" || value === "primary" ? value : undefined;
}

function placement(value: unknown): OverlayPlacement | undefined {
	return value === "top" || value === "right" || value === "bottom" || value === "left" ? value : undefined;
}

function annotationId(value: unknown, toolName: string) {
	return optionalString(value, 100) ?? `ai-${toolName}-${Date.now()}`;
}

// Default 0 = persist until the next request clears it. A guide overlay that vanishes after a few
// seconds is worse than one that stays put while the user reads and acts. Explicit ttlMs is still honored.
function ttl(value: unknown, fallback = 0) {
	return Math.round(clamp(value, fallback, 0, 60_000));
}

function pointFromArgs(args: Record<string, unknown>) {
	const x = numeric(args.x);
	const y = numeric(args.y);
	if (x === null || y === null) return null;
	return { x: clamp(x, 0.5), y: clamp(y, 0.5) };
}

function withDisplay<T extends OverlayCommand>(command: T, value: unknown): T {
	const displayId = displayTarget(value);
	return displayId ? { ...command, displayId } : command;
}

function overlayToolCall(name: string, args: Record<string, unknown>): AiToolCall {
	return { function: { name, arguments: args } };
}

function firstDefined(args: Record<string, unknown>, names: string[]) {
	for (const name of names) {
		if (args[name] !== undefined) return args[name];
	}
	return undefined;
}

function axisSize(axis: "x" | "y", args: Record<string, unknown>, context?: OverlayCoordinateContext) {
	const fromArgs = numeric(axis === "x" ? args.imageWidth : args.imageHeight);
	const fromContext = axis === "x" ? context?.imageWidth : context?.imageHeight;
	return fromArgs && fromArgs > 0 ? fromArgs : fromContext;
}

function gridSize(axis: "x" | "y", args: Record<string, unknown>, context?: OverlayCoordinateContext) {
	const fromArgs = numeric(axis === "x" ? args.gridColumns : args.gridRows);
	const fromContext = axis === "x" ? context?.gridColumns : context?.gridRows;
	const fallback = axis === "x" ? 12 : 8;
	const size = fromArgs && fromArgs > 0 ? fromArgs : fromContext;
	return size && size > 0 ? size : fallback;
}

function parseGridColumn(value: unknown) {
	if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
	if (typeof value !== "string") return null;
	const trimmed = value.trim().toUpperCase();
	const numericValue = Number(trimmed);
	if (Number.isSafeInteger(numericValue) && numericValue > 0) return numericValue;
	if (!/^[A-Z]+$/.test(trimmed)) return null;
	let result = 0;
	for (const character of trimmed) {
		result = result * 26 + (character.charCodeAt(0) - 64);
	}
	return result;
}

function parseGridCell(value: unknown) {
	if (typeof value !== "string") return null;
	const match = /^([A-Z]+)\s*[-:]?\s*(\d+)$/i.exec(value.trim());
	if (!match) return null;
	const column = parseGridColumn(match[1]);
	const row = Number(match[2]);
	if (!column || !Number.isSafeInteger(row) || row <= 0) return null;
	return { column, row };
}

function normalizeGridPoint(args: Record<string, unknown>, context?: OverlayCoordinateContext) {
	const cell = parseGridCell(args.gridCell ?? args.cell);
	const column = cell?.column ?? parseGridColumn(args.gridColumn ?? args.column);
	const row = cell?.row ?? numeric(args.gridRow ?? args.row);
	if (!column || !row || !Number.isFinite(row)) return null;
	const columns = gridSize("x", args, context);
	const rows = gridSize("y", args, context);
	return {
		x: Math.min(1, Math.max(0, (Math.min(columns, Math.max(1, column)) - 0.5) / columns)),
		y: Math.min(1, Math.max(0, (Math.min(rows, Math.max(1, row)) - 0.5) / rows)),
		width: 1 / columns,
		height: 1 / rows,
	};
}

function coordinateSpace(args: Record<string, unknown>) {
	return args.coordinateSpace === "normalized" ||
		args.coordinateSpace === "percent" ||
		args.coordinateSpace === "image_pixels" ||
		args.coordinateSpace === "relative_1000"
		? (args.coordinateSpace as OverlayCoordinateSpace)
		: undefined;
}

const coordinateArgumentNames = [
	"x",
	"y",
	"centerX",
	"centerY",
	"imageX",
	"imageY",
	"pixelX",
	"pixelY",
	"screenX",
	"screenY",
	"targetX",
	"targetY",
	"left",
	"top",
	"pixelLeft",
	"pixelTop",
	"width",
	"height",
	"pixelWidth",
	"pixelHeight",
	"boxWidth",
	"boxHeight",
	"w",
	"h",
] as const;

function inferredCoordinateSpace(args: Record<string, unknown>, context?: OverlayCoordinateContext): OverlayCoordinateSpace | undefined {
	const explicitSpace = coordinateSpace(args);
	if (explicitSpace) return explicitSpace;

	if (coordinateArgumentNames.some((name) => typeof args[name] === "string" && args[name].trim().endsWith("%"))) return "percent";
	const values = coordinateArgumentNames.map((name) => numeric(args[name])).filter((value): value is number => value !== null);
	if (values.length === 0) return undefined;
	// Keep pixel pairs consistent: if any axis clearly exceeds the percent range, treat the whole pair as pixels.
	if (context && values.some((value) => Math.abs(value) > 100)) return "image_pixels";
	// Otherwise let the per-value ladder map 2..100 as percent (the format the model is instructed to use).
	// relative_1000 is only honored when the model sets coordinateSpace explicitly.
	return undefined;
}

function normalizeCoordinateValue(
	value: unknown,
	axis: "x" | "y",
	fallback: number,
	args: Record<string, unknown>,
	context?: OverlayCoordinateContext,
) {
	const parsed = numeric(value);
	if (parsed === null) return fallback;
	const textValue = typeof value === "string" ? value.trim() : "";
	const size = axisSize(axis, args, context);
	const space = inferredCoordinateSpace(args, context);

	if (space === "image_pixels" && size) return clamp(parsed / size, fallback);
	if (space === "relative_1000") return clamp(parsed / 1_000, fallback);
	if (space === "percent" || textValue.endsWith("%")) return clamp(parsed / 100, fallback);
	if (space === "normalized") return clamp(parsed, fallback);
	if (parsed >= 0 && parsed <= 1) return parsed;
	if (parsed <= 2) return clamp(parsed, fallback);
	if (size && parsed > 1_000) return clamp(parsed / size, fallback);
	if (parsed > 100) return clamp(parsed / 1_000, fallback);
	return clamp(parsed / 100, fallback);
}

function normalizeDimensionValue(
	value: unknown,
	axis: "x" | "y",
	fallback: number,
	args: Record<string, unknown>,
	context?: OverlayCoordinateContext,
) {
	const parsed = numeric(value);
	const explicitSpace = coordinateSpace(args);
	if (parsed !== null && parsed >= 0 && parsed <= 1 && (explicitSpace === undefined || explicitSpace === "normalized")) return parsed;
	return Math.max(0, normalizeCoordinateValue(value, axis, fallback, args, context));
}

function normalizePointArgs(args: Record<string, unknown>, context?: OverlayCoordinateContext) {
	const gridPoint = normalizeGridPoint(args, context);
	if (gridPoint && firstDefined(args, ["x", "centerX", "imageX", "pixelX", "screenX", "targetX"]) === undefined) {
		return { x: gridPoint.x, y: gridPoint.y };
	}
	const xValue = firstDefined(args, ["x", "centerX", "imageX", "pixelX", "screenX", "targetX"]);
	const yValue = firstDefined(args, ["y", "centerY", "imageY", "pixelY", "screenY", "targetY"]);
	if (xValue === undefined || yValue === undefined) return null;
	return {
		x: normalizeCoordinateValue(xValue, "x", 0.5, args, context),
		y: normalizeCoordinateValue(yValue, "y", 0.5, args, context),
	};
}

function normalizeDisplayArgs(args: Record<string, unknown>, context?: OverlayCoordinateContext) {
	const display = args.display ?? args.displayId ?? context?.displayId;
	return displayTarget(display) ? { ...args, display } : args;
}

function normalizeToolCallArguments(name: string, rawArgs: Record<string, unknown>, context?: OverlayCoordinateContext) {
	const args = normalizeDisplayArgs(rawArgs, context);

	switch (name) {
		case "overlay_move_cursor":
		case "overlay_show_arrow":
		case "overlay_show_bubble": {
			const point = normalizePointArgs(args, context);
			return point ? { ...args, ...point, coordinateSpace: "normalized" } : args;
		}
		case "overlay_show_highlight": {
			const gridPoint = normalizeGridPoint(args, context);
			const hasCenterInput = firstDefined(args, ["centerX", "pixelCenterX"]) !== undefined || firstDefined(args, ["centerY", "pixelCenterY"]) !== undefined;
			const hasTopLeftInput = firstDefined(args, ["x", "left", "pixelX", "pixelLeft", "imageX"]) !== undefined && firstDefined(args, ["y", "top", "pixelY", "pixelTop", "imageY"]) !== undefined;
			if (!gridPoint && !hasCenterInput && !hasTopLeftInput) return args;
			const width =
				firstDefined(args, ["width", "pixelWidth", "boxWidth", "w"]) === undefined && gridPoint
					? gridPoint.width
					: normalizeDimensionValue(firstDefined(args, ["width", "pixelWidth", "boxWidth", "w"]), "x", 0.28, args, context);
			const height =
				firstDefined(args, ["height", "pixelHeight", "boxHeight", "h"]) === undefined && gridPoint
					? gridPoint.height
					: normalizeDimensionValue(firstDefined(args, ["height", "pixelHeight", "boxHeight", "h"]), "y", 0.18, args, context);
			const point = hasCenterInput
				? {
						x:
							normalizeCoordinateValue(firstDefined(args, ["centerX", "pixelCenterX"]), "x", 0.5, args, context) -
							Math.min(width, 1) / 2,
						y:
							normalizeCoordinateValue(firstDefined(args, ["centerY", "pixelCenterY"]), "y", 0.5, args, context) -
							Math.min(height, 1) / 2,
					}
				: {
						x:
							firstDefined(args, ["x", "left", "pixelX", "pixelLeft", "imageX"]) === undefined && gridPoint
								? gridPoint.x - width / 2
								: normalizeCoordinateValue(firstDefined(args, ["x", "left", "pixelX", "pixelLeft", "imageX"]), "x", 0.25, args, context),
						y:
							firstDefined(args, ["y", "top", "pixelY", "pixelTop", "imageY"]) === undefined && gridPoint
								? gridPoint.y - height / 2
								: normalizeCoordinateValue(firstDefined(args, ["y", "top", "pixelY", "pixelTop", "imageY"]), "y", 0.25, args, context),
					};
			const x = clamp(point.x, 0.25);
			const y = clamp(point.y, 0.25);
			const { centerX, centerY, pixelCenterX, pixelCenterY, ...restArgs } = args;
			void centerX;
			void centerY;
			void pixelCenterX;
			void pixelCenterY;
			return {
				...restArgs,
				x,
				y,
				width: Math.min(width, 1 - x),
				height: Math.min(height, 1 - y),
				coordinateSpace: "normalized",
			};
		}
		default:
			return args;
	}
}

function normalizeOverlayToolCall(toolCall: AiToolCall, context?: OverlayCoordinateContext): AiToolCall {
	const name = toolCall.function?.name;
	if (!name) return toolCall;
	const args = parseArguments(toolCall.function?.arguments);
	return {
		...toolCall,
		function: {
			...toolCall.function,
			arguments: normalizeToolCallArguments(name, args, context),
		},
	};
}

export function normalizeOverlayToolCalls(toolCalls: AiToolCall[], context?: OverlayCoordinateContext) {
	return toolCalls.map((toolCall) => normalizeOverlayToolCall(toolCall, context));
}

const normalizedNumberPattern = "(\\d+(?:\\.\\d+)?%?)";
const coordinatePairPatterns = [
	new RegExp(`\\bx\\s*[:=]\\s*${normalizedNumberPattern}\\s*(?:,|;|\\s+)\\s*y\\s*[:=]\\s*${normalizedNumberPattern}`, "i"),
	new RegExp(`\\bcoordinates?\\b[^\\n\\d]*${normalizedNumberPattern}\\s*(?:,|;|/)\\s*${normalizedNumberPattern}`, "i"),
	new RegExp(`\\(\\s*${normalizedNumberPattern}\\s*,\\s*${normalizedNumberPattern}\\s*\\)`, "i"),
] as const;

function extractGridPoint(text: string, context?: OverlayCoordinateContext) {
	// Only interpret a "letter+number" token as a grid cell when a calibration grid is actually in use;
	// otherwise strings like "H2" or "F12" in the model's prose would be mistaken for coordinates.
	if (!context?.gridColumns && !context?.gridRows) return null;
	const match = /\b(?:grid\s*)?(?:cell|square|box)?\s*([A-Z]{1,2})\s*[-:]?\s*(\d{1,2})\b/i.exec(text);
	if (!match) return null;
	const gridPoint = normalizeGridPoint({ gridColumn: match[1], gridRow: Number(match[2]) }, context);
	return gridPoint ? { x: gridPoint.x, y: gridPoint.y } : null;
}

function extractPoint(text: string, context?: OverlayCoordinateContext) {
	const gridPoint = extractGridPoint(text, context);
	if (gridPoint) return gridPoint;
	for (const pattern of coordinatePairPatterns) {
		const match = pattern.exec(text);
		if (!match?.[1] || !match[2]) continue;
		const args = { x: match[1], y: match[2] };
		return {
			x: normalizeCoordinateValue(match[1], "x", 0.5, args, context),
			y: normalizeCoordinateValue(match[2], "y", 0.5, args, context),
		};
	}
	return null;
}

function extractSize(text: string, context?: OverlayCoordinateContext) {
	const pattern = new RegExp(`\\bwidth\\s*[:=]\\s*${normalizedNumberPattern}[^\\n\\d]+height\\s*[:=]\\s*${normalizedNumberPattern}`, "i");
	const match = pattern.exec(text);
	if (!match?.[1] || !match[2]) return null;
	const width = normalizeDimensionValue(match[1], "x", 0.22, {}, context);
	const height = normalizeDimensionValue(match[2], "y", 0.16, {}, context);
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

function quotedMessage(text: string) {
	const match = /["“']([^"”']{1,120})["”']/.exec(text);
	return match?.[1]?.trim();
}

function overlayMessage(prompt: string, content: string) {
	return quotedMessage(prompt) ?? quotedMessage(content) ?? compactOverlayMessage(content) ?? compactOverlayMessage(prompt);
}

function wantsTextOverlay(text: string) {
	return /\b(text|message|label|note|caption|chat\s*bubble|bubble|speech\s*bubble|write|say)\b/i.test(text);
}

function wantsHighlight(text: string) {
	return (
		/\b(highlight|box|outline)\b/i.test(text) ||
		/\b(show|draw|add|put|place|display)\b[^.?!\n]{0,80}\b(rectangle|rect|circle)\b/i.test(text) ||
		/\b(rectangle|rect|circle)\b[^.?!\n]{0,80}\b(around|over|on)\b/i.test(text)
	);
}

function wantsCursor(text: string) {
	return /\bcursor\b/i.test(text);
}

function wantsArrow(text: string) {
	return /\b(arrow|point|pointer)\b/i.test(text);
}

function isOverlayDemoPrompt(prompt: string) {
	return /\b(show|test|display)\b/i.test(prompt) && /\b(every|all)\b/i.test(prompt) && /\boverlay\b/i.test(prompt);
}

function hasOverlayActionIntent(prompt: string, content: string) {
	const promptHasAction =
		/\b(show|put|place|add|draw|display|move|point|highlight|mark|circle|pick|choose|select|suggest|recommend|find|open|navigate|guide|overlay|clear|remove|hide|click)\b/i.test(
			prompt,
		);
	const promptHasOverlayTarget =
		/\b(overlay|arrow|highlight|cursor|bubble|point|mark|circle|annotation|screen|desktop|youtube|video|button|menu|link|tab|page|click)\b/i.test(
			prompt,
		);
	const contentLooksLikeOverlayPlan =
		Boolean(extractPoint(content)) && /\b(coordinates?|grid|cell|arrow|highlight|overlay|points?|target|thumbnail|button|video)\b/i.test(content);
	return promptHasAction && (promptHasOverlayTarget || contentLooksLikeOverlayPlan);
}

function highlightArgsFromPoint(point: { x: number; y: number }, content: string, context?: OverlayCoordinateContext) {
	const size = extractSize(content, context) ?? { width: 0.22, height: 0.16 };
	return {
		x: Math.max(0, point.x - size.width / 2),
		y: Math.max(0, point.y - size.height / 2),
		width: size.width,
		height: size.height,
		message: compactOverlayMessage(content),
	};
}

function visualToolName(name: string | undefined): name is VisualOverlayToolName {
	return (
		name === "overlay_move_cursor" ||
		name === "overlay_show_arrow" ||
		name === "overlay_show_highlight" ||
		name === "overlay_show_bubble"
	);
}

function requestedVisualTools(prompt: string): VisualOverlayToolName[] {
	if (isOverlayDemoPrompt(prompt)) {
		return ["overlay_move_cursor", "overlay_show_arrow", "overlay_show_highlight", "overlay_show_bubble"];
	}

	const tools: VisualOverlayToolName[] = [];
	if (wantsCursor(prompt)) tools.push("overlay_move_cursor");
	if (wantsHighlight(prompt)) tools.push("overlay_show_highlight");
	if (wantsTextOverlay(prompt)) tools.push("overlay_show_bubble");
	if (wantsArrow(prompt)) tools.push("overlay_show_arrow");
	return tools;
}

function synthesizedVisualToolCall(
	name: VisualOverlayToolName,
	point: { x: number; y: number } | null,
	message: string,
	content: string,
	context?: OverlayCoordinateContext,
) {
	switch (name) {
		case "overlay_move_cursor":
			return point ? overlayToolCall(name, { ...point, label: "Meera" }) : null;
		case "overlay_show_arrow":
			return point ? overlayToolCall(name, { ...point, message }) : null;
		case "overlay_show_highlight":
			return point ? overlayToolCall(name, { ...highlightArgsFromPoint(point, content, context), message }) : null;
		case "overlay_show_bubble":
			return overlayToolCall(name, { ...(point ?? { x: 0.5, y: 0.82 }), message, placement: "top" });
	}
}

export function reconcileOverlayToolCalls({
	content,
	context,
	prompt,
	toolCalls,
}: {
	content: string;
	context?: OverlayCoordinateContext;
	prompt: string;
	toolCalls: AiToolCall[];
}) {
	const normalizedCalls = normalizeOverlayToolCalls(toolCalls, context);
	if (isOverlayDemoPrompt(prompt)) {
		return normalizeOverlayToolCalls(
			[
				overlayToolCall("overlay_move_cursor", { x: 0.24, y: 0.28, label: "Meera" }),
				overlayToolCall("overlay_show_arrow", { x: 0.72, y: 0.28, message: "Arrow" }),
				overlayToolCall("overlay_show_highlight", { x: 0.54, y: 0.56, width: 0.28, height: 0.18, message: "Highlight" }),
				overlayToolCall("overlay_show_bubble", { x: 0.35, y: 0.74, message: "Chat bubble" }),
			],
			context,
		);
	}

	// Trust the model's tool choice. If it drew any visual overlay, use its calls as-is. The model is
	// far better than prompt keyword-matching at picking the overlay type (e.g. it correctly answers an
	// arrow for "point at the red box" and a highlight for "draw a box around it"). Synthesizing from
	// keywords used to bolt on a spurious second overlay whenever a target noun collided with an overlay
	// word ("search box", "the box thingy") and overrode correct choices — so only fall back to keyword
	// synthesis when the model produced NO visual overlay at all (e.g. it answered in prose).
	if (normalizedCalls.some((call) => visualToolName(call.function?.name))) {
		return normalizedCalls;
	}

	const requestedTools = requestedVisualTools(prompt);
	if (requestedTools.length === 0) return normalizedCalls;

	const controlCalls = normalizedCalls.filter((call) => !visualToolName(call.function?.name));
	const contentPoint = extractPoint(content, context);
	const preferredPoint = contentPoint ?? extractPoint(prompt, context);
	const message = overlayMessage(prompt, content);
	const visualCalls = requestedTools.flatMap((name) => {
		const synthesized = synthesizedVisualToolCall(name, preferredPoint, message, content, context);
		return synthesized ? [synthesized] : [];
	});

	return normalizeOverlayToolCalls([...controlCalls, ...visualCalls], context);
}

export function recoverOverlayToolCallsFromText({
	content,
	context,
	prompt,
}: {
	content: string;
	context?: OverlayCoordinateContext;
	prompt: string;
}): AiToolCall[] {
	const text = `${prompt}\n${content}`;
	if (!hasOverlayActionIntent(prompt, content)) return [];

	if (isOverlayDemoPrompt(prompt)) {
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

	const point = extractPoint(content, context) ?? extractPoint(prompt, context);
	const message = overlayMessage(prompt, content);
	const promptHasExplicitVisualTool = requestedVisualTools(prompt).length > 0;
	const intentText = promptHasExplicitVisualTool ? prompt : text;
	const wantsText = wantsTextOverlay(intentText);
	if (!point) {
		if (wantsText) {
			return [
				overlayToolCall("overlay_show_bubble", {
					x: 0.5,
					y: 0.82,
					message,
					placement: "top",
				}),
			];
		}
		return [];
	}

	const calls: AiToolCall[] = [];

	if (wantsCursor(intentText)) calls.push(overlayToolCall("overlay_move_cursor", { x: point.x, y: point.y, label: "Meera" }));
	if (wantsHighlight(intentText)) calls.push(overlayToolCall("overlay_show_highlight", highlightArgsFromPoint(point, content, context)));
	if (wantsText) calls.push(overlayToolCall("overlay_show_bubble", { x: point.x, y: point.y, message, placement: "top" }));
	if (calls.length === 0 || wantsArrow(intentText) || /\b(mark|pick|choose|select|suggest|recommend)\b/i.test(intentText)) {
		calls.unshift(overlayToolCall("overlay_show_arrow", { x: point.x, y: point.y, message }));
	}

	return normalizeOverlayToolCalls(calls, context);
}

export function toolCallToOverlayCommand(toolCall: AiToolCall): OverlayCommand | null {
	const normalizedToolCall = normalizeOverlayToolCall(toolCall);
	const name = normalizedToolCall.function?.name;
	if (!name) return null;
	const args = parseArguments(normalizedToolCall.function?.arguments);
	let command: OverlayCommand | null = null;

	switch (name) {
		case "overlay_move_cursor": {
			const target = pointFromArgs(args);
			if (!target) return null;
			command = withDisplay(
				{
					type: "cursor.move",
					target,
					animationMs: Math.round(clamp(args.animationMs, 700, 0, 60_000)),
					label: optionalString(args.label, 100) ?? "Meera",
				},
				args.display ?? args.displayId,
			);
			break;
		}
		case "overlay_hide_cursor":
			command = withDisplay({ type: "cursor.hide" }, args.display ?? args.displayId);
			break;
		case "overlay_show_arrow": {
			const target = pointFromArgs(args);
			if (!target) return null;
			command = withDisplay(
				{
					type: "arrow.show",
					id: annotationId(args.id, "arrow"),
					target,
					direction: placement(args.direction),
					message: optionalString(args.message, 500),
					ttlMs: ttl(args.ttlMs),
				},
				args.display ?? args.displayId,
			);
			break;
		}
		case "overlay_show_highlight": {
			const point = pointFromArgs(args);
			if (!point || numeric(args.width) === null || numeric(args.height) === null) return null;
			const x = point.x;
			const y = point.y;
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
				args.display ?? args.displayId,
			);
			break;
		}
		case "overlay_show_bubble": {
			const target = pointFromArgs(args) ?? { x: 0.5, y: 0.82 };
			command = withDisplay(
				{
					type: "bubble.show",
					id: annotationId(args.id, "bubble"),
					target,
					message: optionalString(args.message, 500) ?? "Look here.",
					placement: placement(args.placement) ?? "top",
					ttlMs: ttl(args.ttlMs),
				},
				args.display ?? args.displayId,
			);
			break;
		}
		case "overlay_remove": {
			const id = optionalString(args.id, 100);
			if (id) command = withDisplay({ type: "overlay.remove", id }, args.display ?? args.displayId);
			break;
		}
		case "overlay_clear":
			command = withDisplay({ type: "overlay.clear" }, args.display ?? args.displayId);
			break;
		default:
			return null;
	}

	return command && isOverlayCommand(command) ? command : null;
}
