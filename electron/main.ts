import path from "node:path";
import { app, BrowserWindow, desktopCapturer, ipcMain, screen, session, shell } from "electron";
import type { Display } from "electron";
import { isOverlayCommand, type OverlayCommand, type OverlayDisplayTarget } from "../src/features/overlay/overlay-protocol";

const appUrl = process.env.MEERA_APP_URL ?? process.env.MEERA_DEV_SERVER_URL ?? "http://localhost:3000";
const isSmokeTest = process.env.MEERA_SMOKE_TEST === "1";
const preloadPath = path.join(__dirname, "preload.cjs");
const overlayWindows = new Map<number, BrowserWindow>();
const readyOverlayDisplays = new Set<number>();
const smokeAppliedEvents: string[] = [];
let mainWindow: BrowserWindow | null = null;
let smokeStarted = false;

function isTrustedUrl(url: string) {
	try {
		return new URL(url).origin === new URL(appUrl).origin;
	} catch {
		return false;
	}
}

function isTrustedSender(sender: Electron.WebContents) {
	return sender === mainWindow?.webContents;
}

function restrictNavigation(browserWindow: BrowserWindow) {
	browserWindow.webContents.setWindowOpenHandler(({ url }) => {
		if (isTrustedUrl(url)) return { action: "allow" };
		void shell.openExternal(url);
		return { action: "deny" };
	});
	browserWindow.webContents.on("will-navigate", (event, url) => {
		if (!isTrustedUrl(url)) event.preventDefault();
	});
}

function matchesDisplay(target: OverlayDisplayTarget | undefined, display: Display) {
	if (target === "all") return true;
	if (typeof target === "number") return target === display.id;
	return display.id === screen.getPrimaryDisplay().id;
}

function broadcastOverlayCommand(command: OverlayCommand) {
	for (const display of screen.getAllDisplays()) {
		if (!matchesDisplay(command.displayId, display)) continue;
		const overlayWindow = overlayWindows.get(display.id);
		if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.webContents.send("overlay:command", command);
	}
}

function createOverlayWindow(display: Display) {
	const { x, y, width, height } = display.bounds;
	const overlayWindow = new BrowserWindow({
		x,
		y,
		width,
		height,
		show: false,
		frame: false,
		transparent: true,
		backgroundColor: "#00000000",
		alwaysOnTop: true,
		skipTaskbar: true,
		focusable: false,
		resizable: false,
		movable: false,
		fullscreenable: false,
		hasShadow: false,
		enableLargerThanScreen: true,
		webPreferences: {
			preload: preloadPath,
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			backgroundThrottling: false,
		},
	});

	overlayWindow.setAlwaysOnTop(true, "screen-saver");
	overlayWindow.setIgnoreMouseEvents(true, { forward: true });
	overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
	restrictNavigation(overlayWindow);
	void overlayWindow.loadURL(`${appUrl}/overlay?displayId=${display.id}`);
	overlayWindows.set(display.id, overlayWindow);
}

function recreateOverlayWindows() {
	readyOverlayDisplays.clear();
	for (const overlayWindow of overlayWindows.values()) overlayWindow.destroy();
	overlayWindows.clear();
	for (const display of screen.getAllDisplays()) createOverlayWindow(display);
}

function createMainWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 900,
		show: !isSmokeTest,
		backgroundColor: "#f7f7f5",
		title: "Meera Support",
		webPreferences: {
			preload: preloadPath,
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	restrictNavigation(mainWindow);
	void mainWindow.loadURL(appUrl);
	mainWindow.on("closed", () => {
		mainWindow = null;
		if (!isSmokeTest) app.quit();
	});
}

function configureMediaCapture() {
	session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
		callback(isTrustedUrl(webContents.getURL()) && (permission === "media" || permission === "display-capture"));
	});

	session.defaultSession.setDisplayMediaRequestHandler(
		async (_request, callback) => {
			try {
				const sources = await desktopCapturer.getSources({
					types: ["screen", "window"],
					thumbnailSize: { width: 0, height: 0 },
				});
				const primaryDisplayId = screen.getPrimaryDisplay().id.toString();
				const preferredSource = sources.find((source) => source.display_id === primaryDisplayId) ?? sources[0];
				callback(preferredSource ? { video: preferredSource } : {});
			} catch {
				callback({});
			}
		},
		{ useSystemPicker: true },
	);
}

function configureIpc() {
	ipcMain.handle("overlay:get-status", (event) => {
		if (!isTrustedSender(event.sender)) throw new Error("Overlay status is only available to the main app.");
		return {
			available: true,
			displays: screen.getAllDisplays().map((display) => ({
				id: display.id,
				label: display.label || `Display ${display.id}`,
				isPrimary: display.id === screen.getPrimaryDisplay().id,
				bounds: display.bounds,
				scaleFactor: display.scaleFactor,
			})),
		};
	});

	ipcMain.handle("overlay:command", (event, command: unknown) => {
		if (!isTrustedSender(event.sender)) throw new Error("Overlay commands are only accepted from the main app.");
		if (!isOverlayCommand(command)) throw new Error("Invalid overlay command.");
		broadcastOverlayCommand(command);
		return { ok: true };
	});

	ipcMain.on("overlay:ready", (event, displayId: number) => {
		const overlayWindow = overlayWindows.get(displayId);
		if (!overlayWindow || overlayWindow.webContents !== event.sender) return;
		readyOverlayDisplays.add(displayId);
		overlayWindow.showInactive();
		void startSmokeTestIfReady();
	});

	ipcMain.on("overlay:applied", (event, commandType: string) => {
		if (![...overlayWindows.values()].some((overlayWindow) => overlayWindow.webContents === event.sender)) return;
		smokeAppliedEvents.push(commandType);
	});
}

async function startSmokeTestIfReady() {
	if (!isSmokeTest || smokeStarted || readyOverlayDisplays.size !== overlayWindows.size) return;
	smokeStarted = true;
	const displays = screen.getAllDisplays();
	const boundsTolerance = process.platform === "win32" ? 0 : 2;
	const windowsAreConfigured = displays.every((display) => {
		const overlayWindow = overlayWindows.get(display.id);
		if (!overlayWindow) return false;
		const bounds = overlayWindow.getBounds();
		const boundsMatch = (windowValue: number, displayValue: number) =>
			Math.abs(windowValue - displayValue) <= boundsTolerance;
		return (
			overlayWindow.isAlwaysOnTop() &&
			(process.platform !== "win32" || !overlayWindow.isFocusable()) &&
			boundsMatch(bounds.x, display.bounds.x) &&
			boundsMatch(bounds.y, display.bounds.y) &&
			boundsMatch(bounds.width, display.bounds.width) &&
			boundsMatch(bounds.height, display.bounds.height)
		);
	});
	if (!windowsAreConfigured) {
		const diagnostics = displays.map((display) => {
			const overlayWindow = overlayWindows.get(display.id);
			return {
				displayId: display.id,
				displayBounds: display.bounds,
				windowBounds: overlayWindow?.getBounds(),
				alwaysOnTop: overlayWindow?.isAlwaysOnTop(),
				focusable: overlayWindow?.isFocusable(),
			};
		});
		console.error("MEERA_DESKTOP_SMOKE_FAILED overlay windows are not configured correctly", diagnostics);
		app.exit(1);
		return;
	}

	const captureSources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 0, height: 0 } });
	if (captureSources.length === 0) {
		console.error("MEERA_DESKTOP_SMOKE_FAILED no screen capture sources are available");
		app.exit(1);
		return;
	}

	const commands: OverlayCommand[] = [
		{ type: "cursor.move", displayId: "all", target: { x: 0.25, y: 0.25 }, animationMs: 100 },
		{ type: "arrow.show", displayId: "all", id: "smoke-arrow", target: { x: 0.7, y: 0.3 }, ttlMs: 500 },
		{
			type: "highlight.show",
			displayId: "all",
			id: "smoke-highlight",
			rect: { x: 0.55, y: 0.6, width: 0.25, height: 0.2 },
			ttlMs: 500,
		},
		{
			type: "bubble.show",
			displayId: "all",
			id: "smoke-bubble",
			target: { x: 0.5, y: 0.5 },
			message: "Desktop overlay smoke test",
			ttlMs: 500,
		},
	];

	commands.forEach((command, index) => setTimeout(() => broadcastOverlayCommand(command), index * 100));
	const expectedAppliedEvents = commands.length * overlayWindows.size;
	const deadline = Date.now() + 8_000;
	const verify = setInterval(() => {
		if (smokeAppliedEvents.length >= expectedAppliedEvents) {
			clearInterval(verify);
			console.log(`MEERA_DESKTOP_SMOKE_OK displays=${overlayWindows.size} applied=${smokeAppliedEvents.length}`);
			app.exit(0);
		} else if (Date.now() > deadline) {
			clearInterval(verify);
			console.error(`MEERA_DESKTOP_SMOKE_FAILED expected=${expectedAppliedEvents} applied=${smokeAppliedEvents.length}`);
			app.exit(1);
		}
	}, 100);
}

app.whenReady().then(() => {
	if (process.platform === "win32") app.setAppUserModelId("com.meera.support");
	configureIpc();
	configureMediaCapture();
	createMainWindow();
	recreateOverlayWindows();
	screen.on("display-added", recreateOverlayWindows);
	screen.on("display-removed", recreateOverlayWindows);
	screen.on("display-metrics-changed", recreateOverlayWindows);
});

app.on("window-all-closed", () => app.quit());
