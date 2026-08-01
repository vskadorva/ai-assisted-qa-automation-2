import { type Locator, type Page } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly welcomeMessage: Locator;
  readonly connectedStatus: Locator;
  readonly programCount: Locator;
  readonly programsCard: Locator;
  readonly calendarCard: Locator;
  readonly validationCard: Locator;
  readonly aiAssistCard: Locator;
  readonly programsSubtitle: Locator;
  readonly calendarSubtitle: Locator;
  readonly validationSubtitle: Locator;
  readonly aiAssistSubtitle: Locator;
  readonly quickStartHeading: Locator;
  readonly quickStartContent: Locator;
  readonly sidebarDashboardButton: Locator;
  readonly sidebarProgramsButton: Locator;
  readonly sidebarCalendarButton: Locator;
  readonly sidebarValidationButton: Locator;
  readonly signOutButton: Locator;
  readonly main: Locator;

  constructor(page: Page) {
    this.page = page;
    this.main = page.getByRole("main");
    this.heading = this.main.getByRole("heading", {
      name: "Dashboard",
      level: 2,
    });
    this.welcomeMessage = this.main.getByText("Welcome to Didaxis Studio");
    this.connectedStatus = this.main.getByText("Connected", { exact: true });
    this.programCount = this.main.getByText(/^\d+$/).first();
    this.programsCard = this.cardByTitle("Programs");
    this.calendarCard = this.cardByTitle("Calendar");
    this.validationCard = this.cardByTitle("Validation");
    this.aiAssistCard = this.cardByTitle("AI Assist");
    this.programsSubtitle = this.main.getByText("Manage academic programs");
    this.calendarSubtitle = this.main.getByText("Schedule & drag-drop");
    this.validationSubtitle = this.main.getByText("Check for conflicts");
    this.aiAssistSubtitle = this.main.getByText("AI-powered editing");
    this.quickStartHeading = this.main.getByText("Quick Start", { exact: true });
    this.quickStartContent = this.main.getByText(/Create a Program to define/);
    this.sidebarDashboardButton = page.getByRole("button", {
      name: "📊 Dashboard",
    });
    this.sidebarProgramsButton = page.getByRole("button", {
      name: "🎓 Programs",
    });
    this.sidebarCalendarButton = page.getByRole("button", {
      name: "📅 Calendar",
    });
    this.sidebarValidationButton = page.getByRole("button", {
      name: "✅ Validation",
    });
    this.signOutButton = page.getByRole("button", { name: "Sign out" });
  }

  private cardByTitle(title: string): Locator {
    return this.main
      .getByRole("paragraph")
      .filter({ hasText: new RegExp(`^${title}$`) })
      .first();
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async gotoDashboardRoute(): Promise<void> {
    await this.page.goto("/dashboard");
  }

  async clickProgramsCard(): Promise<void> {
    await this.programsCard.click();
  }

  async clickCalendarCard(): Promise<void> {
    await this.calendarCard.click();
  }

  async clickValidationCard(): Promise<void> {
    await this.validationCard.click();
  }

  async clickAiAssistCard(): Promise<void> {
    await this.aiAssistCard.click();
  }

  async clickSidebarDashboard(): Promise<void> {
    await this.sidebarDashboardButton.click();
  }
}
