"""Stop hook: before Claude finishes, run the backend regression suite if backend
code changed and is uncommitted. Blocks once with the failure output; never loops.
"""
import json
import os
import subprocess
import sys

WATCHED = ("backend/app/", "backend/routes/", "backend/database/", "backend/config/", "backend/bootstrap/")

def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}
    if data.get("stop_hook_active"):
        return 0
    root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    try:
        status = subprocess.run(["git", "status", "--porcelain"], cwd=root, capture_output=True, text=True, timeout=15).stdout
    except (OSError, subprocess.TimeoutExpired):
        return 0
    changed = [line[3:].strip().strip('"') for line in status.splitlines()]
    if not any(p.startswith(WATCHED) for p in changed):
        return 0
    try:
        result = subprocess.run(["php", "backend/tests/run.php"], cwd=root, capture_output=True, text=True, timeout=180)
    except subprocess.TimeoutExpired:
        print("Backend regression suite timed out; run php backend/tests/run.php manually before reporting done.", file=sys.stderr)
        return 2
    if result.returncode != 0:
        tail = (result.stdout + result.stderr).strip()[-2000:]
        print("Backend regression suite failed. Fix it (or report the failure honestly) before finishing:\n" + tail, file=sys.stderr)
        return 2
    return 0

if __name__ == "__main__":
    sys.exit(main())
