"""PreToolUse guard for Bash/PowerShell: blocks destructive or production-facing commands.

Exit code 2 blocks the call and returns the message to Claude. Keep this fast and
pattern-based; it is a safety net, not a replacement for permission prompts.
"""
import json
import re
import sys

BLOCKED = [
    (r"\bmigrate:(fresh|reset|rollback|refresh)\b", "Destructive migration command. Use a dedicated test database and ask the user first."),
    (r"\bdb:wipe\b", "db:wipe destroys data. Ask the user first."),
    (r"\b(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE)\b", "Destructive SQL. Ask the user first."),
    (r"\bgit\s+push\b[^\n]*(--force\b|-f\b|--force-with-lease\b)", "Force push rewrites shared history. Ask the user first."),
    (r"\bgit\s+push\b[^\n]*\b(main|master)\b", "Do not push to main directly; push a feature branch and open a PR."),
    (r"\bgit\s+reset\s+--hard\b", "git reset --hard discards work. Ask the user first."),
    (r"\.env\.production\b(?!\.example)", "Do not read or modify production environment files."),
    (r"\bdocker\s+compose\b[^\n]*\b(down\s+-v|down\s+--volumes)\b", "Removes database volumes. Ask the user first."),
    (r"\b(zap-full-scan|zap-api-scan)\b", "Active ZAP scans need explicit authorization and a non-production target."),
]

def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    command = (data.get("tool_input") or {}).get("command") or ""
    # Allow the dedicated, disposable e2e database to be rebuilt.
    if "e2e.sqlite" in command and re.search(r"migrate:fresh", command):
        return 0
    for pattern, reason in BLOCKED:
        if re.search(pattern, command, re.IGNORECASE):
            print(f"Blocked by project guard: {reason}", file=sys.stderr)
            return 2
    return 0

if __name__ == "__main__":
    sys.exit(main())
