# Adapters

Database interface:

```ts
listUsers()
createUser(input)
getUserById(id)
```

Storage interface:

```ts
putObject(input)
getObject(key)
deleteObject(key)
```

Adapter choices:

| Mode | Database adapter | Storage adapter |
| --- | --- | --- |
| Local without bindings | `local-sqlite` | `local-fs` |
| Local with bindings | `d1` | `r2-binding` when `STORAGE_MODE=binding` |
| Shared outside dev | `shared-api` | `shared-api`, `r2-s3`, or `local-fs` |
| Production | `d1` | `r2-binding` |

To add an adapter, implement the interface in `src/db/adapters` or `src/storage/adapters`, then update the selector in `index.ts`.
