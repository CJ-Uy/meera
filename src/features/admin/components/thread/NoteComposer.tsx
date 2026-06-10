"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/demo/shared";
import { useActingAdmin, useAdmin } from "@/features/admin/store/admin-store";

export function NoteComposer({ ticketId }: { ticketId: string }) {
	const { addNote } = useAdmin();
	const actingAdmin = useActingAdmin();
	const [text, setText] = useState("");
	const [posting, setPosting] = useState(false);
	const trimmed = text.trim();

	async function postNote() {
		if (!trimmed || !actingAdmin) return;
		setPosting(true);
		await addNote(ticketId, trimmed);
		setText("");
		setPosting(false);
	}

	return (
		<div className="mt-3 grid gap-2 rounded-2xl border bg-white p-3" style={{ borderColor: "var(--line)" }}>
			<textarea
				value={text}
				onChange={(event) => setText(event.target.value)}
				placeholder={actingAdmin ? `Add a private note as ${actingAdmin.name}` : "Choose an acting admin to post a note"}
				rows={3}
				className="resize-y rounded-xl border bg-[#FCFAF6] px-3 py-2 text-sm outline-none"
				style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}
			/>
			<div className="flex justify-end">
				<Button variant="primary" onClick={postNote} className={!trimmed || posting || !actingAdmin ? "pointer-events-none opacity-60" : ""}>
					<Icon name="chat" size={14} />{posting ? "Posting..." : "Post note"}
				</Button>
			</div>
		</div>
	);
}
