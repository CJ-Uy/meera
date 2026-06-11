"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSpeech, useVoiceInput } from "@/features/ai/voice";
import {
	deriveCaseStage,
	type CaseStage,
} from "@/features/meera-support/support-stage";
import type {
	AiChatResponse,
	SupportTicketResult,
} from "@/features/ai/ai-types";

export type SupportMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
	ticket?: SupportTicketResult;
};

export type SendTextOptions = {
	wantsSuggestedReplies?: boolean;
};

export type SupportConversation = {
	messages: SupportMessage[];
	sending: boolean;
	error: string | null;
	draft: string;
	setDraft: (value: string) => void;
	sendText: (text?: string, opts?: SendTextOptions) => Promise<void>;
	latestTicket: SupportTicketResult | null;
	caseStage: CaseStage;
	suggestedReplies: string[];
	continuing: boolean;
	setContinuing: (value: boolean) => void;
	voice: ReturnType<typeof useVoiceInput>;
	speakingId: string | null;
	speak: (id: string, text: string) => Promise<void>;
	reset: () => void;
};

export const WELCOME: SupportMessage = {
	id: "welcome",
	role: "assistant",
	content:
		"Hi, I'm Meera. Tell me what's going on in your own words. No need to pick a department. I'll help where I can and get the right office involved if needed.",
};

function newId() {
	return (
		globalThis.crypto?.randomUUID?.() ??
		`m-${Date.now()}-${Math.random().toString(16).slice(2)}`
	);
}

export function useSupportConversation(): SupportConversation {
	const [messages, setMessages] = useState<SupportMessage[]>([WELCOME]);
	const [draft, setDraft] = useState("");
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [continuing, setContinuing] = useState(false);
	const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
	const { speakingId, speak } = useSpeech();
	const appendTranscript = useCallback((text: string) => {
		setDraft((current) => (current.trim() ? `${current} ${text}` : text));
	}, []);
	const voice = useVoiceInput(appendTranscript);

	useEffect(() => {
		if (messages.at(-1)?.role === "assistant") setContinuing(false);
	}, [messages]);

	const latestTicket = useMemo(
		() =>
			[...messages].reverse().find((message) => message.ticket)?.ticket ?? null,
		[messages],
	);
	const caseStage = useMemo(
		() =>
			deriveCaseStage({
				messages: messages.filter((message) => message.id !== "welcome"),
				ticket: latestTicket,
				hasError: Boolean(error),
			}),
		[error, latestTicket, messages],
	);

	const reset = useCallback(() => {
		setMessages([WELCOME]);
		setDraft("");
		setSending(false);
		setError(null);
		setContinuing(false);
		setSuggestedReplies([]);
	}, []);

	const sendText = useCallback(
		async (nextText?: string, opts: SendTextOptions = {}) => {
			const text = (nextText ?? draft).trim();
			if (!text || sending) return;
			const userMessage: SupportMessage = {
				id: newId(),
				role: "user",
				content: text,
			};
			const history = [...messages, userMessage]
				.filter((message) => message.id !== "welcome")
				.slice(-12)
				.map((message) => ({ role: message.role, content: message.content }));

			setMessages((current) => [...current, userMessage]);
			setDraft("");
			setSending(true);
			setError(null);
			setSuggestedReplies([]);
			try {
				const response = await fetch("/api/ai/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						messages: history,
						mode: "support",
						wantsSuggestedReplies: Boolean(opts.wantsSuggestedReplies),
					}),
				});
				const body = (await response.json()) as AiChatResponse & {
					error?: string;
				};
				if (!response.ok)
					throw new Error(body.error || "Meera could not respond.");
				setMessages((current) => [
					...current,
					{
						id: newId(),
						role: "assistant",
						content: body.message,
						...(body.ticket ? { ticket: body.ticket } : {}),
					},
				]);
				setSuggestedReplies(body.suggestedReplies ?? []);
			} catch (sendError) {
				setMessages((current) =>
					current.filter((message) => message.id !== userMessage.id),
				);
				setDraft(text);
				setSuggestedReplies([]);
				setError(
					sendError instanceof Error
						? sendError.message
						: "Meera could not respond.",
				);
			} finally {
				setSending(false);
			}
		},
		[draft, messages, sending],
	);

	return {
		messages,
		sending,
		error,
		draft,
		setDraft,
		sendText,
		latestTicket,
		caseStage,
		suggestedReplies,
		continuing,
		setContinuing,
		voice,
		speakingId,
		speak,
		reset,
	};
}
