# Storage

Production storage uses the R2 binding:

```txt
env.BUCKET.put(key, body)
```

Storage modes:

| Mode | Path |
| --- | --- |
| `binding` | Cloudflare R2 binding |
| `r2-s3` | R2 S3-compatible dev credentials |
| `api` | Internal shared dev API |
| `local` | Filesystem under `.local/uploads` |

Upload flow:

1. `POST /api/uploads` accepts multipart `file` or a raw request body.
2. The route generates a storage key.
3. The active storage adapter writes the object.
4. `GET /api/uploads/[key]` streams it back.

In shared outside-dev mode, those adapter calls forward to the deployed dev Worker's authenticated `/internal/uploads` endpoints, which then use the dev `BUCKET` binding.
