"use client";

import Link from "next/link";
import { Card, Icon, Pill, type IconName } from "@/components/demo/shared";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS, type DemoTicket, type DepartmentCode } from "@/features/admin/types";

type Tone = "rose" | "sand" | "teal" | "green";

type Note = {
	id: string;
	group: "attention" | "activity";
	icon: IconName;
	tone: Tone;
	title: string;
	detail: string;
	ticketId: string;
	at: number;
};

function relativeTime(at: number) {
	const diff = Date.now() - at;
	const hours = Math.round(diff / 3_600_000);
	if (hours < 1) return "just now";
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	return `${days}d ago`;
}

function buildNotifications(tickets: DemoTicket[], dept: DepartmentCode): Note[] {
	const notes: Note[] = [];
	for (const ticket of tickets) {
		const pending = ticket.cross?.participants.find((participant) => participant.dept === dept && participant.decision === "pending");
		if (pending) {
			notes.push({ id: `cross-${ticket.id}`, group: "attention", icon: "route", tone: "rose", title: "Cross-department request", detail: `${ticket.title} — accept or reject for ${DEPARTMENT_LABELS[dept]}`, ticketId: ticket.id, at: ticket.createdAt });
		}
		if (!ticket.claimedBy && (ticket.severity === "Critical" || ticket.severity === "High") && ticket.status !== "Resolved") {
			notes.push({ id: `unclaimed-${ticket.id}`, group: "attention", icon: "flag", tone: "sand", title: `${ticket.severity}-severity ticket unclaimed`, detail: ticket.title, ticketId: ticket.id, at: ticket.createdAt });
		}
		if (ticket.status === "New") {
			notes.push({ id: `new-${ticket.id}`, group: "activity", icon: "sparkle", tone: "teal", title: "New escalation from Meera", detail: ticket.title, ticketId: ticket.id, at: ticket.createdAt });
		}
		if (ticket.status === "Awaiting student") {
			notes.push({ id: `await-${ticket.id}`, group: "activity", icon: "clock", tone: "sand", title: "Awaiting student info", detail: ticket.title, ticketId: ticket.id, at: ticket.createdAt });
		}
		if (ticket.status === "Resolved") {
			notes.push({ id: `done-${ticket.id}`, group: "activity", icon: "check", tone: "green", title: "Ticket resolved", detail: ticket.title, ticketId: ticket.id, at: ticket.createdAt });
		}
	}
	return notes.sort((a, b) => b.at - a.at);
}

function NoteRow({ note }: { note: Note }) {
	const admin = useAdmin();
	const tints: Record<Tone, { bg: string; fg: string }> = {
		rose: { bg: "#FCE9E1", fg: "#a95338" },
		sand: { bg: "var(--sand-050)", fg: "var(--sand-600)" },
		teal: { bg: "var(--teal-050)", fg: "var(--teal-700)" },
		green: { bg: "var(--green-050)", fg: "#4f7e32" },
	};
	const tint = tints[note.tone];
	return (
		<Link href="/demo/admin/inbox" onClick={() => admin.selectTicket(note.ticketId)} className="flex items-center gap-3 rounded-2xl border bg-white p-3 transition hover:-translate-y-0.5" style={{ borderColor: "var(--line)" }}>
			<span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: tint.bg, color: tint.fg }}>
				<Icon name={note.icon} size={18} />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-[14px] font-[800]" style={{ color: "var(--ink)" }}>{note.title}</span>
				<span className="block truncate text-[13px]" style={{ color: "var(--ink-2)" }}>{note.detail}</span>
			</span>
			<span className="shrink-0 font-['DM_Mono'] text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--muted)" }}>#{note.ticketId}</span>
			<span className="shrink-0 font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>{relativeTime(note.at)}</span>
		</Link>
	);
}

export default function AdminNotificationsPage() {
	const { tickets, activeDepartment, loading } = useAdmin();

	if (loading) {
		return <div className="grid h-full place-items-center text-sm font-bold" style={{ color: "var(--muted)" }}>Loading notifications...</div>;
	}

	const deptTickets = tickets.filter((ticket) => ticket.ownerDept === activeDepartment || ticket.cross?.participants.some((participant) => participant.dept === activeDepartment));
	const notes = buildNotifications(deptTickets, activeDepartment);
	const attention = notes.filter((note) => note.group === "attention");
	const activity = notes.filter((note) => note.group === "activity");

	return (
		<div className="mx-auto w-[min(840px,calc(100%-2rem))] py-6">
			<header className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>Notifications</p>
					<h1 className="mt-1 text-3xl font-[800]">{DEPARTMENT_LABELS[activeDepartment]} activity</h1>
					<p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-2)" }}>What needs a human, and what Meera has been doing for this department.</p>
				</div>
				<Pill tint={attention.length > 0 ? "rose" : "green"}>{attention.length} need attention</Pill>
			</header>

			<section className="mb-6">
				<p className="mb-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Needs attention</p>
				{attention.length === 0 ? (
					<Card className="p-5 text-sm font-bold" >Nothing needs a human right now.</Card>
				) : (
					<div className="grid gap-2">{attention.map((note) => <NoteRow key={note.id} note={note} />)}</div>
				)}
			</section>

			<section>
				<p className="mb-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Recent activity</p>
				{activity.length === 0 ? (
					<Card className="p-5 text-sm font-bold">No recent activity.</Card>
				) : (
					<div className="grid gap-2">{activity.map((note) => <NoteRow key={note.id} note={note} />)}</div>
				)}
			</section>
		</div>
	);
}
