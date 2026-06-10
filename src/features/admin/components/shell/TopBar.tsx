"use client";

import Link from "next/link";
import { ActAsSwitcher } from "@/features/admin/components/shell/ActAsSwitcher";
import { DepartmentDropdown } from "@/features/admin/components/shell/DepartmentDropdown";
import { MeerkatMark } from "@/components/demo/shared";

export function TopBar() {
	return (
		<div className="flex h-[58px] shrink-0 items-center gap-3 border-b bg-white px-4" style={{ borderColor: "var(--line)" }}>
			<Link href="/" className="inline-flex shrink-0 items-center gap-[7px]" aria-label="Meera home">
				<MeerkatMark size={30} />
				<span className="text-[15px] font-[800] tracking-[-0.03em]">Meera</span>
			</Link>
			<span className="h-[18px] w-px shrink-0" style={{ background: "var(--line-2)" }} />
			<DepartmentDropdown />
			<ActAsSwitcher />
			<div className="flex-1" />
			<span className="rounded-full px-[9px] py-0.5 font-['DM_Mono'] text-[9.5px] uppercase tracking-[0.16em]" style={{ color: "var(--teal-700)", background: "var(--teal-050)" }}>Admin</span>
		</div>
	);
}
