import { describe, expect, it } from "vitest";
import { recoverOverlayToolCallsFromText, toolCallToOverlayCommand } from "@/features/ai/ai-tools";

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

	it("recovers coordinate-style overlay text into an arrow tool call", () => {
		const calls = recoverOverlayToolCallsFromText({
			prompt: "Overlay something random on my YouTube screen.",
			content: `I'll randomly pick the "HUGE SMASH!" video.

Coordinates: x=0.7, y=0.25
Arrow points directly to the thumbnail.`,
		});

		expect(calls[0]).toMatchObject({
			function: { name: "overlay_show_arrow", arguments: { x: 0.7, y: 0.25 } },
		});
		expect(toolCallToOverlayCommand(calls[0])?.type).toBe("arrow.show");
	});

	it("recovers the overlay demo request without model-native tool calls", () => {
		const calls = recoverOverlayToolCallsFromText({
			prompt: "Show every overlay type so I can test them.",
			content: "Here are the overlay types.",
		});

		expect(calls.map((call) => call.function?.name)).toEqual([
			"overlay_move_cursor",
			"overlay_show_arrow",
			"overlay_show_highlight",
			"overlay_show_bubble",
		]);
	});

	it("does not recover overlay tools for ordinary text chat", () => {
		expect(
			recoverOverlayToolCallsFromText({
				prompt: "Summarize what Meera can do.",
				content: "Meera can triage support requests and prepare tickets.",
			}),
		).toEqual([]);
	});

	it("does not draw overlays for ordinary coordinate descriptions", () => {
		expect(
			recoverOverlayToolCallsFromText({
				prompt: "What is on my screen?",
				content: "The arrow icon appears near Coordinates: x=0.7, y=0.25.",
			}),
		).toEqual([]);
	});
});
