"use client";

import { useState } from "react";
import { Button } from "@/components/demo/shared";
import { buildKbIngestDraft, buildKbNodeFromDraft, type KbIngestDraft, type KbIngestKind } from "@/features/admin/components/kb/kb-ingest";
import { useAdmin } from "@/features/admin/store/admin-store";
import type { DemoTicket } from "@/features/admin/types";

const inputClass = "rounded-xl border bg-white px-3 py-2 text-sm outline-none";
const inputStyle = { borderColor: "var(--line-2)", color: "var(--ink-2)" };

export function KbIngestForm({ ticket, onCancel }: { ticket: DemoTicket; onCancel: () => void }) {
	const { ingestKb } = useAdmin();
	const [draft, setDraft] = useState<KbIngestDraft>(() => buildKbIngestDraft(ticket));
	const [saving, setSaving] = useState(false);

	function updateDraft<Field extends keyof KbIngestDraft>(field: Field, value: KbIngestDraft[Field]) {
		setDraft((current) => ({ ...current, [field]: value }));
	}

	async function confirm() {
		if (!draft.label.trim() || !draft.body.trim()) return;
		setSaving(true);
		await ingestKb(buildKbNodeFromDraft(ticket, draft));
		setSaving(false);
		onCancel();
	}

	return (
		<div className="mt-3 grid gap-3 rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)", boxShadow: "var(--sh-sm)" }}>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px]">
				<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
					Question / label
					<input value={draft.label} onChange={(event) => updateDraft("label", event.target.value)} className={inputClass} style={inputStyle} />
				</label>
				<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
					Kind
					<select value={draft.kind} onChange={(event) => updateDraft("kind", event.target.value as KbIngestKind)} className={inputClass} style={inputStyle}>
						<option value="faq">FAQ</option>
						<option value="procedure">Procedure</option>
					</select>
				</label>
			</div>
			<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
				Answer
				<textarea value={draft.body} onChange={(event) => updateDraft("body", event.target.value)} rows={4} className={inputClass} style={inputStyle} />
			</label>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
					Ask for
					<textarea value={draft.askFor} onChange={(event) => updateDraft("askFor", event.target.value)} rows={3} className={inputClass} style={inputStyle} />
				</label>
				<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
					Escalate if
					<textarea value={draft.escalateIf} onChange={(event) => updateDraft("escalateIf", event.target.value)} rows={3} className={inputClass} style={inputStyle} />
				</label>
			</div>
			<div className="flex flex-wrap justify-end gap-2">
				<Button onClick={onCancel}>Cancel</Button>
				<Button variant="primary" onClick={confirm} className={saving || !draft.label.trim() || !draft.body.trim() ? "pointer-events-none opacity-60" : ""}>
					{saving ? "Adding..." : "Add to KB"}
				</Button>
			</div>
		</div>
	);
}
