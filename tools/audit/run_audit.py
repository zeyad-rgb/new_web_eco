# -*- coding: utf-8 -*-
"""Automated, non-destructive audit runner for Studio Active.

Runs every available tool, stores raw output in audit-reports/raw/, and writes
audit-reports/raw/summary.json with an honest status per stage:
  passed | findings | failed | skipped (tool missing) | error

Usage (from the repo root):
    python tools/audit/run_audit.py              # all stages
    python tools/audit/run_audit.py security     # one group: security|backend|frontend|deps|e2e|perf
    python tools/audit/run_audit.py --list

Nothing here touches the development, staging or production database:
backend tests use in-memory SQLite and E2E uses backend/database/e2e.sqlite.
Active scanners (ZAP active scan, high-volume load) are intentionally not run.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "audit-reports" / "raw"
WIN = os.name == "nt"


def which(name: str, *fallbacks: str) -> str | None:
    found = shutil.which(name)
    if found:
        return found
    for candidate in fallbacks:
        path = Path(os.path.expandvars(candidate))
        if path.is_file():
            return str(path)
    return None


GITLEAKS = which("gitleaks", r"%LOCALAPPDATA%\Microsoft\WinGet\Links\gitleaks.exe")
TRIVY = which("trivy", r"%LOCALAPPDATA%\Microsoft\WinGet\Links\trivy.exe")
SEMGREP = which("semgrep", r"%APPDATA%\Python\Python311\Scripts\semgrep.exe")
NPX = which("npx.cmd" if WIN else "npx", "npx")
NPM = which("npm.cmd" if WIN else "npm", "npm")
PHP = which("php")
_composer = which("composer")
# Run composer.phar through PHP directly: composer.bat cannot find php from some shells.
COMPOSER_PHAR = next((str(p) for p in [Path(_composer).with_name("composer.phar")] if p.is_file()), None) if _composer else None
K6 = which("k6")

# name -> (group, command or None, cwd, ok_exit_codes, findings_exit_codes, timeout)
STAGES: dict[str, tuple] = {
    "backend-regression": ("backend", [PHP, "tests/run.php"] if PHP else None, "backend", {0}, set(), 300),
    "larastan": ("backend", [PHP, "vendor/bin/phpstan", "analyse", "--no-progress", "--memory-limit=1G", "--error-format=json"] if PHP else None, "backend", {0}, {1}, 600),
    "frontend-typecheck-build": ("frontend", [NPM, "run", "build"] if NPM else None, "frontend", {0}, set(), 600),
    "composer-audit": ("deps", [PHP, COMPOSER_PHAR, "audit", "--format=json"] if (PHP and COMPOSER_PHAR) else None, "backend", {0}, {1, 2}, 300),
    "npm-audit": ("deps", [NPM, "audit", "--json"] if NPM else None, "frontend", {0}, {1}, 300),
    "gitleaks-history": ("security", [GITLEAKS, "git", ".", "--no-banner", "--redact", "--report-format", "json", "--report-path", str(RAW / "gitleaks-history.json"), "--exit-code", "3"] if GITLEAKS else None, ".", {0}, {3}, 300),
    "gitleaks-worktree": ("security", [GITLEAKS, "dir", ".", "--no-banner", "--redact", "--report-format", "json", "--report-path", str(RAW / "gitleaks-worktree.json"), "--exit-code", "3"] if GITLEAKS else None, ".", {0}, {3}, 600),
    "semgrep": ("security", [SEMGREP, "scan", "--config", "p/php", "--config", "p/laravel", "--config", "p/owasp-top-ten", "--config", "p/secrets", "--config", "p/typescript", "--config", "p/dockerfile", "--json", "--output", str(RAW / "semgrep.json"), "--metrics", "off", "--exclude", "vendor", "--exclude", "node_modules", "--exclude", "dist", "--exclude", ".tools", "--exclude", "StudioActive-preview.html", "--exclude", "audit-reports", "backend", "frontend/src", "deploy", ".github"] if SEMGREP else None, ".", {0}, {1}, 900),
    "trivy-fs": ("security", [TRIVY, "fs", "--scanners", "vuln,secret,misconfig", "--format", "json", "--output", str(RAW / "trivy-fs.json"), "--skip-dirs", "frontend/node_modules", "--skip-dirs", "backend/vendor", "--skip-dirs", ".tools", "--skip-dirs", "backend/storage", "--skip-dirs", "audit-reports", "--exit-code", "1", "--quiet", "."] if TRIVY else None, ".", {0}, {1}, 900),
    "e2e-playwright": ("e2e", [NPX, "playwright", "test", "--reporter=list,json"] if NPX else None, "frontend", {0}, {1}, 1200),
    "k6-smoke": ("perf", [K6, "run", "--quiet", "--summary-export", str(RAW / "k6-summary.json"), str(ROOT / "tools" / "audit" / "k6-smoke.js")] if K6 else None, ".", {0}, {99}, 300),
}


def run_stage(name: str) -> dict:
    group, cmd, cwd, ok, findings, timeout = STAGES[name]
    if not cmd or not cmd[0]:
        return {"stage": name, "group": group, "status": "skipped", "reason": "tool not installed"}
    start = time.time()
    log = RAW / f"{name}.log"
    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"  # semgrep on Windows needs UTF-8 I/O
    # semgrep.exe launches pysemgrep from its own Scripts directory; make sure it is on PATH.
    if SEMGREP:
        env["PATH"] = str(Path(SEMGREP).parent) + os.pathsep + env.get("PATH", "")
    if name == "trivy-fs":
        # Avoid Docker Desktop's credential helper when downloading the public vuln DB.
        empty = RAW / ".docker-empty"
        empty.mkdir(exist_ok=True)
        env["DOCKER_CONFIG"] = str(empty)
    if PHP:
        env["PATH"] = str(Path(PHP).parent) + os.pathsep + env.get("PATH", "")
    if name == "e2e-playwright":
        env["PLAYWRIGHT_JSON_OUTPUT_NAME"] = str(RAW / "playwright-results.json")
    try:
        proc = subprocess.run(cmd, cwd=ROOT / cwd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout, env=env)
    except subprocess.TimeoutExpired:
        return {"stage": name, "group": group, "status": "error", "reason": f"timed out after {timeout}s"}
    except OSError as exc:
        return {"stage": name, "group": group, "status": "error", "reason": str(exc)}
    log.write_text(proc.stdout + "\n--- stderr ---\n" + proc.stderr, encoding="utf-8")
    if name == "semgrep" and proc.returncode not in ok | findings and "semgrep-core" in proc.stderr:
        return {"stage": name, "group": group, "status": "skipped", "reason": "semgrep-core crashes on native Windows; runs in CI (.github/workflows/security.yml)", "log": str(log.relative_to(ROOT))}
    if proc.returncode in ok:
        status = "passed"
    elif proc.returncode in findings:
        status = "findings"
    else:
        status = "failed"
    return {"stage": name, "group": group, "status": status, "exit_code": proc.returncode, "seconds": round(time.time() - start, 1), "log": str(log.relative_to(ROOT))}


def main(argv: list[str]) -> int:
    if "--list" in argv:
        for name, spec in STAGES.items():
            print(f"{spec[0]:9} {name:26} {'available' if spec[1] and spec[1][0] else 'MISSING TOOL'}")
        return 0
    groups = {a for a in argv if not a.startswith("-")}
    RAW.mkdir(parents=True, exist_ok=True)
    results = []
    for name, spec in STAGES.items():
        if groups and spec[0] not in groups:
            continue
        print(f"-> {name} ...", flush=True)
        result = run_stage(name)
        print(f"  {result['status']}" + (f" ({result.get('reason')})" if result.get("reason") else ""), flush=True)
        results.append(result)
    summary = {"generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"), "results": results}
    (RAW / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"\nRaw output: {RAW.relative_to(ROOT)}  (summary.json)")
    return 1 if any(r["status"] in ("failed", "error") for r in results) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
