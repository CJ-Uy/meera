"use client";

import { Icon } from "@/components/demo/shared";
import { useAdmin } from "@/features/admin/store/admin-store";
import type { Admin, AdminNote, DemoTicket } from "@/features/admin/types";

function adminName(admins: Admin[], adminId: string) {
	return admins.find((admin) => admin.id === adminId)?.name ?? "Unknown admin";
}

function relativeTime(timestamp: number) {
	const deltaSeconds = Math.round((timestamp - Date.now()) / 1000);
	const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
		{ unit: "day", seconds: 86_400 },
		{ unit: "hour", seconds: 3_600 },
		{ unit: "minute", seconds: 60 },
	];
	for (const item of units) {
		if (Math.abs(deltaSeconds) >= item.seconds) {
			return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(deltaSeconds / item.seconds), item.unit);
		}
	}
	return "just now";
}

function ThreadNote({ note, admins }: { note: AdminNote; admins: Admin[] }) {
	return (
		<li className="rounded-2xl border bg-white p-3" style={{ borderColor: "var(--line)" }}>
			<div className="mb-1 flex flex-wrap items-center gap-2">
				<span className="text-sm font-[800]">{adminName(admins, note.adminId)}</span>
				<span className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>{relativeTime(note.at)}</span>
			</div>
			<p className="text-sm leading-6" style={{ color: "var(--ink-2)" }}>{note.text}</p>
		</li>
	);
}

export function AdminThread({ ticket }: { ticket: DemoTicket }) {
	const { admins } = useAdmin();

	return (
		<section className="mt-5 rounded-2xl border bg-[#FCFAF6] p-4" style={{ borderColor: "var(--line)" }}>
			<div className="mb-3 flex items-center gap-2">
				<Icon name="lock" size={15} className="text-[#2E9C8E]" />
				<div>
					<div className="text-sm font-[800]">Admin thread</div>
					<div className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--muted)" }}>Private staff notes</div>
				</div>
			</div>
			{ticket.notes.length === 0 ? (
				<div className="rounded-2xl border border-dashed bg-white px-3 py-4 text-sm font-bold" style={{ borderColor: "var(--line-2)", color: "var(--muted)" }}>
					No admin notes yet.
				</div>
			) : (
				<ul className="grid gap-2">
					{ticket.notes.map((note) => <ThreadNote key={note.id} note={note} admins={admins} />)}
				</ul>
			)}
		</section>
	);
}
