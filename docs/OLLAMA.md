# Ollama Provider In Meera

Groq is Meera's default AI provider. The Ollama adapter remains available for local use, remote Ollama hosts, or an opt-in fallback.

See [AI_PROVIDERS.md](AI_PROVIDERS.md) for the provider-neutral architecture and Groq setup.

## Use Ollama As The Primary Provider

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=https://ollama.cjuy.dev
OLLAMA_CHAT_MODEL=qwen3.5:9b
OLLAMA_VISION_MODEL=qwen3-vl:8b
OLLAMA_CHAT_CONTEXT=8192
OLLAMA_VISION_CONTEXT=4096
OLLAMA_MAX_TOKENS=256
OLLAMA_REQUEST_TIMEOUT_MS=85000
```

`OLLAMA_API_KEY` is optional. Keep it server-side and never create a `NEXT_PUBLIC_OLLAMA_*` variable.

## Use Ollama As A Groq Fallback

```env
AI_PROVIDER=groq
AI_FALLBACK_PROVIDER=ollama
```

Fallback is disabled by default. Enabling it means uploaded images and captured desktop frames may be sent to Ollama when Groq fails.

## Ollama-Specific Behavior

- Text chat defaults to `qwen3.5:9b`.
- Vision defaults to `qwen3-vl:8b`.
- Qwen3-VL receives provider-specific `relative_1000` coordinate calibration.
- Vision output is left uncapped so Qwen3-VL can finish hidden thinking and emit a tool call.
- Transient runner, gateway, and timeout failures retry once within the configured request budget.

All returned tools still pass through the same provider-neutral overlay validation used by Groq.
