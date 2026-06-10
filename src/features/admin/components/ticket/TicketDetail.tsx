"use client";

import { useState } from "react";
import { Confidence, Icon, IconChip, Pill, type IconName } from "@/components/demo/shared";
import { Collapsible } from "@/features/admin/components/inbox/Collapsible";
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

function severityTint(severity: Severity): "default" | "teal" | "sand" | "rose" | "green" {
	if (severity === "Critical" || severity === "High") return "rose";
	if (severity === "Medium") return "sand";
	return "green";
}

function formatTime(at: number) {
	return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(at));
}

function StudentContact({ email }: { email: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<div className="mb-4 flex items-center gap-3 rounded-2xl border p-3" style={{ background: "var(--teal-050)", borderColor: "var(--teal-100)" }}>
			<span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white" style={{ color: "var(--teal-700)" }}>
				<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<rect x="3" y="5" width="18" height="14" rx="2" />
					<path d="m3 7 9 6 9-6" />
				</svg>
			</span>
			<div className="min-w-0 flex-1">
				<p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>Student contact · email</p>
				<a href={`mailto:${email}`} className="block truncate text-[15px] font-[800] underline-offset-2 hover:underline" style={{ color: "var(--ink)" }}>{email}</a>
			</div>
			<button
				type="button"
				onClick={async () => {
					try {
						await navigator.clipboard.writeText(email);
						setCopied(true);
						setTimeout(() => setCopied(false), 1500);
					} catch {
						/* clipboard unavailable */
					}
				}}
				className="shrink-0 rounded-full border bg-white px-3 py-1.5 text-xs font-[800] transition hover:-translate-y-0.5"
				style={{ borderColor: "var(--teal-100)", color: "var(--teal-700)" }}
			>
				{copied ? "Copied" : "Copy"}
			</button>
			<a href={`mailto:${email}`} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-[800] text-white transition hover:-translate-y-0.5" style={{ background: "var(--teal)" }}>Email</a>
		</div>
	);
}

function ViewBlock({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
	return (
		<div className="mb-4">
			<div className="mb-2 flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>
				<Icon name={icon} size={13} className="text-[#2E9C8E]" />
				{label}
			</div>
			<div className="text-sm leading-6" style={{ color: "var(--ink-2)" }}>{children}</div>
		</div>
	);
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<label className="mb-3 grid gap-1.5">
			<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>{label}</span>
			{children}
		</label>
	);
}

const inputClass = "rounded-xl border bg-[#FCFAF6] px-3 py-2 text-sm font-semibold leading-6 outline-none transition focus:border-[var(--teal)]";

export function TicketDetail({ ticket }: { ticket: DemoTicket }) {
	const admin = useAdmin();
	const [editing, setEditing] = useState(false);
	const [title, setTitle] = useState(ticket.title);
	const [severity, setSeverity] = useState(ticket.severity);
	const [complexity, setComplexity] = useState(ticket.complexity);
	const [aiSummary, setAiSummary] = useState(ticket.aiSummary);
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
				aiSummary,
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
		setAiSummary(ticket.aiSummary);
		setCollected(ticket.collectedInformation);
		setMissing(ticket.missingInformation);
		setActions(ticket.suggestedActions.join("\n"));
		setEditing(false);
	}

	return (
		<section className="p-5">
			<div className="mb-4 flex items-start gap-3">
				<IconChip name="ticket" tint="sand" size={44} />
				<div className="min-w-0 flex-1">
					{editing ? (
						<input value={title} onChange={(event) => setTitle(event.target.value)} className={`w-full text-lg font-[800] ${inputClass}`} />
					) : (
						<h1 className="text-xl font-[800] leading-tight">{ticket.title}</h1>
					)}
					<p className="mt-1 font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>#{ticket.id} · routed to {DEPARTMENT_LABELS[ticket.ownerDept]}</p>
				</div>
				<Confidence value={Math.round(ticket.confidence * 100)} label="AI confidence" />
			</div>

			<div className="mb-4 flex flex-wrap items-center gap-2">
				<DibsButton ticket={ticket} />
				{editing ? (
					<>
						<button type="button" onClick={save} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-[800] text-white transition hover:-translate-y-0.5" style={{ background: "var(--teal)" }}>
							<Icon name="check" size={14} />Save changes
						</button>
						<button type="button" onClick={cancel} className="rounded-full border px-4 py-2 text-sm font-[800] transition hover:bg-[var(--cream)]" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>Cancel</button>
					</>
				) : (
					<button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-[800] transition hover:bg-[var(--cream)]" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
						<Icon name="wand" size={14} />Edit triage
					</button>
				)}
				<span className="flex-1" />
				{resolved ? (
					<Pill tint="green">Resolved</Pill>
				) : (
					<button type="button" onClick={() => void admin.resolveTicket(ticket.id)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-[800] text-white transition hover:-translate-y-0.5" style={{ background: "var(--ink)" }}>
						<Icon name="flag" size={14} />Mark resolved
					</button>
				)}
			</div>

			<StudentContact email={ticket.student} />

			{editing ? (
				<div className="mb-4 grid gap-3 rounded-2xl border p-3 sm:grid-cols-2" style={{ borderColor: "var(--line)", background: "#FCFAF6" }}>
					<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
						Severity
						<select value={severity} onChange={(event) => setSeverity(event.target.value as Severity)} className="rounded-xl border bg-white px-3 py-2 text-sm font-bold outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
							{severities.map((option) => <option key={option} value={option}>{option}</option>)}
						</select>
					</label>
					<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
						Complexity
						<select value={complexity} onChange={(event) => setComplexity(event.target.value as Complexity)} className="rounded-xl border bg-white px-3 py-2 text-sm font-bold outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
							{complexities.map((option) => <option key={option} value={option}>{option}</option>)}
						</select>
					</label>
				</div>
			) : (
				<div className="mb-4 flex flex-wrap gap-2">
					<Pill tint={severityTint(ticket.severity)}>{ticket.severity} severity</Pill>
					<Pill tint="teal">{ticket.complexity} complexity</Pill>
					<Pill>{ticket.status}</Pill>
					<Pill tint={ticket.claimedBy ? "green" : "default"}>{claimedByName ? `Claimed by ${claimedByName}` : "Unclaimed"}</Pill>
					{ticket.kbIngested ? <Pill tint="green">In knowledge base</Pill> : null}
					{ticket.edited ? <Pill tint="green">Edited by staff</Pill> : null}
				</div>
			)}

			{ticket.cross ? <div className="mb-4"><CrossDeptBadge ticket={ticket} /></div> : null}

			{editing ? (
				<>
					<EditField label="AI summary"><textarea value={aiSummary} onChange={(event) => setAiSummary(event.target.value)} className={`min-h-20 ${inputClass}`} /></EditField>
					<EditField label="Collected information"><textarea value={collected} onChange={(event) => setCollected(event.target.value)} className={`min-h-16 ${inputClass}`} /></EditField>
					<EditField label="Missing information"><textarea value={missing} onChange={(event) => setMissing(event.target.value)} className={`min-h-16 ${inputClass}`} /></EditField>
					<EditField label="Suggested actions, one per line"><textarea value={actions} onChange={(event) => setActions(event.target.value)} className={`min-h-24 ${inputClass}`} /></EditField>
				</>
			) : (
				<>
					<ViewBlock icon="sparkle" label="AI summary">{ticket.aiSummary}</ViewBlock>
					<ViewBlock icon="layers" label="Collected information">{ticket.collectedInformation}</ViewBlock>
					<ViewBlock icon="alert" label="Missing information">{ticket.missingInformation}</ViewBlock>
					<ViewBlock icon="wand" label="Suggested actions">
						<ul className="grid gap-1 pl-4">
							{ticket.suggestedActions.map((action) => <li key={action}>{action}</li>)}
						</ul>
					</ViewBlock>
				</>
			)}

			<div className="mb-4">
				<Collapsible title={`Chat transcript · ${ticket.conversation.length} messages`}>
					<div className="grid gap-2">
						{ticket.conversation.length === 0 ? (
							<p className="text-sm font-bold" style={{ color: "var(--muted)" }}>No transcript captured.</p>
						) : (
							ticket.conversation.map((message) => (
								<div key={`${message.at}-${message.role}`} className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: message.role === "meera" ? "var(--teal-050)" : "#fff" }}>
									<div className="mb-1 flex items-center justify-between gap-2 font-['DM_Mono'] text-[10px] uppercase" style={{ color: "var(--muted)" }}>
										<span>{message.role}</span>
										<span>{formatTime(message.at)}</span>
									</div>
									<p className="text-sm leading-6" style={{ color: "var(--ink-2)" }}>{message.text}</p>
								</div>
							))
						)}
					</div>
				</Collapsible>
			</div>

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
		</section>
	);
}
