import { type Locator, type Page } from "@playwright/test";

export class DeleteProgramModal {
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole("dialog").filter({
      has: page.getByRole("button", { name: "Delete", exact: true }),
    });
    this.heading = this.dialog.getByRole("heading");
    this.confirmButton = this.dialog.getByRole("button", {
      name: "Delete",
      exact: true,
    });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.closeButton = this.dialog.getByRole("button").first();
  }

  async clickConfirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async doubleClickConfirm(): Promise<void> {
    await this.confirmButton.dblclick();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async clickClose(): Promise<void> {
    await this.closeButton.click();
  }

  async focusConfirmButton(): Promise<void> {
    await this.confirmButton.focus();
  }

  /** Derives an axe-core `.include()` selector from the role-based dialog locator. */
  async axeIncludeSelector(): Promise<string> {
    return this.dialog.evaluate((dialog) => {
      const attribute = "data-axe-include";
      const value = "delete-program-modal";
      dialog.setAttribute(attribute, value);
      return `[${attribute}="${value}"]`;
    });
  }
}
