# Suite reliability report

Generated: 2026-08-15 01:01:51 UTC  
Window: last **10** CI runs (flake rate) · repository `ai-assisted-qa-automation-2`

---

## 1. Flake rate

**Number:** measurement pending (no Playwright JSON found)  
**Detail:** 0 flaky / 0 passed tests in window  
**How measured:** Downloaded Playwright JSON from up to 10 runs each of `e2e.yml` and `test-generation.yml` via `gh run download`. JSON reporter is configured in `playwright.config.ts`; awaiting first CI runs with `playwright-json` artifacts.  
**What it tells us:** Without JSON results we cannot distinguish pass-on-retry from first-pass success.

---

## 2. Heal success rate

**Number:** 100% (2/2) (clean heals / total heal PRs)  
**Clean / total:** 2 / 2  
**Masked-regression count:** **0** (must be 0)  
**How measured:** `gh pr list` filtered for heal/repair/drift/self-heal in title/body (2 PRs); clean = merged/green E2E without masked-regression keywords in PR body/comments (keyword scan — may under-count if regressions were not documented in PR text)  
**What it tells us:** Clean heals fix drift without assertion changes; masked-regression > 0 means a heal hid a real failure.

---

## 3. Generation-gate pass rate

**Number:** 40% (2/5)  
**Passed / total:** 2 / 5  
**How measured:** PRs with `tests-generated` label or DS-* in title/body touching `tests/` (5 sampled); pass = first CI green + no generation-gate/assertion-guard signals in diff + AC/Gherkin reference in body  
**What it tells us:** Low pass rate means test-writer output or hooks need tightening before merge.

---

## 4. Ask-vs-guess

**Number:** 13 asks / 3 guessed values  
**Asked / guessed:** 13 / 3  
**How measured:** Session review: scanned 30 recent `.jsonl` transcripts under `~/.cursor/projects/…/agent-transcripts/` for AskQuestion tool calls, clarifying questions, and invented literals in Write→tests/  
**What it tells us:** More guesses than asks correlates with wrong env data, brittle locators, and rework.

---

## Summary

**Top reliability risk:** missing flake telemetry  
**Next action:** Wait for next E2E/test-generation CI run to populate playwright-json artifacts

---

_Report produced by `scripts/generate-eval-report.sh`. Cursor has no built-in telemetry for these metrics; figures come from CI artifacts/logs, GitHub PR history, and local session transcript review._
