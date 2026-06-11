"use client";

import { useCallback, useEffect, useState } from "react";
import type {
	AiActionResult,
	AiChatInputMessage,
	AiChatMessage,
	AiChatResponse,
	AiGroundingMode,
	AiImageAttachment,
	AiProviderStatus,
	AiToolCall,
} from "@/features/ai/ai-types";
import type { GroundingCandidate } from "@/features/ai/grounding/types";

const initialMessages: AiChatMessage[] = [
	{
		id: "welcome",
		role: "assistant",
		content:
			"Ask me to inspect your screen, point at something, highlight a control, or explain an image. In Electron, I can attach a fresh desktop frame automatically for visual overlay requests.",
	},
];

function messageId() {
	return globalThis.crypto?.randomUUID?.() ?? `message-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function requestHistory(messages: AiChatMessage[]): AiChatInputMessage[] {
	return messages
		.filter((message) => message.id !== "welcome")
		.slice(-10)
		.map((message) => ({ role: message.role, content: message.content }));
}

export type AssistantToolCallContext = {
	images: AiImageAttachment[];
	prompt: string;
	grounding?: AiGroundingMode;
	selectedElementId?: string;
};

export function useAiChat(
	handleToolCalls: (toolCalls: AiToolCall[], context: AssistantToolCallContext) => Promise<AiActionResult[]>,
) {
	const [messages, setMessages] = useState<AiChatMessage[]>(initialMessages);
	const [status, setStatus] = useState<AiProviderStatus | null>(null);
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		void fetch("/api/ai/chat")
			.then(async (response) => {
				if (!response.ok) throw new Error("Could not check AI provider status.");
				return (await response.json()) as AiProviderStatus;
			})
			.then((nextStatus) => {
				if (active) setStatus(nextStatus);
			})
			.catch((statusError: unknown) => {
				if (active) {
					setStatus({
						available: false,
						provider: "workers-ai",
						providerLabel: "Cloudflare Workers AI",
						chatModel: "@cf/meta/llama-4-scout-17b-16e-instruct",
						visionModel: "@cf/meta/llama-4-scout-17b-16e-instruct",
						models: [],
						error: statusError instanceof Error ? statusError.message : "Could not check AI provider status.",
					});
				}
			});
		return () => {
			active = false;
		};
	}, []);

	const sendMessage = useCallback(
		async (content: string, images: AiImageAttachment[] = [], groundingCandidates: GroundingCandidate[] = []) => {
			if (isSending) return false;
			const normalizedContent = content.trim() || (images.length ? "Please analyze the attached image." : "");
			if (!normalizedContent) return false;

			const userMessage: AiChatMessage = {
				id: messageId(),
				role: "user",
				content: normalizedContent,
				...(images.length ? { images } : {}),
			};
			const requestMessages = [...requestHistory(messages), { role: "user" as const, content: normalizedContent, ...(images.length ? { images } : {}) }];

			setMessages((current) => [...current, userMessage]);
			setIsSending(true);
			setError(null);
			try {
				const response = await fetch("/api/ai/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ messages: requestMessages, ...(groundingCandidates.length ? { groundingCandidates } : {}) }),
				});
				const body = (await response.json()) as AiChatResponse & { error?: string };
				if (!response.ok) throw new Error(body.error || "AI chat request failed.");
				const actionResults = await handleToolCalls(body.toolCalls ?? [], {
					images,
					prompt: normalizedContent,
					grounding: body.grounding,
					selectedElementId: body.selectedElementId,
				});
				setMessages((current) => [
					...current,
					{
						id: messageId(),
						role: "assistant",
						content: body.message,
						model: body.model,
						...(actionResults.length ? { actionResults } : {}),
					},
				]);
				return true;
			} catch (sendError) {
				setMessages((current) => current.filter((message) => message.id !== userMessage.id));
				setError(sendError instanceof Error ? sendError.message : "Meera could not reach the AI provider.");
				return false;
			} finally {
				setIsSending(false);
			}
		},
		[handleToolCalls, isSending, messages],
	);

	const clearMessages = useCallback(() => {
		setMessages(initialMessages);
		setError(null);
	}, []);

	return { messages, status, isSending, error, sendMessage, clearMessages };
}
