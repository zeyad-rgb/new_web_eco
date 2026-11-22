# Prioritized fix plan

Nothing below has been changed. Each item needs your approval before it touches application behaviour (CLAUDE.md, Phase 14). Fixes go on a branch such as `fix/<id>`, with a regression test written first.

## P0: now
| # | ID | Fix | Regression test | Effort |
|---|---|---|---|---|
| 1 | ✅ SEC-01 (fixed, branch `fix/sec-01-stale-staff-role`) | Use the DB role (`$staff($request)?->role`) in `/staff/orders`, `/staff/customers`, `/staff/whatsapp-queue` | run.php: demote admin, expect 403 on all three | 15 min |

## P1: before launch
| # | ID | Fix | Test | Effort |
|---|---|---|---|---|
| 2 | BE-01 / ARCH-01 | `staff` and `staff.admin` middleware on route groups; remove per-closure role checks | loop over all admin routes as catalog_manager → 403 | 2–3 h |
| 3 | SEC-03 / OPS-01 | `deploy/security-headers.conf` included in every nginx location; CSP; HSTS at TLS proxy; optional Laravel middleware | remove `test.fail` in api-security.spec; CI `curl -I` on the built image | 1 h |
| 4 | EC-01 | Show only COD at checkout until a gateway exists | E2E: rendered methods == accepted methods | 30 min |
| 5 | SEC-02 | Block logins for `mfa_required` accounts, then implement TOTP | run.php: mfa_required login without OTP → no session | ½–1 day |
| 6 | SEC-05 | Encrypt PII in `whatsapp_queue`, retention purge | run.php: column ≠ raw phone | 1 h |
| 7 | EC-02 / DB-03 | Nullable `order_id`, `actor_email`; write `adjustment` movements on staff stock edits | run.php: edit 5→7 ⇒ one +2 movement | 1–2 h |
| 8 | EC-03 | Audit price and stock changes | run.php: audit row after save | 30 min |
| 9 | OPS-02 | Nightly `pg_dump` + media archive, documented restore, rehearsal | restore into a scratch DB, run smoke E2E | ½ day |
| 10 | OPS-03 | Error tracking + uptime + failed-jobs alert | trigger a test exception, confirm alert | 2 h |

## P1 additions (customer page and performance, 2026-11-22)
| ID | Fix | Test | Effort |
|---|---|---|---|
| CUST-01 | Route guard for `/profile`, remove demo fallbacks | drop `test.fail` in customer-account.spec | 30 min |
| CUST-02 | One shipping threshold from settings everywhere; drop the member-only claim | E2E text == quote API | 1 h |
| CUST-05 | Password reset via Laravel password broker + mail | E2E reset flow on E2E DB | ½ day |
| PERF-02 | Preload hero, responsive WebP `srcset`, trim fonts | re-trace: mobile LCP < 2.5 s | 2–3 h |
| PERF-04 | nginx `gzip on` / `gzip_static` | `curl -H 'Accept-Encoding: gzip' -I` shows `Content-Encoding` | 15 min |

## P2: soon after
SEC-04 (one login message), EC-04 (returns/refunds model), EC-05 (PostgreSQL concurrency test in CI), EC-06 (password reset), DB-01/DB-02 (FK, unique, CHECK), FE-01 (contrast and labels), OPS-04/05 (healthchecks, migrate step, scheduler), PERF-02/03 (CWV + production-like load test), E2E in CI.

## P3: backlog
SEC-06 (config for rate limits), BE-02 (dead code and stray files), API-02/03 (i18n errors, OpenAPI), FE-04 (SEO meta and JSON-LD), PERF-01 (remove 4.8 MB of PNGs), OPS-06/07, DEP-02.
