"use client";

import { useState } from "react";
import { Icon } from "@/components/demo/shared";
import { KnowledgeGraph } from "@/features/admin/components/kb/KnowledgeGraph";
import { KbList } from "@/features/admin/components/kb/KbList";
import { KbAddForm } from "@/features/admin/components/kb/KbAddForm";

type KnowledgeTab = "graph" | "list";

export function KnowledgeDashboard() {
	const [tab, setTab] = useState<KnowledgeTab>("graph");
	const [adding, setAdding] = useState(false);

	return (
		<div className="mx-auto w-[min(1500px,calc(100%_-_2rem))] py-6">
			<header className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>Knowledge base</p>
					<h1 className="mt-1 text-3xl font-[800]">GraphRAG knowledge map</h1>
					<p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--ink-2)" }}>Review department knowledge as a network, inspect any node, and add or remove entries.</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setAdding((value) => !value)}
						className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-[800] text-white transition hover:-translate-y-0.5"
						style={{ background: adding ? "var(--ink)" : "var(--teal)", boxShadow: "0 8px 20px rgba(46,156,142,0.22)" }}
					>
						<Icon name={adding ? "x" : "sparkle"} size={14} />
						{adding ? "Close" : "New entry"}
					</button>
					<div className="flex rounded-full border bg-white p-1" style={{ borderColor: "var(--line)", boxShadow: "var(--sh-sm)" }}>
						{[
							{ value: "graph" as const, label: "Graph" },
							{ value: "list" as const, label: "List" },
						].map((option) => (
							<button key={option.value} type="button" onClick={() => setTab(option.value)} className="rounded-full px-3 py-1.5 text-xs font-[800] transition" style={{ background: tab === option.value ? "var(--teal)" : "transparent", color: tab === option.value ? "#fff" : "var(--ink-2)" }}>
								{option.label}
							</button>
						))}
					</div>
				</div>
			</header>

			{adding ? <KbAddForm onClose={() => setAdding(false)} /> : null}

			{tab === "graph" ? <KnowledgeGraph /> : <KbList />}
		</div>
	);
}
