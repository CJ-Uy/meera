"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, IconChip, Pill } from "@/components/demo/shared";
import { buildInsightsMetrics, type CountDatum, type InsightsTimeWindow } from "@/features/admin/components/insights/insights-metrics";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS, type Complexity, type Severity } from "@/features/admin/types";

const WINDOWS: { value: InsightsTimeWindow; label: string }[] = [
	{ value: "today", label: "Today" },
	{ value: "7d", label: "7d" },
	{ value: "30d", label: "30d" },
	{ value: "term", label: "Term" },
];

const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];
const COMPLEXITIES: Complexity[] = ["Low", "Medium", "High"];
const BAR_COLORS = ["#2E9C8E", "#D9A65A", "#E79B6B", "#E08769", "#7FB85C", "#1C3349"];

function formatMinutes(minutes: number) {
	if (minutes <= 0) return "0m";
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

function formatRate(value: number) {
	return `${Math.round(value * 100)}%`;
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
	return (
		<div>
			<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>{eyebrow}</p>
			<h2 className="mt-1 text-lg font-[800]">{title}</h2>
		</div>
	);
}

function StatCard({ label, value, detail, tint = "teal" }: { label: string; value: string; detail: string; tint?: "teal" | "sand" | "gold" | "green" | "rose" | "ink" }) {
	return (
		<Card className="p-4">
			<div className="flex items-start gap-3">
				<IconChip name="trend" tint={tint} size={38} />
				<div className="min-w-0">
					<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>{label}</p>
					<div className="mt-1 text-2xl font-[800] leading-none">{value}</div>
					<p className="mt-2 text-xs leading-5" style={{ color: "var(--ink-2)" }}>{detail}</p>
				</div>
			</div>
		</Card>
	);
}

function ChartCard({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
	return (
		<Card className={`p-4 ${className}`}>
			<h3 className="mb-3 text-sm font-[800]">{title}</h3>
			{children}
		</Card>
	);
}

function EmptyChart() {
	return <div className="flex h-[220px] items-center justify-center rounded-[16px] border text-sm font-bold" style={{ borderColor: "var(--line)", color: "var(--muted)", background: "#FCFAF6" }}>No data for this window.</div>;
}

function BarDistribution({ data }: { data: CountDatum[] }) {
	if (data.every((item) => item.count === 0)) return <EmptyChart />;
	return (
		<div className="h-[220px]">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
					<CartesianGrid stroke="var(--line)" vertical={false} />
					<XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
					<YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
					<Tooltip cursor={{ fill: "rgba(46,156,142,.08)" }} contentStyle={{ borderColor: "var(--line)", borderRadius: 12, boxShadow: "var(--sh-sm)" }} />
					<Bar dataKey="count" radius={[8, 8, 0, 0]}>
						{data.map((entry, index) => <Cell key={entry.label} fill={BAR_COLORS[index % BAR_COLORS.length]} />)}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

function VolumeChart({ data }: { data: { date: string; label: string; opened: number; resolved: number }[] }) {
	if (data.every((item) => item.opened === 0 && item.resolved === 0)) return <EmptyChart />;
	return (
		<div className="h-[260px]">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
					<defs>
						<linearGradient id="opened" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#2E9C8E" stopOpacity={0.45} />
							<stop offset="100%" stopColor="#2E9C8E" stopOpacity={0.04} />
						</linearGradient>
						<linearGradient id="resolved" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#D9A65A" stopOpacity={0.4} />
							<stop offset="100%" stopColor="#D9A65A" stopOpacity={0.03} />
						</linearGradient>
					</defs>
					<CartesianGrid stroke="var(--line)" vertical={false} />
					<XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} minTickGap={18} />
					<YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} />
					<Tooltip contentStyle={{ borderColor: "var(--line)", borderRadius: 12, boxShadow: "var(--sh-sm)" }} />
					<Area type="monotone" dataKey="opened" stroke="#2E9C8E" fill="url(#opened)" strokeWidth={2} />
					<Area type="monotone" dataKey="resolved" stroke="#D9A65A" fill="url(#resolved)" strokeWidth={2} />
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}

function Heatmap({ data, max }: { data: { severity: Severity; complexity: Complexity; count: number }[]; max: number }) {
	const lookup = new Map(data.map((cell) => [`${cell.severity}:${cell.complexity}`, cell.count]));
	return (
		<div className="grid gap-2">
			<div className="grid grid-cols-[88px_repeat(3,minmax(0,1fr))] gap-2 text-center font-['DM_Mono'] text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>
				<span />
				{COMPLEXITIES.map((complexity) => <span key={complexity}>{complexity}</span>)}
			</div>
			{SEVERITIES.map((severity) => (
				<div key={severity} className="grid grid-cols-[88px_repeat(3,minmax(0,1fr))] gap-2">
					<div className="flex items-center text-xs font-bold">{severity}</div>
					{COMPLEXITIES.map((complexity) => {
						const count = lookup.get(`${severity}:${complexity}`) ?? 0;
						const intensity = max === 0 ? 0 : count / max;
						return (
							<div key={`${severity}-${complexity}`} className="min-h-14 rounded-[14px] border p-2 text-center" style={{ borderColor: "var(--line)", background: `rgba(46,156,142,${0.08 + intensity * 0.55})` }}>
								<div className="text-lg font-[800]">{count}</div>
								<div className="font-['DM_Mono'] text-[9px] uppercase" style={{ color: "var(--ink-2)" }}>tickets</div>
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
}

export function InsightsDashboard() {
	const { tickets, activeDepartment, admins, loading } = useAdmin();
	const [timeWindow, setTimeWindow] = useState<InsightsTimeWindow>("7d");
	const metrics = useMemo(() => buildInsightsMetrics(tickets, activeDepartment, timeWindow), [tickets, activeDepartment, timeWindow]);
	const teamLoad = useMemo(() => metrics.teamLoad.map((item) => ({
		...item,
		name: item.adminId === "unclaimed" ? item.name : admins.find((admin) => admin.id === item.adminId)?.name ?? item.adminId,
	})), [admins, metrics.teamLoad]);

	return (
		<div className="mx-auto w-[min(1500px,calc(100%_-_2rem))] py-6">
			<header className="mb-5 flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>Admin insights</p>
					<h1 className="mt-1 text-3xl font-[800]">Operational pulse for {DEPARTMENT_LABELS[activeDepartment]}</h1>
					<p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--ink-2)" }}>Ticket volume, AI confidence, backlog risk, and team load derived from the active department view.</p>
				</div>
				<div className="flex rounded-full border bg-white p-1" style={{ borderColor: "var(--line)", boxShadow: "var(--sh-sm)" }}>
					{WINDOWS.map((window) => (
						<button key={window.value} type="button" onClick={() => setTimeWindow(window.value)} className="rounded-full px-3 py-1.5 text-xs font-[800] transition" style={{ background: timeWindow === window.value ? "var(--teal)" : "transparent", color: timeWindow === window.value ? "#fff" : "var(--ink-2)" }}>
							{window.label}
						</button>
					))}
				</div>
			</header>

			{loading ? <Card className="mb-4 p-5 text-sm font-bold" style={{ color: "var(--muted)" }}>Loading dashboard metrics...</Card> : null}

			<section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<StatCard label="Throughput" value={`${metrics.summary.resolved}/${metrics.summary.opened}`} detail={`${formatMinutes(metrics.summary.avgResolutionMinutes)} avg resolution - ${formatMinutes(metrics.summary.avgFirstResponseMinutes)} first response`} tint="teal" />
				<StatCard label="Auto-resolution" value={formatRate(metrics.summary.deflectionRate)} detail={`${formatRate(metrics.summary.escalationRate)} escalation rate - ${formatRate(metrics.summary.reopenRate)} reopen rate`} tint="green" />
				<StatCard label="Cross-dept" value={String(metrics.crossDepartmentCount)} detail="Tickets visible through cross-department collaboration." tint="sand" />
				<StatCard label="Team load" value={`${metrics.summary.claimed}/${metrics.summary.opened}`} detail={`${metrics.summary.unclaimed} unclaimed tickets in the selected window.`} tint="gold" />
			</section>

			<section className="mb-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
				<ChartCard title="Volume over time">
					<VolumeChart data={metrics.volumeOverTime} />
				</ChartCard>
				<Card className="p-4">
					<SectionTitle eyebrow="Knowledge" title="Coverage gaps" />
					<div className="mt-4 grid gap-3">
						{metrics.kbCoverageGaps.length === 0 ? (
							<div className="rounded-[16px] border p-4 text-sm font-bold" style={{ borderColor: "var(--line)", color: "var(--muted)", background: "#FCFAF6" }}>No low-confidence un-ingested topics in this window.</div>
						) : metrics.kbCoverageGaps.map((gap) => (
							<div key={gap.tag} className="rounded-[16px] border p-3" style={{ borderColor: "var(--line)", background: "#FCFAF6" }}>
								<div className="flex items-center justify-between gap-2">
									<div className="font-bold">{gap.tag}</div>
									<Pill tint="sand">{gap.count} gaps</Pill>
								</div>
								<p className="mt-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>{gap.avgConfidence}% avg AI confidence</p>
								<p className="mt-2 text-xs leading-5" style={{ color: "var(--ink-2)" }}>{gap.examples.join(" - ")}</p>
							</div>
						))}
					</div>
				</Card>
			</section>

			<section className="mb-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
				<ChartCard title="Volume by tag"><BarDistribution data={metrics.byTag} /></ChartCard>
				<ChartCard title="Volume by department"><BarDistribution data={metrics.byDepartment} /></ChartCard>
				<ChartCard title="Backlog aging"><BarDistribution data={metrics.backlogAging} /></ChartCard>
				<ChartCard title="Severity distribution"><BarDistribution data={metrics.severityDistribution} /></ChartCard>
				<ChartCard title="Complexity distribution"><BarDistribution data={metrics.complexityDistribution} /></ChartCard>
				<ChartCard title="AI-confidence distribution"><BarDistribution data={metrics.confidenceBuckets} /></ChartCard>
			</section>

			<section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
				<ChartCard title="Severity x complexity heatmap">
					<Heatmap data={metrics.severityComplexityHeatmap} max={metrics.severityComplexityMax} />
				</ChartCard>
				<ChartCard title="Team load">
					<BarDistribution data={teamLoad.map((item) => ({ label: item.name, count: item.count }))} />
				</ChartCard>
			</section>
		</div>
	);
}
