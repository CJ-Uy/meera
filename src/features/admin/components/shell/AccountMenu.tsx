"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/demo/shared";
import { departmentAccent, initialsOf } from "@/features/admin/department-theme";
import { useActingAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS } from "@/features/admin/types";

const items: { icon: IconName; label: string; href: string; danger?: boolean }[] = [
	{ icon: "gear", label: "Settings", href: "/demo/admin/settings" },
	{ icon: "book", label: "Help & docs", href: "/" },
	{ icon: "arrow", label: "Sign out", href: "/", danger: true },
];

export function AccountMenu() {
	const actingAdmin = useActingAdmin();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onPointer = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
		};
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	if (!actingAdmin) {
		return <div className="rounded-2xl border p-3 text-sm font-bold" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>Loading admin...</div>;
	}

	const accent = departmentAccent(actingAdmin.dept);

	return (
		<div ref={ref} className="relative">
			{open ? (
				<div role="menu" className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border bg-white p-1.5" style={{ borderColor: "var(--line-2)", boxShadow: "var(--sh-lg)" }}>
					{items.map((item) => (
						<Link
							key={item.label}
							href={item.href}
							onClick={() => setOpen(false)}
							className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-bold transition hover:bg-[var(--cream)]"
							style={{ color: item.danger ? "var(--rose)" : "var(--ink-2)" }}
						>
							<Icon name={item.icon} size={15} className={item.danger ? "rotate-180" : ""} />
							{item.label}
						</Link>
					))}
				</div>
			) : null}
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				aria-haspopup="menu"
				aria-expanded={open}
				className="flex w-full items-center gap-2.5 rounded-2xl border p-2 text-left transition hover:bg-[#FCFAF6]"
				style={{ borderColor: open ? "var(--teal)" : "var(--line)", background: open ? "#fff" : "var(--cream)" }}
			>
				<span className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-[800]" style={{ background: accent.soft, color: accent.text, border: `1.5px solid ${accent.solid}` }}>
					{initialsOf(actingAdmin.name)}
				</span>
				<span className="min-w-0 flex-1">
					<span className="block truncate text-sm font-[800]">{actingAdmin.name}</span>
					<span className="block truncate font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>{DEPARTMENT_LABELS[actingAdmin.dept]}</span>
				</span>
				<Icon name="chevronD" size={14} className={`shrink-0 transition-transform ${open ? "" : "rotate-180"}`} />
			</button>
		</div>
	);
}
