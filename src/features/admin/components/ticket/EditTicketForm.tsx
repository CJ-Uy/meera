"use client";

import { useEffect, useState } from "react";
import { Button, Icon } from "@/components/demo/shared";
import { useAdmin } from "@/features/admin/store/admin-store";
import type { DemoTicket } from "@/features/admin/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
			{label}
			{children}
		</label>
	);
}

export function EditTicketForm({ ticket }: { ticket: DemoTicket }) {
	const admin = useAdmin();
	const [title, setTitle] = useState(ticket.title);
	const [aiSummary, setAiSummary] = useState(ticket.aiSummary);
	const [collectedInformation, setCollectedInformation] = useState(ticket.collectedInformation);
	const [suggestedActions, setSuggestedActions] = useState(ticket.suggestedActions.join("\n"));
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		setTitle(ticket.title);
		setAiSummary(ticket.aiSummary);
		setCollectedInformation(ticket.collectedInformation);
		setSuggestedActions(ticket.suggestedActions.join("\n"));
		setSaved(false);
	}, [ticket.id, ticket.title, ticket.aiSummary, ticket.collectedInformation, ticket.suggestedActions]);

	function save() {
		void admin.updateTicket(ticket.id, {
			title,
			aiSummary,
			collectedInformation,
			suggestedActions: suggestedActions.split("\n").map((action) => action.trim()).filter(Boolean),
		}).then(() => setSaved(true));
	}

	return (
		<div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
			<div className="mb-3 flex items-center justify-between gap-3">
				<div>
					<div className="font-[800]">Edit AI triage</div>
					<div className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>Saving marks this ticket as edited</div>
				</div>
				{saved ? <span className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--green)" }}>Saved</span> : null}
			</div>
			<div className="grid gap-3">
				<Field label="Title">
					<input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-xl border bg-[#FCFAF6] px-3 py-2 text-sm font-semibold outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink)" }} />
				</Field>
				<Field label="AI summary">
					<textarea value={aiSummary} onChange={(event) => setAiSummary(event.target.value)} className="min-h-20 rounded-xl border bg-[#FCFAF6] px-3 py-2 text-sm font-semibold leading-6 outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink)" }} />
				</Field>
				<Field label="Collected information">
					<textarea value={collectedInformation} onChange={(event) => setCollectedInformation(event.target.value)} className="min-h-20 rounded-xl border bg-[#FCFAF6] px-3 py-2 text-sm font-semibold leading-6 outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink)" }} />
				</Field>
				<Field label="Suggested actions, one per line">
					<textarea value={suggestedActions} onChange={(event) => setSuggestedActions(event.target.value)} className="min-h-24 rounded-xl border bg-[#FCFAF6] px-3 py-2 text-sm font-semibold leading-6 outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink)" }} />
				</Field>
				<div>
					<Button variant="primary" onClick={save}><Icon name="check" size={14} />Save edits</Button>
				</div>
			</div>
		</div>
	);
}
