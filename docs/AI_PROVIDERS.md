# AI Providers In Meera

Meera uses Groq by default and keeps Ollama as an optional provider or fallback. All provider calls stay behind the server-side `POST /api/ai/chat` route. The browser and Electron renderer never receive provider credentials.

## Default Groq Models

- Text chat: `llama-3.1-8b-instant`
- Images and desktop frames: `meta-llama/llama-4-scout-17b-16e-instruct`

Groq's Llama 4 Scout model accepts image data URLs, supports multi-turn image conversations, and can return local function tool calls. Meera validates every returned overlay tool call before sending it to Electron.

## Local Configuration

Create `.env.local`:

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_CHAT_MODEL=llama-3.1-8b-instant
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GROQ_MAX_TOKENS=512
GROQ_REQUEST_TIMEOUT_MS=30000
```

`.env.local` is ignored by Git. Never add a Groq key to source code or prefix it with `NEXT_PUBLIC_`.

For deployment, add `GROQ_API_KEY` as a server-side secret in the deployment platform. For Wrangler deployments:

```powershell
pnpm wrangler secret put GROQ_API_KEY
```

## Switching Back To Ollama

Set:

```env
AI_PROVIDER=ollama
```

The existing `OLLAMA_*` settings and adapter remain supported. See [OLLAMA.md](OLLAMA.md) for Ollama-specific configuration.

To use Groq first and Ollama only when Groq fails:

```env
AI_PROVIDER=groq
AI_FALLBACK_PROVIDER=ollama
```

Fallback is opt-in because captured desktop frames are sent to whichever provider handles the request.

## Architecture

- `src/features/ai/ai-service.ts`
  - Selects the configured provider and optional fallback.
- `src/features/ai/groq-client.ts`
  - Sends OpenAI-compatible Chat Completions requests to Groq.
  - Formats images as `image_url` data URLs.
  - Uses Groq local function tools and retries transient failures once.
- `src/features/ai/ollama-client.ts`
  - Preserves the Ollama provider implementation.
- `src/features/ai/ai-provider-utils.ts`
  - Shares screen calibration, stale-image removal, local overlay commands, and response normalization across providers.
- `src/features/ai/ai-tools.ts`
  - Declares and validates every overlay tool.
- `src/app/api/ai/chat/route.ts`
  - Validates requests and exposes provider-neutral status/chat endpoints.

Only the newest screenshot is sent on a visual turn. Recent text history is retained so follow-up requests such as `now use a box instead` still work without repeatedly uploading stale frames.

## Running And Testing

```powershell
pnpm desktop:dev
```

Useful prompts:

- `What can you help me with?`
- `Describe this image.`
- `Analyze my screen and point at the most important control.`
- `Highlight the button I should click next.`
- `Show every overlay type so I can test them.`

The assistant status line shows the active provider and image model. If an optional fallback becomes active, it is labeled as a fallback.

## References

- Groq Chat Completions API: https://console.groq.com/docs/api-reference
- Groq Images and Vision: https://console.groq.com/docs/vision
- Groq Local Tool Calling: https://console.groq.com/docs/tool-use/local-tool-calling
- Groq Llama 4 Scout model: https://console.groq.com/docs/model/meta-llama/llama-4-scout-17b-16e-instruct
