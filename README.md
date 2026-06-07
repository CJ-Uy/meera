# Meera Support Prototype

This prototype currently includes:

- Screen sharing with a live preview
- Microphone access with a responsive input meter
- An Electron desktop mode with transparent, click-through overlays
- Reusable overlay commands for cursors, arrows, highlights, and chat bubbles
- A simulator that exercises the same API a future AI agent will call

## Desktop Overlay

The desktop overlay requires Electron because browser-only Next.js pages cannot draw over unrelated applications.

Start the complete desktop app:

```bash
pnpm desktop:dev
```

### Windows Setup

Windows is the primary target for the desktop overlay. After cloning or moving the repository onto Windows, install fresh platform-specific dependencies instead of copying WSL `node_modules`:

```powershell
corepack enable
pnpm install
pnpm desktop:smoke
pnpm desktop:dev
```

The scripts avoid POSIX-only environment syntax and run through Node-based launchers so they work from PowerShell and Windows Terminal. The Windows overlay is frameless, transparent, always on top, multi-monitor aware, and click-through.

The repository includes `pnpm-workspace.yaml` to approve the native build scripts required by Electron/Next/Cloudflare dependencies on pnpm 11 (`esbuild`, `sharp`, `unrs-resolver`, and `workerd`). The desktop smoke script also launches `pnpm` through `cmd.exe` on Windows and tears down the spawned process tree, which avoids `.cmd` shim launch failures and stale dev servers on port `3010`.

WSL2 can run the automated desktop smoke test, but WSLg sometimes reports native window sizing and focus behavior differently. Use the normal Windows setup above for the authoritative visual test.

### How To Open And Test It

For a quick automated check, run:

```powershell
pnpm desktop:smoke
```

To open the real desktop app, run:

```powershell
pnpm desktop:dev
```

That command starts the Next.js dev server and opens the Electron app. Keep the terminal open while testing. Press `Ctrl+C` in the terminal to stop it.

If Next.js says `Another next dev server is already running`, stop the PID it prints and run `pnpm desktop:dev` again:

```powershell
taskkill /PID 3296 /F
```

Replace `3296` with the PID shown in your terminal. This usually means a previous smoke test or desktop dev run was closed without stopping its dev server.

Once Meera opens:

1. Open another app beside or behind Meera, such as Settings, Notepad, or VS Code.
2. In Meera, find **Desktop overlay simulator**.
3. Click **Move cursor** and confirm the Meera cursor appears over the other app.
4. Test **Cursor tour**, **Show arrow**, **Show chat bubble**, **Highlight area**, and **Run full demo**.
5. Confirm the overlay does not block clicks on the app underneath it.
6. Click **Clear desktop overlay** and confirm the overlay disappears.
7. Click **Share your screen**, choose the entire display, and confirm the overlay appears inside the live preview.
8. Click **Stop sharing** and confirm the preview clears.
9. Click **Use microphone**, speak, confirm the input meter responds, then click **Mute microphone**.

For a production-style local run, use:

```powershell
pnpm desktop:start
```

Inside Meera, use the **Desktop overlay simulator** to move the cursor, display arrows and bubbles, highlight an area, or run the complete demonstration.

The transparent overlay is always on top and click-through, so it will not block the application underneath it. Share the entire screen, rather than one window, if you want the overlay to appear in the live screen-share preview.

### Ollama AI Assistant

The main page includes a basic Ollama chatbot for testing text, images, shared-screen frames, and AI-controlled desktop overlays.

- Text-only requests use `qwen3.5:9b`.
- Requests with an uploaded image or captured shared-screen frame use `qwen3-vl:8b`.
- Ollama calls stay behind the server-side `/api/ai/chat` route.
- AI overlay tool calls are converted into the same validated overlay commands used by the simulator.

See [docs/OLLAMA.md](docs/OLLAMA.md) for setup, test prompts, architecture, and extension guidance.

### Overlay API

The future AI agent can use the same typed command API:

```ts
await sendOverlayCommand({
	type: "bubble.show",
	id: "open-settings",
	target: { x: 0.72, y: 0.34 },
	message: "Open Network settings here.",
	placement: "left",
	ttlMs: 5000,
});
```

Coordinates are normalized from `0` to `1`, so commands work across different display resolutions.

## Verification

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
pnpm desktop:build
pnpm desktop:smoke
```

`desktop:smoke` launches the actual Electron overlay windows, sends all primary overlay command types, confirms the overlay renderer applied them, and then exits.

## Web And Cloudflare

The browser-only app remains available through `pnpm dev`, and the existing OpenNext Cloudflare scripts remain unchanged. Desktop-wide overlays are disabled in browser-only mode.
