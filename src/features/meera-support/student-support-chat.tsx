"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  asset,
  Button,
  Card,
  Icon,
  type IconName,
  Pill,
  SpeechControl,
  VoiceInputControl,
} from "@/components/demo/shared";
import { BattleView } from "@/components/demo/battle";
import { DemoHeader } from "@/components/demo/demo-header";
import { useSpeech, useVoiceInput } from "@/features/ai/voice";
import {
  CASE_DEPARTMENTS,
  deriveCaseStage,
  type CaseStage,
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

const caseLabels = ["Ready", "Student heard", "Researched", "Diagnosed", "Case packaged"] as const;

const moundLayers: { label: string; icon: IconName; note: string }[] = [
  { label: "Student heard", icon: "chat", note: "issue captured" },
  { label: "Researched", icon: "book", note: "knowledge base checked" },
  { label: "Diagnosed", icon: "sparkle", note: "root cause found" },
  { label: "Case packaged", icon: "ticket", note: "ready for the admin inbox" },
];

/**
 * Side progress meter for the student chat. Visualises how far Meera has gotten on the case as the
 * conversation unfolds — a confidence ring plus stacking "mound" layers that light up per stage, and
 * a shake when a turn fails. Driven by `deriveCaseStage` against the live transcript and ticket result.
 */
function CaseMeter({ stage, damage, fixed, resolution, activeDepartments }: CaseStage) {
  const conf = fixed ? 100 : ([0, 34, 61, 84, 97][stage] ?? 0);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const ringColor = damage ? "var(--sand)" : fixed ? "var(--green)" : "var(--teal)";
  return (
    <aside
      className="hidden min-h-0 w-full flex-col gap-5 overflow-y-auto border-l p-5 lg:flex"
      style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, var(--teal-050), #fff 58%)" }}
    >
      <div className="flex items-center justify-between">
        <span className="font-['DM_Mono'] text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: "var(--teal-700)" }}>
          Case meter
        </span>
        <Pill tint={fixed ? "green" : "teal"}>{fixed ? "Resolved" : "Live"}</Pill>
      </div>

      <div className="relative mx-auto size-[136px]">
        <svg width="136" height="136" viewBox="0 0 116 116" className="size-full">
          <circle cx="58" cy="58" r={radius} fill="none" stroke="var(--cream-3)" strokeWidth="11" />
          <circle
            cx="58"
            cy="58"
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - conf / 100)}
            transform="rotate(-90 58 58)"
            style={{ transition: "stroke-dashoffset .95s cubic-bezier(.2,.9,.3,1), stroke .4s" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          {fixed ? (
            <img src={asset("meera-celebrate.png")} alt="" className="w-14" style={{ animation: "bob 2.4s ease-in-out infinite" }} />
          ) : (
            <div>
              <div className="text-[30px] font-[800] leading-none" style={{ color: damage ? "var(--sand-600)" : "var(--teal-700)" }}>
                {conf}
                <span className="text-base">%</span>
              </div>
              <div className="mt-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
                complete
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-1.5">
        {moundLayers.map((layer, index) => {
          const done = index < stage;
          const isCurrent = index === stage - 1;
          const isDamage = damage && isCurrent;
          const isFinalSelfServe = index === moundLayers.length - 1 && resolution === "self-serve";
          const label = isFinalSelfServe ? "Resolved" : layer.label;
          const note = isFinalSelfServe ? "no ticket needed" : layer.note;
          const bg = isDamage ? "var(--sand-050)" : done ? "var(--teal-050)" : "#fff";
          const border = isDamage ? "#F3D2C6" : done ? "var(--teal-100)" : "var(--line)";
          return (
            <div
              key={layer.label}
              className="flex items-center gap-2.5 rounded-2xl border px-3 py-2 transition-all"
              style={{
                background: bg,
                borderColor: border,
                opacity: done ? 1 : 0.55,
                animation: isDamage ? "mound-shake .7s ease" : isCurrent ? "mound-layer-in .5s ease" : "none",
              }}
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-lg"
                style={{ background: isDamage ? "var(--sand)" : done ? "var(--teal)" : "var(--cream-2)", color: done || isDamage ? "#fff" : "var(--muted)" }}
              >
                <Icon name={isDamage ? "alert" : done ? "check" : layer.icon} size={14} stroke={2.2} />
              </span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold leading-tight" style={{ color: done ? "var(--ink)" : "var(--muted)" }}>
                  {label}
                </div>
                <div className="font-['DM_Mono'] text-[9.5px]" style={{ color: "var(--muted)" }}>
                  {note}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department knowledge bases — all online, with the ones Meera engaged highlighted */}
      <div className="mt-1">
        <div className="mb-2 flex items-center gap-2">
          <Icon name="layers" size={14} className="text-[#2E9C8E]" />
          <span className="font-['DM_Mono'] text-[9.5px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
            Knowledge bases
          </span>
          <span className="ml-auto inline-flex items-center gap-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.1em]" style={{ color: "#5E9438" }}>
            <span className="size-1.5 rounded-full" style={{ background: "var(--green)" }} />
            online
          </span>
        </div>
        <div className="grid gap-1">
          {CASE_DEPARTMENTS.map((department) => {
            const matched = activeDepartments.includes(department);
            return (
              <div
                key={department}
                className="flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-all"
                style={{ background: matched ? "var(--teal-050)" : "#fff", borderColor: matched ? "var(--teal-100)" : "var(--line)" }}
              >
                <span className="size-1.5 rounded-full" style={{ background: matched ? "var(--teal)" : "var(--green)" }} />
                <span className="text-[12px] font-bold" style={{ color: matched ? "var(--teal-700)" : "var(--ink-2)" }}>{department}</span>
                <span className="ml-auto font-['DM_Mono'] text-[9px] uppercase tracking-[0.08em]" style={{ color: matched ? "var(--teal-700)" : "var(--muted)" }}>
                  {matched ? "needed" : "online"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto rounded-2xl border bg-white/70 p-3 text-center" style={{ borderColor: "var(--line)" }}>
        <div className="text-[13px] font-bold" style={{ color: damage ? "var(--sand-600)" : stage >= 4 ? "var(--teal-700)" : "var(--ink-2)" }}>
          {damage ? "Regrouping…" : fixed ? "Resolved" : caseLabels[stage]}
        </div>
        {fixed ? (
          <div className="mt-1 font-['DM_Mono'] text-[9.5px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>
            {resolution === "self-serve" ? "Solved · no ticket needed" : "Filed to the admin inbox"}
          </div>
        ) : null}
        <div className="mt-2 flex justify-center gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i <= stage ? 18 : 6, background: i <= stage ? "var(--teal)" : "var(--line-2)" }} />
          ))}
        </div>
      </div>
    </aside>
  );
}

/** Inline confirmation shown in the chat when Meera resolves an issue without filing a ticket. */
function ResolvedNote() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: "var(--teal-100)", background: "var(--teal-050)" }}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: "var(--teal)", color: "#fff" }}>
        <Icon name="check" size={18} stroke={2.4} />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-extrabold" style={{ color: "var(--teal-700)" }}>Resolved — you&apos;re all set</div>
        <div className="text-[12.5px] leading-5" style={{ color: "var(--ink-2)" }}>Meera sorted this out with self-service guidance. No ticket needed — but reach out again anytime.</div>
      </div>
    </div>
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
  const [continuing, setContinuing] = useState(false);
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

  // After Meera replies, drop any manual "keep chatting" override so a fresh closing message can
  // re-show the resolved state. The student opts back in per turn via the resolved bar.
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
  const caseLabel = caseStage.fixed ? "Resolved" : caseLabels[caseStage.stage];

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
        <DemoHeader persona="student">
          <span
            className="flex items-center gap-1.5 font-['DM_Mono'] text-[11px]"
            style={{ color: "var(--green)" }}
          >
            <span className="size-1.5 rounded-full" style={{ background: "var(--green)" }} />
            Battle mode - Mound showdown
          </span>
          <div className="ml-auto">
            <ViewToggle view={view} onChange={setView} />
          </div>
        </DemoHeader>
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
      <DemoHeader persona="student">
        <span
          className="flex items-center gap-1.5 font-['DM_Mono'] text-[11px]"
          style={{ color: "var(--green)" }}
        >
          <span className="size-1.5 rounded-full" style={{ background: "var(--green)" }} />
          Chat mode - Sentry desk
        </span>
        <div className="ml-auto">
          <ViewToggle view={view} onChange={setView} />
        </div>
      </DemoHeader>

      <div className="mx-auto grid w-full max-w-295 flex-1 grid-cols-1 gap-4 overflow-hidden px-4 py-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="flex min-h-0 flex-col overflow-hidden p-0">
          <div
            className="border-b px-5 py-4"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Pill tint="teal">Student demo</Pill>
              <Pill tint={caseStage.fixed ? "green" : "teal"}>{caseLabel}</Pill>
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
            {!sending && caseStage.resolution === "self-serve" ? <ResolvedNote /> : null}
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
        <CaseMeter {...caseStage} />
      </div>

      <div
        className="border-t bg-white p-3"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="mx-auto max-w-180">
          {caseStage.fixed && !continuing ? (
            <div
              className="flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-2.5"
              style={{ borderColor: "var(--teal-100)", background: "var(--teal-050)" }}
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full"
                style={{ background: "var(--teal)", color: "#fff" }}
              >
                <Icon name="check" size={16} stroke={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold" style={{ color: "var(--teal-700)" }}>
                  {caseStage.resolution === "ticket"
                    ? "Ticket filed — you're all set"
                    : "Resolved — you're all set"}
                </div>
                <div className="text-[12px] leading-5" style={{ color: "var(--ink-2)" }}>
                  {caseStage.resolution === "ticket"
                    ? "Staff will follow up. Need anything else?"
                    : "Meera sorted this out — no ticket needed. Need anything else?"}
                </div>
              </div>
              <Button
                variant="primary"
                className="rounded-2xl px-4"
                onClick={() => setContinuing(true)}
              >
                <Icon name="chat" size={15} />
                Continue chatting
              </Button>
            </div>
          ) : (
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
          )}
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
