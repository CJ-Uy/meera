"use client";

import { Icon, Pill } from "@/components/demo/shared";
import { CrossDeptBadge } from "@/features/admin/components/crossdept/CrossDeptBadge";
import { useAdmin } from "@/features/admin/store/admin-store";
import type { DemoTicket, Severity } from "@/features/admin/types";

function severityTint(severity: Severity): "default" | "teal" | "sand" | "rose" | "green" {
	if (severity === "Critical" || severity === "High") return "rose";
	if (severity === "Medium") return "sand";
	return "green";
}

export function QueueRow({ ticket, active, onClick }: { ticket: DemoTicket; active: boolean; onClick: () => void }) {
	const { admins } = useAdmin();
	const claimedByName = ticket.claimedBy ? admins.find((admin) => admin.id === ticket.claimedBy)?.name ?? "Unknown admin" : null;

	return (
		<button type="button" onClick={onClick} className="block w-full border-t px-4 py-3 text-left transition hover:bg-[#FCFAF6]" style={{ borderColor: "var(--line)", background: active ? "var(--teal-050)" : "transparent", borderLeft: active ? "3px solid var(--teal)" : "3px solid transparent" }}>
			<div className="mb-1 flex items-center gap-2">
				<span className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>#{ticket.id}</span>
				<span className="ml-auto"><Pill tint={severityTint(ticket.severity)}>{ticket.severity}</Pill></span>
			</div>
			<div className="text-[13px] font-bold leading-snug">{ticket.title}</div>
			<div className="mt-2 flex flex-wrap items-center gap-2">
				<Pill tint="teal"><Icon name="sparkle" size={10} />{ticket.tag}</Pill>
				<Pill>{ticket.status}</Pill>
				<Pill tint={ticket.claimedBy ? "green" : "default"}>{claimedByName ? `Claimed by ${claimedByName}` : "Unclaimed"}</Pill>
				{ticket.edited ? <Pill tint="green">Edited</Pill> : null}
			</div>
			{ticket.cross ? <div className="mt-2"><CrossDeptBadge ticket={ticket} compact /></div> : null}
		</button>
	);
}

export function InboxQueue({ tickets, selectedTicketId, onSelect }: { tickets: DemoTicket[]; selectedTicketId: string | null; onSelect: (ticketId: string) => void }) {
	if (tickets.length === 0) {
		return <div className="border-t px-4 py-8 text-center text-sm font-bold" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>No tickets match these filters.</div>;
	}

	return (
		<div>
			{tickets.map((ticket) => <QueueRow key={ticket.id} ticket={ticket} active={ticket.id === selectedTicketId} onClick={() => onSelect(ticket.id)} />)}
		</div>
	);
}
