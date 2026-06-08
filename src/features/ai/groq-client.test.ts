import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatWithGroq, getGroqStatus } from "@/features/ai/groq-client";

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

describe("Groq client", () => {
	beforeEach(() => {
		process.env.GROQ_API_KEY = "test-key";
		process.env.GROQ_BASE_URL = "https://groq.test/openai/v1";
		process.env.GROQ_CHAT_MODEL = "groq-text-model";
		process.env.GROQ_VISION_MODEL = "groq-vision-model";
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		delete process.env.GROQ_API_KEY;
		delete process.env.GROQ_BASE_URL;
		delete process.env.GROQ_CHAT_MODEL;
		delete process.env.GROQ_VISION_MODEL;
		delete process.env.GROQ_REQUEST_TIMEOUT_MS;
		delete process.env.GROQ_MAX_TOKENS;
	});

	it("uses Groq chat completions with bearer authentication for text chat", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					model: "groq-text-model",
					choices: [{ finish_reason: "stop", message: { content: "Fast answer." } }],
				}),
				{ status: 200 },
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await chatWithGroq({ messages: [{ role: "user", content: "Explain the app briefly." }] });
		const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>;

		expect(fetchMock.mock.calls[0][0]).toBe("https://groq.test/openai/v1/chat/completions");
		expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: "Bearer test-key" });
		expect(request).toMatchObject({
			model: "groq-text-model",
			tool_choice: "auto",
			parallel_tool_calls: true,
			max_completion_tokens: 512,
		});
		expect(result).toMatchObject({ message: "Fast answer.", model: "groq-text-model", toolCalls: [] });
	});

	it("sends only the newest image as Groq multimodal content while preserving text context", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					model: "groq-vision-model",
					choices: [
						{
							finish_reason: "tool_calls",
							message: {
								content: null,
								tool_calls: [
									{
										id: "call-1",
										type: "function",
										function: { name: "overlay_show_arrow", arguments: '{"x":0.7,"y":0.25,"coordinateSpace":"normalized"}' },
									},
								],
							},
						},
					],
				}),
				{ status: 200 },
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await chatWithGroq({
			messages: [
				{ role: "user", content: "Point at the first video.", images: [image] },
				{ role: "assistant", content: "I pointed at it." },
				{ role: "user", content: "Now point at another video.", images: [image] },
			],
		});
		const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
			model: string;
			messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>;
			tools: unknown[];
		};

		expect(request.model).toBe("groq-vision-model");
		expect(request.tools.length).toBeGreaterThan(0);
		expect(request.messages[1]).toMatchObject({ role: "user", content: "Point at the first video." });
		expect(Array.isArray(request.messages[3]?.content)).toBe(true);
		const latestContent = request.messages[3]?.content as Array<Record<string, unknown>>;
		expect(latestContent[0]).toMatchObject({ type: "text" });
		expect(String(latestContent[0]?.text)).toContain("Prefer normalized coordinates from 0 to 1");
		expect(String(latestContent[0]?.text)).not.toContain("relative coordinates from 0 to 1000");
		expect(latestContent[1]).toMatchObject({ type: "image_url", image_url: { url: image.dataUrl } });
		expect(result.toolCalls[0]).toMatchObject({
			function: { name: "overlay_show_arrow", arguments: { x: 0.7, y: 0.25 } },
		});
	});

	it("enforces the explicitly requested overlay type on Groq tool calls", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						choices: [
							{
								message: {
									content: null,
									tool_calls: [{ function: { name: "overlay_show_arrow", arguments: '{"x":0.7,"y":0.25}' } }],
								},
							},
						],
					}),
					{ status: 200 },
				),
			),
		);

		const result = await chatWithGroq({
			messages: [{ role: "user", content: "Show a box around the selected video.", images: [image] }],
		});

		expect(result.toolCalls[0]?.function?.name).toBe("overlay_show_highlight");
	});

	it("accepts numeric-string tool arguments and retries Groq tool validation failures", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						error: {
							message:
								"tool call validation failed: parameters for tool overlay_move_cursor did not match schema",
						},
					}),
					{ status: 400 },
				),
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						model: "groq-vision-model",
						choices: [
							{
								finish_reason: "tool_calls",
								message: {
									content: null,
									tool_calls: [
										{
											function: {
												name: "overlay_move_cursor",
												arguments:
													'{"x":"1344","y":"225","coordinateSpace":"image_pixels","imageWidth":"1920","imageHeight":"900","gridColumns":"12"}',
											},
										},
									],
								},
							},
						],
					}),
					{ status: 200 },
				),
			);
		vi.stubGlobal("fetch", fetchMock);

		const result = await chatWithGroq({
			messages: [{ role: "user", content: "Move the cursor to the selected video.", images: [image] }],
		});
		const firstRequest = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
			temperature: number;
			tools: Array<{
				function: {
					name: string;
					parameters: { properties: Record<string, unknown> };
				};
			}>;
		};
		const secondRequest = JSON.parse(fetchMock.mock.calls[1][1].body as string) as { temperature: number };
		const cursorTool = firstRequest.tools.find((tool) => tool.function.name === "overlay_move_cursor");

		expect(cursorTool?.function.parameters.properties.x).toMatchObject({
			anyOf: [{ type: "number" }, { type: "string" }],
		});
		expect(firstRequest.temperature).toBe(0.2);
		expect(secondRequest.temperature).toBe(0);
		expect(result.toolCalls[0]).toMatchObject({
			function: { name: "overlay_move_cursor", arguments: { x: 0.7, y: 0.25, coordinateSpace: "normalized" } },
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("retries transient Groq errors once", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "try again" } }), { status: 503 }))
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ choices: [{ message: { content: "Recovered." } }] }), { status: 200 }),
			);
		vi.stubGlobal("fetch", fetchMock);

		await expect(chatWithGroq({ messages: [{ role: "user", content: "Explain latency briefly." }] })).resolves.toMatchObject({
			message: "Recovered.",
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("reports missing API key without making a request", async () => {
		delete process.env.GROQ_API_KEY;
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		await expect(chatWithGroq({ messages: [{ role: "user", content: "Explain latency briefly." }] })).rejects.toThrow(
			"GROQ_API_KEY is not configured",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("checks that both configured Groq models are available", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						data: [
							{ id: "groq-text-model", active: true },
							{ id: "groq-vision-model", active: true },
						],
					}),
					{ status: 200 },
				),
			),
		);

		await expect(getGroqStatus()).resolves.toMatchObject({
			available: true,
			provider: "groq",
			providerLabel: "Groq",
		});
	});
});
