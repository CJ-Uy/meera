# Commands

| Task | Command |
| --- | --- |
| Install | `pnpm install` |
| Local Next dev | `pnpm dev` |
| Cloudflare preview | `pnpm dev:cf` |
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Test | `pnpm test` |
| Generate migrations | `pnpm db:generate` |
| Apply local migrations | `pnpm db:migrate:local` |
| Apply shared/dev migrations | `pnpm db:migrate:dev` |
| Apply production migrations | `pnpm db:migrate:prod` |
| Deploy shared/dev | `pnpm deploy:dev` |
| Deploy production | `pnpm deploy:prod` |
| Generate Cloudflare types | `pnpm cf-typegen` |

Useful Wrangler commands:

```bash
pnpm exec wrangler whoami
pnpm exec wrangler d1 list
pnpm exec wrangler r2 bucket list
pnpm exec wrangler types --env-interface CloudflareEnv ./cloudflare-env.d.ts
```
