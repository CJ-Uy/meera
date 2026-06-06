export type OverlayDisplayTarget = number | "primary" | "all";
export type OverlayPlacement = "top" | "right" | "bottom" | "left";

export type NormalizedPoint = {
	x: number;
	y: number;
};

export type NormalizedRect = NormalizedPoint & {
	width: number;
	height: number;
};

type OverlayCommandBase = {
	displayId?: OverlayDisplayTarget;
};

export type CursorMoveCommand = OverlayCommandBase & {
	type: "cursor.move";
	target: NormalizedPoint;
	animationMs?: number;
	label?: string;
};

export type CursorHideCommand = OverlayCommandBase & {
	type: "cursor.hide";
};

export type ArrowShowCommand = OverlayCommandBase & {
	type: "arrow.show";
	id: string;
	target: NormalizedPoint;
	direction?: OverlayPlacement;
	message?: string;
	ttlMs?: number;
};

export type HighlightShowCommand = OverlayCommandBase & {
	type: "highlight.show";
	id: string;
	rect: NormalizedRect;
	message?: string;
	ttlMs?: number;
};

export type BubbleShowCommand = OverlayCommandBase & {
	type: "bubble.show";
	id: string;
	target: NormalizedPoint;
	message: string;
	placement?: OverlayPlacement;
	ttlMs?: number;
};

export type OverlayRemoveCommand = OverlayCommandBase & {
	type: "overlay.remove";
	id: string;
};

export type OverlayClearCommand = OverlayCommandBase & {
	type: "overlay.clear";
};

export type OverlayCommand =
	| CursorMoveCommand
	| CursorHideCommand
	| ArrowShowCommand
	| HighlightShowCommand
	| BubbleShowCommand
	| OverlayRemoveCommand
	| OverlayClearCommand;

export type OverlaySequenceStep = {
	afterMs: number;
	command: OverlayCommand;
};

const OVERLAY_TYPES = new Set<OverlayCommand["type"]>([
	"cursor.move",
	"cursor.hide",
	"arrow.show",
	"highlight.show",
	"bubble.show",
	"overlay.remove",
	"overlay.clear",
]);
const PLACEMENTS = new Set<OverlayPlacement>(["top", "right", "bottom", "left"]);

export function clampNormalized(value: number) {
	return Math.min(1, Math.max(0, value));
}

export function normalizePoint(point: NormalizedPoint): NormalizedPoint {
	return { x: clampNormalized(point.x), y: clampNormalized(point.y) };
}

export function normalizeRect(rect: NormalizedRect): NormalizedRect {
	const point = normalizePoint(rect);
	return {
		...point,
		width: Math.min(1 - point.x, Math.max(0, rect.width)),
		height: Math.min(1 - point.y, Math.max(0, rect.height)),
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isNormalizedNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isPoint(value: unknown): value is NormalizedPoint {
	return isRecord(value) && isNormalizedNumber(value.x) && isNormalizedNumber(value.y);
}

function isRect(value: unknown): value is NormalizedRect {
	if (!isRecord(value) || !isPoint(value)) return false;
	const candidate = value as NormalizedPoint & Record<string, unknown>;
	const width = candidate["width"];
	const height = candidate["height"];
	return isNormalizedNumber(width) && isNormalizedNumber(height) && candidate.x + width <= 1 && candidate.y + height <= 1;
}

function hasStringId(value: Record<string, unknown>) {
	return typeof value.id === "string" && value.id.length > 0 && value.id.length <= 100;
}

function isOptionalString(value: unknown, maximumLength: number) {
	return value === undefined || (typeof value === "string" && value.length <= maximumLength);
}

function isOptionalDuration(value: unknown) {
	return value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 60_000);
}

function isOptionalPlacement(value: unknown) {
	return value === undefined || (typeof value === "string" && PLACEMENTS.has(value as OverlayPlacement));
}

function hasValidDisplayTarget(value: Record<string, unknown>) {
	const displayId = value.displayId;
	return (
		displayId === undefined ||
		displayId === "primary" ||
		displayId === "all" ||
		(typeof displayId === "number" && Number.isSafeInteger(displayId))
	);
}

export function isOverlayCommand(value: unknown): value is OverlayCommand {
	if (!isRecord(value) || typeof value.type !== "string" || !OVERLAY_TYPES.has(value.type as OverlayCommand["type"])) {
		return false;
	}
	if (!hasValidDisplayTarget(value)) return false;

	switch (value.type) {
		case "cursor.move":
			return isPoint(value.target) && isOptionalDuration(value.animationMs) && isOptionalString(value.label, 100);
		case "cursor.hide":
		case "overlay.clear":
			return true;
		case "arrow.show":
			return (
				hasStringId(value) &&
				isPoint(value.target) &&
				isOptionalPlacement(value.direction) &&
				isOptionalString(value.message, 500) &&
				isOptionalDuration(value.ttlMs)
			);
		case "highlight.show":
			return hasStringId(value) && isRect(value.rect) && isOptionalString(value.message, 500) && isOptionalDuration(value.ttlMs);
		case "bubble.show":
			return (
				hasStringId(value) &&
				isPoint(value.target) &&
				typeof value.message === "string" &&
				value.message.length > 0 &&
				value.message.length <= 500 &&
				isOptionalPlacement(value.placement) &&
				isOptionalDuration(value.ttlMs)
			);
		case "overlay.remove":
			return hasStringId(value);
		default:
			return false;
	}
}
