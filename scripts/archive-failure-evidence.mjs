#!/usr/bin/env node
/**
 * Copy failure screenshots from test-results/ into test-evidence/ for persistence.
 *
 * Usage:
 *   node scripts/archive-failure-evidence.mjs DS-1 --latest
 *   node scripts/archive-failure-evidence.mjs DS-1 --latest TC-011
 *   node scripts/archive-failure-evidence.mjs DS-1 "rejected-with-an-error"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const storyKey = process.argv[2];
const args = process.argv.slice(3);

if (!storyKey || args.length === 0) {
  console.error(
    "Usage: node scripts/archive-failure-evidence.mjs <STORY-KEY> --latest [slug]\n" +
      "   or: node scripts/archive-failure-evidence.mjs <STORY-KEY> <path-pattern>",
  );
  process.exit(1);
}

const useLatest = args.includes("--latest");
const slugArg = args.find((arg) => arg !== "--latest");
const pathPattern = useLatest ? "--latest" : args[0];

function collectScreenshots(collectPattern) {
  return spawnSync(
    process.execPath,
    [path.join(__dirname, "collect-failure-screenshots.mjs"), collectPattern],
    { encoding: "utf8" },
  );
}

let collect = collectScreenshots(pathPattern);

if (collect.status !== 0 && !useLatest) {
  collect = collectScreenshots("--latest");
}

if (collect.status !== 0) {
  process.stderr.write(collect.stderr);
  process.exit(collect.status ?? 1);
}

const sources = collect.stdout.trim().split("\n").filter(Boolean);
const slug = (useLatest ? slugArg || "latest" : args[0])
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");
const destDir = path.join(root, "test-evidence", storyKey);
fs.mkdirSync(destDir, { recursive: true });

for (const [index, src] of sources.entries()) {
  const base = path.basename(src, ".png");
  const dest = path.join(destDir, `${slug}-${index + 1}-${base}.png`);
  fs.copyFileSync(src, dest);
  console.log(`Archived ${src} → ${dest}`);
  console.log(dest);
}
