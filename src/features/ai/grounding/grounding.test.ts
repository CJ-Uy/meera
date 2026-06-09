import { describe, expect, it } from "vitest";
import {
	buildCandidatesFromOcr,
	candidateToOverlayToolCall,
	positionLabel,
	renderCandidatesForPrompt,
} from "@/features/ai/grounding/candidates";
import { buildSelectionMessages, parseSelection, selectionToToolCalls } from "@/features/ai/grounding/select";
import type { GroundingCandidate, OcrWord } from "@/features/ai/grounding/types";

function word(text: string, x0: number, y0: number, x1: number, y1: number, confidence = 90): OcrWord {
	return { text, x0, y0, x1, y1, confidence };
}

const IMAGE = { imageWidth: 1000, imageHeight: 1000 };

describe("buildCandidatesFromOcr", () => {
	it("splits a row into separate candidates across wide gaps and merges close words", () => {
		const words = [
			word("File", 10, 10, 50, 30),
			word("Edit", 200, 10, 240, 30),
			word("Sign", 400, 100, 460, 120),
			word("in", 470, 100, 500, 120),
		];
		const candidates = buildCandidatesFromOcr(words, IMAGE);
		const texts = candidates.map((candidate) => candidate.text);
		expect(texts).toContain("File");
		expect(texts).toContain("Edit");
		expect(texts).toContain("Sign in");
		expect(texts).not.toContain("File Edit");
	});

	it("normalizes rects to image space and assigns ids in reading order", () => {
		const candidates = buildCandidatesFromOcr(
			[word("Sign", 400, 100, 460, 120), word("in", 470, 100, 500, 120), word("Top", 10, 10, 60, 30)],
			IMAGE,
		);
		expect(candidates[0]).toMatchObject({ id: "e1", text: "Top" });
		const signIn = candidates.find((candidate) => candidate.text === "Sign in");
		expect(signIn).toBeDefined();
		expect(signIn?.x).toBeCloseTo(0.4, 5);
		expect(signIn?.width).toBeCloseTo(0.1, 5);
		expect(signIn?.y).toBeCloseTo(0.1, 5);
	});

	it("drops low-confidence words and noise", () => {
		const candidates = buildCandidatesFromOcr(
			[word("Real", 10, 10, 90, 34, 95), word("ghost", 10, 100, 90, 124, 10), word("...", 10, 200, 90, 224, 95)],
			IMAGE,
		);
		const texts = candidates.map((candidate) => candidate.text);
		expect(texts).toEqual(["Real"]);
	});
});

describe("positionLabel", () => {
	it("labels quadrants and center", () => {
		expect(positionLabel(0.1, 0.1)).toBe("top-left");
		expect(positionLabel(0.5, 0.5)).toBe("center");
		expect(positionLabel(0.9, 0.9)).toBe("bottom-right");
		expect(positionLabel(0.5, 0.1)).toBe("top-center");
	});
});

describe("candidateToOverlayToolCall", () => {
	const candidate: GroundingCandidate = { id: "e1", text: "Save", role: "text", source: "ocr", x: 0.4, y: 0.1, width: 0.1, height: 0.02 };

	it("places an arrow at the candidate center in normalized space", () => {
		const call = candidateToOverlayToolCall(candidate, "arrow", "Click Save");
		expect(call.function?.name).toBe("overlay_show_arrow");
		const args = call.function?.arguments as Record<string, number | string>;
		expect(args.x).toBeCloseTo(0.45, 5);
		expect(args.y).toBeCloseTo(0.11, 5);
		expect(args.coordinateSpace).toBe("normalized");
	});

	it("frames a highlight with a small margin", () => {
		const call = candidateToOverlayToolCall(candidate, "highlight", "Here");
		expect(call.function?.name).toBe("overlay_show_highlight");
		const args = call.function?.arguments as Record<string, number>;
		expect(args.x).toBeLessThan(candidate.x);
		expect(args.width).toBeGreaterThan(candidate.width);
	});
});

describe("parseSelection + selectionToToolCalls", () => {
	const candidates: GroundingCandidate[] = [
		{ id: "e1", text: "File", role: "text", source: "ocr", x: 0.01, y: 0.01, width: 0.04, height: 0.02 },
		{ id: "e3", text: "Sign in", role: "text", source: "ocr", x: 0.4, y: 0.1, width: 0.1, height: 0.02 },
	];

	it("parses a tool call selection", () => {
		const selection = parseSelection(
			[{ function: { name: "select_overlay_target", arguments: { action: "arrow", elementId: "e3", message: "Click Sign in" } } }],
			null,
		);
		expect(selection).toEqual({ action: "arrow", elementId: "e3", message: "Click Sign in" });
		const calls = selectionToToolCalls(selection, candidates);
		expect(calls).toHaveLength(1);
		expect(calls[0].function?.name).toBe("overlay_show_arrow");
	});

	it("parses a JSON-in-prose fallback", () => {
		const selection = parseSelection([], 'Sure: {"action":"highlight","elementId":"e1","message":"x"}');
		expect(selection?.action).toBe("highlight");
		expect(selection?.elementId).toBe("e1");
	});

	it("returns no tool calls for none or unknown ids", () => {
		expect(selectionToToolCalls({ action: "none", elementId: "", message: "not here" }, candidates)).toEqual([]);
		expect(selectionToToolCalls({ action: "arrow", elementId: "e99", message: "x" }, candidates)).toEqual([]);
	});

	it("renders candidates compactly for the prompt", () => {
		expect(renderCandidatesForPrompt(candidates)).toContain('e3: "Sign in"');
	});

	it("includes recent conversation so references like 'it' resolve", () => {
		const [message] = buildSelectionMessages("now highlight it instead", candidates, [
			{ role: "user", content: "point at the sign in button" },
			{ role: "assistant", content: "Sign in" },
		]);
		expect(message.content).toContain("Recent conversation");
		expect(message.content).toContain("point at the sign in button");
		expect(message.content).toContain('e3: "Sign in"');
	});

	it("omits the conversation block when there is no history", () => {
		const [message] = buildSelectionMessages("point at sign in", candidates);
		expect(message.content).not.toContain("Recent conversation");
	});
});
