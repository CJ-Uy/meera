"use client";

import { useCallback } from "react";
import { toolCallToOverlayCommand } from "@/features/ai/ai-tools";
import type { AiActionResult, AiToolCall } from "@/features/ai/ai-types";
import { useDesktopOverlay } from "@/features/overlay/use-desktop-overlay";

export function useAiOverlayActions() {
	const { available, sendCommand } = useDesktopOverlay();

	const clearVisualGuidance = useCallback(async () => {
		if (!available) return;
		await sendCommand({ type: "overlay.clear" });
	}, [available, sendCommand]);

	const executeToolCalls = useCallback(
		async (toolCalls: AiToolCall[]): Promise<AiActionResult[]> => {
			const results: AiActionResult[] = [];
			const showsVisualGuidance = toolCalls.some((toolCall) =>
				["overlay_move_cursor", "overlay_show_arrow", "overlay_show_highlight", "overlay_show_bubble"].includes(
					toolCall.function?.name ?? "",
				),
			);
			const clearsVisualGuidance = toolCalls.some((toolCall) => toolCall.function?.name === "overlay_clear");
			if (available && showsVisualGuidance && !clearsVisualGuidance) {
				try {
					await sendCommand({ type: "overlay.clear" });
				} catch {
					// Continue validating the requested actions; individual sends report their own failures below.
				}
			}

			for (const toolCall of toolCalls) {
				const tool = toolCall.function?.name ?? "unknown_tool";
				const command = toolCallToOverlayCommand(toolCall);
				if (!command) {
					results.push({ tool, ok: false, message: "Ignored an invalid or unsupported overlay action." });
					continue;
				}
				if (!available) {
					results.push({ tool, ok: false, message: "Desktop overlays require the Electron app." });
					continue;
				}
				try {
					await sendCommand(command);
					results.push({ tool, ok: true, message: `Applied ${command.type}.` });
				} catch (error) {
					results.push({ tool, ok: false, message: error instanceof Error ? error.message : "Overlay action failed." });
				}
			}
			return results;
		},
		[available, sendCommand],
	);

	return { overlayAvailable: available, executeToolCalls, clearVisualGuidance };
}
