import { contextBridge, ipcRenderer } from "electron";
import type { AiScreenFrameMetadata } from "../src/features/ai/ai-types";
import type { OverlayCommand } from "../src/features/overlay/overlay-protocol";

type AssistantScreenFrame = {
	name: string;
	mimeType: "image/jpeg";
	dataUrl: string;
	width: number;
	height: number;
	screen: AiScreenFrameMetadata;
};

const api = {
	isDesktop: true,
	getStatus: () => ipcRenderer.invoke("overlay:get-status"),
	sendCommand: (command: OverlayCommand) => ipcRenderer.invoke("overlay:command", command),
	clear: () => ipcRenderer.invoke("overlay:command", { type: "overlay.clear" }),
	onCommand: (callback: (command: OverlayCommand) => void) => {
		const listener = (_event: Electron.IpcRendererEvent, command: OverlayCommand) => callback(command);
		ipcRenderer.on("overlay:command", listener);
		return () => ipcRenderer.removeListener("overlay:command", listener);
	},
	ready: (displayId: number) => ipcRenderer.send("overlay:ready", displayId),
	reportApplied: (commandType: OverlayCommand["type"]) => ipcRenderer.send("overlay:applied", commandType),
};

const assistantApi = {
	isDesktop: true,
	setOpen: (open: boolean) => ipcRenderer.invoke("assistant:set-open", open),
	captureScreenFrame: () => ipcRenderer.invoke("assistant:capture-screen-frame") as Promise<AssistantScreenFrame>,
};

contextBridge.exposeInMainWorld("meeraOverlay", api);
contextBridge.exposeInMainWorld("meeraAssistant", assistantApi);
