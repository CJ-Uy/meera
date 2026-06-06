import type { RefObject } from "react";
import { MEDIA_STATUS_COPY, type MediaState } from "@/lib/media-types";

type PermissionStatusProps = {
	screenState: MediaState;
	micState: MediaState;
	micMeterRef: RefObject<HTMLDivElement | null>;
};

export function PermissionStatus({ screenState, micState, micMeterRef }: PermissionStatusProps) {
	return (
		<aside className="self-start rounded-xl border border-slate-200 bg-white p-4">
			<h3 className="mb-3 text-sm font-semibold">Permission status</h3>
			<div className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-slate-200 py-3 text-xs">
				<span className="text-slate-500">Screen sharing</span>
				<strong className="text-[10px]">{MEDIA_STATUS_COPY[screenState]}</strong>
			</div>
			<div className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-slate-200 py-3 text-xs">
				<span className="text-slate-500">Microphone</span>
				<strong className="text-[10px]">{MEDIA_STATUS_COPY[micState]}</strong>
				<div className="col-span-2 mt-1">
					<div className="mb-1.5 flex items-center justify-between text-[9px] text-slate-400">
						<span>Input level</span>
						<span>Quiet → Loud</span>
					</div>
					<div
						ref={micMeterRef}
						className={`relative h-3.5 w-full overflow-hidden rounded-full bg-slate-100 [--level:0] [--peak:0] ${
							micState === "active" ? "opacity-100" : "opacity-45"
						}`}
						role="meter"
						aria-label="Microphone input level"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={0}
					>
						<div className="absolute inset-0 origin-left scale-x-[var(--level)] bg-gradient-to-r from-emerald-500 via-lime-400 to-amber-400 will-change-transform" />
						<div className="absolute inset-y-0 left-[calc(var(--peak)*100%)] w-px bg-slate-700/70 will-change-[left]" />
						<div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_calc(10%_-_1px),white_calc(10%_-_1px),white_10%)] opacity-70" />
					</div>
				</div>
			</div>
			<p className="mt-3 border-t border-slate-200 pt-3 text-[10px] leading-4 text-slate-500">
				The floating helper uses Document Picture-in-Picture where supported. Your browser also shows its own sharing
				indicator.
			</p>
		</aside>
	);
}
