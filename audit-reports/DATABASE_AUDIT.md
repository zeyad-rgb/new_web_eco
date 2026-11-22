# Database audit

Production: PostgreSQL 17 (`compose.yaml`). Local and tests: SQLite. This was a read-only review of 11 migrations plus the query sites. No database was modified, except the disposable `:memory:` and `e2e.sqlite` databases.

## What is good
- `orders.request_id` is UNIQUE, which gives idempotency at the database level.
- `inventory_movements` has UNIQUE `(order_id, sku, reason)`, so a cancel or return can't restore stock twice.
- Stock is decremented with a conditional `UPDATE … WHERE stock >= qty`, and order, lines, movements and job are written in one transaction with 3 retries.
- FKs on taxonomy (`categories.parent_slug` restrict, `product_media.product_id` cascade, collection membership cascade).
- Customer data and store settings are encrypted with `Crypt` (APP_KEY-bound).

## Findings

### DB-01 — `variants.product_id` has no foreign key and (product, color, size) is not unique
| Severity | Low | Confidence | Verified | Priority | P2 |
|---|---|---|---|---|---|
| Location | `backend/database/migrations/2026_11_15_000000_create_shop_tables.php:11-16` | Status | Open |
Orphan variants can survive a product deletion, and duplicate SKUs can exist for the same color and size. **Fix.** In a new migration (see the migration-safety skill), clean up orphans and add the FK `variants.product_id → catalog_products.id` (restrict) plus UNIQUE `(product_id, color, size)`.

### DB-02 — Non-negative stock is not enforced on PostgreSQL
| Severity | Low | Confidence | Verified | Priority | P2 |
|---|---|---|---|---|---|
`unsignedInteger('stock')` maps to plain `integer` on PostgreSQL (there are no unsigned types), so the database would accept negative stock. Today the application guards against it, but the database should too. **Fix.** `ALTER TABLE variants ADD CONSTRAINT variants_stock_nonneg CHECK (stock >= 0)` (PostgreSQL only, guarded by driver).

### DB-03 — The ledger can't record manual adjustments
`inventory_movements.order_id` is NOT NULL. This is the root cause of **EC-02**, so see that entry.

### DB-04 — PII duplicated in plaintext
`whatsapp_queue.customer_phone`, `customer_name` and `admin_send_url` store PII unencrypted. See **SEC-05**.

### DB-05 — `catalog_products.details` JSON holds the authoritative price
| Severity | Informational | Location | `ShopController.php:166-176` |
|---|---|---|---|
The price lives inside a JSON column, so it can't be indexed or constrained, and every order decodes JSON. That is fine at this scale. Consider a typed `price` column (integer piastres) with `CHECK (price > 0)` before adding reporting.

## Untested
- Indexes vs. query plans on PostgreSQL (`EXPLAIN ANALYZE`) were not run because no PostgreSQL instance is available locally.
- The backup and restore rehearsal has not been performed (see DEVOPS_AUDIT OPS-03).
