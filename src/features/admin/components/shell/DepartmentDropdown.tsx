"use client";

import { Icon } from "@/components/demo/shared";
import { Dropdown } from "@/features/admin/components/shell/Dropdown";
import { departmentAccent } from "@/features/admin/department-theme";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_CODES, DEPARTMENT_LABELS } from "@/features/admin/types";

export function DepartmentDropdown() {
	const admin = useAdmin();
	const active = admin.activeDepartment;
	const accent = departmentAccent(active);

	return (
		<Dropdown
			label="Switch department"
			width={272}
			trigger={({ open }) => (
				<span
					className="flex items-center gap-2.5 rounded-2xl border py-1.5 pl-2.5 pr-2 transition"
					style={{ borderColor: open ? "var(--teal)" : "var(--line-2)", background: open ? "#fff" : "var(--cream)", boxShadow: open ? "var(--sh-sm)" : "none" }}
				>
					<span className="grid size-7 place-items-center rounded-xl" style={{ background: accent.soft, color: accent.text }}>
						<Icon name="building" size={15} />
					</span>
					<span className="flex flex-col leading-tight">
						<span className="font-['DM_Mono'] text-[8.5px] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>Department</span>
						<span className="text-[12.5px] font-[800]" style={{ color: "var(--ink)" }}>{DEPARTMENT_LABELS[active]}</span>
					</span>
					<Icon name="chevronD" size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
				</span>
			)}
		>
			{(close) => (
				<div className="p-1.5">
					<p className="px-2.5 pb-1.5 pt-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>Switch department</p>
					{DEPARTMENT_CODES.map((dept) => {
						const selected = dept === active;
						const tint = departmentAccent(dept);
						return (
							<button
								key={dept}
								type="button"
								role="menuitemradio"
								aria-checked={selected}
								onClick={() => {
									admin.setDepartment(dept);
									close();
								}}
								className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-[var(--cream)]"
								style={selected ? { background: "var(--cream-2)" } : undefined}
							>
								<span className="size-2.5 shrink-0 rounded-full" style={{ background: tint.solid, boxShadow: `0 0 0 3px ${tint.soft}` }} />
								<span className="min-w-0 flex-1 truncate text-[13px] font-[800]" style={{ color: "var(--ink)" }}>{DEPARTMENT_LABELS[dept]}</span>
								<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>{dept}</span>
								{selected ? <Icon name="check" size={15} className="text-[#2E9C8E]" /> : <span className="w-[15px]" />}
							</button>
						);
					})}
				</div>
			)}
		</Dropdown>
	);
}
