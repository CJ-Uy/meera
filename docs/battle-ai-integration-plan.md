# Plan: Make Battle Mode a Real AI Support Session

## Context / Goal
Today `/demo/student` has two views via the `ViewToggle`: **Chat** (real AI) and **Battle**
(`src/components/demo/battle.tsx`). Battle is currently a **hardcoded mockup**: a fixed 5-step `QUEST`
array, scripted damage numbers, no gateway call, no ticket. We want Battle to become a *real* support
session — same gateway, same ticket creation as chat — wrapped in the RPG skin. "More fun chat."

## Decisions (locked with the user)
1. **Hybrid**: Battle runs the same `/api/ai/chat` `mode:"support"` flow as chat (real replies + real
   tickets). On top of that, the model also returns **2–3 suggested student replies** each turn.
2. **Moves = AI-suggested student replies** rendered as quick-reply buttons; the existing free-text
   "…or type your own move" input stays. Clicking a suggestion sends it exactly like typing it.
3. **Two victories, no loss.** Enemy HP = case progress. Enemy defeated when the case is done:
   - resolution `"self-serve"` → "THE SNAG defeated!" (resolved, no ticket).
   - resolution `"ticket"` → "Backup called — staff are on it!" (ticket filed; show the real ticket).
   Remove the MiRA faint / `LoseOverlay` lose path entirely.
4. **Any issue, like chat.** The boss is a generic "bureaucracy" mascot (rename `THE HOLD` → `THE SNAG`
   or similar) — no longer tied to the grades/financial-hold storyline.

## Key existing code to reuse (do NOT reinvent)
- Chat send loop + state: `src/features/meera-support/student-support-chat.tsx`
  `StudentSupportChat` (state at ~L355–400, `sendText` at ~L400–460, `caseStage`/`latestTicket` memos).
- Progress logic: `src/features/meera-support/support-stage.ts` `deriveCaseStage` → returns
  `{ stage 0..4, damage, fixed, resolution, activeDepartments }`.
- Gateway entry: `POST src/app/api/ai/chat/route.ts` → `chatWithAi` in
  `src/features/ai/ai-service.ts` → `finalizeSupportResponse` persists the ticket and returns
  `response.ticket`.
- Types: `src/features/ai/ai-types.ts` (`AiChatRequest`, `AiChatResponse`, `isAiChatRequest`).
- Voice/TTS: `useSpeech`, `useVoiceInput` from `src/features/ai/voice`.
- Shared UI atoms: `src/components/demo/shared.tsx` (`Icon`, `Card`, `Pill`, `Button`,
  `SpeechControl`, `VoiceInputControl`, `asset`).
- Battle visuals already built: `battle.tsx` `NamePlate`, `HpBar`, `QuestTracker`, `EnemySprite`,
  `FloatingDamage`, `WinOverlay`, arena layout, CSS anims (`bob`, `mound-shake`, `dmg-float`,
  `fadeUp`, `tdot` — all in `src/app/globals.css`).

## Architecture: extract one shared conversation hook
Create `src/features/meera-support/use-support-conversation.ts` exporting `useSupportConversation()`.
Move the conversation state + `sendText` out of `StudentSupportChat` into this hook so **chat and
battle share one source of truth** (no duplicate gateway logic).

Hook returns:
```ts
{
  messages, sending, error,
  draft, setDraft,
  sendText: (text?: string, opts?: { wantsSuggestedReplies?: boolean }) => Promise<void>,
  latestTicket,              // SupportTicketResult | null
  caseStage,                 // from deriveCaseStage
  suggestedReplies: string[],// latest AI suggestions (battle), [] otherwise
  continuing, setContinuing, // resolved-bar "Continue chatting" override (chat)
  voice,                     // useVoiceInput(...)
  speakingId, speak,         // useSpeech()
}
```
`sendText` already exists almost verbatim in `student-support-chat.tsx` — move it, and add: include
`wantsSuggestedReplies` in the POST body; on success set `suggestedReplies` from `body.suggestedReplies ?? []`.

`StudentSupportChat` then calls the hook and renders the chat UI from it (behavior identical to today;
pass `wantsSuggestedReplies: view === "battle"` at call sites). `BattleView` also calls the hook (or,
simpler, lift the hook to `StudentSupportChat` and pass the returned object to `<BattleView .../>` as a
prop — recommended, since the `ViewToggle` already lives in `StudentSupportChat`). Battle sends with
`wantsSuggestedReplies: true`; chat with `false` (so chat keeps single-round-trip latency).

## AI-suggested replies (server-side, one round-trip)
Extend the gateway instead of adding a second client fetch:
1. `ai-types.ts`:
   - `AiChatRequest`: add `wantsSuggestedReplies?: boolean`. Validate it in `isAiChatRequest`
     (`value.wantsSuggestedReplies !== undefined && typeof !== "boolean"` → false).
   - `AiChatResponse`: add `suggestedReplies?: string[]`.
2. `ai-service.ts` `chatWithAi`: after building the support response (and `finalizeSupportResponse`),
   if `request.wantsSuggestedReplies`, call a new best-effort helper
   `generateSuggestedReplies(request.messages, response.message)` and attach `suggestedReplies`.
   Wrap in try/catch → on any failure attach `[]` (suggestions are non-critical).
3. `generateSuggestedReplies`: one cheap text completion (reuse the configured provider's text model,
   `llama-3.1-8b-instant` / Workers-AI equivalent — see `groq-client.ts` / `workers-ai-client.ts`).
   System prompt: *"You write 2–3 SHORT first-person replies the STUDENT might send next in this
   support chat. Each ≤ 8 words, natural, varied (one can decline/close). Return ONLY a JSON array of
   strings."* Parse the JSON array defensively (regex-extract `[...]`, `JSON.parse`, filter to strings,
   cap at 3). Fallback `[]`.
   - If reusing `chatWithGroq`/`chatWithWorkersAi` is awkward (they assume support/overlay system
     prompts), add a tiny direct completion call alongside them, or a `mode:"suggest"` branch. Keep it
     isolated; do not disturb the support/overlay prompts.

## Battle UI rework (`battle.tsx`)
Convert `BattleView` from self-contained scripted state to a presentational component driven by the
shared conversation. Delete `QUEST`, the `play()` scripted damage, `miraHp` depletion, `Phase "lost"`,
and `LoseOverlay`/`TicketStub` lose path.

Map conversation → battle:
- **Enemy HP** = `[100, 75, 50, 25, 0][caseStage.stage]` (stage 4 ⇒ 0 = defeated). Animate via the
  existing `HpBar` width transition. Track previous stage in a ref; when stage increases, fire a
  `FloatingDamage` on the enemy with `amount = newHp - oldHp` and bump `combo`. If stage doesn't move
  on a turn, reset combo to 0 (kept the "miss" feel without an HP-loss lose state).
- **Dialogue box** = latest assistant message (real Meera reply). While `sending`, show
  "Meera is sizing up the situation…". Keep the `SpeechControl` TTS button on it.
- **Moves** = `suggestedReplies.map(...)` → buttons that call `sendText(reply, { wantsSuggestedReplies:true })`.
  Show a small "type your own move" hint; the free-text input (already present) calls the same
  `sendText`. While `sending`, disable moves. If `suggestedReplies` is empty (first turn / model
  miss), show 2–3 static fallback chips (e.g. the chat's `suggestedPrompts`).
- **Victory** when `caseStage.fixed`: render `WinOverlay` variant by `caseStage.resolution`:
  - `"self-serve"` → "THE SNAG defeated! Solved — no ticket needed." + "Play again" (resets convo).
  - `"ticket"` → "Backup called! Staff are on it." + show real ticket from `latestTicket`
    (office / `ticketNumber` / `studentFacingSummary`) reusing a small ticket stub. + "New battle".
  - "Play again"/reset = clear messages back to `[WELCOME]` (expose a `reset()` from the hook).
- **MiRA**: keep the sprite + nameplate as a steady ally; drop HP depletion (HP stays full or relabel
  the bar "morale"). No faint.
- **QuestTracker**: repoint the 5 nodes to case stages so it tracks real progress, e.g.
  `["Ready","Heard","Researched","Diagnosed","Packaged"]`, `active = index <= caseStage.stage`.
  Keep the component name `QuestTracker` and the `combo` pill (battle.test.ts asserts these).
- **Enemy identity**: rename `THE HOLD` → `THE SNAG` (generic bureaucracy boss). Keep cobra sprites.

## Files to create / modify
- **create** `src/features/meera-support/use-support-conversation.ts` — shared hook (+ `reset`).
- **modify** `src/features/meera-support/student-support-chat.tsx` — use the hook; pass conversation to
  `BattleView`; chat send uses `wantsSuggestedReplies:false`.
- **modify** `src/components/demo/battle.tsx` — props-driven; delete scripted quest/lose; wire HP/moves/
  victory to `caseStage`/`suggestedReplies`/`latestTicket`; repoint `QuestTracker`.
- **modify** `src/features/ai/ai-types.ts` — `wantsSuggestedReplies` + `suggestedReplies` + validation.
- **modify** `src/features/ai/ai-service.ts` — `generateSuggestedReplies` + attach when requested.
- **maybe** `src/features/ai/groq-client.ts` / `workers-ai-client.ts` — minimal completion helper for
  suggestions if needed.

## Tests
- `src/components/demo/battle.test.ts`: keep `QuestTracker`/`combo`/`battle-arena-shell` asserts (still
  present). Add: source no longer contains `const QUEST` / `LoseOverlay`; contains `suggestedReplies`
  and `sendText`.
- `src/features/ai/ai-types` test (if present) / add: `isAiChatRequest` accepts/validates
  `wantsSuggestedReplies`.
- `student-support-chat.test.ts`: unaffected derive tests stay; if state moved to the hook, update the
  source-string asserts to the new file or keep `StudentSupportChat` re-exporting the same strings.
- Add a small unit test for the suggestion JSON parser (valid array, junk → `[]`, caps at 3).
- Keep `deriveCaseStage` tests green (unchanged).

## Verification
1. `pnpm typecheck && pnpm test` (target ~all green; add the new tests).
2. `pnpm build`.
3. Manual: `pnpm dev` → `/demo/student` → **Battle**. Type "my wifi won't connect before a quiz" →
   Meera replies in the dialogue box, 2–3 suggested-reply move buttons appear, enemy HP drops as the
   case advances. Continue until a ticket is filed → "Backup called!" victory shows the real ticket →
   confirm it appears in **Admin** inbox (it persists via the same `finalizeSupportResponse` path).
   Test a self-resolved issue → "THE SNAG defeated! no ticket needed."
4. `graphify update .` after code changes; commit (no "claude" in the message). Branch: `demo-page-fixes`.

## Risks / notes
- Suggestion quality depends on the model; always keep the static fallback chips so moves are never
  empty. Suggestions are best-effort — never block the turn on them.
- Don't touch the production support master prompt; generate suggestions as an isolated extra call.
- Battle and chat now share ticket creation — verify a ticket isn't double-created (only
  `finalizeSupportResponse` writes; the suggestion call must be a plain completion, no `mode:"support"`).
- Keep one validated overlay/gateway path; reuse `deriveCaseStage` rather than new progress math.

---

## Execution prompt (paste into a fresh session on branch `demo-page-fixes`)
> Implement real AI in Battle mode per `docs/battle-ai-integration-plan.md`. Battle must run the same
> `/api/ai/chat` `mode:"support"` flow as the chat view (real Meera replies + real tickets via
> `finalizeSupportResponse`), wrapped in the existing RPG skin. Specifically:
> 1) Extract a shared `useSupportConversation` hook from `StudentSupportChat` (messages, sending,
>    error, draft, `sendText`, `caseStage`, `latestTicket`, `suggestedReplies`, `reset`) and use it in
>    both chat and `BattleView`; chat sends `wantsSuggestedReplies:false`, battle `true`.
> 2) Add `wantsSuggestedReplies?: boolean` to `AiChatRequest` (+ validate) and `suggestedReplies?:
>    string[]` to `AiChatResponse`; in `chatWithAi`, when requested, attach 2–3 short first-person
>    student-reply suggestions via a best-effort isolated text completion (`generateSuggestedReplies`,
>    JSON array, defensive parse, `[]` fallback). Do not alter the support/overlay system prompts.
> 3) Rework `battle.tsx` to be props-driven: enemy HP = `[100,75,50,25,0][caseStage.stage]` with
>    `FloatingDamage`+combo on stage increase; dialogue = latest assistant message; moves =
>    `suggestedReplies` buttons (+ free-text input) that call `sendText`; repoint `QuestTracker` to the
>    case stages; rename `THE HOLD`→`THE SNAG`. Remove the scripted `QUEST`, `miraHp` depletion, the
>    `"lost"` phase and `LoseOverlay`. Two victories: `resolution==="self-serve"` → "defeated, no
>    ticket"; `resolution==="ticket"` → "Backup called" + show the real `latestTicket`; both offer
>    reset. Keep a static fallback move set when `suggestedReplies` is empty.
> 4) Update/extend tests (`battle.test.ts`, ai-types validation, suggestion parser, keep
>    `deriveCaseStage` + `QuestTracker`/`combo` asserts). Run `pnpm typecheck && pnpm test && pnpm
>    build`, then `graphify update .`, then commit on `demo-page-fixes` (no "claude" in the message).
