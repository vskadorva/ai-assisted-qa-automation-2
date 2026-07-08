#!/usr/bin/env node
/**
 * Attach screenshot files to a Jira issue via REST API.
 *
 * Requires in .env:
 *   JIRA_LOGIN_EMAIL
 *   JIRA_API_TOKEN   (preferred — create at id.atlassian.com/manage-profile/security/api-tokens)
 *   JIRA_SITE        (optional, default: legionqaschool.atlassian.net)
 *
 * Usage:
 *   node scripts/jira-attach-screenshots.mjs DS-173 path/to/a.png path/to/b.png
 *   node scripts/jira-attach-screenshots.mjs DS-173 $(node scripts/collect-failure-screenshots.mjs "TC-011")
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const issueKey = process.argv[2];
const files = process.argv.slice(3).filter(Boolean);

const site = (process.env.JIRA_SITE || "legionqaschool.atlassian.net").replace(
  /^https?:\/\//,
  "",
);
const email = process.env.JIRA_LOGIN_EMAIL;
const token = process.env.JIRA_API_TOKEN || process.env.JIRA_LOGIN_PASSWORD;

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!issueKey) {
  fail("Usage: node scripts/jira-attach-screenshots.mjs <ISSUE-KEY> <png> [png...]");
}

if (!email || !token) {
  fail(
    "Missing Jira credentials. Set JIRA_LOGIN_EMAIL and JIRA_API_TOKEN in .env (API token preferred).",
  );
}

if (files.length === 0) {
  fail("No screenshot files provided.");
}

for (const file of files) {
  if (!fs.existsSync(file)) {
    fail(`File not found: ${file}`);
  }
  if (!file.toLowerCase().endsWith(".png")) {
    fail(`Only PNG screenshots are supported: ${file}`);
  }
}

const auth = Buffer.from(`${email}:${token}`).toString("base64");
const uploaded = [];

for (const file of files) {
  const buffer = fs.readFileSync(file);
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "image/png" }), path.basename(file));

  const response = await fetch(
    `https://${site}/rest/api/3/issue/${issueKey}/attachments`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "X-Atlassian-Token": "no-check",
      },
      body: form,
    },
  );

  if (!response.ok) {
    const body = await response.text();
    fail(
      `Failed to attach ${path.basename(file)} to ${issueKey}: HTTP ${response.status}\n${body}\n` +
        (response.status === 401
          ? "Hint: Jira Cloud requires an API token (JIRA_API_TOKEN), not your account password."
          : ""),
    );
  }

  const result = await response.json();
  uploaded.push(result[0]?.filename || path.basename(file));
  console.log(`Attached ${path.basename(file)} → ${issueKey}`);
}

console.log(`Done. ${uploaded.length} file(s) attached to ${issueKey}.`);
