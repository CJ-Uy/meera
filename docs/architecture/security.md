# Security

Outside developers are not added to the Cloudflare account because they do not need production infrastructure access to build app features.

Security rules:

- Do not give outside developers raw D1 credentials.
- Do not create arbitrary SQL endpoints.
- Do not expose production R2 credentials.
- Use shared dev API tokens for typed app operations.
- Use dev-bucket-only R2 S3 credentials only when needed.
- Keep production on Cloudflare bindings for native, non-public access.
- Never commit `.env.local`, `.env.*.local`, `.dev.vars`, API tokens, or generated secrets.
