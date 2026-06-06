import type { MediaState } from "@/lib/media-types";

type DocumentPictureInPictureApi = {
	requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
};

export function getPictureInPictureApi() {
	return (
		window as typeof window & {
			documentPictureInPicture?: DocumentPictureInPictureApi;
		}
	).documentPictureInPicture;
}

function copyApplicationStyles(companionDocument: Document) {
	if (companionDocument.head.querySelector("[data-meera-styles]")) return;

	document.querySelectorAll('link[rel="stylesheet"], style').forEach((styleNode) => {
		companionDocument.head.appendChild(styleNode.cloneNode(true));
	});

	const marker = companionDocument.createElement("meta");
	marker.dataset.meeraStyles = "true";
	companionDocument.head.appendChild(marker);
}

export function paintCompanion(
	companionWindow: Window,
	micState: MediaState,
	onStopSharing: () => void,
	onToggleMic: () => void,
) {
	const companionDocument = companionWindow.document;
	copyApplicationStyles(companionDocument);
	companionDocument.title = "Meera sharing companion";
	companionDocument.body.className = "m-0 grid min-h-screen place-items-center bg-[#102d28] text-white";
	companionDocument.body.innerHTML = `
		<div class="w-full p-5">
			<div class="mb-5 flex items-center gap-3">
				<span class="h-3 w-3 rounded-full bg-emerald-400 ring-8 ring-emerald-400/10"></span>
				<div>
					<p class="m-0 text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-100/70">Meera support</p>
					<h1 class="m-0 mt-1 text-base font-semibold">You are sharing</h1>
				</div>
			</div>
			<div class="grid grid-cols-[1fr_auto] gap-2">
				<button id="mic" type="button" class="min-h-10 rounded-lg border-0 bg-white/10 px-3 text-xs font-semibold text-white">
					${micState === "active" ? "Mute microphone" : micState === "requesting" ? "Connecting mic..." : "Turn on microphone"}
				</button>
				<button id="stop" type="button" class="min-h-10 rounded-lg border-0 bg-red-500 px-4 text-xs font-semibold text-white">Stop</button>
			</div>
		</div>
	`;
	companionDocument.querySelector("#stop")?.addEventListener("click", onStopSharing);
	companionDocument.querySelector("#mic")?.addEventListener("click", onToggleMic);
}
