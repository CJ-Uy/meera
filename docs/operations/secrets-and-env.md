# Secrets And Env

Committed:

| File | Contents |
| --- | --- |
| `.env.example` | Placeholder values only |
| `.dev.vars.example` | Placeholder local Worker values only |

Ignored:

| File | Purpose |
| --- | --- |
| `.env.local` | Developer-specific Next.js env |
| `.env.*.local` | Named local env files |
| `.dev.vars` | Wrangler local secrets |
| `.local/` | SQLite and local uploads |

Outside developers receive `.env.local` through a private channel. Rotate `SHARED_API_TOKEN` if it leaks, expires, or a developer no longer needs access.
