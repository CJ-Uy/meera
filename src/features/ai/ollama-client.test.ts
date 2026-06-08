import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatWithOllama, getOllamaStatus } from "@/features/ai/ollama-client";

const image = {
	id: "image-1",
	name: "screen.jpg",
	mimeType: "image/jpeg" as const,
	dataUrl: "data:image/jpeg;base64,YWJj",
	source: "screen" as const,
	width: 1920,
	height: 900,
	screen: {
		displayId: 1,
		displayLabel: "Display 1",
		bounds: { x: 0, y: 0, width: 1920, height: 1080 },
		scaleFactor: 1,
		calibrationGrid: { columns: 12, rows: 8 },
	},
};

describe("Ollama client", () => {
	beforeEach(() => {
		process.env.OLLAMA_BASE_URL = "https://ollama.test";
		process.env.OLLAMA_CHAT_MODEL = "text-model";
		process.env.OLLAMA_VISION_MODEL = "vision-model";
		process.env.OLLAMA_CHAT_CONTEXT = "8192";
		process.env.OLLAMA_VISION_CONTEXT = "4096";
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		delete process.env.OLLAMA_BASE_URL;
		delete process.env.OLLAMA_CHAT_MODEL;
		delete process.env.OLLAMA_VISION_MODEL;
		delete process.env.OLLAMA_CHAT_CONTEXT;
		delete process.env.OLLAMA_VISION_CONTEXT;
	});

	it("uses the text model for text-only chat and preserves tool calls", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					message: {
						content: "",
						tool_calls: [{ function: { name: "overlay_clear", arguments: {} } }],
					},
				}),
				{ status: 200 },
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await chatWithOllama({ messages: [{ role: "user", content: "Clear the overlay." }] });
		const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>;

		expect(fetchMock.mock.calls[0][0]).toBe("https://ollama.test/api/chat");
		expect(request.model).toBe("text-model");
		expect(request.options).toMatchObject({ num_ctx: 8192 });
		expect(result.toolCalls[0]?.function?.name).toBe("overlay_clear");
	});

	it("recovers overlay tool calls when Ollama writes coordinates instead of using tools", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					message: {
						content: 'I picked the top-right video.\n\nCoordinates: x=0.7, y=0.25\nArrow points at the thumbnail.',
					},
				}),
				{ status: 200 },
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await chatWithOllama({ messages: [{ role: "user", content: "Overlay a random thing on my YouTube screen." }] });

		expect(result.message).toBe("I marked that on your desktop.");
		expect(result.toolCalls[0]).toMatchObject({
			function: { name: "overlay_show_arrow", arguments: { x: 0.7, y: 0.25 } },
		});
	});

	it("uses the vision model and sends base64 image data when an image is attached", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ message: { content: "I can see the screen." } }), { status: 200 }),
		);
		vi.stubGlobal("fetch", fetchMock);

		await chatWithOllama({ messages: [{ role: "user", content: "What is this?", images: [image] }] });
		const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
			model: string;
			options: { num_ctx: number };
			messages: Array<{ content: string; images?: string[] }>;
		};

		expect(request.model).toBe("vision-model");
		expect(request.options.num_ctx).toBe(4096);
		expect(request.messages.at(-1)?.images).toEqual(["YWJj"]);
		expect(request.messages.at(-1)?.content).toContain("desktop screenshot image is exactly 1920x900 pixels");
		expect(request.messages.at(-1)?.content).toContain('coordinateSpace to "image_pixels"');
		expect(request.messages.at(-1)?.content).toContain("visible 12 column x 8 row calibration grid");
	});

	it("normalizes native pixel tool calls against the attached screen frame", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					message: {
						content: "",
						tool_calls: [
							{
								function: {
									name: "overlay_show_arrow",
									arguments: { x: 1344, y: 225, coordinateSpace: "image_pixels" },
								},
							},
						],
					},
				}),
				{ status: 200 },
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await chatWithOllama({
			messages: [{ role: "user", content: "Overlay an arrow on the selected video.", images: [image] }],
		});

		expect(result.toolCalls[0]).toMatchObject({
			function: { name: "overlay_show_arrow", arguments: { x: 0.7, y: 0.25 } },
		});
	});

	it("returns a clean timeout message for Cloudflare 524 responses", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("<!DOCTYPE html><html>timeout</html>", { status: 524, statusText: "timeout" })),
		);

		await expect(chatWithOllama({ messages: [{ role: "user", content: "What is on my screen?", images: [image] }] })).rejects.toThrow(
			"Ollama timed out before it could finish the vision request.",
		);
	});

	it("reports whether both configured models are available", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ models: [{ name: "text-model" }, { name: "vision-model" }] }), { status: 200 }),
			),
		);
		await expect(getOllamaStatus()).resolves.toMatchObject({ available: true, chatModel: "text-model", visionModel: "vision-model" });
	});
});
