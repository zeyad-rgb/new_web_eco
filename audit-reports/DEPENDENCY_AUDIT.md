# Dependency audit

| Tool | Scope | Result |
|---|---|---|
| `composer audit` | `backend/composer.lock` (incl. dev) | **0 advisories** |
| `npm audit` | `frontend/package-lock.json` | **0 vulnerabilities** |
| Trivy `fs --scanners vuln` | both lockfiles | **0** |
| Trivy secrets / gitleaks | repo (generated caches excluded) | **0** |

## Production dependencies
- PHP: `laravel/framework ^13.0` only.
- JS: `vue ^3.5`, `vue-router ^4.6.5`, `pinia ^4.1`, `pinia-plugin-persistedstate ^4.7.1`.

## Dev dependencies added by this setup
| Package | Purpose |
|---|---|
| `laravel/boost ^2.10` | Laravel MCP server for Claude (schema, read-only queries, logs, docs). Dev only. |
| `larastan/larastan ^3.15` | PHPStan static analysis for Laravel |
| `@playwright/test`, `@axe-core/playwright` | E2E and accessibility tests |

### DEP-01 — Ranges instead of exact pins
| Severity | Informational |
|---|---|
Lockfiles are committed and CI uses `npm ci` and `composer install`, so builds are reproducible. No action is needed.

### DEP-02 — Weekly automated dependency scans
`.github/workflows/security.yml` runs every Monday at 03:00 UTC. Consider enabling Dependabot for `composer`, `npm` and `github-actions`.
