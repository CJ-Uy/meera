"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, IconChip, Pill } from "@/components/demo/shared";
import { Collapsible } from "@/features/admin/components/inbox/Collapsible";
import { InboxFilters, type InboxFilterState } from "@/features/admin/components/inbox/InboxFilters";
import { InboxQueue } from "@/features/admin/components/inbox/InboxQueue";
import { PriorityMatrix, type PriorityMatrixSelection } from "@/features/admin/components/inbox/PriorityMatrix";
import { SearchBar } from "@/features/admin/components/inbox/SearchBar";
import { sortTickets, type InboxSortMode } from "@/features/admin/components/inbox/sort";
import { TicketDetail } from "@/features/admin/components/ticket/TicketDetail";
import { DEPARTMENT_LABELS, type DemoTicket } from "@/features/admin/types";
import { useAdmin } from "@/features/admin/store/admin-store";

const defaultFilters: InboxFilterState = {
	status: "all",
	tag: "all",
	claim: "all",
	crossDeptOnly: false,
};

function matchesSearch(ticket: DemoTicket, query: string) {
	const normalized = query.trim().toLowerCase();
	if (!normalized) return true;
	return [ticket.id, ticket.title, ticket.student, ticket.aiSummary].some((value) => value.toLowerCase().includes(normalized));
}

function matchesFilters(ticket: DemoTicket, filters: InboxFilterState, matrix: PriorityMatrixSelection | null) {
	if (filters.status !== "all" && ticket.status !== filters.status) return false;
	if (filters.tag !== "all" && ticket.tag !== filters.tag) return false;
	if (filters.claim === "claimed" && !ticket.claimedBy) return false;
	if (filters.claim === "unclaimed" && ticket.claimedBy) return false;
	if (filters.crossDeptOnly && !ticket.cross) return false;
	if (matrix && (ticket.severity !== matrix.severity || ticket.complexity !== matrix.complexity)) return false;
	return true;
}

export default function AdminInboxPage() {
	const admin = useAdmin();
	const [search, setSearch] = useState("");
	const [sortMode, setSortMode] = useState<InboxSortMode>("recency");
	const [filters, setFilters] = useState<InboxFilterState>(defaultFilters);
	const [matrix, setMatrix] = useState<PriorityMatrixSelection | null>(null);

	const departmentTickets = useMemo(
		() => admin.tickets.filter((ticket) => ticket.ownerDept === admin.activeDepartment || Boolean(ticket.cross?.participants.some((participant) => participant.dept === admin.activeDepartment))),
		[admin.activeDepartment, admin.tickets],
	);
	const tags = useMemo(() => Array.from(new Set(departmentTickets.map((ticket) => ticket.tag))).sort(), [departmentTickets]);
	const visibleTickets = useMemo(
		() => sortTickets(departmentTickets.filter((ticket) => matchesSearch(ticket, search) && matchesFilters(ticket, filters, matrix)), sortMode),
		[departmentTickets, filters, matrix, search, sortMode],
	);
	const selected = visibleTickets.find((ticket) => ticket.id === admin.selectedTicketId) ?? visibleTickets.at(0) ?? null;
	const activeFilterCount = (filters.status !== "all" ? 1 : 0) + (filters.tag !== "all" ? 1 : 0) + (filters.claim !== "all" ? 1 : 0) + (filters.crossDeptOnly ? 1 : 0);

	useEffect(() => {
		if (selected && admin.selectedTicketId !== selected.id) admin.selectTicket(selected.id);
	}, [admin, selected]);

	if (admin.loading) {
		return <div className="grid h-full place-items-center text-sm font-bold" style={{ color: "var(--muted)" }}>Loading admin dashboard...</div>;
	}

	return (
		<div className="flex min-h-0 h-full flex-col">
			<div className="flex flex-wrap items-center gap-3 border-b bg-white px-5 py-3" style={{ borderColor: "var(--line)" }}>
				<IconChip name="eye" tint="teal" size={30} />
				<span className="font-[800]">Meera Lookout</span>
				<Pill>{DEPARTMENT_LABELS[admin.activeDepartment]}</Pill>
				<span className="ml-auto font-['DM_Mono'] text-[11px]" style={{ color: "var(--muted)" }}>{visibleTickets.length} of {departmentTickets.length} tickets</span>
			</div>
			<div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] md:overflow-hidden">
				<div className="border-r bg-white md:overflow-y-auto" style={{ borderColor: "var(--line)" }}>
					<div className="grid gap-2.5 px-4 py-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-bold">Ticket queue</span>
							<select value={sortMode} onChange={(event) => setSortMode(event.target.value as InboxSortMode)} className="rounded-full border bg-[#FCFAF6] px-3 py-1.5 font-['DM_Mono'] text-[10px] font-bold uppercase outline-none" style={{ borderColor: "var(--line-2)", color: "var(--muted)" }} aria-label="Sort tickets">
								<option value="recency">Newest first</option>
								<option value="severity">Severity</option>
								<option value="do-first">Do first</option>
							</select>
						</div>
						<SearchBar value={search} onChange={setSearch} />
						<Collapsible
							title="Filters"
							badge={activeFilterCount > 0 ? <span className="rounded-full px-2 py-0.5 font-['DM_Mono'] text-[9px] font-bold" style={{ background: "var(--teal-050)", color: "var(--teal-700)" }}>{activeFilterCount} active</span> : null}
						>
							<InboxFilters value={filters} tags={tags} onChange={setFilters} />
						</Collapsible>
						<Collapsible
							title="Priority matrix"
							badge={matrix ? <button type="button" onClick={(event) => { event.stopPropagation(); setMatrix(null); }} className="rounded-full px-2 py-0.5 font-['DM_Mono'] text-[9px] font-bold text-white" style={{ background: "var(--teal)" }}>{matrix.severity} · {matrix.complexity} ✕</button> : null}
						>
							<PriorityMatrix tickets={departmentTickets} selected={matrix} onSelect={setMatrix} />
						</Collapsible>
					</div>
					<InboxQueue tickets={visibleTickets} selectedTicketId={selected?.id ?? null} onSelect={admin.selectTicket} />
				</div>
				<div className="min-h-0 overflow-y-auto bg-[#FCFAF6]">
					{selected ? (
						<div className="mx-auto w-full max-w-[880px]">
							<TicketDetail key={selected.id} ticket={selected} />
						</div>
					) : (
						<Card className="m-5 p-5">No tickets for this department match the current inbox controls.</Card>
					)}
				</div>
			</div>
		</div>
	);
}
