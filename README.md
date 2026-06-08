# Meera Support Prototype

This prototype currently includes:

- Screen sharing with a live preview
- Microphone access with a responsive input meter
- An Electron desktop mode with transparent, click-through overlays
- Reusable overlay commands for cursors, arrows, highlights, and chat bubbles
- A simulator and AI assistant that exercise the same desktop overlay API

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
2. Click the Meera logo button floating at the bottom-right of the desktop to open the AI chat panel.
3. Ask `What can you help me with?` to confirm Ollama text chat responds.
4. Upload an image in the chat panel, then ask `Describe this image.`
5. Ask `Analyze my screen and point at the most important control.`
6. Confirm the chat says it attached a fresh screen frame and the model response uses `qwen3-vl:8b`.
7. In Electron, ask `Show every overlay type so I can test them.` and confirm the cursor, arrow, highlight, and chat bubble appear.
8. Open the support demo at `/demo`, then find **Desktop overlay simulator**.
9. Click **Move cursor** and confirm the Meera cursor appears over the other app.
10. Test **Cursor tour**, **Show arrow**, **Show chat bubble**, **Highlight area**, and **Run full demo**.
11. Confirm the overlay does not block clicks on the app underneath it.
12. Click **Clear desktop overlay** and confirm the overlay disappears.
13. Click **Stop sharing** and confirm the preview clears.
14. Click **Use microphone**, speak, confirm the input meter responds, then click **Mute microphone**.

For a production-style local run, use:

```powershell
pnpm desktop:start
```

Inside Meera, use the **Desktop overlay simulator** to move the cursor, display arrows and bubbles, highlight an area, or run the complete demonstration.

The transparent overlay is always on top and click-through, so it will not block the application underneath it. Share the entire screen, rather than one window, if you want the overlay to appear in the live screen-share preview.

### Ollama AI Assistant

The Ollama assistant runs from Electron's dedicated always-on-top assistant window. Browser-only Next.js pages do not mount a second in-app assistant.

- Text-only requests use `qwen3.5:9b`.
- Requests with an uploaded image or captured desktop frame use `qwen3-vl:8b`.
- In Electron, the assistant opens from a Meera logo button in its own always-on-top desktop overlay window.
- In Electron, Meera can automatically attach a fresh desktop screen frame for visual or overlay prompts.
- Ollama calls stay behind the server-side `/api/ai/chat` route.
- AI overlay tool calls are converted into the same validated overlay commands used by the simulator.
- If a model writes coordinate-style overlay instructions instead of native tool calls, Meera recovers those guarded overlay requests into validated overlay commands.

See [docs/OLLAMA.md](docs/OLLAMA.md) for setup, test prompts, architecture, and extension guidance.

### Overlay API

The AI assistant and simulator use the same typed command API:

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

The browser-only support demo remains available at `http://localhost:3000/demo` after running `pnpm dev`, and the existing OpenNext Cloudflare scripts remain unchanged. Desktop-wide overlays and the desktop assistant window are disabled in browser-only mode.
