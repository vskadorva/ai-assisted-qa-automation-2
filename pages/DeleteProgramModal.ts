import { type Dialog, type Page } from "@playwright/test";

export class DeleteProgramModal {
  constructor(private readonly page: Page) {}

  waitForOpen(): Promise<Dialog> {
    return this.page.waitForEvent("dialog");
  }

  async accept(dialog: Dialog): Promise<void> {
    await dialog.accept();
  }

  async dismiss(dialog: Dialog): Promise<void> {
    await dialog.dismiss();
  }

  message(dialog: Dialog): string {
    return dialog.message();
  }
}
