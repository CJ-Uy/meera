import { MEDIA_STATUS_COPY, type MediaState } from "@/lib/media-types";
import { MicIcon, ScreenIcon } from "@/components/media-icons";

type MediaControlsProps = {
	screenState: MediaState;
	micState: MediaState;
	onToggleScreen: () => void;
	onToggleMic: () => void;
};

export function MediaControls({ screenState, micState, onToggleScreen, onToggleMic }: MediaControlsProps) {
	const isSharing = screenState === "active";
	const isMicLive = micState === "active";
	const buttonClass =
		"flex min-h-18 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 disabled:cursor-wait disabled:opacity-60";
	const activeButtonClass = "border-emerald-300 bg-emerald-50";

	return (
		<section className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Media permissions">
			<button
				className={`${buttonClass} ${isSharing ? activeButtonClass : ""}`}
				type="button"
				onClick={onToggleScreen}
				disabled={screenState === "requesting"}
			>
				<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-950 text-white">
					<span className="size-5">
						<ScreenIcon />
					</span>
				</span>
				<span>
					<strong className="block text-sm">
						{isSharing ? "Stop sharing" : screenState === "requesting" ? "Choose a screen..." : "Share your screen"}
					</strong>
					<small className="mt-0.5 block text-[10px] text-slate-500">{MEDIA_STATUS_COPY[screenState]}</small>
				</span>
			</button>

			<button
				className={`${buttonClass} ${isMicLive ? activeButtonClass : ""}`}
				type="button"
				onClick={onToggleMic}
				disabled={micState === "requesting"}
			>
				<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-950 text-white">
					<span className="size-5">
						<MicIcon muted={!isMicLive} />
					</span>
				</span>
				<span>
					<strong className="block text-sm">
						{isMicLive ? "Mute microphone" : micState === "requesting" ? "Connecting..." : "Use microphone"}
					</strong>
					<small className="mt-0.5 block text-[10px] text-slate-500">{MEDIA_STATUS_COPY[micState]}</small>
				</span>
			</button>
		</section>
	);
}
