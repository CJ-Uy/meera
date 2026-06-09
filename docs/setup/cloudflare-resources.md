# Cloudflare Resources

Project slug: `meera`.

| Resource | Name | Binding | Purpose |
| --- | --- | --- | --- |
| D1 dev database | `meera-dev-db` | `DB` in dev/default Wrangler envs | Shared/dev and local Cloudflare preview data |
| D1 production database | `meera-prod-db` | `DB` in production | Production relational data |
| R2 dev bucket | `meera-dev-uploads` | `BUCKET` in dev/default Wrangler envs | Shared/dev upload storage |
| R2 production bucket | `meera-prod-uploads` | `BUCKET` in production | Production upload storage |

Outside developers may receive shared API credentials or dev-bucket-only R2 S3 credentials. They should never receive production D1 access or production R2 credentials.
