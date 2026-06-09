# Setup Overview

Meera is a Next.js App Router app deployed to Cloudflare Workers through OpenNext.

The production runtime is:

```txt
Next.js on Cloudflare Workers -> env.DB D1 binding -> env.BUCKET R2 binding
```

The local and shared modes use the same adapter interfaces, so routes and feature code do not need to know whether data comes from D1, SQLite, R2, local files, or an internal shared dev API.

Main pieces:

| Piece | Purpose |
| --- | --- |
| OpenNext Cloudflare | Builds the Next.js app into a Worker |
| Wrangler | Manages deploys, D1, R2, types, and local preview |
| D1 | Production and shared/dev relational database |
| R2 | Production and shared/dev object storage |
| Drizzle ORM | Type-safe schema, queries, and migrations |
| Zod | Validates mode-specific env vars |
| Adapters | Keep environment switching out of app features |

Next: [environment modes](environment-modes.md).
