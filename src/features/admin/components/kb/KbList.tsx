"use client";

import { useMemo } from "react";
import { Card, Pill } from "@/components/demo/shared";
import { filterKbGraphForDepartment } from "@/features/admin/components/kb/graph-helpers";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS, type KbNode } from "@/features/admin/types";

const LIST_KINDS: KbNode["kind"][] = ["faq", "procedure", "entity"];

function kindTint(kind: KbNode["kind"]) {
	if (kind === "faq") return "sand";
	if (kind === "procedure") return "green";
	if (kind === "entity") return "rose";
	return "teal";
}

export function KbList() {
	const { kb, activeDepartment, deleteKbNode } = useAdmin();
	const filtered = useMemo(() => filterKbGraphForDepartment(kb.nodes, kb.edges, activeDepartment), [activeDepartment, kb.edges, kb.nodes]);
	const entries = filtered.nodes.filter((node) => LIST_KINDS.includes(node.kind)).sort((a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label));

	return (
		<Card className="p-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>Knowledge entries</p>
					<h2 className="mt-1 text-xl font-[800]">{DEPARTMENT_LABELS[activeDepartment]}</h2>
					<p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>FAQs, procedures, and entities visible to this department. Use “New entry” above to add more.</p>
				</div>
				<Pill tint="teal">{entries.length} entries</Pill>
			</div>

			<div className="mt-5 overflow-hidden rounded-[18px] border" style={{ borderColor: "var(--line)" }}>
				{entries.length === 0 ? (
					<div className="p-5 text-sm font-bold" style={{ color: "var(--muted)" }}>No knowledge entries are visible for this department yet.</div>
				) : (
					entries.map((node) => (
						<div key={node.id} className="grid gap-3 border-b p-4 last:border-b-0 md:grid-cols-[120px_minmax(0,1fr)_96px]" style={{ borderColor: "var(--line)", background: "#fff" }}>
							<div>
								<Pill tint={kindTint(node.kind)}>{node.kind}</Pill>
							</div>
							<div className="min-w-0">
								<div className="font-bold">{node.label}</div>
								{node.body ? <p className="mt-1 line-clamp-2 text-sm leading-6" style={{ color: "var(--ink-2)" }}>{node.body}</p> : null}
								<p className="mt-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>{node.id}</p>
							</div>
							<button type="button" onClick={() => deleteKbNode(node.id)} className="self-start rounded-full border px-3 py-1.5 text-xs font-[800] transition hover:bg-[#FCE9E1]" style={{ borderColor: "var(--line)", color: "var(--rose)" }}>Delete</button>
						</div>
					))
				)}
			</div>
		</Card>
	);
}
