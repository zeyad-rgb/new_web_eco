# Claude Code workspace setup report: 2026-11-22

Environment: Windows 11 Pro · Claude Code 2.1.202 (desktop app, Code tab) · PHP 8.4.27 · Composer 2.8.8 · Node 22.19 / npm 10.9 · Python 3.11 · Docker 29.7 (daemon not running) · k6 2.4.0.
Detected stack: Laravel 13 API + Vue 3/TypeScript/Vite SPA · PostgreSQL 17 (prod) / SQLite (dev) · Redis · session + CSRF auth with staff roles · **cash on delivery only** · Docker Compose + nginx · GitHub Actions.

## 1. Installed and verified
| Component | How verified |
|---|---|
| Plugins (project scope, official marketplace `claude-plugins-official`): superpowers 6.1.1, security-guidance 2.0.6, code-review, pr-review-toolkit, feature-dev, code-simplifier, frontend-design, claude-md-management, claude-code-setup, playwright, context7, chrome-devtools-mcp 1.5.0, github, php-lsp, typescript-lsp | `claude plugin list` → 15 enabled |
| MCP: playwright, context7, chrome-devtools (via plugins); laravel-boost (`.mcp.json`) | `claude mcp list` → ✔ Connected (4); Boost tools listed over stdio (9 tools incl. read-only `database-query`) |
| Language servers for LSP plugins: intelephense, typescript-language-server | on PATH |
| Composer dev: `laravel/boost ^2.10`, `larastan/larastan ^3.15` | `php artisan boost:mcp`, `phpstan analyse` ran |
| npm dev: `@playwright/test`, `@axe-core/playwright`, Chromium | 49-test suite ran |
| Security CLIs: gitleaks 8.30.1, Trivy 0.76.2 (winget) | scans produced reports |
| 11 project skills (`.claude/skills/`) incl. vendored Cloudflare `web-perf` (Apache-2.0, commit pinned in `UPSTREAM`) | frontmatter validated |
| 6 read-only subagents (`.claude/agents/`) | frontmatter validated |
| Hooks: Bash/PowerShell guard, post-edit PHP lint + gitleaks, Stop-time backend tests | guard blocked a real `migrate:fresh` call during setup; scripted tests: 7/7 expected results |
| `CLAUDE.md`, `tools/audit/run_audit.py`, `tools/audit/k6-smoke.js`, `.gitleaks.toml`, `backend/phpstan.neon`, `frontend/playwright.config.ts` + `frontend/e2e/`, `.github/workflows/security.yml` | full audit run completed |

## 2. Already present
k6, Docker CLI, PHP/Composer/Node, the backend regression suite (`backend/tests/run.php`), CI `checks.yml`, and the official marketplace.

## 3. Skipped, and why
| Item | Reason |
|---|---|
| Serena plugin | Needs `uv`/`uvx` (not installed). Duplicates php-lsp + typescript-lsp + Boost. |
| Cloudflare plugin / Browser Rendering / Cloudflare MCP | The project is not deployed on Cloudflare. Only the stack-agnostic `web-perf` skill was adopted. Browser Rendering needs a Cloudflare account and API token. |
| Stripe, Supabase, PostgreSQL, MySQL MCP | Not used by the project (COD only, local SQLite; Boost covers read-only DB access). |
| Sentry, Figma MCP | No Sentry project or Figma files exist. Recommended in OPS-03 once Sentry is adopted. |
| Pest / PHPUnit | The existing `tests/run.php` harness covers business rules. Adding a second runner is optional (see regression-testing skill). |
| Lighthouse CLI | Superseded by Chrome DevTools MCP performance traces (`web-perf` skill). |
| wshobson/agents, skills.sh, anthropics/skills | Overlap with installed plugins and project skills. Superpowers already supplies TDD, systematic debugging, verification-before-completion and plan writing. |
| Separate skills for each sub-topic in the request (e.g. `authorization-review`, `pricing-integrity-review`) | Merged into 11 distinct skills to avoid duplicates. Mapping: security-audit ← auth/authz/OWASP/secrets/deps · database-audit ← schema/query/integrity · migration-safety · backend-audit ← API/business-logic/caching/errors/queues · ecommerce-testing ← checkout/payment/inventory/orders/discounts/returns/pricing · frontend-audit ← responsive/a11y/SEO · performance-audit (+web-perf) ← frontend perf/load · deployment-readiness ← docker/CI/backups/monitoring · regression-testing ← regression/coverage/API tests. |
| Architect, code-review and performance agents | Provided by the feature-dev (`code-architect`), code-review and pr-review-toolkit plugins. Performance is covered by frontend-qa. |

## 4. Failed or partially working
| Item | State |
|---|---|
| Semgrep 1.186.0 (pip) | Installed but semgrep-core crashes on native Windows, even with a one-rule config. Runs in CI (`security.yml`, Linux container) instead; local runs report "skipped". |
| GitHub MCP | Installed, **not connected**: needs a token (below). |
| OWASP ZAP | Not installed: needs Docker Desktop running (or Java). |

## 5. Needs credentials or permission from you
- **GitHub MCP:** create a fine-grained personal access token for `zeyad-rgb/new_web_eco` (Contents, Issues and Pull requests: read/write) and set the user environment variable `GITHUB_PERSONAL_ACCESS_TOKEN`. Don't put it in a tracked file.
- **Docker Desktop:** start it to enable ZAP baseline scans, image builds, a PostgreSQL concurrency test, and a production-like k6 run.
- **Fix approval:** any change in `PRIORITIZED_FIX_PLAN.md`.

## 6. Commands
| Goal | Command |
|---|---|
| Full audit (evidence) | `python tools/audit/run_audit.py` · groups: `security backend frontend deps e2e perf` · `--list` |
| Full audit + reports (in Claude) | ask "run the full e-commerce audit" → `full-ecommerce-audit` skill |
| Focused | "security audit", "database audit", "backend audit", "e-commerce testing", "performance audit" |
| Backend tests | `php backend/tests/run.php` |
| E2E | `cd frontend && npm run test:e2e` · report: `npm run test:e2e:report` |
| Static analysis | `cd backend && vendor/bin/phpstan analyse` |
| Code review of a branch/PR | `/code-review` |

## 7. Audit tools tested in this setup
backend regression ✅ · Larastan ✅ · vue-tsc/Vite ✅ · composer audit ✅ · npm audit ✅ · gitleaks (history + worktree) ✅ · Trivy ✅ · Playwright + axe ✅ · k6 ✅ · Laravel Boost MCP ✅ · Semgrep ❌ (local) · ZAP ⏭.

## 8. Remaining limitations
- New plugins, MCP servers, skills and agents load in **new** Claude Code sessions. This session predates them.
- Hooks use `python`; on another machine Python 3 must be on PATH.
- The E2E suite uses ports 8018 and 5183 and its own SQLite database. It does not test the PostgreSQL-specific locking behaviour.

## 9. Recommended next actions
1. Approve and fix **SEC-01** (P0).
2. Add `GITHUB_PERSONAL_ACCESS_TOKEN`, start Docker Desktop, and open a new Claude Code session so the new tools load.
3. Push this branch and check the first `security.yml` run (Semgrep results).
4. Run the `web-perf` skill for Core Web Vitals (PERF-02).
