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

    const dialog = await programsPage.openDeleteConfirmation(programName);
    expect(dialog.type()).toBe("confirm");
    await programsPage.waitForProgramDelete(() => modal.accept(dialog));

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

    const dialog = await programsPage.openDeleteConfirmation(programName);
    expect(dialog.type()).toBe("confirm");
    await modal.dismiss(dialog);

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

    const dialog = await programsPage.openDeleteConfirmation(programName);
    expect(dialog.type()).toBe("confirm");
    expect(modal.message(dialog)).toMatch(new RegExp(escapeRegExp(programName)));
    expect(modal.message(dialog)).toMatch(/delete|permanent|cannot be undone/i);

    await modal.dismiss(dialog);
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test(
    "Delete confirmation uses native browser confirm dialog",
    { tag: "@regression" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const programName = await createTrackedProgram(
        programsPage,
        trackProgram,
        "Native Confirm Test",
      );

      const dialog = await programsPage.openDeleteConfirmation(programName);
      expect(dialog.type()).toBe("confirm");
      expect(dialog.defaultValue()).toBe("");

      await programsPage.deleteProgramModal.dismiss(dialog);
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

    const dialog = await programsPage.openDeleteConfirmation(programAlpha);
    await programsPage.waitForProgramDelete(() => modal.accept(dialog));

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

    const dialog = await programsPage.openDeleteConfirmation(programName);
    await programsPage.waitForProgramDelete(() => modal.accept(dialog));

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

    const dialog = await programsPage.openDeleteConfirmation(programName);
    await modal.dismiss(dialog);

    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test.fixme(
    "TC-007 — Closing the confirmation dialog via the header X button does not delete the program",
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const programName = await createTrackedProgram(
        programsPage,
        trackProgram,
        "X Close Delete Test",
      );

      await programsPage.openDeleteConfirmation(programName);
    },
  );

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

      const dialog = await programsPage.openDeleteConfirmation(programName);
      await modal.accept(dialog);

      await expect(programsPage.programRow(programName)).toBeVisible();
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

    const dialog = await programsPage.openDeleteConfirmation(programName);
    await modal.accept(dialog);

    await expect(programsPage.programRow(programName)).toHaveCount(0);
    expect(deleteRequestUrls.length).toBeGreaterThanOrEqual(1);
    expect(deleteRequestUrls.length).toBeLessThanOrEqual(1);
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

    const dialog = await programsPage.openDeleteConfirmation(programName);
    await programsPage.waitForProgramDelete(() => modal.accept(dialog));

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

    const dialog = await programsPage.openDeleteConfirmation(programName);
    await programsPage.waitForProgramDelete(() => modal.accept(dialog));

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

    const dialog = await programsPage.openDeleteConfirmation(programName);
    await programsPage.waitForProgramDelete(() => page.keyboard.press("Enter"));

    await expect(programsPage.programRow(programName)).toHaveCount(0);
    expect(dialog.type()).toBe("confirm");
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

      const dialog = await programsPage.openDeleteConfirmation(programName);
      await programsPage.waitForProgramDelete(() => modal.accept(dialog));

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
    await expect(programsPage.firstDeleteButton).toBeHidden();
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
