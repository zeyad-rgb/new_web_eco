# Security audit

Run 2026-11-22 · branch `chore/claude-engineering-setup` · local only, non-destructive.
Tools: gitleaks 8.30.1 (history + worktree), Trivy 0.76.2 (vuln/secret/misconfig), composer audit, npm audit, Larastan 3.15, Playwright security spec, in-memory PHP probes. **Semgrep: not run** (installed 1.186.0, but semgrep-core crashes on native Windows; runs in CI via `.github/workflows/security.yml`). **OWASP ZAP: not installed** (needs Java or a running Docker daemon). Docker daemon was off, so the nginx container was not exercised.

## Verified controls (passing tests)
| Control | Evidence |
|---|---|
| Anonymous access to `/staff/{bundle,orders,customers,settings,audit}` rejected | `api-security.spec.ts` "access control" (5 tests) |
| catalog_manager blocked from orders/settings | `api-security.spec.ts`, `run.php` "manager cannot read settings/customer orders" |
| CSRF enforced on `/api/v1/orders` and `/staff/login` (419) | `api-security.spec.ts` "CSRF" (runs with APP_ENV=local, because Laravel skips CSRF when APP_ENV=testing) |
| Registration cannot grant staff role (mass assignment) | `run.php` "registration cannot grant staff role" |
| Executable upload rejected, images re-encoded to WebP | `run.php` "executable upload rejected", "image stored as WebP" |
| Unexpected item fields (client `price`) rejected with 422 | `api-security.spec.ts` "client-supplied prices are ignored" |
| No secrets in git history or tracked files | gitleaks-history: 0, gitleaks-worktree: 0 (generated caches allow-listed in `.gitleaks.toml`) |
| No known vulnerable dependencies | composer audit: 0 · npm audit: 0 · Trivy vuln: 0 |
| Customer contact data encrypted at rest | `ShopController.php:147` `Crypt::encryptString` |

## Findings

### SEC-01 — Demoted staff keep admin access to customer PII
| Severity | **High** | Confidence | Verified | Priority | P0 |
|---|---|---|---|---|---|
| Component | Staff API | Location | `backend/routes/web.php:167`, `:206`, `:317` | Status | Open |

**Problem.** `/staff/orders`, `/staff/customers` and `/staff/whatsapp-queue` check `session('catalog_staff.role') === 'admin'`, a value written at login. Other admin routes re-read the role from the database through `$staff($request)`.
**Root cause.** The role is cached in the session, and the session stays valid after a role change, because `$staff` only rejects a session when the password hash changes.
**Evidence.** An in-memory probe logged in as admin, then ran `UPDATE catalog_staff SET role='catalog_manager'`. Results: `/staff/orders` → **200**, `/staff/customers` → **200**, `/staff/settings` → 403. Only settings is correctly protected.
**Business impact.** An admin who is demoted, for example after leaving the team, can keep reading every customer's name, phone and address until the session expires.
**Fix.** Replace the three session checks with `abort_unless($staff($request)?->role === 'admin', 403)`. Better still, add one `$authorizeAdmin` closure or a Laravel policy and use it on every admin route.
**Regression test.** `run.php`: log in as admin, demote in the DB, then `check(req('GET','/staff/orders')->getStatusCode()===403, …)`. Do the same for `/staff/customers` and `/staff/whatsapp-queue`.

### SEC-02 — `mfa_required` flag is not enforced
| Severity | **Medium** | Confidence | Verified | Priority | P1 |
|---|---|---|---|---|---|
| Location | `backend/routes/web.php:49-74`; column added in `2026_11_19_000005_add_store_settings_and_audit.php:11` | Status | Open |

**Evidence.** In the probe, a staff row with `mfa_required=true` logged in through `/staff/dispatch-login` using only the password (HTTP 200). The flag is never read anywhere else (`grep -rn mfa app routes` finds the migration only).
**Impact.** A stolen admin password is enough to get full back-office access. The flag gives a false sense of protection, and the README lists staff MFA as a launch requirement.
**Fix.** Implement TOTP, for example with `pragmarx/google2fa`: store an encrypted secret and require the code before setting `verified_password`. Until then, reject logins for `mfa_required=true` accounts.
**Test.** A login with `mfa_required=true` and no OTP must not produce a usable session.

### SEC-03 — Missing security headers (CSP, nosniff, frame, referrer) on most responses
| Severity | **Medium** | Confidence | Verified (Laravel) / Verified by config (nginx) | Priority | P1 |
|---|---|---|---|---|---|
| Location | `deploy/nginx.conf:5-8,15`; no header middleware in `backend/bootstrap/app.php` | Status | Open |

**Evidence.** The E2E test `security headers on the API (SEC-03)` got none of `x-content-type-options`, `x-frame-options`, `referrer-policy` or `content-security-policy` from Laravel. In nginx, `add_header` is set at server level, but `location /` (the SPA HTML) and `location /assets/` declare their own `add_header`. Nginx then drops all inherited headers for those locations, so the storefront HTML is served without frame or nosniff protection. No CSP or HSTS is configured anywhere.
**Impact.** Clickjacking of checkout and staff pages, MIME sniffing, and no defence in depth against XSS.
**Fix.** Put the headers in `deploy/security-headers.conf` and `include` it in every `location` that sets `add_header`. Add a CSP (start with `default-src 'self'; img-src 'self' data:; frame-ancestors 'none'`), and add HSTS where TLS terminates. Optionally add a Laravel middleware so headers also appear outside nginx.
**Test.** Remove `test.fail` from `frontend/e2e/api-security.spec.ts` once fixed. Also add a container check, `curl -I /` and `/assets/x.js`, in CI.

### SEC-04 — Staff email enumeration via unified login
| Severity | **Low** | Confidence | Verified | Priority | P2 |
|---|---|---|---|---|---|
| Location | `backend/routes/web.php:66-69`, `CustomerAuthController.php` `login()` | Status | Open |

**Evidence.** A wrong password for a staff email returns `422 "بيانات الدخول غير صحيحة."`. A wrong password for an unknown email falls through to customer login and returns `422 "Invalid email or password."`, so the message language reveals which emails belong to staff.
**Fix.** Return one identical message (and status) from both paths. **Test.** Assert both responses have the same body.

### SEC-05 — Customer phone and name stored unencrypted in `whatsapp_queue`
| Severity | **Medium** | Confidence | Verified | Priority | P1 |
|---|---|---|---|---|---|
| Location | `backend/routes/web.php:367-376`, `app/Services/WhatsAppService.php` | Status | Open |

**Problem.** Orders encrypt customer contact data, but the WhatsApp queue copies phone, name, the message and the send URL (which contains the phone) in plaintext, with no retention limit.
**Impact.** Database dumps, backups and admin queries expose PII that the order table deliberately protects.
**Fix.** Encrypt `customer_phone`, `customer_name` and `admin_send_url` (or build the link at read time from the order), and purge sent rows after N days. **Test.** Assert that the stored column is not the raw phone.

### SEC-06 — `env()` called outside config files
| Severity | **Low** | Confidence | Verified (Larastan) | Priority | P3 |
|---|---|---|---|---|---|
| Location | `backend/app/Providers/AppServiceProvider.php:27,31,47,53` | Status | Open |

With `php artisan config:cache` and a `.env` file (not real environment variables), `env()` returns its default value. Today this fails safe (bypass disabled, default limits), but limit overrides set in `.env` are silently ignored. **Fix.** Move the values to `config/ratelimit.php` and read them with `config()`.

### SEC-07 — Order tracking by UUID only (informational)
| Severity | Informational | Location | `ShopController.php:196` |
|---|---|---|---|
The `/api/v1/orders/track` endpoint returns status and a masked name for anyone holding the order UUID (v4, 122 bits) and is throttled. This is acceptable. If you want to harden it later, also require the phone number's last 4 digits.

## Untested risks
- Semgrep SAST (runs in CI only). The first CI run must be reviewed.
- DAST (OWASP ZAP baseline) against a local container: needs Docker Desktop running. Command once available: `docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:8080` (passive baseline only).
- Rate limits under real Redis: verified only by `backend/tests/verify_rate_limits.php`, which was not run in this audit.
- Session fixation and cookie flags in production (`SESSION_SECURE_COOKIE`, `SESSION_ENCRYPT`) are set in `.env.production.example` but not verified on a deployed host.
