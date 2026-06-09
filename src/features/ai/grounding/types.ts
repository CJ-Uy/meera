/**
 * Grounding types for Meera's overlay assistant.
 *
 * The core idea: do not ask the vision model to regress coordinates. Instead we extract candidate
 * UI elements with exact, reliable rects from a deterministic source (OCR today, UI Automation later),
 * present them to the model, and let it SELECT one by id. The chosen candidate's rect becomes the
 * overlay — pixel-accurate by construction. See docs/OVERLAY_GROUNDING_PLAN.md.
 *
 * All candidate rects are normalized to the captured image's own pixel space (0-1, top-left origin),
 * which maps 1:1 onto the overlay window for the same display. Keeping everything in image space avoids
 * the per-monitor DPI alignment bugs that come with screen-coordinate sources like UI Automation.
 */

/** A single OCR word, in source-image PIXEL coordinates. */
export type OcrWord = {
	text: string;
	x0: number;
	y0: number;
	x1: number;
	y1: number;
	confidence: number;
};

export type GroundingSource = "ocr" | "uia";

/** A candidate UI element. Rect is normalized 0-1 in image space, top-left origin. */
export type GroundingCandidate = {
	id: string;
	text: string;
	role: string;
	source: GroundingSource;
	x: number;
	y: number;
	width: number;
	height: number;
};

export type OverlayAction = "arrow" | "highlight" | "bubble" | "cursor" | "none";

/** What the selection model returns: which candidate, and how to mark it. */
export type OverlaySelection = {
	action: OverlayAction;
	elementId: string;
	message: string;
};

export const OVERLAY_ACTIONS: readonly OverlayAction[] = ["arrow", "highlight", "bubble", "cursor", "none"];

export function isOverlayAction(value: unknown): value is OverlayAction {
	return typeof value === "string" && (OVERLAY_ACTIONS as readonly string[]).includes(value);
}
