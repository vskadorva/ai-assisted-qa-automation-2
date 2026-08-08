import { test, expect } from "../fixtures/cleanup.fixture";
import { ProgramsPage } from "../pages/ProgramsPage";

function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

function expectedDeleteConfirmMessage(name: string): string {
  return `Delete program "${name}"? All its semesters and courses will be removed. This cannot be undone.`;
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
    await expect(programsPage.subtitle).toBeVisible();
  });

  test("TC-001 — Delete program with confirmation removes it from the list", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Test Program",
    );

    let dialogSeen = false;
    page.once("dialog", async (dialog) => {
      dialogSeen = true;
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toBe(
        expectedDeleteConfirmMessage(programName),
      );
      await dialog.accept();
    });

    await programsPage.clickDelete(programName);

    expect(dialogSeen).toBe(true);
    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-002 — Cancel program deletion keeps the program in the list", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Cancel Delete Test",
    );

    let dialogSeen = false;
    page.once("dialog", async (dialog) => {
      dialogSeen = true;
      expect(dialog.type()).toBe("confirm");
      await dialog.dismiss();
    });

    await programsPage.clickDelete(programName);

    expect(dialogSeen).toBe(true);
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test("TC-003 — Confirmation dialog shows the program name being deleted", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Cybersecurity Basics",
    );

    let capturedMessage = "";
    page.once("dialog", async (dialog) => {
      capturedMessage = dialog.message();
      expect(dialog.type()).toBe("confirm");
      await dialog.dismiss();
    });

    await programsPage.clickDelete(programName);

    expect(capturedMessage).toBe(expectedDeleteConfirmMessage(programName));
    expect(capturedMessage).toContain(programName);
    expect(capturedMessage).toMatch(/cannot be undone/i);
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test("TC-004 — Delete button is scoped to the correct program row", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
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

    await programsPage.deleteProgramWithConfirm(programAlpha);

    await expect(programsPage.programRow(programAlpha)).toHaveCount(0);
    await expect(programsPage.programRow(programBeta)).toBeVisible();
  });

  test("TC-005 — Program list updates without a full page refresh after deletion", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Refresh Test Program",
    );
    const urlBeforeDelete = page.url();

    await programsPage.deleteProgramWithConfirm(programName);

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
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Keep Me Program",
    );

    await programsPage.cancelDeleteProgram(programName);

    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test("TC-007 — Dismissing the confirmation dialog does not delete the program", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Dismiss Delete Test",
    );

    await programsPage.cancelDeleteProgram(programName);

    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test(
    "TC-008 — Failed deletion does not remove the program from the list",
    { tag: "@network" },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
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

      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });
      await programsPage.clickDelete(programName);

      await expect(programsPage.programRow(programName)).toBeVisible();
    },
  );

  test("TC-009 — Confirming deletion sends exactly one delete request", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Single Delete Request Test",
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

    await programsPage.deleteProgramWithConfirm(programName);

    await expect(programsPage.programRow(programName)).toHaveCount(0);
    expect(deleteRequestUrls).toHaveLength(1);
  });

  test("TC-011 — Delete confirmation works for a program with special characters in the name", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Web Dev & Design — 2026 (Cohort #1)",
    );

    await programsPage.deleteProgramWithConfirm(programName);

    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-012 — Delete confirmation works for a program with Unicode characters in the name", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "プログラミング基礎 2026",
    );

    await programsPage.deleteProgramWithConfirm(programName);

    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-013 — Delete confirmation can be completed via the native dialog", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = await createTrackedProgram(
      programsPage,
      trackProgram,
      "Keyboard Delete Test",
    );

    const dialogPromise = page.waitForEvent("dialog");
    await programsPage.clickDelete(programName);
    const dialog = await dialogPromise;

    expect(dialog.type()).toBe("confirm");
    await dialog.accept();

    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test.fixme(
    "TC-014 — Deleting the last remaining program shows the empty state",
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const programName = await createTrackedProgram(
        programsPage,
        trackProgram,
        "Last Program Empty State Test",
      );

      await programsPage.deleteProgramWithConfirm(programName);

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
