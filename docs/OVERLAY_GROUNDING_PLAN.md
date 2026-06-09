# Meera Overlay Grounding — Improvement Plan

Status: **draft / proposed** (assessment + plan, June 2026). No production code changed yet.

## Goal

Meera's overlay assistant ("an IT person helping you with your computer") must read the screen
and place overlays — arrow / highlight / bubble / cursor — **accurately and consistently** on the
element the user means. Today it works but is inconsistent: it misplaces overlays and misrecognizes
targets. This plan addresses the root cause and lays out a staged rebuild.

## Root cause

The system asks **Llama 4 Scout** (a general vision model, not a UI grounder) to **regress pixel /
percent coordinates** of UI elements from a screenshot. Coordinate regression from a general VLM is
the least reliable thing it can do. Everything downstream — the zoom-refine second pass, the
calibration grid (already disabled), the ~800-line coordinate-normalization layer in `ai-tools.ts`,
and the prose-recovery regexes — is scaffolding around an unreliable base signal. You cannot patch a
weak grounder into a reliable one.

The GUI-agent field's consensus fix (Set-of-Mark prompting, OmniParser, UI-Automation-backed agents):
**don't ask the model for coordinates. Give it pre-detected, labeled candidate elements whose exact
boxes come from a reliable source, and have the model pick one by ID.** Selection is what LLMs are
good at; spatial regression is what they're bad at. Reported gain: +20–30% click accuracy.

## Hard constraints (verified June 2026)

- **Groq is the only AI provider** (no Ollama, no side providers). Confirmed by the user.
- **The Groq key exposes exactly one image-capable model: `meta-llama/llama-4-scout-17b-16e-instruct`.**
  `qwen3-32b` is text-only; Llama 4 Maverick was deprecated on Groq (Feb 2026); gpt-oss are text-only.
  → A "swap to a better grounder" Tier-0 fix is **not available**. Scout is the only vision option.
  → Therefore accuracy must come from **not using the model for coordinates at all**.
- **Best text model available on the key: `llama-3.3-70b-versatile`** — use it for the *selection* step
  (much stronger reasoner than the current `llama-3.1-8b-instant`).

## Spike finding — UI Automation coverage (`scripts/spikes/uia-dump.ps1`)

- UIA enumeration is **fast** (~200–500 ms for several windows) — fine to call per request.
- **Chromium/Electron apps expose almost nothing to UIA by default** (Spotify/Claude/Notion each
  surfaced only window-chrome elements). Chromium only exposes its content tree to UIA when an
  assistive-technology client is detected / accessibility is force-enabled.
- Implication: UIA is a **native-app precision booster**, not the universal element source.
  Re-run `uia-dump.ps1 -ProcessName <app>` against the actual demo apps to confirm coverage.

## Target architecture

Replace "model guesses coordinates" with "model selects a known element." The overlay protocol,
reducer, renderer, and Electron windowing stay — the rewrite is concentrated in *how a target becomes
a rect*.

### Per visual-request pipeline

1. **Capture** the focused display (and record exact pixel size + `scaleFactor`).
2. **Build a candidate element set** from sources, each candidate = `{ id, text, role, rect }`:
   - **UIA** (Electron main spawns the helper) — exact rects + name + control type for native surfaces.
   - **OCR** (local Tesseract.js, run in a worker) — word/line text + boxes; the backbone for
     browser/Electron content where UIA is blind.
   - *(later)* an icon/element detector for icon-only targets.
3. **Merge + dedupe** candidates into one labeled list with stable IDs.
4. **Select** (no coordinates emitted by the model):
   - **Primary:** `llama-3.3-70b-versatile` (text) given `{ user request, short history, candidate list }`
     returns `{ action, elementId, message }` via JSON/tool call.
   - **Fallback A (visual):** if the list is empty or the model says "not listed / icon-only", draw
     **Set-of-Marks** numbered boxes for the top-N candidates on the screenshot and ask **Scout** to
     pick a number.
   - **Fallback B (last resort):** Scout raw-coordinate guess (today's behavior) — should be rare.
5. **Map** the chosen candidate's rect → normalized → overlay command. Pixel-perfect by construction.
6. **Render** via the existing overlay path (with UX tweaks below).

### Selection contract (replaces the heuristic layers)

Model output schema — **never** `x/y`:

```
{ action: "arrow" | "highlight" | "bubble" | "cursor" | "clear" | "none",
  elementId?: string,        // references a candidate id
  message?: string }
```

This lets us delete most of `ai-tools.ts` (coordinate-space inference, grid parsing, prose recovery,
keyword tool synthesis) and the zoom-refine pass.

### Fallback ladder (always degrades gracefully)

UIA candidate → OCR candidate → SoM-over-detected-candidates (Scout) → raw Scout coordinate → honest
"I can't locate that" text. Never silently place a guess at screen center.

## File-by-file changes (after the Next.js/Electron separation lands)

New:
- `electron/native/uia-dump.ps1` (productionized from the spike) + a spawn wrapper in `electron/main.ts`;
  new IPC `assistant:list-elements` (trusted-sender gated like the existing handlers).
- `src/features/ai/grounding/` — `uia-source.ts`, `ocr-source.ts` (Tesseract), `merge.ts`, `types.ts`,
  `select.ts` (text-model selection), `set-of-marks.ts` (numbered-box render for the vision fallback).

Modify / rewrite:
- `ai-tools.ts` → shrink to the selection schema + `elementId → rect` mapping. Drop normalization/recovery.
- `ai-provider-utils.ts` → simplify `resolveProviderResponse` (no prose recovery / reconcile).
- `groq-client.ts` → add the text-selection call (`llama-3.3-70b-versatile`); keep Scout only for SoM fallback.
- `visual-grounding.ts` → retire zoom-refine (SoM replaces it); keep crop util if reused for SoM tiles.
- `image-input.ts` → capture stays; drop the disabled calibration grid; OCR uses the same frame.
- `ai-assistant.tsx` → wire the new pipeline (capture → candidates → select → overlay).
- overlay renderer (`desktop-overlay.tsx`) → see UX below.

## Overlay UX improvements

- **Persist** guidance until the next request or an explicit clear (today's 6 s TTL can vanish mid-explanation).
- Add a **connector** from bubble → target; gentler dim for highlight; smarter arrow direction from rect geometry.
- **Multi-display:** capture the focused display, not always primary (`electron/main.ts` currently hardcodes primary).
- *(stretch)* **Click-to-act:** UIA exposes `Invoke` — the same source that locates a native button can click it,
  turning Meera from "pointer" into "does it for you."

## Testing

- Keep/extend the vitest suites (`*.test.ts`) for the new pure modules (merge, select schema, rect mapping).
- Scripted demo matrix: Wi-Fi/network in Settings (UIA), File Explorer (UIA), a web portal in a browser
  (OCR), Notepad (UIA), the Meera app itself. Track hit-rate per surface.

## Risks & mitigations

- **Chromium UIA gap** → OCR + SoM carry browser/Electron; for a browser-heavy demo, consider a
  browser-side source (extension/CDP) post-deadline.
- **OCR latency** → run in a worker; cache per captured frame; downscale sensibly.
- **Helper spawn cost** → one spawn per request; cache the foreground-window tree briefly.

## Staging (deadline: submission June 12, 2026)

- **Stage A — non-conflicting groundwork (now):** this plan; `uia-dump.ps1` spike (done); Ollama env
  cleanup; design the selection schema. Avoid editing the in-flight Electron/AI files while the
  separation refactor is running. (OCR dep install is deferred — `package.json` is high-conflict.)
- **Stage B — wire the pipeline (after refactor lands):** OCR source + text-model selection + UIA IPC,
  then rip out the coordinate heuristics. This is the bulk of the accuracy win.
- **Stage C — polish:** overlay persistence/connector, multi-display, click-to-act.

## References

- Set-of-Mark / UGround: https://arxiv.org/html/2410.05243v1
- OmniParser: https://github.com/microsoft/OmniParser
- GUI grounding benchmarks: https://arxiv.org/abs/2509.21552
- Windows UI Automation tree: https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-treeoverview
- NodeRT UIAutomation (alt to the PS helper): https://www.npmjs.com/package/@nodert-win10-21h1/windows.ui.uiautomation
- Groq deprecations / models: https://console.groq.com/docs/deprecations
