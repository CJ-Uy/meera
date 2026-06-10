"use client";

import type { TicketStatus } from "@/features/admin/types";

export type ClaimFilter = "all" | "claimed" | "unclaimed";

export type InboxFilterState = {
	status: "all" | TicketStatus;
	tag: "all" | string;
	claim: ClaimFilter;
	crossDeptOnly: boolean;
};

const statuses: ("all" | TicketStatus)[] = ["all", "New", "In progress", "Awaiting student", "Resolved"];
const claims: { value: ClaimFilter; label: string }[] = [
	{ value: "all", label: "All ownership" },
	{ value: "claimed", label: "Claimed" },
	{ value: "unclaimed", label: "Unclaimed" },
];

export function InboxFilters({ value, tags, onChange }: { value: InboxFilterState; tags: string[]; onChange: (value: InboxFilterState) => void }) {
	return (
		<div className="grid gap-2">
			<div className="grid grid-cols-2 gap-2">
				<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
					Status
					<select value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as InboxFilterState["status"] })} className="rounded-xl border bg-white px-3 py-2 text-[12px] font-bold outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
						{statuses.map((status) => <option key={status} value={status}>{status === "all" ? "All statuses" : status}</option>)}
					</select>
				</label>
				<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
					Tag
					<select value={value.tag} onChange={(event) => onChange({ ...value, tag: event.target.value })} className="rounded-xl border bg-white px-3 py-2 text-[12px] font-bold outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
						<option value="all">All tags</option>
						{tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
					</select>
				</label>
			</div>
			<div className="grid grid-cols-[1fr_auto] gap-2">
				<label className="grid gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
					Ownership
					<select value={value.claim} onChange={(event) => onChange({ ...value, claim: event.target.value as ClaimFilter })} className="rounded-xl border bg-white px-3 py-2 text-[12px] font-bold outline-none" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}>
						{claims.map((claim) => <option key={claim.value} value={claim.value}>{claim.label}</option>)}
					</select>
				</label>
				<label className="mt-auto inline-flex h-9 items-center gap-2 rounded-xl border bg-white px-3 text-[12px] font-bold" style={{ borderColor: value.crossDeptOnly ? "var(--teal-100)" : "var(--line-2)", color: value.crossDeptOnly ? "var(--teal-700)" : "var(--ink-2)" }}>
					<input type="checkbox" checked={value.crossDeptOnly} onChange={(event) => onChange({ ...value, crossDeptOnly: event.target.checked })} />
					Cross-dept
				</label>
			</div>
		</div>
	);
}
