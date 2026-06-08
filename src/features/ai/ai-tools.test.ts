import { describe, expect, it } from "vitest";
import {
	normalizeOverlayToolCalls,
	reconcileOverlayToolCalls,
	recoverOverlayToolCallsFromText,
	toolCallToOverlayCommand,
} from "@/features/ai/ai-tools";

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

	it("supports every overlay command type exposed to AI providers", () => {
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

	it("rejects positioned overlays that do not include a real target", () => {
		expect(toolCallToOverlayCommand({ function: { name: "overlay_show_arrow", arguments: { message: "No target" } } })).toBeNull();
		expect(toolCallToOverlayCommand({ function: { name: "overlay_show_highlight", arguments: { width: 0.2, height: 0.2 } } })).toBeNull();
	});

	it("allows unanchored text bubbles without falling back to center", () => {
		expect(
			toolCallToOverlayCommand({
				function: { name: "overlay_show_bubble", arguments: { message: "Hello from Meera" } },
			}),
		).toMatchObject({ type: "bubble.show", target: { x: 0.5, y: 0.82 }, message: "Hello from Meera", placement: "top" });
	});

	it("normalizes model pixel coordinates into overlay coordinates", () => {
		const command = toolCallToOverlayCommand({
			function: {
				name: "overlay_show_arrow",
				arguments: { x: 1344, y: 225, coordinateSpace: "image_pixels", imageWidth: 1920, imageHeight: 900 },
			},
		});

		expect(command).toMatchObject({ type: "arrow.show", target: { x: 0.7, y: 0.25 } });
	});

	it("normalizes Qwen relative 0-1000 coordinates instead of treating them as image pixels", () => {
		const [implicitCall, explicitCall, topLeftCall] = normalizeOverlayToolCalls(
			[
				{ function: { name: "overlay_show_arrow", arguments: { x: 700, y: 250 } } },
				{ function: { name: "overlay_move_cursor", arguments: { x: 700, y: 250, coordinateSpace: "relative_1000" } } },
				{ function: { name: "overlay_show_arrow", arguments: { x: 70, y: 25 } } },
			],
			{ imageWidth: 1440, imageHeight: 810 },
		);

		expect(toolCallToOverlayCommand(implicitCall)).toMatchObject({ type: "arrow.show", target: { x: 0.7, y: 0.25 } });
		expect(toolCallToOverlayCommand(explicitCall)).toMatchObject({ type: "cursor.move", target: { x: 0.7, y: 0.25 } });
		expect(toolCallToOverlayCommand(topLeftCall)).toMatchObject({ type: "arrow.show", target: { x: 0.07, y: 0.025 } });
	});

	it("still supports explicit and percent-suffixed percentage coordinates", () => {
		const [explicitCall, suffixedCall] = normalizeOverlayToolCalls([
			{ function: { name: "overlay_show_arrow", arguments: { x: 70, y: 25, coordinateSpace: "percent" } } },
			{ function: { name: "overlay_move_cursor", arguments: { x: "70%", y: "25%" } } },
		]);

		expect(toolCallToOverlayCommand(explicitCall)).toMatchObject({ type: "arrow.show", target: { x: 0.7, y: 0.25 } });
		expect(toolCallToOverlayCommand(suffixedCall)).toMatchObject({ type: "cursor.move", target: { x: 0.7, y: 0.25 } });
	});

	it("infers image pixels for the whole coordinate pair when one axis exceeds 1000", () => {
		const [call] = normalizeOverlayToolCalls(
			[{ function: { name: "overlay_show_arrow", arguments: { x: 1344, y: 225 } } }],
			{ imageWidth: 1920, imageHeight: 900 },
		);

		expect(toolCallToOverlayCommand(call)).toMatchObject({ type: "arrow.show", target: { x: 0.7, y: 0.25 } });
	});

	it("normalizes highlight center pixels into top-left overlay rectangles", () => {
		const [call] = normalizeOverlayToolCalls(
			[
				{
					function: {
						name: "overlay_show_highlight",
						arguments: { centerX: 960, centerY: 450, width: 384, height: 180, coordinateSpace: "image_pixels" },
					},
				},
			],
			{ imageWidth: 1920, imageHeight: 900 },
		);
		const command = toolCallToOverlayCommand(call);

		expect(command).toMatchObject({ type: "highlight.show", rect: { x: 0.4, y: 0.4, width: 0.2, height: 0.2 } });
	});

	it("applies an explicit coordinate space to small highlight dimensions", () => {
		const [call] = normalizeOverlayToolCalls(
			[
				{
					function: {
						name: "overlay_show_highlight",
						arguments: { x: 700, y: 250, width: 1, height: 10, coordinateSpace: "relative_1000" },
					},
				},
			],
			{ imageWidth: 1920, imageHeight: 900 },
		);

		expect(toolCallToOverlayCommand(call)).toMatchObject({
			type: "highlight.show",
			rect: { x: 0.7, y: 0.25, width: 0.001, height: 0.01 },
		});
	});

	it("normalizes visible grid cells into overlay coordinates", () => {
		const arrow = toolCallToOverlayCommand({
			function: {
				name: "overlay_show_arrow",
				arguments: { gridCell: "J2", gridColumns: 12, gridRows: 8 },
			},
		});
		const highlight = toolCallToOverlayCommand({
			function: {
				name: "overlay_show_highlight",
				arguments: { gridColumn: "J", gridRow: 2, gridColumns: 12, gridRows: 8 },
			},
		});

		expect(arrow).toMatchObject({ type: "arrow.show", target: { x: 0.7916666666666666, y: 0.1875 } });
		expect(highlight).toMatchObject({
			type: "highlight.show",
			rect: { x: 0.75, y: 0.125, width: 0.08333333333333333, height: 0.125 },
		});
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

	it("recovers pixel coordinate text against the captured screen frame", () => {
		const calls = recoverOverlayToolCallsFromText({
			prompt: "Overlay an arrow on the video.",
			content: "Coordinates: x=1344, y=225. Arrow points to the thumbnail.",
			context: { imageWidth: 1920, imageHeight: 900 },
		});

		expect(calls[0]).toMatchObject({
			function: { name: "overlay_show_arrow", arguments: { x: 0.7, y: 0.25 } },
		});
	});

	it("recovers visible grid cell text into overlay coordinates", () => {
		const calls = recoverOverlayToolCallsFromText({
			prompt: "Overlay an arrow on the selected YouTube video.",
			content: "The target is in grid cell J2.",
			context: { imageWidth: 1440, imageHeight: 810, gridColumns: 12, gridRows: 8 },
		});

		expect(calls[0]).toMatchObject({
			function: { name: "overlay_show_arrow", arguments: { x: 0.7916666666666666, y: 0.1875 } },
		});
	});

	it("recovers text overlay requests as bubbles instead of arrows", () => {
		const calls = recoverOverlayToolCallsFromText({
			prompt: 'Show a text overlay that says "Focus here".',
			content: "I will add a text overlay.",
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({
			function: { name: "overlay_show_bubble", arguments: { x: 0.5, y: 0.82, message: "Focus here", placement: "top" } },
		});
	});

	it("reconciles an incorrect native arrow with an explicitly requested box", () => {
		const calls = reconcileOverlayToolCalls({
			prompt: "Show a box around the video.",
			content: "",
			context: { imageWidth: 1440, imageHeight: 810 },
			toolCalls: [{ function: { name: "overlay_show_arrow", arguments: { x: 700, y: 250 } } }],
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]?.function?.name).toBe("overlay_show_highlight");
		expect(toolCallToOverlayCommand(calls[0])).toMatchObject({
			type: "highlight.show",
			rect: { x: 0.59, y: 0.16999999999999998, width: 0.22, height: 0.16 },
		});
	});

	it("does not treat target-shape descriptions as highlight requests", () => {
		const calls = reconcileOverlayToolCalls({
			prompt: "Move the cursor to the center of the black rectangle.",
			content: "",
			context: { imageWidth: 320, imageHeight: 200 },
			toolCalls: [
				{
					function: {
						name: "overlay_move_cursor",
						arguments: { x: 250, y: 100, coordinateSpace: "image_pixels", imageWidth: 320, imageHeight: 200 },
					},
				},
			],
		});

		expect(calls).toHaveLength(1);
		expect(calls[0]?.function?.name).toBe("overlay_move_cursor");
		expect(toolCallToOverlayCommand(calls[0])).toMatchObject({ type: "cursor.move", target: { x: 0.78125, y: 0.5 } });
	});

	it("reconciles an incorrect native arrow with explicitly requested text", () => {
		const calls = reconcileOverlayToolCalls({
			prompt: 'Show a text overlay that says "Watch this".',
			content: "",
			toolCalls: [{ function: { name: "overlay_show_arrow", arguments: { x: 800, y: 300 } } }],
		});

		expect(calls).toHaveLength(1);
		expect(toolCallToOverlayCommand(calls[0])).toMatchObject({
			type: "bubble.show",
			target: { x: 0.8, y: 0.3 },
			message: "Watch this",
		});
	});

	it("guarantees every overlay primitive for the overlay demo request", () => {
		const calls = reconcileOverlayToolCalls({
			prompt: "Show every overlay type so I can test them.",
			content: "",
			toolCalls: [{ function: { name: "overlay_show_arrow", arguments: { x: 0.5, y: 0.5 } } }],
		});

		expect(calls.map((call) => call.function?.name)).toEqual([
			"overlay_move_cursor",
			"overlay_show_arrow",
			"overlay_show_highlight",
			"overlay_show_bubble",
		]);
	});

	it("does not invent center arrows when no overlay target is available", () => {
		expect(
			recoverOverlayToolCallsFromText({
				prompt: "Put an arrow on the thing I mean.",
				content: "I can see the screen, but I did not identify a target.",
			}),
		).toEqual([]);
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

	it("recovers a screen-aware recommendation as an arrow when the model writes coordinates", () => {
		const calls = recoverOverlayToolCallsFromText({
			prompt: "Suggest a random YouTube video.",
			content: "I recommend the top-right video. Coordinates: x=700, y=250.",
		});

		expect(calls[0]).toMatchObject({
			function: { name: "overlay_show_arrow", arguments: { x: 0.7, y: 0.25 } },
		});
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
