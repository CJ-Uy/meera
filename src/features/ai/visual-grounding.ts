import type { AiImageAttachment, AiToolCall } from "@/features/ai/ai-types";

/**
 * Zoom-refine grounding.
 *
 * Groq's only vision model (Llama-4 Scout) is a weak grounder: its first coordinate guess lands in the
 * right neighbourhood but is rarely precise. Instead of trusting that single guess, we crop the screenshot
 * around it, upscale that region, and ask the model to re-locate the target in the zoomed view. Absolute
 * error shrinks with the field of view, so the second pass is far more accurate — and because the crop is
 * centred on the first guess, a bad refine can only move the overlay within that neighbourhood, never to a
 * completely different place. If the refine pass returns nothing usable we keep the first guess unchanged.
 */

export type NormalizedRegion = { x: number; y: number; width: number; height: number };
export type GroundTarget =
	| { kind: "point"; x: number; y: number }
	| { kind: "rect"; x: number; y: number; width: number; height: number };

const VISUAL_TOOLS = new Set(["overlay_move_cursor", "overlay_show_arrow", "overlay_show_highlight", "overlay_show_bubble"]);

// Fraction of the full frame the crop spans (kept equal on both axes so the crop keeps the screen aspect ratio).
// Generous enough to still contain the target when the weak first-pass guess is off by up to ~0.2.
const POINT_CROP_FRACTION = 0.42;
const RECT_CROP_PADDING = 0.6;
const MIN_CROP_FRACTION = 0.22;
const MAX_CROP_FRACTION = 0.7;
// Skip refining a highlight that already covers most of the screen — there is nothing to zoom into.
const REFINE_MAX_TARGET_FRACTION = 0.6;

function clamp01(value: number) {
	return Math.min(1, Math.max(0, value));
}

function readArgs(toolCall: AiToolCall): Record<string, unknown> {
	const raw = toolCall.function?.arguments;
	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw) as unknown;
			return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
		} catch {
			return {};
		}
	}
	return raw ?? {};
}

function numericArg(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const parsed = Number(value.trim().replace(/%$/, ""));
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

export function isVisualPositionedToolCall(toolCall: AiToolCall) {
	return VISUAL_TOOLS.has(toolCall.function?.name ?? "");
}

/** Extract the grounded target (already normalized to 0-1) from a visual overlay tool call. */
export function targetOfToolCall(toolCall: AiToolCall): GroundTarget | null {
	const name = toolCall.function?.name;
	if (!name || !VISUAL_TOOLS.has(name)) return null;
	const args = readArgs(toolCall);
	const x = numericArg(args.x);
	const y = numericArg(args.y);
	if (x === null || y === null) return null;

	if (name === "overlay_show_highlight") {
		const width = numericArg(args.width);
		const height = numericArg(args.height);
		if (width !== null && height !== null && width > 0 && height > 0) {
			return { kind: "rect", x: clamp01(x), y: clamp01(y), width: clamp01(width), height: clamp01(height) };
		}
	}
	return { kind: "point", x: clamp01(x), y: clamp01(y) };
}

function targetCenter(target: GroundTarget) {
	if (target.kind === "point") return { x: target.x, y: target.y };
	return { x: target.x + target.width / 2, y: target.y + target.height / 2 };
}

/** Compute the crop window (full-frame normalized coords) to zoom into around a target. */
export function cropRegionForTarget(target: GroundTarget): NormalizedRegion {
	const center = targetCenter(target);
	const requested =
		target.kind === "point"
			? POINT_CROP_FRACTION
			: Math.max(target.width, target.height) * (1 + 2 * RECT_CROP_PADDING);
	const size = Math.min(MAX_CROP_FRACTION, Math.max(MIN_CROP_FRACTION, requested));
	// Keep the full crop size on-screen by sliding the window away from edges.
	const x = Math.min(Math.max(center.x - size / 2, 0), 1 - size);
	const y = Math.min(Math.max(center.y - size / 2, 0), 1 - size);
	return { x, y, width: size, height: size };
}

export function shouldRefineTarget(target: GroundTarget) {
	if (target.kind === "point") return true;
	return Math.max(target.width, target.height) < REFINE_MAX_TARGET_FRACTION;
}

export function mapCropPointToFull(point: { x: number; y: number }, region: NormalizedRegion) {
	return {
		x: clamp01(region.x + clamp01(point.x) * region.width),
		y: clamp01(region.y + clamp01(point.y) * region.height),
	};
}

export function mapCropRectToFull(rect: NormalizedRegion, region: NormalizedRegion) {
	const x = clamp01(region.x + clamp01(rect.x) * region.width);
	const y = clamp01(region.y + clamp01(rect.y) * region.height);
	return {
		x,
		y,
		width: Math.min(1 - x, Math.max(0, rect.width) * region.width),
		height: Math.min(1 - y, Math.max(0, rect.height) * region.height),
	};
}

/** Build the user message for the refine pass. Avoids text-overlay trigger words so the model re-grounds the same kind. */
export function buildRefinePrompt(originalPrompt: string, kind: GroundTarget["kind"]) {
	const trimmed = originalPrompt.trim().slice(0, 200) || "the target the user asked about";
	const action =
		kind === "rect"
			? "give a tight bounding box (top-left x/y plus width/height) that fully covers the target element"
			: "point at the exact center of the target element";
	return [
		"This image is a zoomed-in crop of the user's screen.",
		`Original request: "${trimmed}".`,
		`Find that exact target in this zoomed view and ${action}, using percent coordinates (0-100) of THIS image.`,
		"If the target is not visible in this crop, reply with text only and do not call a tool.",
	].join(" ");
}

/** Pull the best refined target (in crop-space normalized coords) from the refine pass tool calls. */
function refinedTargetFrom(refinedCalls: AiToolCall[], kind: GroundTarget["kind"]): GroundTarget | null {
	const targets = refinedCalls.map(targetOfToolCall).filter((target): target is GroundTarget => target !== null);
	if (targets.length === 0) return null;
	if (kind === "rect") {
		return targets.find((target) => target.kind === "rect") ?? targets[0];
	}
	return targets[0];
}

function withUpdatedArgs(toolCall: AiToolCall, updates: Record<string, number>): AiToolCall {
	return {
		...toolCall,
		function: {
			...toolCall.function,
			arguments: { ...readArgs(toolCall), ...updates, coordinateSpace: "normalized" },
		},
	};
}

export type RefineDeps = {
	cropFrame: (frame: AiImageAttachment, region: NormalizedRegion) => Promise<AiImageAttachment>;
	requestRefine: (image: AiImageAttachment, prompt: string) => Promise<AiToolCall[]>;
};

/**
 * Run the zoom-refine pass over a model's overlay tool calls. Only fires when exactly one positioned overlay
 * targets a screen frame, so multi-overlay demos and text answers are left untouched. Always returns a usable
 * result — on any failure it falls back to the original tool calls.
 */
export async function refineOverlayToolCalls({
	toolCalls,
	frame,
	prompt,
	deps,
	enabled = true,
}: {
	toolCalls: AiToolCall[];
	frame: AiImageAttachment | undefined;
	prompt: string;
	deps: RefineDeps;
	enabled?: boolean;
}): Promise<AiToolCall[]> {
	if (!enabled || !frame || frame.source !== "screen" || !frame.width || !frame.height) return toolCalls;

	const visualCalls = toolCalls.filter(isVisualPositionedToolCall);
	if (visualCalls.length !== 1) return toolCalls;

	const call = visualCalls[0];
	const target = targetOfToolCall(call);
	if (!target || !shouldRefineTarget(target)) return toolCalls;

	const region = cropRegionForTarget(target);

	let refinedCalls: AiToolCall[];
	try {
		const crop = await deps.cropFrame(frame, region);
		refinedCalls = await deps.requestRefine(crop, buildRefinePrompt(prompt, target.kind));
	} catch {
		return toolCalls;
	}

	const refined = refinedTargetFrom(refinedCalls, target.kind);
	if (!refined) return toolCalls;

	let updatedCall: AiToolCall;
	if (target.kind === "rect" && refined.kind === "rect") {
		const rect = mapCropRectToFull(refined, region);
		updatedCall = withUpdatedArgs(call, rect);
	} else if (target.kind === "rect") {
		// Refine returned only a point: keep the original box size, recentre it on the refined point.
		const center = mapCropPointToFull(targetCenter(refined), region);
		const x = clamp01(center.x - target.width / 2);
		const y = clamp01(center.y - target.height / 2);
		updatedCall = withUpdatedArgs(call, {
			x,
			y,
			width: Math.min(1 - x, target.width),
			height: Math.min(1 - y, target.height),
		});
	} else {
		const point = mapCropPointToFull(targetCenter(refined), region);
		updatedCall = withUpdatedArgs(call, { x: point.x, y: point.y });
	}

	return toolCalls.map((current) => (current === call ? updatedCall : current));
}
