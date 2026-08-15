#!/usr/bin/env bash
# stop hook: regenerate eval-report.md after agent/orchestrator sessions.
set -euo pipefail

input=$(cat)

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

# Fast, idempotent — always refresh on agent stop.
bash "$repo_root/scripts/generate-eval-report.sh" --runs 10 >/dev/null 2>&1 || true

printf '%s\n' '{
  "followup_message": "Orchestrator session ended. Read eval-report.md at the repo root — review the top reliability risk and next action, and summarize any changes for the user."
}'
exit 0
