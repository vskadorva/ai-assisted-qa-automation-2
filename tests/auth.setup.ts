import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be set in the environment (.env)",
    );
  }

  await page.goto("https://test.didaxis.studio/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await page.goto("/programs");
  await page.waitForURL("**/programs");

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
  console.log(
    `[auth.setup] fresh login complete → saved storageState to ${authFile}`,
  );
});
