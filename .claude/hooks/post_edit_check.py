"""PostToolUse check after Edit/Write: fast, file-scoped validation.

- PHP files: `php -l` syntax check.
- Any text file: gitleaks scan of just that file for hard-coded secrets.
- Migrations: reminder to follow the migration-safety skill.
Exit code 2 feeds the problem back to Claude so it fixes it before moving on.
"""
import json
import os
import shutil
import subprocess
import sys

def run(cmd, timeout=20):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except (OSError, subprocess.TimeoutExpired):
        return None

def find_gitleaks():
    found = shutil.which("gitleaks")
    if found:
        return found
    candidate = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Links\gitleaks.exe")
    return candidate if os.path.isfile(candidate) else None

def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    path = (data.get("tool_input") or {}).get("file_path") or ""
    if not path or not os.path.isfile(path):
        return 0
    problems = []
    norm = path.replace("\\", "/")

    if norm.endswith(".php"):
        result = run(["php", "-l", path])
        if result and result.returncode != 0:
            problems.append("PHP syntax error:\n" + (result.stdout + result.stderr).strip())

    if "/node_modules/" not in norm and "/vendor/" not in norm and not norm.endswith((".lock", "package-lock.json")):
        gitleaks = find_gitleaks()
        if gitleaks:
            result = run([gitleaks, "dir", path, "--no-banner", "--redact", "--exit-code", "3"])
            if result and result.returncode == 3:
                problems.append("gitleaks found a possible secret in this file. Move it to an untracked .env value:\n" + (result.stdout + result.stderr).strip()[-1500:])

    if "/database/migrations/" in norm:
        print("Migration edited: follow .claude/skills/migration-safety (reversible down(), no data loss, PostgreSQL + SQLite compatible), then run php backend/tests/run.php.")

    if problems:
        print("\n\n".join(problems), file=sys.stderr)
        return 2
    return 0

if __name__ == "__main__":
    sys.exit(main())
