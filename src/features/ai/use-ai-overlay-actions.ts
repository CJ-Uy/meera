"use client";

import { useCallback } from "react";
import { toolCallToOverlayCommand } from "@/features/ai/ai-tools";
import type { AiActionResult, AiToolCall } from "@/features/ai/ai-types";
import { useDesktopOverlay } from "@/features/overlay/use-desktop-overlay";

export function useAiOverlayActions() {
	const { available, sendCommand } = useDesktopOverlay();

	const executeToolCalls = useCallback(
		async (toolCalls: AiToolCall[]): Promise<AiActionResult[]> => {
			const results: AiActionResult[] = [];
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

	return { overlayAvailable: available, executeToolCalls };
}
