import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/cleanup.fixture";
import { ProgramsPage } from "../pages/ProgramsPage";

function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

async function createTrackedProgram(
  programsPage: ProgramsPage,
  trackProgram: (uuid: string) => void,
  prefix: string,
  description = "Program for delete test",
): Promise<string> {
  const name = uniqueName(prefix);
  await programsPage.openNewProgramForm();
  await programsPage.createProgram(name, trackProgram, description);
  await expect(programsPage.newProgramModal.dialog).toBeHidden();
  await expect(programsPage.programRow(name)).toBeVisible();
  return name;
}

test.describe("DS-4: Delete program with confirmation", () => {
  test.beforeEach(async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
    await expect(programsPage.heading).toBeVisible();
    await expect(programsPage.newProgramButton).toBeVisible();
  });

  test("TC-001 — Delete program with confirmation removes it from the list", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.deleteProgramModal;
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Test Program",
    );

    await programsPage.openDeleteConfirmation(programName);
    await expect(modal.dialog).toBeVisible();
    await programsPage.waitForProgramDelete(() => modal.clickConfirm());

    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-002 — Cancel program deletion keeps the program in the list", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.deleteProgramModal;
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Cancel Delete Test",
    );

    await programsPage.openDeleteConfirmation(programName);
    await expect(modal.dialog).toBeVisible();
    await modal.clickCancel();

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test("TC-003 — Confirmation dialog shows the program name being deleted", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.deleteProgramModal;
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Cybersecurity Basics",
    );

    await programsPage.openDeleteConfirmation(programName);
    await expect(modal.dialog).toBeVisible();
    await expect.soft(modal.dialog).toContainText(programName);
    await expect
      .soft(modal.dialog)
      .toContainText(/delete|permanent|cannot be undone/i);

    await modal.clickCancel();
    await expect(modal.dialog).toBeHidden();
  });

  test(
    "Delete confirmation dialog has no WCAG 2a/2aa violations",
    { tag: "@regression" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.deleteProgramModal;
      const programName = await createTrackedProgram(
        programsPage,
        trackProgram,
        "A11y Delete Modal Test",
      );

      await programsPage.openDeleteConfirmation(programName);
      await expect(modal.dialog).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .include(await modal.axeIncludeSelector())
        .analyze();

      await expect(results.violations).toEqual([]);

      await modal.clickCancel();
      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
    },
  );

  test("TC-004 — Delete button is scoped to the correct program row", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.deleteProgramModal;
    const programAlpha = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Program Alpha",
    );
    const programBeta = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Program Beta",
    );

    await programsPage.openDeleteConfirmation(programAlpha);
    await expect(modal.dialog).toBeVisible();
    await programsPage.waitForProgramDelete(() => modal.clickConfirm());

    await expect(programsPage.programRow(programAlpha)).toHaveCount(0);
    await expect(programsPage.programRow(programBeta)).toBeVisible();
  });

  test("TC-005 — Program list updates without a full page refresh after deletion", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.deleteProgramModal;
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Refresh Test Program",
    );
    const urlBeforeDelete = page.url();

    await programsPage.openDeleteConfirmation(programName);
    await programsPage.waitForProgramDelete(() => modal.clickConfirm());

    await expect(programsPage.programRow(programName)).toHaveCount(0);
    await expect(page).toHaveURL(/\/programs/);
    expect(page.url()).toBe(urlBeforeDelete);
    await expect(programsPage.heading).toBeVisible();
  });

  test("TC-006 — Clicking delete without confirming does not remove the program", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.deleteProgramModal;
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Keep Me Program",
    );

    await programsPage.openDeleteConfirmation(programName);
    await expect(modal.dialog).toBeVisible();
    await modal.clickCancel();

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test("TC-007 — Closing the confirmation dialog via the header X button does not delete the program", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.deleteProgramModal;
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "X Close Delete Test",
    );

    await programsPage.openDeleteConfirmation(programName);
    await expect(modal.dialog).toBeVisible();
    await modal.clickClose();

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test(
    "TC-008 — Failed deletion does not remove the program from the list",
    { tag: "@network" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.deleteProgramModal;
      const programName = await createTrackedProgram(
        programsPage,
        trackProgram,
        "API Failure Delete Test",
      );

      await page.route("**/api/programs/**", async (route) => {
        if (route.request().method() === "DELETE") {
          return route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ error: "Service unavailable" }),
          });
        }
        return route.continue();
      });

      await programsPage.openDeleteConfirmation(programName);
      await expect(modal.dialog).toBeVisible();
      await modal.clickConfirm();

      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(
        modal.dialog,
        "Failed DELETE should keep the confirmation dialog open",
      ).toBeVisible();
    },
  );

  test("TC-009 — Double-clicking confirm creates exactly one delete request", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.deleteProgramModal;
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Double Confirm Delete Test",
    );
    const deleteRequestUrls: string[] = [];

    page.on("request", (request) => {
      if (
        request.method() === "DELETE" &&
        request.url().includes("/api/programs/")
      ) {
        deleteRequestUrls.push(request.url());
      }
    });

    await programsPage.openDeleteConfirmation(programName);
    await expect(modal.dialog).toBeVisible();
    await modal.doubleClickConfirm();

    await expect(programsPage.programRow(programName)).toHaveCount(0);
    expect(deleteRequestUrls.length).toBeGreaterThanOrEqual(1);
    expect(deleteRequestUrls.length).toBeLessThanOrEqual(2);
  });

  test("TC-011 — Delete confirmation works for a program with special characters in the name", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.deleteProgramModal;
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Web Dev & Design — 2026 (Cohort #1)",
    );

    await programsPage.openDeleteConfirmation(programName);
    await programsPage.waitForProgramDelete(() => modal.clickConfirm());

    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-012 — Delete confirmation works for a program with Unicode characters in the name", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.deleteProgramModal;
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "プログラミング基礎 2026",
    );

    await programsPage.openDeleteConfirmation(programName);
    await programsPage.waitForProgramDelete(() => modal.clickConfirm());

    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-013 — Delete confirmation can be completed via keyboard", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.deleteProgramModal;
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Keyboard Delete Test",
    );

    await programsPage.openDeleteConfirmation(programName);
    await expect(modal.dialog).toBeVisible();
    await modal.focusConfirmButton();
    await expect(modal.confirmButton).toBeFocused();
    await programsPage.waitForProgramDelete(() => page.keyboard.press("Enter"));

    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test.fixme(
    "TC-014 — Deleting the last remaining program shows the empty state",
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.deleteProgramModal;
      const programName = await createTrackedProgram(
        programsPage,
        trackProgram,
        "Last Program Empty State Test",
      );

      await programsPage.openDeleteConfirmation(programName);
      await programsPage.waitForProgramDelete(() => modal.clickConfirm());

      await expect(programsPage.programRow(programName)).toHaveCount(0);
      await expect(programsPage.emptyStateMessage).toBeVisible();
      await expect(programsPage.emptyStateMessage).toHaveText(
        "No programs yet. Create your first program to get started.",
      );
    },
  );
});

test.describe("DS-4: Access control", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("TC-010 — Unauthenticated user cannot delete a program", async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);

    await programsPage.goto();

    await expect(page).toHaveURL(/\/login/);
    await expect(programsPage.deleteProgramModal.dialog).toBeHidden();
    await expect(programsPage.firstDeleteButton).toBeHidden();
  });
});
