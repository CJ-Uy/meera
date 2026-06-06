import { describe, expect, it } from "vitest";
import { initialOverlayState, overlayReducer } from "@/features/overlay/overlay-reducer";

describe("overlay reducer", () => {
	it("moves and hides the reusable AI cursor", () => {
		const moved = overlayReducer(initialOverlayState, {
			type: "cursor.move",
			target: { x: 0.7, y: 0.3 },
			animationMs: 800,
		});
		expect(moved.cursor).toMatchObject({ visible: true, target: { x: 0.7, y: 0.3 }, animationMs: 800 });
		expect(overlayReducer(moved, { type: "cursor.hide" }).cursor).toEqual({ visible: false });
	});

	it("adds, removes, and clears annotations", () => {
		const withBubble = overlayReducer(initialOverlayState, {
			type: "bubble.show",
			id: "step-one",
			target: { x: 0.4, y: 0.2 },
			message: "Open settings",
		});
		expect(withBubble.annotations["step-one"]).toMatchObject({ type: "bubble.show", message: "Open settings" });

		const removed = overlayReducer(withBubble, { type: "overlay.remove", id: "step-one" });
		expect(removed.annotations).toEqual({});
		expect(overlayReducer(withBubble, { type: "overlay.clear" })).toEqual(initialOverlayState);
	});
});
