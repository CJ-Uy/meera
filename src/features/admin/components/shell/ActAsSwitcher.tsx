"use client";

import { Icon } from "@/components/demo/shared";
import { Dropdown } from "@/features/admin/components/shell/Dropdown";
import { departmentAccent, initialsOf } from "@/features/admin/department-theme";
import { useAdmin } from "@/features/admin/store/admin-store";

function Avatar({ name, code, size = 26 }: { name: string; code: "IT" | "REG" | "MED" | "SS" | "FIN" | "shared"; size?: number }) {
	const accent = departmentAccent(code);
	return (
		<span
			className="grid shrink-0 place-items-center rounded-full font-[800]"
			style={{ width: size, height: size, background: accent.soft, color: accent.text, fontSize: size * 0.4, border: `1.5px solid ${accent.solid}` }}
		>
			{initialsOf(name)}
		</span>
	);
}

export function ActAsSwitcher() {
	const admin = useAdmin();
	const department = admin.activeDepartment;
	const departmentAdmins = admin.admins.filter((person) => person.dept === department);
	const acting = departmentAdmins.find((person) => person.id === admin.actingAdminId) ?? departmentAdmins[0] ?? null;

	return (
		<Dropdown
			label="Act as admin"
			align="end"
			width={280}
			trigger={({ open }) => (
				<span
					className="flex items-center gap-2.5 rounded-2xl border py-1.5 pl-2 pr-2.5 transition"
					style={{ borderColor: open ? "var(--teal)" : "var(--line-2)", background: "#fff", boxShadow: open ? "var(--sh-sm)" : "none" }}
				>
					{acting ? <Avatar name={acting.name} code={department} /> : <span className="grid size-[26px] place-items-center rounded-full" style={{ background: "var(--cream-2)" }}><Icon name="users" size={14} /></span>}
					<span className="hidden min-w-0 flex-col leading-tight sm:flex">
						<span className="font-['DM_Mono'] text-[8.5px] uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>Acting as</span>
						<span className="max-w-[150px] truncate text-[12.5px] font-[800]" style={{ color: "var(--ink)" }}>{acting?.name ?? "Unassigned"}</span>
					</span>
					<Icon name="chevronD" size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
				</span>
			)}
		>
			{(close) => (
				<div className="p-1.5">
					<p className="px-2.5 pb-1.5 pt-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>Act as · {department}</p>
					{departmentAdmins.length === 0 ? (
						<p className="px-2.5 py-3 text-[13px] font-bold" style={{ color: "var(--muted)" }}>No admins seeded for this department.</p>
					) : (
						departmentAdmins.map((person) => {
							const selected = person.id === admin.actingAdminId;
							return (
								<button
									key={person.id}
									type="button"
									role="menuitemradio"
									aria-checked={selected}
									onClick={() => {
										admin.setActingAdmin(person.id);
										close();
									}}
									className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-[var(--cream)]"
									style={selected ? { background: "var(--cream-2)" } : undefined}
								>
									<Avatar name={person.name} code={department} size={30} />
									<span className="min-w-0 flex-1">
										<span className="block truncate text-[13px] font-[800]" style={{ color: "var(--ink)" }}>{person.name}</span>
										<span className="block truncate font-['DM_Mono'] text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--muted)" }}>{person.role}</span>
									</span>
									{selected ? <Icon name="check" size={15} className="text-[#2E9C8E]" /> : <span className="w-[15px]" />}
								</button>
							);
						})
					)}
				</div>
			)}
		</Dropdown>
	);
}
