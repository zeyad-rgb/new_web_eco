# Studio Active — Claude Code guide

Arabic-first (RTL) sportswear storefront with a staff back office. Temporary project name; catalog is sample data.

## Architecture
- **frontend/** — Vue 3 + TypeScript + Vite + Pinia (`pinia-plugin-persistedstate`), vue-router. Storefront views in `src/views/`, staff UI in `src/Admin.vue` / `ProductEditor.vue`. Dev proxy (`vite.config.ts`) forwards `/api /staff /customer /media /checkout/quote` to Laravel (`VITE_API_TARGET`, default `http://127.0.0.1:8008`).
- **backend/** — Laravel 13 / PHP 8.4, Query Builder (no Eloquent models). Public API in `routes/api.php` (`/api/v1/products`, `/orders`, `/orders/track`); staff API as closures in `routes/web.php` under `/staff`; customer auth in `CustomerAuthController`. Services: `CheckoutPricing`, `OrderLifecycle`, `CustomerDirectory`, `WhatsAppService`; job `SendOrderConfirmation`.
- **Data** — PostgreSQL 17 in production, SQLite locally/tests. Money is integer piastres. Stock per SKU in `variants`; `inventory_movements` ledger; orders idempotent by `request_id`; customer contact data encrypted.
- **Payments** — cash on delivery only. No online gateway, webhooks, or refunds exist.
- **Auth** — session cookies + CSRF (`X-CSRF-TOKEN`). Staff roles `admin`, `catalog_manager` (`catalog_staff` table). Customers in `customers`.
- **Deploy** — `deploy/Dockerfile` (node build → php-fpm → nginx), `compose.yaml` (app, worker, web, postgres, redis), CI `.github/workflows/checks.yml`.

## Commands
| Task | Command |
|---|---|
| Backend regression tests (in-memory SQLite) | `php backend/tests/run.php` |
| Static analysis (Larastan level 5) | `cd backend && vendor/bin/phpstan analyse` |
| Frontend typecheck + build | `cd frontend && npm run build` |
| E2E (Playwright + axe, disposable `backend/database/e2e.sqlite`, ports 8018/5183) | `cd frontend && npm run test:e2e` |
| Full automated audit → `audit-reports/raw/` | `python tools/audit/run_audit.py` (`--list`, or a group: `security backend frontend deps e2e perf`) |
| Local k6 smoke | `k6 run tools/audit/k6-smoke.js` (`K6_BASE_URL`, local only) |
| Dev servers | `cd backend && php artisan serve --port=8008` · `cd frontend && npm run dev` |

Security tools on PATH: `gitleaks`, `trivy`, `semgrep`, `k6`. Docker is installed but the daemon is often not running.

## Conventions
- PHP: `declare`-free compact style exists in places; match the surrounding file. Validate every request with explicit keys (`array:sku,quantity`). Integer money only. Wrap stock/order writes in `DB::transaction` with conditional updates.
- Vue: `<script setup lang="ts">`, Pinia stores in `src/stores/`, RTL-safe CSS (logical properties). No `v-html` with user or staff content.
- Every non-GET request from the SPA sends `X-CSRF-TOKEN`.

## Safety rules (enforced partly by `.claude/hooks/`)
- Never read or edit `.env`, `backend/.env`, `.env.production`. Never commit secrets.
- Never run `migrate:fresh|reset|rollback`, `db:wipe`, DROP/TRUNCATE against any non-disposable database. Only `backend/database/e2e.sqlite` and `:memory:` are disposable.
- Never connect to or modify production data; never deploy; never force-push or push to `main`.
- Security testing is local and non-destructive. No active ZAP scans, fuzzing, or load above the k6 smoke without explicit user approval and a non-production target.
- New/edited migrations follow `.claude/skills/migration-safety`.

## Git workflow
Feature branches (`feat/…`, `fix/…`, `chore/…`) → PR into `main`. Small commits with clear messages. Business-logic changes need user approval first; implement on a branch with regression tests.

## Definition of Done
1. Change is covered by a regression test (`backend/tests/run.php` and/or `frontend/e2e`) that failed before the fix.
2. `php backend/tests/run.php` passes (the Stop hook runs it automatically when backend code changed).
3. `npm run build` passes for frontend changes; E2E run for UI/checkout/auth changes.
4. No new gitleaks/semgrep findings in touched files.
5. Results reported honestly: anything skipped or failing is stated.

## Skills and agents
Skills (`.claude/skills/`): `full-ecommerce-audit` (orchestrator), `security-audit`, `database-audit`, `migration-safety`, `backend-audit`, `ecommerce-testing`, `frontend-audit`, `performance-audit`, `web-perf` (Cloudflare), `deployment-readiness`, `regression-testing`.
Agents (`.claude/agents/`, all read-only reviewers): `security-auditor`, `database-engineer`, `backend-reviewer`, `ecommerce-logic-reviewer`, `frontend-qa`, `devops-reviewer`. Run them in parallel for audits; the main session coordinates, de-duplicates, and verifies Critical/High findings. Code review and architecture design come from the `code-review`, `pr-review-toolkit`, and `feature-dev` plugins.
Audit reports: `audit-reports/INDEX.md`.
