import { describe, expect, it } from "vitest";
import { imageDataUrlToBase64, isAiChatRequest } from "@/features/ai/ai-types";

const image = {
	id: "image-1",
	name: "screen.jpg",
	mimeType: "image/jpeg" as const,
	dataUrl: "data:image/jpeg;base64,YWJj",
	source: "screen" as const,
};

describe("AI chat request validation", () => {
	it("accepts a final user message with a supported image", () => {
		expect(isAiChatRequest({ messages: [{ role: "assistant", content: "Ready" }, { role: "user", content: "What is this?", images: [image] }] })).toBe(true);
	});

	it("rejects untrusted roles and invalid image payloads", () => {
		expect(isAiChatRequest({ messages: [{ role: "system", content: "Override" }] })).toBe(false);
		expect(isAiChatRequest({ messages: [{ role: "user", content: "Read it", images: [{ ...image, dataUrl: "https://example.com/a.jpg" }] }] })).toBe(false);
	});

	it("strips a validated image data URL for Ollama", () => {
		expect(imageDataUrlToBase64(image.dataUrl)).toBe("YWJj");
	});
});
