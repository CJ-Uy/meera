import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatWithAi, configuredAiProvider, getAiStatus } from "@/features/ai/ai-service";

describe("AI provider service", () => {
	beforeEach(() => {
		process.env.GROQ_API_KEY = "test-key";
		process.env.GROQ_BASE_URL = "https://groq.test/openai/v1";
		process.env.GROQ_CHAT_MODEL = "groq-text-model";
		process.env.GROQ_VISION_MODEL = "groq-vision-model";
		process.env.OLLAMA_BASE_URL = "https://ollama.test";
		process.env.OLLAMA_CHAT_MODEL = "ollama-text-model";
		process.env.OLLAMA_VISION_MODEL = "ollama-vision-model";
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		delete process.env.AI_PROVIDER;
		delete process.env.AI_FALLBACK_PROVIDER;
		delete process.env.GROQ_API_KEY;
		delete process.env.GROQ_BASE_URL;
		delete process.env.GROQ_CHAT_MODEL;
		delete process.env.GROQ_VISION_MODEL;
		delete process.env.OLLAMA_BASE_URL;
		delete process.env.OLLAMA_CHAT_MODEL;
		delete process.env.OLLAMA_VISION_MODEL;
	});

	it("defaults to Groq", () => {
		delete process.env.AI_PROVIDER;
		expect(configuredAiProvider()).toBe("groq");
	});

	it("can switch back to Ollama through configuration", () => {
		process.env.AI_PROVIDER = "ollama";
		expect(configuredAiProvider()).toBe("ollama");
	});

	it("uses the configured Ollama fallback when Groq fails", async () => {
		process.env.AI_PROVIDER = "groq";
		process.env.AI_FALLBACK_PROVIDER = "ollama";
		vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const fetchMock = vi.fn().mockImplementation((url: string) => {
			if (url.startsWith("https://groq.test")) {
				return Promise.resolve(new Response(JSON.stringify({ error: { message: "unavailable" } }), { status: 503 }));
			}
			return Promise.resolve(new Response(JSON.stringify({ message: { content: "Ollama fallback response." } }), { status: 200 }));
		});
		vi.stubGlobal("fetch", fetchMock);

		await expect(chatWithAi({ messages: [{ role: "user", content: "Explain this briefly." }] })).resolves.toMatchObject({
			message: "Ollama fallback response.",
			model: "ollama-text-model",
		});
		expect(fetchMock.mock.calls.some(([url]) => String(url).startsWith("https://groq.test"))).toBe(true);
		expect(fetchMock.mock.calls.some(([url]) => String(url).startsWith("https://ollama.test"))).toBe(true);
	});

	it("reports when the configured fallback is active", async () => {
		process.env.AI_PROVIDER = "groq";
		process.env.AI_FALLBACK_PROVIDER = "ollama";
		const fetchMock = vi.fn().mockImplementation((url: string) => {
			if (url.startsWith("https://groq.test")) {
				return Promise.resolve(new Response(JSON.stringify({ error: { message: "bad key" } }), { status: 401 }));
			}
			return Promise.resolve(
				new Response(
					JSON.stringify({
						models: [{ name: "ollama-text-model" }, { name: "ollama-vision-model" }],
					}),
					{ status: 200 },
				),
			);
		});
		vi.stubGlobal("fetch", fetchMock);

		await expect(getAiStatus()).resolves.toMatchObject({
			available: true,
			provider: "ollama",
			configuredProvider: "groq",
			fallbackProvider: "ollama",
			fallbackActive: true,
		});
	});
});
