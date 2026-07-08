#!/usr/bin/env node
/**
 * Run a failing Playwright test, then attach all captured screenshots to a Jira issue.
 *
 * Usage:
 *   node scripts/report-bug-with-screenshots.mjs DS-173 DS-1 "TC-011"
 *   node scripts/report-bug-with-screenshots.mjs DS-173 DS-1 "TC-011" tests/ds1-create-program.spec.ts
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const issueKey = process.argv[2];
const storyKey = process.argv[3];
const testPattern = process.argv[4];
const specFile = process.argv[5] || "tests/ds1-create-program.spec.ts";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!issueKey || !storyKey || !testPattern) {
  fail(
    "Usage: node scripts/report-bug-with-screenshots.mjs <ISSUE-KEY> <STORY-KEY> <test-pattern> [spec-file]",
  );
}

console.log(`Running test matching "${testPattern}" in ${specFile}...`);
spawnSync(
  "npx",
  ["playwright", "test", specFile, "-g", testPattern, "--workers=1"],
  { cwd: root, stdio: "inherit" },
);

console.log("Collecting screenshots...");
const collect = spawnSync(
  process.execPath,
  [path.join(__dirname, "collect-failure-screenshots.mjs"), "--latest"],
  { cwd: root, encoding: "utf8" },
);

if (collect.status !== 0) {
  process.stderr.write(collect.stderr);
  fail("No screenshots found after test run.");
}

const screenshots = collect.stdout.trim().split("\n").filter(Boolean);
console.log(`Found ${screenshots.length} screenshot(s).`);

spawnSync(
  process.execPath,
  [
    path.join(__dirname, "archive-failure-evidence.mjs"),
    storyKey,
    "--latest",
    testPattern,
  ],
  { cwd: root, stdio: "inherit" },
);

console.log(`Uploading to ${issueKey}...`);
const upload = spawnSync(
  process.execPath,
  [path.join(__dirname, "jira-attach-screenshots.mjs"), issueKey, ...screenshots],
  { cwd: root, stdio: "inherit" },
);

if (upload.status !== 0) {
  fail(`Failed to attach screenshots to ${issueKey}.`);
}

console.log(`Attached ${screenshots.length} screenshot(s) to ${issueKey}.`);
