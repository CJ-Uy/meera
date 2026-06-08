"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useLayoutEffect } from "react";

const STEPS = [
	{ key: "term",   title: "Choose your enrollment term",    body: "Open this dropdown and pick the term you're registering for.",              conf: 99 },
	{ key: "file",   title: "Upload your transcript",         body: "Click here and attach your transcript as a PDF — that's the missing piece.", conf: 95 },
	{ key: "agree",  title: "Accept the registration terms",  body: "Tick this box. The Submit button stays locked until you do.",                conf: 98 },
	{ key: "submit", title: "Submit your request",            body: "You're all set — click 'Submit Request' to finish your registration.",       conf: 97 },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

function Icon({ name, size = 20, stroke = 1.7 }: { name: string; size?: number; stroke?: number }) {
	const paths: Record<string, React.ReactNode> = {
		lock:     <path d="M6 11h12v9H6zM9 11V8a3 3 0 016 0v3M12 15v2" />,
		check:    <path d="M5 12.5l4.2 4.2L19 7" />,
		chevronD: <path d="M6 9l6 6 6-6" />,
		doc:      <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6" />,
		arrow:    <path d="M5 12h14M13 6l6 6-6 6" />,
		chat:     <path d="M4 5.5h16v10H9l-4 3.5v-3.5H4z" />,
		headset:  <path d="M4 13v-1a8 8 0 1116 0v1M4 13a2 2 0 012 2v2a2 2 0 01-4 0v-2a2 2 0 012-2zM20 13a2 2 0 00-2 2v2a2 2 0 004 0v-2a2 2 0 00-2-2zM18 17v1.5a2.5 2.5 0 01-2.5 2.5H13" />,
		shield:   <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z M9 12l2 2 4-4" />,
		clock:    <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 7.5V12l3 2" />,
		play:     <path d="M7 5l12 7-12 7z" />,
	};
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none"
			stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			{paths[name] ?? null}
		</svg>
	);
}

function Confidence({ value }: { value: number }) {
	return (
		<span className="inline-flex items-center gap-2">
			<span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: ".06em", color: "var(--muted)" }}>confidence</span>
			<span style={{ width: 54, height: 6, borderRadius: 99, background: "#E7EEEC", overflow: "hidden", display: "inline-block" }}>
				<span style={{ display: "block", height: "100%", width: `${value}%`, borderRadius: 99, background: "linear-gradient(90deg,var(--teal),var(--green))" }} />
			</span>
			<span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 500, color: "var(--teal-700)" }}>{value}%</span>
		</span>
	);
}

export default function MeerorDemoClient() {
	const [step, setStep] = useState(0);
	const [playing, setPlaying] = useState(true);
	const [seen, setSeen] = useState(false);
	const wrapRef = useRef<HTMLDivElement>(null);
	const termRef = useRef<HTMLDivElement>(null);
	const fileRef = useRef<HTMLDivElement>(null);
	const agreeRef = useRef<HTMLLabelElement>(null);
	const submitRef = useRef<HTMLButtonElement>(null);
	const [spot, setSpot] = useState<{ top: number; left: number; w: number; h: number } | null>(null);
	const [pop, setPop] = useState<{ top: number; left: number; place: string } | null>(null);

	const fieldRefs: Record<StepKey, React.RefObject<HTMLElement | null>> = {
		term: termRef as React.RefObject<HTMLElement>,
		file: fileRef as React.RefObject<HTMLElement>,
		agree: agreeRef as React.RefObject<HTMLElement>,
		submit: submitRef as React.RefObject<HTMLElement>,
	};

	// Always holds the latest measure fn so resize/observer callbacks never read a stale step.
	const measureRef = useRef<() => void>(() => {});
	measureRef.current = () => {
		const wrap = wrapRef.current;
		if (!wrap) return;
		const cur = STEPS[step];
		const el = fieldRefs[cur.key].current;
		if (!el) return;
		const wr = wrap.getBoundingClientRect();
		const r = el.getBoundingClientRect();
		if (r.width < 4) return;
		const pad = 8;
		const s = { top: r.top - wr.top - pad, left: r.left - wr.left - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
		setSpot(s);
		const popW = 252, popH = 252, gap = 16;
		let left = s.left + s.w + gap;
		let top = s.top - 4;
		let place = "right";
		if (left + popW > wr.width - 6) {
			place = "below";
			left = Math.min(s.left, wr.width - popW - 8);
			top = s.top + s.h + 12;
		}
		left = Math.max(8, left);
		top = Math.max(8, Math.min(top, wr.height - popH - 8));
		setPop({ top, left, place });
	};

	useLayoutEffect(() => { measureRef.current(); }, [step]);

	useEffect(() => {
		const wrap = wrapRef.current;
		if (!wrap) return;
		// Stable reference within this effect so addEventListener/removeEventListener pair matches.
		const remeasure = () => requestAnimationFrame(() => measureRef.current());
		remeasure();
		const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { setSeen(true); remeasure(); } }, { threshold: 0.12 });
		io.observe(wrap);
		const ro = new ResizeObserver(remeasure);
		ro.observe(wrap);
		window.addEventListener("resize", remeasure);
		return () => { io.disconnect(); ro.disconnect(); window.removeEventListener("resize", remeasure); };
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!playing || !seen) return;
		const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), 3000);
		return () => clearTimeout(t);
	}, [step, playing, seen]);

	const cur = STEPS[step];
	const done = (k: StepKey) => STEPS.findIndex((s) => s.key === k) < step;

	const fieldBase: React.CSSProperties = {
		borderRadius: 10, border: "1.5px solid var(--line-2)", background: "#fff",
		padding: "11px 13px", fontSize: 13.5, color: "var(--ink-2)",
		display: "flex", alignItems: "center", justifyContent: "space-between",
	};
	const card: React.CSSProperties = {
		background: "#fff", border: "1px solid var(--line)", borderRadius: 24,
		boxShadow: "0 4px 8px rgba(28,51,73,.05), 0 30px 60px -22px rgba(28,51,73,.22)",
	};

	return (
		<div style={{ ...card, padding: 0, overflow: "hidden", maxWidth: 760, margin: "0 auto" }}>
			{/* browser chrome */}
			<div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 15px", background: "#F3ECE0", borderBottom: "1px solid var(--line)" }}>
				<span style={{ display: "flex", gap: 6 }}>
					{["#E7836B", "#EBC15C", "#7FB85C"].map((c) => (
						<span key={c} style={{ width: 11, height: 11, borderRadius: 99, background: c }} />
					))}
				</span>
				<div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
					<span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11.5, color: "var(--muted)", background: "#fff", border: "1px solid var(--line)", padding: "5px 14px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 7 }}>
						<Icon name="lock" size={12} stroke={2} /> portal.northvale.edu/registration
					</span>
				</div>
				<span style={{ background: "var(--teal-050)", borderColor: "var(--teal-100)", color: "var(--teal-700)", padding: "5px 11px", fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, border: "1px solid var(--teal-100)", fontWeight: 600 }}>
					<span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--teal)", boxShadow: "0 0 0 3px var(--teal-100)" }} /> Meeror live
				</span>
			</div>

			{/* portal + overlay */}
			<div ref={wrapRef} style={{ position: "relative", background: "#FCFAF6" }}>
				<div style={{ display: "grid", gridTemplateColumns: "148px 1fr", minHeight: 386 }}>
					{/* sidebar */}
					<div style={{ background: "#1C3349", color: "#cdd8e0", padding: "16px 13px" }}>
						<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
							<span style={{ width: 24, height: 24, borderRadius: 7, background: "#34506b", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}>N</span>
							<span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>Northvale</span>
						</div>
						{(["Dashboard", "Registration", "Financials", "Records", "Help"] as const).map((t) => (
							<div key={t} style={{ padding: "8px 10px", borderRadius: 8, fontSize: 12.5, marginBottom: 3, fontWeight: t === "Registration" ? 700 : 500, background: t === "Registration" ? "#28425b" : "transparent", color: t === "Registration" ? "#fff" : "#9fb0bd" }}>{t}</div>
						))}
					</div>

					{/* form */}
					<div style={{ padding: "20px 22px" }}>
						<div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: ".06em", color: "var(--muted)", fontWeight: 600, marginBottom: 3 }}>FALL 2026 · COURSE REGISTRATION</div>
						<h4 style={{ fontSize: 18, marginBottom: 14, color: "var(--ink)", fontWeight: 800 }}>Submit your registration request</h4>
						<div style={{ display: "grid", gap: 11, maxWidth: 244 }}>
							<div ref={termRef} style={fieldBase}>
								<span style={{ color: done("term") ? "var(--ink)" : "var(--muted)", fontWeight: done("term") ? 600 : 500 }}>
									{done("term") ? "Fall 2026 — Full-time" : "Select enrollment term"}
								</span>
								{done("term") ? <Icon name="check" size={16} /> : <Icon name="chevronD" size={15} />}
							</div>
							<div ref={fileRef} style={{ ...fieldBase, borderStyle: done("file") ? "solid" : "dashed", background: done("file") ? "#fff" : "var(--cream)" }}>
								<span style={{ display: "flex", alignItems: "center", gap: 8, color: done("file") ? "var(--ink)" : "var(--muted)", fontWeight: done("file") ? 600 : 500 }}>
									<Icon name="doc" size={15} /> {done("file") ? "transcript_2026.pdf" : "Upload transcript (PDF)"}
								</span>
								{done("file") && <Icon name="check" size={16} />}
							</div>
							<label ref={agreeRef} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px", fontSize: 13, color: "var(--ink-2)" }}>
								<span style={{ width: 19, height: 19, borderRadius: 6, border: `1.5px solid ${done("agree") ? "var(--teal)" : "var(--line-2)"}`, background: done("agree") ? "var(--teal)" : "#fff", display: "grid", placeItems: "center", color: "#fff", transition: "all .2s" }}>
									{done("agree") && <Icon name="check" size={13} stroke={2.4} />}
								</span>
								I accept the registration terms &amp; academic policies
							</label>
							<button ref={submitRef} style={{ marginTop: 4, display: "flex", justifyContent: "center", alignItems: "center", borderRadius: 999, padding: "12px 20px", fontWeight: 700, fontSize: 14, background: done("agree") ? "var(--teal)" : "#E4DCCD", color: done("agree") ? "#fff" : "#A99", border: "none", cursor: done("agree") ? "pointer" : "default", transition: "all .2s" }}>
								Submit Request
							</button>
						</div>
					</div>
				</div>

				{/* spotlight */}
				{spot && (
					<div style={{ position: "absolute", top: spot.top, left: spot.left, width: spot.w, height: spot.h, borderRadius: 12, boxShadow: "0 0 0 9999px rgba(22,41,59,.42)", pointerEvents: "none", transition: "all .5s cubic-bezier(.4,.8,.2,1)", zIndex: 5 }}>
						<span style={{ position: "absolute", inset: -3, borderRadius: 14, border: "2.5px solid var(--teal)" }} />
						<span style={{ position: "absolute", inset: -3, borderRadius: 14, border: "2.5px solid var(--teal)", animation: "pulse-ring 1.8s ease-out infinite" }} />
					</div>
				)}

				{/* Meera popup */}
				{pop && (
					<div style={{ position: "absolute", top: pop.top, left: pop.left, width: 252, zIndex: 8, transition: "all .5s cubic-bezier(.4,.8,.2,1)" }}>
						<div style={{ ...card, padding: 0, overflow: "hidden", border: "1px solid var(--teal-100)" }}>
							<div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px 9px" }}>
								<span style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: "#FBEADD", flexShrink: 0, border: "1.5px solid #EBC9A8", display: "grid", placeItems: "center" }}>
									<Image src="/assets/meera-avatar.png" width={48} height={48} alt="" style={{ width: "150%", height: "auto" }} />
								</span>
								<div style={{ flex: 1 }}>
									<div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>Meera</div>
									<div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10.5, color: "var(--muted)" }}>guiding you · step {step + 1} of {STEPS.length}</div>
								</div>
								<span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10.5, color: "var(--teal-700)", background: "var(--teal-050)", padding: "3px 8px", borderRadius: 99 }}>{cur.conf}%</span>
							</div>
							<div style={{ padding: "0 13px 11px" }}>
								<div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3, color: "var(--ink)" }}>{cur.title}</div>
								<p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5, margin: 0 }}>{cur.body}</p>
							</div>
							{/* step dots */}
							<div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", borderTop: "1px solid var(--line)", background: "#FCFAF6" }}>
								<div style={{ display: "flex", gap: 5, flex: 1 }}>
									{STEPS.map((_, i) => (
										<span key={i} onClick={() => { setStep(i); setPlaying(false); }} style={{ height: 5, borderRadius: 99, cursor: "pointer", width: i === step ? 20 : 5, background: i === step ? "var(--teal)" : i < step ? "var(--teal-100)" : "#E2D6C2", transition: "all .3s" }} />
									))}
								</div>
								<button onClick={() => { setStep((s) => (s + 1) % STEPS.length); setPlaying(false); }}
									style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 13px", fontSize: 12.5, fontWeight: 700, background: "var(--teal)", color: "#fff", border: "none", borderRadius: 999, cursor: "pointer" }}>
									Next <Icon name="arrow" size={14} stroke={2.2} />
								</button>
							</div>
							{/* tray */}
							<div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 11px", borderTop: "1px solid var(--line)", background: "#F6EFE3" }}>
								{[["chat", "Chat"], ["headset", "Human"]].map(([icon, label]) => (
									<button key={icon} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--ink-2)", padding: "5px 10px", borderRadius: 8, background: "#fff", border: "1px solid var(--line)", cursor: "pointer" }}>
										<Icon name={icon} size={14} /> {label}
									</button>
								))}
								<span style={{ flex: 1 }} />
								<span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 4 }}>
									<Icon name="shield" size={12} stroke={2} /> this tab only
								</span>
							</div>
						</div>
						{pop.place === "right" && (
							<span style={{ position: "absolute", left: -7, top: 26, width: 14, height: 14, background: "#fff", borderLeft: "1px solid var(--teal-100)", borderBottom: "1px solid var(--teal-100)", transform: "rotate(45deg)" }} />
						)}
					</div>
				)}
			</div>

			{/* footer bar */}
			<div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: "#fff", borderTop: "1px solid var(--line)" }}>
				<button onClick={() => setPlaying((p) => !p)}
					style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", fontWeight: 700, fontSize: 13.5, background: "transparent", color: "var(--ink)", border: "1.5px solid var(--line-2)", borderRadius: 999, cursor: "pointer" }}>
					<Icon name={playing ? "clock" : "play"} size={14} /> {playing ? "Auto-guiding" : "Resume"}
				</button>
				<span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--muted)", flex: 1 }}>Meera highlights each step on the real screen — no guesswork.</span>
				<Confidence value={cur.conf} />
			</div>
		</div>
	);
}
