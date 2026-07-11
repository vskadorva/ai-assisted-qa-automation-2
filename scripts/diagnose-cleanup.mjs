import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const baseURL = process.env.DIDAXIS_URL ?? "https://test.didaxis.studio";
const email = process.env.DIDAXIS_EMAIL;
const password = process.env.DIDAXIS_PASSWORD;
const envToken = process.env.DIDAXIS_API_TOKEN;

async function apiPrograms(token) {
  const res = await fetch(`${baseURL}/api/programs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => null);
  const programs = Array.isArray(body) ? body : body?.data ?? [];
  return { status: res.status, programs };
}

async function apiDelete(token, uuid) {
  const res = await fetch(`${baseURL}/api/programs/${uuid}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, text: await res.text() };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ baseURL });
const page = await context.newPage();

let sessionToken = null;
let loginResponseKeys = null;
const loginUrls = [];
page.on("request", (request) => {
  if (request.method() === "POST") {
    loginUrls.push(request.url());
  }
  const auth = request.headers()["authorization"];
  if (auth?.startsWith("Bearer ")) {
    sessionToken = auth.slice(7);
  }
});
page.on("response", async (response) => {
  if (response.url().includes("/api/auth/login") && response.ok()) {
    const body = await response.json();
    loginResponseKeys = {
      top: Object.keys(body),
      data: body.data ? Object.keys(body.data) : null,
    };
  }
});

await page.goto("/login");
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password").fill(password);
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForURL((url) => !url.pathname.includes("/login"));
console.log("Login POST URLs:", [...new Set(loginUrls)]);
console.log("Login response keys:", loginResponseKeys);

await page.goto("/programs");
await page.getByRole("heading", { name: "Programs", level: 2 }).waitFor();
const uiCount = await page.locator("tbody tr").count();

const envApi = await apiPrograms(envToken);
const sessionApi = sessionToken
  ? await apiPrograms(sessionToken)
  : { status: "no-token", programs: [] };

console.log("=== Program counts ===");
console.log("UI table rows:", uiCount);
console.log("API with DIDAXIS_API_TOKEN:", envApi.status, envApi.programs.length);
console.log(
  "API with session token:",
  sessionApi.status,
  sessionApi.programs.length,
);

if (sessionApi.programs.length > 0) {
  console.log("\n=== Sample programs (session API) ===");
  for (const p of sessionApi.programs.slice(0, 8)) {
    console.log(`- ${p.id ?? p.uuid} | ${p.name ?? p.title}`);
  }
}

// Create one program and inspect response + cleanup
await page.getByRole("button", { name: "+ New Program" }).click();
const modal = page.getByRole("dialog", { name: "New Program" });
const programName = `Cleanup Diagnostic ${Date.now()}`;
await modal.getByLabel("Program Name").fill(programName);

const [createResponse] = await Promise.all([
  page.waitForResponse(
    (res) =>
      res.url().includes("/api/programs") &&
      res.request().method() === "POST" &&
      res.ok(),
  ),
  modal.getByRole("button", { name: "Create", exact: true }).click(),
]);

const createBody = await createResponse.json();
const uuid =
  createBody.data?.id ??
  createBody.data?.uuid ??
  createBody.id ??
  createBody.uuid;
console.log("\n=== Create response ===");
console.log("Keys:", Object.keys(createBody));
console.log("data keys:", createBody.data ? Object.keys(createBody.data) : null);
console.log("UUID field:", uuid);

const afterCreateUi = await page.locator("tbody tr").count();
const afterCreateApi = sessionToken
  ? await apiPrograms(sessionToken)
  : { programs: [] };
console.log("\nAfter create — UI rows:", afterCreateUi);
console.log("After create — API count:", afterCreateApi.programs.length);

if (uuid) {
  const envDelete = await apiDelete(envToken, uuid);
  const sessionDelete = sessionToken
    ? await apiDelete(sessionToken, uuid)
    : { status: "no-token" };
  console.log("\n=== Delete attempts ===");
  console.log("DELETE with DIDAXIS_API_TOKEN:", envDelete.status, envDelete.text.slice(0, 120));
  console.log(
    "DELETE with session token:",
    sessionDelete.status,
    sessionDelete.text.slice(0, 120),
  );

  const afterDeleteApi = sessionToken
    ? await apiPrograms(sessionToken)
    : { programs: [] };
  const afterDeleteUi = await page.locator("tbody tr").count();
  console.log("\nAfter delete — UI rows:", afterDeleteUi);
  console.log("After delete — API count:", afterDeleteApi.programs.length);
  console.log(
    "Diagnostic program still listed:",
    afterDeleteApi.programs.some(
      (p) => (p.id ?? p.uuid) === uuid || (p.name ?? p.title) === programName,
    ),
  );
}

await browser.close();
