import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { ProgramsPage } from "../pages/ProgramsPage";

test.describe("Programs accessibility", () => {
  test.fixme(
    "Programs page has no accessibility violations",
    { tag: "@regression" },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      await expect(programsPage.heading).toBeVisible();

      const results = await new AxeBuilder({ page }).analyze();

      await expect(results.violations).toEqual([]);
    },
  );

  test.fixme(
    "New Program modal has no accessibility violations",
    { tag: "@regression" },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;

      await programsPage.goto();
      await expect(programsPage.heading).toBeVisible();
      await programsPage.openNewProgramForm();
      await expect(modal.dialog).toBeVisible();

      const results = await new AxeBuilder({ page })
        .include(await modal.axeIncludeSelector())
        .disableRules(["color-contrast"])
        .analyze();

      await expect(results.violations).toEqual([]);
    },
  );
});
