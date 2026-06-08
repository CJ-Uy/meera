import Image from "next/image";
import MeerorDemoClient from "@/components/MeerorDemoClient";

const asset = (name: string) => `/assets/${name}`;

const wrap = "mx-auto w-[min(1120px,calc(100%_-_2rem))]";
const section = "py-16 md:py-20";
const eyebrow =
	"font-['DM_Mono'] text-[11px] font-medium uppercase tracking-[0.12em]";
const cardStyle = {
	background: "#fff",
	border: "1px solid var(--line)",
	borderRadius: 24,
	boxShadow: "0 4px 8px rgba(28,51,73,.05), 0 30px 60px -22px rgba(28,51,73,.22)",
};

const iconPaths = {
	arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
	alert: <path d="M12 4l9 16H3zM12 10v4M12 17.5v.01" />,
	bolt: <path d="M13 3L5 13h5l-1 8 8-10h-5z" />,
	book: <path d="M5 5.5A1.5 1.5 0 016.5 4H19v15H6.5A1.5 1.5 0 005 20.5zM19 16H6.5A1.5 1.5 0 005 17.5" />,
	building: <path d="M5 21V5a1 1 0 011-1h7a1 1 0 011 1v16M14 9h4a1 1 0 011 1v11M3 21h18M8 8h2M8 12h2M8 16h2" />,
	chat: <path d="M4 5.5h16v10H9l-4 3.5v-3.5H4z" />,
	check: <path d="M5 12.5l4.2 4.2L19 7" />,
	chevronD: <path d="M6 9l6 6 6-6" />,
	clock: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 7.5V12l3 2" />,
	cursor: <path d="M5 4l14 7-6 1.6L10 18z" />,
	doc: <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6" />,
	eye: <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z M12 15a3 3 0 100-6 3 3 0 000 6z" />,
	flag: <path d="M6 21V4M6 4h11l-2 4 2 4H6" />,
	globe: <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.4 3.8 5.6 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.6-3.8-9S9.5 5.4 12 3z" />,
	headset: <path d="M4 13v-1a8 8 0 1116 0v1M4 13a2 2 0 012 2v2a2 2 0 01-4 0v-2a2 2 0 012-2zM20 13a2 2 0 00-2 2v2a2 2 0 004 0v-2a2 2 0 00-2-2zM18 17v1.5a2.5 2.5 0 01-2.5 2.5H13" />,
	inbox: <path d="M4 13l2.5-7h11L20 13v6H4zM4 13h5l1.5 2.5h3L15 13h5" />,
	layers: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 16.5l9 5 9-5" />,
	lock: <path d="M6 11h12v9H6zM9 11V8a3 3 0 016 0v3M12 15v2" />,
	plug: <path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 01-10 0zM12 16v5" />,
	route: <path d="M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V11a4 4 0 014-4h8" />,
	shield: <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z M9 12l2 2 4-4" />,
	sparkle: <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
	ticket: <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v1.5a2 2 0 000 5V16a2 2 0 01-2 2H6a2 2 0 01-2-2v-1.5a2 2 0 000-5z M13 7v10" />,
	trend: <path d="M4 17l5-5 3 3 7-7M15 8h5v5" />,
	users: <path d="M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3.5 19a5.5 5.5 0 0111 0M16 5.5a3.5 3.5 0 010 7M17 14c2.2.5 3.5 2.2 3.5 5" />,
	wand: <path d="M5 19l9-9M14 7l3-3 1 1-3 3zM17 4l.5-1.5M20 6l1.5-.5M19 9l1.5.5" />,
} as const;

type IconName = keyof typeof iconPaths;
type Tint = "teal" | "sand" | "gold" | "green" | "ink" | "rose";

function Icon({ name, size = 20, stroke = 1.7 }: { name: IconName; size?: number; stroke?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={stroke}
			aria-hidden="true"
		>
			{iconPaths[name]}
		</svg>
	);
}

function LogoMark({ size = 36 }: { size?: number }) {
	return (
		<span
			className="inline-flex shrink-0 items-end justify-center overflow-hidden"
			style={{
				width: size,
				height: size,
				borderRadius: "36% 36% 42% 42%/40% 40% 44% 44%",
				background: "linear-gradient(160deg,#FBEADD,#F4D9C2)",
				border: "1.5px solid #EBC9A8",
				boxShadow: "inset 0 -2px 6px rgba(217,132,79,.12)",
			}}
		>
			<Image
				src={asset("meera-avatar.png")}
				alt=""
				width={96}
				height={96}
				aria-hidden="true"
				className="mb-[-6%] w-[112%] max-w-none translate-x-[1%]"
			/>
		</span>
	);
}

function IconChip({ name, tint = "teal", size = 44 }: { name: IconName; tint?: Tint; size?: number }) {
	const map: Record<Tint, [string, string]> = {
		teal: ["var(--teal-050)", "var(--teal-700)"],
		sand: ["var(--sand-050)", "var(--sand-600)"],
		gold: ["var(--gold-050)", "#A9781F"],
		green: ["var(--green-050)", "#5E9438"],
		ink: ["#EAEFF3", "var(--ink)"],
		rose: ["#FBE7E0", "#C0532F"],
	};
	const [bg, color] = map[tint];

	return (
		<span
			className="inline-flex shrink-0 items-center justify-center"
			style={{ width: size, height: size, borderRadius: 13, background: bg, color }}
		>
			<Icon name={name} size={Math.round(size / 2)} stroke={1.9} />
		</span>
	);
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<a
			href={href}
			className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(46,156,142,.22)] transition hover:-translate-y-0.5"
			style={{ background: "var(--teal)" }}
		>
			{children}
		</a>
	);
}

function GhostButton({
	href,
	children,
	dark = false,
}: {
	href: string;
	children: React.ReactNode;
	dark?: boolean;
}) {
	return (
		<a
			href={href}
			className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-[1.5px] px-6 text-sm font-bold transition hover:-translate-y-0.5"
			style={{
				background: dark ? "rgba(255,255,255,.1)" : "#fff",
				borderColor: dark ? "rgba(255,255,255,.25)" : "var(--line)",
				color: dark ? "#fff" : "var(--ink)",
			}}
		>
			{children}
		</a>
	);
}

function SectionIntro({
	eyebrowText,
	title,
	lede,
	sand = false,
	align = "center",
}: {
	eyebrowText: string;
	title: string;
	lede: string;
	sand?: boolean;
	align?: "center" | "left";
}) {
	const centered = align === "center";
	return (
		<div className={centered ? "mx-auto mb-11 max-w-3xl text-center" : "mb-9 max-w-xl"}>
			<p className={`${eyebrow} mb-4`} style={{ color: sand ? "var(--sand-600)" : "var(--teal-700)" }}>
				{eyebrowText}
			</p>
			<h2 className="text-3xl font-[800] leading-tight tracking-normal md:text-5xl" style={{ color: "var(--ink)" }}>
				{title}
			</h2>
			<p className="mx-auto mt-4 max-w-2xl text-base leading-8 md:text-lg" style={{ color: "var(--muted)" }}>
				{lede}
			</p>
		</div>
	);
}

function Confidence({ value = 97, label = "confidence" }: { value?: number; label?: string }) {
	return (
		<span className="inline-flex items-center gap-2">
			<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--muted)" }}>
				{label}
			</span>
			<span className="h-1.5 w-14 overflow-hidden rounded-full bg-[#E7EEEC]">
				<span
					className="block h-full rounded-full"
					style={{ width: `${value}%`, background: "linear-gradient(90deg,var(--teal),var(--green))" }}
				/>
			</span>
			<span className="font-['DM_Mono'] text-[11px] font-medium" style={{ color: "var(--teal-700)" }}>
				{value}%
			</span>
		</span>
	);
}

function FeatureGrid({
	items,
	columns = "lg:grid-cols-4",
}: {
	items: { icon: IconName; tint: Tint; title: string; text: string }[];
	columns?: string;
}) {
	return (
		<div className={`mt-10 grid gap-5 sm:grid-cols-2 ${columns}`}>
			{items.map((item) => (
				<div key={item.title} className="rounded-[24px] border bg-white p-6" style={{ borderColor: "var(--line)" }}>
					<IconChip name={item.icon} tint={item.tint} />
					<h3 className="mt-4 text-[17px] font-[800]" style={{ color: "var(--ink)" }}>
						{item.title}
					</h3>
					<p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
						{item.text}
					</p>
				</div>
			))}
		</div>
	);
}

function Nav() {
	const links = [
		["Meeror", "#meeror"],
		["Handoff", "#handoff"],
		["Lookout", "#lookout"],
		["Use cases", "#usecases"],
	] as const;

	return (
		<header
			className="sticky top-0 z-50 border-b"
			style={{
				background: "rgba(251,246,238,.86)",
				backdropFilter: "saturate(180%) blur(12px)",
				borderColor: "var(--line)",
			}}
		>
			<div className={`${wrap} flex h-[70px] items-center gap-5`}>
				<a href="#top" className="inline-flex items-center gap-2.5" aria-label="Meera home">
					<LogoMark />
					<span className="text-[22px] font-[800] tracking-normal" style={{ color: "var(--ink)" }}>
						Meera
					</span>
				</a>
				<nav className="ml-1 hidden items-center gap-1 lg:flex">
					{links.map(([label, href]) => (
						<a
							key={label}
							href={href}
							className="rounded-full px-3 py-2 text-[14.5px] font-semibold"
							style={{ color: "var(--ink-2)" }}
						>
							{label}
						</a>
					))}
				</nav>
				<span className="flex-1" />
				<a href="/demo" className="hidden text-[14.5px] font-semibold sm:inline" style={{ color: "var(--ink-2)" }}>
					Sign in
				</a>
				<a href="/demo" className="rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ background: "var(--teal)" }}>
					Book a demo
				</a>
			</div>
		</header>
	);
}

function FloatingChip({
	children,
	className = "",
	tint = "var(--line)",
	bobDelay = "0s",
}: {
	children: React.ReactNode;
	className?: string;
	tint?: string;
	bobDelay?: string;
}) {
	return (
		<div
			className={`absolute rounded-[14px] bg-white px-3 py-2.5 ${className}`}
			style={{
				border: `1px solid ${tint}`,
				boxShadow: "0 2px 4px rgba(28,51,73,.04), 0 14px 34px -14px rgba(28,51,73,.2)",
				animation: `bob 4.5s ${bobDelay} ease-in-out infinite`,
			}}
		>
			{children}
		</div>
	);
}

function Hero() {
	return (
		<section id="top" className="py-12 md:py-16">
			<div className={`${wrap} grid items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-12`}>
				<div>
					<p className={`${eyebrow} mb-5`} style={{ color: "var(--teal-700)" }}>
						AI support guide · universities &amp; IT
					</p>
					<h1 className="max-w-3xl text-4xl font-[800] leading-[1.04] tracking-normal md:text-6xl" style={{ color: "var(--ink)" }}>
						AI support that <span style={{ color: "var(--teal)" }}>shows users</span> exactly what to do.
					</h1>
					<p className="mt-5 max-w-xl text-lg leading-8" style={{ color: "var(--muted)" }}>
						Meera is the AI guide that walks students and staff through any issue right on their screen. When she cannot solve it herself, she writes the ticket for you.
					</p>
					<div className="mt-8 flex flex-wrap gap-3">
						<PrimaryButton href="/demo">Book a demo</PrimaryButton>
						<GhostButton href="#meeror">
							See Meeror in action <Icon name="arrow" size={16} stroke={2.2} />
						</GhostButton>
					</div>
					<div className="mt-9 flex flex-wrap gap-7">
						{[
							["71%", "resolved without a human"],
							["28s", "to the first guided step"],
							["9", "campus systems connected"],
						].map(([number, label]) => (
							<div key={label}>
								<div className="text-[26px] font-[800] tracking-normal" style={{ color: "var(--ink)" }}>
									{number}
								</div>
								<div className="font-['DM_Mono'] text-[11px] tracking-normal" style={{ color: "var(--muted)" }}>
									{label}
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="relative mx-auto w-full max-w-[440px]">
					<div className="absolute inset-[6%_4%_10%] rounded-full" style={{ background: "radial-gradient(circle at 50% 45%, var(--teal-050), transparent 70%)" }} />
					<div className="absolute bottom-[4%] left-1/2 h-9 w-[78%] -translate-x-1/2 rounded-full bg-[rgba(28,51,73,.10)] blur-[11px]" />
					<Image
						src={asset("meera-wave.png")}
						alt="Meera, the meerkat support guide, waving"
						width={880}
						height={880}
						priority
						className="relative h-auto w-full"
					/>
					<FloatingChip className="left-[-4%] top-[6%] max-w-[186px]" tint="var(--teal-100)" bobDelay="0s">
						<div className="flex items-center gap-2">
							<IconChip name="cursor" tint="teal" size={30} />
							<div>
								<div className="text-[12.5px] font-bold leading-tight">Click “Submit”</div>
								<div className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>
									step 4 of 4
								</div>
							</div>
						</div>
					</FloatingChip>
					<FloatingChip className="right-[-3%] top-[40%] max-w-[176px]" tint="var(--sand-050)" bobDelay="1.1s">
						<div className="flex items-center gap-2">
							<IconChip name="ticket" tint="sand" size={30} />
							<div>
								<div className="text-[12.5px] font-bold leading-tight">Ticket #NV-4827</div>
								<div className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>
									routed · Bursar
								</div>
							</div>
						</div>
					</FloatingChip>
					<FloatingChip className="bottom-[7%] left-[-2%]" tint="var(--line)" bobDelay="0.6s">
						<Confidence value={97} />
					</FloatingChip>
				</div>
			</div>
		</section>
	);
}



function MeerorSection() {
	return (
		<section id="meeror" className={section} style={{ background: "var(--cream-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
			<div className={wrap}>
				<SectionIntro
					sand
					eyebrowText="Meeror · guided on-screen support"
					title="Like screen-sharing, but the AI guides you."
					lede="Start a Meeror session and Meera sees what you see. She drops highlights, arrows and popups right onto the page, showing you exactly where to click, one step at a time."
				/>
				<MeerorDemoClient />
				<FeatureGrid
					items={[
						{ icon: "cursor", tint: "teal", title: "Points at the real screen", text: "Highlights the exact button or field so there is no settings-menu guesswork." },
						{ icon: "layers", tint: "sand", title: "Step-by-step progress", text: "A clear path with progress dots, so people always know what comes next." },
						{ icon: "eye", tint: "gold", title: "Confidence you can see", text: "Every step shows how sure Meera is, so trust is earned, not assumed." },
						{ icon: "shield", tint: "green", title: "You control sharing", text: "Share one tab, pause anytime, escalate to a human in one tap." },
					]}
				/>
			</div>
		</section>
	);
}

function BulletRows() {
	const bullets = [
		{ icon: "sparkle" as const, tint: "teal" as const, title: "Diagnoses, not just chats", text: "Runs real checks before deciding a human is needed." },
		{ icon: "ticket" as const, tint: "sand" as const, title: "Tickets that write themselves", text: "Summary, attempted fixes, context and urgency are filled in automatically." },
		{ icon: "route" as const, tint: "gold" as const, title: "Routed to the right desk", text: "Sent to the team that can actually resolve it, with next steps attached." },
	];

	return (
		<div className="mt-7 grid gap-4">
			{bullets.map((item) => (
				<div key={item.title} className="flex gap-3">
					<IconChip name={item.icon} tint={item.tint} size={38} />
					<div>
						<div className="text-[15.5px] font-bold" style={{ color: "var(--ink)" }}>
							{item.title}
						</div>
						<p className="mt-1 text-sm leading-6" style={{ color: "var(--muted)" }}>
							{item.text}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

function ChatTicketDemo() {
	return (
		<div className="mx-auto max-w-[760px] overflow-hidden" style={cardStyle}>
			<div className="flex items-center gap-3 border-b bg-white px-4 py-3" style={{ borderColor: "var(--line)" }}>
				<LogoMark size={38} />
				<div className="flex-1">
					<div className="font-bold">Meera</div>
					<div className="flex items-center gap-1.5 font-['DM_Mono'] text-[11px]" style={{ color: "var(--green)" }}>
						<span className="size-1.5 rounded-full" style={{ background: "var(--green)" }} /> online · usually solves in seconds
					</div>
				</div>
				<span className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}>
					Replay
				</span>
			</div>
			<div className="grid min-h-[430px] gap-3 bg-[#FCFAF6] p-4">
				<div className="ml-auto max-w-[78%] rounded-[16px_4px_16px_16px] px-4 py-3 text-sm leading-6 text-white" style={{ background: "var(--ink)" }}>
					I cannot submit my course registration. The Submit button is greyed out.
				</div>
				<div className="max-w-[78%] rounded-[4px_16px_16px_16px] border bg-white px-4 py-3 text-sm leading-6 shadow-sm" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
					Got it. Let me check a few things on your account.
				</div>
				<div className="rounded-[24px] border bg-white p-4" style={{ borderColor: "var(--line)" }}>
					<div className="mb-3 flex items-center gap-2 font-['DM_Mono'] text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>
						<Icon name="sparkle" size={13} /> Running diagnostics
					</div>
					{[
						["Transcript uploaded", true, ""],
						["Enrollment term selected", true, ""],
						["Account holds", false, "1 financial hold"],
					].map(([label, ok, note]) => (
						<div key={label.toString()} className="mb-2 flex items-center gap-2 text-[13.5px]">
							<span className="grid size-[18px] place-items-center rounded-full" style={{ background: ok ? "var(--green-050)" : "#FBE7E0", color: ok ? "var(--green)" : "#C0532F" }}>
								<Icon name={ok ? "check" : "alert"} size={11} stroke={2.4} />
							</span>
							<span className="font-medium" style={{ color: "var(--ink)" }}>
								{label}
							</span>
							{note ? (
								<span className="ml-auto rounded-full px-2 py-0.5 font-['DM_Mono'] text-[11px]" style={{ background: "#FBE7E0", color: "#C0532F" }}>
									{note}
								</span>
							) : null}
						</div>
					))}
				</div>
				<div className="max-w-[78%] rounded-[4px_16px_16px_16px] border bg-white px-4 py-3 text-sm leading-6 shadow-sm" style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
					Found it: there is a financial hold on your account, and that locks registration until it is cleared.
				</div>
				<div>
					<div className="my-2 flex items-center gap-2 font-['DM_Mono'] text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--sand-600)" }}>
						<span className="h-px flex-1" style={{ background: "var(--line-2)" }} /> Auto-created ticket <span className="h-px flex-1" style={{ background: "var(--line-2)" }} />
					</div>
					<div className="overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: "var(--line-2)" }}>
						<div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
							<IconChip name="ticket" tint="sand" size={36} />
							<div className="flex-1">
								<div className="text-sm font-bold">Registration blocked by financial hold</div>
								<div className="font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>
									#NV-4827 · created by Meera · just now
								</div>
							</div>
							<span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: "#FBE7E0", color: "#C0532F" }}>
								High urgency
							</span>
						</div>
						<div className="grid gap-3 p-4 text-[13px] leading-6" style={{ color: "var(--ink-2)" }}>
							<p>
								<span className="block font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>
									AI summary
								</span>
								Student cannot submit Fall 2026 registration. Submit is disabled by an active financial hold. Transcript and term are valid.
							</p>
							<div className="grid gap-3 sm:grid-cols-2">
								<p>
									<span className="block font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>
										Routed to
									</span>
									Bursar’s Office
								</p>
								<p>
									<span className="block font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>
										Context
									</span>
									Session + 1 screenshot
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function HandoffSection() {
	return (
		<section id="handoff" className={section} style={{ background: "#fff" }}>
			<div className={`${wrap} grid items-center gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-14`}>
				<div>
					<SectionIntro
						align="left"
						eyebrowText="Handoff · chat that closes the loop"
						title="When chat can’t fix it, Meera writes the ticket."
						lede="Meera diagnoses by asking the right questions. If a human is needed, she hands off a ready-to-action ticket, so no one repeats themselves."
					/>
					<BulletRows />
				</div>
				<ChatTicketDemo />
			</div>
		</section>
	);
}

function DashboardPreview() {
	const tickets = [
		["NV-4827", "Registration blocked by financial hold", "Bursar’s Office", "High", "Holds"],
		["NV-4826", "VPN fails on managed laptops after update", "IT · Network", "High", "Network"],
		["NV-4825", "Cannot reset password. Email never arrives", "IT · Identity", "Medium", "Accounts"],
		["NV-4824", "Financial aid form rejects valid SSN", "Student Services", "Low", "Forms"],
	];

	return (
		<div className="mx-auto max-w-[1060px] overflow-hidden" style={cardStyle}>
			<div className="flex items-center gap-3 border-b bg-white px-4 py-3" style={{ borderColor: "var(--line)" }}>
				<span className="flex gap-1.5">
					{["#E7836B", "#EBC15C", "#7FB85C"].map((color) => (
						<span key={color} className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
					))}
				</span>
				<IconChip name="eye" tint="teal" size={28} />
				<span className="font-[800] tracking-normal">Meera Lookout</span>
				<span className="rounded-full bg-[#F3ECE0] px-2 py-0.5 font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>
					admin
				</span>
				<span className="flex-1" />
				<span className="hidden items-center gap-1.5 font-['DM_Mono'] text-[11px] sm:flex" style={{ color: "var(--muted)" }}>
					<span className="size-1.5 rounded-full" style={{ background: "var(--teal)" }} /> 12 open · 4 need review
				</span>
			</div>
			<div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[168px_300px_1fr]">
				<div className="hidden border-r bg-[#FCFAF6] p-3 lg:block" style={{ borderColor: "var(--line)" }}>
					{[
						["inbox", "Inbox", "12"],
						["trend", "Insights", ""],
						["book", "Knowledge", ""],
						["route", "Routing", ""],
						["users", "Team", ""],
					].map(([icon, label, count], index) => (
						<div
							key={label}
							className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold"
							style={{ background: index === 0 ? "var(--teal-050)" : "transparent", color: index === 0 ? "var(--teal-700)" : "var(--ink-2)" }}
						>
							<Icon name={icon as IconName} size={17} /> <span className="flex-1">{label}</span>
							{count ? <span className="rounded-full border bg-white px-2 font-['DM_Mono'] text-[10px]" style={{ borderColor: "var(--line)" }}>{count}</span> : null}
						</div>
					))}
					<div className="my-4 h-px" style={{ background: "var(--line)" }} />
					<p className="px-3 font-['DM_Mono'] text-[9.5px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>
						Resolved by Meera
					</p>
					<div className="px-3 pt-2">
						<div className="text-[28px] font-[800]" style={{ color: "var(--ink)" }}>
							71%
						</div>
						<p className="text-[11.5px]" style={{ color: "var(--muted)" }}>
							without a human this week
						</p>
					</div>
				</div>
				<div className="border-r" style={{ borderColor: "var(--line)" }}>
					<div className="flex items-center justify-between px-4 py-3">
						<span className="text-sm font-bold">Ticket queue</span>
						<span className="font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>
							sorted by urgency
						</span>
					</div>
					{tickets.map(([id, title, dept, urgency, tag], index) => (
						<div
							key={id}
							className="border-t px-4 py-3"
							style={{
								borderColor: "var(--line)",
								background: index === 0 ? "var(--teal-050)" : "transparent",
								borderLeft: index === 0 ? "3px solid var(--teal)" : "3px solid transparent",
							}}
						>
							<div className="mb-1 flex items-center gap-2">
								<span className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>
									#{id}
								</span>
								<span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: urgency === "High" ? "#FBE7E0" : "var(--gold-050)", color: urgency === "High" ? "#C0532F" : "#A9781F" }}>
									{urgency}
								</span>
							</div>
							<div className="text-[13.5px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
								{title}
							</div>
							<div className="mt-2 flex items-center gap-2">
								<span className="rounded-full border bg-white px-2 py-0.5 font-['DM_Mono'] text-[10px]" style={{ borderColor: "var(--line)", color: "var(--teal-700)" }}>
									{tag}
								</span>
								<span className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>
									{dept}
								</span>
							</div>
						</div>
					))}
				</div>
				<div className="bg-[#FCFAF6] p-5">
					<div className="mb-4 flex items-start gap-3">
						<IconChip name="ticket" tint="sand" size={42} />
						<div className="flex-1">
							<h3 className="text-lg font-[800] leading-tight" style={{ color: "var(--ink)" }}>
								Registration blocked by financial hold
							</h3>
							<div className="font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>
								#NV-4827 · routed to Bursar’s Office
							</div>
						</div>
						<Confidence value={97} label="AI confidence" />
					</div>
					<DashboardBlock icon="sparkle" tint="teal" label="AI-generated summary">
						Student cannot submit Fall 2026 registration. Submit is disabled by an active financial hold. Transcript and term are valid.
					</DashboardBlock>
					<DashboardBlock icon="wand" tint="gold" label="Suggested solution">
						Clear the hold, then auto-notify the student to re-submit. Meera can re-open the guided flow once cleared.
					</DashboardBlock>
					<div className="mb-3 flex gap-3 rounded-[14px] border p-4" style={{ background: "#FBE7E0", borderColor: "#F3D2C6", color: "#8A4A33" }}>
						<Icon name="alert" size={19} />
						<p className="text-[12.5px] leading-5">
							<strong>Registrar → Bursar’s Office.</strong> Registration deadlines depend on holds being cleared 48 hours prior.
						</p>
					</div>
					<div className="grid gap-3 md:grid-cols-2">
						<MiniPanel title="Recurring issues" icon="trend" rows={[["Financial holds", "38", "+14%"], ["VPN / network", "27", "+9%"], ["Password resets", "21", "-6%"]]} />
						<MiniPanel title="KB suggestions" icon="book" rows={[["Clear a financial hold", "38x", "new"], ["Fix VPN drops", "23x", "draft"]]} />
					</div>
				</div>
			</div>
		</div>
	);
}

function DashboardBlock({ icon, tint, label, children }: { icon: IconName; tint: "teal" | "gold"; label: string; children: React.ReactNode }) {
	return (
		<div className="mb-3">
			<div className="mb-1.5 flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>
				<Icon name={icon} size={13} /> {label}
			</div>
			<div className="text-[13.5px] leading-6" style={{ color: tint === "teal" ? "var(--ink-2)" : "var(--ink-2)" }}>
				{children}
			</div>
		</div>
	);
}

function MiniPanel({ title, icon, rows }: { title: string; icon: IconName; rows: string[][] }) {
	return (
		<div className="rounded-[20px] border bg-white p-4" style={{ borderColor: "var(--line)" }}>
			<div className="mb-3 flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>
				<Icon name={icon} size={13} /> {title}
			</div>
			<div className="grid gap-2">
				{rows.map(([a, b, c]) => (
					<div key={a} className="flex items-center gap-2 text-[12.5px]">
						<span className="size-2 rounded-full" style={{ background: "var(--teal)" }} />
						<span className="flex-1 font-semibold">{a}</span>
						<span className="font-['DM_Mono']">{b}</span>
						<span className="font-['DM_Mono'] text-[10px]" style={{ color: c.startsWith("-") ? "var(--green)" : "var(--sand-600)" }}>
							{c}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function LookoutSection() {
	return (
		<section id="lookout" className={section} style={{ background: "var(--cream-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
			<div className={wrap}>
				<SectionIntro
					eyebrowText="Lookout · support intelligence for admins"
					title="A meerkat keeps watch over the whole burrow."
					lede="Lookout turns every conversation into intelligence. Admins see AI summaries, suggested fixes, smart routing and the recurring issues quietly costing the most time."
				/>
				<DashboardPreview />
				<FeatureGrid
					items={[
						{ icon: "wand", tint: "teal", title: "Approve, edit or escalate", text: "Meera drafts the response; your team stays in control of what goes out." },
						{ icon: "alert", tint: "rose", title: "Cross-department warnings", text: "Catches dependencies between teams before they bounce a ticket around." },
						{ icon: "trend", tint: "gold", title: "Recurring-issue insight", text: "Surfaces the systems and flows that generate the most tickets." },
						{ icon: "book", tint: "green", title: "Builds your knowledge base", text: "Turns repeated questions into ready-to-publish help articles." },
					]}
				/>
			</div>
		</section>
	);
}

function UseCases() {
	const cases = [
		{
			tag: "Universities & student services",
			tint: "teal" as const,
			title: "From confused students to completed forms.",
			points: ["Course registration, financial aid & portal navigation", "Guides students through forms instead of long FAQ pages", "Cuts the first-week support queue dramatically"],
			image: "meera-laptop.png",
		},
		{
			tag: "Enterprise IT departments",
			tint: "sand" as const,
			title: "Tier-1 tickets, handled before they pile up.",
			points: ["VPN, software setup, password & access issues", "Deflects repetitive tickets with guided fixes", "Routes the rest with full context to the right team"],
			image: "meera-connect.png",
		},
	];

	return (
		<section id="usecases" className={section} style={{ background: "#fff" }}>
			<div className={wrap}>
				<SectionIntro
					eyebrowText="Built for the people who answer the questions"
					title="One guide, made for universities and IT."
					lede="Whether it is a first-year stuck on registration or staff blocked by a VPN, Meera meets them where they are."
				/>
				<div className="grid gap-6 lg:grid-cols-2">
					{cases.map((item) => (
						<div key={item.title} className="flex flex-col overflow-hidden p-8 pb-0" style={{ ...cardStyle, border: item.tint === "teal" ? "1.5px solid var(--teal-100)" : "1px solid var(--line)" }}>
							<p className={`${eyebrow} mb-4`} style={{ color: item.tint === "teal" ? "var(--teal-700)" : "var(--sand-600)" }}>
								{item.tag}
							</p>
							<h3 className="text-2xl font-[800] leading-tight" style={{ color: "var(--ink)" }}>
								{item.title}
							</h3>
							<div className="mt-5 grid gap-3">
								{item.points.map((point) => (
									<div key={point} className="flex items-start gap-2 text-[14.5px]" style={{ color: "var(--ink-2)" }}>
										<span style={{ color: `var(--${item.tint})` }}>
											<Icon name="check" size={17} stroke={2.2} />
										</span>
										{point}
									</div>
								))}
							</div>
							<div className="mt-auto flex h-[170px] items-end justify-center" style={{ background: `radial-gradient(circle at 50% 90%, var(--${item.tint}-050), transparent 72%)` }}>
								<Image src={asset(item.image)} alt="" width={320} height={220} className="h-[165px] w-auto object-contain object-bottom" />
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function Benefits() {
	return (
		<section className={section} style={{ background: "var(--cream-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
			<div className={wrap}>
				<SectionIntro
					eyebrowText="Why teams choose Meera"
					title="Not a chatbot. A support intelligence layer."
					lede="Meera acts like an autonomous guide for your users and a co-pilot for your support team at the same time."
				/>
				<FeatureGrid
					columns="lg:grid-cols-3"
					items={[
						{ icon: "bolt", tint: "teal", title: "Faster resolutions", text: "Most issues solved in the moment: no queue, no waiting for a reply." },
						{ icon: "users", tint: "sand", title: "Lighter load on staff", text: "Routine questions are deflected, so your team works the ones that matter." },
						{ icon: "globe", tint: "gold", title: "Available 24/7", text: "Meera guides students and staff at 2am the same way she does at 2pm." },
						{ icon: "layers", tint: "green", title: "Full context, always", text: "Every handoff carries the session, screenshots and what has been tried." },
						{ icon: "trend", tint: "teal", title: "Insight that compounds", text: "Each ticket makes routing, answers and the knowledge base smarter." },
						{ icon: "shield", tint: "rose", title: "Private by design", text: "Users choose what to share; sensitive data stays where it belongs." },
					]}
				/>
			</div>
		</section>
	);
}

function BrandSection() {
	return (
		<section className={section} style={{ background: "#fff" }}>
			<div className={`${wrap} grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-12`}>
				<div className="relative flex justify-center">
					<div className="absolute inset-[8%_10%] rounded-full" style={{ background: "radial-gradient(circle,var(--gold-050),transparent 70%)" }} />
					<Image src={asset("meera-celebrate.png")} alt="Meera celebrating" width={720} height={720} className="relative h-auto w-[78%] max-w-[360px]" />
				</div>
				<div>
					<p className={`${eyebrow} mb-4`} style={{ color: "var(--teal-700)" }}>
						Meet Meera
					</p>
					<h2 className="text-3xl font-[800] leading-tight md:text-5xl" style={{ color: "var(--ink)" }}>
						Why a meerkat?
					</h2>
					<p className="mt-5 text-lg leading-8" style={{ color: "var(--muted)" }}>
						Meerkats are sentinels. One always stands tall, watching over the whole group. The moment something is wrong, it speaks up and shows the way to safety.
					</p>
					<p className="mt-4 text-base leading-8" style={{ color: "var(--ink-2)" }}>
						That is exactly how Meera works: calm, alert and always looking out for your users, guiding them through and keeping watch so no one gets stuck.
					</p>
					<div className="mt-7 flex flex-wrap gap-2.5">
						{[
							["Helpful", "var(--teal-050)", "var(--teal-700)"],
							["Calm", "var(--gold-050)", "#A9781F"],
							["Trustworthy", "var(--green-050)", "#5E9438"],
							["A little playful", "var(--sand-050)", "var(--sand-600)"],
						].map(([label, bg, color]) => (
							<span key={label} className="rounded-full px-4 py-2 text-sm font-bold" style={{ background: bg, color }}>
								{label}
							</span>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

function CTA() {
	return (
		<section className="py-16 pb-28 md:py-20 md:pb-32" style={{ background: "var(--cream)" }}>
			<div className={wrap}>
				<div className="relative overflow-hidden rounded-[34px] px-7 py-12 md:px-14 md:py-16" style={{ background: "linear-gradient(155deg,#1C3349,#23445e 55%,#2c5468)" }}>
					<div className="absolute inset-0 opacity-55" style={{ background: "radial-gradient(50% 60% at 85% 20%, rgba(46,156,142,.45), transparent 70%)" }} />
					<div className="relative max-w-xl">
						<p className={`${eyebrow} mb-4`} style={{ color: "#9fe3d6" }}>
							Get started
						</p>
						<h2 className="text-3xl font-[800] leading-tight text-white md:text-[44px]">
							From confused users to resolved tickets automatically.
						</h2>
						<p className="mt-4 max-w-md text-lg leading-8" style={{ color: "#cdd8e0" }}>
							See how Meera guides your users and lightens your support team’s load. Book a 20-minute walkthrough.
						</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<PrimaryButton href="/demo">Book a demo</PrimaryButton>
							<GhostButton href="#meeror" dark>
								Explore the product
							</GhostButton>
						</div>
					</div>
					<Image
						src={asset("meera-clipboard.png")}
						alt=""
						width={480}
						height={480}
						className="absolute bottom-[-6px] right-8 hidden w-[220px] drop-shadow-2xl md:block lg:w-[240px]"
					/>
				</div>
			</div>
		</section>
	);
}

function Footer() {
	const columns = [
		{ heading: "Product", items: ["Meeror", "Handoff", "Lookout", "Integrations", "Security"] },
		{ heading: "Solutions", items: ["Universities", "Student services", "Enterprise IT", "Help desks"] },
		{ heading: "Company", items: ["About", "Careers", "Blog", "Contact"] },
	];

	return (
		<footer style={{ background: "var(--navy-deep)", color: "#aebbc6" }} className="py-14">
			<div className={wrap}>
				<div className="grid gap-9 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
					<div>
						<div className="mb-4 flex items-center gap-2.5">
							<LogoMark size={34} />
							<span className="text-[21px] font-[800] text-white">Meera</span>
						</div>
						<p className="max-w-[260px] text-sm leading-6" style={{ color: "#8c9aa6" }}>
							The AI support guide that shows users what to do and writes the ticket when it cannot.
						</p>
					</div>
					{columns.map(({ heading, items }) => (
						<div key={heading}>
							<div className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.1em]" style={{ color: "#6f7e8a" }}>
								{heading}
							</div>
							<div className="grid gap-2.5">
								{items.map((item) => (
									<a key={item} href="#" className="text-sm" style={{ color: "#aebbc6" }}>
										{item}
									</a>
								))}
							</div>
						</div>
					))}
				</div>
				<div className="mt-11 flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: "rgba(255,255,255,.08)" }}>
					<span className="font-['DM_Mono'] text-xs" style={{ color: "#6f7e8a" }}>
						© 2026 Meera. A friendly guide for every burrow.
					</span>
					<div className="flex gap-5 text-sm">
						<a href="#" style={{ color: "#8c9aa6" }}>
							Privacy
						</a>
						<a href="#" style={{ color: "#8c9aa6" }}>
							Terms
						</a>
						<a href="#" style={{ color: "#8c9aa6" }}>
							Status
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}

export default function Home() {
	return (
		<main style={{ background: "var(--cream)" }}>
			<Nav />
			<Hero />
			<MeerorSection />
			<HandoffSection />
			<LookoutSection />
			<UseCases />
			<Benefits />
			<BrandSection />
			<CTA />
			<Footer />
		</main>
	);
}
