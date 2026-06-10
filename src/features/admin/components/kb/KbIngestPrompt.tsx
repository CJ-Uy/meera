"use client";

import { useState } from "react";
import { Button, Icon, Pill } from "@/components/demo/shared";
import { KbIngestForm } from "@/features/admin/components/kb/KbIngestForm";
import type { DemoTicket } from "@/features/admin/types";

function isKbCandidate(ticket: DemoTicket) {
	return ticket.status === "Resolved" || ticket.suggestedActions.length > 0;
}

export function KbIngestPrompt({ ticket }: { ticket: DemoTicket }) {
	const [open, setOpen] = useState(false);

	if (ticket.kbIngested) {
		return (
			<div className="mt-5">
				<Pill tint="green"><Icon name="book" size={12} />In knowledge base</Pill>
			</div>
		);
	}

	if (!isKbCandidate(ticket)) return null;

	return (
		<div className="mt-5 rounded-2xl border p-4" style={{ background: "var(--teal-050)", borderColor: "var(--teal-100)" }}>
			<div className="flex flex-wrap items-center gap-3">
				<div className="min-w-0 flex-1">
					<div className="text-sm font-[800]" style={{ color: "var(--teal-700)" }}>Add this to the knowledge base</div>
					<p className="mt-1 text-sm leading-6" style={{ color: "var(--ink-2)" }}>
						Turn Meera&apos;s summary and suggested actions into reusable guidance for {ticket.ownerDept}.
					</p>
				</div>
				<Button variant="primary" onClick={() => setOpen(true)}><Icon name="book" size={14} />Review draft</Button>
			</div>
			{open ? <KbIngestForm ticket={ticket} onCancel={() => setOpen(false)} /> : null}
		</div>
	);
}
