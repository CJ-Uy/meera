# Production Deploy

Production deploys use Cloudflare Workers bindings:

| Binding | Resource |
| --- | --- |
| `DB` | `meera-prod-db` |
| `BUCKET` | `meera-prod-uploads` |

Before deploy:

- Confirm `.env.local`, `.dev.vars`, and secrets are not committed.
- Generate and review migrations.
- Apply production migrations intentionally.
- Run typecheck, lint, and build.

Commands:

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm db:migrate:prod
pnpm deploy:prod
```

Verify production by calling `/api/health`. It should report `APP_ENV=production`, database adapter `d1`, storage adapter `r2-binding`, and Cloudflare bindings available.
