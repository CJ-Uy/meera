# Meera Demo Video — Remotion Animation

**Date:** 2026-06-12
**Status:** Approved

## Goal

A short, on-brand motion-graphics video for the app demo, narrating Meera's four
design priorities. Mascot-led, on-screen kinetic text (no audio track), paced for
comfortable reading.

## Source script

> Overall, Meera was designed around four priorities.
> First, user interface: making the support experience feel friendly, clear, and easy to start.
> Second, creativity: moving beyond a chatbot into screen sharing, voice input, desktop overlays, and guided support.
> Third, data model design: turning natural-language concerns into structured operational records.
> And fourth, functionality and user experience: showing that the agent can classify concerns, ask for missing details, respect boundaries, and escalate with context.

## Output spec

- 1920×1080, 30fps, ~42s (≈1260 frames).
- Format: MP4 (h264) rendered to `out/`.
- No audio; on-screen text only.

## Brand system (from `src/app/globals.css` / landing)

- Canvas: cream `#FBF6EE` (+ subtle grain), secondary cream `#F5ECDD`.
- Ink: `#1C3349` headers, `#33495C` body, muted `#6E7E8B`.
- Accents: teal `#2E9C8E`, sand `#E79B6B`, gold `#D9A65A`, green `#7FB85C`.
- Lines: `#EAE0D1` / `#E2D6C2`.
- Type: Plus Jakarta Sans (700/800 headings), DM Mono (eyebrow labels).
- Radii: sm 10 / md 16 / lg 24 / xl 34 / pill 999. Shadow `--sh-md`.
- Mascot poses reused from `public/assets/meera-*.png`:
  wave, connect, clipboard, celebrate, avatar.

## Storyboard

| # | Frames (≈) | Mascot | Heading | Motion |
|---|-----------|--------|---------|--------|
| 0 Intro | 0–180 | wave | "Meera was designed around four priorities" | mascot spring-in, wordmark fade, four numbered dots pop in sequence |
| 1 User Interface | 180–420 | wave | "Friendly, clear, easy to start" | eyebrow "01 · USER INTERFACE", chat bubble + Start pill slide in, words stagger |
| 2 Creativity | 420–690 | connect | "Beyond a chatbot" | 4 feature chips fan out on dotted connectors: Screen share · Voice · Overlays · Guided |
| 3 Data Model | 690–930 | clipboard | "Natural language → structured records" | messy NL sentence morphs into a tidy ticket card; typed fields populate |
| 4 Functionality & UX | 930–1200 | celebrate | "Built to act responsibly" | 4 lines check off: Classify · Ask for details · Respect boundaries · Escalate with context |
| Outro | 1200–1260 | avatar | Meera wordmark + tagline | settle + soft fade |

## Architecture

Isolated `remotion/` folder — does not touch the Next build.

```
remotion/
  index.ts                 # registerRoot
  Root.tsx                 # <Composition> registration
  theme.ts                 # brand tokens (colors, fonts, radii, spacing)
  components/
    SceneShell.tsx         # shared bg + grain + eyebrow/heading layout + scene fade
    Eyebrow.tsx            # DM Mono numbered label with dot
    FeatureChip.tsx        # pill chip with icon
    TicketCard.tsx         # structured-record card with field rows
    Mascot.tsx             # staticFile() image with bob/spring helper
  scenes/
    Scene0Intro.tsx
    Scene1UI.tsx
    Scene2Creativity.tsx
    Scene3DataModel.tsx
    Scene4Function.tsx
    Outro.tsx
  MeeraDemo.tsx            # top sequence: stitches scenes via <Sequence>/<Series>
remotion.config.ts         # video + publicDir config (root)
```

- Reuse mascot PNGs by pointing Remotion `publicDir` at the existing project
  `public/` (no asset duplication). Reference via `staticFile('assets/meera-*.png')`.
- Fonts via `@remotion/google-fonts` (Plus Jakarta Sans, DM Mono) for
  deterministic rendering.
- Motion: `spring()` entrances, `interpolate()` for fades/slides, `<Series>` to
  sequence scenes with small overlap cross-fades.

## Package changes

- Add deps: `remotion`, `@remotion/cli`, `@remotion/google-fonts`.
- Add scripts:
  - `video:studio` → `remotion studio remotion/index.ts`
  - `video:render` → `remotion render remotion/index.ts MeeraDemo out/meera-demo.mp4`

## Non-goals

- No audio/VO sync (text-only).
- No changes to existing app code, routes, or build.
- Not a literal product UI walkthrough; stylized illustrations of each priority.

## Verification

- `pnpm video:studio` loads the composition without errors.
- `pnpm video:render` produces `out/meera-demo.mp4`.
- `pnpm typecheck` still passes (remotion folder excluded from Next build but
  type-clean).
