import { describe, expect, it } from "vitest";
import { createGuidedOverlayDemo } from "@/features/overlay/overlay-demo";

describe("guided overlay demo", () => {
	it("exercises every user-facing overlay primitive", () => {
		const commandTypes = new Set(createGuidedOverlayDemo().map((step) => step.command.type));
		expect(commandTypes).toEqual(
			new Set(["overlay.clear", "cursor.move", "cursor.hide", "arrow.show", "highlight.show", "bubble.show"]),
		);
	});
});
