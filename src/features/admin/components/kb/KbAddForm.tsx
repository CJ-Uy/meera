"use client";

import { useState } from "react";
import { Icon } from "@/components/demo/shared";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS, type KbEdge, type KbNode } from "@/features/admin/types";

const KINDS: { value: KbNode["kind"]; label: string }[] = [
	{ value: "faq", label: "FAQ" },
	{ value: "procedure", label: "Procedure" },
	{ value: "entity", label: "Entity" },
];

function slugify(value: string) {
	return (
		value
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 52) || "untitled"
	);
}

function uniqueNodeId(kind: KbNode["kind"], department: string, label: string, nodes: KbNode[]) {
	const base = `${kind}-${department.toLowerCase()}-${slugify(label)}`;
	if (!nodes.some((node) => node.id === base)) return base;
	let suffix = 2;
	while (nodes.some((node) => node.id === `${base}-${suffix}`)) suffix += 1;
	return `${base}-${suffix}`;
}

export function KbAddForm({ onClose }: { onClose: () => void }) {
	const { kb, activeDepartment, createKbNode } = useAdmin();
	const [kind, setKind] = useState<KbNode["kind"]>("faq");
	const [label, setLabel] = useState("");
	const [body, setBody] = useState("");
	const [linkDepartment, setLinkDepartment] = useState(true);

	return (
		<form
			className="mb-4 rounded-[20px] border bg-white p-4"
			style={{ borderColor: "var(--teal-100)", boxShadow: "var(--sh-sm)" }}
			onSubmit={async (event) => {
				event.preventDefault();
				const trimmed = label.trim();
				if (!trimmed) return;
				const node: KbNode = {
					id: uniqueNodeId(kind, activeDepartment, trimmed, kb.nodes),
					dept: activeDepartment,
					kind,
					label: trimmed,
					body: body.trim() || undefined,
					meta: { source: "Manual admin entry" },
				};
				const edges: KbEdge[] = linkDepartment
					? [{ id: `edge-dept-${activeDepartment.toLowerCase()}-${node.id}`, from: `dept-${activeDepartment}`, to: node.id, relation: "owns" }]
					: [];
				await createKbNode(node, edges);
				onClose();
			}}
		>
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="grid size-7 place-items-center rounded-xl" style={{ background: "var(--teal-050)", color: "var(--teal-700)" }}>
						<Icon name="sparkle" size={15} />
					</span>
					<div>
						<p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>New knowledge entry</p>
						<p className="text-[13px] font-[800]">Adding to {DEPARTMENT_LABELS[activeDepartment]}</p>
					</div>
				</div>
				<button type="button" onClick={onClose} className="rounded-full p-1.5 transition hover:bg-[var(--cream)]" aria-label="Close">
					<Icon name="alert" size={14} className="rotate-45" />
				</button>
			</div>

			<div className="grid gap-3 md:grid-cols-[150px_minmax(0,1fr)]">
				<div className="flex gap-1 rounded-full border bg-[#FCFAF6] p-1" style={{ borderColor: "var(--line)" }}>
					{KINDS.map((option) => (
						<button key={option.value} type="button" onClick={() => setKind(option.value)} className="flex-1 rounded-full px-2 py-1.5 text-[11px] font-[800] transition" style={{ background: kind === option.value ? "var(--teal)" : "transparent", color: kind === option.value ? "#fff" : "var(--ink-2)" }}>
							{option.label}
						</button>
					))}
				</div>
				<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Title, e.g. How to verify a payment plan" autoFocus className="rounded-[12px] border bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[var(--teal)]" style={{ borderColor: "var(--line)" }} />
				<textarea value={body} onChange={(event) => setBody(event.target.value)} rows={2} placeholder="Short answer, process, or entity description" className="resize-none rounded-[12px] border bg-white px-3 py-2 text-sm outline-none focus:border-[var(--teal)] md:col-span-2" style={{ borderColor: "var(--line)" }} />
			</div>

			<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
				<label className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "var(--ink-2)" }}>
					<input type="checkbox" checked={linkDepartment} onChange={(event) => setLinkDepartment(event.target.checked)} />
					Link to department hub
				</label>
				<div className="flex items-center gap-2">
					<button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-sm font-[800] transition hover:bg-[var(--cream)]" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>Cancel</button>
					<button type="submit" disabled={!label.trim()} className="rounded-full px-4 py-2 text-sm font-[800] text-white transition disabled:opacity-50" style={{ background: "var(--teal)" }}>Add entry</button>
				</div>
			</div>
		</form>
	);
}
