"use client";

import { DEPARTMENT_CODES, DEPARTMENT_LABELS } from "@/features/admin/types";
import { useAdmin } from "@/features/admin/store/admin-store";
import { Icon } from "@/components/demo/shared";

export function DepartmentDropdown() {
	const admin = useAdmin();

	return (
		<label className="relative flex shrink-0 items-center gap-2 rounded-xl border bg-[#FCFAF6] py-2 pl-3 pr-8 text-[12.5px] font-bold" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
			<Icon name="building" size={15} className="text-[#2E9C8E]" />
			<span className="hidden font-['DM_Mono'] text-[9px] uppercase tracking-[0.1em] lg:inline" style={{ color: "var(--muted)" }}>Department</span>
			<select value={admin.activeDepartment} onChange={(event) => admin.setDepartment(event.target.value as typeof admin.activeDepartment)} className="appearance-none bg-transparent pr-1 font-bold outline-none" aria-label="Department">
				{DEPARTMENT_CODES.map((dept) => <option key={dept} value={dept}>{DEPARTMENT_LABELS[dept]}</option>)}
			</select>
			<Icon name="chevronD" size={13} className="pointer-events-none absolute right-3" />
		</label>
	);
}
