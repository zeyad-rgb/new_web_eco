---
name: migration-safety
description: Checklist to apply whenever a Laravel migration in backend/database/migrations is created or edited - reversibility, zero data loss, lock impact on PostgreSQL, and SQLite compatibility for tests.
---

# Migration safety

1. **Never edit a migration that has run in any shared environment.** Add a new one.
2. `down()` must reverse `up()` exactly, without losing data that existed before `up()`.
3. No destructive change in one step: rename/drop column → add new, backfill, switch code, drop in a later release.
4. Adding NOT NULL to an existing table needs a default or a backfill first.
5. PostgreSQL locks: create indexes on large tables in a separate migration; avoid long `ALTER TABLE` rewrites during traffic.
6. Must run on SQLite (tests use `:memory:`) and PostgreSQL. Avoid driver-specific SQL unless guarded by `DB::getDriverName()`.
7. Data migrations that read `frontend/public/products.json` must be idempotent (`insertOrIgnore` / `updateOrInsert`).
8. Verify: `php backend/tests/run.php` (migrates in-memory SQLite) and `cd frontend && npx playwright test` (migrates `e2e.sqlite`). Both must pass.
9. Never run migrations against production from Claude. Deployment runs them.
