---
name: full-ecommerce-audit
description: Run the complete Studio Active audit (architecture, database, backend, security, e-commerce logic, API, frontend, browser, performance, dependencies, DevOps) and regenerate audit-reports/. Use when asked for a full audit, production-readiness check, or "audit everything".
---

# Full e-commerce audit (orchestrator)

Coordinates the focused skills; it does not duplicate them. Every claim in a report needs evidence (tool output, file:line, or a test result). A stage whose tool is missing or that was not run is reported as **SKIPPED**, never as passed.

## Stages

1. **Automated evidence** — from the repo root:
   `python tools/audit/run_audit.py` → raw output in `audit-reports/raw/` and `raw/summary.json`.
   Read `summary.json` first; it lists each stage as passed / findings / failed / skipped / error.
2. **Parallel read-only reviews** — dispatch these subagents in ONE message (they only read; none edits files):
   - `security-auditor` → security-audit skill
   - `database-engineer` → database-audit skill
   - `backend-reviewer` → backend-audit skill
   - `ecommerce-logic-reviewer` → ecommerce-testing skill (analysis part)
   - `frontend-qa` → frontend-audit + performance-audit skills
   - `devops-reviewer` → deployment-readiness skill
   Give each the paths of relevant raw files so it does not re-run tools.
3. **Coordinate** (you, not a subagent): merge results, drop duplicates (same root cause = one issue, list all locations), re-verify every Critical/High yourself by reading the cited code, and assign IDs with prefixes `SEC- DB- BE- EC- API- FE- PERF- DEP- OPS- ARCH-`.
4. **Write reports** in `audit-reports/` using the template in `audit-reports/README.md`:
   EXECUTIVE_SUMMARY, ARCHITECTURE_AUDIT, BACKEND_AUDIT, DATABASE_AUDIT, SECURITY_AUDIT, ECOMMERCE_AUDIT, API_AUDIT, FRONTEND_AUDIT, PERFORMANCE_AUDIT, AUTOMATED_TEST_RESULTS, DEPENDENCY_AUDIT, DEVOPS_AUDIT, PRIORITIZED_FIX_PLAN, PRODUCTION_READINESS, and the index `audit-reports/INDEX.md`.
   Preserve the status of issues from the previous run (open / fixed / won't-fix) and note new vs. resolved.
5. **Stop and present** the Critical/High list and the fix plan. Do NOT change business logic without user approval (Phase 14 rules in CLAUDE.md).

## Classification

- Verified vulnerability: reproduced by a test or tool with evidence.
- Potential vulnerability: code pattern suggests risk, not reproduced.
- Untested risk: area no tool/test covered (say which tool would cover it).

Severity: Critical (exploitable now / data loss / money loss) · High · Medium · Low · Informational.
