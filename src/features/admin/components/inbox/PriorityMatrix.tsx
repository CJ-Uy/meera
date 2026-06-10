"use client";

import type { Complexity, DemoTicket, Severity } from "@/features/admin/types";

export type PriorityMatrixSelection = {
	severity: Severity;
	complexity: Complexity;
};

const severities: Severity[] = ["Critical", "High", "Medium", "Low"];
const complexities: Complexity[] = ["Low", "Medium", "High"];

function countCell(tickets: DemoTicket[], severity: Severity, complexity: Complexity) {
	return tickets.filter((ticket) => ticket.severity === severity && ticket.complexity === complexity).length;
}

export function PriorityMatrix({ tickets, selected, onSelect }: { tickets: DemoTicket[]; selected: PriorityMatrixSelection | null; onSelect: (selection: PriorityMatrixSelection | null) => void }) {
	return (
		<div className="rounded-2xl border bg-[#FCFAF6] p-3" style={{ borderColor: "var(--line)" }}>
			<div className="mb-2 flex items-center justify-between">
				<div className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Priority matrix</div>
				<div className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--teal-700)" }}>Severity x complexity</div>
			</div>
			<div className="grid grid-cols-[72px_repeat(3,minmax(0,1fr))] gap-1 text-[11px]">
				<div />
				{complexities.map((complexity) => <div key={complexity} className="text-center font-bold" style={{ color: "var(--muted)" }}>{complexity}</div>)}
				{severities.map((severity) => (
					<div key={severity} className="contents">
						<div className="flex items-center font-bold" style={{ color: "var(--ink-2)" }}>{severity}</div>
						{complexities.map((complexity) => {
							const active = selected?.severity === severity && selected.complexity === complexity;
							const doFirst = severity === "High" && complexity === "Low";
							const count = countCell(tickets, severity, complexity);
							return (
								<button
									key={`${severity}-${complexity}`}
									type="button"
									onClick={() => onSelect(active ? null : { severity, complexity })}
									className="min-h-10 rounded-xl border text-center font-[800] transition hover:-translate-y-0.5"
									style={{
										background: active ? "var(--teal)" : doFirst ? "var(--sand-050)" : "#fff",
										borderColor: active ? "var(--teal)" : doFirst ? "var(--sand)" : "var(--line-2)",
										color: active ? "#fff" : doFirst ? "var(--sand-600)" : "var(--ink)",
										boxShadow: doFirst && !active ? "inset 0 0 0 1px var(--sand)" : "none",
									}}
									aria-pressed={active}
									title={doFirst ? "Do-first: high severity, low complexity" : undefined}
								>
									{count}
								</button>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}
