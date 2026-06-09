# Shared Dev Onboarding

Outside developers do not need Cloudflare account access. They should receive a private `.env.local` from the project owner.

Minimum shared database config:

```env
APP_ENV=shared
SHARED_API_BASE_URL=https://shared-dev-api.example.com
SHARED_API_TOKEN=replace-with-dev-token
```

Storage options:

```env
STORAGE_MODE=api
```

This routes uploads and downloads through the same authenticated shared dev API as database access. If the owner issues dev-bucket-only R2 S3 credentials, storage can also use:

```env
STORAGE_MODE=r2-s3
R2_ACCOUNT_ID=
R2_BUCKET_NAME=meera-dev-uploads
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
```

Run:

```bash
pnpm install
pnpm dev
```

Shared database access goes through typed internal endpoints such as `GET /internal/users` and `POST /internal/users`. There is no arbitrary SQL endpoint and no raw D1 credential.

Do not touch production D1, production R2, Cloudflare account settings, or production secrets. If the shared token is missing or expired, ask the owner for a rotated shared dev token.
