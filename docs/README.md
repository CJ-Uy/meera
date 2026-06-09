# Meera Docs

This folder explains how Meera runs as one Next.js App Router codebase across local development, shared outside-developer development, and Cloudflare production.

Start here:

| Role | Read first |
| --- | --- |
| Project owner | [setup overview](setup/overview.md), [Cloudflare resources](setup/cloudflare-resources.md), [production deploy](setup/production-deploy.md) |
| Outside developer | [shared dev onboarding](setup/shared-dev-onboarding.md), [env vars](reference/env-vars.md) |
| Backend developer | [adapters](architecture/adapters.md), [database](architecture/database.md), [storage](architecture/storage.md) |
| Future AI coding agent | [architecture overview](architecture/overview.md), [commands](reference/commands.md), [troubleshooting](operations/troubleshooting.md) |

Core rule: app feature code uses `getDatabaseAdapter()` and `getStorageAdapter()`. Cloudflare binding access stays isolated in server infrastructure and adapter code.
