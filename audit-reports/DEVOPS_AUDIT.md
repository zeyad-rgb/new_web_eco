# DevOps audit

Reviewed: `deploy/Dockerfile`, `compose.yaml`, `deploy/nginx.conf`, `.github/workflows/checks.yml`, `.env.production.example`, `.dockerignore`. Trivy misconfiguration scan: 1 LOW (DS-0026). Images were not built (Docker daemon not running).

## What is good
- Multi-stage build, `composer install --no-dev --optimize-autoloader`, PHP runs as `www-data`.
- Postgres and Redis are not published; web is bound to `127.0.0.1:8080` (TLS proxy expected in front). There are healthchecks for db and redis.
- `.env.production.example` sets `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`, `SESSION_ENCRYPT=true`, and `LOG_CHANNEL=stderr`.
- CI runs the backend regression suite and the frontend build on every push and PR.

## Findings

### OPS-01 — nginx drops security headers in locations with their own `add_header`
See **SEC-03** (Medium). Affects `location /` (SPA HTML) and `location /assets/`.

### OPS-02 — No backups or restore procedure
| Severity | **Medium** | Confidence | Verified (absence) | Priority | P1 |
|---|---|---|---|---|---|
The `database`, `media` and `redis-data` volumes have no backup job, and the README requires a restore rehearsal before release. **Fix.** Add a nightly `pg_dump` (custom format) plus a media volume archive to off-host storage with retention. Document `pg_restore` and rehearse it once into a scratch database.

### OPS-03 — No error tracking or alerting
| Severity | **Medium** | Confidence | Verified (absence) | Priority | P1 |
|---|---|---|---|---|---|
There is only `/up`. Nothing reports failed jobs (`failed_jobs`), 5xx rates or queue depth. **Fix.** Add an error tracker (Sentry has an official Laravel SDK and an MCP plugin is available), an uptime check on `/up`, and an alert when `failed_jobs` is greater than 0.

### OPS-04 — No HEALTHCHECK for the `app`/`web` images; `worker` depends on `app` without a condition
| Severity | Low | Location | `deploy/Dockerfile`, `compose.yaml:9-15` | Priority | P2 |
|---|---|---|---|---|---|
Trivy DS-0026. Add `HEALTHCHECK` (php-fpm ping or `curl /up` for web) and `condition: service_healthy`.

### OPS-05 — Migrations aren't part of the deploy, and the scheduler isn't started
| Severity | Low | Priority | P2 |
|---|---|---|---|
`routes/console.php:9` schedules `queue:work --stop-when-empty` every minute, but no container runs `schedule:work`. The dedicated `worker` service makes that schedule redundant, so pick one. No step runs `php artisan migrate --force`. Add a one-shot `migrate` service or a documented release step.

### OPS-06 — CI hardening
| Severity | Low | Location | `.github/workflows/checks.yml` | Priority | P3 |
|---|---|---|---|---|---|
There's no `permissions:` block (defaults may be broad), and actions are pinned to tags rather than commit SHAs. This audit added `.github/workflows/security.yml` (gitleaks, Semgrep, Trivy, composer/npm audit) with `permissions: contents: read`. **Its first run is untested.** E2E isn't in CI yet; add a job running `npx playwright install --with-deps chromium && npm run test:e2e`.

### OPS-07 — Redis has no authentication
| Severity | Low | Priority | P3 |
|---|---|---|---|
Redis is reachable only on the compose network today. Set `requirepass` (or ACL) with `REDIS_PASSWORD` for defence in depth.
