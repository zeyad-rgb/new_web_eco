---
name: database-audit
description: Review Studio Active's database layer - schema design, keys and constraints, indexes vs. actual queries, transaction and locking correctness, data integrity (stock, orders, inventory_movements), and PostgreSQL/SQLite portability. Use for database audits, slow-query work, or integrity checks.
---

# Database audit

Production target is PostgreSQL 17; local and tests use SQLite. Inspection is READ-ONLY. Never run `migrate:fresh|reset|rollback`, `db:wipe`, DROP or TRUNCATE (the project guard hook blocks them). Never connect to a production database.

## Sources
- Schema: `backend/database/migrations/*.php` (read in order; later migrations alter earlier tables).
- Live local schema: Laravel Boost MCP `database-schema` tool, or `php backend/artisan db:show` / `db:table <name>`.
- Read-only queries: Boost `database-query` (SELECT only) against the local SQLite DB.
- Query sites: `grep -rn "DB::table" backend/app backend/routes`.

## Checks
1. **Keys & constraints** — PKs, FKs (`variants.product_id`, `orders.customer_id`, `inventory_movements.order_id`), UNIQUE (`sku`, `orders.request_id`), NOT NULL, CHECK `stock >= 0`. Missing DB-level constraint where code relies on it = finding.
2. **Indexes vs. queries** — for each `where/orderBy/join` column in hot paths (catalog, order, staff lists), confirm an index exists. Flag unused or duplicate indexes.
3. **Transactions & locks** — `ShopController::order`: insertOrIgnore idempotency, conditional decrement (`stock >= qty`), `sharedLock` behaviour on SQLite (no-op) vs PostgreSQL. `OrderLifecycle::transition`: restores stock exactly once.
4. **Integrity reconciliation** (read-only SQL): `variants.stock` vs. sum of `inventory_movements`; orders with `total = 0` or `lines = '[]'`; orphan variants; negative stock.
5. **JSON columns** — `catalog_products.details` holds price; check price is integer piastres and validated on write.
6. **Encryption** — `orders.customer` and settings are encrypted; APP_KEY rotation impact.
7. **Portability** — raw SQL, `json_extract` vs `->>`, boolean handling, case-sensitive LIKE.

## Migration changes
For any new or edited migration, also apply the `migration-safety` skill.

Output: issues with `DB-` IDs in the report template.
