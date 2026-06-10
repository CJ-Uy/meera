"use client";

import { useState } from "react";
import { Icon } from "@/components/demo/shared";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS, type KbEdge, type KbNode } from "@/features/admin/types";

const KINDS: { value: KbNode["kind"]; label: string; hint: string }[] = [
	{ value: "faq", label: "FAQ", hint: "Question & answer" },
	{ value: "procedure", label: "Procedure", hint: "Step-by-step process" },
	{ value: "entity", label: "Entity", hint: "System, team, or object" },
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

function FieldLabel({ children }: { children: React.ReactNode }) {
	return <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>{children}</span>;
}

export function KbAddForm({ onClose }: { onClose: () => void }) {
	const { kb, activeDepartment, createKbNode } = useAdmin();
	const [kind, setKind] = useState<KbNode["kind"]>("faq");
	const [label, setLabel] = useState("");
	const [body, setBody] = useState("");
	const [linkDepartment, setLinkDepartment] = useState(true);
	const activeHint = KINDS.find((option) => option.value === kind)?.hint;

	return (
		<form
			className="mb-4 overflow-hidden rounded-[22px] border bg-white"
			style={{ borderColor: "var(--teal-100)", boxShadow: "var(--sh-md)" }}
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
			<div className="flex items-center justify-between gap-3 border-b px-5 py-3.5" style={{ borderColor: "var(--line)", background: "linear-gradient(180deg, var(--teal-050), #fff)" }}>
				<div className="flex items-center gap-2.5">
					<span className="grid size-8 place-items-center rounded-xl" style={{ background: "#fff", color: "var(--teal-700)", boxShadow: "var(--sh-sm)" }}>
						<Icon name="sparkle" size={16} />
					</span>
					<div>
						<p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.14em]" style={{ color: "var(--teal-700)" }}>New knowledge entry</p>
						<p className="text-[13px] font-[800]">Adding to {DEPARTMENT_LABELS[activeDepartment]}</p>
					</div>
				</div>
				<button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-full border transition hover:bg-[var(--cream)]" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }} aria-label="Close">
					<Icon name="x" size={14} />
				</button>
			</div>

			<div className="grid gap-4 p-5">
				<label className="grid gap-1.5">
					<FieldLabel>Type</FieldLabel>
					<div className="grid grid-cols-3 gap-1.5 rounded-2xl border bg-[#FCFAF6] p-1.5" style={{ borderColor: "var(--line)" }}>
						{KINDS.map((option) => {
							const selected = kind === option.value;
							return (
								<button
									key={option.value}
									type="button"
									onClick={() => setKind(option.value)}
									className="rounded-xl px-2 py-2 text-[12.5px] font-[800] transition"
									style={{ background: selected ? "var(--teal)" : "transparent", color: selected ? "#fff" : "var(--ink-2)", boxShadow: selected ? "var(--sh-sm)" : "none" }}
								>
									{option.label}
								</button>
							);
						})}
					</div>
					{activeHint ? <span className="text-[11px]" style={{ color: "var(--muted)" }}>{activeHint}</span> : null}
				</label>

				<label className="grid gap-1.5">
					<FieldLabel>Title</FieldLabel>
					<input
						value={label}
						onChange={(event) => setLabel(event.target.value)}
						placeholder="e.g. How to verify a payment plan"
						autoFocus
						className="rounded-[14px] border bg-white px-3.5 py-2.5 text-sm font-bold outline-none transition focus:border-[var(--teal)] focus:shadow-[0_0_0_3px_var(--teal-050)]"
						style={{ borderColor: "var(--line-2)" }}
					/>
				</label>

				<label className="grid gap-1.5">
					<FieldLabel>Details <span className="normal-case" style={{ color: "var(--muted)" }}>(optional)</span></FieldLabel>
					<textarea
						value={body}
						onChange={(event) => setBody(event.target.value)}
						rows={3}
						placeholder="Short answer, process, or entity description"
						className="resize-none rounded-[14px] border bg-white px-3.5 py-2.5 text-sm leading-6 outline-none transition focus:border-[var(--teal)] focus:shadow-[0_0_0_3px_var(--teal-050)]"
						style={{ borderColor: "var(--line-2)" }}
					/>
				</label>

				<div className="flex flex-wrap items-center justify-between gap-3 pt-1">
					<label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-bold" style={{ color: "var(--ink-2)" }}>
						<input type="checkbox" checked={linkDepartment} onChange={(event) => setLinkDepartment(event.target.checked)} className="accent-[var(--teal)]" />
						Link to department hub
					</label>
					<div className="flex items-center gap-2">
						<button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-sm font-[800] transition hover:bg-[var(--cream)]" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>Cancel</button>
						<button type="submit" disabled={!label.trim()} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-[800] text-white transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50" style={{ background: "var(--teal)", boxShadow: "0 8px 20px rgba(46,156,142,0.22)" }}>
							<Icon name="check" size={14} />
							Add entry
						</button>
					</div>
				</div>
			</div>
		</form>
	);
}
