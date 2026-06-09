"use client";

import type { GroundingCandidate } from "@/features/ai/grounding/types";

/**
 * Content-region detection — finds large non-text rectangles (video thumbnails, photos, cards) that OCR
 * can't see, and adds them as overlay candidates. Without this, "highlight the thumbnail" has no target
 * and falls back to the vision model's blind guess.
 *
 * Heuristic (deterministic, no model): downscale the frame, score each grid cell by how "busy" it is
 * (luminance + saturation variance — photos score high, flat UI chrome scores low), threshold into a
 * mask, then take large, solid, rectangular connected components. Everything stays in image space, so a
 * region rect maps onto the overlay exactly like an OCR rect. The pure grid->regions step is unit-tested;
 * the canvas->grid step is verified visually with the in-app "Debug boxes" tool.
 */

export type RegionOptions = {
	/** Cell is "content" when its busyness score exceeds this. Lower = more regions. */
	threshold: number;
	/** Reject regions smaller than this fraction of the frame (drop icons/noise). */
	minAreaFraction: number;
	/** Reject regions larger than this fraction (drop full-window backgrounds). */
	maxAreaFraction: number;
	/** Reject sparse components — real tiles fill most of their bounding box. */
	minFill: number;
	/** Keep at most this many regions (largest first). */
	maxRegions: number;
};

export const DEFAULT_REGION_OPTIONS: RegionOptions = {
	threshold: 180,
	minAreaFraction: 0.02,
	maxAreaFraction: 0.6,
	minFill: 0.5,
	maxRegions: 12,
};

const DOWNSCALE_WIDTH = 480;
const CELL = 8;

type Rect = { x: number; y: number; width: number; height: number };

/** Pure core: turn a per-cell busyness grid into normalized region rects. Unit-tested. */
export function computeRegionsFromScoreGrid(scores: number[], cols: number, rows: number, options: RegionOptions): Rect[] {
	if (cols <= 0 || rows <= 0 || scores.length < cols * rows) return [];
	const mask = scores.map((value) => value > options.threshold);
	const visited = new Array<boolean>(cols * rows).fill(false);
	const regions: (Rect & { area: number })[] = [];

	for (let start = 0; start < cols * rows; start += 1) {
		if (!mask[start] || visited[start]) continue;
		// Flood-fill this connected component (4-connectivity).
		let minCx = cols;
		let maxCx = -1;
		let minCy = rows;
		let maxCy = -1;
		let count = 0;
		const stack = [start];
		visited[start] = true;
		while (stack.length) {
			const index = stack.pop() as number;
			const cx = index % cols;
			const cy = Math.floor(index / cols);
			count += 1;
			if (cx < minCx) minCx = cx;
			if (cx > maxCx) maxCx = cx;
			if (cy < minCy) minCy = cy;
			if (cy > maxCy) maxCy = cy;
			const neighbours = [
				cx > 0 ? index - 1 : -1,
				cx < cols - 1 ? index + 1 : -1,
				cy > 0 ? index - cols : -1,
				cy < rows - 1 ? index + cols : -1,
			];
			for (const neighbour of neighbours) {
				if (neighbour >= 0 && mask[neighbour] && !visited[neighbour]) {
					visited[neighbour] = true;
					stack.push(neighbour);
				}
			}
		}

		const boxCols = maxCx - minCx + 1;
		const boxRows = maxCy - minCy + 1;
		const areaFraction = (boxCols / cols) * (boxRows / rows);
		const fill = count / (boxCols * boxRows);
		const aspect = boxCols / boxRows;
		if (areaFraction < options.minAreaFraction || areaFraction > options.maxAreaFraction) continue;
		if (fill < options.minFill || aspect < 0.2 || aspect > 6) continue;
		regions.push({
			x: minCx / cols,
			y: minCy / rows,
			width: boxCols / cols,
			height: boxRows / rows,
			area: areaFraction,
		});
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

/** Build the busyness score grid from a frame. Returns null if canvas is unavailable. */
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
			scores[cy * cols + cx] = lumVar + 2 * satVar;
		}
	}
	return { scores, cols, rows };
}

export async function detectContentRegions(
	dataUrl: string,
	options: RegionOptions = DEFAULT_REGION_OPTIONS,
): Promise<GroundingCandidate[]> {
	try {
		const grid = await scoreGridFromFrame(dataUrl);
		if (!grid) return [];
		const rects = computeRegionsFromScoreGrid(grid.scores, grid.cols, grid.rows, options);
		return rects.map((rect, index) => ({
			id: `r${index + 1}`,
			text: "",
			role: "region",
			source: "region",
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height,
		}));
	} catch {
		return [];
	}
}
