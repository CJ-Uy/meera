"use client";

import type { CSSProperties } from "react";
import type { OverlayAnnotation, OverlayState } from "@/features/overlay/overlay-reducer";
import { useOverlayRenderer } from "@/features/overlay/use-overlay-renderer";

const placementClasses = {
	top: "-translate-x-1/2 -translate-y-[calc(100%+18px)]",
	right: "translate-x-[18px] -translate-y-1/2",
	bottom: "-translate-x-1/2 translate-y-[18px]",
	left: "-translate-x-[calc(100%+18px)] -translate-y-1/2",
};

function positionStyle(x: number, y: number): CSSProperties {
	return { left: `${x * 100}%`, top: `${y * 100}%` };
}

function Cursor({ cursor }: { cursor: OverlayState["cursor"] }) {
	if (!cursor.visible) return null;

	return (
		<div
			className="absolute z-40 transition-[left,top] ease-in-out will-change-[left,top]"
			style={{ ...positionStyle(cursor.target.x, cursor.target.y), transitionDuration: `${cursor.animationMs ?? 500}ms` }}
		>
			<svg className="h-11 w-11 drop-shadow-lg" viewBox="0 0 48 48" aria-hidden="true">
				<path d="M8 5v32l9-8 7 14 7-4-7-13h13L8 5Z" fill="#fff" stroke="#0f172a" strokeWidth="2.5" />
			</svg>
			{cursor.label ? (
				<span className="absolute top-8 left-8 rounded-full bg-emerald-950 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-white shadow-lg">
					{cursor.label}
				</span>
			) : null}
		</div>
	);
}

function Arrow({ annotation }: { annotation: Extract<OverlayAnnotation, { type: "arrow.show" }> }) {
	const direction = annotation.direction ?? "left";
	const rotation = { left: "rotate-0", top: "rotate-90", right: "rotate-180", bottom: "-rotate-90" }[direction];

	return (
		<div className="absolute z-30" style={positionStyle(annotation.target.x, annotation.target.y)}>
			<span className="absolute size-5 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-orange-400/60" />
			<span className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-orange-500 shadow-lg" />
			<div className={`absolute top-1/2 right-2 flex -translate-y-1/2 items-center ${rotation}`}>
				<div className="h-1 w-24 rounded-full bg-orange-500 shadow-md" />
				<div className="h-0 w-0 border-y-[8px] border-l-[13px] border-y-transparent border-l-orange-500" />
			</div>
			{annotation.message ? (
				<span className="absolute top-5 left-4 rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold whitespace-nowrap text-white shadow-xl">
					{annotation.message}
				</span>
			) : null}
		</div>
	);
}

function Bubble({ annotation }: { annotation: Extract<OverlayAnnotation, { type: "bubble.show" }> }) {
	const placement = annotation.placement ?? "top";
	return (
		<div
			className={`absolute z-30 max-w-xs rounded-xl border border-emerald-700 bg-emerald-950 px-4 py-3 text-sm leading-5 font-semibold text-white shadow-2xl ${placementClasses[placement]}`}
			style={positionStyle(annotation.target.x, annotation.target.y)}
		>
			<p className="m-0">{annotation.message}</p>
		</div>
	);
}

function Highlight({ annotation }: { annotation: Extract<OverlayAnnotation, { type: "highlight.show" }> }) {
	return (
		<div
			className="absolute z-20 animate-pulse rounded-xl border-4 border-amber-400 bg-amber-300/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.12)]"
			style={{
				left: `${annotation.rect.x * 100}%`,
				top: `${annotation.rect.y * 100}%`,
				width: `${annotation.rect.width * 100}%`,
				height: `${annotation.rect.height * 100}%`,
			}}
		>
			{annotation.message ? (
				<span className="absolute -top-9 left-0 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold whitespace-nowrap text-slate-950 shadow-lg">
					{annotation.message}
				</span>
			) : null}
		</div>
	);
}

export function DesktopOverlay() {
	const state = useOverlayRenderer();

	return (
		<main className="pointer-events-none fixed inset-0 overflow-hidden bg-transparent select-none">
			{Object.values(state.annotations).map((annotation) => {
				if (annotation.type === "arrow.show") return <Arrow key={annotation.id} annotation={annotation} />;
				if (annotation.type === "bubble.show") return <Bubble key={annotation.id} annotation={annotation} />;
				return <Highlight key={annotation.id} annotation={annotation} />;
			})}
			<Cursor cursor={state.cursor} />
		</main>
	);
}
