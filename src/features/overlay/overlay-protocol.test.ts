import { describe, expect, it } from "vitest";
import { isOverlayCommand, normalizePoint, normalizeRect } from "@/features/overlay/overlay-protocol";

describe("overlay protocol", () => {
	it("normalizes points and rectangles to the visible display", () => {
		expect(normalizePoint({ x: -0.2, y: 1.4 })).toEqual({ x: 0, y: 1 });
		const rect = normalizeRect({ x: 0.8, y: 0.9, width: 0.5, height: 0.5 });
		expect(rect.x).toBe(0.8);
		expect(rect.y).toBe(0.9);
		expect(rect.width).toBeCloseTo(0.2);
		expect(rect.height).toBeCloseTo(0.1);
	});

	it("accepts valid commands and rejects malformed coordinates", () => {
		expect(isOverlayCommand({ type: "cursor.move", target: { x: 0.5, y: 0.4 } })).toBe(true);
		expect(
			isOverlayCommand({
				type: "bubble.show",
				id: "message",
				target: { x: 0.5, y: 0.4 },
				message: "Click here",
			}),
		).toBe(true);
		expect(isOverlayCommand({ type: "cursor.move", target: { x: 4, y: 0.4 } })).toBe(false);
		expect(isOverlayCommand({ type: "bubble.show", id: "", target: { x: 0.5, y: 0.4 } })).toBe(false);
		expect(isOverlayCommand({ type: "cursor.move", target: { x: 0.5, y: 0.4 }, animationMs: -1 })).toBe(false);
		expect(
			isOverlayCommand({
				type: "bubble.show",
				id: "message",
				target: { x: 0.5, y: 0.4 },
				message: "",
			}),
		).toBe(false);
	});
});
