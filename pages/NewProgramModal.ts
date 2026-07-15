import { type Locator, type Page } from "@playwright/test";

export class NewProgramModal {
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly programName: Locator;
  readonly description: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;
  readonly showAiConfigButton: Locator;
  readonly totalProgramHoursLabel: Locator;
  readonly defaultSessionHoursLabel: Locator;
  readonly defaultExamHoursLabel: Locator;
  readonly targetAudienceLabel: Locator;
  readonly focusAreasLabel: Locator;
  readonly syncAsyncRatioLabel: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole("dialog", { name: "New Program" });
    this.heading = this.dialog.getByRole("heading", { name: "New Program" });
    this.programName = this.dialog.getByLabel("Program Name");
    this.description = this.dialog.getByLabel("Description");
    this.createButton = this.dialog.getByRole("button", {
      name: "Create",
      exact: true,
    });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.closeButton = this.dialog.getByRole("button").first();
    this.showAiConfigButton = this.dialog.getByRole("button", {
      name: /Show AI Generation Config/i,
    });
    this.totalProgramHoursLabel = this.dialog.getByText("Total Program Hours");
    this.defaultSessionHoursLabel = this.dialog.getByText(
      "Default Session Hours",
    );
    this.defaultExamHoursLabel = this.dialog.getByText("Default Exam Hours");
    this.targetAudienceLabel = this.dialog.getByText("Target Audience");
    this.focusAreasLabel = this.dialog.getByText("Focus Areas");
    this.syncAsyncRatioLabel = this.dialog.getByText(/Sync\/Async Ratio/i);
  }

  async fillProgramName(name: string): Promise<void> {
    await this.programName.fill(name);
  }

  async fillDescription(description: string): Promise<void> {
    await this.description.fill(description);
  }

  async clickCreate(): Promise<void> {
    await this.createButton.click();
  }

  async doubleClickCreate(): Promise<void> {
    await this.createButton.dblclick();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async clickClose(): Promise<void> {
    await this.closeButton.click();
  }

  async focusProgramName(): Promise<void> {
    await this.programName.focus();
  }

  async focusDescription(): Promise<void> {
    await this.description.focus();
  }

  async focusCreateButton(): Promise<void> {
    await this.createButton.focus();
  }

  /** Derives an axe-core `.include()` selector from the role-based dialog locator. */
  async axeIncludeSelector(): Promise<string> {
    return this.dialog.evaluate((dialog) => {
      const attribute = "data-axe-include";
      const value = "new-program-modal";
      dialog.setAttribute(attribute, value);
      return `[${attribute}="${value}"]`;
    });
  }
}
