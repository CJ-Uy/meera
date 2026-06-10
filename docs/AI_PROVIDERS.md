# AI In Meera

## Workers AI Local Playground

Meera includes a standalone local playground for experimenting with Cloudflare Workers AI models.
This is intentionally separate from app wiring: `src/features/ai/*` and `POST /api/ai/chat` continue
to use Groq only.

Full developer guide: [CF_AI_GATEWAY.md](./CF_AI_GATEWAY.md).

Quickstart:

```powershell
pnpm ai:models
pnpm ai:chat "workers-ai/@cf/meta/llama-3.1-8b-instruct" "hello"
```

The playground reads `.env.local` and calls the OpenAI-compatible API with `fetch`; no Wrangler login
or Workers binding is required. By default, `WORKERS_AI_BASE_URL` points at the AI Gateway compat URL:

```text
https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/compat
```

When using that gateway compat URL, Workers AI model ids use the `workers-ai/` prefix, for example
`workers-ai/@cf/meta/llama-3.1-8b-instruct`. If you switch `WORKERS_AI_BASE_URL` to the direct Workers
AI OpenAI-compatible endpoint, drop that prefix and use `@cf/meta/llama-3.1-8b-instruct`.

If `WORKERS_AI_API_KEY` is blank, create a Cloudflare API token from **My Profile -> API Tokens** with
the account-level **Workers AI: Read** permission, then paste it into `.env.local`. If the gateway is
configured as authenticated, also set `WORKERS_AI_GATEWAY_AUTH_TOKEN`.

Equivalent `curl`:

```powershell
curl -X POST "$env:WORKERS_AI_BASE_URL/chat/completions" `
  -H "Authorization: Bearer $env:WORKERS_AI_API_KEY" `
  -H "Content-Type: application/json" `
  --data '{"model":"workers-ai/@cf/meta/llama-3.1-8b-instruct","messages":[{"role":"user","content":"hello"}],"max_tokens":512,"stream":false}'
```

Cloudflare model catalog: https://developers.cloudflare.com/workers-ai/models/

Notes: Workers AI's OpenAI-compatible surface is a subset. Use `max_tokens`, do not rely on
`parallel_tool_calls`, and use only Workers AI `@cf/...` model ids. Requests made with the shared local
token spend compute on the owner's account; AI Gateway logging, rate limits, and metadata can be used
later to cap or attribute usage.

Meera uses **Groq** as its only AI provider. All provider calls stay behind the server-side
`POST /api/ai/chat` route — the browser and Electron renderer never receive provider credentials.

## Models

- Text chat: `llama-3.1-8b-instant`
- Images and desktop frames: `meta-llama/llama-4-scout-17b-16e-instruct` (Groq's only multimodal model)

Groq's Llama 4 Scout model accepts image data URLs, supports multi-turn image conversations, and can
return local function tool calls. Meera validates every returned overlay tool call before sending it to
Electron.

## Local Configuration

Create `.env.local` (or edit `.env`):

```env
GROQ_API_KEY=your_groq_api_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_CHAT_MODEL=llama-3.1-8b-instant
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GROQ_MAX_TOKENS=512
GROQ_REQUEST_TIMEOUT_MS=30000

# Client-side toggle. Set to 0 to disable the zoom-refine grounding pass for raw speed.
# NEXT_PUBLIC_MEERA_GROUNDING_REFINE=1
```

`.env.local` is ignored by Git. Never add a Groq key to source code or prefix it with `NEXT_PUBLIC_`.
For deployment, add `GROQ_API_KEY` as a server-side secret. For Wrangler:

```powershell
pnpm wrangler secret put GROQ_API_KEY
```

## Visual grounding (how overlays get placed)

Llama 4 Scout is a general vision model, not a precision UI grounder — its first coordinate guess lands
in the right neighbourhood but is rarely exact. Meera compensates by spending Groq's speed instead of
trusting one weak guess:

1. **Capture** — Electron grabs the primary display at up to 1920px / JPEG 88 (high enough that small UI
   text stays legible). Coordinates are calibrated against the exact pixel size the model saw.
2. **Locate** — the screenshot plus the user's request go to Scout, which returns an overlay tool call
   with the target's coordinates (percent of the image) or, for highlights, a bounding box.
3. **Zoom-refine** (`src/features/ai/visual-grounding.ts`) — Meera crops and upscales the region around
   that first guess and asks Scout to re-locate the target in the zoomed view. Absolute error shrinks
   with the field of view, so the second pass is far more precise. The refined coordinates are mapped
   back to full-screen space. Because the crop is centred on the first guess, a bad refine can only move
   the overlay within that neighbourhood — and if the refine pass finds nothing, the first guess is kept.
   Toggle with `NEXT_PUBLIC_MEERA_GROUNDING_REFINE`.
4. **Recover** — if the model writes coordinates in prose instead of a native tool call, Meera recovers
   them into validated overlay commands.

## Architecture

- `src/features/ai/ai-service.ts` — selects Groq.
- `src/features/ai/groq-client.ts` — OpenAI-compatible Chat Completions requests; formats images as
  `image_url` data URLs; uses Groq local function tools; deterministic (temperature 0) on vision turns.
- `src/features/ai/ai-provider-utils.ts` — screen calibration, stale-image removal, response normalization.
- `src/features/ai/visual-grounding.ts` — the zoom-refine loop and its pure coordinate math.
- `src/features/ai/image-input.ts` — capture preparation and `cropAndUpscaleScreenFrame` for the refine pass.
- `src/features/ai/ai-tools.ts` — declares and validates every overlay tool, plus coordinate normalization.
- `src/app/api/ai/chat/route.ts` — validates requests and exposes the chat/status endpoints.

Only the newest screenshot is sent on a visual turn. Recent text history is retained so follow-up requests
such as `now use a box instead` still work without re-uploading stale frames.

## Running And Testing

```powershell
pnpm desktop:dev
```

Useful prompts:

- `What can you help me with?`
- `Describe this image.`
- `Point at the terminal.`
- `Highlight where I can see my changes.`
- `Show every overlay type so I can test them.`

## References

- Groq Chat Completions API: https://console.groq.com/docs/api-reference
- Groq Images and Vision: https://console.groq.com/docs/vision
- Groq Local Tool Calling: https://console.groq.com/docs/tool-use/local-tool-calling
- Groq Llama 4 Scout model: https://console.groq.com/docs/model/meta-llama/llama-4-scout-17b-16e-instruct
