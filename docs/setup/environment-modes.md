# Environment Modes

`APP_ENV` controls the database path:

| APP_ENV | Database | Intended use |
| --- | --- | --- |
| `local` | Cloudflare local D1 binding if present, otherwise SQLite at `LOCAL_SQLITE_PATH` | Owner/local development |
| `shared` | Internal shared dev API only | Outside developers without Cloudflare access |
| `production` | Cloudflare D1 binding `env.DB` | Cloudflare production |

`STORAGE_MODE` controls storage except that `APP_ENV=production` always uses the R2 binding:

| STORAGE_MODE | Storage |
| --- | --- |
| `local` | Filesystem under `LOCAL_STORAGE_DIR` |
| `api` | Internal shared dev API |
| `r2-s3` | R2 S3-compatible dev credentials |
| `binding` | Cloudflare R2 binding `env.BUCKET` |

Outside developers should use `APP_ENV=shared`. Production uses bindings because they avoid public credential distribution, keep D1/R2 native to Workers, and are faster than routing production data through HTTP.
