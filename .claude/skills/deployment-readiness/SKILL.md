---
name: deployment-readiness
description: Review Studio Active's Docker images, compose stack, nginx, GitHub Actions CI, environment configuration, backups/restore, and monitoring before a release. Use for DevOps audits, Dockerfile/compose/CI changes, or "is this ready for production".
---

# Deployment readiness

## Files
`deploy/Dockerfile` (frontend, php, web stages) · `compose.yaml` · `deploy/nginx.conf` · `deploy/uploads.ini` · `.github/workflows/checks.yml` · `.env.production.example` · `.dockerignore`.
Evidence: `audit-reports/raw/trivy-fs.json` (misconfig + secrets), semgrep `p/dockerfile`.

## Checklist
1. Images: pinned base tags/digests, non-root user, no dev deps (`--no-dev`), no secrets baked in, `.dockerignore` excludes `.env`, `vendor`, `node_modules`, `.tools`, `*.sqlite`.
2. Compose: DB/Redis not exposed publicly, healthchecks, restart policy, volumes for media/db, Redis auth, worker command (`--tries`, `--timeout`), scheduler present if needed, migrations step.
3. Nginx: security headers repeated in every `location` that has its own `add_header`; CSP; HSTS when TLS terminates here; deny dotfiles; upload size aligned with PHP.
4. CI: actions pinned (SHA preferred), least-privilege `permissions:`, runs backend tests, build, dependency audits, secret scan, E2E; no secrets echoed.
5. Config: `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`, `SESSION_ENCRYPT`, `LOG_CHANNEL=stderr`, `config:cache`/`route:cache` compatibility.
6. Backups: PostgreSQL dump schedule, media volume backup, documented and rehearsed restore (README requires a restore rehearsal before release).
7. Monitoring: health endpoint `/up`, queue depth/failed jobs, error tracking (none configured → gap), uptime alerts.

Never deploy, push images, or change production configuration from Claude. Output: issues with `OPS-` IDs.
