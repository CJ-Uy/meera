import type { AiToolCall } from "@/features/ai/ai-types";
import type { GroundingCandidate, OcrWord, OverlayAction } from "@/features/ai/grounding/types";

/**
 * Turn raw OCR words into clean, selectable text candidates.
 *
 * OCR returns hundreds of word boxes; the selection model works far better over a short list of
 * line-level labels (a button caption or menu item is usually one line). We group words into rows,
 * split each row into runs separated by real gaps (so "File" and "Edit" stay distinct), then emit one
 * candidate per run with its union bounding box, normalized to image space.
 */

const DEFAULT_MIN_CONFIDENCE = 45;
const DEFAULT_MAX_CANDIDATES = 90;
// Drop runs shorter than this in normalized height — almost always OCR noise, not a real control label.
const MIN_NORMALIZED_HEIGHT = 0.006;
// Two words on the same row belong to the same label when the gap between them is below this multiple
// of the row's height. Bigger gaps mean separate controls (e.g. spaced-out menu items).
const HORIZONTAL_GAP_FACTOR = 1.1;
// A word joins a row when its vertical center is within this multiple of the row height.
const ROW_VERTICAL_TOLERANCE = 0.6;

type BuildOptions = {
	imageWidth: number;
	imageHeight: number;
	minConfidence?: number;
	maxCandidates?: number;
};

type Row = {
	words: OcrWord[];
	centerY: number;
	heightSum: number;
};

function isUsableWord(word: OcrWord, minConfidence: number) {
	if (word.confidence < minConfidence) return false;
	if (word.x1 <= word.x0 || word.y1 <= word.y0) return false;
	const text = word.text.trim();
	if (text.length === 0) return false;
	// Pure punctuation / box-drawing artefacts are rarely meaningful selection targets.
	return /[\p{L}\p{N}]/u.test(text);
}

function wordHeight(word: OcrWord) {
	return word.y1 - word.y0;
}

function wordCenterY(word: OcrWord) {
	return (word.y0 + word.y1) / 2;
}

/** Greedily bucket words into rows by vertical center, then sort each row left-to-right. */
function groupIntoRows(words: OcrWord[]): Row[] {
	const rows: Row[] = [];
	for (const word of [...words].sort((a, b) => wordCenterY(a) - wordCenterY(b))) {
		const centerY = wordCenterY(word);
		const height = wordHeight(word);
		const row = rows.find((candidate) => {
			const averageHeight = candidate.heightSum / candidate.words.length;
			return Math.abs(candidate.centerY - centerY) <= ROW_VERTICAL_TOLERANCE * Math.max(averageHeight, height);
		});
		if (row) {
			row.words.push(word);
			row.heightSum += height;
			row.centerY = (row.centerY * (row.words.length - 1) + centerY) / row.words.length;
		} else {
			rows.push({ words: [word], centerY, heightSum: height });
		}
	}
	for (const row of rows) row.words.sort((a, b) => a.x0 - b.x0);
	return rows;
}

type Run = { words: OcrWord[] };

/** Split a row into runs wherever a horizontal gap exceeds the gap factor. */
function splitRowIntoRuns(row: Row): Run[] {
	const averageHeight = row.heightSum / row.words.length;
	const runs: Run[] = [];
	let current: OcrWord[] = [];
	let previous: OcrWord | null = null;
	for (const word of row.words) {
		if (previous && word.x0 - previous.x1 > HORIZONTAL_GAP_FACTOR * averageHeight) {
			runs.push({ words: current });
			current = [];
		}
		current.push(word);
		previous = word;
	}
	if (current.length) runs.push({ words: current });
	return runs;
}

function runToCandidate(run: Run, imageWidth: number, imageHeight: number): Omit<GroundingCandidate, "id"> | null {
	const x0 = Math.min(...run.words.map((word) => word.x0));
	const y0 = Math.min(...run.words.map((word) => word.y0));
	const x1 = Math.max(...run.words.map((word) => word.x1));
	const y1 = Math.max(...run.words.map((word) => word.y1));
	const text = run.words.map((word) => word.text.trim()).join(" ").replace(/\s+/g, " ").trim();
	if (!text) return null;
	const x = x0 / imageWidth;
	const y = y0 / imageHeight;
	const width = (x1 - x0) / imageWidth;
	const height = (y1 - y0) / imageHeight;
	if (height < MIN_NORMALIZED_HEIGHT) return null;
	return {
		text,
		role: "text",
		source: "ocr",
		x: clamp01(x),
		y: clamp01(y),
		width: Math.min(width, 1 - clamp01(x)),
		height: Math.min(height, 1 - clamp01(y)),
	};
}

function clamp01(value: number) {
	return Math.min(1, Math.max(0, value));
}

export function buildCandidatesFromOcr(words: OcrWord[], options: BuildOptions): GroundingCandidate[] {
	const { imageWidth, imageHeight } = options;
	if (!imageWidth || !imageHeight) return [];
	const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
	const maxCandidates = options.maxCandidates ?? DEFAULT_MAX_CANDIDATES;

	const usable = words.filter((word) => isUsableWord(word, minConfidence));
	const rows = groupIntoRows(usable);
	const raw = rows
		.flatMap(splitRowIntoRuns)
		.map((run) => runToCandidate(run, imageWidth, imageHeight))
		.filter((candidate): candidate is Omit<GroundingCandidate, "id"> => candidate !== null);

	// Prefer larger, more prominent labels when we have to trim.
	const trimmed = raw
		.sort((a, b) => b.width * b.height - a.width * a.height)
		.slice(0, maxCandidates)
		// Restore reading order (top-to-bottom, left-to-right) for a stable, human-sensible id sequence.
		.sort((a, b) => a.y - b.y || a.x - b.x);

	return trimmed.map((candidate, index) => ({ ...candidate, id: `e${index + 1}` }));
}

export function positionLabel(centerX: number, centerY: number): string {
	const vertical = centerY < 0.34 ? "top" : centerY < 0.67 ? "middle" : "bottom";
	const horizontal = centerX < 0.34 ? "left" : centerX < 0.67 ? "center" : "right";
	if (vertical === "middle" && horizontal === "center") return "center";
	return `${vertical}-${horizontal}`;
}

function candidateCenter(candidate: GroundingCandidate) {
	return { x: candidate.x + candidate.width / 2, y: candidate.y + candidate.height / 2 };
}

/** Render the candidate list as compact text for the selection model. */
export function renderCandidatesForPrompt(candidates: GroundingCandidate[]): string {
	return candidates
		.map((candidate) => {
			const center = candidateCenter(candidate);
			// Text candidates show their text; non-text regions (images/cards) show their role instead.
			const label = candidate.text ? `"${candidate.text}"` : `[${candidate.role}]`;
			return `${candidate.id}: ${label} [${positionLabel(center.x, center.y)}]`;
		})
		.join("\n");
}

export function candidateById(candidates: GroundingCandidate[], id: string): GroundingCandidate | undefined {
	return candidates.find((candidate) => candidate.id === id);
}

// Margin added around a highlight so the box frames the element instead of clipping it.
const HIGHLIGHT_MARGIN = 0.008;

/** Build a normalized overlay tool call from a chosen candidate. Coordinates are already exact. */
export function candidateToOverlayToolCall(
	candidate: GroundingCandidate,
	action: Exclude<OverlayAction, "none">,
	message: string,
): AiToolCall {
	const center = candidateCenter(candidate);
	const trimmedMessage = message.trim().slice(0, 240);

	if (action === "highlight") {
		const x = clamp01(candidate.x - HIGHLIGHT_MARGIN);
		const y = clamp01(candidate.y - HIGHLIGHT_MARGIN);
		const width = Math.min(1 - x, candidate.width + HIGHLIGHT_MARGIN * 2);
		const height = Math.min(1 - y, candidate.height + HIGHLIGHT_MARGIN * 2);
		return {
			function: {
				name: "overlay_show_highlight",
				arguments: { x, y, width, height, coordinateSpace: "normalized", ...(trimmedMessage ? { message: trimmedMessage } : {}) },
			},
		};
	}

	if (action === "cursor") {
		return {
			function: {
				name: "overlay_move_cursor",
				arguments: { x: center.x, y: center.y, coordinateSpace: "normalized", label: "Meera" },
			},
		};
	}

	if (action === "bubble") {
		return {
			function: {
				name: "overlay_show_bubble",
				arguments: { x: center.x, y: center.y, coordinateSpace: "normalized", placement: "top", message: trimmedMessage || "Look here." },
			},
		};
	}

	return {
		function: {
			name: "overlay_show_arrow",
			arguments: { x: center.x, y: center.y, coordinateSpace: "normalized", ...(trimmedMessage ? { message: trimmedMessage } : {}) },
		},
	};
}
