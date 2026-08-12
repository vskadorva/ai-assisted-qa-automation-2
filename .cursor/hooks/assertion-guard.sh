#!/usr/bin/env bash
# assertion-guard: after edits under tests/, block if expect( coverage was weakened.
set -euo pipefail

input=$(cat)

python3 - "$input" <<'PY'
import json
import subprocess
import sys

payload = json.loads(sys.argv[1])
file_path = payload.get("file_path") or payload.get("path") or ""

# Only gate files under tests/
normalized = file_path.replace("\\", "/")
if "/tests/" not in normalized and not normalized.endswith("/tests"):
    if not normalized.startswith("tests/"):
        sys.exit(0)

try:
    with open(file_path, encoding="utf-8") as f:
        new_content = f.read()
except OSError as exc:
    print(
        json.dumps(
            {
                "user_message": f"assertion-guard: cannot read edited file ({exc})",
                "agent_message": "Assertion guard could not read the edited test file.",
            }
        )
    )
    sys.exit(2)


def strip_line_comment(line: str) -> str:
    in_string = False
    quote = ""
    i = 0
    while i < len(line):
        ch = line[i]
        if in_string:
            if ch == "\\" and i + 1 < len(line):
                i += 2
                continue
            if ch == quote:
                in_string = False
            i += 1
            continue
        if ch in ("'", '"', "`"):
            in_string = True
            quote = ch
            i += 1
            continue
        if ch == "/" and i + 1 < len(line) and line[i + 1] == "/":
            return line[:i]
        i += 1
    return line


def active_expect_count(content: str) -> int:
    count = 0
    in_block = False
    for line in content.splitlines():
        stripped = line.strip()
        if in_block:
            if "*/" in stripped:
                in_block = False
            continue
        if stripped.startswith("/*"):
            in_block = "*/" not in stripped
            continue
        code = strip_line_comment(line)
        count += code.count("expect(")
    return count


def reconstruct_old_content(new_content: str, edits: list) -> str | None:
    if not edits:
        return None
    old_content = new_content
    for edit in reversed(edits):
        new_string = edit.get("new_string", "")
        old_string = edit.get("old_string", "")
        if not new_string:
            continue
        if new_string not in old_content:
            return None
        old_content = old_content.replace(new_string, old_string, 1)
    return old_content


def git_head_content(path: str) -> str | None:
    try:
        root = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None
    if not path.startswith(root):
        return None
    rel = path[len(root) + 1 :]
    try:
        result = subprocess.run(
            ["git", "show", f"HEAD:{rel}"],
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return None
    if result.returncode != 0:
        return None
    return result.stdout


edits = payload.get("edits") or []
old_content = reconstruct_old_content(new_content, edits)
if old_content is None:
    old_content = git_head_content(file_path)

if old_content is None:
    # New/untracked file with no baseline — allow (generation-gate covers empty specs).
    sys.exit(0)

old_count = active_expect_count(old_content)
new_count = active_expect_count(new_content)

reasons: list[str] = []
if new_count < old_count:
    reasons.append(
        f"active expect( count dropped ({old_count} → {new_count}) — assertion removed or commented out"
    )

# Per-edit: explicit comment-out of an expect( line
for edit in edits:
    old_snip = edit.get("old_string", "")
    new_snip = edit.get("new_string", "")
    if "expect(" not in old_snip:
        continue
    if active_expect_count(old_snip) == 0:
        continue
    if active_expect_count(new_snip) < active_expect_count(old_snip):
        reasons.append("an expect( was commented out or deleted in this edit")

if reasons:
    detail = "; ".join(dict.fromkeys(reasons))
    msg = f"assertion-guard blocked edit: {detail}. Refuse to weaken assertions — fix the POM or escalate per triage."
    print(msg, file=sys.stderr)
    print(
        json.dumps(
            {
                "user_message": msg,
                "agent_message": msg,
            }
        )
    )
    sys.exit(2)

sys.exit(0)
PY

printf '%s\n' '{}'
exit 0
