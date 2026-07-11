import { test as base, expect } from "@playwright/test";
import { getCleanupApiToken } from "./program-api";

type CleanupFixtures = {
  trackProgram: (uuid: string) => void;
};

export const test = base.extend<CleanupFixtures>({
  trackProgram: async ({}, use) => {
    const uuids: string[] = [];

    await use((uuid: string) => {
      uuids.push(uuid);
    });

    if (uuids.length === 0) {
      return;
    }

    const baseUrl = process.env.DIDAXIS_URL ?? "https://test.didaxis.studio";
    const token = await getCleanupApiToken();

    if (!token) {
      console.warn(
        "Could not obtain API token; cannot clean up programs:",
        uuids,
      );
      return;
    }

    for (const uuid of uuids) {
      try {
        const res = await fetch(`${baseUrl}/api/programs/${uuid}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.warn(`Failed to delete program ${uuid}: ${res.status}`);
        }
      } catch (error) {
        console.warn(`Failed to delete program ${uuid}:`, error);
      }
    }
  },
});

export { expect };
