"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
	DEFAULT_BOSS,
	MYSTERY_BOSS,
	pickBosses,
	type BossConfig,
} from "@/components/demo/battle-bosses";
import { HowToPlayModal } from "@/components/demo/how-to-play-modal";
import { asset, Button, Card, Icon, Pill, SpeechControl, VoiceInputControl } from "./shared";
import type { SupportConversation, SupportMessage } from "@/features/meera-support/use-support-conversation";
import type { SupportTicketResult } from "@/features/ai/ai-types";

type Target = "enemy" | "mira";

const MAX_HP = 100;
const STAGE_HP = [100, 75, 50, 25, 0] as const;
const CASE_NODES = ["Ready", "Heard", "Researched", "Diagnosed", "Packaged"] as const;
const STARTER_MOVES = [
	"My Wi-Fi will not connect.",
	"I have a registration hold.",
	"I need help from staff.",
];
const GENERAL_PREDICTION_FALLBACK_MOVES = [
	"That helped, thanks.",
	"I'm still stuck.",
	"I need staff help.",
];
const MIRA_SPRITES = {
	idle: "battle/mira-battle-idle.png",
	win: "meera-celebrate.png",
} as const;

function predictionFallbackMoves(messages: SupportMessage[], departments: string[]) {
	const latestUser = [...messages]
		.reverse()
		.find((message) => message.role === "user")
		?.content.toLowerCase() ?? "";
	const departmentText = departments.join(" ").toLowerCase();
	const context = `${departmentText} ${latestUser}`;

	if (/\b(sick|ill|fever|pain|injur\w*|medical|doctor|clinic|health|vomit\w*|dizzy)\b/.test(context)) {
		return [
			"I feel better now.",
			"I need medical attention now.",
			"Can health staff contact me?",
		];
	}
	if (/\b(wi-?fi|wifi|internet|network|login|password|device|laptop|quiz|online)\b/.test(context)) {
		return [
			"It still will not connect.",
			"I am using my laptop.",
			"That fixed my Wi-Fi.",
		];
	}
	if (/\b(register|registration|registrar|hold|deadline|course|class|enroll)\b/.test(context)) {
		return [
			"The hold is still there.",
			"My deadline is tomorrow.",
			"Who can remove the hold?",
		];
	}
	if (/\b(payment|paid|unpaid|proof|bill|billing|finance|tuition|refund|fee)\b/.test(context)) {
		return [
			"Payment still shows unpaid.",
			"I uploaded proof already.",
			"I need billing staff.",
		];
	}
	return GENERAL_PREDICTION_FALLBACK_MOVES;
}

export function BattleView({
	conversation,
}: {
	conversation: SupportConversation;
}) {
	const {
		messages,
		sending,
		error,
		draft,
		setDraft,
		sendText,
		latestTicket,
		caseStage,
		suggestedReplies,
		voice,
		speakingId,
		speak,
		reset,
	} = conversation;
	const [flash, setFlash] = useState(false);
	const [floater, setFloater] = useState<{ amount: number; key: number } | null>(null);
	const [miraHp, setMiraHp] = useState(MAX_HP);
	const [miraFlash, setMiraFlash] = useState(false);
	const [miraFloater, setMiraFloater] = useState<{ amount: number; key: number } | null>(null);
	const [combo, setCombo] = useState(0);
	const [showHelp, setShowHelp] = useState(false);
	const seqRef = useRef(0);
	const previousStageRef = useRef(caseStage.stage);
	const processedAssistantRef = useRef<string | null>(null);
	const latestAssistant = useMemo(
		() => [...messages].reverse().find((message) => message.role === "assistant"),
		[messages],
	);
	const hasStudentIssue = messages.some((message) => message.role === "user");
	const bosses = useMemo(
		() => hasStudentIssue ? pickBosses(caseStage.activeDepartments) : [MYSTERY_BOSS],
		[caseStage.activeDepartments, hasStudentIssue],
	);
	const enemyHp = STAGE_HP[caseStage.stage];
	const enemyName = bosses.length > 1 ? "THE TANGLE" : bosses[0]?.name ?? DEFAULT_BOSS.name;
	const enemyKind =
		bosses.length > 1
			? bosses.map((boss) => boss.dept).join(" + ")
			: bosses[0]?.kind ?? DEFAULT_BOSS.kind;
	const dialogue = sending
		? "Meera is sizing up the situation..."
		: latestAssistant?.content ?? "Tell Meera what is blocking you.";
	const dialogueSpeechId = `battle-dialogue-${latestAssistant?.id ?? "ready"}-${sending ? "sending" : "idle"}`;
	const moves = useMemo(
		() => suggestedReplies.length ? suggestedReplies : hasStudentIssue ? predictionFallbackMoves(messages, caseStage.activeDepartments) : STARTER_MOVES,
		[caseStage.activeDepartments, hasStudentIssue, messages, suggestedReplies],
	);
	const won = caseStage.fixed;

	useEffect(() => {
		if (caseStage.stage < previousStageRef.current) {
			previousStageRef.current = caseStage.stage;
			processedAssistantRef.current = null;
			setCombo(0);
			setFlash(false);
			setFloater(null);
			setMiraHp(MAX_HP);
			setMiraFlash(false);
			setMiraFloater(null);
		}
	}, [caseStage.stage]);

	useEffect(() => {
		if (!latestAssistant || latestAssistant.id === "welcome" || sending) return;
		if (processedAssistantRef.current === latestAssistant.id) return;
		processedAssistantRef.current = latestAssistant.id;
		const oldStage = previousStageRef.current;
		const newStage = caseStage.stage;
		previousStageRef.current = newStage;

		if (newStage > oldStage) {
			const amount = STAGE_HP[oldStage] - STAGE_HP[newStage];
			seqRef.current += 1;
			setFlash(true);
			setFloater({ amount, key: seqRef.current });
			setCombo((current) => current + 1);
			const timer = window.setTimeout(() => setFlash(false), 460);
			return () => window.clearTimeout(timer);
		}
		if (hasStudentIssue && !won) {
			const amount = caseStage.damage ? 20 : 14;
			seqRef.current += 1;
			setCombo(0);
			setMiraFlash(true);
			setMiraFloater({ amount, key: seqRef.current });
			setMiraHp((current) => Math.max(1, current - amount));
			const timer = window.setTimeout(() => setMiraFlash(false), 460);
			return () => window.clearTimeout(timer);
		}
		setCombo(0);
	}, [caseStage.damage, caseStage.stage, hasStudentIssue, latestAssistant, sending, won]);

	function submitMove(text?: string) {
		void sendText(text, { wantsSuggestedReplies: true });
	}

	return (
		<div className="relative flex min-h-0 flex-1 flex-col">
			<div
				className="battle-arena-shell relative min-h-[380px] flex-1 overflow-hidden"
				style={{
					backgroundImage: `url(${asset("battle/arena-field.png")})`,
					backgroundPosition: "center",
					backgroundSize: "cover",
				}}
			>
				<div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 72% 24%, rgba(231,155,107,.28), transparent 28%), linear-gradient(180deg, rgba(255,255,255,.06), rgba(251,246,238,.12) 64%, rgba(217,166,90,.08))" }} />
				<div className="pointer-events-none absolute inset-x-0 top-0 h-24" style={{ background: "linear-gradient(180deg, rgba(28,51,73,.18), transparent)" }} />
				<div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 120px 30px rgba(28,51,73,.16)" }} />
				<div className="pointer-events-none absolute right-[6%] top-[34%] h-5 w-40 rounded-[100%] sm:right-[10%] sm:top-[40%]" style={{ background: "radial-gradient(ellipse at center, rgba(28,51,73,.28), transparent 70%)" }} />
				<div className="pointer-events-none absolute bottom-[7%] left-[6%] h-5 w-36 rounded-[100%] sm:left-[9%]" style={{ background: "radial-gradient(ellipse at center, rgba(28,51,73,.26), transparent 70%)" }} />

				<div className="absolute left-4 top-4 z-10 w-[min(312px,66%)]">
					<NamePlate name={enemyName} level={12 + bosses.length} hp={enemyHp} side="enemy" />
					<div className="mt-1 pl-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>{enemyKind}</div>
				</div>

				<QuestTracker stage={caseStage.stage} combo={combo} fixed={caseStage.fixed} />

				<div
					className="absolute right-[3%] top-[13%] z-0 flex items-end justify-center gap-0 sm:right-[7%] sm:top-[14%]"
					style={{
						animation: flash ? "mound-shake .44s ease" : "bob 3.4s ease-in-out infinite",
					}}
				>
					{bosses.map((boss, index) => (
						<div
							key={boss.id}
							className={bosses.length > 1 ? "-mx-4 sm:-mx-5" : ""}
							style={{
								animation: bosses.length > 1 ? `bob 3.4s ease-in-out ${index * 140}ms infinite` : undefined,
								transform: bosses.length > 1 ? `scale(.78) translateY(${index % 2 ? 14 : 0}px)` : undefined,
							}}
						>
							<EnemySprite boss={boss} defeated={won} hurt={flash} />
						</div>
					))}
					{floater ? <FloatingDamage key={floater.key} amount={floater.amount} tone="enemy" /> : null}
				</div>

				<div
					className="absolute bottom-[5%] left-[4%] z-0 flex flex-col items-center sm:left-[7%]"
					style={{
						animation: miraFlash ? "mound-shake .44s ease" : undefined,
					}}
				>
					<img
						src={asset(won ? MIRA_SPRITES.win : MIRA_SPRITES.idle)}
						alt="MiRA"
						className="relative z-10 w-[132px] select-none sm:w-[200px] md:w-[228px]"
						style={{
							filter: miraFlash ? "saturate(1.15) brightness(1.03)" : "none",
							transform: miraFlash ? "scale(1.03)" : "none",
							transition: "filter .24s ease, transform .24s ease",
						}}
						draggable={false}
					/>
					{miraFloater ? <FloatingDamage key={miraFloater.key} amount={miraFloater.amount} tone="mira" /> : null}
				</div>

				<div className="absolute bottom-5 right-4 z-10 w-[min(280px,58%)] sm:w-[min(300px,62%)]">
					<NamePlate name="MiRA" level={15} hp={won ? MAX_HP : miraHp} side="mira" />
				</div>

				{won ? (
					<WinOverlay
						resolution={caseStage.resolution}
						ticket={latestTicket}
						onReset={reset}
					/>
				) : null}
				<HowToPlayModal open={showHelp} onClose={() => setShowHelp(false)} />
			</div>

			<div className="shrink-0 border-t bg-white px-4 py-3" style={{ borderColor: "var(--line)" }}>
				<div className="mx-auto max-w-[900px]">
					<div className="overflow-hidden rounded-2xl border-2" style={{ borderColor: "var(--ink)", background: "#FFFDF8", boxShadow: "0 4px 0 0 rgba(28,51,73,.14), inset 0 0 0 3px #F5ECDD" }}>
						<div className="flex items-center gap-2 border-b-2 px-4 py-1.5" style={{ borderColor: "#F0E4D2", background: "linear-gradient(180deg,#FBF3E4,#FFFDF8)" }}>
							<span className="grid size-5 place-items-center rounded-md" style={{ background: "var(--teal)", color: "#fff" }}>
								<Icon name="sparkle" size={12} stroke={2.2} />
							</span>
							<span className="font-['DM_Mono'] text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--teal-700)" }}>Meera</span>
							<button
								type="button"
								onClick={() => setShowHelp(true)}
								className="rounded-full border px-2.5 py-1 font-['DM_Mono'] text-[10px] font-bold uppercase tracking-[0.1em] transition hover:-translate-y-0.5"
								style={{ borderColor: "var(--teal-100)", color: "var(--teal-700)", background: "var(--teal-050)" }}
							>
								How to play
							</button>
							<span className="ml-auto font-['DM_Mono'] text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
								{won ? "Battle won" : `Case stage ${caseStage.stage + 1} / ${CASE_NODES.length}`}
							</span>
						</div>

						<div className="flex items-start gap-3 px-4 py-3 text-[15px] font-semibold leading-6" style={{ color: "var(--ink)" }}>
							<p className="m-0 min-w-0 flex-1">
								<span className="mr-2 inline-block" style={{ color: "var(--teal)", animation: "tdot 1s infinite" }}>▶</span>
								{dialogue}
							</p>
							<SpeechControl compact isSpeaking={speakingId === dialogueSpeechId} onClick={() => void speak(dialogueSpeechId, dialogue)} className="shrink-0" />
						</div>

						{!won ? (
							<div className="grid gap-2 border-t-2 p-3 sm:grid-cols-3" style={{ borderColor: "#F0E4D2", background: "#FFFBF2" }}>
								{moves.map((move, index) => (
									<button
										key={`${move}-${index}`}
										type="button"
										disabled={sending}
										onClick={() => submitMove(move)}
										className="group flex items-center gap-3 rounded-xl border-2 bg-white px-3.5 py-3 text-left transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_3px_0_0_rgba(28,51,73,.1)] disabled:opacity-55"
										style={{ borderColor: "var(--line-2)" }}
									>
										<span className="grid w-3 shrink-0 place-items-center text-[14px] font-[800] opacity-0 transition group-enabled:group-hover:opacity-100" style={{ color: "var(--teal)" }}>▸</span>
										<span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ background: "var(--teal-050)", color: "var(--teal-700)" }}>
											<Icon name="sword" size={15} />
										</span>
										<span className="min-w-0 flex-1">
											<span className="block text-[14px] font-bold leading-tight">{move}</span>
											<span className="font-['DM_Mono'] text-[10.5px]" style={{ color: "var(--muted)" }}>
												{hasStudentIssue ? "predicted reply" : "starter move"}
											</span>
										</span>
										<span className="grid size-5 shrink-0 place-items-center rounded-md font-['DM_Mono'] text-[10px] font-bold" style={{ background: "var(--cream-2)", color: "var(--muted)" }}>{index + 1}</span>
									</button>
								))}
							</div>
						) : null}
					</div>
				</div>
			</div>

			<div className="shrink-0 border-t bg-white p-3" style={{ borderColor: "var(--line)" }}>
				<div className="mx-auto max-w-[900px]">
					<div className="flex gap-2">
						<input
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									submitMove();
								}
							}}
							disabled={sending || won}
							className="h-11 min-w-0 flex-1 rounded-2xl border px-4 text-sm outline-none disabled:opacity-60"
							style={{ borderColor: "var(--line-2)" }}
							placeholder={voice.isRecording ? "Listening..." : "...or type your own move"}
						/>
						<VoiceInputControl compact isRecording={voice.isRecording} isTranscribing={voice.isTranscribing} onClick={voice.toggle} className="size-11 px-0" />
						<button
							type="button"
							disabled={sending || won}
							onClick={() => submitMove()}
							className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold transition enabled:hover:-translate-y-0.5 disabled:opacity-55"
							style={{ background: "var(--teal)", borderColor: "var(--teal)", color: "#fff", boxShadow: "0 10px 24px rgba(46,156,142,.22)" }}
						>
							<Icon name="arrow" size={16} />
						</button>
					</div>
					<p className="mt-2 mb-0 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>
						Type your own move anytime. Battle is real support chat underneath.
					</p>
					{error ? <p className="mt-2 mb-0 text-[11px] font-semibold" style={{ color: "var(--rose)" }}>{error}</p> : null}
					{voice.error ? <p className="mt-2 mb-0 text-[11px] font-semibold" style={{ color: "var(--rose)" }}>{voice.error}</p> : null}
				</div>
			</div>
		</div>
	);
}

function NamePlate({ name, level, hp, side }: { name: string; level: number; hp: number; side: Target }) {
	return (
		<div className="rounded-2xl border-2 bg-white/95 px-3 py-2 backdrop-blur" style={{ borderColor: "var(--ink)", boxShadow: "0 3px 0 0 rgba(28,51,73,.1)" }}>
			<div className="flex items-baseline justify-between gap-2">
				<span className="text-[13px] font-[800] tracking-tight">{name}</span>
				<span className="font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>Lv.{level}</span>
			</div>
			<HpBar hp={hp} label={side === "mira" ? "Morale" : "HP"} />
			<div className="mt-1 flex items-center justify-between">
				<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: side === "mira" ? "var(--teal-700)" : "var(--muted)" }}>{side === "mira" ? "ally" : "case progress"}</span>
				<span className="font-['DM_Mono'] text-[11px] font-medium" style={{ color: "var(--ink-2)" }}>{hp} / {MAX_HP}</span>
			</div>
		</div>
	);
}

function HpBar({ hp, label }: { hp: number; label: string }) {
	const pct = (hp / MAX_HP) * 100;
	const color = pct > 50 ? "var(--green)" : pct > 20 ? "var(--gold)" : "var(--rose)";
	return (
		<div className="mt-1.5 flex items-center gap-1.5">
			<span className="font-['DM_Mono'] text-[9px] font-bold" style={{ color: "var(--teal-700)" }}>{label}</span>
			<span className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "repeating-linear-gradient(90deg, #E9E0CF 0 15px, #DED1BD 15px 17px)", boxShadow: "inset 0 1px 2px rgba(28,51,73,.18)" }}>
				<span className="block h-full rounded-full" style={{ width: `${pct}%`, background: `repeating-linear-gradient(90deg, ${color} 0 15px, rgba(255,255,255,.45) 15px 17px)`, transition: "width .8s cubic-bezier(.3,.9,.3,1), background .4s" }} />
			</span>
		</div>
	);
}

function QuestTracker({ stage, combo, fixed }: { stage: number; combo: number; fixed: boolean }) {
	return (
		<div className="absolute left-1/2 top-3 z-20 hidden -translate-x-1/2 sm:block">
			<div className="flex items-center gap-1.5 rounded-full border bg-white/92 px-3 py-1.5 backdrop-blur" style={{ borderColor: "var(--line)", boxShadow: "var(--sh-sm)" }}>
				{CASE_NODES.map((node, index) => {
					const active = index <= stage || fixed;
					const current = !fixed && index === stage;
					return (
						<div key={node} className="flex items-center gap-1.5">
							{index > 0 ? <span className="h-px w-3 md:w-5" style={{ background: active ? "var(--teal)" : "var(--line-2)" }} /> : null}
							<span
								className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-[800]"
								style={{ background: active ? "var(--teal)" : "var(--cream-2)", color: active ? "#fff" : "var(--muted)", boxShadow: current ? "0 0 0 3px var(--teal-050)" : "none" }}
							>
								{index + 1}
							</span>
							<span className="hidden text-[11px] font-bold md:inline" style={{ color: active ? "var(--teal-700)" : "var(--muted)" }}>{node}</span>
						</div>
					);
				})}
				<span className="mx-0.5 h-3.5 w-px shrink-0" style={{ background: "var(--line-2)" }} />
				<span className="inline-flex shrink-0 items-center gap-1" title="combo">
					<Icon name="bolt" size={12} className="text-[#D9844F]" />
					<span className="text-[11px] font-[800]" style={{ color: combo > 1 ? "var(--teal-700)" : "var(--ink)" }}>{combo}x</span>
				</span>
			</div>
		</div>
	);
}

function EnemySprite({ boss, defeated, hurt }: { boss: BossConfig; defeated: boolean; hurt: boolean }) {
	const sprite = defeated ? boss.sprites.defeated : hurt ? boss.sprites.hurt : boss.sprites.idle;
	return (
		<img
			src={sprite}
			alt={defeated ? `Defeated ${boss.name}` : boss.name}
			className="relative z-10 w-[166px] select-none sm:w-[220px] md:w-[248px]"
			style={{
				filter: defeated ? "grayscale(.45) saturate(.8) opacity(.86)" : hurt ? "saturate(1.22) brightness(1.03)" : "none",
				transform: defeated ? "rotate(3deg) translateY(8px)" : hurt ? "scale(1.04)" : "none",
				transition: "filter .24s ease, transform .24s ease",
			}}
			draggable={false}
		/>
	);
}

function FloatingDamage({ amount, tone }: { amount: number; tone: Target }) {
	return (
		<span
			className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 font-[800]"
			style={{ color: tone === "enemy" ? "var(--teal-700)" : "var(--rose)", fontSize: 26, textShadow: "0 1px 0 #fff, 0 0 8px rgba(255,255,255,.8)", animation: "dmg-float 1s ease-out forwards" }}
		>
			-{amount}
		</span>
	);
}

function WinOverlay({
	resolution,
	ticket,
	onReset,
}: {
	resolution: "ticket" | "self-serve" | null;
	ticket: SupportTicketResult | null;
	onReset: () => void;
}) {
	const ticketWin = resolution === "ticket";
	return (
		<div className="absolute inset-0 z-20 grid place-items-center p-5" style={{ background: "rgba(251,246,238,.86)", backdropFilter: "blur(2px)", animation: "fadeUp .4s ease" }}>
			<Card className="w-full max-w-[460px] p-6 text-center">
				<img src={asset("meera-celebrate.png")} alt="" className="mx-auto mb-3 w-28" />
				<div className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--green)" }}>Victory</div>
				<h2 className="mt-1 text-2xl font-[800]">
					{ticketWin ? "Backup called!" : "THE SNAG defeated!"}
				</h2>
				<p className="mx-auto mt-2 max-w-sm text-sm leading-6" style={{ color: "var(--ink-2)" }}>
					{ticketWin
						? "Staff are on it. Meera filed a real ticket with the support team."
						: "Solved with self-service guidance. No ticket needed."}
				</p>
				{ticketWin && ticket ? <TicketMini ticket={ticket} /> : null}
				<div className="mt-5">
					<Button variant="primary" onClick={onReset}>
						<Icon name="refresh" size={14} />
						{ticketWin ? "New battle" : "Play again"}
					</Button>
				</div>
			</Card>
		</div>
	);
}

function TicketMini({ ticket }: { ticket: SupportTicketResult }) {
	return (
		<div className="mt-4 overflow-hidden rounded-2xl border text-left" style={{ borderColor: "var(--line-2)" }}>
			<div className="flex items-center gap-3 border-b p-3" style={{ borderColor: "var(--line)" }}>
				<span className="grid size-9 place-items-center rounded-xl" style={{ background: "var(--sand-050)", color: "var(--sand-600)" }}>
					<Icon name="ticket" size={18} stroke={2.1} />
				</span>
				<div className="min-w-0 flex-1">
					<div className="text-[13px] font-bold">{ticket.office}</div>
					<div className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>Ticket {ticket.ticketNumber}</div>
				</div>
				<Pill tint="teal">{ticket.priority}</Pill>
			</div>
			<p className="m-0 p-3 text-[12.5px] leading-6" style={{ color: "var(--ink-2)" }}>{ticket.studentFacingSummary}</p>
			<a
				href="/demo/admin/inbox"
				className="mx-3 mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold"
				style={{ borderColor: "var(--teal-100)", color: "var(--teal-700)" }}
			>
				Visible in admin <Icon name="arrow" size={13} stroke={2.2} />
			</a>
		</div>
	);
}
