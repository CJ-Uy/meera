"use client";

import { Button, Icon, Pill } from "@/components/demo/shared";
import { useAdmin } from "@/features/admin/store/admin-store";
import type { DemoTicket } from "@/features/admin/types";

export function ResolveControls({ ticket }: { ticket: DemoTicket }) {
	const admin = useAdmin();
	const resolved = ticket.status === "Resolved";

	return (
		<div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
			<div className="mb-3 flex items-center justify-between gap-3">
				<div>
					<div className="font-[800]">Resolution</div>
					<p className="mt-1 text-sm leading-6" style={{ color: "var(--ink-2)" }}>Close the ticket when staff review is complete.</p>
				</div>
				<Pill tint={resolved ? "green" : "default"}>{ticket.status}</Pill>
			</div>
			{resolved ? (
				<div className="rounded-xl border px-3 py-2 text-sm font-bold" style={{ background: "var(--green-050)", borderColor: "#C9E8B3", color: "#5E9438" }}>Ticket is resolved.</div>
			) : (
				<Button variant="dark" onClick={() => void admin.resolveTicket(ticket.id)}><Icon name="flag" size={14} />Mark resolved</Button>
			)}
		</div>
	);
}
