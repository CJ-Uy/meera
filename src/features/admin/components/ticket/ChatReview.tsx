"use client";

import { useState } from "react";
import { Button, Icon, IconChip } from "@/components/demo/shared";
import type { DemoTicket } from "@/features/admin/types";

function formatTime(at: number) {
	return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(at));
}

export function ChatReview({ ticket }: { ticket: DemoTicket }) {
	const [open, setOpen] = useState(false);

	return (
		<div className="rounded-2xl border bg-white p-4" style={{ borderColor: "var(--line)" }}>
			<div className="mb-3 flex items-center gap-3">
				<IconChip name="chat" tint="teal" size={36} />
				<div className="min-w-0 flex-1">
					<div className="font-[800]">Chat review</div>
					<div className="font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>{ticket.conversation.length} transcript messages</div>
				</div>
				<Button onClick={() => setOpen(true)}>Open transcript</Button>
			</div>
			<p className="text-sm leading-6" style={{ color: "var(--ink-2)" }}>Review the full student and Meera exchange before changing the triage record.</p>
			{open ? (
				<div className="fixed inset-0 z-[200] bg-[rgba(28,51,73,0.28)] p-4">
					<div className="ml-auto flex h-full w-full max-w-[560px] flex-col rounded-[24px] border bg-white" style={{ borderColor: "var(--line)", boxShadow: "var(--sh-lg)" }}>
						<div className="flex items-center gap-3 border-b p-4" style={{ borderColor: "var(--line)" }}>
							<IconChip name="chat" tint="teal" size={36} />
							<div className="min-w-0 flex-1">
								<div className="truncate font-[800]">Transcript for #{ticket.id}</div>
								<div className="truncate font-['DM_Mono'] text-[10px]" style={{ color: "var(--muted)" }}>{ticket.student}</div>
							</div>
							<button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full border bg-white" style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }} aria-label="Close transcript">
								<Icon name="check" size={15} />
							</button>
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto p-4">
							<div className="grid gap-3">
								{ticket.conversation.map((message) => (
									<div key={`${message.at}-${message.role}`} className="rounded-2xl border p-3" style={{ borderColor: "var(--line)", background: message.role === "meera" ? "var(--teal-050)" : "#fff" }}>
										<div className="mb-1 flex items-center justify-between gap-2 font-['DM_Mono'] text-[10px] uppercase" style={{ color: "var(--muted)" }}>
											<span>{message.role}</span>
											<span>{formatTime(message.at)}</span>
										</div>
										<p className="text-sm leading-6" style={{ color: "var(--ink-2)" }}>{message.text}</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
