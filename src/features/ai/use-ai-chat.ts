"use client";

import { useCallback, useEffect, useState } from "react";
import type {
	AiActionResult,
	AiChatInputMessage,
	AiChatMessage,
	AiChatResponse,
	AiImageAttachment,
	AiToolCall,
	OllamaStatus,
} from "@/features/ai/ai-types";

const initialMessages: AiChatMessage[] = [
	{
		id: "welcome",
		role: "assistant",
		content: "Ask me a question, upload an image, or attach a frame from your shared screen. In desktop mode, I can also guide you with overlays.",
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

export function useAiChat(executeToolCalls: (toolCalls: AiToolCall[]) => Promise<AiActionResult[]>) {
	const [messages, setMessages] = useState<AiChatMessage[]>(initialMessages);
	const [status, setStatus] = useState<OllamaStatus | null>(null);
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		void fetch("/api/ai/chat")
			.then(async (response) => {
				if (!response.ok) throw new Error("Could not check Ollama status.");
				return (await response.json()) as OllamaStatus;
			})
			.then((nextStatus) => {
				if (active) setStatus(nextStatus);
			})
			.catch((statusError: unknown) => {
				if (active) {
					setStatus({
						available: false,
						chatModel: "qwen3.5:9b",
						visionModel: "qwen3-vl:8b",
						models: [],
						error: statusError instanceof Error ? statusError.message : "Could not check Ollama status.",
					});
				}
			});
		return () => {
			active = false;
		};
	}, []);

	const sendMessage = useCallback(
		async (content: string, images: AiImageAttachment[] = []) => {
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
					body: JSON.stringify({ messages: requestMessages }),
				});
				const body = (await response.json()) as AiChatResponse & { error?: string };
				if (!response.ok) throw new Error(body.error || "Ollama chat request failed.");
				const actionResults = await executeToolCalls(body.toolCalls ?? []);
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
				setError(sendError instanceof Error ? sendError.message : "Meera could not reach Ollama.");
				return false;
			} finally {
				setIsSending(false);
			}
		},
		[executeToolCalls, isSending, messages],
	);

	const clearMessages = useCallback(() => {
		setMessages(initialMessages);
		setError(null);
	}, []);

	return { messages, status, isSending, error, sendMessage, clearMessages };
}
