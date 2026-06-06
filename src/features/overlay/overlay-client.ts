import type { OverlayCommand } from "@/features/overlay/overlay-protocol";

export function isDesktopOverlayAvailable() {
	return typeof window !== "undefined" && Boolean(window.meeraOverlay);
}

export async function sendOverlayCommand(command: OverlayCommand) {
	if (!isDesktopOverlayAvailable() || !window.meeraOverlay) {
		throw new Error("Desktop overlay is unavailable. Run Meera through Electron.");
	}
	return window.meeraOverlay.sendCommand(command);
}

export async function clearDesktopOverlay() {
	if (!isDesktopOverlayAvailable() || !window.meeraOverlay) {
		throw new Error("Desktop overlay is unavailable. Run Meera through Electron.");
	}
	return window.meeraOverlay.clear();
}
