# Cloudflare Resources

Project slug: `meera`.

| Resource | Name | Binding | Purpose |
| --- | --- | --- | --- |
| D1 dev database | `meera-dev-db` | `DB` in dev/default Wrangler envs | Shared/dev and local Cloudflare preview data |
| D1 production database | `meera-prod-db` | `DB` in production | Production relational data |
| R2 dev bucket | `meera-dev-uploads` | `BUCKET` in dev/default Wrangler envs | Shared/dev upload storage |
| R2 production bucket | `meera-prod-uploads` | `BUCKET` in production | Production upload storage |
| Shared dev API Worker | `meera-shared-dev-api` | `DB`, `BUCKET` | Authenticated typed API for outside developers |

Shared dev API URL:

```txt
https://meera-shared-dev-api.cj-uy.workers.dev
```

Outside developers receive `SHARED_API_BASE_URL` and `SHARED_API_TOKEN`. They should never receive production D1 access or production R2 credentials.
