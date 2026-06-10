"use client";

import { Card, Pill } from "@/components/demo/shared";
import { departmentAccent, initialsOf } from "@/features/admin/department-theme";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS, type DemoTicket, type Severity } from "@/features/admin/types";

function severityTint(severity: Severity): "rose" | "sand" | "green" {
	if (severity === "Critical" || severity === "High") return "rose";
	if (severity === "Medium") return "sand";
	return "green";
}

function Avatar({ name, code, size = 44 }: { name: string; code: "IT" | "REG" | "MED" | "SS" | "FIN"; size?: number }) {
	const accent = departmentAccent(code);
	return (
		<span className="grid shrink-0 place-items-center rounded-full font-[800]" style={{ width: size, height: size, background: accent.soft, color: accent.text, border: `1.5px solid ${accent.solid}`, fontSize: size * 0.36 }}>
			{initialsOf(name)}
		</span>
	);
}

function TicketRow({ ticket }: { ticket: DemoTicket }) {
	return (
		<div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--line)", background: "#fff" }}>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-[13px] font-bold" style={{ color: "var(--ink)" }}>{ticket.title}</span>
				<span className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>#{ticket.id}</span>
			</span>
			<Pill tint={severityTint(ticket.severity)}>{ticket.severity}</Pill>
			<Pill tint={ticket.status === "Resolved" ? "green" : "default"}>{ticket.status}</Pill>
		</div>
	);
}

export default function AdminTeamPage() {
	const { admins, tickets, activeDepartment, loading } = useAdmin();

	if (loading) {
		return <div className="grid h-full place-items-center text-sm font-bold" style={{ color: "var(--muted)" }}>Loading team...</div>;
	}

	const team = admins.filter((person) => person.dept === activeDepartment);
	const deptTickets = tickets.filter((ticket) => ticket.ownerDept === activeDepartment || ticket.cross?.participants.some((participant) => participant.dept === activeDepartment));
	const unclaimed = deptTickets.filter((ticket) => !ticket.claimedBy && ticket.status !== "Resolved");

	return (
		<div className="mx-auto w-[min(1100px,calc(100%-2rem))] py-6">
			<header className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>Team</p>
					<h1 className="mt-1 text-3xl font-[800]">{DEPARTMENT_LABELS[activeDepartment]} team</h1>
					<p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-2)" }}>Who owns what right now — claimed tickets and current workload per admin.</p>
				</div>
				<div className="flex gap-2">
					<Pill tint="teal">{team.length} admins</Pill>
					<Pill tint={unclaimed.length > 0 ? "rose" : "green"}>{unclaimed.length} unclaimed</Pill>
				</div>
			</header>

			<div className="grid gap-4 lg:grid-cols-2">
				{team.map((member) => {
					const claimed = deptTickets.filter((ticket) => ticket.claimedBy === member.id);
					const working = claimed.filter((ticket) => ticket.status !== "Resolved");
					const resolved = claimed.filter((ticket) => ticket.status === "Resolved");
					return (
						<Card key={member.id} className="p-5">
							<div className="flex items-center gap-3">
								<Avatar name={member.name} code={activeDepartment} />
								<div className="min-w-0 flex-1">
									<h2 className="truncate text-lg font-[800]">{member.name}</h2>
									<p className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--muted)" }}>{member.role}</p>
								</div>
								<div className="text-right">
									<div className="text-2xl font-[800]" style={{ color: "var(--teal-700)" }}>{working.length}</div>
									<div className="font-['DM_Mono'] text-[10px] uppercase" style={{ color: "var(--muted)" }}>working</div>
								</div>
							</div>

							<div className="mt-4 grid gap-2">
								<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Claimed · {claimed.length} ({resolved.length} resolved)</p>
								{claimed.length === 0 ? (
									<p className="rounded-xl border border-dashed px-3 py-3 text-[13px] font-bold" style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}>No tickets claimed yet — open ones are in the unclaimed queue below.</p>
								) : (
									claimed.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)
								)}
							</div>
						</Card>
					);
				})}
			</div>

			<Card className="mt-4 p-5">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-lg font-[800]">Unclaimed queue</h2>
					<Pill tint={unclaimed.length > 0 ? "rose" : "green"}>{unclaimed.length} waiting</Pill>
				</div>
				{unclaimed.length === 0 ? (
					<p className="text-[13px] font-bold" style={{ color: "var(--muted)" }}>Everything open is owned — nice.</p>
				) : (
					<div className="grid gap-2 md:grid-cols-2">
						{unclaimed.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}
					</div>
				)}
			</Card>
		</div>
	);
}
