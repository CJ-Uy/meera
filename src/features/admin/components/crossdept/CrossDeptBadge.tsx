"use client";

import { Icon, Pill } from "@/components/demo/shared";
import { DEPARTMENT_LABELS, type CrossDeptDecision, type DemoTicket } from "@/features/admin/types";

function decisionTint(decision: CrossDeptDecision): "default" | "teal" | "sand" | "rose" | "green" {
	if (decision === "accepted") return "green";
	if (decision === "rejected") return "rose";
	return "sand";
}

export function CrossDeptBadge({ ticket, compact = false }: { ticket: DemoTicket; compact?: boolean }) {
	if (!ticket.cross) return null;

	return (
		<div className={compact ? "flex flex-wrap items-center gap-1.5" : "rounded-2xl border bg-white p-3"} style={compact ? undefined : { borderColor: "var(--line)" }}>
			<div className={compact ? "contents" : "mb-2 flex items-center gap-2"}>
				{compact ? null : <Icon name="users" size={15} className="text-[#2E9C8E]" />}
				<Pill tint={ticket.cross.active ? "green" : "sand"}>{ticket.cross.active ? "Cross-dept active" : "Cross-dept pending"}</Pill>
			</div>
			<div className="flex flex-wrap gap-1.5">
				{ticket.cross.participants.map((participant) => (
					<Pill key={participant.dept} tint={decisionTint(participant.decision)}>
						<span>{DEPARTMENT_LABELS[participant.dept]}</span>
						<span className="font-['DM_Mono'] text-[10px] uppercase">{participant.decision}</span>
					</Pill>
				))}
			</div>
		</div>
	);
}
