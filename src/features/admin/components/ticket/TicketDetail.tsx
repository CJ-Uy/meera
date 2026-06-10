"use client";

import { Confidence, Icon, IconChip, Pill, type IconName } from "@/components/demo/shared";
import { DEPARTMENT_LABELS, type DemoTicket, type Severity } from "@/features/admin/types";

function severityTint(severity: Severity): "default" | "teal" | "sand" | "rose" | "green" {
	if (severity === "Critical" || severity === "High") return "rose";
	if (severity === "Medium") return "sand";
	return "green";
}

function DetailBlock({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
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

export function TicketDetail({ ticket }: { ticket: DemoTicket }) {
	return (
		<section className="border-b p-5" style={{ borderColor: "var(--line)" }}>
			<div className="mb-5 flex items-start gap-3">
				<IconChip name="ticket" tint="sand" size={44} />
				<div className="min-w-0 flex-1">
					<h1 className="text-xl font-[800] leading-tight">{ticket.title}</h1>
					<p className="font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>#{ticket.id} · {ticket.student} · routed to {DEPARTMENT_LABELS[ticket.ownerDept]}</p>
				</div>
				<Confidence value={Math.round(ticket.confidence * 100)} label="AI confidence" />
			</div>
			<div className="mb-4 flex flex-wrap gap-2">
				<Pill tint={severityTint(ticket.severity)}>{ticket.severity} severity</Pill>
				<Pill tint="teal">{ticket.complexity} complexity</Pill>
				<Pill>{ticket.status}</Pill>
				<Pill tint={ticket.claimedBy ? "green" : "default"}>{ticket.claimedBy ? "Claimed" : "Unclaimed"}</Pill>
				{ticket.cross ? <Pill tint="sand">Cross-dept</Pill> : null}
				{ticket.edited ? <Pill tint="green">Edited by staff</Pill> : null}
			</div>
			<DetailBlock icon="sparkle" label="AI summary">{ticket.aiSummary}</DetailBlock>
			<DetailBlock icon="layers" label="Collected information">{ticket.collectedInformation}</DetailBlock>
			<DetailBlock icon="alert" label="Missing information">{ticket.missingInformation}</DetailBlock>
			<DetailBlock icon="wand" label="Suggested actions">
				<ul className="grid gap-1 pl-4">
					{ticket.suggestedActions.map((action) => <li key={action}>{action}</li>)}
				</ul>
			</DetailBlock>
			{ticket.cross ? (
				<div className="mt-3 flex gap-3 rounded-2xl border p-4" style={{ background: "#FBE7E0", borderColor: "#F3D2C6", color: "#8A4A33" }}>
					<Icon name="alert" size={20} />
					<div>
						<div className="font-bold">Cross-department dependency</div>
						<p className="mt-1 text-sm leading-6">
							{ticket.cross.participants.map((participant) => `${DEPARTMENT_LABELS[participant.dept]} (${participant.decision})`).join(" + ")}
						</p>
					</div>
				</div>
			) : null}
		</section>
	);
}
