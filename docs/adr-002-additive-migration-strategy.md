# ADR-002: Additive Migration Strategy

## Status
Accepted

## Context
The development database had drift from Prisma migration history because prior schema changes were applied through `prisma db push` instead of `prisma migrate`. The database contains existing claims data that must not be lost.

Prisma's `migrate` commands detected drift and suggested `migrate reset`, which would destroy all data. This is unacceptable for a production-track database.

## Decision
Use an **additive-only migration strategy**:

1. **Never use `prisma migrate reset`** on the development or production database.
2. Apply schema changes using `prisma db push` (additive only — new tables, new nullable columns, new indexes).
3. Generate the Prisma client after each `db push`.
4. Run seed/backfill scripts to populate new reference data (process statuses, etc.).
5. Create manual migration SQL artifacts for provenance and fresh-environment setup.
6. All new fields are **nullable** to preserve backward compatibility with existing rows.
7. Foreign keys use `SET NULL` or `CASCADE` as appropriate to avoid orphaned references.

## Consequences
- Migration history and actual database state are not perfectly aligned
- Fresh environments require both `prisma db push` and seed scripts
- The manual migration SQL may include state beyond the intended additive changes and must be reviewed before use in production
- Future schema changes should use `prisma migrate dev` to establish a clean migration baseline once the drift is resolved

## Implementation
- Schema changes in `server/prisma/schema.prisma`
- Seed script: `server/prisma/seed.ts`
- Manual migration artifact: `server/prisma/migrations/` directory
- `db push` applied to both development (`claims_solutions`) and test (`claims_solutions_test`) databases

## Safety measures
- The legacy workbook file is excluded from Git (`.gitignore`)
- `db push --accept-data-loss` was used only for nullable unique constraints (MySQL permits multiple NULLs in unique indexes)
- Backups are taken before schema changes (`backup-mysql.ps1`)
