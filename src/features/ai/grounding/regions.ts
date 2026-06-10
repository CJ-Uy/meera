"use client";

import type { GroundingCandidate } from "@/features/ai/grounding/types";

/**
 * Content-region detection — finds large non-text rectangles (video thumbnails, photos, cards) that OCR
 * can't see, and adds them as overlay candidates. Without this, "highlight the thumbnail" has no target
 * and falls back to the vision model's blind guess.
 *
 * Pipeline (deterministic, no model):
 *  1. Downscale the frame; score each grid cell by "busyness" (luminance + saturation variance — photos
 *     score high, flat UI chrome scores low).
 *  2. Threshold the grid ADAPTIVELY (Otsu, with an absolute floor) so it self-calibrates to light/dark
 *     themes instead of relying on a magic constant.
 *  3. Morphologically close the mask so smooth patches inside a photo (sky, skin) don't punch holes.
 *  4. Keep large, solid, rectangular connected components.
 *
 * Everything stays in image space, so a region rect maps onto the overlay exactly like an OCR rect. The
 * pure grid->regions and Otsu steps are unit-tested; the canvas->grid step is verified with "Debug boxes".
 */

export type RegionFilterOptions = {
	/** Reject regions smaller than this fraction of the frame (drop icons/noise). */
	minAreaFraction: number;
	/** Reject regions larger than this fraction (drop full-window backgrounds). */
	maxAreaFraction: number;
	/** Reject sparse components — real tiles fill most of their bounding box. */
	minFill: number;
	/** Keep at most this many regions (largest first). */
	maxRegions: number;
	/** Morphological close iterations to fill interior holes of photos. */
	closeIterations: number;
};

export const DEFAULT_REGION_FILTER: RegionFilterOptions = {
	minAreaFraction: 0.012,
	maxAreaFraction: 0.85,
	minFill: 0.3,
	maxRegions: 18,
	closeIterations: 2,
};

// Below this absolute busyness, treat the whole frame as flat UI (no regions) regardless of Otsu — stops
// a uniform screen from being split into noise.
export const REGION_SCORE_FLOOR = 55;
// Otsu picks the split that isolates only the busiest patches; photo interiors fall below it. Use a
// fraction of Otsu so a whole thumbnail (including its smoother areas) reads as one solid block.
export const REGION_OTSU_FACTOR = 0.5;
const DOWNSCALE_WIDTH = 800;
const CELL = 8;
// XY-cut splits a block at the deepest projection-profile valley (a gutter) when it dips below this
// fraction of the block's peak. Keeps cutting tiles apart until no clear gutter remains.
const SPLIT_RATIO = 0.45;
const SPLIT_MARGIN = 0.16;
const MIN_SPLIT_CELLS = 3;
const MAX_CUT_DEPTH = 14;

type Rect = { x: number; y: number; width: number; height: number };

/** Otsu's method: pick the score threshold that best separates "busy" cells from "flat" cells. Pure. */
export function otsuThreshold(scores: number[]): number {
	if (scores.length === 0) return 0;
	let min = Infinity;
	let max = -Infinity;
	for (const value of scores) {
		if (value < min) min = value;
		if (value > max) max = value;
	}
	if (!(max > min)) return max;

	const bins = 64;
	const histogram = new Array<number>(bins).fill(0);
	const span = max - min;
	for (const value of scores) {
		const bin = Math.min(bins - 1, Math.floor(((value - min) / span) * bins));
		histogram[bin] += 1;
	}
	const binMid = (bin: number) => min + ((bin + 0.5) / bins) * span;

	const total = scores.length;
	let sumAll = 0;
	for (let bin = 0; bin < bins; bin += 1) sumAll += binMid(bin) * histogram[bin];

	let weightBackground = 0;
	let sumBackground = 0;
	let bestVariance = -1;
	let threshold = (min + max) / 2;
	for (let bin = 0; bin < bins; bin += 1) {
		weightBackground += histogram[bin];
		if (weightBackground === 0) continue;
		const weightForeground = total - weightBackground;
		if (weightForeground === 0) break;
		sumBackground += binMid(bin) * histogram[bin];
		const meanBackground = sumBackground / weightBackground;
		const meanForeground = (sumAll - sumBackground) / weightForeground;
		const between = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;
		if (between > bestVariance) {
			bestVariance = between;
			threshold = binMid(bin);
		}
	}
	return threshold;
}

function dilate(mask: boolean[], cols: number, rows: number): boolean[] {
	const out = new Array<boolean>(mask.length).fill(false);
	for (let y = 0; y < rows; y += 1) {
		for (let x = 0; x < cols; x += 1) {
			const i = y * cols + x;
			if (
				mask[i] ||
				(x > 0 && mask[i - 1]) ||
				(x < cols - 1 && mask[i + 1]) ||
				(y > 0 && mask[i - cols]) ||
				(y < rows - 1 && mask[i + cols])
			) {
				out[i] = true;
			}
		}
	}
	return out;
}

function erode(mask: boolean[], cols: number, rows: number): boolean[] {
	const out = new Array<boolean>(mask.length).fill(false);
	for (let y = 0; y < rows; y += 1) {
		for (let x = 0; x < cols; x += 1) {
			const i = y * cols + x;
			const keep =
				mask[i] &&
				(x === 0 || mask[i - 1]) &&
				(x === cols - 1 || mask[i + 1]) &&
				(y === 0 || mask[i - cols]) &&
				(y === rows - 1 || mask[i + cols]);
			out[i] = keep;
		}
	}
	return out;
}

function closeMask(mask: boolean[], cols: number, rows: number, iterations: number): boolean[] {
	let result = mask;
	for (let i = 0; i < iterations; i += 1) result = dilate(result, cols, rows);
	for (let i = 0; i < iterations; i += 1) result = erode(result, cols, rows);
	return result;
}

type CellRect = { x0: number; y0: number; x1: number; y1: number };

function filledCount(mask: boolean[], cols: number, rect: CellRect): number {
	let count = 0;
	for (let y = rect.y0; y <= rect.y1; y += 1) {
		for (let x = rect.x0; x <= rect.x1; x += 1) {
			if (mask[y * cols + x]) count += 1;
		}
	}
	return count;
}

/** Shrink a rect to the bounding box of its set cells. Null when the rect holds nothing. */
function trimToContent(mask: boolean[], cols: number, rect: CellRect): CellRect | null {
	let x0 = rect.x1;
	let x1 = rect.x0;
	let y0 = rect.y1;
	let y1 = rect.y0;
	let any = false;
	for (let y = rect.y0; y <= rect.y1; y += 1) {
		for (let x = rect.x0; x <= rect.x1; x += 1) {
			if (!mask[y * cols + x]) continue;
			any = true;
			if (x < x0) x0 = x;
			if (x > x1) x1 = x;
			if (y < y0) y0 = y;
			if (y > y1) y1 = y;
		}
	}
	return any ? { x0, y0, x1, y1 } : null;
}

/** Deepest interior valley in a projection profile (a gutter), and how deep it is (min/max). */
function deepestValley(profile: number[]): { index: number; ratio: number } | null {
	const length = profile.length;
	const margin = Math.max(1, Math.floor(length * SPLIT_MARGIN));
	if (length - margin <= margin) return null;
	let max = 0;
	for (const value of profile) if (value > max) max = value;
	if (max <= 0) return null;
	let minValue = Infinity;
	let minIndex = -1;
	for (let i = margin; i < length - margin; i += 1) {
		if (profile[i] < minValue) {
			minValue = profile[i];
			minIndex = i;
		}
	}
	return minIndex < 0 ? null : { index: minIndex, ratio: minValue / max };
}

/** Recursively cut a block at gutter valleys (XY-cut), collecting leaf rectangles. */
function xyCut(mask: boolean[], cols: number, rect: CellRect, depth: number, out: CellRect[]) {
	const trimmed = trimToContent(mask, cols, rect);
	if (!trimmed) return;
	const width = trimmed.x1 - trimmed.x0 + 1;
	const height = trimmed.y1 - trimmed.y0 + 1;
	if (depth >= MAX_CUT_DEPTH || (width < MIN_SPLIT_CELLS && height < MIN_SPLIT_CELLS)) {
		out.push(trimmed);
		return;
	}

	const colProfile = new Array<number>(width).fill(0);
	const rowProfile = new Array<number>(height).fill(0);
	for (let y = trimmed.y0; y <= trimmed.y1; y += 1) {
		for (let x = trimmed.x0; x <= trimmed.x1; x += 1) {
			if (!mask[y * cols + x]) continue;
			colProfile[x - trimmed.x0] += 1;
			rowProfile[y - trimmed.y0] += 1;
		}
	}

	const colValley = width >= MIN_SPLIT_CELLS ? deepestValley(colProfile) : null;
	const rowValley = height >= MIN_SPLIT_CELLS ? deepestValley(rowProfile) : null;
	const cutCol = colValley && colValley.ratio < SPLIT_RATIO ? colValley : null;
	const cutRow = rowValley && rowValley.ratio < SPLIT_RATIO ? rowValley : null;

	if (cutCol && (!cutRow || cutCol.ratio <= cutRow.ratio)) {
		const at = trimmed.x0 + cutCol.index;
		xyCut(mask, cols, { x0: trimmed.x0, y0: trimmed.y0, x1: at - 1, y1: trimmed.y1 }, depth + 1, out);
		xyCut(mask, cols, { x0: at + 1, y0: trimmed.y0, x1: trimmed.x1, y1: trimmed.y1 }, depth + 1, out);
	} else if (cutRow) {
		const at = trimmed.y0 + cutRow.index;
		xyCut(mask, cols, { x0: trimmed.x0, y0: trimmed.y0, x1: trimmed.x1, y1: at - 1 }, depth + 1, out);
		xyCut(mask, cols, { x0: trimmed.x0, y0: at + 1, x1: trimmed.x1, y1: trimmed.y1 }, depth + 1, out);
	} else {
		out.push(trimmed);
	}
}

/** Pure core: threshold the busyness grid, then XY-cut it into tile rectangles. Unit-tested. */
export function computeRegionsFromScoreGrid(
	scores: number[],
	cols: number,
	rows: number,
	threshold: number,
	options: RegionFilterOptions = DEFAULT_REGION_FILTER,
): Rect[] {
	if (cols <= 0 || rows <= 0 || scores.length < cols * rows) return [];
	const mask = closeMask(
		scores.map((value) => value > threshold),
		cols,
		rows,
		options.closeIterations,
	);
	const leaves: CellRect[] = [];
	xyCut(mask, cols, { x0: 0, y0: 0, x1: cols - 1, y1: rows - 1 }, 0, leaves);

	const regions: (Rect & { area: number })[] = [];
	for (const leaf of leaves) {
		const boxCols = leaf.x1 - leaf.x0 + 1;
		const boxRows = leaf.y1 - leaf.y0 + 1;
		const areaFraction = (boxCols / cols) * (boxRows / rows);
		const fill = filledCount(mask, cols, leaf) / (boxCols * boxRows);
		const aspect = boxCols / boxRows;
		if (areaFraction < options.minAreaFraction || areaFraction > options.maxAreaFraction) continue;
		if (fill < options.minFill || aspect < 0.2 || aspect > 6) continue;
		regions.push({ x: leaf.x0 / cols, y: leaf.y0 / rows, width: boxCols / cols, height: boxRows / rows, area: areaFraction });
	}

	return regions
		.sort((a, b) => b.area - a.area)
		.slice(0, options.maxRegions)
		.map(({ x, y, width, height }) => ({ x, y, width, height }));
}

function loadImage(dataUrl: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("Could not load frame for region detection."));
		image.src = dataUrl;
	});
}

async function scoreGridFromFrame(dataUrl: string): Promise<{ scores: number[]; cols: number; rows: number } | null> {
	if (typeof document === "undefined") return null;
	const image = await loadImage(dataUrl);
	const width = DOWNSCALE_WIDTH;
	const height = Math.max(1, Math.round((image.naturalHeight / image.naturalWidth) * width));
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (!context) return null;
	context.drawImage(image, 0, 0, width, height);
	const { data } = context.getImageData(0, 0, width, height);

	const cols = Math.floor(width / CELL);
	const rows = Math.floor(height / CELL);
	const scores = new Array<number>(cols * rows).fill(0);

	for (let cy = 0; cy < rows; cy += 1) {
		for (let cx = 0; cx < cols; cx += 1) {
			let lumSum = 0;
			let lumSqSum = 0;
			let satSum = 0;
			let satSqSum = 0;
			let n = 0;
			for (let py = cy * CELL; py < (cy + 1) * CELL; py += 2) {
				for (let px = cx * CELL; px < (cx + 1) * CELL; px += 2) {
					const i = (py * width + px) * 4;
					const r = data[i];
					const g = data[i + 1];
					const b = data[i + 2];
					const lum = 0.299 * r + 0.587 * g + 0.114 * b;
					const max = Math.max(r, g, b);
					const min = Math.min(r, g, b);
					const sat = max === 0 ? 0 : ((max - min) / max) * 255;
					lumSum += lum;
					lumSqSum += lum * lum;
					satSum += sat;
					satSqSum += sat * sat;
					n += 1;
				}
			}
			if (n === 0) continue;
			const lumVar = lumSqSum / n - (lumSum / n) ** 2;
			const satVar = satSqSum / n - (satSum / n) ** 2;
			const satMean = satSum / n;
			// Mean saturation lets smooth-but-colorful photo areas (sky, skin) count as content, not just
			// high-variance edges — so a whole thumbnail reads as busy instead of just its detailed parts.
			scores[cy * cols + cx] = lumVar + 2 * satVar + 25 * satMean;
		}
	}
	return { scores, cols, rows };
}

export type RegionStats = {
	scoreMax: number;
	scoreMean: number;
	otsu: number;
	threshold: number;
	cellsAbove: number;
	cells: number;
	regions: number;
};

export async function detectContentRegionsDebug(
	dataUrl: string,
	options: RegionFilterOptions = DEFAULT_REGION_FILTER,
): Promise<{ candidates: GroundingCandidate[]; stats: RegionStats | null }> {
	try {
		const grid = await scoreGridFromFrame(dataUrl);
		if (!grid) return { candidates: [], stats: null };
		const otsu = otsuThreshold(grid.scores);
		const threshold = Math.max(otsu * REGION_OTSU_FACTOR, REGION_SCORE_FLOOR);
		const rects = computeRegionsFromScoreGrid(grid.scores, grid.cols, grid.rows, threshold, options);
		const candidates: GroundingCandidate[] = rects.map((rect, index) => ({
			id: `r${index + 1}`,
			text: "",
			role: "region",
			source: "region",
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height,
		}));
		const scoreMax = grid.scores.reduce((a, b) => Math.max(a, b), 0);
		const scoreMean = grid.scores.reduce((a, b) => a + b, 0) / grid.scores.length;
		const stats: RegionStats = {
			scoreMax: Math.round(scoreMax),
			scoreMean: Math.round(scoreMean),
			otsu: Math.round(otsu),
			threshold: Math.round(threshold),
			cellsAbove: grid.scores.filter((value) => value > threshold).length,
			cells: grid.scores.length,
			regions: candidates.length,
		};
		return { candidates, stats };
	} catch {
		return { candidates: [], stats: null };
	}
}

export async function detectContentRegions(
	dataUrl: string,
	options: RegionFilterOptions = DEFAULT_REGION_FILTER,
): Promise<GroundingCandidate[]> {
	return (await detectContentRegionsDebug(dataUrl, options)).candidates;
}
