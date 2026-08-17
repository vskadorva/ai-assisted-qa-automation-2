import { type Locator, type Page } from "@playwright/test";

export class EditProgramModal {
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly programName: Locator;
  readonly description: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;
  readonly showAiConfigButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole("dialog", { name: "Edit Program" });
    this.heading = this.dialog.getByRole("heading", { name: "Edit Program" });
    this.programName = this.dialog.getByLabel("Program Name");
    this.description = this.dialog.getByLabel("Description");
    this.saveButton = this.dialog.getByRole("button", {
      name: "Save",
      exact: true,
    });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    // Header close control has no accessible name in the current UI.
    this.closeButton = this.dialog.getByRole("button").first();
    this.showAiConfigButton = this.dialog.getByRole("button", {
      name: /Show AI Generation Config/i,
    });
  }

  /**
   * Replaces the Program Name field value.
   */
  async fillProgramName(name: string): Promise<void> {
    await this.programName.fill(name);
  }

  /**
   * Replaces the Description field value.
   */
  async fillDescription(description: string): Promise<void> {
    await this.description.fill(description);
  }

  /**
   * Clears the Program Name field.
   */
  async clearProgramName(): Promise<void> {
    await this.programName.fill("");
  }

  /**
   * Clears the Description field.
   */
  async clearDescription(): Promise<void> {
    await this.description.fill("");
  }

  /**
   * Submits the edit form via Save.
   */
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Double-clicks Save (duplicate-submit edge case).
   */
  async doubleClickSave(): Promise<void> {
    await this.saveButton.dblclick();
  }

  /**
   * Dismisses the dialog without saving via Cancel.
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Dismisses the dialog via the header close control.
   */
  async clickClose(): Promise<void> {
    await this.closeButton.click();
  }

  /**
   * Focuses the Program Name field for keyboard flows.
   */
  async focusProgramName(): Promise<void> {
    await this.programName.focus();
  }

  /**
   * Focuses the Save button for keyboard flows.
   */
  async focusSaveButton(): Promise<void> {
    await this.saveButton.focus();
  }

  /** Derives an axe-core `.include()` selector from the role-based dialog locator. */
  async axeIncludeSelector(): Promise<string> {
    return this.dialog.evaluate((dialog) => {
      const attribute = "data-axe-include";
      const value = "edit-program-modal";
      dialog.setAttribute(attribute, value);
      return `[${attribute}="${value}"]`;
    });
  }
}
