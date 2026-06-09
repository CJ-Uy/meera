# Architecture Overview

Routes and feature code should use:

```ts
const db = getDatabaseAdapter();
const storage = getStorageAdapter();
```

Cloudflare-specific access is centralized in `src/server/cloudflare.ts` and consumed by infrastructure/adapters. `getCloudflareContext()` should not be imported directly from app routes.

Key locations:

| Path | Purpose |
| --- | --- |
| `src/db` | Drizzle schema, database types, database adapters |
| `src/storage` | Storage interface and adapters |
| `src/server` | Env validation and Cloudflare infrastructure helpers |
| `src/app/api` | Thin API routes that call adapters |

Adapters let the same app run in local, shared, and production modes without exposing production credentials to development machines.
