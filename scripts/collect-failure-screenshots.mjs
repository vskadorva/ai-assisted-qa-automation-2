#!/usr/bin/env node
/**
 * Find PNG screenshots under test-results/ for a failing test.
 *
 * Usage:
 *   node scripts/collect-failure-screenshots.mjs --latest
 *   node scripts/collect-failure-screenshots.mjs "rejected-with-an-error"
 *   node scripts/collect-failure-screenshots.mjs "TC-011"
 *
 * Use --latest immediately after a single Playwright test run (recommended).
 * Prints one absolute path per line (stdout). Exits 1 if none found.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const testResultsDir = path.join(root, "test-results");
const args = process.argv.slice(2);
const latestOnly = args.includes("--latest");
const pattern = args.filter((arg) => arg !== "--latest").join(" ").trim();

if (!latestOnly && !pattern) {
  console.error(
    "Usage: node scripts/collect-failure-screenshots.mjs --latest\n" +
      "   or: node scripts/collect-failure-screenshots.mjs <path-pattern>",
  );
  process.exit(1);
}

if (!fs.existsSync(testResultsDir)) {
  console.error(`No test-results directory at ${testResultsDir}. Run the failing test first.`);
  process.exit(1);
}

const matches = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".png")) {
      matches.push(fullPath);
    }
  }
}

walk(testResultsDir);

let filtered = matches;

if (!latestOnly && pattern) {
  const needle = pattern.toLowerCase();
  filtered = matches.filter((fullPath) => {
    const relative = path.relative(testResultsDir, fullPath);
    return relative.toLowerCase().includes(needle);
  });
}

filtered.sort();

if (filtered.length === 0) {
  console.error(
    latestOnly
      ? "No PNG screenshots found under test-results/. Run the failing test first."
      : `No PNG screenshots found under test-results/ matching "${pattern}". Try --latest after a single-test run.`,
  );
  process.exit(1);
}

for (const file of filtered) {
  console.log(file);
}
