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

Inside Meera, use the **Desktop overlay simulator** to move the cursor, display arrows and bubbles, highlight an area, or run the complete demonstration.

The transparent overlay is always on top and click-through, so it will not block the application underneath it. Share the entire screen, rather than one window, if you want the overlay to appear in the live screen-share preview.

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
