---
name: regression-testing
description: How to add and run regression tests in Studio Active - backend checks in backend/tests/run.php, browser/API tests in frontend/e2e, and test-coverage gap analysis. Use whenever fixing a bug, changing business logic, or asked about test coverage.
---

# Regression testing

## Test layers
| Layer | File(s) | Run | Database |
|---|---|---|---|
| Backend rules | `backend/tests/run.php` | `php backend/tests/run.php` | in-memory SQLite |
| Reliability probes | `backend/tests/verify_*.php` | `php backend/tests/verify_cache.php` etc. | read the file first |
| Browser + API E2E | `frontend/e2e/*.spec.ts` | `cd frontend && npx playwright test` | `backend/database/e2e.sqlite` (rebuilt each run) |
| Types + build | `frontend` | `npm run build` | — |

E2E starts its own servers on ports 8018 (Laravel) and 5183 (Vite), so it does not collide with a running dev stack on 8008/8009/5173. Failures save trace + screenshot under `audit-reports/raw/playwright-artifacts/`; open with `npx playwright show-trace <zip>`.

## Workflow for a bug fix (TDD)
1. Write the failing check first (`check(<condition>, '<rule>')` in run.php, or a Playwright test).
2. Run it and confirm it fails for the right reason.
3. Fix the code; rerun the single test, then the full layer.
4. If a test documents a known open issue, use `test.fail(true, '<ISSUE-ID>: reason')` so the suite stays green and flips when fixed.

## Coverage gap analysis
There is no line-coverage tool configured (no PHPUnit/Pest). Assess coverage by mapping each business rule in the `ecommerce-testing` skill to a test, and list uncovered rules. Recommend Pest + Xdebug/PCOV only if the user wants line coverage.

Never mark work done if a test was skipped or failed; report it.
