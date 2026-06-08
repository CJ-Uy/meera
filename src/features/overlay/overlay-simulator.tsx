"use client";

import { useRef } from "react";
import { createGuidedOverlayDemo } from "@/features/overlay/overlay-demo";
import type { NormalizedPoint, OverlaySequenceStep } from "@/features/overlay/overlay-protocol";
import { useDesktopOverlay } from "@/features/overlay/use-desktop-overlay";

const cursorStops: NormalizedPoint[] = [
	{ x: 0.16, y: 0.2 },
	{ x: 0.82, y: 0.24 },
	{ x: 0.74, y: 0.78 },
	{ x: 0.22, y: 0.72 },
	{ x: 0.5, y: 0.5 },
];

const buttonClass =
	"min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-left text-[11px] font-semibold hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45";

export function OverlaySimulator() {
	const overlay = useDesktopOverlay();
	const cursorStopRef = useRef(0);
	const disabled = !overlay.available;

	const moveCursor = () => {
		const target = cursorStops[cursorStopRef.current % cursorStops.length];
		cursorStopRef.current += 1;
		void overlay.sendCommand({ type: "cursor.move", target, animationMs: 900, label: "Meera" });
	};

	const runCursorTour = () => {
		const steps: OverlaySequenceStep[] = cursorStops.map((target, index) => ({
			afterMs: index * 850,
			command: { type: "cursor.move", target, animationMs: 750, label: "Meera" },
		}));
		steps.push({ afterMs: cursorStops.length * 850, command: { type: "cursor.hide" } });
		overlay.runSequence(steps);
	};

	return (
		<section className="rounded-xl border border-slate-200 bg-white p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="text-sm font-semibold">Desktop overlay simulator</h3>
					<p className="mt-1 text-[10px] leading-4 text-slate-500">
						These controls call the same overlay API the AI assistant uses.
					</p>
				</div>
				<span
					className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${
						overlay.available ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
					}`}
				>
					{overlay.available ? `${overlay.status?.displays.length ?? 1} display connected` : "Desktop mode required"}
				</span>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-2">
				<button className={buttonClass} type="button" disabled={disabled} onClick={moveCursor}>
					Move cursor
				</button>
				<button className={buttonClass} type="button" disabled={disabled} onClick={runCursorTour}>
					Cursor tour
				</button>
				<button
					className={buttonClass}
					type="button"
					disabled={disabled}
					onClick={() =>
						void overlay.sendCommand({
							type: "arrow.show",
							id: `arrow-${Date.now()}`,
							target: { x: 0.75, y: 0.3 },
							direction: "left",
							message: "Click here",
							ttlMs: 4000,
						})
					}
				>
					Show arrow
				</button>
				<button
					className={buttonClass}
					type="button"
					disabled={disabled}
					onClick={() =>
						void overlay.sendCommand({
							type: "bubble.show",
							id: `bubble-${Date.now()}`,
							target: { x: 0.5, y: 0.24 },
							message: "This is a simulated AI guidance message.",
							placement: "bottom",
							ttlMs: 5000,
						})
					}
				>
					Show chat bubble
				</button>
				<button
					className={buttonClass}
					type="button"
					disabled={disabled}
					onClick={() =>
						void overlay.sendCommand({
							type: "highlight.show",
							id: `highlight-${Date.now()}`,
							rect: { x: 0.58, y: 0.6, width: 0.28, height: 0.22 },
							message: "Focus here",
							ttlMs: 5000,
						})
					}
				>
					Highlight area
				</button>
				<button
					className="min-h-9 rounded-lg bg-emerald-950 px-3 text-left text-[11px] font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-45"
					type="button"
					disabled={disabled}
					onClick={() => overlay.runSequence(createGuidedOverlayDemo())}
				>
					{overlay.isRunningSequence ? "Demo running..." : "Run full demo"}
				</button>
			</div>

			<button
				className="mt-2 min-h-9 w-full rounded-lg bg-slate-100 px-3 text-[11px] font-semibold hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
				type="button"
				disabled={disabled}
				onClick={() => void overlay.clear()}
			>
				Clear desktop overlay
			</button>

			{disabled ? (
				<p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-[10px] leading-4 text-amber-800">
					Run <code className="font-bold">pnpm desktop:dev</code> to enable the real always-on-top overlay.
				</p>
			) : (
				<p className="mt-3 text-[10px] leading-4 text-slate-500">
					The overlay is click-through. Share your entire screen to include it in the live preview.
				</p>
			)}
		</section>
	);
}
