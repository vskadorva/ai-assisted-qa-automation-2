import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/cleanup.fixture";
import { ProgramsPage } from "../pages/ProgramsPage";

function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

async function seedProgram(
  programsPage: ProgramsPage,
  trackProgram: (uuid: string) => void,
  name: string,
  description: string,
): Promise<void> {
  await programsPage.openNewProgramForm();
  await programsPage.createProgram(name, trackProgram, description);
  await expect(programsPage.programRow(name)).toBeVisible();
}

test.describe("DS-2: Edit existing program details", () => {
  test.beforeEach(async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
    await expect(programsPage.heading).toBeVisible();
  });

  test(
    "TC-001 — Edit form opens pre-populated",
    { tag: "@smoke" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const description = "Full-stack web development program";

      await seedProgram(programsPage, trackProgram, programName, description);
      await programsPage.openEditProgram(programName);

      await expect(modal.dialog).toBeVisible();
      await expect(modal.heading).toBeVisible();
      await expect(modal.programName).toHaveValue(programName);
      await expect(modal.description).toHaveValue(description);
      await expect(modal.saveButton).toBeVisible();
      await expect(modal.cancelButton).toBeVisible();
      await expect(modal.closeButton).toBeVisible();
    },
  );

  test(
    "TC-002 — Program name updated successfully (immediate list refresh)",
    { tag: "@smoke" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const updatedName = `${programName} - Updated`;

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Full-stack web development program",
      );
      await programsPage.openEditProgram(programName);
      await modal.fillProgramName(updatedName);
      await programsPage.saveEditedProgram();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(updatedName)).toBeVisible();
      await expect(programsPage.programRow(programName)).toHaveCount(0);
    },
  );

  test(
    "TC-003 — Updating only Description preserves Program Name",
    { tag: "@sanity" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const originalDescription = "Full-stack web development program";
      const updatedDescription = "Updated full-stack curriculum for 2026";

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        originalDescription,
      );
      await programsPage.openEditProgram(programName);
      await modal.fillDescription(updatedDescription);
      await programsPage.saveEditedProgram();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(
        programsPage.programRowDescription(programName, updatedDescription),
      ).toBeVisible();
      await expect(
        programsPage.programRowDescription(programName, originalDescription),
      ).toHaveCount(0);
    },
  );

  test(
    "TC-004 — Both name and description updated together",
    { tag: "@sanity" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Data Science Fundamentals");
      const updatedName = `${programName} 2026`;
      const updatedDescription =
        "Expanded curriculum with machine learning modules";

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Introductory data science track",
      );
      await programsPage.openEditProgram(programName);
      await modal.fillProgramName(updatedName);
      await modal.fillDescription(updatedDescription);
      await programsPage.saveEditedProgram();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(updatedName)).toBeVisible();
      await expect(
        programsPage.programRowDescription(updatedName, updatedDescription),
      ).toBeVisible();
    },
  );

  test(
    "TC-005 — Description can be cleared on edit",
    { tag: "@sanity" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Cybersecurity Basics");
      const originalDescription = "Foundational security concepts";

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        originalDescription,
      );
      await programsPage.openEditProgram(programName);
      await modal.clearDescription();
      await programsPage.saveEditedProgram();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(programsPage.programCell(programName)).toHaveText(programName);
      await expect(
        programsPage.programRowDescription(programName, originalDescription),
      ).toHaveCount(0);
    },
  );

  test(
    "TC-009 — Cancel does not persist changes",
    { tag: "@sanity" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const originalDescription = "Full-stack web development program";

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        originalDescription,
      );
      await programsPage.openEditProgram(programName);
      await modal.fillProgramName("Temporary Rename");
      await modal.fillDescription("Temporary description");
      await modal.clickCancel();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(
        programsPage.programRowDescription(programName, originalDescription),
      ).toBeVisible();
      await expect(programsPage.programRow("Temporary Rename")).toHaveCount(0);
    },
  );

  test(
    "TC-010 — Header X close does not persist changes",
    { tag: "@sanity" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const attemptedRename = "X Close Test Rename";

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Full-stack web development program",
      );
      await programsPage.openEditProgram(programName);
      await modal.fillProgramName(attemptedRename);
      await modal.clickClose();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(programsPage.programRow(attemptedRename)).toHaveCount(0);
    },
  );

  test(
    "TC-007 — Save blocked when Program Name cleared",
    { tag: "@regression" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Full-stack web development program",
      );
      await programsPage.openEditProgram(programName);
      await modal.clearProgramName();

      await expect(modal.saveButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
      await expect(programsPage.programRow(programName)).toBeVisible();
    },
  );

  test(
    "TC-008 — Whitespace-only Program Name does not save",
    { tag: "@regression" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Full-stack web development program",
      );
      await programsPage.openEditProgram(programName);
      await modal.fillProgramName("   ");

      await expect(modal.saveButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
      await expect(programsPage.programRow(programName)).toBeVisible();
    },
  );

  test.fixme(
    "TC-011 — Renaming to an existing Program Name is rejected",
    { tag: "@regression" },
    async ({ page, trackProgram }, testInfo) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const firstName = uniqueName("Web Development 2026");
      const secondName = uniqueName("Data Science Fundamentals");

      await seedProgram(
        programsPage,
        trackProgram,
        firstName,
        "First program description",
      );
      await seedProgram(
        programsPage,
        trackProgram,
        secondName,
        "Second program description",
      );

      await programsPage.openEditProgram(firstName);
      await modal.fillProgramName(secondName);
      await modal.clickSave();

      await page.screenshot({
        path: testInfo.outputPath("bug-duplicate-name-on-edit.png"),
        fullPage: true,
      });
      await expect(
        modal.dialog,
        "Known product bug (DS-11/DS-38/DS-168): duplicate names accepted on edit — update must be blocked",
      ).toBeVisible();
      await expect(programsPage.programRow(firstName)).toBeVisible();
      await expect(programsPage.programRow(secondName)).toHaveCount(1);
    },
  );

  test(
    "TC-014 — Failed save (mock PATCH 503) does not close modal or corrupt list",
    { tag: "@regression" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const attemptedName = uniqueName("Cloud Computing 2026");

      await page.route("**/api/programs**", async (route) => {
        if (route.request().method() === "PATCH") {
          return route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ error: "unavailable" }),
          });
        }
        return route.continue();
      });

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Full-stack web development program",
      );
      await programsPage.openEditProgram(programName);
      await modal.fillProgramName(attemptedName);
      await modal.clickSave();

      await expect(modal.dialog).toBeVisible();
      await expect(modal.programName).toHaveValue(attemptedName);
      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(programsPage.programRow(attemptedName)).toHaveCount(0);
    },
  );

  test(
    "TC-016 — Saving with no changes (Save enabled when opening)",
    { tag: "@regression" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const description = "Full-stack web development program";

      await seedProgram(programsPage, trackProgram, programName, description);
      await programsPage.openEditProgram(programName);

      await expect(modal.saveButton).toBeEnabled();
      await programsPage.saveEditedProgram();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(
        programsPage.programRowDescription(programName, description),
      ).toBeVisible();
    },
  );

  test(
    "TC-017 — Program Name at max length 100 accepted on edit",
    { tag: "@regression" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const suffix = String(Date.now()).slice(-8);
      const maxName = `${"N".repeat(100 - suffix.length - 1)}${suffix}`.slice(
        0,
        100,
      );

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Max length boundary test",
      );
      await programsPage.openEditProgram(programName);
      await modal.fillProgramName(maxName);
      await programsPage.saveEditedProgram();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(maxName)).toBeVisible();
    },
  );

  test.fixme(
    "TC-018 — Program Name >100",
    { tag: "@regression" },
    async ({ page, trackProgram }, testInfo) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const overLimitName = `${"O".repeat(95)}${Date.now()}`.slice(0, 101);

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Over-limit name test",
      );
      await programsPage.openEditProgram(programName);
      await modal.fillProgramName(overLimitName);
      await modal.clickSave();

      await page.screenshot({
        path: testInfo.outputPath("bug-name-exceeds-100-chars-on-edit.png"),
        fullPage: true,
      });
      await expect(
        modal.dialog,
        "Known product bug: names exceeding 100 characters accepted on edit",
      ).toBeVisible();
      await expect(programsPage.programRow(overLimitName)).toHaveCount(0);
    },
  );

  test(
    "TC-019 — Special characters preserved on edit",
    { tag: "@regression" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const updatedName = "Web Dev & Design — 2026 (Cohort #1)";

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Special characters test",
      );
      await programsPage.openEditProgram(programName);
      await modal.fillProgramName(updatedName);
      await programsPage.saveEditedProgram();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(updatedName)).toBeVisible();
      await expect(programsPage.programRowName(updatedName)).toHaveText(
        updatedName,
      );
    },
  );

  test(
    "TC-021 — Leading/trailing spaces trimmed on save",
    { tag: "@regression" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const trimmedName = `${programName} - Updated`;
      const paddedName = `  ${trimmedName}  `;

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Trim behavior test",
      );
      await programsPage.openEditProgram(programName);
      await modal.fillProgramName(paddedName);
      await programsPage.saveEditedProgram();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(trimmedName)).toHaveCount(1);
      await expect(programsPage.programRowName(trimmedName)).toHaveText(
        trimmedName,
      );
    },
  );

  test.fixme(
    "TC-015 — Double-click Save applies exactly one update",
    { tag: "@regression" },
    async ({ page, trackProgram }, testInfo) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Web Development 2026");
      const updatedName = uniqueName("UI/UX Design 2026");

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Double-click edge case",
      );
      await programsPage.openEditProgram(programName);
      await modal.fillProgramName(updatedName);
      await modal.doubleClickSave();

      await page.screenshot({
        path: testInfo.outputPath("bug-double-click-save-on-edit.png"),
        fullPage: true,
      });
      await expect(modal.dialog).toBeHidden();
      await expect(
        programsPage.programRow(updatedName),
        "Known product bug: double-click Save may send duplicate PATCH requests",
      ).toHaveCount(1);
    },
  );

  test.fixme(
    "TC-A11Y — Edit Program modal passes axe wcag2a/wcag2aa and keyboard save",
    { tag: "@regression" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName("Accessible Edit 2026");
      const updatedName = `${programName} - Saved`;

      await seedProgram(
        programsPage,
        trackProgram,
        programName,
        "Accessibility coverage",
      );
      await programsPage.openEditProgram(programName);
      await expect(modal.dialog).toBeVisible();

      const results = await new AxeBuilder({ page })
        .include(await modal.axeIncludeSelector())
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      await expect(results.violations).toEqual([]);

      await modal.focusProgramName();
      await expect(modal.programName).toBeFocused();
      await page.keyboard.press("End");
      await page.keyboard.type(" - Saved");
      await modal.focusSaveButton();
      await expect(modal.saveButton).toBeFocused();
      await programsPage.waitForProgramUpdate(() =>
        page.keyboard.press("Enter"),
      );

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(updatedName)).toBeVisible();
    },
  );
});
