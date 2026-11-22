---
name: security-audit
description: Security review of Studio Active covering OWASP Top 10, authentication (customer + staff), authorization/RBAC and IDOR, CSRF, sessions, secrets exposure, file uploads, mass assignment, rate limiting, security headers, and dependency vulnerabilities. Use for any security audit, auth change review, or before release.
---

# Security audit

Scope is this repo and LOCAL environments only (`127.0.0.1`). Never run active scans (ZAP active/full scan, fuzzing, brute force) against staging or production without written authorization from the user.

## Evidence first
Read existing raw output before re-running tools: `audit-reports/raw/{semgrep,trivy-fs,gitleaks-history,gitleaks-worktree}.json`, `composer-audit.log`, `npm-audit.log`, `e2e-playwright.log`.
Re-run one group with `python tools/audit/run_audit.py security`.

## Checklist (Studio Active specifics)
| Area | Where to look | What to verify |
|---|---|---|
| Staff auth | `backend/routes/web.php` `/staff/login`, `/staff/dispatch-login`, `$staff` closure | constant-time behaviour, session regenerate, password-hash version check, throttle, MFA flag actually enforced (`mfa_required`) |
| Customer auth | `app/Http/Controllers/CustomerAuthController.php` | enumeration (register error, dispatch-login fallthrough), password policy, throttle `auth` |
| RBAC | every `/staff/*` route calls `$authorize` and, for admin-only data, checks `role === 'admin'` | catalog_manager cannot read orders/customers/settings (covered by tests) |
| IDOR | `/api/v1/orders/track`, `/media/{id}`, order status routes | identifiers unguessable, no PII beyond masked fields |
| CSRF | `web` middleware on state-changing routes; SPA sends `X-CSRF-TOKEN` | E2E `api-security.spec.ts` must run with APP_ENV≠testing (Laravel skips CSRF in testing) |
| Mass assignment | `DB::table()->insert/update($request->all())` patterns | only validated keys reach the DB |
| SQLi | `DB::raw`, `whereRaw`, `selectRaw`, string-built SQL | bindings used |
| XSS | `v-html` in `frontend/src`, `{!! !!}` | sanitized or removed |
| Uploads | `ProductEditorController`, `/staff/media` | MIME sniffing, re-encode to WebP, size limits, served with safe Content-Type |
| Secrets | gitleaks history + worktree, `.env*` tracked? | no secrets in git; `.env.production` never read |
| Headers | `deploy/nginx.conf` (note: `add_header` inside a `location` drops server-level headers), Laravel responses | nosniff, frame-ancestors/XFO, Referrer-Policy, CSP, HSTS (proxy) |
| Rate limits | `AppServiceProvider` | `env()` outside config breaks under `config:cache` |
| Logs | `LOG_LEVEL`, logged payloads | no phone/address/password in logs |

## Output
One entry per issue using the template in `audit-reports/README.md`, labelled Verified / Potential / Untested. Write a failing regression test idea for each (Playwright `frontend/e2e/api-security.spec.ts` or `backend/tests/run.php`).
