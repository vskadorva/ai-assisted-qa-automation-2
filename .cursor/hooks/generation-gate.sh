#!/usr/bin/env bash
# Generation gate: after edits under tests/, block specs with no expect(
# or CSS/XPath page.locator usage.
set -euo pipefail

input=$(cat)
file_path=$(printf '%s' "$input" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("file_path") or d.get("path") or "")')

# Only gate files under tests/ (hooks.json matcher is tool-type Write)
case "$file_path" in
  */tests/*|tests/*) ;;
  *)
    printf '%s\n' '{}'
    exit 0
    ;;
esac

if [[ ! -f "$file_path" ]]; then
  printf '%s\n' '{"user_message":"generation-gate: edited file missing on disk","agent_message":"Generation gate could not read the edited file."}'
  exit 2
fi

python3 - "$file_path" <<'PY'
import re
import sys

path = sys.argv[1]
try:
    content = open(path, encoding="utf-8").read()
except OSError as e:
    print(f"generation-gate: cannot read {path}: {e}", file=sys.stderr)
    sys.exit(2)

errors = []

if "expect(" not in content:
    errors.append("no expect( — a test that asserts nothing")

# page.locator(...) whose string/template arg contains CSS/XPath markers
locator_re = re.compile(
    r"page\.locator\s*\(\s*(['\"`])(?P<arg>(?:\\.|(?!\1).)*)\1",
    re.DOTALL,
)
for m in locator_re.finditer(content):
    arg = m.group("arg")
    if "." in arg or "#" in arg or "//" in arg:
        errors.append(
            f"CSS/XPath page.locator forbidden: page.locator({m.group(1)}{arg}{m.group(1)})"
        )
        break

if errors:
    msg = "generation-gate blocked edit: " + "; ".join(errors)
    print(msg, file=sys.stderr)
    # Exit 2 = block (Cursor treats like permission deny)
    sys.exit(2)

sys.exit(0)
PY

# Allow: empty JSON is fine for afterFileEdit
printf '%s\n' '{}'
exit 0
