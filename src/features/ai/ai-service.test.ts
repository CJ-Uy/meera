import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatWithAi, configuredAiProvider, getAiStatus } from "@/features/ai/ai-service";

describe("AI provider service", () => {
	beforeEach(() => {
		process.env.GROQ_API_KEY = "test-key";
		process.env.GROQ_BASE_URL = "https://groq.test/openai/v1";
		process.env.GROQ_CHAT_MODEL = "groq-text-model";
		process.env.GROQ_VISION_MODEL = "groq-vision-model";
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		delete process.env.GROQ_API_KEY;
		delete process.env.GROQ_BASE_URL;
		delete process.env.GROQ_CHAT_MODEL;
		delete process.env.GROQ_VISION_MODEL;
	});

	it("always uses Groq", () => {
		expect(configuredAiProvider()).toBe("groq");
	});

	it("routes chat through Groq", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ model: "groq-text-model", choices: [{ message: { content: "Hello there." } }] }), {
				status: 200,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(chatWithAi({ messages: [{ role: "user", content: "Explain this briefly." }] })).resolves.toMatchObject({
			message: "Hello there.",
			model: "groq-text-model",
		});
		expect(fetchMock.mock.calls.every(([url]) => String(url).startsWith("https://groq.test"))).toBe(true);
	});

	it("reports Groq availability from its model catalog", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ data: [{ id: "groq-text-model" }, { id: "groq-vision-model" }] }), { status: 200 }),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(getAiStatus()).resolves.toMatchObject({
			available: true,
			provider: "groq",
			configuredProvider: "groq",
			chatModel: "groq-text-model",
			visionModel: "groq-vision-model",
		});
	});

	it("reports unavailable when Groq cannot be reached", async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response("upstream error", { status: 503 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(getAiStatus()).resolves.toMatchObject({ available: false, provider: "groq", configuredProvider: "groq" });
	});
});
