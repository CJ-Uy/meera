"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/demo/shared";

/**
 * Lightweight slide-open section used to declutter the inbox controls.
 * Uses the grid-rows 0fr/1fr trick for a smooth height transition without
 * measuring the content.
 */
export function Collapsible({ title, badge, defaultOpen = false, children }: { title: string; badge?: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className="rounded-2xl border bg-[#FCFAF6]" style={{ borderColor: "var(--line)" }}>
			<button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
				<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>{title}</span>
				{badge}
				<Icon name="chevronD" size={14} className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
			</button>
			<div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.2s ease" }}>
				<div className="overflow-hidden">
					<div className="px-3 pb-3">{children}</div>
				</div>
			</div>
		</div>
	);
}
