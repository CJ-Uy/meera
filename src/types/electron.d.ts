import type { OverlayCommand } from "@/features/overlay/overlay-protocol";

export type DesktopOverlayStatus = {
	available: true;
	displays: Array<{
		id: number;
		label: string;
		isPrimary: boolean;
		bounds: { x: number; y: number; width: number; height: number };
		scaleFactor: number;
	}>;
};

export type DesktopOverlayBridge = {
	isDesktop: true;
	getStatus: () => Promise<DesktopOverlayStatus>;
	sendCommand: (command: OverlayCommand) => Promise<{ ok: true }>;
	clear: () => Promise<{ ok: true }>;
	onCommand: (callback: (command: OverlayCommand) => void) => () => void;
	ready: (displayId: number) => void;
	reportApplied: (commandType: OverlayCommand["type"]) => void;
};

declare global {
	interface Window {
		meeraOverlay?: DesktopOverlayBridge;
	}
}

export {};
