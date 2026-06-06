"use client";

import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { FloatIcon } from "@/components/media-icons";

type SharingBadgeProps = {
	supportsCompanion: boolean;
	onOpenCompanion: () => void;
	onStopSharing: () => void;
};

export function SharingBadge({ supportsCompanion, onOpenCompanion, onStopSharing }: SharingBadgeProps) {
	const badgeRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);

	const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
		if ((event.target as HTMLElement).closest("button")) return;
		const badge = badgeRef.current;
		if (!badge) return;

		const rect = badge.getBoundingClientRect();
		dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
		event.currentTarget.setPointerCapture(event.pointerId);
	}, []);

	const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		const badge = badgeRef.current;
		if (!drag || drag.pointerId !== event.pointerId || !badge) return;

		const x = Math.max(8, Math.min(window.innerWidth - badge.offsetWidth - 8, event.clientX - drag.offsetX));
		const y = Math.max(8, Math.min(window.innerHeight - badge.offsetHeight - 8, event.clientY - drag.offsetY));
		badge.style.left = `${x}px`;
		badge.style.top = `${y}px`;
		badge.style.right = "auto";
		badge.style.bottom = "auto";
	}, []);

	const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
		if (dragRef.current?.pointerId !== event.pointerId) return;
		dragRef.current = null;
		event.currentTarget.releasePointerCapture(event.pointerId);
	}, []);

	return (
		<div
			ref={badgeRef}
			className="fixed right-2 bottom-2 left-2 z-50 flex min-h-16 touch-none cursor-grab items-center rounded-xl border border-emerald-800 bg-emerald-950 p-2 text-white shadow-2xl active:cursor-grabbing sm:right-5 sm:bottom-5 sm:left-auto sm:min-w-[330px]"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
		>
			<div className="mr-2 grid grid-cols-2 gap-[3px] opacity-40" aria-hidden="true">
				{Array.from({ length: 6 }, (_, index) => (
					<span className="size-[2px] rounded-full bg-current" key={index} />
				))}
			</div>
			<span className="mr-2 grid size-8 place-items-center rounded-lg bg-white/10">
				<span className="size-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/10" />
			</span>
			<span className="flex-1">
				<small className="block text-[8px] uppercase text-emerald-100/70">Meera support</small>
				<strong className="block text-xs">You are sharing</strong>
			</span>
			{supportsCompanion ? (
				<button
					type="button"
					className="mx-1.5 grid size-9 place-items-center rounded-lg bg-white/10 hover:bg-white/20"
					onClick={onOpenCompanion}
					aria-label="Open always-on-top helper"
				>
					<span className="size-4">
						<FloatIcon />
					</span>
				</button>
			) : null}
			<button
				type="button"
				className="self-stretch rounded-lg bg-red-500 px-3 text-[10px] font-semibold hover:bg-red-400"
				onClick={onStopSharing}
			>
				Stop
			</button>
		</div>
	);
}
