# Cloudflare AI Gateway Playground

This guide is for local model experiments through Cloudflare Workers AI and AI Gateway. It does not
wire Workers AI into the Meera app. The production/local app AI route still uses Groq under
`src/features/ai/*`.

## Current Setup

The local playground is `scripts/workers-ai-playground.mjs` and is exposed through:

```powershell
pnpm ai:models
pnpm ai:chat
```

It reads these server-side-only variables from `.env.local`:

```env
WORKERS_AI_BASE_URL=https://gateway.ai.cloudflare.com/v1/8527ec1369d46f55304a6f59ab5356e4/meera/compat
WORKERS_AI_API_KEY=<cloudflare-api-token>
# WORKERS_AI_GATEWAY_AUTH_TOKEN=
WORKERS_AI_PLAYGROUND_MODEL=workers-ai/@cf/meta/llama-3.1-8b-instruct
```

Never prefix these with `NEXT_PUBLIC_`. `.env.local` is ignored by Git because it contains live
credentials.

## First Smoke Test

List available models:

```powershell
pnpm ai:models
```

Run a deterministic chat test:

```powershell
pnpm ai:chat "workers-ai/@cf/meta/llama-3.1-8b-instruct" "Reply with exactly: hello"
```

Expected output:

```text
hello
```

Use the default model from `.env.local`:

```powershell
pnpm ai:chat --prompt "Reply with exactly: ok"
```

Print the raw response when checking metadata or error shape:

```powershell
pnpm ai:chat --model "workers-ai/@cf/meta/llama-3.1-8b-instruct" --prompt "hello" --json
```

## Swap Models

Use `pnpm ai:models` or the Workers AI catalog to find model ids:
https://developers.cloudflare.com/workers-ai/models/

For one command, pass the model id first:

```powershell
pnpm ai:chat "workers-ai/@cf/moonshotai/kimi-k2.6" "Summarize what AI Gateway does in one sentence."
```

To change the local default, edit:

```env
WORKERS_AI_PLAYGROUND_MODEL=workers-ai/@cf/moonshotai/kimi-k2.6
```

Then run:

```powershell
pnpm ai:chat --prompt "What model are you?"
```

## Gateway Vs Direct Endpoint

The default endpoint goes through AI Gateway's OpenAI-compatible compat path:

```env
WORKERS_AI_BASE_URL=https://gateway.ai.cloudflare.com/v1/8527ec1369d46f55304a6f59ab5356e4/meera/compat
WORKERS_AI_PLAYGROUND_MODEL=workers-ai/@cf/meta/llama-3.1-8b-instruct
```

When using this compat URL, Workers AI model ids need the `workers-ai/` provider prefix.

To bypass AI Gateway and call Workers AI directly, switch the base URL and remove the prefix from the
model id:

```env
WORKERS_AI_BASE_URL=https://api.cloudflare.com/client/v4/accounts/8527ec1369d46f55304a6f59ab5356e4/ai/v1
WORKERS_AI_PLAYGROUND_MODEL=@cf/meta/llama-3.1-8b-instruct
```

Use the gateway path by default so requests show up in AI Gateway logging, analytics, caching, rate
limits, and future policy controls.

## Auth And Tokens

`WORKERS_AI_API_KEY` should be a Cloudflare API token scoped to this account with **Workers AI: Read**.
If the token is missing or expired, create a new one in Cloudflare:

1. Open **My Profile -> API Tokens**.
2. Create a custom token.
3. Add account permission **Workers AI: Read**.
4. Scope it to account `8527ec1369d46f55304a6f59ab5356e4`.
5. Paste the token into `.env.local` as `WORKERS_AI_API_KEY`.

`WORKERS_AI_GATEWAY_AUTH_TOKEN` is only needed if the `meera` AI Gateway is set to authenticated mode.
When set, the playground sends it as `cf-aig-authorization: Bearer <token>`.

## Useful Commands

Show help:

```powershell
pnpm ai:chat --help
```

Use a system prompt:

```powershell
pnpm ai:chat --model "workers-ai/@cf/meta/llama-3.1-8b-instruct" `
  --system "Answer tersely." `
  --prompt "Explain Workers AI."
```

Call with `curl`:

```powershell
curl -X POST "$env:WORKERS_AI_BASE_URL/chat/completions" `
  -H "Authorization: Bearer $env:WORKERS_AI_API_KEY" `
  -H "Content-Type: application/json" `
  --data '{"model":"workers-ai/@cf/meta/llama-3.1-8b-instruct","messages":[{"role":"user","content":"hello"}],"max_tokens":512,"stream":false}'
```

Run project typechecking after script changes:

```powershell
pnpm typecheck
```

## Troubleshooting

`Missing WORKERS_AI_API_KEY`

The token is blank or `.env.local` was not loaded. Add `WORKERS_AI_API_KEY` to `.env.local`; the script
also manually parses `.env.local` on Node versions without `--env-file`.

`404` or model not found

Check the model prefix. Gateway compat uses `workers-ai/@cf/...`; direct Workers AI uses `@cf/...`.

`401` or `403`

The API token is missing, expired, incorrectly scoped, or the gateway requires
`WORKERS_AI_GATEWAY_AUTH_TOKEN`.

Huge model list

That is normal for the compat endpoint because AI Gateway exposes many provider ids. Filter visually for
`workers-ai/` when testing Workers AI models.

Need app integration

Do not modify `src/features/ai/*` as part of playground work. When the app is ready to support Workers
AI, add a separate provider design and tests for the route behavior.

## References

- Workers AI models: https://developers.cloudflare.com/workers-ai/models/
- Workers AI OpenAI compatibility: https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
- AI Gateway OpenAI compatibility: https://developers.cloudflare.com/ai-gateway/usage/chat-completion/
- AI Gateway REST API changelog: https://developers.cloudflare.com/changelog/post/2026-05-21-rest-api/
