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
				<div ref={micMeterRef} className="col-span-2 flex h-5 items-end gap-[3px] [--level:0]" aria-hidden="true">
					<span className="w-[3px] rounded-full bg-emerald-500 h-[calc(3px+var(--level)*5px)]" />
					<span className="w-[3px] rounded-full bg-emerald-500 h-[calc(5px+var(--level)*12px)]" />
					<span className="w-[3px] rounded-full bg-emerald-500 h-[calc(4px+var(--level)*8px)]" />
					<span className="w-[3px] rounded-full bg-emerald-500 h-[calc(3px+var(--level)*5px)]" />
				</div>
			</div>
			<p className="mt-3 border-t border-slate-200 pt-3 text-[10px] leading-4 text-slate-500">
				The floating helper uses Document Picture-in-Picture where supported. Your browser also shows its own sharing
				indicator.
			</p>
		</aside>
	);
}
