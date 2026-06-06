import type { OverlaySequenceStep } from "@/features/overlay/overlay-protocol";

export function createGuidedOverlayDemo(displayId: "primary" | "all" = "primary"): OverlaySequenceStep[] {
	return [
		{ afterMs: 0, command: { type: "overlay.clear", displayId } },
		{
			afterMs: 150,
			command: {
				type: "bubble.show",
				id: "demo-welcome",
				displayId,
				target: { x: 0.2, y: 0.18 },
				message: "I can guide you directly on your screen.",
				placement: "bottom",
				ttlMs: 3600,
			},
		},
		{
			afterMs: 250,
			command: {
				type: "cursor.move",
				displayId,
				target: { x: 0.22, y: 0.26 },
				animationMs: 450,
				label: "Meera",
			},
		},
		{
			afterMs: 1150,
			command: {
				type: "cursor.move",
				displayId,
				target: { x: 0.76, y: 0.3 },
				animationMs: 1000,
				label: "Meera",
			},
		},
		{
			afterMs: 2250,
			command: {
				type: "arrow.show",
				id: "demo-arrow",
				displayId,
				target: { x: 0.76, y: 0.3 },
				direction: "left",
				message: "Click here next",
				ttlMs: 3200,
			},
		},
		{
			afterMs: 3500,
			command: {
				type: "highlight.show",
				id: "demo-highlight",
				displayId,
				rect: { x: 0.57, y: 0.62, width: 0.28, height: 0.2 },
				message: "This area needs your attention",
				ttlMs: 3400,
			},
		},
		{
			afterMs: 3650,
			command: {
				type: "cursor.move",
				displayId,
				target: { x: 0.7, y: 0.72 },
				animationMs: 900,
				label: "Meera",
			},
		},
		{
			afterMs: 5000,
			command: {
				type: "bubble.show",
				id: "demo-finish",
				displayId,
				target: { x: 0.7, y: 0.58 },
				message: "Great. The future AI can issue these same commands.",
				placement: "top",
				ttlMs: 3500,
			},
		},
		{ afterMs: 7800, command: { type: "cursor.hide", displayId } },
	];
}
