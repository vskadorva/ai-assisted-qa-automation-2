import { test, expect } from "../fixtures/cleanup.fixture";
import { ProgramsPage } from "../pages/ProgramsPage";

function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

test.describe("DS-3: Program name validation and duplicate prevention", () => {
  test.beforeEach(async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
    await expect(programsPage.heading).toBeVisible();
    await expect(programsPage.newProgramButton).toBeVisible();
  });

  test(
    "TC-001 — Accept program name with special characters",
    { tag: "@regression" },
    async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Informatique & IA - Niveau 2");
    const description = "Advanced informatics and AI track";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, trackProgram, description);

    await expect(programsPage.newProgramModal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
    await expect(
      programsPage.programRowDescription(programName, description),
    ).toBeVisible();
  });

  test(
    "TC-002 — Leading and trailing spaces are trimmed before validation and save",
    { tag: "@regression" },
    async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const baseName = uniqueName("Web Development 2026");
    const paddedName = `  ${baseName}  `;
    const description = "Trim behavior on create";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(paddedName, trackProgram, description);

    await expect(programsPage.newProgramModal.dialog).toBeHidden();
    await expect(programsPage.programRow(baseName)).toHaveCount(1);
    await expect(programsPage.programRowName(baseName)).toHaveText(baseName);
  });

  test(
    "TC-003 — Reject program name with only whitespace",
    { tag: "@regression" },
    async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const phantomName = uniqueName("Whitespace Guard Program");

    await programsPage.openNewProgramForm();
    await modal.fillProgramName("   ");
    await modal.fillDescription("Valid description text");
    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    await expect(programsPage.programRow(phantomName)).toHaveCount(0);
  });

  test.fixme(
    "TC-004 — Reject duplicate program name",
    { tag: "@regression" },
    async ({ page, trackProgram }, testInfo) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName("Web Development 2026");
      const firstDescription = "Original program description";
      const duplicateDescription = "Another description for duplicate name";

      await programsPage.openNewProgramForm();
      await programsPage.createProgram(
        programName,
        trackProgram,
        firstDescription,
      );
      await expect(programsPage.programRow(programName)).toHaveCount(1);

      await programsPage.openNewProgramForm();
      await modal.fillProgramName(programName);
      await modal.fillDescription(duplicateDescription);
      await programsPage.clickCreateAndMaybeTrack(trackProgram);

      await page.screenshot({
        path: testInfo.outputPath("bug-duplicate-program-name-ds3.png"),
        fullPage: true,
      });
      await expect(
        programsPage.programRow(programName),
        "DS-3 AC / Duplicate prevention: duplicate name must not create a second program",
      ).toHaveCount(1);
    },
  );

  test(
    "TC-005 — Empty Program Name does not create a program",
    { tag: "@regression" },
    async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const phantomName = uniqueName("Empty Name Guard Program");

    await programsPage.openNewProgramForm();
    await modal.fillDescription("Optional description text");
    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    await expect(programsPage.programRow(phantomName)).toHaveCount(0);
  });

  test(
    "TC-006 — Duplicate check is case-sensitive or case-insensitive per product rules",
    { tag: "@regression" },
    async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("Web Development 2026");
    const caseVariant = programName.toLowerCase();
    const description = "Case variant duplicate test";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(
      programName,
      trackProgram,
      "Original program for case test",
    );
    await expect(programsPage.programRow(programName)).toHaveCount(1);

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(caseVariant);
    await modal.fillDescription(description);
    await programsPage.clickCreateAndMaybeTrack(trackProgram);

    await expect(programsPage.programRow(programName)).toHaveCount(1);
  });

  test.fixme(
    "TC-007 — Duplicate name after trimming whitespace is rejected",
    { tag: "@regression" },
    async ({ page, trackProgram }, testInfo) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("Web Development 2026");
    const paddedDuplicate = `  ${programName}  `;
    const description = "Padded duplicate name test";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(
      programName,
      trackProgram,
      "Original program for trim-duplicate test",
    );
    await expect(programsPage.programRow(programName)).toHaveCount(1);

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(paddedDuplicate);
    await modal.fillDescription(description);
    await programsPage.clickCreateAndMaybeTrack(trackProgram);

    await page.screenshot({
      path: testInfo.outputPath("bug-padded-duplicate-name-ds3.png"),
      fullPage: true,
    });
    await expect(
      programsPage.programRow(programName),
      "DS-3 / Duplicate prevention: padded duplicate must not create a second program",
    ).toHaveCount(1);
  },
  );

  test(
    "TC-008 — Program Name at maximum allowed length (100 characters) is accepted",
    { tag: "@regression" },
    async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const suffix = String(Date.now()).slice(-8);
    const maxName = `${"N".repeat(100 - suffix.length - 1)}${suffix}`.slice(
      0,
      100,
    );
    const description = "Max length boundary test";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(maxName, trackProgram, description);

    await expect(programsPage.newProgramModal.dialog).toBeHidden();
    await expect(programsPage.programRow(maxName)).toBeVisible();
    await expect(programsPage.programRowName(maxName)).toHaveText(maxName);
  });

  test.fixme(
    "TC-009 — Program Name exceeding 100 characters is rejected",
    { tag: "@regression" },
    async ({ page, trackProgram }, testInfo) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const overLimitName = `${"O".repeat(95)}${Date.now()}`.slice(0, 101);
    const description = "Over-limit name test";

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(overLimitName);
    await modal.fillDescription(description);
    await programsPage.clickCreateAndMaybeTrack(trackProgram);

    await page.screenshot({
      path: testInfo.outputPath("bug-name-exceeds-100-chars-ds3.png"),
      fullPage: true,
    });
    await expect(
      modal.dialog,
      "Validation Rules: name exceeding 100 characters must not be saved",
    ).toBeVisible();
    await expect(programsPage.programRow(overLimitName)).toHaveCount(0);
  },
  );

  test(
    "TC-010 — Unicode characters in Program Name are accepted",
    { tag: "@regression" },
    async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("プログラミング基礎 2026");
    const description = "Unicode name validation test";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, trackProgram, description);

    await expect(programsPage.newProgramModal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
    await expect(programsPage.programRowName(programName)).toHaveText(
      programName,
    );
  });
});
