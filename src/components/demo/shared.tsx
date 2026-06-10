"use client";

import { type CSSProperties, type ReactNode } from "react";

export type Tint = "teal" | "sand" | "gold" | "green" | "ink" | "rose";

export const asset = (name: string) => `/assets/${name}`;

export const iconPaths = {
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
	mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
	play: <path d="m7 5 12 7-12 7z" />,
	plug: <path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5" />,
	refresh: <path d="M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4" />,
	route: <path d="M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15v-4a4 4 0 0 1 4-4h8" />,
	shield: <path d="m12 3 7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6zM9 12l2 2 4-4" />,
	speaker: <path d="M4 9v6h4l5 4V5L8 9H4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />,
	sparkle: <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
	ticket: <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a2 2 0 0 0 0 5V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5a2 2 0 0 0 0-5zM13 7v10" />,
	trend: <path d="m4 17 5-5 3 3 7-7M15 8h5v5" />,
	users: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3.5 3.5 0 0 1 0 7M17 14c2.2.5 3.5 2.2 3.5 5" />,
	wand: <path d="m5 19 9-9M14 7l3-3 1 1-3 3zM17 4l.5-1.5M20 6l1.5-.5M19 9l1.5.5" />,
	sword: <path d="M14.5 3.5 21 3l-.5 6.5-8 8M6.5 13.5 3 17l4 4 3.5-3.5M14.5 9.5l-5 5M5 19l-1 1" />,
	heart: <path d="M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 11-8 11z" />,
	x: <path d="M6 6l12 12M18 6 6 18" />,
	bell: <path d="M6 9a6 6 0 1 1 12 0c0 4 1.4 5 2 6H4c.6-1 2-2 2-6zM9.5 19a2.5 2.5 0 0 0 5 0" />,
	gear: <><circle cx="12" cy="12" r="3.1" /><path d="M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3M5 5l2.1 2.1M16.9 16.9 19 19M19 5l-2.1 2.1M7.1 16.9 5 19" /></>,
} as const;

export type IconName = keyof typeof iconPaths;

export function Icon({ name, size = 20, stroke = 1.7, className = "" }: { name: IconName; size?: number; stroke?: number; className?: string }) {
	return (
		<svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			{iconPaths[name]}
		</svg>
	);
}

export function MeerkatMark({ size = 34 }: { size?: number }) {
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

export function IconChip({ name, tint = "teal", size = 40 }: { name: IconName; tint?: Tint; size?: number }) {
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

export function Confidence({ value = 96, label = "confidence" }: { value?: number; label?: string }) {
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

export function Pill({ children, tint = "default" }: { children: ReactNode; tint?: "default" | "teal" | "sand" | "rose" | "green" }) {
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

export function Button({
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

export function VoiceInputControl({
	isRecording,
	isTranscribing,
	onClick,
	className = "",
	compact = false,
}: {
	isRecording: boolean;
	isTranscribing: boolean;
	onClick: () => void;
	className?: string;
	compact?: boolean;
}) {
	return (
		<button
			type="button"
			disabled={isTranscribing}
			aria-label={isRecording ? "Stop recording" : "Record voice input"}
			title="Voice input"
			onClick={onClick}
			className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-55 ${className}`}
			style={{
				background: isRecording ? "var(--rose)" : "#fff",
				borderColor: isRecording ? "var(--rose)" : "var(--line-2)",
				color: isRecording ? "#fff" : "var(--ink)",
				boxShadow: isRecording ? "0 10px 24px rgba(224,135,105,.2)" : "none",
			}}
		>
			<Icon name="mic" size={compact ? 14 : 15} stroke={2} />
			<span className={compact ? "sr-only" : ""}>{isTranscribing ? "..." : isRecording ? "Stop" : "Voice"}</span>
		</button>
	);
}

export function SpeechControl({
	isSpeaking,
	onClick,
	className = "",
	compact = false,
}: {
	isSpeaking: boolean;
	onClick: () => void;
	className?: string;
	compact?: boolean;
}) {
	return (
		<button
			type="button"
			aria-label={isSpeaking ? "Stop speaking" : "Play message aloud"}
			title={isSpeaking ? "Stop speaking" : "Play message aloud"}
			onClick={onClick}
			className={`inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold transition hover:-translate-y-0.5 ${className}`}
			style={{
				background: isSpeaking ? "var(--teal-050)" : "#fff",
				borderColor: isSpeaking ? "var(--teal-100)" : "var(--line-2)",
				color: isSpeaking ? "var(--teal-700)" : "var(--ink-2)",
			}}
		>
			<Icon name="speaker" size={compact ? 13 : 14} stroke={2} />
			<span className={compact ? "sr-only" : ""}>{isSpeaking ? "Stop" : "Listen"}</span>
		</button>
	);
}

export function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
	return <div className={`rounded-[24px] border bg-white ${className}`} style={{ borderColor: "var(--line)", boxShadow: "var(--sh-md)", ...style }}>{children}</div>;
}
