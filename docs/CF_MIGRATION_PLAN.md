# Groq → Cloudflare Workers AI Migration Plan

Status: **planned + endpoints validated** (June 2026). Code still runs on Groq; nothing migrated yet.

## Goal

Drop Groq entirely and run all AI on **Cloudflare Workers AI** (via the existing `meera` AI Gateway):
assistant chat, the overlay grounding **selection** step, **vision** (screen description + non-text
fallback), plus new **STT** (voice input) and **TTS** (voice output) for the chatbot.

## Why this is low-risk

The overlay accuracy work already moved grounding off the vision model: coordinates come from local OCR +
region detection, and the model only **selects** a candidate by id. That selection is a plain text-model
call. So the provider swap is mostly an HTTP-client change beneath a provider-agnostic seam
(`ai-service.ts`); the renderer pipeline (`grounding/*`, `use-ai-chat`, capture) does not change.

## Validated against the live account (June 2026)

The `meera` gateway + Workers AI token were probed directly:

- **Chat** — gateway compat `POST {WORKERS_AI_BASE_URL}/chat/completions`, model
  `workers-ai/@cf/meta/llama-3.1-8b-instruct` → returns OpenAI-shaped `choices[].message.content`. ✅
- **Selection** — same endpoint, `workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast` with
  `response_format: { type: "json_object" }` → returned exactly `{"action":"arrow","elementId":"e3"}`.
  Use JSON mode, NOT forced `tool_choice` (Workers AI compat doesn't support `parallel_tool_calls` and
  forced tool choice is unreliable). ✅
- **Vision** — the gateway **compat** path FAILS for vision (`code 3030: Unable to add image…`). Use the
  **direct** endpoint `POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`
  with native body `{ messages:[{role:"user",content:[{type:"text",…},{type:"image_url",image_url:{url:"data:…"}}]}], max_tokens }`
  → returns `result.response` (string). ✅
  - One-time gate: the model required a license accept (`{"prompt":"agree"}` to the direct run endpoint).
    Already submitted for this account.
- **STT / TTS** — direct run endpoints (`@cf/openai/whisper-large-v3-turbo`, `@cf/deepgram/aura-2-en` or
  `@cf/myshell-ai/melotts`). Same token. Not on the compat `/chat` path.

## Env (already in `.env`)

```
WORKERS_AI_BASE_URL=https://gateway.ai.cloudflare.com/v1/<acct>/meera/compat   # chat + selection
WORKERS_AI_API_KEY=<cf token, Workers AI>
WORKERS_AI_ACCOUNT_ID=<acct>          # for the direct run endpoints (vision/STT/TTS)
WORKERS_AI_SUPPORT_MODEL=workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct
WORKERS_AI_CHAT_MODEL=workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct
WORKERS_AI_SELECTION_MODEL=workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct
WORKERS_AI_VISION_MODEL=workers-ai/@cf/meta/llama-4-scout-17b-16e-instruct   # strip prefix for direct run
WORKERS_AI_STT_MODEL=@cf/openai/whisper-large-v3-turbo
WORKERS_AI_TTS_MODEL=@cf/deepgram/aura-2-en
```

## Target architecture

- `src/features/ai/workers-ai-client.ts` (new) — mirrors `groq-client.ts`'s interface
  (`chatWithWorkersAi`, `getWorkersAiStatus`, `groundedSelectionResponse`). Chat + selection go through the
  gateway compat endpoint; selection uses JSON mode and reuses the existing `parseSelection` /
  `selectionToToolCalls`. Reuses `ai-provider-utils.ts` unchanged.
- `src/features/ai/workers-ai-vision.ts` (new) — vision calls via the direct run endpoint; returns text.
  Screen description uses it; the non-text overlay fallback keeps using `recoverOverlayToolCallsFromText`
  on that text (no vision tool-calling needed).
- `src/features/ai/ai-service.ts` — switch the provider seam to Workers AI (keep a `AI_PROVIDER`
  env switch `groq|workers-ai` during transition so we can A/B and roll back instantly).
- New audio features:
  - `POST /api/ai/transcribe` → Whisper run endpoint (multipart/base64 audio in, text out) + a mic button.
  - `POST /api/ai/speak` → Aura/MeloTTS run endpoint (text in, audio out) + a play button on replies.
- Remove Groq (`groq-client.ts`, GROQ_* env, docs) once Workers AI is the default and validated.

What does NOT change: the overlay protocol/reducer/renderer, Electron capture, `grounding/*` (OCR,
regions, candidates, select), `use-ai-chat`, `ai-tools` overlay command mapping.

## Porting notes / gotchas

- **JSON mode over tools** for selection (verified). Keep `select_overlay_target`'s schema as the JSON
  shape; instruct the model to return that JSON; parse with the existing `parseSelection` (it already
  handles JSON-in-content).
- **Vision is a different code path** (direct run, `result.response`) — don't route it through the compat
  client. Llama 3.2 11B Vision is a weak grounder (like Scout), but we don't use it for coordinates.
- **Model id prefix**: gateway compat needs `workers-ai/@cf/...`; direct run uses bare `@cf/...`. The
  vision/STT/TTS modules must strip the `workers-ai/` prefix.
- **Production option**: in the deployed Worker, prefer the native `env.AI.run(...)` binding (no token, no
  egress, lower latency). Local `next dev` can't bind, so HTTP + token is the dev path. Start HTTP-only;
  add the binding behind `APP_ENV=production` later (mirrors the storage adapters' pattern).
- **Status check**: `getWorkersAiStatus` can hit the gateway `/models` list (already used by the playground).

## Staging

1. ✅ **Chat + selection** on Workers AI behind `AI_PROVIDER` switch (default workers-ai). `workers-ai-client.ts`.
2. ✅ **Vision** via direct run (description + recovery fallback). `workers-ai-client.ts` `runVision`.
3. ✅ **STT** — `/api/ai/transcribe` + mic button. `workers-ai-audio.ts`, `voice.ts` `useVoiceInput`.
4. ✅ **TTS** — `/api/ai/speak` + per-message Listen button. `voice.ts` `useSpeech`.
5. ⬜ **Cut over / cleanup** — once validated live: remove `groq-client.ts`, GROQ_* env, Groq docs;
   default is already Workers AI. Optionally add the native `env.AI` binding for production.

### Validate live (in `pnpm desktop:dev`)

- Chat, "point at / highlight X" (selection), "describe my screen" (vision).
- Mic button → speak → text lands in the input (MediaRecorder emits webm/opus; Whisper accepted mp3 in
  testing — confirm webm works, otherwise set a mime type or transcode).
- "Listen" on a reply → audio plays. Electron mic permission is already allowed for trusted URLs.

## Security

The Groq, shared-API, and Workers AI tokens were shared in plaintext during setup — rotate them once the
project is submitted. `.env` is gitignored; never commit real keys.

## References

- Workers AI OpenAI compat: https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
- Llama 3.2 11B Vision: https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/
- Whisper: https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/
- Aura-2 TTS: https://developers.cloudflare.com/workers-ai/models/aura-2-en/
