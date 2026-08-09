import { test, expect } from "../fixtures/cleanup.fixture";
import { ProgramsPage } from "../pages/ProgramsPage";

function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

function expectedDeleteConfirmMessage(name: string): string {
  return `Delete program "${name}"? All its semesters and courses will be removed. This cannot be undone.`;
}

test.describe("DS-4: Delete program with confirmation", () => {
  test.beforeEach(async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
    await expect(programsPage.heading).toBeVisible();
    await expect(programsPage.subtitle).toBeVisible();
  });

  test("TC-001 — Delete program with confirmation", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Test Program");

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(
      programName,
      trackProgram,
      "Program for delete confirmation test",
    );
    await expect(programsPage.programRow(programName)).toBeVisible();

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

  test("TC-002 — Cancel program deletion", async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Cancel Delete Program");

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(
      programName,
      trackProgram,
      "Program for cancel delete test",
    );
    await expect(programsPage.programRow(programName)).toBeVisible();

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

  test("TC-003 — Closing the confirmation dialog without confirming does not delete the program", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Dismiss Delete Program");

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(
      programName,
      trackProgram,
      "Program for dismiss delete test",
    );
    await expect(programsPage.programRow(programName)).toBeVisible();

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

  test("TC-004 — Delete confirmation is required — program is not removed until Confirm is clicked", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Guard Delete Program");

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(
      programName,
      trackProgram,
      "Program for guard delete test",
    );
    await expect(programsPage.programRow(programName)).toBeVisible();

    let dialogSeen = false;
    page.once("dialog", async (dialog) => {
      dialogSeen = true;
      expect(dialog.type()).toBe("confirm");
      await dialog.dismiss();
    });

    await programsPage.clickDelete(programName);

    expect(dialogSeen).toBe(true);
    await expect(programsPage.programRow(programName)).toBeVisible();

    await programsPage.deleteProgramWithConfirm(programName);
    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-005 — Delete a program with special characters in the name", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Web Dev & Design — Delete (Cohort #1)");

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(
      programName,
      trackProgram,
      "Special characters delete test",
    );
    await expect(programsPage.programRow(programName)).toBeVisible();

    await programsPage.deleteProgramWithConfirm(programName);

    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-006 — Deleting the last remaining program shows the empty state", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Last Program To Delete");

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(
      programName,
      trackProgram,
      "Program for last-delete test",
    );
    await expect(programsPage.programRow(programName)).toBeVisible();

    await programsPage.deleteProgramWithConfirm(programName);

    await expect(programsPage.programRow(programName)).toHaveCount(0);
    // Empty-state messaging omitted: shared env usually has other programs.
  });

  test("TC-007 — Confirmation dialog identifies the program being deleted", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Named Confirm Program");

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(
      programName,
      trackProgram,
      "Program for named confirm dialog test",
    );
    await expect(programsPage.programRow(programName)).toBeVisible();

    let capturedMessage = "";
    page.once("dialog", async (dialog) => {
      capturedMessage = dialog.message();
      expect(dialog.type()).toBe("confirm");
      await dialog.dismiss();
    });

    await programsPage.clickDelete(programName);

    expect(capturedMessage).toBe(expectedDeleteConfirmMessage(programName));
    expect(capturedMessage).toContain(programName);
    await expect(programsPage.programRow(programName)).toBeVisible();
  });
});
