# Backend audit (Laravel 13 / PHP 8.4)

Evidence: `php backend/tests/run.php` → **38/38 checks passed** (3.6 s). Larastan level 5 → **20 errors**, triaged below. `php artisan route:cache` → succeeds (closure routes are cacheable; cleared afterwards).

## Larastan triage
| Category | Count | Locations | Verdict |
|---|---|---|---|
| Unnecessary nullsafe `?->` before `??` | 7 | `CustomerAuthController.php:11`, `ProductEditorController.php:131`, `web.php:54,68,224,332` | style, no bug |
| `abort_unless(object\|null)` | 4 | `OrderLifecycle.php:8`, `web.php:218,352,486` | works (truthy), type noise |
| `env()` outside config | 4 | `AppServiceProvider.php:27,31,47,53` | → SEC-06 |
| Dead code | 2 | `ShopController.php:14` (`SHIPPING`), `:18` (`products()`) | BE-02 |
| Always-true / always-exists | 3 | `web.php:69`, `ShopController.php:248`, `CustomerDirectory.php:42` | redundant checks |
| Unused closure `use ($logAudit)` | 1 | `web.php:192` | fine: `OrderLifecycle` audits itself |

## Findings

### BE-01 — Authorization is scattered across ad-hoc closures
| Severity | **Medium** | Confidence | Verified | Priority | P1 |
|---|---|---|---|---|---|
| Location | `backend/routes/web.php` (≈500 lines, ~25 staff routes) | Status | Open |

Each route does its own role check. Three of them use a different source (the session instead of the DB), which caused **SEC-01**. **Fix.** Add two middleware aliases (`staff`, `staff.admin`) that resolve the staff user once from the DB, and apply them to route groups. Then move the closures into controllers (`StaffOrderController`, `StaffCatalogController`, …). **Test.** Add a route-level test that loops over every `/staff/*` admin route as a catalog_manager and expects 403.

### BE-02 — Dead code and stray files
| Severity | Low | Priority | P3 |
|---|---|---|---|
`ShopController::SHIPPING` and `ShopController::products()` are unused. Three empty files, `backend/cd`, `backend/composer` and `backend/php`, are tracked in git. They are likely the result of a mistyped shell redirect. Remove them.

### BE-03 — Order confirmation job is dispatched inside the transaction
| Severity | Informational | Location | `ShopController.php:183` |
|---|---|---|---|
With `QUEUE_CONNECTION=database`, the job row commits atomically with the order, which is good. If the queue moves to Redis, the job could run before commit. **Fix when switching.** Use `->afterCommit()` on the dispatch.

### BE-04 — README describes hash URLs, but the router uses history mode
| Severity | Informational | Location | `README.md:98,105`; `frontend/src/router/index.ts:137` (`createWebHistory`) |
|---|---|---|---|
The documentation is out of date. Update the staff and category URL examples.
