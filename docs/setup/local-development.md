# Local Development

Install:

```bash
pnpm install
```

Plain local dev:

```bash
pnpm dev
```

Cloudflare/OpenNext preview:

```bash
pnpm dev:cf
```

Plain `next dev` uses `APP_ENV=local` and falls back to SQLite plus local files when bindings are unavailable. Cloudflare preview can use the Wrangler local binding simulation for `DB` and `BUCKET`.

Reset local fallback state:

```bash
Remove-Item -Recurse -Force .local
```

Common mistakes:

| Symptom | Check |
| --- | --- |
| Missing binding error | Use `pnpm dev:cf` or set `STORAGE_MODE=local` |
| SQLite native module error | Run `pnpm approve-builds` and approve `better-sqlite3` if needed |
| Empty database | Run `pnpm db:migrate:local` |
| Wrong resources | Check `APP_ENV` and `STORAGE_MODE` in `.env.local` |
