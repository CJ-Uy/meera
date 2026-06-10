"use client";

import Link from "next/link";
import { ActAsSwitcher } from "@/features/admin/components/shell/ActAsSwitcher";
import { AccountMenu } from "@/features/admin/components/shell/AccountMenu";
import { DepartmentDropdown } from "@/features/admin/components/shell/DepartmentDropdown";
import { Icon, MeerkatMark } from "@/components/demo/shared";

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
			<div className="min-w-4 flex-1" />
			<div className="hidden min-w-[220px] items-center gap-2 rounded-full border bg-[#FCFAF6] px-3 py-2 text-sm lg:flex" style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}>
				<Icon name="sparkle" size={14} />
				<span>Search tickets, students, KB...</span>
			</div>
			<button type="button" className="grid size-9 place-items-center rounded-full border bg-white" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }} aria-label="Notifications">
				<Icon name="alert" size={16} />
			</button>
			<AccountMenu compact />
		</div>
	);
}
