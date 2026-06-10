"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSpeech, useVoiceInput } from "@/features/ai/voice";
import { asset, Button, Card, Confidence, Icon, IconChip, MeerkatMark, Pill, SpeechControl, VoiceInputControl, type IconName, type Tint } from "./shared";
import { BattleView } from "./battle";

type AdminDept = "it" | "registrar" | "health" | "studsvcs" | "finance";
type Persona = "student" | AdminDept;
type StudentView = "site" | "mound";
type AdminView = "inbox" | "insights" | "knowledge" | "routing" | "team";

const adminDepts: { id: AdminDept; label: string }[] = [
	{ id: "it", label: "IT" },
	{ id: "registrar", label: "Registrar" },
	{ id: "health", label: "Health" },
	{ id: "studsvcs", label: "Student Svcs" },
	{ id: "finance", label: "Finance" },
];

const adminNavItems: { id: AdminView; label: string; icon: IconName }[] = [
	{ id: "inbox", label: "Inbox", icon: "inbox" },
	{ id: "insights", label: "Insights", icon: "trend" },
	{ id: "knowledge", label: "Knowledge", icon: "book" },
	{ id: "routing", label: "Routing", icon: "route" },
	{ id: "team", label: "Team", icon: "users" },
];

function DemoTopBar({ children }: { children?: ReactNode }) {
	return (
		<div className="flex h-[50px] shrink-0 items-center gap-2.5 border-b bg-white px-4" style={{ borderColor: "var(--line)" }}>
			<Link href="/" className="inline-flex shrink-0 items-center gap-[7px]" aria-label="Meera home">
				<MeerkatMark size={28} />
				<span className="text-[15px] font-[800] tracking-[-0.03em]">Meera</span>
			</Link>
			{children}
		</div>
	);
}

export function StudentExperience() {
	const [studentView, setStudentView] = useState<StudentView>("site");
	const [preIssue, setPreIssue] = useState<string | null>(null);
	const [resetKey, setResetKey] = useState(0);

	const stage = useMemo(() => {
		if (studentView === "mound") return <StudentMound key={resetKey} preIssue={preIssue} />;
		return <StudentMeeraSite key={resetKey} onIssue={(issue) => { setPreIssue(issue); setStudentView("mound"); setResetKey((key) => key + 1); }} />;
	}, [preIssue, resetKey, studentView]);

	return (
		<main className="fixed inset-0 z-[100] flex flex-col" style={{ background: "var(--cream)", color: "var(--ink)" }}>
				<DemoTopBar>
					<span className="mx-1 h-[18px] w-px shrink-0" style={{ background: "var(--line-2)" }} />
					<span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>Student</span>
					<Link href="/demo/admin" className="ml-auto rounded-full border px-3 py-1.5 text-xs font-bold transition hover:bg-[#F8F5F0]" style={{ borderColor: "var(--line-2)", color: "var(--teal-700)" }}>Enter admin</Link>
				</DemoTopBar>
			<div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">{stage}</div>
		</main>
	);
}

export function AdminExperience() {
	const [adminDept, setAdminDept] = useState<AdminDept>("it");
	const [adminView, setAdminView] = useState<AdminView>("inbox");
	const [resetKey, setResetKey] = useState(0);

	function switchAdminDept(next: AdminDept) {
		setAdminDept(next);
		setResetKey((key) => key + 1);
	}

	const stage = {
		inbox: <AdminLookout key={resetKey} dept={adminDept} />,
		insights: <AdminInsights key={resetKey} dept={adminDept} />,
		knowledge: <AdminKnowledge key={resetKey} dept={adminDept} />,
		routing: <AdminCrossDept key={resetKey} dept={adminDept} />,
		team: <AdminTeam key={resetKey} dept={adminDept} />,
	}[adminView];

	return (
		<main className="fixed inset-0 z-[100] flex flex-col" style={{ background: "var(--cream)", color: "var(--ink)" }}>
			<header className="shrink-0">
				<DemoTopBar>
					<span className="mx-1 h-[18px] w-px shrink-0" style={{ background: "var(--line-2)" }} />
					<span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>Admin</span>
				</DemoTopBar>
				<AdminNav activeView={adminView} department={adminDept} onViewChange={setAdminView} onDepartmentChange={switchAdminDept} />
			</header>
			<div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">{stage}</div>
		</main>
	);
}

function AdminNav({ activeView, department, onViewChange, onDepartmentChange }: { activeView: AdminView; department: AdminDept; onViewChange: (view: AdminView) => void; onDepartmentChange: (department: AdminDept) => void }) {
	return (
		<div className="flex min-h-[54px] items-center gap-3 border-b bg-white px-3 sm:px-5" style={{ borderColor: "var(--line)" }}>
			<nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2" aria-label="Admin sections">
				{adminNavItems.map((item) => {
					const active = item.id === activeView;
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onViewChange(item.id)}
							aria-current={active ? "page" : undefined}
							className="inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] font-bold transition hover:bg-[#F8F5F0] sm:px-4"
							style={{ background: active ? "var(--teal-050)" : "transparent", borderColor: active ? "var(--teal-100)" : "transparent", color: active ? "var(--teal-700)" : "var(--ink-2)", boxShadow: active ? "inset 0 -2px 0 var(--teal)" : "none" }}
						>
							<Icon name={item.icon} size={15} stroke={active ? 2.2 : 1.8} />
							{item.label}
						</button>
					);
				})}
			</nav>
			<label className="relative flex shrink-0 items-center gap-2 rounded-xl border bg-[#FCFAF6] py-2 pl-3 pr-8 text-[12.5px] font-bold" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
				<Icon name="building" size={15} className="text-[#2E9C8E]" />
				<span className="hidden font-['DM_Mono'] text-[9px] uppercase tracking-[0.1em] lg:inline" style={{ color: "var(--muted)" }}>Department</span>
				<select
					value={department}
					onChange={(event) => onDepartmentChange(event.target.value as AdminDept)}
					className="appearance-none bg-transparent pr-1 font-bold outline-none"
					aria-label="Department"
				>
					{adminDepts.map((dept) => <option key={dept.id} value={dept.id}>{dept.label}</option>)}
				</select>
				<Icon name="chevronD" size={13} className="pointer-events-none absolute right-3" />
			</label>
		</div>
	);
}

const siteChips = ["Can't register", "Wi-Fi won't connect", "Tuition hold", "Reset my password"];

function StudentMeeraSite({ onIssue }: { onIssue: (issue: string) => void }) {
	const [value, setValue] = useState("");
	const appendTranscript = useCallback((text: string) => {
		setValue((current) => (current.trim() ? `${current} ${text}` : text));
	}, []);
	const voice = useVoiceInput(appendTranscript);
	return (
		<div className="min-h-[calc(100vh-94px)]">
			<div className="flex items-center gap-3 border-b bg-white px-5 py-3" style={{ borderColor: "var(--line)" }}>
				<span className="text-[15px] font-[800]">Northvale University</span>
				<span className="text-xl" style={{ color: "var(--line-2)" }}>·</span>
				<MeerkatMark size={24} />
				<span className="text-[13px] font-bold">powered by Meera</span>
				<span className="ml-auto hidden font-['DM_Mono'] text-[11px] sm:inline" style={{ color: "var(--muted)" }}>help.northvale.edu</span>
				<Pill tint="teal">beta</Pill>
			</div>
			<section className="mx-auto max-w-[620px] px-6 py-12 text-center md:py-16">
				<img src={asset("meera-wave.png")} alt="Meera waving" className="mx-auto mb-5 w-28" />
				<h1 className="text-4xl font-[800] leading-tight tracking-[-0.03em]">Hi! What can I help you with?</h1>
				<p className="mx-auto mt-4 max-w-xl text-base leading-7" style={{ color: "var(--ink-2)" }}>Tell me what's going on - no need to pick a department. I'll figure out who to loop in.</p>
				<Card className="mt-8 p-1 text-left" style={{ borderColor: "var(--line-2)" }}>
					<textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder={voice.isRecording ? "Listening..." : "Describe what's going on..."} className="min-h-20 w-full resize-none rounded-[22px] bg-transparent p-4 text-[15px] outline-none" />
					<div className="flex items-center justify-between gap-2 px-2 pb-2">
						<VoiceInputControl isRecording={voice.isRecording} isTranscribing={voice.isTranscribing} onClick={voice.toggle} />
						<Button variant="primary" onClick={() => onIssue(value || "I need help")}>Ask Meera <Icon name="arrow" size={15} stroke={2.2} /></Button>
					</div>
				</Card>
				{voice.error ? <p className="mt-2 text-sm font-semibold" style={{ color: "var(--rose)" }}>{voice.error}</p> : null}
				<p className="mt-7 font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>Or pick a common issue</p>
				<div className="mt-3 flex flex-wrap justify-center gap-2">
					{siteChips.map((chip) => <button key={chip} type="button" onClick={() => onIssue(chip)} className="rounded-full border bg-white px-4 py-2 text-[13px] font-bold transition hover:-translate-y-0.5" style={{ borderColor: "var(--line)" }}>{chip}</button>)}
				</div>
				<div className="mt-7 flex items-center justify-center gap-2 font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}><Icon name="shield" size={13} className="text-[#7FB85C]" /> You control what's shared · nothing leaves this tab without your say-so</div>
			</section>
		</div>
	);
}

type ChatItem = { kind: "meera" | "user" | "faq" | "checks" | "quickfix" | "identity" | "ticket" | "closer"; text?: string; delay?: number };
const diagnosticChecks = [
	{ label: "Advisor approval on file", ok: true },
	{ label: "Enrollment term selected", ok: true },
	{ label: "Course prerequisites met", ok: true },
	{ label: "Active account holds", ok: false, note: "$310 hold" },
];
const fullChat: ChatItem[] = [
	{ kind: "meera", text: "Hi. Tell me what is going on in your own words. No department to pick.", delay: 0 },
	{ kind: "user", text: "I cannot register for classes and the deadline is tomorrow. I am panicking.", delay: 1200 },
	{ kind: "meera", text: "I hear you. Deadline pressure is real. I will look at this right now.", delay: 900 },
	{ kind: "faq", delay: 800 },
	{ kind: "meera", text: "One quick question: is Submit greyed out, or do you see an error?", delay: 1100 },
	{ kind: "user", text: "It is completely greyed out.", delay: 1200 },
	{ kind: "checks", delay: 700 },
	{ kind: "meera", text: "Found it. A $310 financial hold is locking Submit. This is not a form issue on your end.", delay: 1600 },
	{ kind: "quickfix", delay: 650 },
	{ kind: "identity", delay: 400 },
	{ kind: "meera", text: "Thanks, Alex. I have packaged everything the Bursar's Office needs. Creating your ticket now.", delay: 1000 },
	{ kind: "ticket", delay: 650 },
	{ kind: "closer", delay: 450 },
];

type MoundView = "classic" | "battle";

function StudentMound({ preIssue }: { preIssue: string | null }) {
	const [view, setView] = useState<MoundView>("classic");
	const [count, setCount] = useState(0);
	const [checks, setChecks] = useState(0);
	const [fixChoice, setFixChoice] = useState<"fixed" | "stuck" | null>(null);
	const [damage, setDamage] = useState(false);
	const [replyDraft, setReplyDraft] = useState("");
	const { speakingId, speak } = useSpeech();
	const appendReplyTranscript = useCallback((text: string) => {
		setReplyDraft((current) => (current.trim() ? `${current} ${text}` : text));
	}, []);
	const voice = useVoiceInput(appendReplyTranscript);
	const script = useMemo(() => preIssue ? fullChat.map((item, index) => index === 1 ? { ...item, text: preIssue } : item) : fullChat, [preIssue]);
	const qIndex = script.findIndex((item) => item.kind === "quickfix");
	const scrollRef = useAutoScroll<HTMLDivElement>([count, checks, fixChoice]);
	useScriptAdvance(view === "classic" ? script : [], count, setCount, count > qIndex && fixChoice !== "stuck");
	useEffect(() => {
		const checksIndex = script.findIndex((item) => item.kind === "checks");
		if (count > checksIndex && checks < diagnosticChecks.length) {
			const timer = window.setTimeout(() => setChecks((value) => value + 1), 560);
			return () => window.clearTimeout(timer);
		}
	}, [checks, count, script]);
	useEffect(() => {
		if (fixChoice === "stuck") {
			setDamage(true);
			const timer = window.setTimeout(() => setDamage(false), 1600);
			return () => window.clearTimeout(timer);
		}
	}, [fixChoice]);
	const stage = getMoundStage(count, fixChoice, qIndex);
	const visible = script.slice(0, count);
	const showTyping = count < script.length && script[count]?.kind === "meera" && !(count > qIndex && fixChoice !== "stuck");

	return (
		<div className="flex min-h-[calc(100vh-94px)] flex-col">
			<div className="flex items-center gap-3 border-b bg-white px-5 py-3" style={{ borderColor: "var(--line)" }}>
				<MeerkatMark size={38} />
				<div className="min-w-0 flex-1"><div className="font-bold">Meera</div><div className="flex items-center gap-1.5 font-['DM_Mono'] text-[11px]" style={{ color: "var(--green)" }}><span className="size-1.5 rounded-full" style={{ background: "var(--green)" }} />{view === "battle" ? "Mound Battle - turn-based mode" : "Case meter - live progress"}</div></div>
				<ModeToggle view={view} onChange={setView} />
			</div>
			{view === "battle" ? (
				<BattleView />
			) : (
				<>
					<div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_280px]">
						<div ref={scrollRef} className="mx-auto flex w-full max-w-[720px] flex-col gap-3 overflow-y-auto px-4 py-5">
							{visible.map((item, index) => <ChatRender key={index} item={item} checksShown={checks} onFixChoice={setFixChoice} fixChoice={fixChoice} speakId={`classic-${index}`} speakingId={speakingId} onSpeak={(id, text) => void speak(id, text)} />)}
							{fixChoice === "fixed" && count > qIndex ? <ResolvedState /> : null}
							{showTyping ? <Typing /> : null}
						</div>
						<CaseMeter stage={stage} damage={damage} fixed={fixChoice === "fixed"} />
					</div>
					<div className="border-t bg-white p-3" style={{ borderColor: "var(--line)" }}>
						<div className="mx-auto max-w-[720px]">
							<div className="flex gap-2">
								<textarea value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} className="h-11 min-w-0 flex-1 resize-none rounded-2xl border px-4 py-2 text-sm outline-none" style={{ borderColor: "var(--line-2)" }} placeholder={voice.isRecording ? "Listening..." : "Reply to Meera..."} />
								<VoiceInputControl compact isRecording={voice.isRecording} isTranscribing={voice.isTranscribing} onClick={voice.toggle} className="size-11 px-0" />
								<Button variant="primary" className="rounded-2xl px-4"><Icon name="arrow" size={16} /></Button>
							</div>
							{voice.error ? <p className="mt-2 mb-0 text-[11px] font-semibold" style={{ color: "var(--rose)" }}>{voice.error}</p> : null}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

function ModeToggle({ view, onChange }: { view: MoundView; onChange: (next: MoundView) => void }) {
	const options: { id: MoundView; label: string; icon: IconName }[] = [
		{ id: "classic", label: "Classic", icon: "sparkle" },
		{ id: "battle", label: "Battle", icon: "sword" },
	];
	return (
		<div className="flex shrink-0 gap-0.5 rounded-full p-[3px]" style={{ background: "var(--cream-2)" }} role="tablist" aria-label="Chat mode">
			{options.map((option) => {
				const active = view === option.id;
				return (
					<button
						key={option.id}
						type="button"
						role="tab"
						aria-selected={active}
						onClick={() => onChange(option.id)}
						className="inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-[12.5px] font-bold transition"
						style={{ background: active ? "#fff" : "transparent", color: active ? "var(--teal-700)" : "var(--muted)", boxShadow: active ? "var(--sh-sm)" : "none" }}
					>
						<Icon name={option.icon} size={13} />
						<span className="hidden sm:inline">{option.label}</span>
					</button>
				);
			})}
		</div>
	);
}

function useScriptAdvance(script: ChatItem[], count: number, setCount: (next: number | ((current: number) => number)) => void, paused = false) {
	useEffect(() => {
		if (paused || count >= script.length) return;
		const item = script[count];
		const timer = window.setTimeout(() => setCount((current) => current + 1), item.delay ?? 1000);
		return () => window.clearTimeout(timer);
	}, [count, paused, script, setCount]);
}

function useAutoScroll<T extends HTMLElement>(deps: unknown[]) {
	const ref = useRef<T | null>(null);
	useEffect(() => {
		if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
	return ref;
}

type SpeakHandler = (id: string, text: string) => void;
type SpeakProps = { speakId?: string; speakingId?: string | null; onSpeak?: SpeakHandler; speakText?: string };

function OutputSpeech({ speakId, speakingId, onSpeak, speakText }: SpeakProps) {
	const text = speakText?.trim();
	if (!speakId || !onSpeak || !text) return null;
	return <SpeechControl isSpeaking={speakingId === speakId} onClick={() => onSpeak(speakId, text)} />;
}

function ChatRender({ item, checksShown, onFixChoice, fixChoice, compact = false, speakId, speakingId, onSpeak }: { item: ChatItem; checksShown: number; onFixChoice?: (choice: "fixed" | "stuck") => void; fixChoice?: "fixed" | "stuck" | null; compact?: boolean } & SpeakProps) {
	if (item.kind === "user") return <Bubble side="right" compact={compact}>{item.text}</Bubble>;
	if (item.kind === "meera") return <Bubble side="left" compact={compact} speakId={speakId} speakingId={speakingId} onSpeak={onSpeak} speakText={item.text}>{item.text}</Bubble>;
	if (item.kind === "faq") return <FaqCard compact={compact} />;
	if (item.kind === "checks") return <ChecksCard shown={checksShown} compact={compact} />;
	if (item.kind === "quickfix") return <QuickFixCard onChoice={(choice) => onFixChoice?.(choice)} choice={fixChoice ?? null} />;
	if (item.kind === "identity" && fixChoice === "stuck") return <IdentityCard />;
	if (item.kind === "ticket") return <TicketCard compact={compact} />;
	if (item.kind === "closer" && fixChoice === "stuck") return <HandoffCloser />;
	if (item.kind === "closer" && fixChoice === "fixed") return <ResolvedState />;
	return null;
}

function Bubble({ side, children, compact = false, speakId, speakingId, onSpeak, speakText }: { side: "left" | "right"; children: ReactNode; compact?: boolean } & SpeakProps) {
	const right = side === "right";
	return <div className={`flex ${right ? "justify-end" : "justify-start"}`} style={{ animation: "fadeUp .3s ease" }}><div className={`${compact ? "max-w-[84%] px-3 py-2 text-xs" : "max-w-[78%] px-4 py-3 text-sm"} leading-6 shadow-sm`} style={{ borderRadius: right ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: right ? "var(--ink)" : "#fff", color: right ? "#fff" : "var(--ink)", border: right ? "none" : "1px solid var(--line)" }}><div>{children}</div>{right ? null : <div className="mt-2"><OutputSpeech speakId={speakId} speakingId={speakingId} onSpeak={onSpeak} speakText={speakText} /></div>}</div></div>;
}

function FaqCard({ compact = false }: { compact?: boolean }) {
	return <Card className={compact ? "p-3" : "p-4"}><div className="mb-2 flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}><Icon name="book" size={13} className="text-[#2E9C8E]" />From knowledge base</div><div className="text-sm font-bold">Why is my Submit button greyed out?</div><p className="mt-1 text-sm leading-6" style={{ color: "var(--ink-2)" }}>Registration Submit is usually locked by a financial hold, a missing document, or pending advisor sign-off. All three must be clear before submission.</p><div className="mt-3 flex flex-wrap items-center gap-2"><Pill tint="teal"><Icon name="book" size={11} />IT Knowledge Base - 3 sources</Pill><Confidence value={94} /></div></Card>;
}

function ChecksCard({ shown, compact = false }: { shown: number; compact?: boolean }) {
	return <Card className={compact ? "p-3" : "p-4"}><div className="mb-3 flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}><Icon name="sparkle" size={13} className="text-[#2E9C8E]" />Running diagnostics</div><div className="grid gap-2">{diagnosticChecks.map((check, index) => <div key={check.label} className="flex items-center gap-2 text-sm transition-opacity" style={{ opacity: index < shown ? 1 : .35 }}><span className="grid size-[18px] place-items-center rounded-full" style={{ background: index >= shown ? "#EEE7DA" : check.ok ? "var(--green-050)" : "#FBE7E0", color: check.ok ? "var(--green)" : "var(--rose)" }}>{index < shown ? <Icon name={check.ok ? "check" : "alert"} size={11} stroke={2.4} /> : null}</span><span className="font-medium">{check.label}</span>{index < shown && check.note ? <span className="ml-auto rounded-full px-2 py-0.5 font-['DM_Mono'] text-[11px]" style={{ background: "#FBE7E0", color: "#C0532F" }}>{check.note}</span> : null}</div>)}</div></Card>;
}

function QuickFixCard({ onChoice, choice }: { onChoice: (choice: "fixed" | "stuck") => void; choice: "fixed" | "stuck" | null }) {
	useEffect(() => {
		if (choice) return;
		const timer = window.setTimeout(() => onChoice("stuck"), 3300);
		return () => window.clearTimeout(timer);
	}, [choice, onChoice]);
	return <Card className="p-4"><div className="mb-3 text-sm font-bold">Did this help?</div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => !choice && onChoice("fixed")} className="rounded-xl border p-3 text-sm font-bold" style={{ borderColor: choice === "fixed" ? "var(--green)" : "var(--line-2)", background: choice === "fixed" ? "var(--green-050)" : "#fff", color: choice === "fixed" ? "#5E9438" : "var(--ink-2)" }}>Yes, sorted</button><button type="button" onClick={() => !choice && onChoice("stuck")} className="rounded-xl border p-3 text-sm font-bold" style={{ borderColor: choice === "stuck" ? "var(--sand-600)" : "var(--line-2)", background: choice === "stuck" ? "var(--sand-050)" : "#fff", color: choice === "stuck" ? "var(--sand-600)" : "var(--ink-2)" }}>Still stuck</button></div>{choice === "stuck" ? <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>Escalating with full context.</p> : null}</Card>;
}

function IdentityCard() {
	const [done, setDone] = useState(false);
	useEffect(() => {
		const timer = window.setTimeout(() => setDone(true), 1200);
		return () => window.clearTimeout(timer);
	}, []);
	return <Card className="p-4"><div className="mb-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Quick check</div><div className="mb-3 text-sm font-bold">What is your university email or student ID?</div><div className="flex items-center gap-2"><input value={done ? "alex.rivera@northvale.edu" : ""} readOnly placeholder="your@university.edu" className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none" style={{ borderColor: done ? "var(--teal)" : "var(--line-2)" }} />{done ? <Icon name="check" size={18} className="text-[#2E9C8E]" /> : null}</div><div className="mt-2 flex items-center gap-1.5 font-['DM_Mono'] text-[10px]" style={{ color: "var(--green)" }}><Icon name="shield" size={12} />this tab only - you control what is shared</div></Card>;
}

function TicketCard({ compact = false }: { compact?: boolean }) {
	return <Card className="overflow-hidden p-0" style={{ borderColor: "var(--line-2)" }}><div className="flex items-center gap-3 border-b p-4" style={{ borderColor: "var(--line)" }}><IconChip name="ticket" tint="sand" size={compact ? 32 : 40} /><div className="flex-1"><div className="text-sm font-bold">Registration blocked by financial hold</div><div className="font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>#NV-4827 - created by Meera - just now</div></div><Pill tint="rose">High urgency</Pill></div><div className="grid gap-3 p-4 text-[13px] leading-6" style={{ color: "var(--ink-2)" }}><Meta label="AI summary">Student cannot submit Fall 2026 registration. Submit is disabled by an active $310 financial hold. Transcript and term are valid.</Meta><div className="grid gap-3 sm:grid-cols-2"><Meta label="Routed to">Bursar's Office</Meta><Meta label="Attached context">Session transcript + screen state</Meta></div><Meta label="Attempted by Meera">FAQ lookup, diagnostics, hold detection, identity capture.</Meta><Meta label="Suggested next step">Clear or collect the $310 balance, then notify Registrar to re-enable registration.</Meta></div></Card>;
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
	return <p><span className="block font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>{label}</span>{children}</p>;
}

function HandoffCloser() {
	return <div className="rounded-2xl border p-4" style={{ background: "var(--teal-050)", borderColor: "var(--teal-100)" }}><div className="flex gap-3"><img src={asset("meera-wave.png")} alt="" className="size-14 object-contain" /><div><div className="text-sm font-bold">Handed to the Bursar's Office</div><p className="mt-1 text-sm leading-6" style={{ color: "var(--ink-2)" }}>You will hear back by email. No need to explain again; everything is documented.</p><div className="mt-1 font-['DM_Mono'] text-[11px]" style={{ color: "var(--teal-700)" }}>Ticket #NV-4827 - created just now</div></div></div></div>;
}

function ResolvedState() {
	return <div className="py-6 text-center" style={{ animation: "fadeUp .45s ease" }}><img src={asset("meera-celebrate.png")} alt="" className="mx-auto mb-3 w-24" /><div className="text-xl font-[800]">Glad that is sorted.</div><p className="mx-auto mt-2 max-w-sm text-sm leading-6" style={{ color: "var(--ink-2)" }}>No ticket needed. The FAQ-sourced fix was confirmed.</p></div>;
}

function Typing() {
	return <div className="flex justify-start"><div className="flex gap-1 rounded-[4px_16px_16px_16px] border bg-white px-4 py-3" style={{ borderColor: "var(--line)" }}>{[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full" style={{ background: "var(--muted)", animation: `tdot 1s ${i * .14}s infinite` }} />)}</div></div>;
}

const caseLabels = ["Ready", "Student heard", "Researched", "Diagnosed", "Case packaged"];
const moundLayers: { label: string; icon: IconName; note: string }[] = [
	{ label: "Student heard", icon: "chat", note: "issue captured" },
	{ label: "Researched", icon: "book", note: "knowledge base checked" },
	{ label: "Diagnosed", icon: "sparkle", note: "root cause found" },
	{ label: "Case packaged", icon: "ticket", note: "ready to resolve" },
];

function getMoundStage(count: number, fixChoice: "fixed" | "stuck" | null, qIndex: number) {
	if (fixChoice === "fixed" || count > qIndex + 2) return 4;
	if (count >= 8) return 3;
	if (count >= 4) return 2;
	if (count >= 1) return 1;
	return 0;
}

function CaseMeter({ stage, damage, fixed }: { stage: number; damage: boolean; fixed: boolean }) {
	const conf = [0, 34, 61, 84, 97][stage] ?? 0;
	const r = 46;
	const circle = 2 * Math.PI * r;
	const ringColor = damage ? "var(--sand)" : fixed ? "var(--green)" : "var(--teal)";
	return (
		<aside className="hidden w-[280px] shrink-0 flex-col gap-5 border-l p-5 lg:flex" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, var(--teal-050), #fff 58%)" }}>
			<div className="flex items-center justify-between">
				<span className="font-['DM_Mono'] text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: "var(--teal-700)" }}>Case meter</span>
				<Pill tint={fixed ? "green" : "teal"}>{fixed ? "Resolved" : "Live"}</Pill>
			</div>

			{/* Progress ring */}
			<div className="relative mx-auto size-[136px]">
				<svg width="136" height="136" viewBox="0 0 116 116" className="size-full">
					<circle cx="58" cy="58" r={r} fill="none" stroke="var(--cream-3)" strokeWidth="11" />
					<circle cx="58" cy="58" r={r} fill="none" stroke={ringColor} strokeWidth="11" strokeLinecap="round" strokeDasharray={circle} strokeDashoffset={circle * (1 - conf / 100)} transform="rotate(-90 58 58)" style={{ transition: "stroke-dashoffset .95s cubic-bezier(.2,.9,.3,1), stroke .4s" }} />
				</svg>
				<div className="absolute inset-0 grid place-items-center text-center">
					{fixed ? (
						<img src={asset("meera-celebrate.png")} alt="" className="w-14" style={{ animation: "bob 2.4s ease-in-out infinite" }} />
					) : (
						<div>
							<div className="text-[30px] font-[800] leading-none" style={{ color: damage ? "var(--sand-600)" : "var(--teal-700)" }}>{conf}<span className="text-base">%</span></div>
							<div className="mt-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>complete</div>
						</div>
					)}
				</div>
			</div>

			{/* Steps */}
			<div className="grid gap-1.5">
				{moundLayers.map((layer, index) => {
					const done = index < stage;
					const isCurrent = index === stage - 1;
					const isDamage = damage && isCurrent;
					const bg = isDamage ? "var(--sand-050)" : done ? "var(--teal-050)" : "#fff";
					const border = isDamage ? "#F3D2C6" : done ? "var(--teal-100)" : "var(--line)";
					return (
						<div
							key={layer.label}
							className="flex items-center gap-2.5 rounded-2xl border px-3 py-2 transition-all"
							style={{ background: bg, borderColor: border, opacity: done ? 1 : 0.55, animation: isDamage ? "mound-shake .7s ease" : isCurrent ? "mound-layer-in .5s ease" : "none" }}
						>
							<span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ background: isDamage ? "var(--sand)" : done ? "var(--teal)" : "var(--cream-2)", color: done || isDamage ? "#fff" : "var(--muted)" }}>
								<Icon name={isDamage ? "alert" : done ? "check" : layer.icon} size={14} stroke={2.2} />
							</span>
							<div className="min-w-0">
								<div className="text-[12.5px] font-bold leading-tight" style={{ color: done ? "var(--ink)" : "var(--muted)" }}>{layer.label}</div>
								<div className="font-['DM_Mono'] text-[9.5px]" style={{ color: "var(--muted)" }}>{layer.note}</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Status */}
			<div className="mt-auto rounded-2xl border bg-white/70 p-3 text-center" style={{ borderColor: "var(--line)" }}>
				<div className="text-[13px] font-bold" style={{ color: damage ? "var(--sand-600)" : stage >= 4 ? "var(--teal-700)" : "var(--ink-2)" }}>{damage ? "Regrouping…" : caseLabels[stage]}</div>
				<div className="mt-2 flex justify-center gap-1.5">{[1, 2, 3, 4].map((i) => <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i <= stage ? 18 : 6, background: i <= stage ? "var(--teal)" : "var(--line-2)" }} />)}</div>
			</div>
		</aside>
	);
}

type Ticket = { id: string; title: string; dept: string; urgency: "High" | "Medium" | "Low"; tag: string; summary: string; solution: string; conf: number; steps: string[]; cross?: { from: string; to: string; note: string } };
type DeptData = { label: string; resolved: string; tickets: Ticket[]; recurring: { label: string; count: number; trend: string; tint: Tint; down?: boolean }[]; kb: { title: string; reason: string; status: "new" | "draft" }[] };

const deptData: Record<Exclude<Persona, "student">, DeptData> = {
	it: {
		label: "IT - Help Desk",
		resolved: "68%",
		tickets: [
			{ id: "NV-4826", title: "VPN fails on managed laptops after update", dept: "IT - Network", urgency: "High", tag: "Network", summary: "23 students report VPN disconnects immediately after the 14.2 client push. Pattern indicates a misconfigured MDM profile.", solution: "Roll back VPN client to 14.1 for affected fleet and push corrected MDM profile. Draft comms are ready.", conf: 92, steps: ["Confirmed 14.2 was pushed 4 hours ago", "Correlated timeline with 23 tickets", "Identified affected device list"], cross: { from: "IT - Network", to: "Endpoint Mgmt", note: "Rollback requires an MDM profile change." } },
			{ id: "NV-4825", title: "Password reset emails not arriving for alumni", dept: "IT - Identity", urgency: "Medium", tag: "Accounts", summary: "Reset emails to alumni addresses are bouncing at the relay.", solution: "Whitelist alumni relay domain and resend resets for 14 users.", conf: 95, steps: ["Reset service logs are clean", "Bounces trace to relay filter", "14 addresses identified"] },
			{ id: "NV-4824", title: "Floor-3 print queue stuck", dept: "IT - Print", urgency: "Low", tag: "Hardware", summary: "PRT-3B has 47 stuck jobs. Network spool service hung.", solution: "Remote restart spooler and requeue recent jobs.", conf: 97, steps: ["Queue stuck since 09:14", "Spooler not responding", "12 recent jobs can be restored"] },
		],
		recurring: [{ label: "VPN / network drops", count: 27, trend: "+9%", tint: "teal" }, { label: "Password resets", count: 21, trend: "-6%", tint: "green", down: true }, { label: "Printer issues", count: 14, trend: "+3%", tint: "sand" }],
		kb: [{ title: "Fix VPN drops after 14.2 update", reason: "23 tickets this week", status: "draft" }, { title: "Alumni relay troubleshooting", reason: "asked 14x this month", status: "new" }],
	},
	registrar: {
		label: "Registrar",
		resolved: "74%",
		tickets: [
			{ id: "NV-4831", title: "Financial hold blocks course registration", dept: "Registrar", urgency: "High", tag: "Holds", summary: "Student cannot submit Fall 2026 registration; Submit is disabled by an active $310 financial hold. Transcript and term are valid.", solution: "Coordinate with Bursar to clear hold; Meera will re-notify student and re-enable the guided submission flow.", conf: 97, steps: ["Confirmed Submit button locked", "Identified $310 hold", "Transcript and term valid"], cross: { from: "Registrar", to: "Bursar's Office", note: "Registrar cannot re-enable registration until Finance clears the hold." } },
			{ id: "NV-4830", title: "Enrollment term shows wrong year", dept: "Registrar", urgency: "Medium", tag: "Data", summary: "Portal shows 2025 for 38 students enrolled for 2026.", solution: "Re-run Fall 2026 enrollment sync for affected cohort.", conf: 89, steps: ["38 students affected", "Last sync incomplete", "Re-sync ETA 2 hours"] },
			{ id: "NV-4829", title: "Transcript requests stuck at Processing", dept: "Registrar", urgency: "Low", tag: "Records", summary: "6 transcript requests have been processing for over 48 hours.", solution: "Action manual review flags and release stuck requests.", conf: 91, steps: ["6 requests over 48 hours", "Manual flag raised", "No technical blocker"] },
		],
		recurring: [{ label: "Financial holds", count: 38, trend: "+14%", tint: "sand" }, { label: "Enrollment data errors", count: 12, trend: "+3%", tint: "teal" }, { label: "Transcript delays", count: 9, trend: "-4%", tint: "green", down: true }],
		kb: [{ title: "Clear a financial hold before registration", reason: "asked 38x this week", status: "new" }, { title: "Enrollment sync error FAQ", reason: "12 tickets from data error", status: "draft" }],
	},
	finance: {
		label: "Finance / Bursar",
		resolved: "63%",
		tickets: [
			{ id: "NV-4827", title: "$310 hold blocking course registration", dept: "Bursar's Office", urgency: "High", tag: "Holds", summary: "Student cannot submit Fall 2026 registration due to active $310 balance. Account otherwise in good standing.", solution: "Waive or collect the $310 balance; confirm with Registrar to re-enable registration.", conf: 97, steps: ["Confirmed $310 balance", "Hold auto-applied at 48h overdue", "Deadline is tomorrow at 5 pm"], cross: { from: "Bursar's Office", to: "Registrar", note: "Registration re-enable depends on hold clearance." } },
			{ id: "NV-4833", title: "Aid disbursement 3 days late", dept: "Bursar's Office", urgency: "High", tag: "Aid", summary: "14 disbursements delayed due to missing certification from Financial Aid.", solution: "Expedite missing certifications and release disbursements.", conf: 88, steps: ["14 pending since Monday", "Certification missing", "3 students at risk today"] },
			{ id: "NV-4834", title: "Tuition refund not processed", dept: "Bursar's Office", urgency: "Low", tag: "Refunds", summary: "Withdrawal was inside refund window, but refund not initiated.", solution: "Process refund manually and confirm bank details.", conf: 94, steps: ["Withdrawal confirmed Day 2", "Inside full-refund window", "Refund missed in queue"] },
		],
		recurring: [{ label: "Financial holds", count: 38, trend: "+14%", tint: "sand" }, { label: "Aid disbursements", count: 14, trend: "+22%", tint: "rose" }, { label: "Refund requests", count: 8, trend: "-2%", tint: "green", down: true }],
		kb: [{ title: "Financial hold clearance process", reason: "recurring peak", status: "new" }, { title: "Aid disbursement guide", reason: "14 cases this week", status: "draft" }],
	},
	health: {
		label: "Health Services",
		resolved: "81%",
		tickets: [
			{ id: "NV-4840", title: "MyHealth booking returning 504 errors", dept: "Health Services", urgency: "High", tag: "Portal", summary: "Booking portal returns 504 errors for about 40% of users during semester-start load.", solution: "Scale MyHealth web tier; route students to phone booking at x4400 meanwhile.", conf: 93, steps: ["Errors started at 08:40", "40% attempts failing", "Phone fallback works"] },
			{ id: "NV-4839", title: "Health clearance form missing fields", dept: "Health Services", urgency: "Medium", tag: "Forms", summary: "3 required immunization fields were removed in the last form update.", solution: "Restore fields and notify students to re-submit.", conf: 96, steps: ["Fields removed in v4.2", "200+ submissions affected", "No data loss expected"] },
			{ id: "NV-4838", title: "Insurance waiver rejects valid submissions", dept: "Health Services", urgency: "Low", tag: "Insurance", summary: "Validation rejects out-of-state insurance plans.", solution: "Patch validation to accept out-of-state formats.", conf: 90, steps: ["18 rejections found", "All out-of-state", "Regex too strict"] },
		],
		recurring: [{ label: "Portal / booking errors", count: 17, trend: "+11%", tint: "rose" }, { label: "Form issues", count: 9, trend: "+4%", tint: "sand" }, { label: "Insurance queries", count: 6, trend: "-8%", tint: "teal", down: true }],
		kb: [{ title: "MyHealth booking fallback guide", reason: "17 portal errors", status: "draft" }, { title: "Immunization clearance FAQ", reason: "200+ incomplete submissions", status: "new" }],
	},
	studsvcs: {
		label: "Student Services",
		resolved: "77%",
		tickets: [
			{ id: "NV-4845", title: "Reprinted ID cards not activating", dept: "Student Services", urgency: "High", tag: "ID Access", summary: "Reprinted ID cards for 8 students are failing on building readers after vendor encoding changed.", solution: "Re-encode affected cards after Facilities updates reader firmware.", conf: 90, steps: ["8 cards failing", "Vendor updated encoding", "Reader firmware needs v3"], cross: { from: "Student Services", to: "Facilities", note: "Building readers need a firmware update first." } },
			{ id: "NV-4844", title: "Commuter lounge WiFi drops", dept: "Student Services", urgency: "Medium", tag: "Facilities", summary: "AP-COMM-02 drops every 20 minutes due to channel conflict.", solution: "Coordinate with IT Networking to reconfigure the access point.", conf: 87, steps: ["14 students report drops", "Logs show 22 min cycle", "Adjacent AP on same channel"] },
			{ id: "NV-4843", title: "Financial aid form rejects SSNs", dept: "Student Services", urgency: "Low", tag: "Forms", summary: "Form rejects SSNs starting with zero.", solution: "Patch validation regex; guide students to PDF route meanwhile.", conf: 88, steps: ["5 rejections per day", "Leading-zero SSNs", "Validation confirmed incorrect"] },
		],
		recurring: [{ label: "ID access issues", count: 16, trend: "+8%", tint: "sand" }, { label: "Facilities / WiFi", count: 12, trend: "+5%", tint: "teal" }, { label: "General inquiries", count: 31, trend: "-3%", tint: "green", down: true }],
		kb: [{ title: "Student ID activation guide", reason: "new vendor encoding", status: "new" }, { title: "WiFi troubleshooting for common areas", reason: "12 cases", status: "draft" }],
	},
};

function AdminLookout({ dept }: { dept: Exclude<Persona, "student"> }) {
	const data = deptData[dept];
	const [selected, setSelected] = useState(0);
	const ticket = data.tickets[selected];
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex items-center gap-3 border-b bg-white px-5 py-3" style={{ borderColor: "var(--line)" }}><IconChip name="eye" tint="teal" size={30} /><span className="font-[800]">Meera Lookout</span><Pill>{data.label}</Pill><span className="ml-auto font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>{data.tickets.length} open - needs review</span></div>
			<div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] md:overflow-hidden">
				<div className="border-r bg-white" style={{ borderColor: "var(--line)" }}><div className="flex items-center justify-between px-4 py-3"><span className="text-sm font-bold">Ticket queue</span><span className="font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>urgency down</span></div>{data.tickets.map((item, index) => <QueueButton key={item.id} ticket={item} active={index === selected} onClick={() => setSelected(index)} />)}</div>
				<AdminDetail ticket={ticket} />
			</div>
		</div>
	);
}

function AdminInsights({ dept }: { dept: Exclude<Persona, "student"> }) {
	const data = deptData[dept];
	const averageConfidence = Math.round(data.tickets.reduce((total, ticket) => total + ticket.conf, 0) / data.tickets.length);
	return (
		<AdminPageShell eyebrow="Operations pulse" title={`${data.label} insights`} description="Patterns worth acting on, separated from the live ticket queue so review stays focused.">
			<div className="grid gap-3 sm:grid-cols-3">
				<MetricCard label="Resolved by Meera" value={data.resolved} note="without a human this week" tint="teal" />
				<MetricCard label="Needs review" value={String(data.tickets.length)} note="open tickets in this queue" tint="sand" />
				<MetricCard label="AI confidence" value={`${averageConfidence}%`} note="average across open tickets" tint="green" />
			</div>
			<Card className="mt-5 overflow-hidden p-0">
				<div className="flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: "var(--line)" }}><IconChip name="trend" tint="teal" size={34} /><div><div className="font-[800]">Recurring issues</div><p className="text-xs" style={{ color: "var(--muted)" }}>Compared with the previous seven days</p></div></div>
				<div className="grid md:grid-cols-3">
					{data.recurring.map((item) => <div key={item.label} className="border-b p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0" style={{ borderColor: "var(--line)" }}><div className="mb-5 flex items-center justify-between"><span className="size-2.5 rounded-full" style={{ background: `var(--${item.tint})` }} /><span className="font-['DM_Mono'] text-xs font-medium" style={{ color: item.down ? "var(--green)" : "var(--rose)" }}>{item.trend}</span></div><div className="text-3xl font-[800]">{item.count}</div><div className="mt-1 text-sm font-bold">{item.label}</div></div>)}
				</div>
			</Card>
		</AdminPageShell>
	);
}

function AdminKnowledge({ dept }: { dept: Exclude<Persona, "student"> }) {
	const data = deptData[dept];
	return (
		<AdminPageShell eyebrow="Knowledge studio" title={`${data.label} knowledge`} description="Turn repeated questions into clear, reusable guidance for students and staff.">
			<div className="grid gap-4 lg:grid-cols-2">
				{data.kb.map((item, index) => <Card key={item.title} className="group p-5 transition hover:-translate-y-0.5"><div className="flex items-start gap-4"><IconChip name="book" tint={index === 0 ? "teal" : "sand"} size={42} /><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><Pill tint={item.status === "new" ? "teal" : "sand"}>{item.status}</Pill><span className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>{item.reason}</span></div><h2 className="text-base font-[800] leading-snug">{item.title}</h2><p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-2)" }}>Meera found a repeatable answer pattern in this department&apos;s recent conversations.</p><Button className="mt-4">Review article <Icon name="arrow" size={14} /></Button></div></div></Card>)}
			</div>
		</AdminPageShell>
	);
}

function AdminTeam({ dept }: { dept: Exclude<Persona, "student"> }) {
	const data = deptData[dept];
	return (
		<AdminPageShell eyebrow="Queue ownership" title={`${data.label} team`} description="A quick view of who owns the work currently surfaced by Meera.">
			<div className="grid gap-4 lg:grid-cols-3">
				{data.tickets.map((ticket, index) => <Card key={ticket.id} className="p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full font-[800]" style={{ background: index === 0 ? "var(--teal-050)" : index === 1 ? "var(--sand-050)" : "var(--green-050)", color: "var(--ink)" }}>{ticket.dept.split(/[\s-]/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("")}</span><div className="min-w-0"><div className="truncate text-sm font-[800]">{ticket.dept}</div><div className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>owns #{ticket.id}</div></div></div><div className="my-4 h-px" style={{ background: "var(--line)" }} /><p className="text-sm font-bold leading-6">{ticket.title}</p><div className="mt-4 flex items-center justify-between"><Pill tint="teal">{ticket.tag}</Pill><Urgency urgency={ticket.urgency} /></div></Card>)}
			</div>
		</AdminPageShell>
	);
}

function AdminPageShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
	return <div className="mx-auto w-[min(1100px,calc(100%_-_2rem))] py-7 sm:py-9"><p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>{eyebrow}</p><h1 className="mt-2 text-3xl font-[800] tracking-[-0.03em]">{title}</h1><p className="mb-6 mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--ink-2)" }}>{description}</p>{children}</div>;
}

function MetricCard({ label, value, note, tint }: { label: string; value: string; note: string; tint: Tint }) {
	return <Card className="relative overflow-hidden p-5"><span className="absolute inset-y-0 left-0 w-1" style={{ background: `var(--${tint})` }} /><p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>{label}</p><div className="mt-2 text-4xl font-[800] tracking-[-0.04em]">{value}</div><p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{note}</p></Card>;
}

function QueueButton({ ticket, active, onClick }: { ticket: Ticket; active: boolean; onClick: () => void }) {
	return <button type="button" onClick={onClick} className="block w-full border-t px-4 py-3 text-left transition" style={{ borderColor: "var(--line)", background: active ? "var(--teal-050)" : "transparent", borderLeft: active ? "3px solid var(--teal)" : "3px solid transparent" }}><div className="mb-1 flex items-center gap-2"><span className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>#{ticket.id}</span><span className="ml-auto"><Urgency urgency={ticket.urgency} /></span></div><div className="text-[13px] font-bold leading-snug">{ticket.title}</div><div className="mt-2 flex items-center gap-2"><Pill tint="teal"><Icon name="sparkle" size={10} />{ticket.tag}</Pill></div></button>;
}

function Urgency({ urgency }: { urgency: Ticket["urgency"] }) {
	if (urgency === "High") return <Pill tint="rose">High</Pill>;
	if (urgency === "Medium") return <Pill tint="sand">Medium</Pill>;
	return <Pill>Low</Pill>;
}

function AdminDetail({ ticket }: { ticket: Ticket }) {
	return <section className="overflow-y-auto bg-[#FCFAF6] p-5"><div className="mb-5 flex items-start gap-3"><IconChip name="ticket" tint="sand" size={44} /><div className="flex-1"><h1 className="text-xl font-[800] leading-tight">{ticket.title}</h1><p className="font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>#{ticket.id} · routed to {ticket.dept}</p></div><Confidence value={ticket.conf} label="AI confidence" /></div><AdminBlock icon="sparkle" label="AI-GENERATED SUMMARY">{ticket.summary}</AdminBlock><AdminBlock icon="layers" label="ATTEMPTED BY MEERA"><ul className="grid gap-1 pl-4">{ticket.steps.map((step) => <li key={step}>{step}</li>)}</ul></AdminBlock><AdminBlock icon="wand" label="SUGGESTED SOLUTION"><p>{ticket.solution}</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="primary"><Icon name="check" size={14} />Approve &amp; send</Button><Button>Edit</Button><Button><Icon name="flag" size={14} />Escalate</Button></div></AdminBlock>{ticket.cross ? <div className="mt-3 flex gap-3 rounded-2xl border p-4" style={{ background: "#FBE7E0", borderColor: "#F3D2C6", color: "#8A4A33" }}><Icon name="alert" size={20} /><div><div className="font-bold">Cross-department dependency</div><p className="mt-1 text-sm leading-6"><strong>{ticket.cross.from} → {ticket.cross.to}.</strong> {ticket.cross.note}</p></div></div> : null}</section>;
}

function AdminBlock({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
	return <div className="mb-4"><div className="mb-2 flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}><Icon name={icon} size={13} className="text-[#2E9C8E]" />{label}</div><div className="text-sm leading-6" style={{ color: "var(--ink-2)" }}>{children}</div></div>;
}

const workflows: Record<Exclude<Persona, "student">, { ticket: string; title: string; desc: string; steps: { dept: string; icon: IconName; tint: Tint; action: string }[] }> = {
	it: { ticket: "NV-4826", title: "VPN rollback needs MDM profile", desc: "Meera flagged a dependency: the VPN rollback requires an MDM profile change that Endpoint Mgmt owns.", steps: [{ dept: "IT - Network", icon: "bolt", tint: "teal", action: "Roll back VPN client to 14.1 on 23 devices" }, { dept: "Endpoint Mgmt", icon: "plug", tint: "sand", action: "Push corrected MDM profile to affected fleet" }, { dept: "Meera auto", icon: "sparkle", tint: "green", action: "Re-notify students when VPN is restored" }] },
	registrar: { ticket: "NV-4831", title: "Hold clearance requires Finance first", desc: "Registration cannot be re-enabled until the financial hold is cleared.", steps: [{ dept: "Finance / Bursar", icon: "building", tint: "gold", action: "Clear $310 financial hold" }, { dept: "Registrar", icon: "doc", tint: "teal", action: "Re-enable course registration Submit" }, { dept: "Meera auto", icon: "sparkle", tint: "green", action: "Re-notify student to complete registration" }] },
	finance: { ticket: "NV-4827", title: "Finance clears hold, Registrar reopens registration", desc: "Once Finance clears the hold, Registrar re-enables submission and Meera closes the loop.", steps: [{ dept: "Finance / Bursar", icon: "building", tint: "gold", action: "Clear $310 hold and confirm to Registrar" }, { dept: "Registrar", icon: "doc", tint: "teal", action: "Re-enable registration" }, { dept: "Meera auto", icon: "sparkle", tint: "green", action: "Notify student to submit" }] },
	health: { ticket: "NV-4840", title: "Portal outage needs Health and IT", desc: "IT scales the web tier while Health manages student comms and phone routing.", steps: [{ dept: "IT - Infra", icon: "bolt", tint: "teal", action: "Scale MyHealth web tier" }, { dept: "Health Services", icon: "headset", tint: "sand", action: "Redirect students to phone booking at x4400" }, { dept: "Meera auto", icon: "sparkle", tint: "green", action: "Update students when portal returns" }] },
	studsvcs: { ticket: "NV-4845", title: "ID encoding fix needs Facilities first", desc: "New ID cards will not activate until Facilities updates reader firmware.", steps: [{ dept: "Facilities", icon: "building", tint: "gold", action: "Update building reader firmware to v3" }, { dept: "Student Services", icon: "users", tint: "teal", action: "Re-encode 8 ID cards" }, { dept: "Meera auto", icon: "sparkle", tint: "green", action: "Notify students when cards are active" }] },
};

function AdminCrossDept({ dept }: { dept: Exclude<Persona, "student"> }) {
	const workflow = workflows[dept];
	const [approved, setApproved] = useState(false);
	const [sent, setSent] = useState(-1);
	function approve() {
		setApproved(true);
		workflow.steps.forEach((_, index) => window.setTimeout(() => setSent(index), (index + 1) * 520));
	}
	return <div className="mx-auto w-[min(980px,calc(100%_-_2rem))] py-8"><p className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--teal-700)" }}>Cross-dept workflow · Ticket #{workflow.ticket}</p><h1 className="mt-3 text-3xl font-[800] tracking-normal">{workflow.title}</h1><p className="mt-3 max-w-2xl leading-7" style={{ color: "var(--ink-2)" }}>{workflow.desc}</p><Card className="mt-7 overflow-x-auto p-6"><p className="mb-6 font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>PROPOSED RESOLUTION SEQUENCE</p><div className="flex min-w-[700px] items-start">{workflow.steps.map((step, index) => <div key={step.action} className="flex flex-1 items-start"><CrossStep step={step} index={index} sent={sent >= index} />{index < workflow.steps.length - 1 ? <div className="mt-8 h-0.5 flex-1" style={{ background: sent >= index ? "var(--teal)" : "var(--line-2)" }} /> : null}</div>)}</div></Card>{!approved ? <div className="mt-5 flex flex-wrap gap-2"><Button variant="primary" onClick={approve}><Icon name="check" size={15} />Approve workflow</Button><Button>Edit steps</Button><Button><Icon name="users" size={15} />Reassign owner</Button></div> : <SharedTimeline workflow={workflow} sent={sent} />}</div>;
}

function CrossStep({ step, index, sent }: { step: { dept: string; icon: IconName; tint: Tint; action: string }; index: number; sent: boolean }) {
	return <div className="w-[190px] shrink-0 text-center"><div className="relative mx-auto mb-3 grid size-16 place-items-center rounded-full border-2 bg-white" style={{ borderColor: sent ? "var(--teal)" : "var(--line-2)" }}><IconChip name={step.icon} tint={sent ? "teal" : step.tint} size={40} />{sent ? <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full text-white" style={{ background: "var(--teal)" }}><Icon name="check" size={10} stroke={2.4} /></span> : null}</div><div className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>{index + 1}. {step.dept}</div><p className="mx-auto mt-2 max-w-[170px] text-sm font-bold leading-5" style={{ color: sent ? "var(--teal-700)" : "var(--ink)" }}>{step.action}</p>{sent ? <Pill tint="teal">sub-task sent</Pill> : null}</div>;
}

function SharedTimeline({ workflow, sent }: { workflow: (typeof workflows)[Exclude<Persona, "student">]; sent: number }) {
	return <><div className="mt-5 flex gap-3 rounded-2xl border p-4" style={{ background: "var(--teal-050)", borderColor: "var(--teal-100)" }}><Icon name="check" size={18} className="text-[#2E9C8E]" /><div><div className="font-bold">Workflow approved — sub-tasks sent to each team</div><p className="text-sm" style={{ color: "var(--ink-2)" }}>Each department sees their step and can track the shared timeline as it progresses.</p></div></div><Card className="mt-4 p-5"><p className="mb-4 font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>SHARED TIMELINE — visible to all departments</p><div className="grid gap-2">{workflow.steps.map((step, index) => <div key={step.action} className="flex items-center gap-3 rounded-xl border p-3" style={{ background: sent >= index ? "var(--teal-050)" : "#F8F5F0", borderColor: sent >= index ? "var(--teal-100)" : "var(--line)" }}><span className="grid size-8 place-items-center rounded-full text-white" style={{ background: sent >= index ? "var(--teal)" : "var(--line-2)" }}>{index + 1}</span><div className="flex-1"><div className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>{step.dept}</div><div className="text-sm font-bold">{step.action}</div></div><Pill tint={sent >= index ? "teal" : "default"}>{sent >= index ? "notified ✓" : `waiting on step ${index}`}</Pill></div>)}</div></Card></>;
}
