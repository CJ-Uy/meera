import { contextBridge, ipcRenderer } from "electron";
import type { OverlayCommand } from "../src/features/overlay/overlay-protocol";

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

contextBridge.exposeInMainWorld("meeraOverlay", api);
