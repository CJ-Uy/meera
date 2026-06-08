import type { OverlayCommand } from "@/features/overlay/overlay-protocol";
import type { AiScreenFrameMetadata } from "@/features/ai/ai-types";

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

export type DesktopAssistantScreenFrame = {
	name: string;
	mimeType: "image/jpeg";
	dataUrl: string;
	width: number;
	height: number;
	screen: AiScreenFrameMetadata;
};

export type DesktopAssistantBridge = {
	isDesktop: true;
	setOpen: (open: boolean) => Promise<{ ok: true }>;
	captureScreenFrame: () => Promise<DesktopAssistantScreenFrame>;
};

declare global {
	interface Window {
		meeraOverlay?: DesktopOverlayBridge;
		meeraAssistant?: DesktopAssistantBridge;
	}
}

export {};
