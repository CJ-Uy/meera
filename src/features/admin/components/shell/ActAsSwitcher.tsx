"use client";

import { Icon } from "@/components/demo/shared";
import { useAdmin } from "@/features/admin/store/admin-store";

export function ActAsSwitcher() {
	const admin = useAdmin();
	const departmentAdmins = admin.admins.filter((person) => person.dept === admin.activeDepartment);

	return (
		<label className="relative flex shrink-0 items-center gap-2 rounded-xl border bg-white py-2 pl-3 pr-8 text-[12.5px] font-bold" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
			<Icon name="users" size={15} className="text-[#2E9C8E]" />
			<span className="hidden font-['DM_Mono'] text-[9px] uppercase tracking-[0.1em] lg:inline" style={{ color: "var(--muted)" }}>Act as</span>
			<select value={admin.actingAdminId ?? ""} onChange={(event) => admin.setActingAdmin(event.target.value)} className="max-w-[170px] appearance-none truncate bg-transparent pr-1 font-bold outline-none" aria-label="Act as admin">
				{departmentAdmins.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
			</select>
			<Icon name="chevronD" size={13} className="pointer-events-none absolute right-3" />
		</label>
	);
}
