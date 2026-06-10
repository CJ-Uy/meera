"use client";

import { useState } from "react";
import { KnowledgeGraph } from "@/features/admin/components/kb/KnowledgeGraph";
import { KbList } from "@/features/admin/components/kb/KbList";

type KnowledgeTab = "graph" | "list";

export function KnowledgeDashboard() {
	const [tab, setTab] = useState<KnowledgeTab>("graph");

	return (
		<div className="mx-auto w-[min(1500px,calc(100%_-_2rem))] py-6">
			<header className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>Knowledge base</p>
					<h1 className="mt-1 text-3xl font-[800]">GraphRAG knowledge map</h1>
					<p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--ink-2)" }}>Review department knowledge, shared bridge entities, and manual CRUD updates from the in-memory admin store.</p>
				</div>
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
			</header>

			{tab === "graph" ? <KnowledgeGraph /> : <KbList />}
		</div>
	);
}
