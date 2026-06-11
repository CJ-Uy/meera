"use client";

import { useMemo, useState } from "react";
import { Button, Icon } from "@/components/demo/shared";
import { useActingAdmin, useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_CODES, DEPARTMENT_LABELS, type DepartmentCode, type DemoTicket } from "@/features/admin/types";

export function EscalateCrossDept({ ticket }: { ticket: DemoTicket }) {
	const admin = useAdmin();
	const actingAdmin = useActingAdmin();
	const [selected, setSelected] = useState<DepartmentCode[]>([]);
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const trimmedReason = reason.trim();
	const initiatorDept = actingAdmin?.dept ?? admin.activeDepartment;
	const existingDepts = useMemo(() => new Set(ticket.cross?.participants.map((participant) => participant.dept) ?? []), [ticket.cross]);
	const options = useMemo(() => DEPARTMENT_CODES.filter((dept) => dept !== initiatorDept && !existingDepts.has(dept)), [existingDepts, initiatorDept]);

	function toggleDept(dept: DepartmentCode) {
		setSelected((current) => current.includes(dept) ? current.filter((item) => item !== dept) : [...current, dept]);
	}

	async function escalate() {
		if (!actingAdmin || selected.length === 0 || !trimmedReason) return;
		setSubmitting(true);
		await admin.escalateCrossDept(ticket.id, selected, actingAdmin.id, trimmedReason);
		setSelected([]);
		setReason("");
		setSubmitting(false);
	}

	if (options.length === 0) {
		return null;
	}

	return (
		<section className="mt-5 rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
			<div className="mb-3 flex items-center gap-2">
				<Icon name="route" size={16} className="text-[#2E9C8E]" />
				<div>
					<div className="text-sm font-[800]">Escalate cross-department</div>
					<div className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>
						{ticket.cross ? "Add another department to this ticket" : `${DEPARTMENT_LABELS[initiatorDept]} will be added automatically`}
					</div>
				</div>
			</div>
			<div className="grid gap-2 sm:grid-cols-2">
				{options.map((dept) => (
					<label key={dept} className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold" style={{ borderColor: selected.includes(dept) ? "var(--teal)" : "var(--line-2)", background: selected.includes(dept) ? "var(--teal-050)" : "#FCFAF6" }}>
						<input type="checkbox" checked={selected.includes(dept)} onChange={() => toggleDept(dept)} />
						{DEPARTMENT_LABELS[dept]}
					</label>
				))}
			</div>
			<textarea
				value={reason}
				onChange={(event) => setReason(event.target.value)}
				placeholder="Why does this ticket need another department?"
				rows={3}
				className="mt-3 w-full resize-y rounded-xl border bg-[#FCFAF6] px-3 py-2 text-sm outline-none"
				style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}
			/>
			<div className="mt-3 flex justify-end">
				<Button variant="primary" onClick={escalate} className={!actingAdmin || selected.length === 0 || !trimmedReason || submitting ? "pointer-events-none opacity-60" : ""}>
					<Icon name="arrow" size={14} />{submitting ? "Escalating..." : "Escalate"}
				</Button>
			</div>
		</section>
	);
}
