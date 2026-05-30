import { expect, type Page } from "@playwright/test";

/**
 * Shared helpers for the Voicescript court-reporting e2e suite.
 *
 * The specs run against a throwaway Postgres testcontainer provisioned in
 * `tests/global-setup.ts` (migrated + seeded once for the whole run). Selectors
 * rely on `data-testid` attributes so they stay stable across markup changes.
 *
 * Tests isolate themselves with unique names/case-names and never assume a
 * specific seeded row, so they remain safe under Playwright's parallelism.
 */

let counter = 0;

/** Build a name guaranteed unique across files, workers and projects. */
export function unique(prefix: string, testInfo: { project: { name: string } }): string {
  counter += 1;
  return `${prefix} ${testInfo.project.name} ${Date.now()}-${counter}`;
}

/** Filter the visible list down to a single row by typing into the search box. */
export async function search(page: Page, term: string): Promise<void> {
  await page.getByTestId("search-input").fill(term);
}

export async function createReporter(
  page: Page,
  name: string,
  location = "Jakarta",
  available = true,
): Promise<void> {
  await page.goto("/reporters");
  await page.getByTestId("reporter-new-button").click();
  const modal = page.getByTestId("reporter-form-modal");
  await expect(modal).toBeVisible();
  await modal.getByTestId("reporter-form-name").fill(name);
  await modal.getByTestId("reporter-form-location").selectOption(location);
  if (!available) {
    await modal.getByTestId("reporter-form-availability").uncheck();
  }
  await modal.getByTestId("reporter-form-submit").click();
  await expect(modal).toBeHidden();
}

export async function createEditor(page: Page, name: string): Promise<void> {
  await page.goto("/editors");
  await page.getByTestId("editor-new-button").click();
  const modal = page.getByTestId("editor-form-modal");
  await expect(modal).toBeVisible();
  await modal.getByTestId("editor-form-name").fill(name);
  await modal.getByTestId("editor-form-submit").click();
  await expect(modal).toBeHidden();
}

export async function createJob(
  page: Page,
  caseName: string,
  options: { minutes?: number; location?: string; remote?: boolean } = {},
): Promise<void> {
  const { minutes = 80, location = "Jakarta", remote = false } = options;
  await page.goto("/jobs");
  await page.getByTestId("job-new-button").click();
  const modal = page.getByTestId("job-form-modal");
  await expect(modal).toBeVisible();
  await modal.getByTestId("job-form-case-name").fill(caseName);
  await modal.getByTestId("job-form-duration").fill(String(minutes));
  await modal.getByTestId("job-form-location").selectOption(location);
  if (remote) {
    await modal.getByTestId("job-form-remote").check();
  }
  await modal.getByTestId("job-form-submit").click();
  await expect(modal).toBeHidden();
}

/** Open the detail panel for a job by filtering the table to its case name. */
export async function openJob(page: Page, caseName: string): Promise<void> {
  await search(page, caseName);
  const row = page.getByTestId("job-row").filter({ hasText: caseName });
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.getByTestId("job-detail-title")).toHaveText(caseName);
}

export function detailStatus(page: Page) {
  return page.getByTestId("job-detail").getByTestId("status-badge").first();
}
