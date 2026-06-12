"use client";

import { useEffect, useState } from "react";
import { Confidence, Icon, Pill } from "@/components/demo/shared";
import { AcceptRejectPanel } from "@/features/admin/components/crossdept/AcceptRejectPanel";
import { CollaborationWorkspace } from "@/features/admin/components/crossdept/CollaborationWorkspace";
import { CrossDeptBadge } from "@/features/admin/components/crossdept/CrossDeptBadge";
import { EscalateCrossDept } from "@/features/admin/components/crossdept/EscalateCrossDept";
import { KbIngestPrompt } from "@/features/admin/components/kb/KbIngestPrompt";
import { AdminThread } from "@/features/admin/components/thread/AdminThread";
import { DibsButton } from "@/features/admin/components/thread/DibsButton";
import { NoteComposer } from "@/features/admin/components/thread/NoteComposer";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS, type Complexity, type DemoTicket, type Severity } from "@/features/admin/types";

const severities: Severity[] = ["Low", "Medium", "High", "Critical"];
const complexities: Complexity[] = ["Low", "Medium", "High"];

function severityTint(severity: Severity): "default" | "sand" | "rose" | "green" {
	if (severity === "Critical" || severity === "High") return "rose";
	if (severity === "Medium") return "sand";
	return "green";
}

function formatTime(at: number) {
	return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(at));
}

const inputClass = "w-full rounded-lg border bg-white px-3 py-2 text-[14px] leading-6 outline-none transition focus:border-[var(--teal)] focus:shadow-[0_0_0_3px_var(--teal-050)]";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<section className="border-t pt-4" style={{ borderColor: "var(--line)" }}>
			<p className="mb-1.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>{label}</p>
			<div className="text-[14px] leading-6" style={{ color: "var(--ink-2)" }}>{children}</div>
		</section>
	);
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<label className="grid gap-1.5 border-t pt-4" style={{ borderColor: "var(--line)" }}>
			<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>{label}</span>
			{children}
		</label>
	);
}

function TranscriptDrawer({ ticket, onClose }: { ticket: DemoTicket; onClose: () => void }) {
	const [entered, setEntered] = useState(false);
	useEffect(() => {
		const frame = requestAnimationFrame(() => setEntered(true));
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
		document.addEventListener("keydown", onKey);
		return () => {
			cancelAnimationFrame(frame);
			document.removeEventListener("keydown", onKey);
		};
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-[200]">
			<div className="absolute inset-0 transition-opacity" style={{ background: "rgba(28,51,73,0.28)", opacity: entered ? 1 : 0 }} onClick={onClose} />
			<div
				className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l bg-white"
				style={{ borderColor: "var(--line)", boxShadow: "var(--sh-lg)", transform: entered ? "translateX(0)" : "translateX(100%)", transition: "transform 0.22s ease" }}
			>
				<div className="flex items-center gap-3 border-b px-4 py-3.5" style={{ borderColor: "var(--line)" }}>
					<div className="min-w-0 flex-1">
						<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--teal-700)" }}>Conversation</p>
						<p className="truncate text-[14px] font-[800]">#{ticket.id} · {ticket.student}</p>
					</div>
					<button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full border transition hover:bg-[var(--cream)]" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }} aria-label="Close transcript">
						<Icon name="x" size={14} />
					</button>
				</div>
				<div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" style={{ background: "#FCFAF6" }}>
					{ticket.conversation.length === 0 ? (
						<p className="text-sm font-bold" style={{ color: "var(--muted)" }}>No transcript captured.</p>
					) : (
						ticket.conversation.map((message) => {
							const fromMeera = message.role === "meera";
							return (
								<div key={`${message.at}-${message.role}`} className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${fromMeera ? "mr-auto" : "ml-auto"}`} style={{ background: fromMeera ? "#fff" : "var(--teal-050)", border: `1px solid ${fromMeera ? "var(--line)" : "var(--teal-100)"}` }}>
									<div className="mb-1 flex items-center justify-between gap-3 font-['DM_Mono'] text-[9px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>
										<span>{fromMeera ? "Meera" : "Student"}</span>
										<span>{formatTime(message.at)}</span>
									</div>
									<p className="text-[13.5px] leading-6" style={{ color: "var(--ink-2)" }}>{message.text}</p>
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}

export function TicketDetail({ ticket }: { ticket: DemoTicket }) {
	const admin = useAdmin();
	const [editing, setEditing] = useState(false);
	const [transcriptOpen, setTranscriptOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [title, setTitle] = useState(ticket.title);
	const [severity, setSeverity] = useState(ticket.severity);
	const [complexity, setComplexity] = useState(ticket.complexity);
	const [summary, setSummary] = useState(ticket.aiSummary);
	const [collected, setCollected] = useState(ticket.collectedInformation);
	const [missing, setMissing] = useState(ticket.missingInformation);
	const [actions, setActions] = useState(ticket.suggestedActions.join("\n"));

	const claimedByName = ticket.claimedBy ? admin.admins.find((person) => person.id === ticket.claimedBy)?.name ?? "Unknown admin" : null;
	const resolved = ticket.status === "Resolved";

	function save() {
		void admin
			.updateTicket(ticket.id, {
				title: title.trim() || ticket.title,
				severity,
				complexity,
				aiSummary: summary,
				collectedInformation: collected,
				missingInformation: missing,
				suggestedActions: actions.split("\n").map((line) => line.trim()).filter(Boolean),
				edited: true,
			})
			.then(() => setEditing(false));
	}

	function cancel() {
		setTitle(ticket.title);
		setSeverity(ticket.severity);
		setComplexity(ticket.complexity);
		setSummary(ticket.aiSummary);
		setCollected(ticket.collectedInformation);
		setMissing(ticket.missingInformation);
		setActions(ticket.suggestedActions.join("\n"));
		setEditing(false);
	}

	async function deleteTicket() {
		if (!window.confirm(`Delete ticket ${ticket.id}? This removes it from the admin inbox.`)) return;
		setDeleting(true);
		try {
			await admin.deleteTicket(ticket.id);
		} finally {
			setDeleting(false);
		}
	}

	return (
		<section className="px-4 py-5 sm:px-6 sm:py-6">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
				<div className="min-w-0 flex-1">
					{editing ? (
						<input value={title} onChange={(event) => setTitle(event.target.value)} className={`text-[18px] font-[800] ${inputClass}`} />
					) : (
						<h1 className="text-[22px] font-[800] leading-tight tracking-[-0.01em]">{ticket.title}</h1>
					)}
					<p className="mt-1.5 font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>#{ticket.id} · routed to {DEPARTMENT_LABELS[ticket.ownerDept]}</p>
				</div>
				<div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end">
					<Confidence value={Math.round(ticket.confidence * 100)} label="AI confidence" />
					<button type="button" onClick={() => setTranscriptOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition hover:bg-[var(--cream)]" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
						<Icon name="chat" size={14} />Transcript
						<span className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>{ticket.conversation.length}</span>
					</button>
				</div>
			</div>

			{/* Meta */}
			{!editing ? (
				<div className="mt-4 flex flex-wrap items-center gap-2">
					<Pill tint={severityTint(ticket.severity)}>{ticket.severity}</Pill>
					<Pill>{ticket.complexity} complexity</Pill>
					<Pill>{ticket.status}</Pill>
					{ticket.claimedBy ? <Pill tint="green">{claimedByName}</Pill> : null}
					{ticket.kbIngested ? <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--muted)" }}>· In KB</span> : null}
					{ticket.edited ? <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--muted)" }}>· Edited</span> : null}
				</div>
			) : null}

			{/* Contact */}
			<div className="mt-4 flex items-center gap-3 rounded-xl border bg-white p-2.5" style={{ borderColor: "var(--line)" }}>
				<span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: "var(--teal-050)", color: "var(--teal-700)" }}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<rect x="3" y="5" width="18" height="14" rx="2" />
						<path d="m3 7 9 6 9-6" />
					</svg>
				</span>
				<div className="min-w-0 flex-1">
					<p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>Student · email</p>
					<a href={`mailto:${ticket.student}`} className="block truncate text-[14px] font-[800] underline-offset-2 hover:underline" style={{ color: "var(--ink)" }}>{ticket.student}</a>
				</div>
				<a href={`mailto:${ticket.student}`} className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold text-white transition hover:-translate-y-0.5" style={{ background: "var(--teal)" }}>Email</a>
			</div>

			{/* Actions */}
			<div className="mt-4 flex flex-wrap items-center gap-2">
				{editing ? (
					<>
						<button type="button" onClick={save} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-[800] text-white transition hover:-translate-y-0.5" style={{ background: "var(--teal)" }}>
							<Icon name="check" size={14} />Save changes
						</button>
						<button type="button" onClick={cancel} className="rounded-full border px-4 py-2 text-[13px] font-[800] transition hover:bg-[var(--cream)]" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>Cancel</button>
					</>
				) : (
					<>
						<button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-[800] transition hover:bg-[var(--cream)]" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
							<Icon name="wand" size={14} />Edit triage
						</button>
						<DibsButton ticket={ticket} />
						<span className="hidden flex-1 sm:block" />
						{resolved ? (
							<Pill tint="green">Resolved</Pill>
						) : (
							<button type="button" onClick={() => void admin.resolveTicket(ticket.id)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-[800] text-white transition hover:-translate-y-0.5" style={{ background: "var(--ink)" }}>
								<Icon name="check" size={14} />Mark resolved
							</button>
						)}
						<button
							type="button"
							disabled={deleting}
							onClick={() => void deleteTicket()}
							className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-[800] transition hover:bg-[#FBE7E0] disabled:cursor-wait disabled:opacity-60"
							style={{ borderColor: "#F3D2C6", color: "var(--rose)" }}
						>
							<Icon name="x" size={14} />
							{deleting ? "Deleting" : "Delete ticket"}
						</button>
					</>
				)}
			</div>

			{ticket.cross ? <div className="mt-4"><CrossDeptBadge ticket={ticket} /></div> : null}

			{/* Body */}
			<div className="mt-5 grid gap-4">
				{editing ? (
					<>
						<div className="grid gap-4 sm:grid-cols-2">
							<label className="grid gap-1.5">
								<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>Severity</span>
								<select value={severity} onChange={(event) => setSeverity(event.target.value as Severity)} className="rounded-lg border bg-white px-3 py-2 text-[14px] font-bold outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
									{severities.map((option) => <option key={option} value={option}>{option}</option>)}
								</select>
							</label>
							<label className="grid gap-1.5">
								<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>Complexity</span>
								<select value={complexity} onChange={(event) => setComplexity(event.target.value as Complexity)} className="rounded-lg border bg-white px-3 py-2 text-[14px] font-bold outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
									{complexities.map((option) => <option key={option} value={option}>{option}</option>)}
								</select>
							</label>
						</div>
						<EditField label="Summary"><textarea value={summary} onChange={(event) => setSummary(event.target.value)} className={`min-h-20 ${inputClass}`} /></EditField>
						<EditField label="Collected information"><textarea value={collected} onChange={(event) => setCollected(event.target.value)} className={`min-h-16 ${inputClass}`} /></EditField>
						<EditField label="Missing information"><textarea value={missing} onChange={(event) => setMissing(event.target.value)} className={`min-h-16 ${inputClass}`} /></EditField>
						<EditField label="Suggested actions, one per line"><textarea value={actions} onChange={(event) => setActions(event.target.value)} className={`min-h-24 ${inputClass}`} /></EditField>
					</>
				) : (
					<>
						<Section label="Summary">{ticket.aiSummary}</Section>
						<Section label="Collected information">{ticket.collectedInformation}</Section>
						<Section label="Missing information">{ticket.missingInformation}</Section>
						<Section label="Suggested actions">
							<ul className="grid gap-1.5">
								{ticket.suggestedActions.map((action) => (
									<li key={action} className="flex gap-2">
										<span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: "var(--teal)" }} />
										<span>{action}</span>
									</li>
								))}
							</ul>
						</Section>
					</>
				)}
			</div>

			<div className="mt-5 grid gap-4">
				<AcceptRejectPanel ticket={ticket} />
				<EscalateCrossDept ticket={ticket} />
				<KbIngestPrompt ticket={ticket} />
				{ticket.cross?.active ? (
					<CollaborationWorkspace ticket={ticket} />
				) : (
					<>
						<AdminThread ticket={ticket} />
						<NoteComposer ticketId={ticket.id} />
					</>
				)}
			</div>

			{transcriptOpen ? <TranscriptDrawer ticket={ticket} onClose={() => setTranscriptOpen(false)} /> : null}
		</section>
	);
}
