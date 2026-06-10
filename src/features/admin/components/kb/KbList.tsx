"use client";

import { useMemo, useState } from "react";
import { Card, Pill } from "@/components/demo/shared";
import { filterKbGraphForDepartment } from "@/features/admin/components/kb/graph-helpers";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS, type KbEdge, type KbNode } from "@/features/admin/types";

const LIST_KINDS: KbNode["kind"][] = ["faq", "procedure", "entity"];

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 52) || "untitled";
}

function uniqueNodeId(kind: KbNode["kind"], department: string, label: string, nodes: KbNode[]) {
	const base = `${kind}-${department.toLowerCase()}-${slugify(label)}`;
	if (!nodes.some((node) => node.id === base)) return base;

	let suffix = 2;
	while (nodes.some((node) => node.id === `${base}-${suffix}`)) suffix += 1;
	return `${base}-${suffix}`;
}

function kindTint(kind: KbNode["kind"]) {
	if (kind === "faq") return "sand";
	if (kind === "procedure") return "green";
	if (kind === "entity") return "rose";
	return "teal";
}

export function KbList() {
	const { kb, activeDepartment, createKbNode, deleteKbNode } = useAdmin();
	const [kind, setKind] = useState<KbNode["kind"]>("faq");
	const [label, setLabel] = useState("");
	const [body, setBody] = useState("");
	const [linkDepartment, setLinkDepartment] = useState(true);
	const filtered = useMemo(() => filterKbGraphForDepartment(kb.nodes, kb.edges, activeDepartment), [activeDepartment, kb.edges, kb.nodes]);
	const entries = filtered.nodes.filter((node) => LIST_KINDS.includes(node.kind)).sort((a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label));

	return (
		<Card className="p-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>Knowledge entries</p>
					<h2 className="mt-1 text-xl font-[800]">{DEPARTMENT_LABELS[activeDepartment]}</h2>
					<p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>FAQs, procedures, and entities visible to this department.</p>
				</div>
				<Pill tint="teal">{entries.length} entries</Pill>
			</div>

			<form
				className="mt-5 grid gap-3 rounded-[18px] border p-4 md:grid-cols-[160px_minmax(0,1fr)]"
				style={{ borderColor: "var(--line)", background: "#FCFAF6" }}
				onSubmit={async (event) => {
					event.preventDefault();
					const trimmedLabel = label.trim();
					if (!trimmedLabel) return;

					const node: KbNode = {
						id: uniqueNodeId(kind, activeDepartment, trimmedLabel, kb.nodes),
						dept: activeDepartment,
						kind,
						label: trimmedLabel,
						body: body.trim() || undefined,
						meta: { source: "Manual admin entry" },
					};
					const edges: KbEdge[] = linkDepartment ? [{
						id: `edge-dept-${activeDepartment.toLowerCase()}-${node.id}`,
						from: `dept-${activeDepartment}`,
						to: node.id,
						relation: "owns",
					}] : [];
					await createKbNode(node, edges);
					setLabel("");
					setBody("");
					setKind("faq");
					setLinkDepartment(true);
				}}
			>
				<label className="grid gap-1">
					<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Kind</span>
					<select value={kind} onChange={(event) => setKind(event.target.value as KbNode["kind"])} className="rounded-[12px] border bg-white px-3 py-2 text-sm font-bold outline-none" style={{ borderColor: "var(--line)" }}>
						{LIST_KINDS.map((option) => <option key={option} value={option}>{option}</option>)}
					</select>
				</label>
				<label className="grid gap-1">
					<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Label</span>
					<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. How to verify a payment plan" className="rounded-[12px] border bg-white px-3 py-2 text-sm font-bold outline-none" style={{ borderColor: "var(--line)" }} />
				</label>
				<label className="grid gap-1 md:col-span-2">
					<span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Body</span>
					<textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} placeholder="Short answer, process, or entity description" className="resize-none rounded-[12px] border bg-white px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--line)" }} />
				</label>
				<div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
					<label className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--ink-2)" }}>
						<input type="checkbox" checked={linkDepartment} onChange={(event) => setLinkDepartment(event.target.checked)} />
						Link to department node
					</label>
					<button type="submit" className="rounded-full px-4 py-2 text-sm font-[800] transition hover:opacity-90" style={{ background: "var(--teal)", color: "#fff" }}>Add entry</button>
				</div>
			</form>

			<div className="mt-5 overflow-hidden rounded-[18px] border" style={{ borderColor: "var(--line)" }}>
				{entries.length === 0 ? (
					<div className="p-5 text-sm font-bold" style={{ color: "var(--muted)" }}>No knowledge entries are visible for this department yet.</div>
				) : entries.map((node) => (
					<div key={node.id} className="grid gap-3 border-b p-4 last:border-b-0 md:grid-cols-[120px_minmax(0,1fr)_96px]" style={{ borderColor: "var(--line)", background: "#fff" }}>
						<div><Pill tint={kindTint(node.kind)}>{node.kind}</Pill></div>
						<div className="min-w-0">
							<div className="font-bold">{node.label}</div>
							{node.body ? <p className="mt-1 line-clamp-2 text-sm leading-6" style={{ color: "var(--ink-2)" }}>{node.body}</p> : null}
							<p className="mt-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>{node.id}</p>
						</div>
						<button type="button" onClick={() => deleteKbNode(node.id)} className="self-start rounded-full border px-3 py-1.5 text-xs font-[800] transition hover:bg-[#FCE9E1]" style={{ borderColor: "var(--line)", color: "var(--rose)" }}>Delete</button>
					</div>
				))}
			</div>
		</Card>
	);
}
