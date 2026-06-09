import { describe, expect, it, vi } from "vitest";
import type { AiImageAttachment, AiToolCall } from "@/features/ai/ai-types";
import {
	cropRegionForTarget,
	mapCropPointToFull,
	mapCropRectToFull,
	refineOverlayToolCalls,
	shouldRefineTarget,
	targetOfToolCall,
	type RefineDeps,
} from "@/features/ai/visual-grounding";

function arrow(x: number, y: number): AiToolCall {
	return { function: { name: "overlay_show_arrow", arguments: { x, y } } };
}

function highlight(x: number, y: number, width: number, height: number): AiToolCall {
	return { function: { name: "overlay_show_highlight", arguments: { x, y, width, height } } };
}

const screenFrame: AiImageAttachment = {
	id: "frame",
	name: "desktop.jpg",
	mimeType: "image/jpeg",
	dataUrl: "data:image/jpeg;base64,AAAA",
	source: "screen",
	width: 1920,
	height: 1080,
};

describe("visual grounding targets", () => {
	it("reads a point from arrow/cursor/bubble calls", () => {
		expect(targetOfToolCall(arrow(0.7, 0.25))).toEqual({ kind: "point", x: 0.7, y: 0.25 });
	});

	it("reads a rect from a highlight with size, and a point when size is missing", () => {
		expect(targetOfToolCall(highlight(0.2, 0.3, 0.4, 0.5))).toEqual({ kind: "rect", x: 0.2, y: 0.3, width: 0.4, height: 0.5 });
		expect(targetOfToolCall({ function: { name: "overlay_show_highlight", arguments: { x: 0.2, y: 0.3 } } })).toEqual({
			kind: "point",
			x: 0.2,
			y: 0.3,
		});
	});

	it("ignores non-visual or coordinate-less calls", () => {
		expect(targetOfToolCall({ function: { name: "overlay_clear", arguments: {} } })).toBeNull();
		expect(targetOfToolCall({ function: { name: "overlay_show_arrow", arguments: { message: "hi" } } })).toBeNull();
	});
});

describe("crop region math", () => {
	it("centers a square (screen-aspect-preserving) crop on a point", () => {
		const region = cropRegionForTarget({ kind: "point", x: 0.5, y: 0.5 });
		expect(region.x).toBeCloseTo(0.29);
		expect(region.y).toBeCloseTo(0.29);
		expect(region.width).toBeCloseTo(0.42);
		expect(region.height).toBeCloseTo(0.42);
	});

	it("slides the crop inward at the edges so it stays fully on-screen", () => {
		const region = cropRegionForTarget({ kind: "point", x: 0.98, y: 0.02 });
		expect(region.x).toBeCloseTo(0.58);
		expect(region.y).toBeCloseTo(0);
		expect(region.width).toBeCloseTo(0.42);
	});

	it("grows the crop around a rect with padding, clamped to a minimum", () => {
		const region = cropRegionForTarget({ kind: "rect", x: 0.45, y: 0.45, width: 0.1, height: 0.1 });
		expect(region.width).toBeCloseTo(0.22); // 0.1 * (1 + 2*0.6) = 0.22
	});

	it("maps crop-space coordinates back to the full frame", () => {
		const region = { x: 0.5, y: 0.1, width: 0.34, height: 0.34 };
		expect(mapCropPointToFull({ x: 0.5, y: 0.5 }, region)).toMatchObject({ x: 0.67, y: 0.27 });
		const rect = mapCropRectToFull({ x: 0, y: 0, width: 0.5, height: 0.5 }, region);
		expect(rect.width).toBeCloseTo(0.17);
		expect(rect.height).toBeCloseTo(0.17);
	});

	it("only refines targets small enough to benefit from zooming", () => {
		expect(shouldRefineTarget({ kind: "point", x: 0.5, y: 0.5 })).toBe(true);
		expect(shouldRefineTarget({ kind: "rect", x: 0.1, y: 0.1, width: 0.2, height: 0.2 })).toBe(true);
		expect(shouldRefineTarget({ kind: "rect", x: 0, y: 0, width: 0.9, height: 0.8 })).toBe(false);
	});
});

describe("refineOverlayToolCalls", () => {
	const passthroughCrop: RefineDeps["cropFrame"] = async (frame) => frame;

	it("moves the overlay to the refined location mapped back to the full frame", async () => {
		const deps: RefineDeps = {
			cropFrame: passthroughCrop,
			requestRefine: vi.fn().mockResolvedValue([arrow(0.25, 0.75)]),
		};
		const [call] = await refineOverlayToolCalls({
			toolCalls: [arrow(0.7, 0.25)],
			frame: screenFrame,
			prompt: "point to the terminal",
			deps,
		});
		// region for point(0.7,0.25): x=0.49,y=0.04,size=0.42 -> 0.49+0.25*0.42, 0.04+0.75*0.42
		const args = call.function?.arguments as { x: number; y: number };
		expect(args.x).toBeCloseTo(0.595);
		expect(args.y).toBeCloseTo(0.355);
		expect(deps.requestRefine).toHaveBeenCalledOnce();
	});

	it("keeps the first guess when the refine pass finds nothing", async () => {
		const result = await refineOverlayToolCalls({
			toolCalls: [arrow(0.7, 0.25)],
			frame: screenFrame,
			prompt: "point to the terminal",
			deps: { cropFrame: passthroughCrop, requestRefine: vi.fn().mockResolvedValue([]) },
		});
		expect(result[0].function?.arguments).toMatchObject({ x: 0.7, y: 0.25 });
	});

	it("keeps the first guess when cropping fails", async () => {
		const result = await refineOverlayToolCalls({
			toolCalls: [arrow(0.7, 0.25)],
			frame: screenFrame,
			prompt: "point to the terminal",
			deps: {
				cropFrame: vi.fn().mockRejectedValue(new Error("no canvas")),
				requestRefine: vi.fn().mockResolvedValue([arrow(0.5, 0.5)]),
			},
		});
		expect(result[0].function?.arguments).toMatchObject({ x: 0.7, y: 0.25 });
	});

	it("refines a highlight box and maps it back to the full frame", async () => {
		const [call] = await refineOverlayToolCalls({
			toolCalls: [highlight(0.4, 0.4, 0.2, 0.2)],
			frame: screenFrame,
			prompt: "highlight where I can see my changes",
			deps: { cropFrame: passthroughCrop, requestRefine: vi.fn().mockResolvedValue([highlight(0.1, 0.1, 0.5, 0.5)]) },
		});
		expect(call.function?.name).toBe("overlay_show_highlight");
		const args = call.function?.arguments as { width: number; height: number };
		expect(args.width).toBeGreaterThan(0);
		expect(args.height).toBeGreaterThan(0);
	});

	it("does not refine multi-overlay demos or non-screen frames", async () => {
		const deps: RefineDeps = { cropFrame: vi.fn(), requestRefine: vi.fn() };
		const demo = [arrow(0.2, 0.2), highlight(0.5, 0.5, 0.2, 0.2)];
		await expect(refineOverlayToolCalls({ toolCalls: demo, frame: screenFrame, prompt: "show every overlay", deps })).resolves.toBe(demo);

		const upload = { ...screenFrame, source: "upload" as const };
		const single = [arrow(0.7, 0.25)];
		await expect(refineOverlayToolCalls({ toolCalls: single, frame: upload, prompt: "point", deps })).resolves.toBe(single);
		expect(deps.requestRefine).not.toHaveBeenCalled();
	});

	it("is a no-op when disabled", async () => {
		const single = [arrow(0.7, 0.25)];
		const deps: RefineDeps = { cropFrame: vi.fn(), requestRefine: vi.fn() };
		await expect(
			refineOverlayToolCalls({ toolCalls: single, frame: screenFrame, prompt: "point", deps, enabled: false }),
		).resolves.toBe(single);
		expect(deps.requestRefine).not.toHaveBeenCalled();
	});
});
