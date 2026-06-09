# Troubleshooting

| Problem | Likely cause | Fix |
| --- | --- | --- |
| `DB` binding missing | Running plain `next dev` with production/binding mode | Use `pnpm dev:cf` or `APP_ENV=local` |
| `BUCKET` binding missing | `STORAGE_MODE=binding` without Wrangler/OpenNext preview | Use `STORAGE_MODE=local` locally or run `pnpm dev:cf` |
| Shared API 401/403 | Missing or expired token | Request a rotated `SHARED_API_TOKEN` |
| R2 S3 error | Wrong endpoint, bucket, or dev credential | Verify all `R2_*` values point to dev bucket only |
| D1 migration fails | Wrong database name or remote/local flag | Check commands in [commands](../reference/commands.md) |
| Local SQLite install error | Native build script not approved | Run `pnpm approve-builds` and approve `better-sqlite3` |
| Confusing data source | Wrong `APP_ENV` or `STORAGE_MODE` | Call `/api/health` |
