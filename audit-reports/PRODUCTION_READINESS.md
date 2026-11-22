# Production readiness

**Verdict: not ready for production yet.** The core checkout is solid and well tested. Blockers are one access-control bug (SEC-01), missing operational safety nets (backups, monitoring), and the misleading payment options.

| Area | Status | Blocking items |
|---|---|---|
| Checkout correctness (pricing, stock, idempotency) | 🟢 ready | — |
| Authentication | 🟡 | SEC-02 (MFA not enforced) |
| Authorization | 🔴 | SEC-01 |
| Transport & headers | 🟡 | SEC-03 |
| Customer-facing honesty | 🔴 | EC-01 |
| Data protection | 🟡 | SEC-05 |
| Inventory auditability | 🟡 | EC-02, EC-03 |
| Returns / refunds | 🟡 | EC-04 (manual process acceptable at launch if documented) |
| Backups & restore | 🔴 | OPS-02 |
| Monitoring & alerting | 🔴 | OPS-03 |
| Dependencies | 🟢 | — |
| Secrets hygiene | 🟢 | — |
| Accessibility | 🟡 | FE-01 |
| Performance | ⚪ unknown | PERF-02, PERF-03 not measured |
| SAST | ⚪ unknown | Semgrep's first CI run pending |

## README launch checklist vs. reality
| README requirement | State |
|---|---|
| Dependency audits | ✅ done, clean |
| Authorization and checkout tests | ✅ present (38 backend checks + 49 E2E); SEC-01 gap found |
| Representative load tests | ❌ not run (dev server only) |
| Backup restore rehearsal | ❌ not done |
| Debug off, secrets outside source control | ✅ example config + gitleaks clean |
| Staff MFA | ❌ flag exists, not enforced |
| Webhook signature and replay protection | n/a (no gateway yet) |
