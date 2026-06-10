"use client";

import { Icon } from "@/components/demo/shared";
import { CrossDeptBadge } from "@/features/admin/components/crossdept/CrossDeptBadge";
import { TaskBoard } from "@/features/admin/components/crossdept/TaskBoard";
import { AdminThread } from "@/features/admin/components/thread/AdminThread";
import { NoteComposer } from "@/features/admin/components/thread/NoteComposer";
import type { DemoTicket } from "@/features/admin/types";

export function CollaborationWorkspace({ ticket }: { ticket: DemoTicket }) {
	if (!ticket.cross?.active) return null;

	return (
		<section className="mt-5 grid gap-4 rounded-2xl border bg-[#F8FBFA] p-4" style={{ borderColor: "var(--teal-100)" }}>
			<div className="flex items-start gap-2">
				<Icon name="users" size={18} className="mt-0.5 text-[#2E9C8E]" />
				<div>
					<div className="text-sm font-[800]">Collaboration workspace</div>
					<p className="mt-1 text-sm leading-6" style={{ color: "var(--ink-2)" }}>Shared notes and tasks are visible to every participating department.</p>
				</div>
			</div>
			<CrossDeptBadge ticket={ticket} />
			<div>
				<AdminThread ticket={ticket} />
				<NoteComposer ticketId={ticket.id} />
			</div>
			<TaskBoard ticket={ticket} />
		</section>
	);
}
