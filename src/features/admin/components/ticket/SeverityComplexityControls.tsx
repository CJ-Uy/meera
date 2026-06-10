"use client";

import { useAdmin } from "@/features/admin/store/admin-store";
import type { Complexity, DemoTicket, Severity } from "@/features/admin/types";

const severities: Severity[] = ["Low", "Medium", "High", "Critical"];
const complexities: Complexity[] = ["Low", "Medium", "High"];

export function SeverityComplexityControls({ ticket }: { ticket: DemoTicket }) {
	const admin = useAdmin();

	return (
		<div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
			<div className="mb-3 font-[800]">Staff grading</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
					Severity
					<select value={ticket.severity} onChange={(event) => void admin.setSeverity(ticket.id, event.target.value as Severity)} className="rounded-xl border bg-[#FCFAF6] px-3 py-2 text-sm font-bold outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
						{severities.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
					</select>
				</label>
				<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
					Complexity
					<select value={ticket.complexity} onChange={(event) => void admin.setComplexity(ticket.id, event.target.value as Complexity)} className="rounded-xl border bg-[#FCFAF6] px-3 py-2 text-sm font-bold outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
						{complexities.map((complexity) => <option key={complexity} value={complexity}>{complexity}</option>)}
					</select>
				</label>
			</div>
		</div>
	);
}
