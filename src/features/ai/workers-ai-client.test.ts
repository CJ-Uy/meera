import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatWithWorkersAi, getWorkersAiStatus } from "@/features/ai/workers-ai-client";
import type { GroundingCandidate } from "@/features/ai/grounding/types";

const image = {
	id: "image-1",
	name: "screen.jpg",
	mimeType: "image/jpeg" as const,
	dataUrl: "data:image/jpeg;base64,YWJj",
	source: "screen" as const,
	width: 1920,
	height: 900,
	screen: { displayId: 1, displayLabel: "Display 1", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1 },
};

const candidates: GroundingCandidate[] = [
	{ id: "e1", text: "File", role: "text", source: "ocr", x: 0.01, y: 0.01, width: 0.04, height: 0.02 },
	{ id: "e3", text: "Sign in", role: "text", source: "ocr", x: 0.4, y: 0.1, width: 0.1, height: 0.02 },
];

describe("Workers AI client", () => {
	beforeEach(() => {
		process.env.WORKERS_AI_API_KEY = "cf-test-key";
		process.env.WORKERS_AI_BASE_URL = "https://gateway.test/v1/acct/meera/compat";
		process.env.WORKERS_AI_ACCOUNT_ID = "acct123";
		process.env.WORKERS_AI_CHAT_MODEL = "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast";
		process.env.WORKERS_AI_SELECTION_MODEL = "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast";
		process.env.WORKERS_AI_VISION_MODEL = "workers-ai/@cf/meta/llama-3.2-11b-vision-instruct";
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		for (const key of [
			"WORKERS_AI_API_KEY",
			"WORKERS_AI_BASE_URL",
			"WORKERS_AI_ACCOUNT_ID",
			"WORKERS_AI_CHAT_MODEL",
			"WORKERS_AI_SELECTION_MODEL",
			"WORKERS_AI_VISION_MODEL",
		]) {
			delete process.env[key];
		}
	});

	it("uses the gateway compat endpoint for text chat, with bearer auth and no tools", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", choices: [{ message: { content: "Hello." } }] }), {
				status: 200,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await chatWithWorkersAi({ messages: [{ role: "user", content: "Explain the app briefly." }] });
		const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>;

		expect(fetchMock.mock.calls[0][0]).toBe("https://gateway.test/v1/acct/meera/compat/chat/completions");
		expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: "Bearer cf-test-key" });
		expect(request.model).toBe("workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast");
		expect(request.max_tokens).toBe(512);
		expect(request.tools).toBeUndefined();
		expect(result).toMatchObject({ message: "Hello.", toolCalls: [] });
	});

	it("grounds selection via JSON mode and resolves the chosen candidate to an overlay", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({ choices: [{ message: { content: '{"action":"arrow","elementId":"e3","message":"Click Sign in"}' } }] }),
				{ status: 200 },
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await chatWithWorkersAi({ messages: [{ role: "user", content: "point at sign in" }], groundingCandidates: candidates });
		const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>;

		expect(request.response_format).toMatchObject({ type: "json_object" });
		expect(request.model).toBe("workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast");
		expect(result.grounding).toBe("ocr");
		expect(result.selectedElementId).toBe("e3");
		expect(result.toolCalls[0]?.function?.name).toBe("overlay_show_arrow");
	});

	it("routes vision to the direct run endpoint with the bare model id and reads result.response", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ result: { response: "A login screen." }, success: true }), { status: 200 }),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await chatWithWorkersAi({ messages: [{ role: "user", content: "describe this", images: [image] }] });

		expect(fetchMock.mock.calls[0][0]).toBe(
			"https://api.cloudflare.com/client/v4/accounts/acct123/ai/run/@cf/meta/llama-3.2-11b-vision-instruct",
		);
		const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { messages: unknown[]; max_tokens: number };
		expect(Array.isArray(request.messages)).toBe(true);
		expect(result.message).toBe("A login screen.");
	});

	it("reports missing API key without making a request", async () => {
		delete process.env.WORKERS_AI_API_KEY;
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		await expect(chatWithWorkersAi({ messages: [{ role: "user", content: "hi there" }] })).rejects.toThrow(
			"WORKERS_AI_API_KEY is not configured",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("reports availability from the models listing", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ data: [{ id: "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast" }] }), { status: 200 }),
			),
		);

		await expect(getWorkersAiStatus()).resolves.toMatchObject({
			available: true,
			provider: "workers-ai",
			providerLabel: "Cloudflare Workers AI",
		});
	});
});
