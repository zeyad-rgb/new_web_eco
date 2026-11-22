---
name: backend-audit
description: Review the Laravel 13 backend of Studio Active - route/API architecture, business-logic placement, validation, error handling, caching, queues and jobs (WhatsApp notifications), configuration and static analysis results. Use for backend audits or reviewing backend changes.
---

# Backend audit

## Evidence
- `audit-reports/raw/larastan.log` (PHPStan level 5 via `backend/phpstan.neon`).
- `audit-reports/raw/backend-regression.log` (`php backend/tests/run.php`).
- Laravel Boost MCP: `last-error`, `read-log-entries`, `search-docs` (version-specific Laravel docs).

## Architecture
- Most staff API logic lives as closures in `backend/routes/web.php` (~500 lines). Assess testability, route caching (`route:cache` cannot serialize closures that `use` other closures? verify), and duplication (`dispatch-login` vs `login`).
- Services: `CheckoutPricing`, `OrderLifecycle`, `CustomerDirectory`, `WhatsAppService`; controllers `ShopController`, `CustomerAuthController`, `ProductEditorController`.
- No Eloquent models; Query Builder throughout — check that every write is validated.

## Checks
1. Validation on every input; `array:` key whitelists; integer money.
2. Error handling: JSON errors for `api/*` and `staff/*` (`bootstrap/app.php`); no stack traces with `APP_DEBUG=false`; `abort_unless` messages do not leak internals.
3. Caching: catalog cache bust after orders/staff edits (`ShopController::bustCatalogCache`); stale-price risk; cache store per environment (file locally, redis prod).
4. Queues: `SendOrderConfirmation` dispatched inside the order transaction (database queue) — confirm `afterCommit` semantics; retries/timeouts in `compose.yaml` worker; failed-job handling; idempotency of the WhatsApp send.
5. Config: `env()` used outside `config/` (breaks with `config:cache`); APP_DEBUG/LOG_LEVEL per env.
6. Static analysis: triage Larastan errors into real bugs vs. type noise.

Output: issues with `BE-` / `API-` IDs.
