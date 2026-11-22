# Automated test results

Run: 2026-11-22 via `python tools/audit/run_audit.py` (raw output in `audit-reports/raw/`, git-ignored).

| Stage | Status | Detail |
|---|---|---|
| backend-regression (`php backend/tests/run.php`) | ✅ passed | 38/38 checks, 3.6 s |
| larastan (level 5) | ⚠ findings | 20 errors, triaged in BACKEND_AUDIT.md |
| frontend-typecheck-build (`vue-tsc` + `vite build`) | ✅ passed | 8.3 s |
| composer-audit | ✅ passed | 0 advisories |
| npm-audit | ✅ passed | 0 vulnerabilities |
| gitleaks-history | ✅ passed | 0 leaks in git history |
| gitleaks-worktree | ✅ passed | 0 leaks (generated caches allow-listed) |
| semgrep | ⏭ **skipped** | semgrep-core crashes on native Windows; runs in CI `security.yml` |
| trivy-fs | ⚠ findings | 1 LOW misconfig (Dockerfile HEALTHCHECK), 0 vulns, 0 secrets |
| e2e-playwright | ✅ passed | 49 tests: 48 passed + 1 expected failure (SEC-03 tracked with `test.fail`), 84 s |
| k6-smoke | ⚠ findings | thresholds crossed against the single-threaded dev server; see PERFORMANCE_AUDIT.md |

## Playwright breakdown
| Spec | Tests | Result |
|---|---|---|
| `storefront.spec.ts` | 14 routes × desktop + 14 × mobile + 2 API/404 | ✅ all pass: no console errors, no failed requests, no horizontal scroll |
| `accessibility.spec.ts` | 6 routes | ✅ no critical axe violations (serious ones recorded → FE-01) |
| `checkout-journey.spec.ts` | product → color/size → add → checkout form → COD order 201 → receipt | ✅ pass |
| `api-security.spec.ts` | RBAC (6), CSRF (2), price tampering + idempotency, overselling, non-COD rejection, headers | ✅ pass; headers test is the expected failure for SEC-03 |

## Not run
- OWASP ZAP baseline: not installed (needs Docker Desktop or Java).
- Lighthouse / Core Web Vitals: tools installed, needs a Claude Code restart to load the Chrome DevTools MCP (PERF-02).
- `backend/tests/verify_{cache,queue_reliability,rate_limits}.php`, `latency_breakdown.php`: existing scripts, not part of this run.
- PostgreSQL concurrency test (EC-05).
