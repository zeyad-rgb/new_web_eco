---
name: ecommerce-testing
description: Verify Studio Active's commerce rules end to end - pricing and discounts, shipping, checkout, cash-on-delivery payment, inventory reservation/deduction/restoration, overselling and concurrency, idempotency, order lifecycle and cancellation, returns/refunds, and admin catalog/stock edits. Use when testing or changing checkout, pricing, stock, orders, or discounts.
---

# E-commerce testing

## Current business model (verify before testing — it may change)
- Payment: **cash on delivery only** (`payment_method in:cod`). No online gateway, so no webhooks/refund API exist. The checkout UI also shows card/InstaPay options — confirm what the user sees vs. what is submitted.
- Prices: integer piastres in `catalog_products.details.price`; server computes totals (`CheckoutPricing::quote`), discounts from `store_settings.discounts`, shipping from `store_settings.shipping`.
- Stock: per SKU in `variants.stock`; movements in `inventory_movements`; staff stock edits use optimistic concurrency (409 when original counts differ).
- Orders: idempotent by `request_id` + fingerprint; lifecycle in `OrderLifecycle` (processing → shipped → delivered, cancel restores stock once).

## Where tests live
- Backend business rules: `backend/tests/run.php` (in-memory SQLite, fast). Add a `check(...)` line per rule.
- Browser + API journeys: `frontend/e2e/*.spec.ts` (Playwright, disposable `e2e.sqlite`). Run: `cd frontend && npx playwright test`.

## Required scenarios (mark each Covered / Missing in ECOMMERCE_AUDIT.md)
Pricing: server ignores client prices · discount min_spend · inactive/unknown code · free-shipping threshold · rounding.
Inventory: decrement on order · overselling 409 · last-item race (two concurrent orders; PostgreSQL only — SQLite serializes) · cancel restores once · staff edit conflict 409 · reconciliation `stock == initial + Σmovements`.
Orders: idempotent retry · same key different body 409 · invalid transitions 409 · tracking reveals only masked PII.
Payment (COD): non-COD rejected · order total == quote total.
Returns/refunds: no implementation exists → report as a gap, not a pass.
Admin: RBAC per role · audit_events written for price/stock/status/settings changes.

Never use real customer data or real payment credentials. Never run these against production.
