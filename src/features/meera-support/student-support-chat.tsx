"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Icon, MeerkatMark, Pill, SpeechControl, VoiceInputControl } from "@/components/demo/shared";
import { useSpeech, useVoiceInput } from "@/features/ai/voice";
import type { AiChatResponse, SupportTicketResult } from "@/features/ai/ai-types";

type SupportMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
	ticket?: SupportTicketResult;
};

const WELCOME: SupportMessage = {
	id: "welcome",
	role: "assistant",
	content: "Hi, I'm Meera. Tell me what's going on in your own words — no need to pick a department. I'll help where I can and get the right office involved if needed.",
};

function newId() {
	return globalThis.crypto?.randomUUID?.() ?? `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const priorityTint: Record<SupportTicketResult["priority"], "teal" | "sand" | "rose"> = {
	Low: "teal",
	Normal: "teal",
	High: "sand",
	Critical: "rose",
};

function TicketCard({ ticket }: { ticket: SupportTicketResult }) {
	return (
		<Card className="mt-2 p-4">
			<div className="flex items-center gap-2">
				<Icon name="check" size={16} stroke={2.2} />
				<span className="text-sm font-[800]">Support ticket created</span>
			</div>
			<div className="mt-2 flex flex-wrap items-center gap-1.5">
				<Pill tint="teal">{ticket.office}</Pill>
				<Pill>{ticket.category}</Pill>
				<Pill tint={priorityTint[ticket.priority]}>{ticket.priority}</Pill>
			</div>
			<p className="mt-3 mb-0 text-sm leading-6" style={{ color: "var(--ink-2)" }}>{ticket.studentFacingSummary}</p>
			<p className="mt-2 mb-0 font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>
				Ticket {ticket.ticketNumber} — staff will have your details, the steps already tried, and why this was escalated.
			</p>
		</Card>
	);
}

function MessageBubble({ message, onSpeak, isSpeaking }: { message: SupportMessage; onSpeak: () => void; isSpeaking: boolean }) {
	const isUser = message.role === "user";
	return (
		<div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
			<div
				className="max-w-[88%] rounded-2xl border px-4 py-2.5 text-sm leading-6"
				style={
					isUser
						? { background: "var(--ink)", borderColor: "var(--ink)", color: "#fff" }
						: { background: "#fff", borderColor: "var(--line)", color: "var(--ink)" }
				}
			>
				{message.content}
			</div>
			{!isUser && message.content.trim() ? (
				<div className="mt-1">
					<SpeechControl compact isSpeaking={isSpeaking} onClick={onSpeak} />
				</div>
			) : null}
			{message.ticket ? <div className="w-full max-w-[88%]"><TicketCard ticket={message.ticket} /></div> : null}
		</div>
	);
}

export function StudentSupportChat() {
	const [messages, setMessages] = useState<SupportMessage[]>([WELCOME]);
	const [draft, setDraft] = useState("");
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { speakingId, speak } = useSpeech();
	const appendTranscript = useCallback((text: string) => {
		setDraft((current) => (current.trim() ? `${current} ${text}` : text));
	}, []);
	const voice = useVoiceInput(appendTranscript);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
	}, [messages, sending]);

	const send = useCallback(async () => {
		const text = draft.trim();
		if (!text || sending) return;
		const userMessage: SupportMessage = { id: newId(), role: "user", content: text };
		const history = [...messages, userMessage]
			.filter((message) => message.id !== "welcome")
			.slice(-12)
			.map((message) => ({ role: message.role, content: message.content }));

		setMessages((current) => [...current, userMessage]);
		setDraft("");
		setSending(true);
		setError(null);
		try {
			const response = await fetch("/api/ai/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: history, mode: "support" }),
			});
			const body = (await response.json()) as AiChatResponse & { error?: string };
			if (!response.ok) throw new Error(body.error || "Meera could not respond.");
			setMessages((current) => [
				...current,
				{ id: newId(), role: "assistant", content: body.message, ...(body.ticket ? { ticket: body.ticket } : {}) },
			]);
		} catch (sendError) {
			setMessages((current) => current.filter((message) => message.id !== userMessage.id));
			setDraft(text);
			setError(sendError instanceof Error ? sendError.message : "Meera could not respond.");
		} finally {
			setSending(false);
		}
	}, [draft, messages, sending]);

	return (
		<div className="flex min-h-[100dvh] flex-col" style={{ background: "var(--cream)", color: "var(--ink)" }}>
			<div className="flex items-center gap-3 border-b bg-white px-5 py-3" style={{ borderColor: "var(--line)" }}>
				<MeerkatMark size={38} />
				<div className="min-w-0 flex-1">
					<div className="font-bold">Meera</div>
					<div className="flex items-center gap-1.5 font-['DM_Mono'] text-[11px]" style={{ color: "var(--green)" }}>
						<span className="size-1.5 rounded-full" style={{ background: "var(--green)" }} />
						Live support — connected to the AI orchestrator
					</div>
				</div>
			</div>

			<div ref={scrollRef} className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-5">
				{messages.map((message) => (
					<MessageBubble
						key={message.id}
						message={message}
						isSpeaking={speakingId === message.id}
						onSpeak={() => void speak(message.id, message.content)}
					/>
				))}
				{sending ? (
					<div className="flex items-center gap-1.5 px-1 text-sm" style={{ color: "var(--muted)" }}>
						<span className="size-1.5 animate-bounce rounded-full" style={{ background: "var(--muted)" }} />
						<span className="size-1.5 animate-bounce rounded-full [animation-delay:120ms]" style={{ background: "var(--muted)" }} />
						<span className="size-1.5 animate-bounce rounded-full [animation-delay:240ms]" style={{ background: "var(--muted)" }} />
						<span className="ml-1.5">Meera is thinking…</span>
					</div>
				) : null}
			</div>

			<div className="border-t bg-white p-3" style={{ borderColor: "var(--line)" }}>
				<div className="mx-auto max-w-[720px]">
					<div className="flex gap-2">
						<textarea
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter" && !event.shiftKey) {
									event.preventDefault();
									void send();
								}
							}}
							className="h-11 min-w-0 flex-1 resize-none rounded-2xl border px-4 py-2 text-sm outline-none"
							style={{ borderColor: "var(--line-2)" }}
							placeholder={voice.isRecording ? "Listening…" : "Tell Meera what's going on…"}
						/>
						<VoiceInputControl compact isRecording={voice.isRecording} isTranscribing={voice.isTranscribing} onClick={voice.toggle} className="size-11 px-0" />
						<Button variant="primary" className="rounded-2xl px-4" onClick={() => void send()}>
							<Icon name="arrow" size={16} />
						</Button>
					</div>
					{error ? <p className="mt-2 mb-0 text-[11px] font-semibold" style={{ color: "var(--rose)" }}>{error}</p> : null}
					{voice.error ? <p className="mt-2 mb-0 text-[11px] font-semibold" style={{ color: "var(--rose)" }}>{voice.error}</p> : null}
				</div>
			</div>
		</div>
	);
}
