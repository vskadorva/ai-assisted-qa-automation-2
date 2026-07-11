import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const baseUrl = process.env.DIDAXIS_URL ?? "https://test.didaxis.studio";
const confirm = process.argv.includes("--confirm");
const dryRun = !confirm;

async function tokenWorks(token) {
  const res = await fetch(`${baseUrl}/api/programs?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

async function getApiToken() {
  const envToken = process.env.DIDAXIS_API_TOKEN;
  if (envToken && (await tokenWorks(envToken))) {
    return envToken;
  }

  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    return null;
  }

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    return null;
  }

  const loginBody = await loginRes.json();
  const token = loginBody.data?.access_token;
  if (token && (await tokenWorks(token))) {
    return token;
  }

  return null;
}

function extractPrograms(body) {
  if (Array.isArray(body)) {
    return body;
  }
  if (body?.data && Array.isArray(body.data)) {
    return body.data;
  }
  return [];
}

function programId(program) {
  return program.id ?? program.uuid;
}

async function fetchAllPrograms(token) {
  const res = await fetch(`${baseUrl}/api/programs`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`GET /api/programs failed: ${res.status}`);
  }

  const body = await res.json();
  return extractPrograms(body);
}

async function deleteProgram(token, uuid) {
  const res = await fetch(`${baseUrl}/api/programs/${uuid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, ok: res.ok, text: await res.text() };
}

const token = await getApiToken();
if (!token) {
  console.error(
    "Could not obtain API token. Set DIDAXIS_API_TOKEN or DIDAXIS_EMAIL/DIDAXIS_PASSWORD in .env",
  );
  process.exit(1);
}

const programs = await fetchAllPrograms(token);
const targets = programs
  .map((program) => ({
    uuid: programId(program),
    name: program.name ?? program.title ?? "(unnamed)",
  }))
  .filter((program) => program.uuid);

console.log(`Target: ${baseUrl}`);
console.log(`Programs found: ${targets.length}`);

if (targets.length === 0) {
  console.log("Nothing to delete.");
  process.exit(0);
}

for (const program of targets) {
  console.log(`- ${program.uuid} | ${program.name}`);
}

if (dryRun) {
  console.log("\nDry run only. Re-run with --confirm to delete all listed programs.");
  process.exit(0);
}

let deleted = 0;
let failed = 0;

for (const program of targets) {
  const result = await deleteProgram(token, program.uuid);
  if (result.ok) {
    deleted += 1;
    console.log(`Deleted ${program.uuid} (${program.name})`);
  } else {
    failed += 1;
    console.warn(
      `Failed ${program.uuid} (${program.name}): ${result.status} ${result.text.slice(0, 120)}`,
    );
  }
}

console.log(`\nDone. Deleted: ${deleted}, failed: ${failed}`);
