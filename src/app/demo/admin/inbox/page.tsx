"use client";

import { useMemo } from "react";
import { Button, Card, Confidence, Icon, IconChip, Pill } from "@/components/demo/shared";
import { DEPARTMENT_LABELS, type DemoTicket, type Severity } from "@/features/admin/types";
import { useAdmin, useActingAdmin } from "@/features/admin/store/admin-store";

function severityTint(severity: Severity): "default" | "teal" | "sand" | "rose" | "green" {
	if (severity === "Critical" || severity === "High") return "rose";
	if (severity === "Medium") return "sand";
	return "green";
}

function QueueButton({ ticket, active, onClick }: { ticket: DemoTicket; active: boolean; onClick: () => void }) {
	return (
		<button type="button" onClick={onClick} className="block w-full border-t px-4 py-3 text-left transition" style={{ borderColor: "var(--line)", background: active ? "var(--teal-050)" : "transparent", borderLeft: active ? "3px solid var(--teal)" : "3px solid transparent" }}>
			<div className="mb-1 flex items-center gap-2">
				<span className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>#{ticket.id}</span>
				<span className="ml-auto"><Pill tint={severityTint(ticket.severity)}>{ticket.severity}</Pill></span>
			</div>
			<div className="text-[13px] font-bold leading-snug">{ticket.title}</div>
			<div className="mt-2 flex flex-wrap items-center gap-2">
				<Pill tint="teal"><Icon name="sparkle" size={10} />{ticket.tag}</Pill>
				{ticket.cross ? <Pill tint="sand">Cross-dept</Pill> : null}
			</div>
		</button>
	);
}

function AdminBlock({ icon, label, children }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; children: React.ReactNode }) {
	return <div className="mb-4"><div className="mb-2 flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}><Icon name={icon} size={13} className="text-[#2E9C8E]" />{label}</div><div className="text-sm leading-6" style={{ color: "var(--ink-2)" }}>{children}</div></div>;
}

function TicketDetail({ ticket }: { ticket: DemoTicket }) {
	const admin = useAdmin();
	const actingAdmin = useActingAdmin();
	const claimedBy = ticket.claimedBy ? admin.admins.find((person) => person.id === ticket.claimedBy) : null;

	return (
		<section className="min-h-full overflow-y-auto bg-[#FCFAF6] p-5">
			<div className="mb-5 flex items-start gap-3">
				<IconChip name="ticket" tint="sand" size={44} />
				<div className="flex-1">
					<h1 className="text-xl font-[800] leading-tight">{ticket.title}</h1>
					<p className="font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>#{ticket.id} · routed to {DEPARTMENT_LABELS[ticket.ownerDept]}</p>
				</div>
				<Confidence value={Math.round(ticket.confidence * 100)} label="AI confidence" />
			</div>
			<div className="mb-4 flex flex-wrap gap-2">
				<Pill tint={severityTint(ticket.severity)}>{ticket.severity} severity</Pill>
				<Pill tint="teal">{ticket.complexity} complexity</Pill>
				<Pill>{ticket.status}</Pill>
				{claimedBy ? <Pill tint="green">Claimed by {claimedBy.name}</Pill> : <Pill>Unclaimed</Pill>}
			</div>
			<AdminBlock icon="sparkle" label="AI-generated summary">{ticket.aiSummary}</AdminBlock>
			<AdminBlock icon="layers" label="Collected by Meera">{ticket.collectedInformation}</AdminBlock>
			<AdminBlock icon="alert" label="Missing information">{ticket.missingInformation}</AdminBlock>
			<AdminBlock icon="wand" label="Suggested actions">
				<ul className="grid gap-1 pl-4">{ticket.suggestedActions.map((action) => <li key={action}>{action}</li>)}</ul>
				<div className="mt-3 flex flex-wrap gap-2">
					<Button variant="primary" onClick={() => actingAdmin ? void admin.claimTicket(ticket.id, actingAdmin.id) : undefined}><Icon name="check" size={14} />Claim</Button>
					<Button onClick={() => void admin.releaseTicket(ticket.id)}>Release</Button>
					<Button onClick={() => void admin.resolveTicket(ticket.id)}><Icon name="flag" size={14} />Resolve</Button>
				</div>
			</AdminBlock>
			{ticket.cross ? (
				<div className="mt-3 flex gap-3 rounded-2xl border p-4" style={{ background: "#FBE7E0", borderColor: "#F3D2C6", color: "#8A4A33" }}>
					<Icon name="alert" size={20} />
					<div>
						<div className="font-bold">Cross-department dependency</div>
						<p className="mt-1 text-sm leading-6">
							{ticket.cross.participants.map((participant) => DEPARTMENT_LABELS[participant.dept]).join(" + ")}
						</p>
					</div>
				</div>
			) : null}
		</section>
	);
}

function ReviewPanel({ ticket }: { ticket: DemoTicket }) {
	return (
		<aside className="hidden border-l bg-white p-4 xl:block" style={{ borderColor: "var(--line)" }}>
			<div className="mb-4 flex items-center gap-3">
				<IconChip name="chat" tint="teal" size={36} />
				<div>
					<div className="font-[800]">Conversation</div>
					<div className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>{ticket.conversation.length} messages</div>
				</div>
			</div>
			<div className="grid gap-3">
				{ticket.conversation.map((message) => (
					<div key={`${message.at}-${message.role}`} className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: message.role === "meera" ? "var(--teal-050)" : "#fff" }}>
						<div className="mb-1 font-['DM_Mono'] text-[10px] uppercase" style={{ color: "var(--muted)" }}>{message.role}</div>
						<p className="text-sm leading-6" style={{ color: "var(--ink-2)" }}>{message.text}</p>
					</div>
				))}
			</div>
		</aside>
	);
}

export default function AdminInboxPage() {
	const admin = useAdmin();
	const tickets = useMemo(() => admin.tickets.filter((ticket) => ticket.ownerDept === admin.activeDepartment || ticket.cross?.participants.some((participant) => participant.dept === admin.activeDepartment)), [admin.activeDepartment, admin.tickets]);
	const selected = tickets.find((ticket) => ticket.id === admin.selectedTicketId) ?? tickets.at(0) ?? null;

	if (admin.loading) {
		return <div className="grid h-full place-items-center text-sm font-bold" style={{ color: "var(--muted)" }}>Loading admin dashboard...</div>;
	}

	return (
		<div className="flex min-h-0 h-full flex-col">
			<div className="flex items-center gap-3 border-b bg-white px-5 py-3" style={{ borderColor: "var(--line)" }}>
				<IconChip name="eye" tint="teal" size={30} />
				<span className="font-[800]">Meera Lookout</span>
				<Pill>{DEPARTMENT_LABELS[admin.activeDepartment]}</Pill>
				<span className="ml-auto font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>{tickets.length} tickets · needs review</span>
			</div>
			<div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_320px] md:overflow-hidden">
				<div className="border-r bg-white" style={{ borderColor: "var(--line)" }}>
					<div className="flex items-center justify-between px-4 py-3">
						<span className="text-sm font-bold">Ticket queue</span>
						<span className="font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>newest first</span>
					</div>
					{tickets.map((ticket) => <QueueButton key={ticket.id} ticket={ticket} active={ticket.id === selected?.id} onClick={() => admin.selectTicket(ticket.id)} />)}
				</div>
				{selected ? <TicketDetail ticket={selected} /> : <Card className="m-5 p-5">No tickets for this department.</Card>}
				{selected ? <ReviewPanel ticket={selected} /> : null}
			</div>
		</div>
	);
}
