"use client";

import { Card, Pill } from "@/components/demo/shared";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS, type KbNode } from "@/features/admin/types";

function metaEntries(node: KbNode) {
	return Object.entries(node.meta ?? {}).filter(([, value]) => value.trim().length > 0);
}

export function KbNodeInspector({ node, onDeleted }: { node: KbNode | null; onDeleted?: () => void }) {
	const { deleteKbNode } = useAdmin();

	if (!node) {
		return (
			<Card className="flex min-h-[240px] items-center justify-center p-5 text-center">
				<div>
					<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--muted)" }}>Node inspector</p>
					<p className="mt-2 text-sm font-bold" style={{ color: "var(--ink-2)" }}>Select a graph node to review its answer, routing metadata, and source details.</p>
				</div>
			</Card>
		);
	}

	const entries = metaEntries(node);
	const department = node.dept === "shared" ? "Shared" : DEPARTMENT_LABELS[node.dept];

	return (
		<Card className="p-5">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>Node inspector</p>
					<h2 className="mt-2 text-xl font-[800] leading-tight">{node.label}</h2>
				</div>
				<Pill tint={node.kind === "department" ? "teal" : node.kind === "faq" ? "sand" : node.kind === "procedure" ? "green" : "rose"}>{node.kind}</Pill>
			</div>

			<div className="mt-4 rounded-[16px] border p-3" style={{ borderColor: "var(--line)", background: "#FCFAF6" }}>
				<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Department</p>
				<p className="mt-1 text-sm font-bold">{department}</p>
			</div>

			{node.body ? <p className="mt-4 text-sm leading-6" style={{ color: "var(--ink-2)" }}>{node.body}</p> : null}

			{entries.length > 0 ? (
				<div className="mt-4 grid gap-2">
					{entries.map(([key, value]) => (
						<div key={key} className="rounded-[14px] border p-3" style={{ borderColor: "var(--line)", background: "#fff" }}>
							<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>{key}</p>
							<p className="mt-1 text-xs leading-5" style={{ color: "var(--ink-2)" }}>{value}</p>
						</div>
					))}
				</div>
			) : null}

			<button
				type="button"
				onClick={async () => {
					await deleteKbNode(node.id);
					onDeleted?.();
				}}
				className="mt-5 w-full rounded-full px-4 py-2 text-sm font-[800] transition hover:opacity-90"
				style={{ background: "var(--rose)", color: "#fff" }}
			>
				Delete node
			</button>
		</Card>
	);
}
