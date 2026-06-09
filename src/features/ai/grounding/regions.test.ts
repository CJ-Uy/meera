import { describe, expect, it } from "vitest";
import { computeRegionsFromScoreGrid, DEFAULT_REGION_FILTER, otsuThreshold } from "@/features/ai/grounding/regions";

// Build a cols x rows score grid with a high-score rectangle painted into it.
function gridWithBlock(cols: number, rows: number, block: { x0: number; y0: number; x1: number; y1: number }, hi = 1000) {
	const scores = new Array<number>(cols * rows).fill(0);
	for (let y = block.y0; y < block.y1; y += 1) {
		for (let x = block.x0; x < block.x1; x += 1) {
			scores[y * cols + x] = hi;
		}
	}
	return scores;
}

describe("otsuThreshold", () => {
	it("splits a clearly bimodal distribution between the two clusters", () => {
		const scores = [0, 0, 0, 0, 1000, 1000, 1000, 1000];
		const threshold = otsuThreshold(scores);
		expect(threshold).toBeGreaterThan(0);
		expect(threshold).toBeLessThan(1000);
	});

	it("handles a flat grid without throwing", () => {
		expect(otsuThreshold([5, 5, 5, 5])).toBe(5);
	});
});

describe("computeRegionsFromScoreGrid", () => {
	it("finds a large solid busy block as one region", () => {
		const cols = 40;
		const rows = 30;
		const scores = gridWithBlock(cols, rows, { x0: 10, y0: 6, x1: 30, y1: 20 });
		const regions = computeRegionsFromScoreGrid(scores, cols, rows, 500, DEFAULT_REGION_FILTER);
		expect(regions).toHaveLength(1);
		expect(regions[0].x).toBeCloseTo(10 / 40, 5);
		expect(regions[0].y).toBeCloseTo(6 / 30, 5);
		expect(regions[0].width).toBeCloseTo(20 / 40, 5);
		expect(regions[0].height).toBeCloseTo(14 / 30, 5);
	});

	it("ignores tiny specks below the minimum area", () => {
		const cols = 40;
		const rows = 30;
		const scores = gridWithBlock(cols, rows, { x0: 1, y0: 1, x1: 3, y1: 2 });
		expect(computeRegionsFromScoreGrid(scores, cols, rows, 500, DEFAULT_REGION_FILTER)).toHaveLength(0);
	});

	it("separates two blocks split by a wide gutter", () => {
		const cols = 40;
		const rows = 30;
		const left = gridWithBlock(cols, rows, { x0: 4, y0: 6, x1: 16, y1: 22 });
		const right = gridWithBlock(cols, rows, { x0: 24, y0: 6, x1: 36, y1: 22 });
		const scores = left.map((value, index) => Math.max(value, right[index]));
		const regions = computeRegionsFromScoreGrid(scores, cols, rows, 500, DEFAULT_REGION_FILTER);
		expect(regions).toHaveLength(2);
	});

	it("finds nothing when the threshold is above every score", () => {
		const cols = 40;
		const rows = 30;
		const scores = gridWithBlock(cols, rows, { x0: 10, y0: 6, x1: 30, y1: 20 }, 100);
		expect(computeRegionsFromScoreGrid(scores, cols, rows, 500, DEFAULT_REGION_FILTER)).toHaveLength(0);
	});
});
