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

export function coordinateCalibration(images: AiImageAttachment[] | undefined) {
	const screenFrames = images?.filter((image) => image.source === "screen" && image.width && image.height) ?? [];
	if (screenFrames.length === 0) return "";

	return screenFrames
		.map((image, index) => {
			const label = image.screen?.displayLabel ? ` on ${image.screen.displayLabel}` : "";
			const grid = image.screen?.calibrationGrid;
			const gridText = grid
				? `
- The screenshot has a visible ${grid.columns} column x ${grid.rows} row calibration grid. Columns are letters from A, rows are numbers from 1.
- If exact coordinates are hard, choose the nearest grid cell and pass gridCell, gridColumn/gridRow, or the cell center as coordinates.
`
				: "";
			return `

[Screen frame ${index + 1}${label}]
- This screenshot is exactly ${image.width}x${image.height} pixels. The origin (0,0) is the TOP-LEFT corner; x grows right, y grows down.
- Give every coordinate as a PERCENT of the image size from 0 to 100 and set coordinateSpace to "percent". You may instead pass exact pixel values with coordinateSpace "image_pixels".
- Axes: x=0 is the far LEFT edge, x=100 is the far RIGHT edge; y=0 is the very TOP edge, y=100 is the very BOTTOM edge. So a menu bar at the top is near y=5, something centered is y=50, and a taskbar or terminal panel near the bottom is around y=88. Do not flip the y axis.
- Arrow, cursor, and bubble tools: x/y is the CENTER of the target element.
- Highlight tool: x/y is the TOP-LEFT corner of the element's bounding box, and width/height (also percent) must be large enough to fully cover the element with a little margin — not the whole screen, not a thin sliver.
- Read the element's actual on-screen text, icon, or label to locate it precisely. Never output the image center as a guess; if you cannot find the target, say so instead of guessing.
- The Meera chat window is hidden during capture, so do not account for it.
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
