"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

type TopView = "student" | "admin";
type AdminDept = "it" | "registrar" | "health" | "studsvcs" | "finance";
type Persona = "student" | AdminDept;
type StudentView = "site" | "embedded" | "screenshare" | "chat" | "mound";
type AdminView = "inbox" | "crossdept";
type Tint = "teal" | "sand" | "gold" | "green" | "ink" | "rose";

const asset = (name: string) => `/assets/${name}`;

const adminDepts: { id: AdminDept; label: string }[] = [
	{ id: "it", label: "IT" },
	{ id: "registrar", label: "Registrar" },
	{ id: "health", label: "Health" },
	{ id: "studsvcs", label: "Student Svcs" },
	{ id: "finance", label: "Finance" },
];

const iconPaths = {
	alert: <path d="M12 4l9 16H3zM12 10v4M12 17.5v.01" />,
	arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
	bolt: <path d="M13 3 5 13h5l-1 8 8-10h-5z" />,
	book: <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v15H6.5A1.5 1.5 0 0 0 5 20.5zM19 16H6.5A1.5 1.5 0 0 0 5 17.5" />,
	building: <path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M14 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h2M8 12h2M8 16h2" />,
	chat: <path d="M4 5.5h16v10H9l-4 3.5v-3.5H4z" />,
	check: <path d="m5 12.5 4.2 4.2L19 7" />,
	chevronD: <path d="m6 9 6 6 6-6" />,
	clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2" />,
	doc: <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6" />,
	eye: <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
	flag: <path d="M6 21V4M6 4h11l-2 4 2 4H6" />,
	headset: <path d="M4 13v-1a8 8 0 1 1 16 0v1M4 13a2 2 0 0 1 2 2v2a2 2 0 0 1-4 0v-2a2 2 0 0 1 2-2zM20 13a2 2 0 0 0-2 2v2a2 2 0 0 0 4 0v-2a2 2 0 0 0-2-2zM18 17v1.5a2.5 2.5 0 0 1-2.5 2.5H13" />,
	inbox: <path d="m4 13 2.5-7h11L20 13v6H4zM4 13h5l1.5 2.5h3L15 13h5" />,
	layers: <path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 16.5l9 5 9-5" />,
	lock: <path d="M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3M12 15v2" />,
	play: <path d="m7 5 12 7-12 7z" />,
	plug: <path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5" />,
	refresh: <path d="M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4" />,
	route: <path d="M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15v-4a4 4 0 0 1 4-4h8" />,
	shield: <path d="m12 3 7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6zM9 12l2 2 4-4" />,
	sparkle: <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
	ticket: <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a2 2 0 0 0 0 5V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5a2 2 0 0 0 0-5zM13 7v10" />,
	trend: <path d="m4 17 5-5 3 3 7-7M15 8h5v5" />,
	users: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3.5 3.5 0 0 1 0 7M17 14c2.2.5 3.5 2.2 3.5 5" />,
	wand: <path d="m5 19 9-9M14 7l3-3 1 1-3 3zM17 4l.5-1.5M20 6l1.5-.5M19 9l1.5.5" />,
};

type IconName = keyof typeof iconPaths;

function Icon({ name, size = 20, stroke = 1.7, className = "" }: { name: IconName; size?: number; stroke?: number; className?: string }) {
	return (
		<svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			{iconPaths[name]}
		</svg>
	);
}

function MeerkatMark({ size = 34 }: { size?: number }) {
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
			<img src={asset("meera-avatar.png")} alt="" aria-hidden="true" className="mb-[-6%] w-[112%] max-w-none translate-x-[1%]" />
		</span>
	);
}

function IconChip({ name, tint = "teal", size = 40 }: { name: IconName; tint?: Tint; size?: number }) {
	const map: Record<Tint, [string, string]> = {
		teal: ["var(--teal-050)", "var(--teal-700)"],
		sand: ["var(--sand-050)", "var(--sand-600)"],
		gold: ["var(--gold-050)", "#A9781F"],
		green: ["var(--green-050)", "#5E9438"],
		ink: ["#EAEFF3", "var(--ink)"],
		rose: ["#FBE7E0", "#C0532F"],
	};
	const [background, color] = map[tint];

	return (
		<span className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size, borderRadius: 13, background, color }}>
			<Icon name={name} size={Math.round(size / 2)} stroke={1.9} />
		</span>
	);
}

function Confidence({ value = 96, label = "confidence" }: { value?: number; label?: string }) {
	return (
		<span className="inline-flex items-center gap-2 whitespace-nowrap">
			<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--muted)" }}>{label}</span>
			<span className="h-1.5 w-14 overflow-hidden rounded-full bg-[#E7EEEC]">
				<span className="block h-full rounded-full" style={{ width: `${value}%`, background: "linear-gradient(90deg,var(--teal),var(--green))" }} />
			</span>
			<span className="font-['DM_Mono'] text-[11px] font-medium" style={{ color: "var(--teal-700)" }}>{value}%</span>
		</span>
	);
}

function Pill({ children, tint = "default" }: { children: ReactNode; tint?: "default" | "teal" | "sand" | "rose" | "green" }) {
	const styles = {
		default: ["#fff", "var(--line)", "var(--ink-2)"],
		teal: ["var(--teal-050)", "var(--teal-100)", "var(--teal-700)"],
		sand: ["var(--sand-050)", "#F3D2C6", "var(--sand-600)"],
		rose: ["#FBE7E0", "#F3D2C6", "#C0532F"],
		green: ["var(--green-050)", "#C9E8B3", "#5E9438"],
	} satisfies Record<string, [string, string, string]>;
	const [background, borderColor, color] = styles[tint];
	return <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ background, borderColor, color }}>{children}</span>;
}

function Button({
	children,
	onClick,
	variant = "ghost",
	className = "",
}: {
	children: ReactNode;
	onClick?: () => void;
	variant?: "primary" | "ghost" | "dark";
	className?: string;
}) {
	const style: CSSProperties =
		variant === "primary"
			? { background: "var(--teal)", color: "#fff", boxShadow: "0 10px 24px rgba(46,156,142,.22)" }
			: variant === "dark"
				? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" }
				: { background: "#fff", color: "var(--ink)", borderColor: "var(--line-2)" };
	return (
		<button type="button" onClick={onClick} className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold transition hover:-translate-y-0.5 ${className}`} style={style}>
			{children}
		</button>
	);
}

export function MeeraDemoExperience() {
	const [topView, setTopView] = useState<TopView>("student");
	const [studentView, setStudentView] = useState<StudentView>("site");
	const [adminDept, setAdminDept] = useState<AdminDept>("it");
	const [adminView, setAdminView] = useState<AdminView>("inbox");
	const [preIssue, setPreIssue] = useState<string | null>(null);
	const [resetKey, setResetKey] = useState(0);
	const isStudent = topView === "student";

	function switchTop(next: TopView) {
		setTopView(next);
		setStudentView("site");
		setAdminDept("it");
		setAdminView("inbox");
		setPreIssue(null);
		setResetKey((key) => key + 1);
	}

	function switchAdminDept(next: AdminDept) {
		setAdminDept(next);
		setAdminView("inbox");
		setResetKey((key) => key + 1);
	}

	function reset() {
		setPreIssue(null);
		setResetKey((key) => key + 1);
	}

	const stage = useMemo(() => {
		if (isStudent) {
			if (studentView === "embedded") return <StudentEmbedded key={resetKey} />;
			if (studentView === "screenshare") return <StudentScreenshare key={resetKey} />;
			if (studentView === "chat") return <StudentChat key={resetKey} preIssue={preIssue} />;
			if (studentView === "mound") return <StudentMound key={resetKey} preIssue={preIssue} onChatNormally={() => setStudentView("chat")} />;
			return <StudentMeeraSite key={resetKey} onIssue={(issue) => { setPreIssue(issue); setStudentView("chat"); setResetKey((key) => key + 1); }} />;
		}
		return adminView === "crossdept" ? <AdminCrossDept key={resetKey} dept={adminDept} /> : <AdminLookout key={resetKey} dept={adminDept} />;
	}, [adminDept, adminView, isStudent, preIssue, resetKey, studentView]);

	return (
		<main className="fixed inset-0 z-[100] flex flex-col" style={{ background: "var(--cream)", color: "var(--ink)" }}>
			<header className="shrink-0 border-b bg-white" style={{ borderColor: "var(--line)" }}>
				<div className="flex h-[50px] items-center gap-2.5 px-4">
					<a href="/" className="inline-flex shrink-0 items-center gap-[7px]" aria-label="Meera home">
						<MeerkatMark size={28} />
						<span className="text-[15px] font-[800] tracking-[-0.03em]">Meera</span>
					</a>
					<span className="mx-1 h-[18px] w-px shrink-0" style={{ background: "var(--line-2)" }} />
					<div className="flex shrink-0 gap-0.5 rounded-full p-[3px]" style={{ background: "var(--cream-2)" }} role="tablist" aria-label="Demo view">
						{(["student", "admin"] as const).map((item) => {
							const active = topView === item;
							return (
								<button
									key={item}
									type="button"
									role="tab"
									aria-selected={active}
									onClick={() => switchTop(item)}
									className="rounded-full px-[18px] py-[5px] text-[13px] font-bold transition"
									style={{ background: active ? "#fff" : "transparent", color: active ? "var(--ink)" : "var(--muted)", boxShadow: active ? "var(--sh-sm)" : "none" }}
								>
									{item === "student" ? "Student" : "Admin"}
								</button>
							);
						})}
					</div>
					<span className="shrink-0 rounded-full px-[9px] py-0.5 font-['DM_Mono'] text-[9.5px] uppercase tracking-[0.16em]" style={{ color: "var(--teal-700)", background: "var(--teal-050)" }}>· DEMO ·</span>
					<span className="flex-1" />
					<div className="flex shrink-0 gap-[3px]">
						<button type="button" onClick={reset} className="inline-flex items-center gap-[5px] rounded-[7px] border border-transparent bg-transparent px-2.5 py-[5px] text-[12.5px] font-semibold" style={{ color: "var(--muted)" }}><Icon name="refresh" size={13} /> Reset</button>
						<a href="/" className="inline-flex items-center gap-[5px] rounded-[7px] border border-transparent bg-transparent px-2.5 py-[5px] text-[12.5px] font-semibold" style={{ color: "var(--rose)" }}>X Exit</a>
					</div>
				</div>
				<div className="flex items-center gap-1 overflow-x-auto border-t px-4 pb-[7px] pt-[5px]" style={{ borderColor: "var(--line-2)", background: "var(--cream)" }}>
					{isStudent ? (
						<>
							<SubLabel>WHERE</SubLabel>
							<SubTab active={studentView === "site"} onClick={() => setStudentView("site")}>Meera site</SubTab>
							<SubTab active={studentView === "embedded"} onClick={() => setStudentView("embedded")}>Embedded</SubTab>
							<Divider />
							<SubLabel>HOW</SubLabel>
							<SubTab active={studentView === "screenshare"} onClick={() => setStudentView("screenshare")}>Screenshare</SubTab>
							<SubTab active={studentView === "chat"} onClick={() => setStudentView("chat")}>Chat</SubTab>
							<SubTab active={studentView === "mound"} onClick={() => setStudentView("mound")}>Build the Mound</SubTab>
						</>
					) : (
						<>
							<SubLabel>DEPT</SubLabel>
							{adminDepts.map((dept) => (
								<SubTab key={dept.id} active={adminDept === dept.id} onClick={() => switchAdminDept(dept.id)}>{dept.label}</SubTab>
							))}
							<Divider />
							<SubLabel>VIEW</SubLabel>
							<SubTab active={adminView === "inbox"} onClick={() => setAdminView("inbox")}>Inbox</SubTab>
							<SubTab active={adminView === "crossdept"} onClick={() => setAdminView("crossdept")}>Cross-dept</SubTab>
						</>
					)}
				</div>
			</header>
			<div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">{stage}</div>
		</main>
	);
}

function SubLabel({ children }: { children: ReactNode }) {
	return <span className="shrink-0 pr-0.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>{children}</span>;
}

function SubTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
	return <button type="button" onClick={onClick} className="shrink-0 rounded-[7px] border px-3 py-1 text-[12.5px] font-semibold whitespace-nowrap transition" style={{ background: active ? "var(--teal-050)" : "transparent", color: active ? "var(--teal-700)" : "var(--ink-2)", borderColor: active ? "var(--teal-100)" : "transparent" }}>{children}</button>;
}

function Divider() {
	return <span className="mx-[5px] h-3.5 w-px shrink-0" style={{ background: "var(--line-2)" }} />;
}

function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
	return <div className={`rounded-[24px] border bg-white ${className}`} style={{ borderColor: "var(--line)", boxShadow: "var(--sh-md)", ...style }}>{children}</div>;
}

function PortalShell({ children, active = "Registration", className = "" }: { children: ReactNode; active?: string; className?: string }) {
	const items = ["Dashboard", "Registration", "Financials", "Records", "Help"];
	return (
		<div className={`grid min-h-[520px] grid-cols-[140px_minmax(0,1fr)] overflow-hidden rounded-none bg-[#FCFAF6] md:grid-cols-[154px_minmax(0,1fr)] ${className}`}>
			<aside className="bg-[#1C3349] p-3 text-[#cdd8e0] md:p-4">
				<div className="mb-5 flex items-center gap-2">
					<span className="grid size-7 place-items-center rounded-lg bg-[#34506b] text-sm font-[800] text-white">N</span>
					<span className="text-[13px] font-bold text-white">Northvale</span>
				</div>
				{items.map((item) => (
					<div key={item} className="mb-1 rounded-lg px-2.5 py-2 text-[12px] font-semibold" style={{ background: active === item ? "#28425b" : "transparent", color: active === item ? "#fff" : "#9fb0bd" }}>{item}</div>
				))}
			</aside>
			<section className="min-w-0 p-5 md:p-7">{children}</section>
		</div>
	);
}

const siteChips = ["Can't register", "Wi-Fi won't connect", "Tuition hold", "Reset my password"];

function StudentMeeraSite({ onIssue }: { onIssue: (issue: string) => void }) {
	const [value, setValue] = useState("");
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
					<textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder="Describe what's going on..." className="min-h-20 w-full resize-none rounded-[22px] bg-transparent p-4 text-[15px] outline-none" />
					<div className="flex justify-end px-2 pb-2">
						<Button variant="primary" onClick={() => onIssue(value || "I need help")}>Ask Meera <Icon name="arrow" size={15} stroke={2.2} /></Button>
					</div>
				</Card>
				<p className="mt-7 font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>Or pick a common issue</p>
				<div className="mt-3 flex flex-wrap justify-center gap-2">
					{siteChips.map((chip) => <button key={chip} type="button" onClick={() => onIssue(chip)} className="rounded-full border bg-white px-4 py-2 text-[13px] font-bold transition hover:-translate-y-0.5" style={{ borderColor: "var(--line)" }}>{chip}</button>)}
				</div>
				<div className="mt-7 flex items-center justify-center gap-2 font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}><Icon name="shield" size={13} className="text-[#7FB85C]" /> You control what's shared · nothing leaves this tab without your say-so</div>
			</section>
		</div>
	);
}

const embedSteps: ChatItem[] = [
	{ kind: "meera", text: "Hi! What's going on today? I can help with registration, holds, or anything else.", delay: 0 },
	{ kind: "user", text: "I have a tuition hold and can't register for classes.", delay: 1300 },
	{ kind: "meera", text: "Got it - let me check your account right now.", delay: 900 },
	{ kind: "checks", delay: 650 },
	{ kind: "meera", text: "Found it: a $310 financial hold. I'll create a ticket for the Bursar's Office - you'll hear back within 24 hours.", delay: 1800 },
	{ kind: "ticket", delay: 600 },
];

function StudentEmbedded() {
	const [open, setOpen] = useState(false);
	const [count, setCount] = useState(0);
	const [checks, setChecks] = useState(0);
	const scrollRef = useAutoScroll<HTMLDivElement>([count, checks]);

	useEffect(() => {
		const timer = window.setTimeout(() => setOpen(true), 900);
		return () => window.clearTimeout(timer);
	}, []);
	useScriptAdvance(open ? embedSteps : [], count, setCount);
	useEffect(() => {
		const index = embedSteps.findIndex((item) => item.kind === "checks");
		if (count > index && checks < diagnosticChecks.length) {
			const timer = window.setTimeout(() => setChecks((current) => current + 1), 520);
			return () => window.clearTimeout(timer);
		}
	}, [checks, count]);

	return (
		<div className="relative min-h-[calc(100vh-94px)]">
			<PortalShell active="Financials" className="min-h-[calc(100vh-94px)]">
				<p className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>FINANCIALS &amp; HOLDS</p>
				<h2 className="mt-2 text-2xl font-[800]">Your Account</h2>
				<Card className="mt-5 max-w-md p-5">
					<div className="flex items-center justify-between">
						<span className="font-bold">Outstanding Balance</span>
						<span className="text-xl font-[800] text-[#C0532F]">$310.00</span>
					</div>
					<div className="mt-3 flex items-center gap-2"><Pill tint="rose">Financial hold</Pill><span className="text-sm" style={{ color: "var(--muted)" }}>blocks registration</span></div>
				</Card>
				<div className="mt-5 flex max-w-md gap-3 rounded-2xl border p-4" style={{ background: "var(--teal-050)", borderColor: "var(--teal-100)" }}>
					<MeerkatMark size={30} />
					<div>
						<div className="text-sm font-bold">Add Meera to any site in one line</div>
						<code className="mt-1 block font-['DM_Mono'] text-[10px]" style={{ color: "var(--teal-700)" }}>&lt;script src=&quot;meera.js&quot; data-key=&quot;northvale&quot;&gt;</code>
						<p className="mt-1 text-xs" style={{ color: "var(--ink-2)" }}>It wears your brand - students never leave your portal.</p>
					</div>
				</div>
			</PortalShell>
			{!open ? <button type="button" onClick={() => setOpen(true)} className="absolute bottom-6 right-6 grid size-14 place-items-center rounded-full text-white shadow-xl" style={{ background: "var(--teal)" }}><Icon name="chat" size={24} /></button> : null}
			{open ? (
				<Card className="absolute bottom-5 right-5 w-[min(320px,calc(100%_-_2.5rem))] overflow-hidden p-0" style={{ borderColor: "var(--teal-100)", boxShadow: "var(--sh-lg)" }}>
					<div className="flex items-center gap-3 p-3" style={{ background: "var(--teal)" }}>
						<MeerkatMark size={32} />
						<div className="flex-1"><div className="text-sm font-bold text-white">Meera</div><div className="font-['DM_Mono'] text-[10px] text-white/75">powered by Northvale</div></div>
						<button type="button" onClick={() => setOpen(false)} className="text-lg leading-none text-white/75">x</button>
					</div>
					<div ref={scrollRef} className="flex h-64 flex-col gap-2 overflow-y-auto bg-[#FCFAF6] p-3">
						{embedSteps.slice(0, count).map((item, index) => <ChatRender key={index} item={item} checksShown={checks} compact />)}
						{count < embedSteps.length && embedSteps[count]?.kind === "meera" ? <Typing /> : null}
					</div>
					<div className="flex gap-2 border-t p-2" style={{ borderColor: "var(--line)" }}><input className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: "var(--line-2)" }} placeholder="Type a message..." /><Button variant="primary" className="min-h-8 px-3"><Icon name="arrow" size={14} /></Button></div>
				</Card>
			) : null}
		</div>
	);
}

const screenSteps = [
	{ key: "term", title: "Choose your enrollment term", body: "Open this dropdown and pick the term you are registering for.", conf: 99, box: { top: 96, left: 28, width: 252, height: 48 } },
	{ key: "file", title: "Upload your transcript", body: "Attach the transcript PDF. That is the missing document.", conf: 95, box: { top: 154, left: 28, width: 252, height: 48 } },
	{ key: "agree", title: "Accept the registration terms", body: "Tick this box. Submit stays locked until you do.", conf: 98, box: { top: 214, left: 28, width: 288, height: 36 } },
	{ key: "submit", title: "Submit your request", body: "Everything is ready. Submit finishes the registration request.", conf: 97, box: { top: 264, left: 28, width: 252, height: 48 } },
];

function StudentScreenshare() {
	const [step, setStep] = useState(0);
	const [playing, setPlaying] = useState(true);
	const current = screenSteps[step];
	useEffect(() => {
		if (!playing) return;
		const timer = window.setTimeout(() => setStep((value) => (value + 1) % screenSteps.length), 2800);
		return () => window.clearTimeout(timer);
	}, [playing, step]);
	const done = (key: string) => screenSteps.findIndex((item) => item.key === key) < step;

	return (
		<div className="grid min-h-[calc(100vh-94px)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_270px]">
			<div className="relative overflow-hidden">
				<PortalShell>
					<div className="relative min-h-[385px] max-w-[620px]">
						<p className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>Fall 2026 - course registration</p>
						<h2 className="mb-5 mt-1 text-xl font-[800]">Submit your registration request</h2>
						<FormField label={done("term") ? "Fall 2026 - Full-time" : "Select enrollment term"} icon={done("term") ? "check" : "chevronD"} done={done("term")} />
						<FormField label={done("file") ? "transcript_2026.pdf" : "Upload transcript (PDF)"} icon={done("file") ? "check" : "doc"} done={done("file")} dashed={!done("file")} />
						<label className="mb-4 flex items-center gap-3 text-[13px]" style={{ color: "var(--ink-2)" }}><span className="grid size-5 place-items-center rounded-md border" style={{ background: done("agree") ? "var(--teal)" : "#fff", borderColor: done("agree") ? "var(--teal)" : "var(--line-2)", color: "#fff" }}>{done("agree") ? <Icon name="check" size={13} stroke={2.4} /> : null}</span>I accept the registration terms and academic policies</label>
						<button type="button" className="w-[252px] rounded-full px-5 py-3 text-sm font-bold" style={{ background: done("agree") ? "var(--teal)" : "#E4DCCD", color: done("agree") ? "#fff" : "#A99" }}>Submit Request</button>
						<div className="pointer-events-none absolute rounded-xl" style={{ top: current.box.top, left: current.box.left, width: current.box.width, height: current.box.height, boxShadow: "0 0 0 9999px rgba(22,41,59,.44)", zIndex: 5, transition: "all .5s cubic-bezier(.4,.8,.2,1)" }}>
							<span className="absolute inset-[-3px] rounded-[14px] border-[2.5px]" style={{ borderColor: "var(--teal)" }} />
							<span className="absolute inset-[-3px] rounded-[14px] border-[2.5px]" style={{ borderColor: "var(--teal)", animation: "pulse-ring 1.8s ease-out infinite" }} />
						</div>
						<Card className="absolute left-[330px] top-[84px] z-10 w-[240px] overflow-hidden p-0" style={{ borderColor: "var(--teal-100)", boxShadow: "var(--sh-lg)" }}>
							<div className="flex items-center gap-2 p-3">
								<MeerkatMark size={30} />
								<div className="flex-1"><div className="text-sm font-bold">Meera</div><div className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>step {step + 1} / {screenSteps.length}</div></div>
								<Pill tint="teal">{current.conf}%</Pill>
							</div>
							<div className="px-3 pb-3"><div className="text-sm font-bold">{current.title}</div><p className="mt-1 text-xs leading-5" style={{ color: "var(--ink-2)" }}>{current.body}</p></div>
							<div className="flex items-center gap-2 border-t bg-[#FCFAF6] p-3" style={{ borderColor: "var(--line)" }}>
								<div className="flex flex-1 gap-1">{screenSteps.map((_, index) => <span key={index} className="h-1 rounded-full transition-all" style={{ width: index === step ? 18 : 5, background: index === step ? "var(--teal)" : index < step ? "var(--teal-100)" : "var(--line-2)" }} />)}</div>
								<Button variant="primary" className="min-h-7 px-3 text-xs" onClick={() => { setPlaying(false); setStep((value) => (value + 1) % screenSteps.length); }}>Next</Button>
							</div>
						</Card>
					</div>
				</PortalShell>
			</div>
			<aside className="border-l bg-white p-5" style={{ borderColor: "var(--line)" }}>
				<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>What Meera sees</p>
				<div className="mt-4 grid gap-2">{["Enrollment term", "Transcript upload", "Terms accepted", "Ready to submit"].map((label, index) => <SideStatus key={label} label={label} status={index < step ? "done" : index === step ? "ready" : "locked"} />)}</div>
				<div className="my-5 h-px" style={{ background: "var(--line)" }} />
				<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>Detected blockers</p>
				<div className="mt-3 rounded-xl border p-3" style={{ background: step < screenSteps.length - 1 ? "#FBE7E0" : "var(--green-050)", borderColor: step < screenSteps.length - 1 ? "#F3D2C6" : "#C9E8B3", color: step < screenSteps.length - 1 ? "#A8431F" : "#5E9438" }}><div className="flex gap-2 text-sm font-bold"><Icon name={step < screenSteps.length - 1 ? "alert" : "check"} size={16} />{step < screenSteps.length - 1 ? `${screenSteps.length - step} steps remaining` : "All clear"}</div></div>
				<div className="my-5 h-px" style={{ background: "var(--line)" }} />
				<Confidence value={current.conf} label={`step ${step + 1}`} />
				<div className="mt-8"><Button className="w-full" onClick={() => setPlaying((value) => !value)}><Icon name={playing ? "clock" : "play"} size={14} />{playing ? "Auto-guiding" : "Resume"}</Button></div>
			</aside>
		</div>
	);
}

function FormField({ label, icon, done, dashed = false }: { label: string; icon: IconName; done: boolean; dashed?: boolean }) {
	return <div className="mb-3 flex w-[252px] items-center justify-between rounded-[10px] border-[1.5px] bg-white px-3 py-3 text-[13px] font-semibold" style={{ borderColor: "var(--line-2)", borderStyle: dashed ? "dashed" : "solid", color: done ? "var(--ink)" : "var(--muted)" }}><span className="flex items-center gap-2">{icon === "doc" ? <Icon name="doc" size={15} /> : null}{label}</span><Icon name={icon} size={15} className={done ? "text-[#7FB85C]" : ""} /></div>;
}

function SideStatus({ label, status }: { label: string; status: "done" | "ready" | "locked" }) {
	return <div className="flex items-center gap-2 rounded-xl p-2.5" style={{ background: status === "done" ? "var(--green-050)" : status === "ready" ? "var(--teal-050)" : "#F8F5F0" }}><span className="grid size-4 place-items-center rounded-full" style={{ background: status === "done" ? "var(--green)" : status === "ready" ? "var(--teal)" : "var(--line-2)", color: "#fff" }}>{status === "done" ? <Icon name="check" size={9} stroke={2.4} /> : status === "locked" ? <Icon name="lock" size={9} /> : null}</span><span className="text-xs font-bold" style={{ color: status === "done" ? "var(--teal-700)" : "var(--ink-2)" }}>{label}</span></div>;
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

function StudentChat({ preIssue }: { preIssue: string | null }) {
	return <ChatStage mode="chat" preIssue={preIssue} />;
}

function StudentMound({ preIssue, onChatNormally }: { preIssue: string | null; onChatNormally: () => void }) {
	return <ChatStage mode="mound" preIssue={preIssue} onChatNormally={onChatNormally} />;
}

function ChatStage({ mode, preIssue, onChatNormally }: { mode: "chat" | "mound"; preIssue: string | null; onChatNormally?: () => void }) {
	const [count, setCount] = useState(0);
	const [checks, setChecks] = useState(0);
	const [fixChoice, setFixChoice] = useState<"fixed" | "stuck" | null>(null);
	const [damage, setDamage] = useState(false);
	const script = useMemo(() => preIssue ? fullChat.map((item, index) => index === 1 ? { ...item, text: preIssue } : item) : fullChat, [preIssue]);
	const qIndex = script.findIndex((item) => item.kind === "quickfix");
	const scrollRef = useAutoScroll<HTMLDivElement>([count, checks, fixChoice]);
	useScriptAdvance(script, count, setCount, count > qIndex && fixChoice !== "stuck");
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
				<div className="flex-1"><div className="font-bold">Meera</div><div className="flex items-center gap-1.5 font-['DM_Mono'] text-[11px]" style={{ color: "var(--green)" }}><span className="size-1.5 rounded-full" style={{ background: "var(--green)" }} />{mode === "mound" ? "Build the Mound - case meter live" : "online - help.northvale.edu"}</div></div>
				{mode === "mound" ? <Button onClick={onChatNormally} className="hidden sm:inline-flex">Just chat normally</Button> : <Confidence value={94} />}
			</div>
			<div className={`grid min-h-0 flex-1 ${mode === "mound" ? "lg:grid-cols-[minmax(0,1fr)_260px]" : ""}`}>
				<div ref={scrollRef} className="mx-auto flex w-full max-w-[720px] flex-col gap-3 overflow-y-auto px-4 py-5">
					{visible.map((item, index) => <ChatRender key={index} item={item} checksShown={checks} onFixChoice={setFixChoice} fixChoice={fixChoice} mode={mode} />)}
					{fixChoice === "fixed" && count > qIndex ? <ResolvedState /> : null}
					{showTyping ? <Typing /> : null}
				</div>
				{mode === "mound" ? <CaseMeter stage={stage} damage={damage} fixed={fixChoice === "fixed"} /> : null}
			</div>
			<div className="border-t bg-white p-3" style={{ borderColor: "var(--line)" }}>
				<div className="mx-auto flex max-w-[720px] gap-2"><textarea className="h-11 min-w-0 flex-1 resize-none rounded-2xl border px-4 py-2 text-sm outline-none" style={{ borderColor: "var(--line-2)" }} placeholder="Reply to Meera..." /><Button variant="primary" className="rounded-2xl px-4"><Icon name="arrow" size={16} /></Button></div>
			</div>
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

function ChatRender({ item, checksShown, onFixChoice, fixChoice, mode, compact = false }: { item: ChatItem; checksShown: number; onFixChoice?: (choice: "fixed" | "stuck") => void; fixChoice?: "fixed" | "stuck" | null; mode?: "chat" | "mound"; compact?: boolean }) {
	if (item.kind === "user") return <Bubble side="right" compact={compact}>{item.text}</Bubble>;
	if (item.kind === "meera") return <Bubble side="left" compact={compact}>{item.text}</Bubble>;
	if (item.kind === "faq") return <FaqCard compact={compact} />;
	if (item.kind === "checks") return <ChecksCard shown={checksShown} compact={compact} />;
	if (item.kind === "quickfix") return <QuickFixCard onChoice={(choice) => onFixChoice?.(choice)} choice={fixChoice ?? null} />;
	if (item.kind === "identity" && fixChoice === "stuck") return <IdentityCard />;
	if (item.kind === "ticket") return <TicketCard compact={compact} />;
	if (item.kind === "closer" && fixChoice === "stuck") return <HandoffCloser />;
	if (mode === "mound" && item.kind === "closer" && fixChoice === "fixed") return <ResolvedState />;
	return null;
}

function Bubble({ side, children, compact = false }: { side: "left" | "right"; children: ReactNode; compact?: boolean }) {
	const right = side === "right";
	return <div className={`flex ${right ? "justify-end" : "justify-start"}`} style={{ animation: "fadeUp .3s ease" }}><div className={`${compact ? "max-w-[84%] px-3 py-2 text-xs" : "max-w-[78%] px-4 py-3 text-sm"} leading-6 shadow-sm`} style={{ borderRadius: right ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: right ? "var(--ink)" : "#fff", color: right ? "#fff" : "var(--ink)", border: right ? "none" : "1px solid var(--line)" }}>{children}</div></div>;
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
const moundLayers = [
	{ label: "Student heard", icon: "chat" as IconName, width: 172, bg: "linear-gradient(135deg,var(--cream-3),var(--cream-2))", color: "var(--ink-2)" },
	{ label: "Researched", icon: "book" as IconName, width: 146, bg: "linear-gradient(135deg,var(--teal-100),#aed4cf)", color: "var(--teal-700)" },
	{ label: "Diagnosed", icon: "sparkle" as IconName, width: 120, bg: "linear-gradient(135deg,var(--teal),var(--teal-600))", color: "#fff" },
	{ label: "Case packaged", icon: "ticket" as IconName, width: 96, bg: "linear-gradient(135deg,var(--teal-700),#12433c)", color: "#fff" },
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
	const circle = 2 * Math.PI * 44;
	return (
		<aside className="hidden border-l bg-white p-5 lg:flex lg:flex-col lg:items-center lg:gap-4" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, oklch(95% 0.02 185), #fff 52%)" }}>
			<div className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--teal-700)" }}>Case meter</div>
			<div className="relative size-[104px]">
				<svg width="104" height="104" viewBox="0 0 104 104">
					<circle cx="52" cy="52" r="44" fill="none" stroke="var(--line-2)" strokeWidth="9" />
					<circle cx="52" cy="52" r="44" fill="none" stroke={damage ? "var(--sand)" : "var(--teal)"} strokeWidth="9" strokeLinecap="round" strokeDasharray={circle} strokeDashoffset={circle * (1 - conf / 100)} transform="rotate(-90 52 52)" style={{ transition: "stroke-dashoffset .95s cubic-bezier(.2,.9,.3,1)" }} />
				</svg>
				<div className="absolute inset-0 grid place-items-center text-center">{fixed ? <img src={asset("meera-avatar.png")} alt="" className="w-10" style={{ animation: "bob 2.2s ease-in-out infinite" }} /> : <div><div className="text-2xl font-[800]" style={{ color: damage ? "var(--sand-600)" : "var(--teal-700)" }}>{conf}%</div><div className="font-['DM_Mono'] text-[9px]" style={{ color: "var(--muted)" }}>progress</div></div>}</div>
			</div>
			<div className="flex w-full flex-col-reverse items-center gap-1.5" style={{ transform: "perspective(280px) rotateX(11deg)" }}>
				{moundLayers.map((layer, index) => {
					const built = index < stage;
					const isDamage = damage && index === stage - 1;
					return <div key={layer.label} className="flex h-9 items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold transition-all" style={{ width: built ? layer.width : layer.width * .12, background: isDamage ? "var(--sand)" : built ? layer.bg : "var(--cream-2)", color: built ? layer.color : "transparent", opacity: built ? 1 : .16, borderColor: built ? "var(--teal-100)" : "var(--line)", animation: isDamage ? "mound-shake .7s ease" : built && index === stage - 1 ? "mound-layer-in .5s ease" : "none" }}><Icon name={isDamage ? "alert" : layer.icon} size={12} />{isDamage ? "Regrouping" : layer.label}</div>;
				})}
				<div className="mt-1 h-1.5 w-[90%] rounded-b-full" style={{ background: "linear-gradient(90deg,var(--teal-100),var(--teal-050),var(--teal-100))" }} />
			</div>
			<div className="text-center"><div className="text-sm font-bold" style={{ color: damage ? "var(--sand-600)" : stage >= 4 ? "var(--teal-700)" : "var(--ink-2)" }}>{damage ? "Packing the case" : caseLabels[stage]}</div><div className="mt-2 flex justify-center gap-2">{[1, 2, 3, 4].map((i) => <span key={i} className="size-2 rounded-full" style={{ background: i <= stage ? "var(--teal)" : "var(--line-2)", boxShadow: i <= stage ? "0 0 8px var(--teal)" : "none" }} />)}</div></div>
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
		<div className="flex min-h-[calc(100vh-94px)] flex-col">
			<div className="flex items-center gap-3 border-b bg-white px-5 py-3" style={{ borderColor: "var(--line)" }}><IconChip name="eye" tint="teal" size={30} /><span className="font-[800]">Meera Lookout</span><Pill>{data.label}</Pill><span className="ml-auto font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>{data.tickets.length} open - needs review</span></div>
			<div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[176px_300px_minmax(0,1fr)]">
				<AdminRail data={data} />
				<div className="border-r bg-white" style={{ borderColor: "var(--line)" }}><div className="flex items-center justify-between px-4 py-3"><span className="text-sm font-bold">Ticket queue</span><span className="font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>urgency down</span></div>{data.tickets.map((item, index) => <QueueButton key={item.id} ticket={item} active={index === selected} onClick={() => setSelected(index)} />)}</div>
				<AdminDetail ticket={ticket} />
			</div>
		</div>
	);
}

function AdminRail({ data }: { data: DeptData }) {
	return <aside className="hidden overflow-y-auto border-r bg-[#FCFAF6] p-3 lg:block" style={{ borderColor: "var(--line)" }}>{(["Inbox", "Insights", "Knowledge", "Routing", "Team"] as const).map((label, index) => <div key={label} className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold" style={{ background: index === 0 ? "var(--teal-050)" : "transparent", color: index === 0 ? "var(--teal-700)" : "var(--ink-2)" }}><Icon name={(index === 0 ? "inbox" : index === 1 ? "trend" : index === 2 ? "book" : index === 3 ? "route" : "users")} size={16} />{label}</div>)}<div className="my-4 h-px" style={{ background: "var(--line)" }} /><p className="px-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Resolved by Meera</p><div className="px-3 pt-2"><div className="text-3xl font-[800]">{data.resolved}</div><p className="text-xs" style={{ color: "var(--muted)" }}>without a human this week</p></div><div className="my-4 h-px" style={{ background: "var(--line)" }} /><p className="px-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Recurring issues</p><div className="mt-3 grid gap-2">{data.recurring.map((item) => <div key={item.label} className="flex items-center gap-2 text-xs"><span className="size-2 rounded-full" style={{ background: `var(--${item.tint})` }} /><span className="flex-1 font-bold">{item.label}</span><span className="font-['DM_Mono']">{item.count}</span><span className="w-9 text-right font-['DM_Mono']" style={{ color: item.down ? "var(--green)" : "var(--rose)" }}>{item.trend}</span></div>)}</div><div className="my-4 h-px" style={{ background: "var(--line)" }} /><p className="px-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>KB suggestions</p><div className="mt-3 grid gap-3">{data.kb.map((item) => <div key={item.title} className="flex gap-2 text-xs"><Icon name="sparkle" size={12} className="text-[#2E9C8E]" /><div className="flex-1"><div className="font-bold leading-snug">{item.title}</div><div className="font-['DM_Mono']" style={{ color: "var(--muted)" }}>{item.reason}</div></div><Pill tint={item.status === "new" ? "teal" : "sand"}>{item.status}</Pill></div>)}</div></aside>;
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
