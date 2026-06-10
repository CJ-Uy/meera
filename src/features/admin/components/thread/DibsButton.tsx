"use client";

import { useState } from "react";
import { Icon } from "@/components/demo/shared";
import { useActingAdmin, useAdmin } from "@/features/admin/store/admin-store";
import type { DemoTicket } from "@/features/admin/types";

export function DibsButton({ ticket }: { ticket: DemoTicket }) {
	const { admins, claimTicket, releaseTicket } = useAdmin();
	const actingAdmin = useActingAdmin();
	const [pending, setPending] = useState(false);
	const claimedAdmin = ticket.claimedBy ? admins.find((admin) => admin.id === ticket.claimedBy) : null;
	const claimedByActingAdmin = Boolean(actingAdmin && ticket.claimedBy === actingAdmin.id);

	async function claim() {
		if (!actingAdmin) return;
		setPending(true);
		await claimTicket(ticket.id, actingAdmin.id);
		setPending(false);
	}

	async function release() {
		setPending(true);
		await releaseTicket(ticket.id);
		setPending(false);
	}

	if (ticket.claimedBy && !claimedByActingAdmin) {
		return (
			<span className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold opacity-70" style={{ background: "var(--green-050)", borderColor: "#C9E8B3", color: "#5E9438" }}>
				<Icon name="lock" size={14} />Claimed by {claimedAdmin?.name ?? "another admin"}
			</span>
		);
	}

	return (
		<button
			type="button"
			onClick={claimedByActingAdmin ? release : claim}
			disabled={pending || !actingAdmin}
			className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
			style={{
				background: claimedByActingAdmin ? "#fff" : "var(--teal)",
				borderColor: claimedByActingAdmin ? "var(--line-2)" : "var(--teal)",
				color: claimedByActingAdmin ? "var(--ink)" : "#fff",
				boxShadow: claimedByActingAdmin ? "none" : "0 10px 24px rgba(46,156,142,.22)",
			}}
		>
			<Icon name={claimedByActingAdmin ? "refresh" : "flag"} size={14} />
			{pending ? "Working..." : claimedByActingAdmin ? "Release" : "Claim"}
		</button>
	);
}
