# Restaurant Menu Operations Runbook

## Migrations

- Run all migrations: npm run db:migrate
- Undo last migration: npm run db:migrate:undo
- Undo all migrations: npm run db:migrate:undo:all

## Seed Operations

- Run all seeders: npm run db:seed
- Undo all seeders: npm run db:seed:undo

## Rollback Strategy

1. Stop deploy rollout if migration introduces failures.
2. Undo latest migration.
3. Restore previous API deployment.
4. Validate critical menu endpoints.

## Troubleshooting

- Migration failed due to existing index name:
  - Verify index naming collisions and drop stale indexes manually in non-production.
- FK constraint errors:
  - Ensure migration order: categories -> items -> sizes.
- Missing model registration:
  - Confirm new models are listed in src/lib/infra/database/database.module.ts.
