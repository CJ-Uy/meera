"use client";

import type { Complexity, DemoTicket, Severity } from "@/features/admin/types";

export type PriorityMatrixSelection = {
	severity: Severity;
	complexity: Complexity;
};

const severities: Severity[] = ["Critical", "High", "Medium", "Low"];
const complexities: Complexity[] = ["Low", "Medium", "High"];

// Priority runs diagonally: Critical + Low complexity is the hottest "do first"
// corner, Low severity + High complexity is the coolest.
const severityWeight: Record<Severity, number> = { Critical: 3, High: 2, Medium: 1, Low: 0 };
const easeWeight: Record<Complexity, number> = { Low: 2, Medium: 1, High: 0 };
const MAX_SCORE = 5;

const COOL: [number, number, number] = [234, 243, 224]; // calm green wash
const HOT: [number, number, number] = [224, 135, 107]; // urgent rose

function mix(a: number, b: number, t: number) {
	return Math.round(a + (b - a) * t);
}

function cellColor(severity: Severity, complexity: Complexity) {
	const t = (severityWeight[severity] + easeWeight[complexity]) / MAX_SCORE;
	return `rgb(${mix(COOL[0], HOT[0], t)}, ${mix(COOL[1], HOT[1], t)}, ${mix(COOL[2], HOT[2], t)})`;
}

function countCell(tickets: DemoTicket[], severity: Severity, complexity: Complexity) {
	return tickets.filter((ticket) => ticket.severity === severity && ticket.complexity === complexity).length;
}

export function PriorityMatrix({ tickets, selected, onSelect }: { tickets: DemoTicket[]; selected: PriorityMatrixSelection | null; onSelect: (selection: PriorityMatrixSelection | null) => void }) {
	return (
		<div>
			<div className="grid grid-cols-[64px_repeat(3,minmax(0,1fr))] gap-1 text-[11px]">
				<div className="flex items-end pb-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>Sev / Cx</div>
				{complexities.map((complexity) => (
					<div key={complexity} className="text-center font-bold" style={{ color: "var(--muted)" }}>{complexity}</div>
				))}
				{severities.map((severity) => (
					<div key={severity} className="contents">
						<div className="flex items-center font-bold" style={{ color: "var(--ink-2)" }}>{severity}</div>
						{complexities.map((complexity) => {
							const active = selected?.severity === severity && selected.complexity === complexity;
							const count = countCell(tickets, severity, complexity);
							return (
								<button
									key={`${severity}-${complexity}`}
									type="button"
									onClick={() => onSelect(active ? null : { severity, complexity })}
									className="min-h-10 rounded-xl text-center font-[800] transition hover:-translate-y-0.5"
									style={{
										background: active ? "var(--teal)" : cellColor(severity, complexity),
										color: active ? "#fff" : "var(--ink)",
										boxShadow: active ? "0 0 0 2px var(--teal), 0 6px 14px rgba(46,156,142,0.25)" : "inset 0 0 0 1px rgba(255,255,255,0.5)",
										opacity: count === 0 && !active ? 0.55 : 1,
									}}
									aria-pressed={active}
									title={`${severity} severity · ${complexity} complexity`}
								>
									{count}
								</button>
							);
						})}
					</div>
				))}
			</div>
			<div className="mt-2.5 flex items-center gap-2">
				<span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>Lower</span>
				<span className="h-1.5 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, rgb(${COOL.join(",")}), rgb(${HOT.join(",")}))` }} />
				<span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.08em]" style={{ color: "var(--sand-600)" }}>Do first</span>
			</div>
		</div>
	);
}
