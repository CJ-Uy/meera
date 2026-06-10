"use client";

import { useState } from "react";
import { Card, Icon, type IconName } from "@/components/demo/shared";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS } from "@/features/admin/types";

function Section({ icon, title, description, children }: { icon: IconName; title: string; description: string; children: React.ReactNode }) {
	return (
		<Card className="p-5">
			<div className="mb-4 flex items-start gap-3">
				<span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: "var(--teal-050)", color: "var(--teal-700)" }}>
					<Icon name={icon} size={17} />
				</span>
				<div>
					<h2 className="text-lg font-[800]">{title}</h2>
					<p className="text-sm" style={{ color: "var(--ink-2)" }}>{description}</p>
				</div>
			</div>
			<div className="grid gap-4">{children}</div>
		</Card>
	);
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 first:border-t-0 first:pt-0" style={{ borderColor: "var(--line)" }}>
			<div className="min-w-0">
				<div className="text-[14px] font-bold" style={{ color: "var(--ink)" }}>{label}</div>
				{hint ? <div className="text-[12.5px]" style={{ color: "var(--muted)" }}>{hint}</div> : null}
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	);
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
	return (
		<button type="button" role="switch" aria-checked={on} onClick={onToggle} className="relative h-6 w-11 rounded-full transition" style={{ background: on ? "var(--teal)" : "var(--line-2)" }}>
			<span className="absolute top-0.5 size-5 rounded-full bg-white transition-all" style={{ left: on ? "1.375rem" : "0.125rem", boxShadow: "var(--sh-sm)" }} />
		</button>
	);
}

function Input({ value, onChange, suffix }: { value: string; onChange: (value: string) => void; suffix?: string }) {
	return (
		<span className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2" style={{ borderColor: "var(--line-2)" }}>
			<input value={value} onChange={(event) => onChange(event.target.value)} className="w-20 bg-transparent text-right text-sm font-bold outline-none" style={{ color: "var(--ink)" }} />
			{suffix ? <span className="font-['DM_Mono'] text-[10px] uppercase" style={{ color: "var(--muted)" }}>{suffix}</span> : null}
		</span>
	);
}

export default function AdminSettingsPage() {
	const { activeDepartment } = useAdmin();
	const [autoResolve, setAutoResolve] = useState(82);
	const [displayName, setDisplayName] = useState(DEPARTMENT_LABELS[activeDepartment]);
	const [supportEmail, setSupportEmail] = useState(`${activeDepartment.toLowerCase()}-support@university.edu`);
	const [firstResponse, setFirstResponse] = useState("4");
	const [resolution, setResolution] = useState("48");
	const [notifyCross, setNotifyCross] = useState(true);
	const [notifyUnclaimed, setNotifyUnclaimed] = useState(true);
	const [notifyDigest, setNotifyDigest] = useState(false);

	return (
		<div className="mx-auto w-[min(860px,calc(100%-2rem))] py-6">
			<header className="mb-5">
				<p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.13em]" style={{ color: "var(--teal-700)" }}>Settings</p>
				<h1 className="mt-1 text-3xl font-[800]">{DEPARTMENT_LABELS[activeDepartment]} settings</h1>
				<p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-2)" }}>Tune how Meera triages, automates, and notifies for this department.</p>
			</header>

			<div className="grid gap-4">
				<Section icon="building" title="Department profile" description="How this team appears to students and in routing.">
					<Row label="Display name">
						<span className="inline-flex items-center rounded-xl border bg-white px-3 py-2" style={{ borderColor: "var(--line-2)" }}>
							<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-48 bg-transparent text-sm font-bold outline-none" style={{ color: "var(--ink)" }} />
						</span>
					</Row>
					<Row label="Support email" hint="Replies to students are sent from here.">
						<span className="inline-flex items-center rounded-xl border bg-white px-3 py-2" style={{ borderColor: "var(--line-2)" }}>
							<input value={supportEmail} onChange={(event) => setSupportEmail(event.target.value)} className="w-56 bg-transparent text-sm font-bold outline-none" style={{ color: "var(--ink)" }} />
						</span>
					</Row>
				</Section>

				<Section icon="sparkle" title="Triage & automation" description="Where Meera resolves on its own versus escalating to staff.">
					<Row label="Auto-resolve confidence" hint="Meera answers directly above this confidence; below it, a ticket is created.">
						<div className="flex items-center gap-3">
							<input type="range" min={50} max={99} value={autoResolve} onChange={(event) => setAutoResolve(Number(event.target.value))} className="w-40 accent-[var(--teal)]" />
							<span className="w-12 text-right text-sm font-[800]" style={{ color: "var(--teal-700)" }}>{autoResolve}%</span>
						</div>
					</Row>
					<Row label="Escalate low-confidence tickets" hint="Route anything Meera is unsure about straight to the queue.">
						<Toggle on onToggle={() => undefined} />
					</Row>
				</Section>

				<Section icon="clock" title="SLA targets" description="Response and resolution goals used by Insights.">
					<Row label="First response target">
						<Input value={firstResponse} onChange={setFirstResponse} suffix="hours" />
					</Row>
					<Row label="Resolution target">
						<Input value={resolution} onChange={setResolution} suffix="hours" />
					</Row>
				</Section>

				<Section icon="bell" title="Notifications" description="What shows up on the Notifications page for this department.">
					<Row label="Cross-department requests" hint="When another team asks this department to collaborate.">
						<Toggle on={notifyCross} onToggle={() => setNotifyCross((value) => !value)} />
					</Row>
					<Row label="High-severity unclaimed" hint="Critical or high tickets sitting without an owner.">
						<Toggle on={notifyUnclaimed} onToggle={() => setNotifyUnclaimed((value) => !value)} />
					</Row>
					<Row label="Daily digest email" hint="A morning summary of open work.">
						<Toggle on={notifyDigest} onToggle={() => setNotifyDigest((value) => !value)} />
					</Row>
				</Section>
			</div>

			<p className="mt-4 text-center font-['DM_Mono'] text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>Demo settings — changes are local to this session</p>
		</div>
	);
}
