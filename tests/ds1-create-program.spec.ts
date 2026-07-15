import { test, expect } from "../fixtures/cleanup.fixture";
import { extractProgramId } from "../fixtures/program-api";
import { ProgramsPage } from "../pages/ProgramsPage";

function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

test.describe("DS-1: Create new academic program", () => {
  test.beforeEach(async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
    await expect(programsPage.heading).toBeVisible();
    await expect(programsPage.subtitle).toBeVisible();
    await expect(programsPage.newProgramButton).toBeVisible();
  });

  test("TC-001 — Program creation form opens with required fields", async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await programsPage.openNewProgramForm();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.heading).toBeVisible();
    await expect(modal.programName).toBeVisible();
    await expect(modal.programName).toHaveAttribute(
      "placeholder",
      "e.g. Computer Science BSc",
    );
    await expect(modal.description).toHaveAttribute(
      "placeholder",
      "Brief description",
    );
    await expect(modal.programName).toBeEditable();
    await expect(modal.description).toBeVisible();
    await expect(modal.description).toBeEditable();
    await expect(modal.createButton).toBeVisible();
    await expect(modal.createButton).toBeDisabled();
    await expect(modal.cancelButton).toBeVisible();
    await expect(modal.closeButton).toBeVisible();
  });

  test("TC-002 — Program is created successfully with valid name and description", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Web Development 2026");
    const description = "Full-stack web development program";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, trackProgram, description);

    await expect(programsPage.newProgramModal.dialog).toBeHidden();
    const row = programsPage.programRow(programName);
    await expect(row).toBeVisible();
    await expect(
      programsPage.programRowDescription(programName, description),
    ).toBeVisible();
  });

  test("TC-003 — Program is created with name only and empty description", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Data Science Fundamentals");

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, trackProgram, "");

    await expect(programsPage.newProgramModal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
    await expect(programsPage.programCell(programName)).toHaveText(programName);
  });

  test("TC-004 — Create button is disabled when Program Name is empty", async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await programsPage.openNewProgramForm();
    await modal.fillDescription("Optional description text");
    await expect(modal.createButton).toBeDisabled();
    await expect(modal.programName).toBeVisible();
  });

  test("TC-005 — Create button becomes enabled after entering a valid Program Name", async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("Cybersecurity Basics");

    await programsPage.openNewProgramForm();
    await expect(modal.createButton).toBeDisabled();
    await modal.fillProgramName(programName);
    await expect(modal.createButton).toBeEnabled();
  });

  test("TC-006 — New program appears at the top of the program list", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Mobile App Development 2026");
    const description = "iOS and Android development track";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, trackProgram, description);

    await expect(programsPage.programRow(programName)).toBeVisible();
    await expect(programsPage.firstProgramRowName(programName)).toBeVisible();
  });

  test("TC-024 — Programs page displays program list with management actions", async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);

    await expect(programsPage.programColumnHeader).toBeVisible();
    await expect(programsPage.selectProgramHint).toBeVisible();
    await expect(programsPage.firstEditButton).toBeVisible();
    await expect(programsPage.firstDeleteButton).toBeVisible();
  });

  test("TC-025 — Program creation form includes optional AI Generation Config fields", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await programsPage.openNewProgramForm();

    await expect(modal.showAiConfigButton).toBeVisible();
    await expect(modal.totalProgramHoursLabel).toBeVisible();
    await expect(modal.defaultSessionHoursLabel).toBeVisible();
    await expect(modal.defaultExamHoursLabel).toBeVisible();
    await expect(modal.targetAudienceLabel).toBeVisible();
    await expect(modal.focusAreasLabel).toBeVisible();
    await expect(modal.syncAsyncRatioLabel).toBeVisible();

    const programName = uniqueName("AI Config Optional Test");
    await modal.fillProgramName(programName);
    await programsPage.waitForProgramCreate(
      () => modal.clickCreate(),
      trackProgram,
    );
    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test("TC-007 — Whitespace-only Program Name does not create a program", async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("Whitespace Guard Program");

    await programsPage.openNewProgramForm();
    await modal.fillProgramName("   ");
    await modal.fillDescription("Valid description text");
    await expect(modal.createButton).toBeDisabled();
    await expect(modal.programName).toBeVisible();
    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-008 — Canceling the form does not create a program", async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("Temporary Program Name");

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(programName);
    await modal.fillDescription("Temporary description");
    await programsPage.closeModalWithoutSaving();

    await expect(programsPage.newProgramModal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-026 — Closing the form via header X button does not create a program", async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("X Close Test Program");

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(programName);
    await modal.clickClose();
    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-011 — Duplicate Program Name is rejected with an error", async ({
    page,
    trackProgram,
  }, testInfo) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("Web Development 2026");
    const firstDescription = "Original program description";
    const duplicateDescription = "Another description for duplicate name";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, trackProgram, firstDescription);
    await expect(programsPage.programRow(programName)).toHaveCount(1);

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(programName);
    await modal.fillDescription(duplicateDescription);
    await programsPage.clickCreateAndMaybeTrack(trackProgram);

    await page.screenshot({
      path: testInfo.outputPath("bug-duplicate-program-name.png"),
      fullPage: true,
    });
    await expect(
      programsPage.programRow(programName),
      "DS-1 AC / Validation Rules: duplicate name must not create a second program",
    ).toHaveCount(1);
  });

  test("TC-012 — Failed create does not close modal or corrupt the program list", async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("Cloud Computing 2026");
    const description = "AWS and Azure fundamentals";

    await page.route("**/*", (route) => {
      const request = route.request();
      if (request.method() === "POST" && /program/i.test(request.url())) {
        return route.abort("failed");
      }
      return route.continue();
    });

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(programName);
    await modal.fillDescription(description);
    await modal.clickCreate();

    await expect(modal.programName).toBeVisible();
    await expect(modal.programName).toHaveValue(programName);
    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-013 — Double-clicking Create creates exactly one program", async ({
    page,
    trackProgram,
  }, testInfo) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("UI/UX Design 2026");
    const description = "Design thinking and prototyping";

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(programName);
    await modal.fillDescription(description);

    page.on("response", async (response) => {
      if (
        response.url().includes("/api/programs") &&
        response.request().method() === "POST" &&
        response.ok()
      ) {
        const body = await response.json();
        const uuid = extractProgramId(body);
        if (uuid) {
          trackProgram(uuid);
        }
      }
    });
    await modal.doubleClickCreate();

    await expect(modal.dialog).toBeHidden();
    await page.screenshot({
      path: testInfo.outputPath("bug-double-click-create.png"),
      fullPage: true,
    });
    await expect(
      programsPage.programRow(programName),
      "DS-1 AC Successfully create: one Create action must create exactly one program",
    ).toHaveCount(1);
  });

  test("TC-014 — Program Name at minimum valid length is handled correctly", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = "A";
    const description = "Single-letter name boundary test";

    await programsPage.openNewProgramForm();
    const rowsBefore = await programsPage.programRow(programName).count();

    await modal.fillProgramName(programName);
    await modal.fillDescription(description);

    if (await modal.createButton.isEnabled()) {
      await programsPage.waitForProgramCreate(
        () => modal.clickCreate(),
        trackProgram,
      );
      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toHaveCount(
        rowsBefore + 1,
      );
    } else {
      await expect(modal.createButton).toBeDisabled();
      await expect(programsPage.programRow(programName)).toHaveCount(rowsBefore);
    }
  });

  test("TC-015 — Program Name at maximum allowed length (100) is accepted", async ({
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
  });

  test("TC-016 — Program Name exceeding 100 characters is rejected", async ({
    page,
    trackProgram,
  }, testInfo) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const overLimitName = `${"O".repeat(95)}${Date.now()}`.slice(0, 101);
    const description = "Over-limit name test";

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(overLimitName);
    await modal.fillDescription(description);
    await programsPage.clickCreateAndMaybeTrack(trackProgram);

    await page.screenshot({
      path: testInfo.outputPath("bug-name-exceeds-100-chars.png"),
      fullPage: true,
    });
    await expect(
      modal.dialog,
      "Validation Rules: name exceeding 100 characters must not be saved",
    ).toBeVisible();
    await expect(programsPage.programRow(overLimitName)).toHaveCount(0);
  });

  test("TC-017 — Special characters in Program Name are handled correctly", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Web Dev & Design — 2026 (Cohort #1)");
    const description = "Special characters test";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, trackProgram, description);

    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test("TC-018 — Unicode and international characters are preserved", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("プログラミング基礎 2026");
    const description = "Curso de desarrollo web — año 2026";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, trackProgram, description);

    await expect(programsPage.programRow(programName)).toBeVisible();
    await expect(
      programsPage.programRowDescription(programName, description),
    ).toBeVisible();
  });

  test("TC-019 — Leading and trailing spaces in Program Name are trimmed on save", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const baseName = uniqueName("Web Development 2026");
    const paddedName = `  ${baseName}  `;
    const description = "Trim behavior test";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(paddedName, trackProgram, description);

    const row = programsPage.programRow(baseName);
    await expect(row).toHaveCount(1);
    await expect(programsPage.programRowName(baseName)).toHaveText(baseName);
    const savedName = await programsPage.programRowName(baseName).textContent();
    expect(savedName).toBe(baseName);
  });

  test("TC-020 — Description at maximum length (500) is accepted", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("AI Engineering 2026");
    const maxDescription = "D".repeat(500);

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(programName);
    await modal.fillDescription(maxDescription);
    await programsPage.waitForProgramCreate(
      () => modal.clickCreate(),
      trackProgram,
    );

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test("TC-027 — Description exceeding 500 characters is rejected", async ({
    page,
    trackProgram,
  }, testInfo) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("Long Description Reject Test");
    const overLimitDescription = "D".repeat(501);

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(programName);
    await modal.fillDescription(overLimitDescription);
    await programsPage.clickCreateAndMaybeTrack(trackProgram);

    await page.screenshot({
      path: testInfo.outputPath("bug-description-exceeds-500-chars.png"),
      fullPage: true,
    });
    await expect(
      modal.dialog,
      "Validation Rules: description exceeding 500 characters must not be saved",
    ).toBeVisible();
    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test("TC-021 — HTML and script tags in Description are stored as plain text", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName("Security Test Program");
    const description = "<script>alert('xss')</script><b>Bold text</b>";
    let dialogShown = false;
    page.on("dialog", async (dialog) => {
      dialogShown = true;
      await dialog.dismiss();
    });

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, trackProgram, description);

    await expect(programsPage.newProgramModal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
    await expect(
      programsPage.programRowDescription(programName, description),
    ).toBeVisible();
    expect(dialogShown).toBe(false);
    await expect(
      programsPage.programRowText(programName, "<script>"),
    ).toBeVisible();
  });

  test("TC-022 — Reopening the form after successful create shows empty fields", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("Fresh Form Program");
    const description = "Used for reopen verification";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, trackProgram, description);
    await expect(programsPage.programRow(programName)).toBeVisible();

    await programsPage.openNewProgramForm();
    await expect(modal.programName).toHaveValue("");
    await expect(modal.description).toHaveValue("");
  });

  test("TC-023 — Program creation form can be submitted via keyboard", async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = uniqueName("Accessible Program 2026");
    const description = "Keyboard navigation test";

    await programsPage.openNewProgramForm();
    await modal.focusProgramName();
    await page.keyboard.type(programName);
    await modal.focusDescription();
    await page.keyboard.type(description);
    await modal.focusCreateButton();
    await programsPage.waitForProgramCreate(
      () => page.keyboard.press("Enter"),
      trackProgram,
    );

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });
});

test.describe("DS-1: Access control", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("TC-010 — Unauthenticated user cannot open program creation form", async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);

    await programsPage.goto();

    await expect(page).toHaveURL(/\/login/);
    await expect(programsPage.newProgramModal.dialog).toBeHidden();
    await expect(programsPage.newProgramButton).toBeHidden();
  });
});
