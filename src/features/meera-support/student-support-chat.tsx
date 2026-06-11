"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Icon,
  MeerkatMark,
  Pill,
  SpeechControl,
  VoiceInputControl,
} from "@/components/demo/shared";
import { BattleView } from "@/components/demo/battle";
import { useSpeech, useVoiceInput } from "@/features/ai/voice";
import {
  deriveSupportStage,
  type SupportStage,
} from "@/features/meera-support/support-stage";
import type {
  AiChatResponse,
  SupportTicketResult,
} from "@/features/ai/ai-types";

type SupportMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ticket?: SupportTicketResult;
};

type StudentView = "chat" | "battle";

const WELCOME: SupportMessage = {
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

const priorityTint: Record<
  SupportTicketResult["priority"],
  "teal" | "sand" | "rose"
> = {
  Low: "teal",
  Normal: "teal",
  High: "sand",
  Critical: "rose",
};

function TicketCard({ ticket }: { ticket: SupportTicketResult }) {
  return (
    <Card className="mt-2 p-4" style={{ borderColor: "var(--teal-100)" }}>
      <div className="flex items-center gap-2">
        <Icon name="check" size={16} stroke={2.2} />
        <span className="text-sm font-extrabold">Support ticket created</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Pill tint="teal">{ticket.office}</Pill>
        <Pill>{ticket.category}</Pill>
        <Pill tint={priorityTint[ticket.priority]}>{ticket.priority}</Pill>
      </div>
      <p
        className="mt-3 mb-0 text-sm leading-6"
        style={{ color: "var(--ink-2)" }}
      >
        {ticket.studentFacingSummary}
      </p>
      <p
        className="mt-2 mb-0 font-['DM_Mono'] text-[11px]"
        style={{ color: "var(--muted)" }}
      >
        Ticket {ticket.ticketNumber}. Staff will have your details, the steps
        already tried, and why this was escalated.
      </p>
      <Link
        href="/demo/admin/inbox"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold"
        style={{ borderColor: "var(--teal-100)", color: "var(--teal-700)" }}
      >
        Visible in admin <Icon name="arrow" size={13} stroke={2.2} />
      </Link>
    </Card>
  );
}

function MessageBubble({
  message,
  onSpeak,
  isSpeaking,
}: {
  message: SupportMessage;
  onSpeak: () => void;
  isSpeaking: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className="max-w-[88%] rounded-2xl border px-4 py-2.5 text-sm leading-6"
        style={
          isUser
            ? {
                background: "var(--ink)",
                borderColor: "var(--ink)",
                color: "#fff",
              }
            : {
                background: "#fff",
                borderColor: "var(--line)",
                color: "var(--ink)",
              }
        }
      >
        {message.content}
      </div>
      {!isUser && message.content.trim() ? (
        <div className="mt-1">
          <SpeechControl compact isSpeaking={isSpeaking} onClick={onSpeak} />
        </div>
      ) : null}
      {message.ticket ? (
        <div className="w-full max-w-[88%]">
          <TicketCard ticket={message.ticket} />
        </div>
      ) : null}
    </div>
  );
}

const suggestedPrompts = [
  "I cannot register because there is a hold and the deadline is tomorrow.",
  "My campus Wi-Fi will not connect before an online quiz.",
  "My payment still shows unpaid after I submitted proof.",
];

const stageCopy: Record<
  SupportStage["state"],
  {
    icon: "chat" | "sparkle" | "route" | "ticket";
    tint: "teal" | "sand" | "green";
    detail: string;
  }
> = {
  ready: {
    icon: "chat",
    tint: "teal",
    detail: "Start with plain language. Meera handles classification.",
  },
  probing: {
    icon: "sparkle",
    tint: "sand",
    detail: "Asking targeted questions and checking escalation boundaries.",
  },
  routing: {
    icon: "route",
    tint: "teal",
    detail: "Mapping the issue to the right admin team and handoff path.",
  },
  "ticket-created": {
    icon: "ticket",
    tint: "green",
    detail: "Saved to the shared dev database for the admin inbox.",
  },
};

function IntakeStagePanel({
  stage,
  ticket,
}: {
  stage: SupportStage;
  ticket: SupportTicketResult | null;
}) {
  const copy = stageCopy[stage.state];
  const departments = [
    "IT",
    "Registrar",
    "Finance",
    "Health",
    "Student Services",
  ];
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b p-5" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center gap-3">
          <span
            className="grid size-11 place-items-center rounded-2xl"
            style={{
              background: `var(--${copy.tint}-050)`,
              color: copy.tint === "green" ? "#5E9438" : "var(--teal-700)",
            }}
          >
            <Icon name={copy.icon} size={21} stroke={2} />
          </span>
          <div>
            <p
              className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]"
              style={{ color: "var(--muted)" }}
            >
              Live AI state
            </p>
            <h2 className="text-lg font-extrabold tracking-[-0.02em]">
              {stage.label}
            </h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--ink-2)" }}>
          {copy.detail}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E7EEEC]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${stage.progress}%`,
              background: "linear-gradient(90deg,var(--teal),var(--green))",
            }}
          />
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Icon name="layers" size={15} className="text-[#2E9C8E]" />
          <span
            className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]"
            style={{ color: "var(--muted)" }}
          >
            Admin knowledge graph
          </span>
        </div>
        <div className="grid gap-2">
          {departments.map((department) => {
            const active =
              stage.activeDepartments.includes(department) ||
              ticket?.office.includes(department) ||
              (department === "Finance" && ticket?.office.includes("Billing"));
            return (
              <div
                key={department}
                className="flex items-center gap-3 rounded-2xl border px-3 py-2"
                style={{
                  background: active ? "var(--teal-050)" : "#FCFAF6",
                  borderColor: active ? "var(--teal-100)" : "var(--line)",
                }}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    background: active ? "var(--teal)" : "var(--line-2)",
                  }}
                />
                <span className="text-sm font-bold">{department}</span>
                <span
                  className="ml-auto font-['DM_Mono'] text-[10px]"
                  style={{ color: active ? "var(--teal-700)" : "var(--muted)" }}
                >
                  {active ? "matched" : "ready"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: StudentView;
  onChange: (next: StudentView) => void;
}) {
  const options: { id: StudentView; label: string; icon: "chat" | "sword" }[] =
    [
      { id: "chat", label: "Chat", icon: "chat" },
      { id: "battle", label: "Battle", icon: "sword" },
    ];

  return (
    <div
      className="flex shrink-0 gap-0.5 rounded-full p-0.75"
      style={{ background: "var(--cream-2)" }}
      role="tablist"
      aria-label="Student demo view"
    >
      {options.map((option) => {
        const active = view === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.25 text-[12.5px] font-bold transition"
            style={{
              background: active ? "#fff" : "transparent",
              color: active ? "var(--teal-700)" : "var(--muted)",
              boxShadow: active ? "var(--sh-sm)" : "none",
            }}
          >
            <Icon name={option.icon} size={13} />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function StudentSupportChat() {
  const [view, setView] = useState<StudentView>("chat");
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
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const latestTicket = useMemo(
    () =>
      [...messages].reverse().find((message) => message.ticket)?.ticket ?? null,
    [messages],
  );
  const stage = useMemo(
    () =>
      deriveSupportStage({
        messages: messages.filter((message) => message.id !== "welcome"),
        sending,
        ticket: latestTicket,
      }),
    [latestTicket, messages, sending],
  );

  const sendText = useCallback(
    async (nextText?: string) => {
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
      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, mode: "support" }),
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
      } catch (sendError) {
        setMessages((current) =>
          current.filter((message) => message.id !== userMessage.id),
        );
        setDraft(text);
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

  if (view === "battle") {
    return (
      <div
        className="flex min-h-dvh flex-col"
        style={{ background: "var(--cream)", color: "var(--ink)" }}
      >
        <div
          className="flex items-center gap-3 border-b bg-white px-5 py-3"
          style={{ borderColor: "var(--line)" }}
        >
          <MeerkatMark size={38} />
          <div className="min-w-0 flex-1">
            <div className="font-bold">Meera</div>
            <div
              className="flex items-center gap-1.5 font-['DM_Mono'] text-[11px]"
              style={{ color: "var(--green)" }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: "var(--green)" }}
              />
              Battle mode - Mound showdown
            </div>
          </div>
          <ViewToggle view={view} onChange={setView} />
          <Link
            href="/demo/admin/inbox"
            className="hidden rounded-full border px-3 py-1.5 text-xs font-bold transition hover:bg-[#F8F5F0] sm:inline-flex"
            style={{ borderColor: "var(--line-2)", color: "var(--teal-700)" }}
          >
            Admin inbox
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <BattleView />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ background: "var(--cream)", color: "var(--ink)" }}
    >
      <div
        className="flex items-center gap-3 border-b bg-white px-5 py-3"
        style={{ borderColor: "var(--line)" }}
      >
        <MeerkatMark size={38} />
        <div className="min-w-0 flex-1">
          <div className="font-bold">Meera</div>
          <div
            className="flex items-center gap-1.5 font-['DM_Mono'] text-[11px]"
            style={{ color: "var(--green)" }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: "var(--green)" }}
            />
            Live support - Cloudflare AI Gateway
          </div>
        </div>
        <ViewToggle view={view} onChange={setView} />
        <Link
          href="/demo/admin/inbox"
          className="hidden rounded-full border px-3 py-1.5 text-xs font-bold transition hover:bg-[#F8F5F0] sm:inline-flex"
          style={{ borderColor: "var(--line-2)", color: "var(--teal-700)" }}
        >
          Admin inbox
        </Link>
      </div>

      <div className="mx-auto grid w-full max-w-295 flex-1 grid-cols-1 gap-4 overflow-hidden px-4 py-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="flex min-h-0 flex-col overflow-hidden p-0">
          <div
            className="border-b px-5 py-4"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Pill tint="teal">Student demo</Pill>
              <Pill>{stage.label}</Pill>
              <span
                className="ml-auto hidden font-['DM_Mono'] text-[10px] uppercase tracking-widest sm:inline"
                style={{ color: "var(--muted)" }}
              >
                Ticket syncs to shared admin DB
              </span>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5"
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isSpeaking={speakingId === message.id}
                onSpeak={() => void speak(message.id, message.content)}
              />
            ))}
            {sending ? (
              <div
                className="flex items-center gap-1.5 px-1 text-sm"
                style={{ color: "var(--muted)" }}
              >
                <span
                  className="size-1.5 animate-bounce rounded-full"
                  style={{ background: "var(--muted)" }}
                />
                <span
                  className="size-1.5 animate-bounce rounded-full [animation-delay:120ms]"
                  style={{ background: "var(--muted)" }}
                />
                <span
                  className="size-1.5 animate-bounce rounded-full [animation-delay:240ms]"
                  style={{ background: "var(--muted)" }}
                />
                <span className="ml-1.5">Meera is thinking...</span>
              </div>
            ) : null}
          </div>
          {messages.length === 1 ? (
            <div
              className="border-t px-4 py-3"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendText(prompt)}
                    className="rounded-full border bg-[#FCFAF6] px-3 py-1.5 text-[12px] font-bold transition hover:-translate-y-0.5"
                    style={{ borderColor: "var(--line)" }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
        <aside className="min-h-0 overflow-y-auto">
          <IntakeStagePanel stage={stage} ticket={latestTicket} />
        </aside>
      </div>

      <div
        className="border-t bg-white p-3"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="mx-auto max-w-180">
          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendText();
                }
              }}
              className="h-11 min-w-0 flex-1 resize-none rounded-2xl border px-4 py-2 text-sm outline-none"
              style={{ borderColor: "var(--line-2)" }}
              placeholder={
                voice.isRecording
                  ? "Listening..."
                  : "Tell Meera what's going on..."
              }
            />
            <VoiceInputControl
              compact
              isRecording={voice.isRecording}
              isTranscribing={voice.isTranscribing}
              onClick={voice.toggle}
              className="size-11 px-0"
            />
            <Button
              variant="primary"
              className="rounded-2xl px-4"
              onClick={() => void sendText()}
            >
              <Icon name="arrow" size={16} />
            </Button>
          </div>
          {error ? (
            <p
              className="mt-2 mb-0 text-[11px] font-semibold"
              style={{ color: "var(--rose)" }}
            >
              {error}
            </p>
          ) : null}
          {voice.error ? (
            <p
              className="mt-2 mb-0 text-[11px] font-semibold"
              style={{ color: "var(--rose)" }}
            >
              {voice.error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
