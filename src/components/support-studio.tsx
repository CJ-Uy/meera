"use client";

import { LockIcon } from "@/components/media-icons";
import { MediaControls } from "@/components/media-controls";
import { PermissionStatus } from "@/components/permission-status";
import { ScreenPreview } from "@/components/screen-preview";
import { SharingBadge } from "@/components/sharing-badge";
import { AiAssistant } from "@/features/ai/ai-assistant";
import { OverlaySimulator } from "@/features/overlay/overlay-simulator";
import { useMediaSession } from "@/hooks/use-media-session";

export function SupportStudio() {
	const session = useMediaSession();
	const isSharing = session.screenState === "active";
	const isMicLive = session.micState === "active";

	return (
		<main className="mx-auto min-h-screen w-[min(1180px,calc(100%_-_2.5rem))] pb-16">
			<header className="flex items-center justify-between border-b border-slate-200 py-5">
				<a className="text-lg font-bold text-slate-900 no-underline" href="#" aria-label="Meera home">
					meera
				</a>
				<div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
					<span className="size-3.5">
						<LockIcon />
					</span>
					<span className="hidden sm:inline">Private support session</span>
				</div>
			</header>

			<section className="max-w-3xl pt-14 pb-7">
				<p className="mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Support session prototype</p>
				<h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
					Screen sharing and microphone access
				</h1>
				<p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
					Start either permission independently. Your browser remains the source of truth for what is active.
				</p>
			</section>

			<MediaControls
				screenState={session.screenState}
				micState={session.micState}
				onToggleScreen={isSharing ? session.stopScreenShare : session.startScreenShare}
				onToggleMic={session.toggleMicrophone}
			/>

			<p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
				<span className="size-3.5">
					<LockIcon />
				</span>
				Nothing starts until you grant browser permission. Stop either permission at any time.
			</p>

			<section className="mt-12">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-lg font-semibold">Live preview</h2>
					<div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
						<span
							className={`size-2 rounded-full ${isSharing || isMicLive ? "bg-emerald-500 ring-4 ring-emerald-500/10" : "bg-slate-300"}`}
						/>
						{isSharing || isMicLive ? "Session active" : "Waiting to begin"}
					</div>
				</div>

				<div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
					<ScreenPreview
						isSharing={isSharing}
						isCompanionOpen={session.isCompanionOpen}
						supportsCompanion={session.supportsCompanion}
						previewRef={session.previewRef}
						onStartSharing={session.startScreenShare}
						onStopSharing={session.stopScreenShare}
						onOpenCompanion={session.openCompanion}
					/>
					<div className="grid content-start gap-3">
						<PermissionStatus
							screenState={session.screenState}
							micState={session.micState}
							micMeterRef={session.micMeterRef}
						/>
						<OverlaySimulator />
					</div>
				</div>
			</section>

			<AiAssistant isSharing={isSharing} previewRef={session.previewRef} />

			{session.mediaError ? (
				<div
					className="fixed top-4 left-1/2 z-60 flex max-w-[calc(100%_-_2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 pl-3 text-[11px] shadow-xl"
					role="alert"
				>
					<span>{session.mediaError}</span>
					<button
						type="button"
						className="min-h-7 rounded-md bg-slate-100 px-2 text-[9px] font-bold hover:bg-slate-200"
						onClick={session.clearMediaError}
					>
						Close
					</button>
				</div>
			) : null}

			{isSharing ? (
				<SharingBadge
					supportsCompanion={session.supportsCompanion}
					onOpenCompanion={session.openCompanion}
					onStopSharing={session.stopScreenShare}
				/>
			) : null}
		</main>
	);
}
