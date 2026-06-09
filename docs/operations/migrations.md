# Migrations

Schema source:

```txt
src/db/schema.ts
```

Generate migrations:

```bash
pnpm db:generate
```

Apply locally:

```bash
pnpm db:migrate:local
```

Apply shared/dev remote:

```bash
pnpm db:migrate:dev
```

Apply production remote:

```bash
pnpm db:migrate:prod
```

Production migrations should be reviewed and intentional. Do not run production migrations from an unreviewed branch.
