"use client";

import { useEffect } from "react";
import { Button, Card, Icon, Pill } from "@/components/demo/shared";

export function HowToPlayModal({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose, open]);

	if (!open) return null;

	return (
		<div
			className="absolute inset-0 z-30 grid place-items-center p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="how-to-play-title"
			onClick={(event) => {
				if (event.currentTarget === event.target) onClose();
			}}
			style={{
				background: "rgba(28,41,59,.34)",
				backdropFilter: "blur(3px)",
				animation: "fadeUp .28s ease",
			}}
		>
			<Card className="w-full max-w-[520px] p-5">
				<div className="flex items-start gap-3">
					<span
						className="grid size-10 shrink-0 place-items-center rounded-2xl"
						style={{ background: "var(--teal-050)", color: "var(--teal-700)" }}
					>
						<Icon name="sword" size={19} stroke={2.2} />
					</span>
					<div className="min-w-0 flex-1">
						<Pill tint="teal">Real AI battle</Pill>
						<h2 id="how-to-play-title" className="mt-2 mb-0 text-2xl font-[800]">
							How to play
						</h2>
					</div>
					<button
						type="button"
						aria-label="Close how to play"
						onClick={onClose}
						className="grid size-9 shrink-0 place-items-center rounded-full border transition hover:-translate-y-0.5"
						style={{ borderColor: "var(--line-2)", color: "var(--ink-2)" }}
					>
						<Icon name="x" size={16} stroke={2.2} />
					</button>
				</div>
				<div className="mt-4 grid gap-3 text-sm leading-6" style={{ color: "var(--ink-2)" }}>
					<p className="m-0">
						<strong style={{ color: "var(--ink)" }}>Goal:</strong> Tell Meera your real campus problem. She solves it or files a staff ticket.
					</p>
					<p className="m-0">
						<strong style={{ color: "var(--ink)" }}>Moves:</strong> Tap a suggested reply or type your own. It is the same AI support chat, dressed up as a battle.
					</p>
					<p className="m-0">
						<strong style={{ color: "var(--ink)" }}>Bosses:</strong> Each foe is a department your issue needs. Cross-department problems summon a pack.
					</p>
					<p className="m-0">
						<strong style={{ color: "var(--ink)" }}>HP bar:</strong> It drops as Meera makes progress on your case.
					</p>
					<p className="m-0">
						<strong style={{ color: "var(--ink)" }}>Morale:</strong> MiRA takes a hit when a turn does not move the case forward.
					</p>
					<p className="m-0">
						<strong style={{ color: "var(--ink)" }}>Two wins:</strong> Solve it yourself with no ticket, or call in backup with a ticket routed to the Admin inbox.
					</p>
					<p className="m-0">
						<strong style={{ color: "var(--ink)" }}>Voice:</strong> Tap the mic to speak your move.
					</p>
				</div>
				<div className="mt-5 flex justify-end">
					<Button variant="primary" onClick={onClose}>
						<Icon name="check" size={14} />
						Ready
					</Button>
				</div>
			</Card>
		</div>
	);
}
