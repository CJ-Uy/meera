"use client";

import { DEPARTMENT_LABELS } from "@/features/admin/types";
import { useActingAdmin } from "@/features/admin/store/admin-store";

export function AccountMenu({ compact = false }: { compact?: boolean }) {
	const actingAdmin = useActingAdmin();

	if (!actingAdmin) {
		return <div className="rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>Loading admin...</div>;
	}

	return (
		<div className={compact ? "flex items-center gap-2" : "rounded-2xl border bg-[#FCFAF6] p-3"} style={{ borderColor: "var(--line)" }}>
			<div className="flex items-center gap-3">
				<span className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-[800] text-white" style={{ background: "var(--ink)" }}>{actingAdmin.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
				<div className="min-w-0">
					<div className="truncate text-sm font-[800]">{actingAdmin.name}</div>
					<div className="truncate font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>{DEPARTMENT_LABELS[actingAdmin.dept]}</div>
				</div>
				{compact ? <span className="text-xs" style={{ color: "var(--muted)" }}>▾</span> : null}
			</div>
			{compact ? null : (
				<div className="mt-3 flex items-center gap-2 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
					<span>Settings</span>
					<span className="h-1 w-1 rounded-full" style={{ background: "var(--line-2)" }} />
					<span>Sign out</span>
				</div>
			)}
		</div>
	);
}
