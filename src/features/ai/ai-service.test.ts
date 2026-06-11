import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatWithAi, configuredAiProvider, getAiStatus, parseSuggestedReplies } from "@/features/ai/ai-service";

describe("AI provider service", () => {
	beforeEach(() => {
		// Groq (used only when AI_PROVIDER=groq)
		process.env.GROQ_API_KEY = "test-key";
		process.env.GROQ_BASE_URL = "https://groq.test/openai/v1";
		process.env.GROQ_CHAT_MODEL = "groq-text-model";
		process.env.GROQ_VISION_MODEL = "groq-vision-model";
		// Workers AI (the default provider)
		process.env.WORKERS_AI_API_KEY = "cf-test-key";
		process.env.WORKERS_AI_BASE_URL = "https://gateway.test/v1/acct/meera/compat";
		process.env.WORKERS_AI_ACCOUNT_ID = "acct123";
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		for (const key of [
			"AI_PROVIDER",
			"GROQ_API_KEY",
			"GROQ_BASE_URL",
			"GROQ_CHAT_MODEL",
			"GROQ_VISION_MODEL",
			"WORKERS_AI_API_KEY",
			"WORKERS_AI_BASE_URL",
			"WORKERS_AI_ACCOUNT_ID",
		]) {
			delete process.env[key];
		}
	});

	it("defaults to Workers AI", () => {
		expect(configuredAiProvider()).toBe("workers-ai");
	});

	it("uses Groq when AI_PROVIDER=groq", () => {
		process.env.AI_PROVIDER = "groq";
		expect(configuredAiProvider()).toBe("groq");
	});

	it("routes chat through Workers AI by default", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ choices: [{ message: { content: "Hello there." } }] }), { status: 200 }),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(chatWithAi({ messages: [{ role: "user", content: "Explain this briefly." }] })).resolves.toMatchObject({
			message: "Hello there.",
		});
		expect(fetchMock.mock.calls.every(([url]) => String(url).startsWith("https://gateway.test"))).toBe(true);
	});

	it("routes chat through Groq when AI_PROVIDER=groq", async () => {
		process.env.AI_PROVIDER = "groq";
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ model: "groq-text-model", choices: [{ message: { content: "Hi." } }] }), { status: 200 }),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(chatWithAi({ messages: [{ role: "user", content: "Explain this briefly." }] })).resolves.toMatchObject({ message: "Hi." });
		expect(fetchMock.mock.calls.every(([url]) => String(url).startsWith("https://groq.test"))).toBe(true);
	});

	it("reports Workers AI availability and configuredProvider by default", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ data: [{ id: "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast" }] }), { status: 200 }),
		);
		vi.stubGlobal("fetch", fetchMock);

		await expect(getAiStatus()).resolves.toMatchObject({
			available: true,
			provider: "workers-ai",
			configuredProvider: "workers-ai",
		});
	});

	it("reports unavailable when the provider cannot be reached", async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response("upstream error", { status: 503 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(getAiStatus()).resolves.toMatchObject({ available: false, provider: "workers-ai", configuredProvider: "workers-ai" });
	});

	it("parses suggested replies defensively", () => {
		expect(parseSuggestedReplies('["I can try that","Please file a ticket","No thanks"]')).toEqual([
			"I can try that",
			"Please file a ticket",
			"No thanks",
		]);
		expect(parseSuggestedReplies('Here: ["One","Two","Three","Four"]')).toEqual(["One", "Two", "Three"]);
		expect(parseSuggestedReplies("not json")).toEqual([]);
		expect(parseSuggestedReplies('{"not":"array"}')).toEqual([]);
	});
});
