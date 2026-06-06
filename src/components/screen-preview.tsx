import type { RefObject } from "react";
import { FloatIcon, ScreenIcon } from "@/components/media-icons";

type ScreenPreviewProps = {
	isSharing: boolean;
	isCompanionOpen: boolean;
	supportsCompanion: boolean;
	previewRef: RefObject<HTMLVideoElement | null>;
	onStartSharing: () => void;
	onStopSharing: () => void;
	onOpenCompanion: () => void;
};

function StatusDot({ live }: { live: boolean }) {
	return <span className={`size-2 rounded-full ${live ? "bg-emerald-500 ring-4 ring-emerald-500/10" : "bg-slate-300"}`} />;
}

export function ScreenPreview({
	isSharing,
	isCompanionOpen,
	supportsCompanion,
	previewRef,
	onStartSharing,
	onStopSharing,
	onOpenCompanion,
}: ScreenPreviewProps) {
	return (
		<div className="relative min-h-[500px] overflow-hidden rounded-xl border border-slate-200 bg-white">
			<div className="flex min-h-14 items-center justify-between border-b border-slate-200 px-4">
				<div className="flex items-center gap-2 text-xs font-semibold">
					<StatusDot live={isSharing} />
					{isSharing ? "Sharing screen" : "No screen shared"}
				</div>
				{isSharing ? (
					<div className="flex gap-2">
						{supportsCompanion ? (
							<button
								className="flex min-h-8 items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 text-[10px] font-semibold hover:bg-slate-200"
								type="button"
								onClick={onOpenCompanion}
							>
								<span className="size-3.5">
									<FloatIcon />
								</span>
								{isCompanionOpen ? "Reopen helper" : "Open floating helper"}
							</button>
						) : null}
						<button
							className="min-h-8 rounded-lg bg-slate-100 px-2.5 text-[10px] font-semibold hover:bg-slate-200"
							type="button"
							onClick={onStopSharing}
						>
							Stop sharing
						</button>
					</div>
				) : null}
			</div>

			<video
				ref={previewRef}
				className={`${isSharing ? "block" : "hidden"} h-[446px] w-full bg-slate-950 object-contain`}
				autoPlay
				muted
				playsInline
			/>

			{isSharing ? null : (
				<div className="absolute inset-x-0 bottom-0 top-14 flex flex-col items-center justify-center p-6 text-center">
					<span className="mb-3 size-9 text-slate-400">
						<ScreenIcon />
					</span>
					<h3 className="text-sm font-semibold">No screen is being shared</h3>
					<p className="mt-2 mb-4 text-xs text-slate-500">Choose a tab, window, or full display to preview it here.</p>
					<button
						className="min-h-9 rounded-lg bg-emerald-950 px-3.5 text-[11px] font-semibold text-white hover:bg-emerald-900"
						type="button"
						onClick={onStartSharing}
					>
						Choose what to share
					</button>
				</div>
			)}
		</div>
	);
}
