"use client";

import { useRef, useState, type ReactNode } from "react";
import { asset, Button, Card, Icon, IconChip, Pill } from "./shared";

// --- Hardcoded quest -------------------------------------------------------
// This is a pure frontend mockup: no AI, no backend. Each step is one "turn".
// A correct move damages the enemy; a blocked/wrong move damages MiRA.

type Target = "enemy" | "mira";
type Choice = {
	label: string;
	hint: string;
	target: Target;
	dmg: number;
	say: string;
	advance: boolean;
};
type Step = { prompt: string; choices: Choice[] };

const ENEMY = { name: "THE HOLD", level: 12, kind: "Bureaucracy / Cobra type" };
const MAX_HP = 100;
const ENEMY_SPRITES = {
	idle: "battle/cobra-idle.png",
	attack: "battle/cobra-attack.png",
	hurt: "battle/cobra-hurt.png",
	defeated: "battle/cobra-defeated.png",
} as const;
const MIRA_SPRITES = {
	idle: "battle/mira-battle-idle.png",
	win: "meera-celebrate.png",
} as const;

const QUEST: Step[] = [
	{
		prompt: "A wild THE HOLD blocks the way to your grades! Where do your grades actually live?",
		choices: [
			{ label: "Open the student portal", hint: "the right place to start", target: "enemy", dmg: 24, say: "You open the portal — it's super effective!", advance: true },
			{ label: "Dig through your email", hint: "probably a dead end", target: "mira", dmg: 14, say: "Nothing useful there. The Hold lashes back!", advance: false },
		],
	},
	{
		prompt: "Good. Now prove it's really you.",
		choices: [
			{ label: "Log in with your student ID", hint: "use your real credentials", target: "enemy", dmg: 24, say: "Logged in! The Hold flinches.", advance: true },
			{ label: "Guess the password a few times", hint: "risky", target: "mira", dmg: 14, say: "Locked out for 5 minutes. Ouch.", advance: false },
		],
	},
	{
		prompt: "You're in. Open the 'My Grades' page…",
		choices: [
			{ label: "Click 'My Grades'", hint: "go for it", target: "mira", dmg: 20, say: "A $310 FINANCIAL HOLD slams the page shut — it hits MiRA!", advance: true },
			{ label: "Email the registrar and wait", hint: "deadline is tomorrow", target: "mira", dmg: 10, say: "Days would pass. The deadline looms — that stings.", advance: false },
		],
	},
	{
		prompt: "Meera found the real blocker: a $310 hold. Clear it to break through.",
		choices: [
			{ label: "Pay the $310 hold now", hint: "removes the blocker", target: "enemy", dmg: 34, say: "Hold cleared! A critical hit!", advance: true },
			{ label: "Ignore it and retry", hint: "won't help", target: "mira", dmg: 16, say: "Still blocked. The Hold tightens its grip.", advance: false },
		],
	},
	{
		prompt: "The page is unlocking. Finish it!",
		choices: [
			{ label: "Load my grades", hint: "the finishing move", target: "enemy", dmg: 40, say: "Grades loaded — THE HOLD is defeated!", advance: true },
			{ label: "Refresh five times in a panic", hint: "patience", target: "mira", dmg: 12, say: "Impatience hurts. Take a breath.", advance: false },
		],
	},
];

type Phase = "playing" | "won" | "lost";

export function BattleView() {
	const [enemyHp, setEnemyHp] = useState(MAX_HP);
	const [miraHp, setMiraHp] = useState(MAX_HP);
	const [stepIndex, setStepIndex] = useState(0);
	const [dialogue, setDialogue] = useState(QUEST[0].prompt);
	const [phase, setPhase] = useState<Phase>("playing");
	const [busy, setBusy] = useState(false);
	const [flash, setFlash] = useState<Target | null>(null);
	const [floater, setFloater] = useState<{ target: Target; amount: number; key: number } | null>(null);
	const seqRef = useRef(0);

	const step = QUEST[stepIndex];
	const enemySprite = phase === "won" ? ENEMY_SPRITES.defeated : flash === "enemy" ? ENEMY_SPRITES.hurt : flash === "mira" ? ENEMY_SPRITES.attack : ENEMY_SPRITES.idle;

	function reset() {
		setEnemyHp(MAX_HP);
		setMiraHp(MAX_HP);
		setStepIndex(0);
		setDialogue(QUEST[0].prompt);
		setPhase("playing");
		setBusy(false);
		setFlash(null);
		setFloater(null);
	}

	function play(choice: Choice) {
		if (busy || phase !== "playing") return;
		setBusy(true);
		setDialogue(choice.say);
		setFlash(choice.target);
		seqRef.current += 1;
		setFloater({ target: choice.target, amount: choice.dmg, key: seqRef.current });
		window.setTimeout(() => setFlash(null), 440);
		window.setTimeout(() => {
			if (choice.target === "enemy") setEnemyHp((hp) => Math.max(0, hp - choice.dmg));
			else setMiraHp((hp) => Math.max(0, hp - choice.dmg));
		}, 340);
		window.setTimeout(() => {
			if (choice.target === "enemy" && enemyHp - choice.dmg <= 0) {
				setPhase("won");
				setBusy(false);
				return;
			}
			if (choice.target === "mira" && miraHp - choice.dmg <= 0) {
				setPhase("lost");
				setBusy(false);
				return;
			}
			if (choice.advance) {
				const next = stepIndex + 1;
				setStepIndex(next);
				setDialogue(QUEST[next]?.prompt ?? "Victory is near…");
			}
			setBusy(false);
		}, 1000);
	}

	return (
		<div className="relative flex min-h-0 flex-1 flex-col">
			{/* Arena */}
			<div
				className="relative min-h-[330px] flex-1 overflow-hidden"
				style={{
					backgroundImage: `url(${asset("battle/arena-field.png")})`,
					backgroundPosition: "center",
					backgroundSize: "cover",
				}}
			>
				<div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(251,246,238,.12) 64%, rgba(217,166,90,.08))" }} />

				{/* Enemy info — top left */}
				<div className="absolute left-4 top-4 z-10 w-[min(300px,62%)]">
					<NamePlate name={ENEMY.name} level={ENEMY.level} hp={enemyHp} side="enemy" />
					<div className="mt-1 pl-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>{ENEMY.kind}</div>
				</div>

				{/* Enemy sprite — top right */}
				<div
					className="absolute right-[3%] top-[13%] z-0 flex flex-col items-center sm:right-[7%] sm:top-[14%]"
					style={{
						animation: flash === "enemy" ? "mound-shake .44s ease" : flash === "mira" ? undefined : "bob 3.4s ease-in-out infinite",
						transform: flash === "mira" ? "translateX(-18px) rotate(-2deg)" : undefined,
						transition: "transform .18s ease",
					}}
				>
					<div className="relative grid place-items-center">
						<EnemySprite sprite={enemySprite} defeated={phase === "won"} attacking={flash === "mira"} />
					</div>
					{floater?.target === "enemy" ? <FloatingDamage key={floater.key} amount={floater.amount} tone="enemy" /> : null}
				</div>

				{/* MiRA sprite — bottom left */}
				<div className="absolute bottom-[5%] left-[4%] z-0 flex flex-col items-center sm:left-[7%]" style={{ animation: flash === "mira" ? "mound-shake .44s ease" : "none" }}>
					<div className="relative grid place-items-center">
						<img
							src={asset(phase === "won" ? MIRA_SPRITES.win : MIRA_SPRITES.idle)}
							alt="MiRA"
							className="relative z-10 w-[132px] select-none sm:w-[200px] md:w-[228px]"
							style={{ filter: flash === "mira" ? "drop-shadow(0 0 0 #fff) saturate(1.6) hue-rotate(-12deg)" : "none", transition: "filter .2s" }}
							draggable={false}
						/>
						{floater?.target === "mira" ? <FloatingDamage key={floater.key} amount={floater.amount} tone="mira" /> : null}
					</div>
				</div>

				{/* MiRA info — bottom right */}
				<div className="absolute bottom-5 right-4 z-10 w-[min(280px,58%)] sm:w-[min(300px,62%)]">
					<NamePlate name="MiRA" level={15} hp={miraHp} side="mira" />
				</div>

				{phase === "won" ? <WinOverlay onReset={reset} /> : null}
				{phase === "lost" ? <LoseOverlay onReset={reset} /> : null}
			</div>

			{/* Dialogue box */}
			<div className="shrink-0 border-t bg-white px-4 py-3" style={{ borderColor: "var(--line)" }}>
				<div className="mx-auto max-w-[900px]">
					<div className="relative rounded-2xl border-2 px-4 py-3 text-[15px] font-semibold leading-6" style={{ borderColor: "var(--ink)", background: "#FFFDF8", color: "var(--ink)", boxShadow: "0 4px 0 0 rgba(28,51,73,.14), inset 0 0 0 3px #F5ECDD" }}>
						<span className="mr-2 inline-block" style={{ color: "var(--teal)", animation: "tdot 1s infinite" }}>▶</span>
						{dialogue}
					</div>

					{/* Command box — multiple choice */}
					{phase === "playing" ? (
						<div className="mt-3 grid gap-2 sm:grid-cols-2">
							{step.choices.map((choice) => (
								<button
									key={choice.label}
									type="button"
									disabled={busy}
									onClick={() => play(choice)}
									className="group flex items-center gap-3 rounded-xl border-2 bg-white px-3.5 py-3 text-left transition enabled:hover:-translate-y-0.5 disabled:opacity-55"
									style={{ borderColor: "var(--line-2)" }}
								>
									<span className="grid size-7 shrink-0 place-items-center rounded-lg" style={{ background: choice.target === "enemy" ? "var(--teal-050)" : "var(--sand-050)", color: choice.target === "enemy" ? "var(--teal-700)" : "var(--sand-600)" }}>
										<Icon name={choice.target === "enemy" ? "sword" : "shield"} size={15} />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block text-[14px] font-bold leading-tight">{choice.label}</span>
										<span className="font-['DM_Mono'] text-[10.5px]" style={{ color: "var(--muted)" }}>{choice.hint}</span>
									</span>
								</button>
							))}
						</div>
					) : null}
				</div>
			</div>

			{/* Chat input stays at the bottom */}
			<div className="shrink-0 border-t bg-white p-3" style={{ borderColor: "var(--line)" }}>
				<div className="mx-auto flex max-w-[900px] gap-2">
					<input className="h-11 min-w-0 flex-1 rounded-2xl border px-4 text-sm outline-none" style={{ borderColor: "var(--line-2)" }} placeholder="…or type your own move" />
					<Button variant="primary" className="rounded-2xl px-4"><Icon name="arrow" size={16} /></Button>
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
			<HpBar hp={hp} />
			<div className="mt-1 flex items-center justify-between">
				<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: side === "mira" ? "var(--teal-700)" : "var(--muted)" }}>{side === "mira" ? "you" : "enemy"}</span>
				<span className="font-['DM_Mono'] text-[11px] font-medium" style={{ color: "var(--ink-2)" }}>{hp} / {MAX_HP}</span>
			</div>
		</div>
	);
}

function HpBar({ hp }: { hp: number }) {
	const pct = (hp / MAX_HP) * 100;
	const color = pct > 50 ? "var(--green)" : pct > 20 ? "var(--gold)" : "var(--rose)";
	return (
		<div className="mt-1.5 flex items-center gap-1.5">
			<span className="font-['DM_Mono'] text-[9px] font-bold" style={{ color: "var(--teal-700)" }}>HP</span>
			<span className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "repeating-linear-gradient(90deg, #E9E0CF 0 15px, #DED1BD 15px 17px)", boxShadow: "inset 0 1px 2px rgba(28,51,73,.18)" }}>
				<span className="block h-full rounded-full" style={{ width: `${pct}%`, background: `repeating-linear-gradient(90deg, ${color} 0 15px, rgba(255,255,255,.45) 15px 17px)`, transition: "width .8s cubic-bezier(.3,.9,.3,1), background .4s" }} />
			</span>
		</div>
	);
}

function EnemySprite({ sprite, defeated, attacking }: { sprite: string; defeated: boolean; attacking: boolean }) {
	return (
		<img
			src={asset(sprite)}
			alt={defeated ? "Defeated cobra boss" : "The Hold cobra boss"}
			className="relative z-10 w-[166px] select-none sm:w-[220px] md:w-[248px]"
			style={{
				filter: defeated ? "grayscale(.45) saturate(.8) opacity(.86)" : attacking ? "saturate(1.16)" : "none",
				transform: defeated ? "rotate(3deg) translateY(8px)" : attacking ? "scale(1.04)" : "none",
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

function WinOverlay({ onReset }: { onReset: () => void }) {
	return (
		<div className="absolute inset-0 z-20 grid place-items-center p-5" style={{ background: "rgba(251,246,238,.86)", backdropFilter: "blur(2px)", animation: "fadeUp .4s ease" }}>
			<Card className="w-full max-w-[440px] p-6 text-center">
				<img src={asset("meera-celebrate.png")} alt="" className="mx-auto mb-3 w-28" />
				<div className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--green)" }}>Victory</div>
				<h2 className="mt-1 text-2xl font-[800]">Issue resolved!</h2>
				<p className="mx-auto mt-2 max-w-xs text-sm leading-6" style={{ color: "var(--ink-2)" }}>THE HOLD is defeated. Your grades are unlocked — no human needed.</p>
				<div className="mt-4 flex flex-wrap justify-center gap-2">
					<Pill tint="green"><Icon name="check" size={11} />Grades unlocked</Pill>
					<Pill tint="teal"><Icon name="sparkle" size={11} />Solved by Meera</Pill>
				</div>
				<div className="mt-5"><Button variant="primary" onClick={onReset}><Icon name="refresh" size={14} />Play again</Button></div>
			</Card>
		</div>
	);
}

function LoseOverlay({ onReset }: { onReset: () => void }) {
	return (
		<div className="absolute inset-0 z-20 grid place-items-center p-5" style={{ background: "rgba(28,41,59,.42)", backdropFilter: "blur(2px)", animation: "fadeUp .4s ease" }}>
			<Card className="w-full max-w-[460px] p-6 text-center">
				<img src={asset("meera-clipboard.png")} alt="" className="mx-auto mb-3 w-24 opacity-90" />
				<div className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--rose)" }}>MiRA fainted</div>
				<h2 className="mt-1 text-2xl font-[800]">Let&apos;s get a human on this</h2>
				<p className="mx-auto mt-2 max-w-sm text-sm leading-6" style={{ color: "var(--ink-2)" }}>No worries — Meera packaged everything and escalated it for you.</p>
				<TicketStub />
				<div className="mt-5"><Button onClick={onReset}><Icon name="refresh" size={14} />Try again</Button></div>
			</Card>
		</div>
	);
}

function TicketStub(): ReactNode {
	return (
		<div className="mt-4 overflow-hidden rounded-2xl border text-left" style={{ borderColor: "var(--line-2)" }}>
			<div className="flex items-center gap-3 border-b p-3" style={{ borderColor: "var(--line)" }}>
				<IconChip name="ticket" tint="sand" size={34} />
				<div className="flex-1">
					<div className="text-[13px] font-bold">Registration blocked by financial hold</div>
					<div className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>#NV-4827 · routed to Registrar · just now</div>
				</div>
				<Pill tint="rose">High</Pill>
			</div>
			<p className="p-3 text-[12.5px] leading-6" style={{ color: "var(--ink-2)" }}>Student cannot view grades — a $310 financial hold is blocking access. Identity verified; full transcript attached.</p>
		</div>
	);
}
