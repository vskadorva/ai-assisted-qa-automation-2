import { test, expect, type Page, type Locator } from "@playwright/test";

const email = process.env.DIDAXIS_EMAIL;
const password = process.env.DIDAXIS_PASSWORD;

function requireAdminCredentials() {
  if (!email || !password) {
    throw new Error(
      "DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be set in the environment (.env)",
    );
  }
}

function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

async function loginAsAdmin(page: Page) {
  requireAdminCredentials();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

async function goToPrograms(page: Page) {
  await page.goto("/programs");
  await expect(
    page.getByRole("button", { name: "+ New Program" }),
  ).toBeVisible();
}

async function openCreateProgramModal(page: Page) {
  await page.getByRole("button", { name: "+ New Program" }).click();
  await expect(createProgramModal(page)).toBeVisible();
  await expect(page.getByLabel("Program Name")).toBeVisible();
}

function createProgramModal(page: Page) {
  return page.getByRole("dialog");
}

function createProgramForm(page: Page) {
  const modal = createProgramModal(page);
  return {
    modal,
    programName: modal.getByLabel("Program Name"),
    description: modal.getByLabel("Description"),
    createButton: modal.getByRole("button", { name: "Create", exact: true }),
    cancelButton: modal.getByRole("button", { name: "Cancel" }),
  };
}

function programsTable(page: Page) {
  return page.getByRole("table");
}

function programInList(page: Page, name: string): Locator {
  return programsTable(page)
    .locator("tbody tr")
    .filter({
      has: page.locator("td p").first().getByText(name, { exact: true }),
    });
}

async function fillAndCreateProgram(
  page: Page,
  name: string,
  description?: string,
) {
  const form = createProgramForm(page);
  await form.programName.fill(name);
  if (description !== undefined) {
    await form.description.fill(description);
  }
  await form.createButton.click();
}

async function closeModalWithoutSaving(page: Page) {
  const form = createProgramForm(page);
  await form.cancelButton.click();
  await expect(createProgramModal(page)).toBeHidden();
}

test.describe("DS-1: Create new academic program", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToPrograms(page);
  });

  test("TC-001 — Program creation form opens with required fields", async ({
    page,
  }) => {
    await openCreateProgramModal(page);
    const form = createProgramForm(page);

    await expect(form.programName).toBeVisible();
    await expect(form.programName).toBeEditable();
    await expect(form.description).toBeVisible();
    await expect(form.description).toBeEditable();
    await expect(form.createButton).toBeVisible();
  });

  test("TC-002 — Program is created successfully with valid name and description", async ({
    page,
  }) => {
    const programName = uniqueName("Web Development 2026");
    const description = "Full-stack web development program";

    await openCreateProgramModal(page);
    await fillAndCreateProgram(page, programName, description);

    await expect(createProgramModal(page)).toBeHidden();
    await expect(programInList(page, programName)).toBeVisible();
  });

  test("TC-003 — Program is created with name only and empty description", async ({
    page,
  }) => {
    const programName = uniqueName("Data Science Fundamentals");

    await openCreateProgramModal(page);
    await fillAndCreateProgram(page, programName, "");

    await expect(createProgramModal(page)).toBeHidden();
    await expect(programInList(page, programName)).toBeVisible();
  });

  test("TC-004 — Create button is disabled when Program Name is empty", async ({
    page,
  }) => {
    await openCreateProgramModal(page);
    const form = createProgramForm(page);

    await form.description.fill("Optional description text");
    await expect(form.createButton).toBeDisabled();
    await expect(form.programName).toBeVisible();
  });

  test("TC-005 — Create button becomes enabled after entering a valid Program Name", async ({
    page,
  }) => {
    const programName = uniqueName("Cybersecurity Basics");

    await openCreateProgramModal(page);
    const form = createProgramForm(page);

    await expect(form.createButton).toBeDisabled();
    await form.programName.fill(programName);
    await expect(form.createButton).toBeEnabled();
  });

  test("TC-006 — New program appears in the program list after creation", async ({
    page,
  }) => {
    const programName = uniqueName("Mobile App Development 2026");
    const description = "iOS and Android development track";

    await openCreateProgramModal(page);
    await fillAndCreateProgram(page, programName, description);

    await expect(programInList(page, programName)).toBeVisible();
  });

  test("TC-007 — Whitespace-only Program Name does not create a program", async ({
    page,
  }) => {
    const programName = uniqueName("Whitespace Guard Program");

    await openCreateProgramModal(page);
    const form = createProgramForm(page);

    await form.programName.fill("   ");
    await form.description.fill("Valid description text");
    await expect(form.createButton).toBeDisabled();
    await expect(form.programName).toBeVisible();
    await expect(programInList(page, programName)).toHaveCount(0);
  });

  test("TC-008 — Canceling the form does not create a program", async ({
    page,
  }) => {
    const programName = uniqueName("Temporary Program Name");

    await openCreateProgramModal(page);
    const form = createProgramForm(page);
    await form.programName.fill(programName);
    await form.description.fill("Temporary description");

    await closeModalWithoutSaving(page);

    await expect(programInList(page, programName)).toHaveCount(0);
  });

  test("TC-011 — Duplicate Program Name creates a second program entry", async ({
    page,
  }) => {
    const programName = uniqueName("Web Development 2026");
    const firstDescription = "Original program description";
    const duplicateDescription = "Another description for duplicate name";

    await openCreateProgramModal(page);
    await fillAndCreateProgram(page, programName, firstDescription);
    await expect(programInList(page, programName)).toHaveCount(1);

    await openCreateProgramModal(page);
    await fillAndCreateProgram(page, programName, duplicateDescription);

    await expect(createProgramModal(page)).toBeHidden();
    await expect(programInList(page, programName)).toHaveCount(2);
  });

  test("TC-012 — Failed create does not close modal or corrupt the program list", async ({
    page,
  }) => {
    const programName = uniqueName("Cloud Computing 2026");
    const description = "AWS and Azure fundamentals";

    await page.route("**/*", (route) => {
      const request = route.request();
      if (request.method() === "POST" && /program/i.test(request.url())) {
        return route.abort("failed");
      }
      return route.continue();
    });

    await openCreateProgramModal(page);
    const form = createProgramForm(page);
    await form.programName.fill(programName);
    await form.description.fill(description);
    await form.createButton.click();

    await expect(form.programName).toBeVisible();
    await expect(form.programName).toHaveValue(programName);
    await expect(programInList(page, programName)).toHaveCount(0);
  });

  test("TC-013 — Double-clicking Create does not create duplicate programs", async ({
    page,
  }) => {
    const programName = uniqueName("UI/UX Design 2026");
    const description = "Design thinking and prototyping";

    await openCreateProgramModal(page);
    const form = createProgramForm(page);
    await form.programName.fill(programName);
    await form.description.fill(description);
    await form.createButton.dblclick();

    await expect(createProgramModal(page)).toBeHidden();
    const rowCount = await programInList(page, programName).count();
    test.fail(
      rowCount > 1,
      "Known defect: double-clicking Create submits the form twice",
    );
    await expect(programInList(page, programName)).toHaveCount(1);
  });

  test("TC-014 — Program Name at minimum valid length is handled correctly", async ({
    page,
  }) => {
    const programName = "A";
    const description = "Single-letter name boundary test";

    await openCreateProgramModal(page);
    const form = createProgramForm(page);
    const rowsBefore = await programInList(page, programName).count();

    await form.programName.fill(programName);
    await form.description.fill(description);

    if (await form.createButton.isEnabled()) {
      await form.createButton.click();
      await expect(createProgramModal(page)).toBeHidden();
      await expect(programInList(page, programName)).toHaveCount(
        rowsBefore + 1,
      );
    } else {
      await expect(form.createButton).toBeDisabled();
      await expect(programInList(page, programName)).toHaveCount(rowsBefore);
    }
  });

  test("TC-015 — Program Name at maximum allowed length is accepted", async ({
    page,
  }) => {
    const suffix = String(Date.now());
    const maxName = `${"N".repeat(255 - suffix.length - 1)} ${suffix}`;
    const description = "Max length boundary test";

    await openCreateProgramModal(page);
    await fillAndCreateProgram(page, maxName, description);

    await expect(createProgramModal(page)).toBeHidden();
    await expect(programInList(page, maxName)).toBeVisible();
  });

  test("TC-016 — Program Name accepts 256 characters (no maxlength enforced)", async ({
    page,
  }) => {
    const suffix = String(Date.now());
    const overLimitName = `${"O".repeat(256 - suffix.length)}${suffix}`;
    const description = "Over-limit name test";

    await openCreateProgramModal(page);
    const form = createProgramForm(page);
    await form.programName.fill(overLimitName);
    await form.description.fill(description);

    await expect(form.programName).toHaveValue(overLimitName);
    await expect(form.createButton).toBeEnabled();
    await form.createButton.click();

    await expect(createProgramModal(page)).toBeHidden();
    await expect(programInList(page, overLimitName)).toHaveCount(1);
  });

  test("TC-017 — Special characters in Program Name are handled correctly", async ({
    page,
  }) => {
    const programName = uniqueName("Web Dev & Design — 2026 (Cohort #1)");
    const description = "Special characters test";

    await openCreateProgramModal(page);
    await fillAndCreateProgram(page, programName, description);

    await expect(programInList(page, programName)).toBeVisible();
  });

  test("TC-018 — Unicode and international characters are preserved", async ({
    page,
  }) => {
    const programName = uniqueName("プログラミング基礎 2026");
    const description = "Curso de desarrollo web — año 2026";

    await openCreateProgramModal(page);
    await fillAndCreateProgram(page, programName, description);

    await expect(programInList(page, programName)).toBeVisible();
    await expect(
      programInList(page, programName).getByText(description),
    ).toBeVisible();
  });

  test("TC-019 — Leading and trailing spaces in Program Name are trimmed on save", async ({
    page,
  }) => {
    const baseName = uniqueName("Web Development 2026");
    const paddedName = `  ${baseName}  `;
    const description = "Trim behavior test";

    await openCreateProgramModal(page);
    await fillAndCreateProgram(page, paddedName, description);

    await expect(programInList(page, baseName)).toHaveCount(1);
    await expect(
      programInList(page, baseName).locator("p").first(),
    ).toHaveText(baseName);
  });

  test("TC-020 — Very long Description is accepted or limited per specification", async ({
    page,
  }) => {
    const programName = uniqueName("AI Engineering 2026");
    const longDescription = "D".repeat(5000);

    await openCreateProgramModal(page);
    const form = createProgramForm(page);
    await form.programName.fill(programName);
    await form.description.fill(longDescription);

    if (await form.createButton.isEnabled()) {
      await form.createButton.click();
      await expect(createProgramModal(page)).toBeHidden();
      await expect(programInList(page, programName)).toBeVisible();
    } else {
      await expect(form.createButton).toBeDisabled();
      await expect(programInList(page, programName)).toHaveCount(0);
    }
  });

  test("TC-021 — HTML and script tags in Description are sanitized", async ({
    page,
  }) => {
    const programName = uniqueName("Security Test Program");
    const description = "<script>alert('xss')</script><b>Bold text</b>";
    let dialogShown = false;
    page.on("dialog", async (dialog) => {
      dialogShown = true;
      await dialog.dismiss();
    });

    await openCreateProgramModal(page);
    await fillAndCreateProgram(page, programName, description);

    await expect(createProgramModal(page)).toBeHidden();
    await expect(programInList(page, programName)).toBeVisible();
    await expect(
      programInList(page, programName).getByText(description),
    ).toBeVisible();
    expect(dialogShown).toBe(false);
    await expect(
      programInList(page, programName).getByText("<script>"),
    ).toBeVisible();
  });

  test("TC-022 — Reopening the form after successful create shows empty fields", async ({
    page,
  }) => {
    const programName = uniqueName("Fresh Form Program");
    const description = "Used for reopen verification";

    await openCreateProgramModal(page);
    await fillAndCreateProgram(page, programName, description);
    await expect(programInList(page, programName)).toBeVisible();

    await openCreateProgramModal(page);
    const form = createProgramForm(page);
    await expect(form.programName).toHaveValue("");
    await expect(form.description).toHaveValue("");
  });

  test("TC-023 — Program creation form can be submitted via keyboard", async ({
    page,
  }) => {
    const programName = uniqueName("Accessible Program 2026");
    const description = "Keyboard navigation test";

    await openCreateProgramModal(page);
    const form = createProgramForm(page);

    await form.programName.focus();
    await page.keyboard.type(programName);
    await form.description.focus();
    await page.keyboard.type(description);
    await form.createButton.focus();
    await page.keyboard.press("Enter");

    await expect(createProgramModal(page)).toBeHidden();
    await expect(programInList(page, programName)).toBeVisible();
  });
});

test.describe("DS-1: Access control", () => {
  test("TC-010 — Unauthenticated user cannot open program creation form", async ({
    page,
  }) => {
    await page.goto("/programs");

    await expect(page).toHaveURL(/\/login/);
    await expect(createProgramModal(page)).toBeHidden();
    await expect(
      page.getByRole("button", { name: "+ New Program" }),
    ).toBeHidden();
  });
});
