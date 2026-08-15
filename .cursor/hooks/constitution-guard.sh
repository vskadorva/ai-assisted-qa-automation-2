#!/usr/bin/env bash
# constitution-guard: after edits under tests/** or pages/**, block WON'T violations.
set -euo pipefail

input=$(cat)

python3 - "$input" <<'PY'
import json
import re
import subprocess
import sys

payload = json.loads(sys.argv[1])
file_path = payload.get("file_path") or payload.get("path") or ""
normalized = file_path.replace("\\", "/")

def in_scope(path: str) -> bool:
    if path.startswith("tests/") or path.startswith("pages/"):
        return True
    return "/tests/" in path or "/pages/" in path

if not in_scope(normalized):
    sys.exit(0)

try:
    with open(file_path, encoding="utf-8") as f:
        new_content = f.read()
except OSError as exc:
    print(
        json.dumps(
            {
                "user_message": f"constitution-guard: cannot read edited file ({exc})",
                "agent_message": "Constitution guard could not read the edited file.",
            }
        )
    )
    sys.exit(2)

is_test_file = normalized.startswith("tests/") or "/tests/" in normalized
errors: list[str] = []


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


def active_code_lines(content: str) -> str:
    lines = []
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
        lines.append(strip_line_comment(line))
    return "\n".join(lines)


code = active_code_lines(new_content)

# --- WON'T: waitForTimeout ---
if re.search(r"\bwaitForTimeout\s*\(", code):
    errors.append("waitForTimeout is forbidden — use web-first expect(locator)")

# --- WON'T: XPath locators ---
xpath_patterns = [
    r"\.locator\s*\(\s*['\"`]//",
    r"\.locator\s*\(\s*['\"`]xpath=",
    r"\.locator\s*\(\s*`//",
    r"\.locator\s*\(\s*`xpath=",
]
for pat in xpath_patterns:
    if re.search(pat, code, re.IGNORECASE):
        errors.append("XPath locator forbidden — use getByRole/getByLabel/getByText")
        break

# --- WON'T: any type ---
any_patterns = [
    (r":\s*any\b", ": any"),
    (r"\bas\s+any\b", "as any"),
    (r"<\s*any\s*>", "<any>"),
    (r"Array\s*<\s*any\s*>", "Array<any>"),
]
for pat, label in any_patterns:
    if re.search(pat, code):
        errors.append(f"`{label}` forbidden — type explicitly or use unknown + narrow")
        break

# --- WON'T: hardcoded credentials ---
cred_patterns = [
    (r"Bearer\s+eyJ[A-Za-z0-9_-]{10,}", "hardcoded JWT Bearer token"),
    (r"['\"]Bearer\s+[A-Za-z0-9._-]{20,}['\"]", "hardcoded Bearer credential string"),
    (r"(?i)(?:password|passwd|api[_-]?key|secret|token)\s*[:=]\s*['\"][^'\"\\]{8,}['\"]", "hardcoded secret literal"),
    (r"Authorization\s*:\s*['\"]Bearer\s+[^'\"\\]{10,}['\"]", "hardcoded Authorization header"),
]
for pat, label in cred_patterns:
    for m in re.finditer(pat, code):
        snippet = m.group(0)
        if "process.env" in snippet or "${" in snippet:
            continue
        errors.append(f"{label}: {snippet[:60]}...")
        break
    if errors and errors[-1].startswith(label.split()[0]):
        break

# --- WON'T: tag on test.describe() (tests only) ---
if is_test_file:
    if re.search(r"test\.describe\s*\(\s*['\"`]@[\w-]+", code):
        errors.append("tag on test.describe() forbidden — tag individual tests only")
    if re.search(r"test\.describe\s*\([^)]*\btag\s*:\s*['\"`]@", code):
        errors.append("tag on test.describe() forbidden — tag individual tests only")

# --- WON'T: removed/weakened expect( (tests only) ---
def active_expect_count(content: str) -> int:
    return active_code_lines(content).count("expect(")


def reconstruct_old_content(new: str, edits: list) -> str | None:
    if not edits:
        return None
    old = new
    for edit in reversed(edits):
        new_string = edit.get("new_string", "")
        old_string = edit.get("old_string", "")
        if not new_string or new_string not in old:
            return None
        old = old.replace(new_string, old_string, 1)
    return old


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


if is_test_file:
    edits = payload.get("edits") or []
    old_content = reconstruct_old_content(new_content, edits)
    if old_content is None:
        old_content = git_head_content(file_path)

    if old_content is not None:
        old_count = active_expect_count(old_content)
        new_count = active_expect_count(new_content)
        if new_count < old_count:
            errors.append(
                f"assertion removed/weakened: expect( count dropped ({old_count} → {new_count})"
            )
        for edit in edits:
            old_snip = edit.get("old_string", "")
            new_snip = edit.get("new_string", "")
            if "expect(" in old_snip and active_expect_count(new_snip) < active_expect_count(old_snip):
                errors.append("assertion removed/weakened: expect( deleted or commented out in edit")
                break

if errors:
    detail = "; ".join(dict.fromkeys(errors))
    msg = f"constitution-guard blocked edit: {detail}. See .cursor/rules/constitution.mdc WON'T table."
    print(msg, file=sys.stderr)
    print(json.dumps({"user_message": msg, "agent_message": msg}))
    sys.exit(2)

sys.exit(0)
PY

printf '%s\n' '{}'
exit 0
