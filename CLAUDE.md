# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Meera Is

Meera is a desktop AI support assistant (KPMG Academic Innovation Challenge entry; see [challenge-spec.md](challenge-spec.md)). The same Next.js app runs in **three targets**, and most architectural complexity exists to serve all three from one codebase:

1. **Browser** — the support demo at `/demo` (`pnpm dev`). Desktop-wide overlays and the assistant window are disabled here.
2. **Electron desktop** — Windows is the primary target. Adds transparent, always-on-top, click-through overlay windows that draw over *other* applications, plus a dedicated always-on-top assistant window.
3. **Cloudflare Workers** — production, built via OpenNext (`@opennextjs/cloudflare`).

## Commands

Package manager is **pnpm**. Build tooling is Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui.

```bash
pnpm dev                  # Next dev server (browser-only) at :3000
pnpm lint                 # eslint
pnpm typecheck            # tsc --noEmit
pnpm test                 # vitest run (all tests)
pnpm vitest run src/features/ai/ai-tools.test.ts   # single test file
pnpm build                # next build

pnpm desktop:dev          # build electron + run dev server + launch Electron (full desktop app)
pnpm desktop:smoke        # automated: launches real overlay windows, sends every overlay command, verifies, exits
pnpm desktop:start        # production-style local desktop run

pnpm db:generate          # drizzle-kit generate (after editing src/db/schema.ts)
pnpm db:migrate:local     # apply migrations to local D1
pnpm db:migrate:dev       # apply to remote dev D1
pnpm db:studio            # drizzle-kit studio

pnpm deploy:dev           # OpenNext build + deploy to Cloudflare (dev env)
pnpm deploy:prod          # deploy to production env
pnpm deploy:shared-api    # deploy the standalone shared-dev API worker
pnpm cf-typegen           # regenerate cloudflare-env.d.ts from wrangler bindings
```

Full verification suite (run before merging desktop-affecting changes): `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm desktop:build && pnpm desktop:smoke`.

If Next complains `Another next dev server is already running`, kill the printed PID — a prior smoke/desktop run left a dev server on `:3000` (or `:3010` for smoke).

## Architecture

### Runtime-keyed adapters (DB + storage)
The single most important pattern. Two env vars — `APP_ENV` (`local`/`shared`/`production`) and `STORAGE_MODE` (`local`/`api`/`r2-s3`/`binding`) — select concrete adapters at runtime. Never hardcode a backend; go through the factories:

- [src/db/index.ts](src/db/index.ts) → `getDatabaseAdapter()`: picks `d1` (prod / when a CF `DB` binding exists), `shared-api`, or `local-sqlite`. Adapters in [src/db/adapters/](src/db/adapters/). Schema is Drizzle in [src/db/schema.ts](src/db/schema.ts).
- [src/storage/index.ts](src/storage/index.ts) → `getStorageAdapter()`: picks `r2-binding`, `shared-api`, `r2-s3`, or `local-fs`. Adapters in [src/storage/adapters/](src/storage/adapters/).
- Env is parsed and validated with Zod in [src/server/env.ts](src/server/env.ts) (`getAppEnv()`). It enforces cross-field requirements (e.g. `SHARED_API_*` required when `APP_ENV=shared`).
- Cloudflare bindings (`DB`, `BUCKET`, `IMAGES`) are reached only through [src/server/cloudflare.ts](src/server/cloudflare.ts) (`getOptionalCloudflareEnv()`), which returns `undefined` outside the Workers runtime — that's how the same code runs locally.

### Shared dev API (standalone workers)
[cloudflare/shared-dev-api.ts](cloudflare/shared-dev-api.ts) and [cloudflare/admin-demo-api.ts](cloudflare/admin-demo-api.ts) are **separate** Cloudflare Workers (not the Next app) that expose D1/R2 over a Bearer-token HTTP API. They let developers without a Cloudflare account use shared backends via `APP_ENV=shared` / `STORAGE_MODE=api`. The `shared-api` DB/storage adapters are the client side of this. Deploy with `pnpm deploy:shared-api`. Configs: `wrangler.shared-dev-api.jsonc`, `wrangler.admin-demo.jsonc`.

### Desktop overlay system
- **Protocol**: [src/features/overlay/overlay-protocol.ts](src/features/overlay/overlay-protocol.ts) defines a typed command union (`cursor.move`, `arrow.show`, `highlight.show`, `bubble.show`, `overlay.remove`, `overlay.clear`). All coordinates are **normalized 0–1** so they're resolution-independent. `isOverlayCommand()` validates anything crossing the IPC boundary.
- **Bridge**: the browser/renderer calls `sendOverlayCommand()` in [src/features/overlay/overlay-client.ts](src/features/overlay/overlay-client.ts), which talks to `window.meeraOverlay` exposed by [electron/preload.ts](electron/preload.ts).
- **Renderer**: [electron/main.ts](electron/main.ts) owns one transparent click-through `BrowserWindow` per display (loading `/overlay`), the assistant window (`/assistant`), and screen capture via `desktopCapturer`. It re-validates every command and checks the sender is trusted.
- The `/demo` page's overlay **simulator** and the AI assistant both emit the *same* validated commands — keep that single path.

### AI (Groq only)
All provider calls stay server-side behind `POST` [src/app/api/ai/chat/route.ts](src/app/api/ai/chat/route.ts); the browser/renderer never sees credentials. [src/features/ai/ai-service.ts](src/features/ai/ai-service.ts) is a thin selector over [groq-client.ts](src/features/ai/groq-client.ts) (OpenAI-compatible Chat Completions). Text uses `llama-3.1-8b-instant`; any image/desktop-frame turn uses the multimodal `meta-llama/llama-4-scout-17b-16e-instruct`. The model returns overlay actions as **local function tool calls** ([ai-tools.ts](src/features/ai/ai-tools.ts)) which are validated then converted into overlay commands. **Visual grounding** ([visual-grounding.ts](src/features/ai/visual-grounding.ts)) runs a zoom-refine second pass — crop/upscale around the model's first guess and re-locate — because Scout is a weak single-shot grounder; disable with `NEXT_PUBLIC_MEERA_GROUNDING_REFINE=0`. See [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md). (`.env.example` lists Ollama vars, but the wired-up service is Groq-only.)

### App routes
`src/app/api/*` are the public Next API routes (`ai/chat`, `users`, `uploads`, `admin-demo`, `health`). `src/app/internal/*` are the internal-only equivalents. Pages: `/demo` (browser support demo), `/overlay` and `/assistant` (Electron-only windows).

## Conventions

- Path alias `@/` → `src/` (see [tsconfig.json](tsconfig.json)).
- Files use **tab indentation**.
- Tests are colocated `*.test.ts(x)` next to source, run by Vitest.
- Desktop scripts ([scripts/](scripts/)) deliberately avoid POSIX-only shell syntax and launch through Node so they work from PowerShell/Windows Terminal — preserve that when editing them.
- After deploy/binding changes, regenerate types with `pnpm cf-typegen`.
