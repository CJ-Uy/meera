"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/demo/shared";
import { useAdmin } from "@/features/admin/store/admin-store";
import { DEPARTMENT_LABELS, type DemoTicket } from "@/features/admin/types";

export function AcceptRejectPanel({ ticket }: { ticket: DemoTicket }) {
	const admin = useAdmin();
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState<"accepted" | "rejected" | null>(null);
	const participant = ticket.cross?.participants.find((item) => item.dept === admin.activeDepartment);
	const trimmedReason = reason.trim();

	if (!ticket.cross || participant?.decision !== "pending") {
		return null;
	}

	async function respond(decision: "accepted" | "rejected") {
		if (decision === "rejected" && !trimmedReason) return;
		setSubmitting(decision);
		await admin.respondCrossDept(ticket.id, admin.activeDepartment, decision, decision === "rejected" ? trimmedReason : undefined);
		setReason("");
		setSubmitting(null);
	}

	return (
		<section className="mt-5 rounded-2xl border p-4" style={{ background: "#FBE7E0", borderColor: "#F3D2C6" }}>
			<div className="mb-3 flex items-start gap-2">
				<Icon name="alert" size={18} className="mt-0.5 text-[#C0532F]" />
				<div>
					<div className="text-sm font-[800]">Cross-department request for {DEPARTMENT_LABELS[admin.activeDepartment]}</div>
					<p className="mt-1 text-sm leading-6" style={{ color: "#8A4A33" }}>{participant.reason ?? "Review whether this department should join the ticket."}</p>
				</div>
			</div>
			<textarea
				value={reason}
				onChange={(event) => setReason(event.target.value)}
				placeholder="Reason required if rejecting"
				rows={2}
				className="w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm outline-none"
				style={{ borderColor: "#F3D2C6", color: "var(--ink-2)" }}
			/>
			<div className="mt-3 flex flex-wrap justify-end gap-2">
				<Button onClick={() => respond("rejected")} className={!trimmedReason || submitting ? "pointer-events-none opacity-60" : ""}>
					<Icon name="alert" size={14} />{submitting === "rejected" ? "Rejecting..." : "Reject"}
				</Button>
				<Button variant="primary" onClick={() => respond("accepted")} className={submitting ? "pointer-events-none opacity-60" : ""}>
					<Icon name="check" size={14} />{submitting === "accepted" ? "Accepting..." : "Accept"}
				</Button>
			</div>
		</section>
	);
}
