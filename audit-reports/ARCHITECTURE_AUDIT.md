# Architecture audit

## Current shape
```
Browser (Vue 3 SPA, Pinia, history router, RTL Arabic)
   │  same origin: /api /staff /customer /media /checkout/quote
   ▼
nginx ──► php-fpm (Laravel 13, Query Builder, session + CSRF)
               ├── PostgreSQL 17 (orders, variants, catalog JSON, encrypted PII)
               ├── Redis (cache, sessions)
               └── database queue ─► worker ─► WhatsApp (manual links)
```
Modules match the README plan (catalog, inventory, orders, identity), but they live in routes and three controllers rather than separate modules.

## Strengths
- The server is authoritative for price, stock and totals, and idempotency is enforced at the database level.
- Same-origin cookie sessions with CSRF suit a first-party SPA.
- Integer money, encrypted customer data, and a lean dependency set (only `laravel/framework` in production) keep the attack surface small.

## Findings

### ARCH-01 — Staff API implemented as ~25 route closures in one file
| Severity | Medium | Priority | P1 | Related | BE-01, SEC-01 |
|---|---|---|---|---|---|
With authorization repeated per closure, inconsistencies creep in (SEC-01 is the proof). Move to controllers plus route-group middleware (`staff`, `staff.admin`), and adopt Laravel Policies as the README plans.

### ARCH-02 — No domain model for returns, refunds, or stock adjustments
| Severity | Medium | Priority | P2 | Related | EC-02, EC-04 |
|---|---|---|---|---|---|
Stock changes outside orders and post-delivery money flows have no tables, so they can't be reconciled or audited.

### ARCH-03 — Payment abstraction missing
| Severity | Low | Priority | P2 | Related | EC-01 |
|---|---|---|---|---|---|
`payment_method` is a fixed `in:cod` rule while the UI and settings list four methods. Before adding a gateway, introduce a `PaymentMethod` interface plus a webhook controller with signature checks and an idempotent event table. The README already calls for event deduplication.
