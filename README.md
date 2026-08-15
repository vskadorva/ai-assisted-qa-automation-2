# AI-Assisted QA Automation

Playwright end-to-end tests for [Didaxis Studio](https://test.didaxis.studio), with Cursor agents and skills that turn Jira tickets into specs, triage failures, and open repair PRs.

## Prerequisites

- **Node.js 20** (matches CI)
- **Git**
- Access to a Didaxis test environment and credentials (ask your team lead)

## Install

```bash
git clone <repo-url>
cd ai-assisted-qa-automation-2
npm ci
npx playwright install --with-deps chromium
```

## Environment

```bash
cp .env.example .env
```

Edit `.env` with real values. See [`.env.example`](.env.example) for descriptions of each variable.

| Section | Needed for |
|---------|------------|
| **Run tests** | `npx playwright test` locally and in the E2E workflow |
| **Agent / CI setup** | Cursor backlog automation and Jira MCP — not required to run tests yourself |

Never commit `.env` or put real secrets in `.env.example`.

## Run tests

Full suite (runs `auth.setup.ts` first, then all specs under `tests/`):

```bash
npx playwright test
```

Run a single spec file:

```bash
npx playwright test tests/ds1-create-program.spec.ts
```

Run a tagged slice (exactly one tag per test — see `.cursor/rules/playwright-conventions.mdc` §5):

```bash
npm run test:smoke
npm run test:sanity
npm run test:regression
npm run test:api
npm run test:e2e
npm run test:destructive   # serial: --workers=1
```

Open the HTML report after a CI or local run with the html reporter:

```bash
npx playwright show-report
```

### What happens on first run

1. The **setup** project runs `tests/auth.setup.ts`, logs in with `DIDAXIS_EMAIL` / `DIDAXIS_PASSWORD`, and saves session cookies to `playwright/.auth/user.json`.
2. Feature tests reuse that session via `storageState` — no per-test login.

See [`auth-strategy.md`](auth-strategy.md) for when to use UI login vs API login vs stored session.

## Project layout

```
tests/           Playwright specs (one file per Jira ticket where possible)
pages/           Page Object Models — locators and actions, no assertions
fixtures/        Shared test fixtures (cleanup, program API helpers)
test-data/       Faker factories, invalid input sets, enums (paths, copy)
features/        Gherkin feature files (test plans)
.cursor/
  rules/         Always-on policies (constitution, orchestration, conventions)
  skills/        Step-by-step playbooks (jira-ticket-to-gherkin, self-heal, …)
  agents/        Subagent prompts (test-writer, triage, bug-reporter)
  hooks/         Guard scripts that block bad edits (assertions, locators, scope)
.github/workflows/
  e2e.yml        Runs the full suite on push/PR
  test-generation.yml  Headless Cursor agent backlog (weekdays 06:00 UTC)
```

## Cursor setup (agents & skills)

To generate or extend tests with the AI workflow in Cursor:

1. **Open this repo in Cursor** — rules under `.cursor/rules/` load automatically (`constitution.mdc`, `qa-orchestration.mdc`, `playwright-conventions.mdc`).

2. **Copy env vars** — at minimum the **Run tests** block in `.env`. For Jira-driven workflows, also fill the **Agent / CI setup** block.

3. **Configure MCP in Cursor settings** (Settings → MCP) so the agent can reach external systems:
   - **Atlassian** — Jira ticket lookup, labels, comments (`ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`, `ATLASSIAN_BASE_URL`)
   - **GitHub** — PRs, CI logs, issue comments
   - **Playwright** — live browser / a11y tree for exploration and self-heal

4. **Typical local flow** (orchestrated by `qa-orchestration.mdc`):
   - Give a Jira key (e.g. `DS-42`) → agent runs **jira-ticket-to-gherkin** → **test-writer** writes a spec → `npx playwright test`
   - Red run → **triage** classifies → **self-heal** (locator drift) or **bug-reporter** (real defect)

5. **Hooks** (`.cursor/hooks.json`) run on file edits and enforce project guardrails — e.g. no CSS/XPath locators, no weakened assertions, test-writer stays under `tests/`.

Skills and agents live in `.cursor/skills/` and `.cursor/agents/`; the coordinator reads them automatically when relevant.

## CI & GitHub secrets

### E2E Tests (`.github/workflows/e2e.yml`)

Runs on push/PR to `main` and on a daily schedule. Requires:

| Secret | Purpose |
|--------|---------|
| `DIDAXIS_URL` | Target environment |
| `DIDAXIS_EMAIL` | Login for auth setup |
| `DIDAXIS_PASSWORD` | Login for auth setup |
| `DIDAXIS_API_TOKEN` | API cleanup and helpers |

### Test Generation (`.github/workflows/test-generation.yml`)

Runs weekdays at 06:00 UTC (and on manual dispatch). A headless Cursor agent works the Jira **In Progress** backlog. Requires all E2E secrets plus:

| Secret | Purpose |
|--------|---------|
| `CURSOR_API_KEY` | Cursor CLI (`agent -p`) authentication |
| `ATLASSIAN_API_TOKEN` | Jira REST / MCP |
| `ATLASSIAN_EMAIL` | Jira account email |
| `ATLASSIAN_BASE_URL` | Jira site URL |
| `JIRA_PROJECT_KEY` | Project key (e.g. `DS`) |
| `GH_PAT_AI_2` | GitHub PAT for creating branches and PRs |

Configure these under **Repository → Settings → Secrets and variables → Actions**. Cursor Cloud/API keys are separate from repo secrets — store `CURSOR_API_KEY` in both GitHub Actions and your local `.env` if you run the agent locally.

## Useful scripts

```bash
# Tagged slices (see playwright-conventions.mdc §5)
npm run test:smoke
npm run test:sanity
npm run test:regression
npm run test:api
npm run test:e2e
npm run test:destructive

# Delete all programs in the target environment (dry run by default)
npm run cleanup:programs

# Confirm deletion
npm run cleanup:programs:confirm
```

## Conventions (short)

- Role-based locators only (`getByRole`, `getByLabel`, `getByText`) — see `.cursor/rules/playwright-conventions.mdc`
- Test data via `test-data/factories/` + automatic cleanup via `trackProgram`
- One tag per test (`@smoke`, `@sanity`, `@regression`, `@api`, `@e2e`, or `@destructive`) on the `test()` call — not on `describe`

For the full non-negotiables, see [`.cursor/rules/constitution.mdc`](.cursor/rules/constitution.mdc).
