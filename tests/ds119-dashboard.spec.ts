import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/cleanup.fixture";
import { DashboardPage } from "../pages/DashboardPage";
import { ProgramsPage } from "../pages/ProgramsPage";

test.describe("DS-119: Dashboard displaying the right components", () => {
  test.beforeEach(async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await expect(dashboardPage.heading).toBeVisible();
  });

  test("TC-001 — Navigate to the Dashboard", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await expect(dashboardPage.programsCard).toBeVisible();
    await expect(dashboardPage.calendarCard).toBeVisible();
    await expect(dashboardPage.validationCard).toBeVisible();
    await expect(dashboardPage.aiAssistCard).toBeVisible();
    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  test.fixme(
    "TC-001a — Dashboard has no accessibility violations",
    { tag: "@regression" },
    async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      await dashboardPage.goto();
      await expect(dashboardPage.heading).toBeVisible();

      // color-contrast: dashboard and sidebar use design-system tokens below WCAG AA — tracked separately
      const results = await new AxeBuilder({ page })
        .disableRules(["color-contrast"])
        .analyze();

      await expect(results.violations).toEqual([]);
    },
  );

  test("TC-002 — Successfully navigate to Program Page", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const programsPage = new ProgramsPage(page);

    await dashboardPage.clickProgramsCard();

    await expect(page).toHaveURL(/\/programs/);
    await expect(programsPage.heading).toBeVisible();
  });

  test("TC-003 — Successfully navigate to Calendar Page", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.clickCalendarCard();

    await expect(page).toHaveURL(/\/calendar/);
    await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  });

  test("TC-004 — Successfully navigate to Validation Page", async ({
    page,
  }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.clickValidationCard();

    await expect(page).toHaveURL(/\/validation/);
    await expect(
      page.getByRole("heading", { name: "Validation" }),
    ).toBeVisible();
  });

  test("TC-005 — Successfully navigate to AI Assist Page", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.clickAiAssistCard();

    await expect(page).toHaveURL(/\/cli/);
    await expect(page.getByRole("heading", { name: "AI Assist" })).toBeVisible();
  });

  test("TC-006 — Dashboard shows descriptive subtitles for each block", async ({
    page,
  }) => {
    const dashboardPage = new DashboardPage(page);

    await expect(dashboardPage.programsSubtitle).toBeVisible();
    await expect(dashboardPage.calendarSubtitle).toBeVisible();
    await expect(dashboardPage.validationSubtitle).toBeVisible();
    await expect(dashboardPage.aiAssistSubtitle).toBeVisible();
  });

  test("TC-007 — Dashboard shows Quick Start guidance", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    await expect(dashboardPage.quickStartHeading).toBeVisible();
    await expect(dashboardPage.quickStartContent).toBeVisible();
    await expect(dashboardPage.quickStartContent).toContainText("Program");
    await expect(dashboardPage.quickStartContent).toContainText("Calendar");
    await expect(dashboardPage.quickStartContent).toContainText("Validation");
    await expect(dashboardPage.quickStartContent).toContainText("AI Assist");
  });

  test("TC-009 — Sidebar navigation remains available from the Dashboard", async ({
    page,
  }) => {
    const dashboardPage = new DashboardPage(page);

    await expect(dashboardPage.sidebarDashboardButton).toBeVisible();
    await expect(dashboardPage.sidebarProgramsButton).toBeVisible();
    await expect(dashboardPage.sidebarCalendarButton).toBeVisible();
    await expect(dashboardPage.sidebarValidationButton).toBeVisible();
    await expect(dashboardPage.signOutButton).toBeVisible();
  });

  // Known product bug: /dashboard renders empty main content; home dashboard is at /
  test.fixme(
    "TC-010 — Direct navigation to /dashboard does not show dashboard blocks",
    async ({ page }) => {
      const dashboardPage = new DashboardPage(page);

      await dashboardPage.gotoDashboardRoute();

      await expect(dashboardPage.heading).toBeHidden();
      await expect(dashboardPage.programsCard).toBeHidden();
      await expect(dashboardPage.calendarCard).toBeHidden();
      await expect(dashboardPage.validationCard).toBeHidden();
      await expect(dashboardPage.aiAssistCard).toBeHidden();

      await dashboardPage.clickSidebarDashboard();

      await expect(dashboardPage.heading).toBeVisible();
      await expect(dashboardPage.programsCard).toBeVisible();
    },
  );

  test("TC-011 — Dashboard shows connected status and program count", async ({
    page,
  }) => {
    const dashboardPage = new DashboardPage(page);

    await expect(dashboardPage.connectedStatus).toBeVisible();
    await expect(dashboardPage.programCount).toBeVisible();
  });
});

test.describe("DS-119: Access control", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("TC-008 — Unauthenticated user cannot access the Dashboard", async ({
    page,
  }) => {
    const dashboardPage = new DashboardPage(page);

    await dashboardPage.goto();

    await expect(page).toHaveURL(/\/login/);
    await expect(dashboardPage.heading).toBeHidden();
    await expect(dashboardPage.programsCard).toBeHidden();
  });
});
