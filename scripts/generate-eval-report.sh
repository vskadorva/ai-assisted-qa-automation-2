#!/usr/bin/env bash
# Generate eval-report.md — suite reliability metrics for QA orchestration.
# Exits 0 even when some metrics are unavailable (noted in the report).
set -euo pipefail

RUNS=10
while [[ $# -gt 0 ]]; do
  case "$1" in
    --runs)
      RUNS="${2:-10}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      shift
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

REPORT="$REPO_ROOT/eval-report.md"
TMPDIR="${TMPDIR:-/tmp}/eval-report-$$"
mkdir -p "$TMPDIR"
trap 'rm -rf "$TMPDIR"' EXIT

GH_AVAILABLE=0
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  GH_AVAILABLE=1
fi

python3 - "$REPO_ROOT" "$RUNS" "$GH_AVAILABLE" "$REPORT" "$TMPDIR" <<'PY'
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

repo_root = Path(sys.argv[1])
runs_limit = int(sys.argv[2])
gh_available = sys.argv[3] == "1"
report_path = Path(sys.argv[4])
tmpdir = Path(sys.argv[5])

now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def run_gh(args, check=False):
    env = os.environ.copy()
    try:
        proc = subprocess.run(
            ["gh", *args],
            cwd=repo_root,
            capture_output=True,
            text=True,
            env=env,
        )
    except FileNotFoundError:
        return None
    if check and proc.returncode != 0:
        return None
    if proc.returncode != 0:
        return None
    return proc.stdout.strip()


def parse_playwright_json(path: Path):
    """Return (total_passed, flaky_count, flaky_names)."""
    if not path.is_file():
        return 0, 0, []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return 0, 0, []

    total_passed = 0
    flaky = []

    def walk_suites(suites):
        nonlocal total_passed
        for suite in suites or []:
            for spec in suite.get("specs") or []:
                for test in spec.get("tests") or []:
                    results = test.get("results") or []
                    if not results:
                        continue
                    final = results[-1]
                    if final.get("status") == "passed":
                        total_passed += 1
                        failed_before = any(
                            r.get("status") in ("failed", "timedOut", "interrupted")
                            for r in results[:-1]
                        )
                        retry_index = final.get("retry", 0)
                        if failed_before or retry_index > 0:
                            title = " › ".join(
                                p for p in [suite.get("title"), spec.get("title"), test.get("title")] if p
                            )
                            flaky.append(title or "unknown test")
            walk_suites(suite.get("suites"))

    walk_suites(data.get("suites"))
    return total_passed, len(flaky), flaky


def collect_json_sources():
    sources = []
    local = repo_root / "test-results" / "results.json"
    if local.is_file():
        sources.append(("local workspace", local))
    for name in sorted(tmpdir.glob("results-*.json")):
        sources.append((name.stem, name))
    return sources


def download_workflow_artifacts(workflow_file: str, limit: int):
    if not gh_available:
        return 0
    out = run_gh(
        [
            "run",
            "list",
            "--workflow",
            workflow_file,
            "--limit",
            str(limit),
            "--json",
            "databaseId,conclusion,status",
        ]
    )
    if not out:
        return 0
    try:
        runs = json.loads(out)
    except json.JSONDecodeError:
        return 0

    downloaded = 0
    for run in runs:
        if run.get("status") != "completed":
            continue
        run_id = run["databaseId"]
        dest = tmpdir / f"artifact-{workflow_file.replace('.', '-')}-{run_id}"
        dest.mkdir(parents=True, exist_ok=True)
        proc = subprocess.run(
            ["gh", "run", "download", str(run_id), "-D", str(dest)],
            cwd=repo_root,
            capture_output=True,
            text=True,
        )
        if proc.returncode != 0:
            continue
        for results in dest.rglob("results.json"):
            target = tmpdir / f"results-{workflow_file}-{run_id}.json"
            target.write_bytes(results.read_bytes())
            downloaded += 1
    return downloaded


def compute_flake_rate():
    note_parts = []
    downloaded = 0
    if gh_available:
        downloaded += download_workflow_artifacts("e2e.yml", runs_limit)
        downloaded += download_workflow_artifacts("test-generation.yml", runs_limit)
        note_parts.append(
            f"Downloaded Playwright JSON from up to {runs_limit} runs each of `e2e.yml` and `test-generation.yml` via `gh run download`"
        )
    else:
        note_parts.append(
            "`gh` unavailable or not authenticated — using local `test-results/results.json` only (CI artifact history skipped)"
        )

    sources = collect_json_sources()
    if not sources and downloaded == 0:
        reporter_note = (
            "JSON reporter is configured in `playwright.config.ts`; awaiting first CI runs with `playwright-json` artifacts."
            if (repo_root / "playwright.config.ts").read_text(encoding="utf-8").find("results.json") >= 0
            else "Enable JSON reporter in CI (`playwright.config.ts`) and upload `test-results/` artifacts."
        )
        return {
            "value": "measurement pending (no Playwright JSON found)",
            "detail": "0 flaky / 0 passed tests in window",
            "method": "; ".join(note_parts) + ". " + reporter_note,
            "insight": "Without JSON results we cannot distinguish pass-on-retry from first-pass success.",
        }

    all_flaky = set()
    total_passed = 0
    for label, path in sources:
        tp, fc, names = parse_playwright_json(path)
        total_passed += tp
        all_flaky.update(names)

    flaky_count = len(all_flaky)
    if total_passed == 0 and flaky_count == 0:
        rate = "measurement pending (0 completed test results in window)"
    elif total_passed == 0:
        rate = f"{flaky_count} flaky (denominator pending)"
    else:
        pct = (flaky_count / total_passed) * 100
        rate = f"{pct:.1f}% ({flaky_count} flaky / {total_passed} passed)"

    method = "; ".join(note_parts)
    if sources:
        method += f". Parsed {len(sources)} `results.json` file(s)."
    method += " Flaky = final status passed after ≥1 failed/timedOut attempt or retry index > 0."

    return {
        "value": rate,
        "detail": f"{flaky_count} unique test(s) passed only on retry",
        "method": method,
        "insight": "High flake rate means CI retries mask instability and slow triage/heal loops.",
    }


def search_heal_prs():
    if not gh_available:
        return None
    out = run_gh(
        [
            "pr",
            "list",
            "--state",
            "all",
            "--limit",
            "100",
            "--json",
            "number,title,body,state,mergedAt,url",
        ]
    )
    if not out:
        return []
    try:
        all_prs = json.loads(out)
    except json.JSONDecodeError:
        return []
    keywords = ("heal", "repair", "drift", "self-heal")
    return [
        pr
        for pr in all_prs
        if any(k in ((pr.get("title") or "") + (pr.get("body") or "")).lower() for k in keywords)
    ]


def compute_heal_rate():
    prs = search_heal_prs()
    if prs is None:
        return {
            "value": "measurement pending",
            "clean": "—",
            "total": "—",
            "masked_regression": 0,
            "method": "`gh` unavailable — cannot search PRs for heal/repair/drift keywords",
            "insight": "Track heal PR merge rate to ensure locator drift fixes do not weaken coverage.",
        }

    total = len(prs)
    clean = 0
    masked = 0
    regression_terms = re.compile(
        r"masked[\s-]regression|regression[\s-]masked|previously[\s-]passing[\s-]test[\s-]now[\s-]fail",
        re.I,
    )

    for pr in prs:
        num = pr["number"]
        comments = run_gh(["pr", "view", str(num), "--json", "comments", "-q", ".comments[].body"])
        body = run_gh(["pr", "view", str(num), "--json", "body", "-q", ".body"]) or ""
        text_blob = body
        if comments:
            text_blob += "\n" + comments

        if regression_terms.search(text_blob):
            masked += 1
            continue

        checks = run_gh(["pr", "checks", str(num), "--json", "name,state,bucket"])
        green = False
        if checks:
            try:
                check_list = json.loads(checks)
                e2e = [c for c in check_list if "e2e" in c.get("name", "").lower() or "test" in c.get("name", "").lower()]
                if e2e and all(c.get("bucket") == "pass" or c.get("state") == "SUCCESS" for c in e2e):
                    green = True
                elif pr.get("state") == "MERGED" and pr.get("mergedAt"):
                    green = True
            except json.JSONDecodeError:
                pass
        if green or (pr.get("state") == "MERGED" and pr.get("mergedAt")):
            clean += 1

    if total == 0:
        value = "N/A (0 heal PRs found)"
    else:
        pct = (clean / total) * 100
        value = f"{pct:.0f}% ({clean}/{total})"

    return {
        "value": value,
        "clean": str(clean),
        "total": str(total),
        "masked_regression": masked,
        "method": f"`gh pr list` filtered for heal/repair/drift/self-heal in title/body ({total} PRs); clean = merged/green E2E without masked-regression keywords in PR body/comments (keyword scan — may under-count if regressions were not documented in PR text)",
        "insight": "Clean heals fix drift without assertion changes; masked-regression > 0 means a heal hid a real failure.",
    }


def compute_generation_gate():
    if not gh_available:
        return {
            "value": "measurement pending",
            "passed": "—",
            "total": "—",
            "method": "`gh` unavailable — cannot inspect test-generation PRs",
            "insight": "First-PR green + hook conformance predicts backlog throughput.",
        }

    out = run_gh(
        [
            "pr",
            "list",
            "--state",
            "all",
            "--limit",
            "100",
            "--json",
            "number,title,body,labels",
        ]
    )
    if not out:
        return {
            "value": "measurement pending",
            "passed": "—",
            "total": "—",
            "method": "`gh pr list` returned no data",
            "insight": "First-PR green + hook conformance predicts backlog throughput.",
        }

    try:
        all_prs = json.loads(out)
    except json.JSONDecodeError:
        return {
            "value": "measurement pending",
            "passed": "—",
            "total": "—",
            "method": "Failed to parse PR list JSON",
            "insight": "First-PR green + hook conformance predicts backlog throughput.",
        }

    candidates = []
    for pr in all_prs:
        labels = {lb.get("name", "") for lb in pr.get("labels") or []}
        title = pr.get("title") or ""
        body = pr.get("body") or ""
        if "tests-generated" in labels or re.search(r"\bDS-\d+\b", title + body):
            if re.search(r"tests/|playwright|spec", title + body, re.I):
                candidates.append(pr)

    passed = 0
    for pr in candidates:
        num = pr["number"]
        files = run_gh(["pr", "view", str(num), "--json", "files", "-q", ".files[].path"])
        if not files or "tests/" not in files:
            continue
        diff = run_gh(["pr", "diff", str(num)]) or ""
        hook_block = bool(
            re.search(r"generation-gate|assertion-guard|no expect\(", diff, re.I)
        )
        checks = run_gh(["pr", "checks", str(num), "--json", "name,bucket,state"])
        first_green = False
        if checks:
            try:
                cl = json.loads(checks)
                relevant = [c for c in cl if any(x in c.get("name", "").lower() for x in ("e2e", "test", "playwright"))]
                first_green = bool(relevant) and all(
                    c.get("bucket") == "pass" or c.get("state") == "SUCCESS" for c in relevant
                )
            except json.JSONDecodeError:
                pass
        ac_maps = bool(re.search(r"DS-\d+|acceptance|Gherkin|scenario", pr.get("body") or "", re.I))
        conforming = not hook_block
        if first_green and conforming and ac_maps:
            passed += 1

    total = len(candidates)
    if total == 0:
        value = "N/A (0 generation PRs in sample)"
    else:
        value = f"{(passed / total) * 100:.0f}% ({passed}/{total})"

    return {
        "value": value,
        "passed": str(passed),
        "total": str(total),
        "method": f"PRs with `tests-generated` label or DS-* in title/body touching `tests/` ({total} sampled); pass = first CI green + no generation-gate/assertion-guard signals in diff + AC/Gherkin reference in body",
        "insight": "Low pass rate means test-writer output or hooks need tightening before merge.",
    }


def find_transcript_dirs():
    dirs = []
    home = Path.home()
    patterns = [
        home / ".cursor" / "projects",
        repo_root / ".cursor" / "projects",
    ]
    repo_name = repo_root.name
    for base in patterns:
        if not base.is_dir():
            continue
        for p in base.rglob("agent-transcripts"):
            if repo_name in str(p):
                dirs.append(p)
    return dirs


def compute_ask_vs_guess():
    transcript_dirs = find_transcript_dirs()
    if not transcript_dirs:
        return {
            "value": "measurement pending",
            "asked": "—",
            "guessed": "—",
            "method": "No agent transcript directories found under `~/.cursor/projects/`",
            "insight": "Agents should AskQuestion (or ask in chat) instead of inventing env URLs, ticket AC, or credentials.",
        }

    ask_count = 0
    guess_count = 0
    files_scanned = 0

    ask_tool = re.compile(r'"name"\s*:\s*"AskQuestion"')
    ask_chat = re.compile(
        r"(could you clarify|please confirm|which (value|option|environment)|should I use|do you want me to)",
        re.I,
    )
    invented_literal = re.compile(
        r"(https://test\.didaxis\.studio|your-admin@example\.com|password123|api_token_here)",
        re.I,
    )

    for tdir in transcript_dirs:
        for jf in sorted(tdir.rglob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)[:30]:
            files_scanned += 1
            try:
                text = jf.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            ask_count += len(ask_tool.findall(text))
            ask_count += len(ask_chat.findall(text))
            for line in text.splitlines():
                if "tests/" not in line:
                    continue
                if '"Write"' in line or '"file_path"' in line:
                    if invented_literal.search(line):
                        guess_count += 1

    if ask_count == 0 and guess_count == 0:
        value = f"0 asks / 0 guesses (scanned {files_scanned} transcript files)"
    else:
        value = f"{ask_count} asks / {guess_count} guessed values"

    return {
        "value": value,
        "asked": str(ask_count),
        "guessed": str(guess_count),
        "method": f"Session review: scanned {files_scanned} recent `.jsonl` transcripts under `~/.cursor/projects/…/agent-transcripts/` for AskQuestion tool calls, clarifying questions, and invented literals in Write→tests/",
        "insight": "More guesses than asks correlates with wrong env data, brittle locators, and rework.",
    }


flake = compute_flake_rate()
heal = compute_heal_rate()
gate = compute_generation_gate()
ask = compute_ask_vs_guess()

# Top risk heuristic
risks = []
if "pending" in flake["value"] or flake["value"].startswith("measurement"):
    if "awaiting first CI" in flake["method"]:
        risks.append(("missing flake telemetry", "Wait for next E2E/test-generation CI run to populate playwright-json artifacts"))
    else:
        risks.append(("missing flake telemetry", "Add JSON reporter artifacts to E2E and test-generation workflows"))
if heal.get("masked_regression", 0) > 0:
    risks.append(("masked regressions from heals", "Audit heal PRs; never weaken assertions"))
if heal.get("total") == "0" and gh_available:
    risks.append(("no heal history", "Insufficient drift/heal data — monitor after first repair PRs"))
if ask.get("guessed") not in ("—", "0") and ask.get("asked") not in ("—", "0"):
    try:
        if int(ask.get("guessed", 0)) > int(ask.get("asked", 0)):
            risks.append(("ask-vs-guess imbalance", "Prompt coordinator to AskQuestion before inventing test data"))
    except ValueError:
        pass
elif ask.get("asked") in ("—", "0") and ask.get("guessed") not in ("—", "0"):
    risks.append(("ask-vs-guess imbalance", "Prompt coordinator to AskQuestion before inventing test data"))
if not risks:
    risks.append(("baseline collection", "Metrics are establishing baseline — re-run after next CI cycle"))

top_risk, next_action = risks[0]

report = f"""# Suite reliability report

Generated: {now}  
Window: last **{runs_limit}** CI runs (flake rate) · repository `{repo_root.name}`

---

## 1. Flake rate

**Number:** {flake['value']}  
**Detail:** {flake['detail']}  
**How measured:** {flake['method']}  
**What it tells us:** {flake['insight']}

---

## 2. Heal success rate

**Number:** {heal['value']} (clean heals / total heal PRs)  
**Clean / total:** {heal['clean']} / {heal['total']}  
**Masked-regression count:** **{heal['masked_regression']}** (must be 0)  
**How measured:** {heal['method']}  
**What it tells us:** {heal['insight']}

---

## 3. Generation-gate pass rate

**Number:** {gate['value']}  
**Passed / total:** {gate['passed']} / {gate['total']}  
**How measured:** {gate['method']}  
**What it tells us:** {gate['insight']}

---

## 4. Ask-vs-guess

**Number:** {ask['value']}  
**Asked / guessed:** {ask['asked']} / {ask['guessed']}  
**How measured:** {ask['method']}  
**What it tells us:** {ask['insight']}

---

## Summary

**Top reliability risk:** {top_risk}  
**Next action:** {next_action}

---

_Report produced by `scripts/generate-eval-report.sh`. Cursor has no built-in telemetry for these metrics; figures come from CI artifacts/logs, GitHub PR history, and local session transcript review._
"""

report_path.write_text(report, encoding="utf-8")
print(f"Wrote {report_path}")
PY

exit 0
