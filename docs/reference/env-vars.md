# Env Vars

| Name | Required | Used by | Example | Outside dev safe? | Secret? |
| --- | --- | --- | --- | --- | --- |
| `APP_ENV` | Yes | All modes | `local` | Yes | No |
| `STORAGE_MODE` | Yes | Storage | `local` | Yes | No |
| `SHARED_API_BASE_URL` | `APP_ENV=shared` | Shared API adapters | `https://shared.example.com` | Yes | No |
| `SHARED_API_TOKEN` | `APP_ENV=shared` | Shared API adapters | `replace-me` | Dev-only | Yes |
| `R2_ACCOUNT_ID` | `STORAGE_MODE=r2-s3` | R2 S3 adapter | `8527...` | Dev-only | Treat as sensitive |
| `R2_BUCKET_NAME` | `STORAGE_MODE=r2-s3` | R2 S3 adapter | `meera-dev-uploads` | Yes, dev bucket only | No |
| `R2_ACCESS_KEY_ID` | `STORAGE_MODE=r2-s3` | R2 S3 adapter | `replace-me` | Dev-only | Yes |
| `R2_SECRET_ACCESS_KEY` | `STORAGE_MODE=r2-s3` | R2 S3 adapter | `replace-me` | Dev-only | Yes |
| `R2_ENDPOINT` | `STORAGE_MODE=r2-s3` | R2 S3 adapter | `https://<account>.r2.cloudflarestorage.com` | Dev-only | No |
| `LOCAL_SQLITE_PATH` | Optional | Local fallback DB | `./.local/dev.db` | Yes | No |
| `LOCAL_STORAGE_DIR` | Optional | Local fallback storage | `./.local/uploads` | Yes | No |
| `GROQ_API_KEY` | AI feature only | Groq server calls | `replace-me` | No | Yes |
| `GROQ_BASE_URL` | Optional | Groq server calls | `https://api.groq.com/openai/v1` | Yes | No |
| `GROQ_CHAT_MODEL` | Optional | Groq server calls | `llama-3.1-8b-instant` | Yes | No |
| `GROQ_VISION_MODEL` | Optional | Groq server calls | `meta-llama/llama-4-scout-17b-16e-instruct` | Yes | No |
| `GROQ_MAX_TOKENS` | Optional | Groq server calls | `512` | Yes | No |
| `GROQ_REQUEST_TIMEOUT_MS` | Optional | Groq server calls | `30000` | Yes | No |
