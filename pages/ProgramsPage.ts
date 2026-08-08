import { type Dialog, type Locator, type Page } from "@playwright/test";
import { extractProgramId, getCleanupApiToken } from "../fixtures/program-api";
import { DeleteProgramModal } from "./DeleteProgramModal";
import { NewProgramModal } from "./NewProgramModal";

type TrackProgram = (uuid: string) => void;

export class ProgramsPage {
  readonly page: Page;
  readonly newProgramModal: NewProgramModal;
  readonly deleteProgramModal: DeleteProgramModal;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly newProgramButton: Locator;
  readonly programsTable: Locator;
  readonly programColumnHeader: Locator;
  readonly selectProgramHint: Locator;
  readonly firstEditButton: Locator;
  readonly firstDeleteButton: Locator;
  readonly emptyStateMessage: Locator;
  readonly emptyStateCreateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newProgramModal = new NewProgramModal(page);
    this.deleteProgramModal = new DeleteProgramModal(page);
    this.heading = page.getByRole("heading", { name: "Programs", level: 2 });
    this.subtitle = page.getByText("Manage academic programs and semesters");
    this.newProgramButton = page.getByRole("button", { name: "+ New Program" });
    this.programsTable = page.getByRole("table");
    this.programColumnHeader = page.getByRole("columnheader", {
      name: "Program",
    });
    this.selectProgramHint = page.getByText(
      "Select a program to manage semesters",
    );
    this.firstEditButton = page.getByRole("button", { name: /^Edit / }).first();
    this.firstDeleteButton = page
      .getByRole("button", { name: /^Delete / })
      .first();
    this.emptyStateMessage = page.getByText(
      "No programs yet. Create your first program to get started.",
    );
    this.emptyStateCreateButton = page.getByRole("button", {
      name: "Create Program",
    });
  }

  async hasPrograms(): Promise<boolean> {
    const token = await getCleanupApiToken();
    if (!token) {
      throw new Error(
        "Could not obtain API token to check program list. Set DIDAXIS_API_TOKEN or DIDAXIS_EMAIL/DIDAXIS_PASSWORD.",
      );
    }

    const baseUrl = process.env.DIDAXIS_URL ?? "https://test.didaxis.studio";
    const res = await fetch(`${baseUrl}/api/programs?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`GET /api/programs failed: ${res.status}`);
    }

    const body = await res.json();
    const programs = Array.isArray(body)
      ? body
      : body?.data && Array.isArray(body.data)
        ? body.data
        : [];

    return programs.length > 0;
  }

  firstProgramRow(): Locator {
    return this.programsTable
      .getByRole("row")
      .filter({ has: this.page.getByRole("button", { name: /^Edit / }) })
      .first();
  }

  firstProgramRowName(name: string): Locator {
    return this.firstProgramRow().getByText(name, { exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto("/programs");
  }

  async openNewProgramForm(): Promise<void> {
    await this.newProgramButton.click();
  }

  programRow(name: string): Locator {
    return this.programsTable
      .getByRole("row")
      .filter({ has: this.page.getByText(name, { exact: true }) });
  }

  programRowName(name: string): Locator {
    return this.programRow(name).getByText(name, { exact: true });
  }

  programRowDescription(name: string, description: string): Locator {
    return this.programRow(name).getByText(description);
  }

  programRowText(name: string, text: string): Locator {
    return this.programRow(name).getByText(text);
  }

  programCell(name: string): Locator {
    return this.programRow(name).getByRole("cell").first();
  }

  async createProgram(
    name: string,
    trackProgram: TrackProgram,
    description?: string,
  ): Promise<void> {
    await this.newProgramModal.fillProgramName(name);
    if (description !== undefined) {
      await this.newProgramModal.fillDescription(description);
    }
    await this.waitForProgramCreate(
      () => this.newProgramModal.clickCreate(),
      trackProgram,
    );
  }

  async waitForProgramCreate(
    action: () => Promise<void>,
    trackProgram: TrackProgram,
  ): Promise<void> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.url().includes("/api/programs") &&
          res.request().method() === "POST" &&
          res.ok(),
      ),
      action(),
    ]);

    const body = await response.json();
    const uuid = extractProgramId(body);
    if (uuid) {
      trackProgram(uuid);
    }
  }

  async clickCreateAndMaybeTrack(trackProgram: TrackProgram): Promise<void> {
    const responsePromise = this.page
      .waitForResponse(
        (res) =>
          res.url().includes("/api/programs") &&
          res.request().method() === "POST",
        { timeout: 5000 },
      )
      .catch(() => null);

    await this.newProgramModal.clickCreate();

    const response = await responsePromise;
    if (response?.ok()) {
      const body = await response.json();
      const uuid = extractProgramId(body);
      if (uuid) {
        trackProgram(uuid);
      }
    }
  }

  async closeModalWithoutSaving(): Promise<void> {
    await this.newProgramModal.clickCancel();
  }

  deleteButton(name: string): Locator {
    return this.programRow(name).getByRole("button", { name: /^Delete / });
  }

  async openDeleteConfirmation(name: string): Promise<Dialog> {
    const dialogPromise = this.deleteProgramModal.waitForOpen();
    await this.deleteButton(name).click();
    return dialogPromise;
  }

  async confirmDelete(name: string): Promise<void> {
    const dialog = await this.openDeleteConfirmation(name);
    await this.deleteProgramModal.accept(dialog);
  }

  async waitForProgramDelete(action: () => Promise<void>): Promise<void> {
    await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.url().includes("/api/programs/") &&
          res.request().method() === "DELETE" &&
          res.ok(),
      ),
      action(),
    ]);
  }
}
