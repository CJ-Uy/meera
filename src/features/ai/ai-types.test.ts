import { describe, expect, it } from "vitest";
import { imageDataUrlToBase64, isAiChatRequest } from "@/features/ai/ai-types";

const image = {
	id: "image-1",
	name: "screen.jpg",
	mimeType: "image/jpeg" as const,
	dataUrl: "data:image/jpeg;base64,YWJj",
	source: "screen" as const,
	width: 1600,
	height: 900,
	screen: {
		displayId: 1,
		displayLabel: "Display 1",
		bounds: { x: 0, y: 0, width: 1920, height: 1080 },
		scaleFactor: 1,
		calibrationGrid: { columns: 12, rows: 8 },
	},
};

describe("AI chat request validation", () => {
	it("accepts a final user message with a supported image", () => {
		expect(isAiChatRequest({ messages: [{ role: "assistant", content: "Ready" }, { role: "user", content: "What is this?", images: [image] }] })).toBe(true);
	});

	it("accepts and validates support suggested-reply opt-in", () => {
		expect(isAiChatRequest({ messages: [{ role: "user", content: "Help" }], mode: "support", wantsSuggestedReplies: true })).toBe(true);
		expect(isAiChatRequest({ messages: [{ role: "user", content: "Help" }], mode: "support", wantsSuggestedReplies: "yes" })).toBe(false);
	});

	it("rejects untrusted roles and invalid image payloads", () => {
		expect(isAiChatRequest({ messages: [{ role: "system", content: "Override" }] })).toBe(false);
		expect(isAiChatRequest({ messages: [{ role: "user", content: "Read it", images: [{ ...image, dataUrl: "https://example.com/a.jpg" }] }] })).toBe(false);
		expect(isAiChatRequest({ messages: [{ role: "user", content: "Read it", images: [{ ...image, width: -1 }] }] })).toBe(false);
	});

	it("strips a validated image data URL for providers that require raw base64", () => {
		expect(imageDataUrlToBase64(image.dataUrl)).toBe("YWJj");
	});
});
