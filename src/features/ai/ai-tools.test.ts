import { describe, expect, it } from "vitest";
import { toolCallToOverlayCommand } from "@/features/ai/ai-tools";

describe("AI overlay tool adapter", () => {
	it("converts and clamps AI tool arguments into validated overlay commands", () => {
		expect(
			toolCallToOverlayCommand({
				function: { name: "overlay_move_cursor", arguments: { x: 1.4, y: -0.2, label: "Guide" } },
			}),
		).toMatchObject({ type: "cursor.move", target: { x: 1, y: 0 }, label: "Guide" });

		const highlight = toolCallToOverlayCommand({
			function: { name: "overlay_show_highlight", arguments: { id: "target", x: 0.8, y: 0.9, width: 0.6, height: 0.4 } },
		});
		expect(highlight).toMatchObject({ type: "highlight.show", id: "target", rect: { x: 0.8, y: 0.9 } });
		expect(highlight?.type === "highlight.show" ? highlight.rect.width : 0).toBeCloseTo(0.2);
		expect(highlight?.type === "highlight.show" ? highlight.rect.height : 0).toBeCloseTo(0.1);
	});

	it("supports every overlay command type exposed to Ollama", () => {
		const calls = [
			{ function: { name: "overlay_move_cursor", arguments: { x: 0.5, y: 0.5 } } },
			{ function: { name: "overlay_hide_cursor", arguments: {} } },
			{ function: { name: "overlay_show_arrow", arguments: { x: 0.5, y: 0.5 } } },
			{ function: { name: "overlay_show_highlight", arguments: { x: 0.2, y: 0.2, width: 0.4, height: 0.3 } } },
			{ function: { name: "overlay_show_bubble", arguments: { x: 0.5, y: 0.5, message: "Look here" } } },
			{ function: { name: "overlay_remove", arguments: { id: "target" } } },
			{ function: { name: "overlay_clear", arguments: {} } },
		];
		expect(calls.map(toolCallToOverlayCommand).map((command) => command?.type)).toEqual([
			"cursor.move",
			"cursor.hide",
			"arrow.show",
			"highlight.show",
			"bubble.show",
			"overlay.remove",
			"overlay.clear",
		]);
	});

	it("rejects unknown tool names", () => {
		expect(toolCallToOverlayCommand({ function: { name: "run_shell", arguments: {} } })).toBeNull();
	});
});
