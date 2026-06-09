# Database

Drizzle schema lives at `src/db/schema.ts`. The starter table is `users`:

| Column | Type |
| --- | --- |
| `id` | text primary key |
| `email` | unique non-null text |
| `name` | nullable text |
| `created_at` | integer timestamp |

Production uses D1 through `env.DB`, not a `DATABASE_URL`. D1 is a Cloudflare binding in Workers, so production code gets native access without distributing database credentials.

Shared outside-dev mode uses a typed internal API. It must expose app operations only, not raw SQL.

Local fallback uses SQLite at `LOCAL_SQLITE_PATH`.
