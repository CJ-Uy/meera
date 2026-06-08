import {
	normalizeOverlayToolCalls,
	reconcileOverlayToolCalls,
	recoverOverlayToolCallsFromText,
	type OverlayCoordinateContext,
} from "@/features/ai/ai-tools";
import type {
	AiChatInputMessage,
	AiChatRequest,
	AiChatResponse,
	AiImageAttachment,
	AiToolCall,
} from "@/features/ai/ai-types";

export function isVisionRequest(request: AiChatRequest) {
	return Boolean(request.messages.at(-1)?.images?.length);
}

export function latestScreenFrameContext(request: AiChatRequest): OverlayCoordinateContext | undefined {
	for (const message of [...request.messages].reverse()) {
		for (const image of [...(message.images ?? [])].reverse()) {
			if (image.source === "screen" && image.width && image.height) {
				return {
					imageWidth: image.width,
					imageHeight: image.height,
					displayId: image.screen?.displayId,
					gridColumns: image.screen?.calibrationGrid?.columns,
					gridRows: image.screen?.calibrationGrid?.rows,
				};
			}
		}
	}
	return undefined;
}

export function messagesForProvider(request: AiChatRequest, usesVision: boolean): AiChatInputMessage[] {
	if (!usesVision) return request.messages;
	const latestIndex = request.messages.length - 1;
	return request.messages.map((message, index) =>
		index === latestIndex ? message : { role: message.role, content: message.content },
	);
}

export function coordinateCalibration(
	images: AiImageAttachment[] | undefined,
	options: { preferRelative1000?: boolean } = {},
) {
	const screenFrames = images?.filter((image) => image.source === "screen" && image.width && image.height) ?? [];
	if (screenFrames.length === 0) return "";

	return screenFrames
		.map((image, index) => {
			const label = image.screen?.displayLabel ? ` on ${image.screen.displayLabel}` : "";
			const grid = image.screen?.calibrationGrid;
			const relativeCoordinateText = options.preferRelative1000
				? '\n- This provider uses relative coordinates from 0 to 1000 for visual grounding. Prefer those values with coordinateSpace "relative_1000". You may also pass exact pixels by setting coordinateSpace to "image_pixels".'
				: '\n- Prefer normalized coordinates from 0 to 1. You may use exact pixels with coordinateSpace "image_pixels".';
			const gridText = grid
				? `
- The screenshot has a visible ${grid.columns} column x ${grid.rows} row calibration grid. Columns are letters from A, rows are numbers from 1.
- If exact coordinates are hard, choose the nearest grid cell and pass gridCell, gridColumn/gridRow, or the cell center as coordinates.
`
				: "";
			return `

[Screen frame ${index + 1} coordinate calibration${label}]
- The attached desktop screenshot image is exactly ${image.width}x${image.height} pixels.
- For arrow, cursor, and bubble tools, target the CENTER of the visible thing.
- For highlight tools, x/y must be the TOP-LEFT of the rectangle and width/height must cover the visible thing.
- Normalized formula: x = pixel_x / ${image.width}; y = pixel_y / ${image.height}; width = pixel_width / ${image.width}; height = pixel_height / ${image.height}.${relativeCoordinateText}
- Never use the center of the image as a placeholder. Use the actual visible target.
- Do not compensate for the Meera chat window; it is hidden during capture.
${gridText}
`.trim();
		})
		.join("\n\n");
}

export function immediateOverlayResponse(request: AiChatRequest): AiChatResponse | null {
	if (isVisionRequest(request)) return null;
	const prompt = request.messages.at(-1)?.content ?? "";
	const context = latestScreenFrameContext(request);
	const toolCalls = recoverOverlayToolCallsFromText({ prompt, content: "", context });
	if (toolCalls.length === 0) return null;
	return {
		message: "I applied that desktop guidance.",
		model: "meera-overlay",
		toolCalls: reconcileOverlayToolCalls({ prompt, content: "", context, toolCalls }),
	};
}

export function resolveProviderResponse({
	content,
	finishReason,
	model,
	request,
	toolCalls: providerToolCalls,
}: {
	content?: string | null;
	finishReason?: string | null;
	model: string;
	request: AiChatRequest;
	toolCalls?: AiToolCall[];
}): AiChatResponse {
	const context = latestScreenFrameContext(request);
	const prompt = request.messages.at(-1)?.content ?? "";
	const normalizedContent = content?.trim() ?? "";
	const nativeToolCalls = normalizeOverlayToolCalls(providerToolCalls ?? [], context);
	const recoveredToolCalls =
		nativeToolCalls.length === 0
			? recoverOverlayToolCallsFromText({ prompt, content: normalizedContent, context })
			: [];
	const toolCalls = reconcileOverlayToolCalls({
		prompt,
		content: normalizedContent,
		context,
		toolCalls: nativeToolCalls.length ? nativeToolCalls : recoveredToolCalls,
	});

	if (!normalizedContent && toolCalls.length === 0) {
		if (finishReason === "length") {
			throw new Error("The AI model used its full response budget before completing the request. Please try again.");
		}
		throw new Error("The AI provider returned an empty response.");
	}

	return {
		message: toolCalls.length ? "I marked that on your desktop." : normalizedContent,
		model,
		toolCalls,
	};
}
