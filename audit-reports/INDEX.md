# Audit index: 2026-11-22

[Executive summary](EXECUTIVE_SUMMARY.md) · [Fix plan](PRIORITIZED_FIX_PLAN.md) · [Production readiness](PRODUCTION_READINESS.md) · [Test results](AUTOMATED_TEST_RESULTS.md) · [Setup report](SETUP_REPORT.md)

| Critical | High | Medium | Low | Info |
|---|---|---|---|---|
| 0 | 1 (fixed) | 13 | 15 | 11 |

| ID | Severity | Confidence | Title | Priority | Report |
|---|---|---|---|---|---|
| SEC-01 | ~~High~~ **Fixed** | Verified | Demoted staff keep admin access to customer PII | done | [Security](SECURITY_AUDIT.md) |
| SEC-02 | Medium | Verified | `mfa_required` not enforced | P1 | [Security](SECURITY_AUDIT.md) |
| SEC-03 | Medium | Verified | Missing CSP/nosniff/frame headers; nginx inheritance | P1 | [Security](SECURITY_AUDIT.md) |
| SEC-05 | Medium | Verified | Plaintext PII in `whatsapp_queue` | P1 | [Security](SECURITY_AUDIT.md) |
| EC-01 | Medium | Verified | Card/InstaPay shown, COD always submitted | P1 | [E-commerce](ECOMMERCE_AUDIT.md) |
| EC-02 | Medium | Verified | Staff stock edits bypass inventory ledger | P1 | [E-commerce](ECOMMERCE_AUDIT.md) |
| EC-03 | Medium | Verified | Price/stock edits not audit-logged | P1 | [E-commerce](ECOMMERCE_AUDIT.md) |
| EC-04 | Medium | Verified | Returns restock automatically, refunds untracked | P2 | [E-commerce](ECOMMERCE_AUDIT.md) |
| BE-01 | Medium | Verified | Authorization scattered across route closures | P1 | [Backend](BACKEND_AUDIT.md) |
| ARCH-01 | Medium | Verified | Staff API as ~25 closures in one file | P1 | [Architecture](ARCHITECTURE_AUDIT.md) |
| ARCH-02 | Medium | Verified | No domain model for returns/refunds/adjustments | P2 | [Architecture](ARCHITECTURE_AUDIT.md) |
| FE-01 | Medium | Verified | Contrast + accessible-name violations on every page | P2 | [Frontend](FRONTEND_AUDIT.md) |
| OPS-02 | Medium | Verified | No backups / restore procedure | P1 | [DevOps](DEVOPS_AUDIT.md) |
| OPS-03 | Medium | Verified | No error tracking / alerting | P1 | [DevOps](DEVOPS_AUDIT.md) |
| SEC-04 | Low | Verified | Staff email enumeration via login message | P2 | [Security](SECURITY_AUDIT.md) |
| SEC-06 | Low | Verified | `env()` outside config | P3 | [Security](SECURITY_AUDIT.md) |
| EC-05 | Low | Untested | Last-item race not tested on PostgreSQL | P2 | [E-commerce](ECOMMERCE_AUDIT.md) |
| EC-06 | Low | Verified | No password reset | P2 | [E-commerce](ECOMMERCE_AUDIT.md) |
| DB-01 | Low | Verified | No FK / unique on variants | P2 | [Database](DATABASE_AUDIT.md) |
| DB-02 | Low | Verified | Stock ≥ 0 not enforced on PostgreSQL | P2 | [Database](DATABASE_AUDIT.md) |
| BE-02 | Low | Verified | Dead code + stray empty files | P3 | [Backend](BACKEND_AUDIT.md) |
| ARCH-03 | Low | Verified | No payment abstraction | P2 | [Architecture](ARCHITECTURE_AUDIT.md) |
| API-02 | Low | Verified | Mixed-language error messages | P3 | [API](API_AUDIT.md) |
| FE-04 | Low | Verified | No per-route meta / structured data | P3 | [Frontend](FRONTEND_AUDIT.md) |
| PERF-01 | Low | Verified | 4.8 MB unused PNGs shipped | P3 | [Performance](PERFORMANCE_AUDIT.md) |
| OPS-04 | Low | Verified | No image HEALTHCHECK | P2 | [DevOps](DEVOPS_AUDIT.md) |
| OPS-05 | Low | Verified | No migrate step; scheduler not run | P2 | [DevOps](DEVOPS_AUDIT.md) |
| OPS-06 | Low | Verified | CI permissions / pinning | P3 | [DevOps](DEVOPS_AUDIT.md) |
| OPS-07 | Low | Verified | Redis without auth | P3 | [DevOps](DEVOPS_AUDIT.md) |
| API-01 | (dup of SEC-01) | — | Inconsistent admin checks | — | [API](API_AUDIT.md) |
| SEC-07 | Info | Verified | Order tracking by UUID only | — | [Security](SECURITY_AUDIT.md) |
| EC-07 | Info | Verified | Discount can be 100% | — | [E-commerce](ECOMMERCE_AUDIT.md) |
| BE-03 | Info | Verified | Job dispatch inside transaction (fine for DB queue) | — | [Backend](BACKEND_AUDIT.md) |
| BE-04 | Info | Verified | README hash URLs outdated | — | [Backend](BACKEND_AUDIT.md) |
| DB-05 | Info | Verified | Price stored in JSON | — | [Database](DATABASE_AUDIT.md) |
| FE-03 | Info | Verified | Static `v-html` | — | [Frontend](FRONTEND_AUDIT.md) |
| API-03 | Info | — | No OpenAPI contract | — | [API](API_AUDIT.md) |
| PERF-02 | Info | Untested | Core Web Vitals not measured | P2 | [Performance](PERFORMANCE_AUDIT.md) |
| PERF-03 | Info | Untested | No production-like load test | P2 | [Performance](PERFORMANCE_AUDIT.md) |
| DEP-01/02 | Info | — | Range pins; enable Dependabot | — | [Dependencies](DEPENDENCY_AUDIT.md) |

Duplicates merged under one root cause: OPS-01 → SEC-03, FE-02 → EC-01, DB-03 → EC-02, DB-04 → SEC-05, API-01 → SEC-01.
