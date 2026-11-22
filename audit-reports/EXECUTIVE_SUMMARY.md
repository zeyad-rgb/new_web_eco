# Executive summary

**Studio Active** is a Vue 3 storefront with a Laravel 13 API, PostgreSQL and Redis, using cash-on-delivery checkout. This audit ran on 2026-11-22 on branch `chore/claude-engineering-setup`. It was local and non-destructive.

## Bottom line
The money path works as designed. Prices are computed on the server, overselling is blocked, retries don't double-charge stock, and cancellations restore stock exactly once. **87 automated checks** prove this: 38 backend and 49 browser/API tests. Dependencies and git history are clean.

The one **High** access-control bug is fixed (pending merge). Before launch, add backups and monitoring. Also stop offering card and InstaPay at checkout, because every order is actually placed as cash on delivery.

## Findings by severity
| Critical | High | Medium | Low | Info |
|---|---|---|---|---|
| 0 | 1 (fixed) | 13 | 15 | 11 |

## Top 5
1. **SEC-01 (High), fixed.** A demoted admin could still read all customer orders and PII. Fixed on `fix/sec-01-stale-staff-role` with 12 new regression checks.
2. **EC-01 (Medium).** Checkout shows card and InstaPay but always places a COD order.
3. **SEC-03 (Medium).** No CSP, and nginx drops security headers on the storefront HTML.
4. **OPS-02 / OPS-03 (Medium).** No backups or restore procedure, and no error tracking or alerts.
5. **SEC-02 (Medium).** The staff `mfa_required` flag is ignored, so logins need only a password.

## Coverage honesty
- **Not run:** Semgrep locally (crashes on native Windows; now runs in CI), OWASP ZAP (needs Docker), Core Web Vitals (needs a Claude Code restart to load the Chrome DevTools MCP), a production-like load test, and a PostgreSQL concurrency test.
- **Not applicable:** payment gateway, webhooks and refund API, because they don't exist yet.

See [PRIORITIZED_FIX_PLAN.md](PRIORITIZED_FIX_PLAN.md) for the ordered fixes and [INDEX.md](INDEX.md) for every issue.
