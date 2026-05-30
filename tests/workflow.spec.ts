import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end coverage for the Voicescript court-reporting workflow.
 *
 * The suite runs against a throwaway Postgres testcontainer provisioned in
 * `tests/global-setup.ts` (migrated + seeded once for the whole run). Selectors
 * rely on `data-testid` attributes so they stay stable across markup changes.
 *
 * Tests isolate themselves with unique names/case-names and never assume a
 * specific seeded row, so they remain safe under Playwright's parallelism.
 */

let counter = 0;
function unique(prefix: string, testInfo: { project: { name: string } }): string {
  counter += 1;
  return `${prefix} ${testInfo.project.name} ${Date.now()}-${counter}`;
}

/** Filter the visible list down to a single row by typing into the search box. */
async function search(page: Page, term: string): Promise<void> {
  await page.getByTestId("search-input").fill(term);
}

async function createReporter(
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

async function createEditor(page: Page, name: string): Promise<void> {
  await page.goto("/editors");
  await page.getByTestId("editor-new-button").click();
  const modal = page.getByTestId("editor-form-modal");
  await expect(modal).toBeVisible();
  await modal.getByTestId("editor-form-name").fill(name);
  await modal.getByTestId("editor-form-submit").click();
  await expect(modal).toBeHidden();
}

async function createJob(
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
async function openJob(page: Page, caseName: string): Promise<void> {
  await search(page, caseName);
  const row = page.getByTestId("job-row").filter({ hasText: caseName });
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.getByTestId("job-detail-title")).toHaveText(caseName);
}

function detailStatus(page: Page) {
  return page.getByTestId("job-detail").getByTestId("status-badge").first();
}

test.describe("Reporters", () => {
  test("create, search, sort, paginate, edit and delete", async ({ page }, testInfo) => {
    const name = unique("Reporter", testInfo);

    await createReporter(page, name, "Bandung");

    // Search (debounced) narrows the list to the new reporter.
    await search(page, name);
    const row = page.getByTestId("reporter-row").filter({ hasText: name });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Bandung");
    await expect(row.getByTestId("availability-badge")).toHaveText("Available");

    // Sorting toggles a direction indicator on the column header. The reporters
    // list starts sorted by name ascending, so the first click flips to
    // descending and the second back to ascending.
    const sortName = page.getByTestId("sort-name");
    await expect(sortName).toContainText("↑");
    await sortName.click();
    await expect(sortName).toContainText("↓");
    await sortName.click();
    await expect(sortName).toContainText("↑");

    // Pagination controls reflect page size changes.
    await page.getByTestId("pagination-page-size").selectOption("5");
    await expect(page.getByTestId("pagination-info")).toContainText("Page 1 of");

    // Edit: rename the reporter.
    await search(page, name);
    await row.getByTestId("reporter-edit-button").click();
    const editModal = page.getByTestId("reporter-form-modal");
    await expect(editModal).toBeVisible();
    const renamed = `${name} EDITED`;
    await editModal.getByTestId("reporter-form-name").fill(renamed);
    await editModal.getByTestId("reporter-form-submit").click();
    await expect(editModal).toBeHidden();
    await search(page, renamed);
    await expect(
      page.getByTestId("reporter-row").filter({ hasText: renamed }),
    ).toBeVisible();

    // Delete: confirm removal.
    await page
      .getByTestId("reporter-row")
      .filter({ hasText: renamed })
      .getByTestId("reporter-delete-button")
      .click();
    await page.getByTestId("delete-confirm-button").click();
    await search(page, renamed);
    await expect(
      page.getByTestId("reporter-row").filter({ hasText: renamed }),
    ).toHaveCount(0);
  });

  test("availability filter narrows results", async ({ page }, testInfo) => {
    const available = unique("ReporterAvail", testInfo);
    const unavailable = unique("ReporterBusy", testInfo);
    await createReporter(page, available, "Medan", true);
    await createReporter(page, unavailable, "Medan", false);

    await page.goto("/reporters");
    await page.getByTestId("filter-availability").selectOption("false");
    await search(page, unavailable);
    await expect(
      page.getByTestId("reporter-row").filter({ hasText: unavailable }),
    ).toBeVisible();

    await search(page, available);
    await expect(
      page.getByTestId("reporter-row").filter({ hasText: available }),
    ).toHaveCount(0);
  });
});

test.describe("Editors", () => {
  test("create, search, edit and delete", async ({ page }, testInfo) => {
    const name = unique("Editor", testInfo);
    await createEditor(page, name);

    await search(page, name);
    const row = page.getByTestId("editor-row").filter({ hasText: name });
    await expect(row).toBeVisible();

    // Edit.
    await row.getByTestId("editor-edit-button").click();
    const modal = page.getByTestId("editor-form-modal");
    await expect(modal).toBeVisible();
    const renamed = `${name} EDITED`;
    await modal.getByTestId("editor-form-name").fill(renamed);
    await modal.getByTestId("editor-form-submit").click();
    await expect(modal).toBeHidden();
    await search(page, renamed);
    await expect(
      page.getByTestId("editor-row").filter({ hasText: renamed }),
    ).toBeVisible();

    // Delete.
    await page
      .getByTestId("editor-row")
      .filter({ hasText: renamed })
      .getByTestId("editor-delete-button")
      .click();
    await page.getByTestId("delete-confirm-button").click();
    await search(page, renamed);
    await expect(
      page.getByTestId("editor-row").filter({ hasText: renamed }),
    ).toHaveCount(0);
  });
});

test.describe("Job workflow", () => {
  test("full lifecycle NEW → ASSIGNED → TRANSCRIBED → REVIEWED → COMPLETED", async ({
    page,
  }, testInfo) => {
    // Dedicated reporter (same city, physical) and editor so auto-assignment
    // has predictable candidates regardless of seed/parallel state.
    const reporterName = unique("Wf Reporter", testInfo);
    const editorName = unique("Wf Editor", testInfo);
    await createReporter(page, reporterName, "Bandung", true);
    await createEditor(page, editorName);

    const caseName = unique("Workflow Case", testInfo);
    await createJob(page, caseName, { minutes: 80, location: "Bandung" });

    await openJob(page, caseName);
    await expect(detailStatus(page)).toHaveText("NEW");

    // Reporter payout = 80 min * 2000 IDR default = 160.000.
    await expect(page.getByTestId("payment-reporter")).toContainText("160.000");

    // Assign reporter → advances to ASSIGNED.
    await page.getByTestId("assign-reporter-button").click();
    await expect(detailStatus(page)).toHaveText("ASSIGNED");

    // Advance to TRANSCRIBED.
    await page.getByTestId("advance-status-button").click();
    await expect(detailStatus(page)).toHaveText("TRANSCRIBED");

    // Editor assignment is only enabled at TRANSCRIBED. Wait for the assignment
    // request to settle before advancing, otherwise REVIEWED is rejected
    // server-side ("assign an editor first").
    await expect(page.getByTestId("assign-editor-button")).toBeEnabled();
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/assign-editor") &&
          response.request().method() === "POST" &&
          response.ok(),
      ),
      page.getByTestId("assign-editor-button").click(),
    ]);

    // Advance to REVIEWED (server requires an assigned editor).
    await page.getByTestId("advance-status-button").click();
    await expect(detailStatus(page)).toHaveText("REVIEWED");

    // Advance to COMPLETED.
    await page.getByTestId("advance-status-button").click();
    await expect(detailStatus(page)).toHaveText("COMPLETED");

    // Reload to read the persisted record and verify every transition was
    // written to the history (NEW + 4 advances = 5 entries).
    await page.reload();
    await openJob(page, caseName);
    await expect(detailStatus(page)).toHaveText("COMPLETED");
    await expect(
      page.getByTestId("status-history").getByTestId("status-history-item"),
    ).toHaveCount(5);

    // No further advance possible once completed, and it can't be cancelled.
    await expect(page.getByTestId("advance-status-button")).toHaveCount(0);
    await expect(page.getByTestId("cancel-job-button")).toHaveCount(0);
  });

  test("editor cannot be assigned before transcription", async ({ page }, testInfo) => {
    const caseName = unique("Early Editor", testInfo);
    await createJob(page, caseName, { location: "Jakarta" });
    await openJob(page, caseName);

    // At NEW the assign-editor action is disabled.
    await expect(page.getByTestId("assign-editor-button")).toBeDisabled();
  });

  test("payment recalculates when the editor fee changes", async ({ page }, testInfo) => {
    const caseName = unique("Payment Case", testInfo);
    await createJob(page, caseName, { minutes: 80, location: "Jakarta" });
    await openJob(page, caseName);

    // Default editor fee 50.000, reporter 160.000, total 210.000.
    await expect(page.getByTestId("payment-editor")).toContainText("50.000");
    await expect(page.getByTestId("payment-total")).toContainText("210.000");

    await page.getByTestId("payment-editor-fee").fill("99000");
    await page.getByTestId("payment-save-button").click();

    await expect(page.getByTestId("payment-editor")).toContainText("99.000");
    await expect(page.getByTestId("payment-total")).toContainText("259.000");
  });

  test("a job can be cancelled", async ({ page }, testInfo) => {
    const caseName = unique("Cancel Case", testInfo);
    await createJob(page, caseName, { location: "Jakarta" });
    await openJob(page, caseName);

    await page.getByTestId("cancel-job-button").click();
    await expect(detailStatus(page)).toHaveText("CANCELLED");
    // Cancelled jobs expose neither advance nor cancel actions.
    await expect(page.getByTestId("advance-status-button")).toHaveCount(0);
    await expect(page.getByTestId("cancel-job-button")).toHaveCount(0);
  });

  test("remote jobs can be created and listed", async ({ page }, testInfo) => {
    const caseName = unique("Remote Case", testInfo);
    await createJob(page, caseName, { location: "Denpasar", remote: true });

    await search(page, caseName);
    const row = page.getByTestId("job-row").filter({ hasText: caseName });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Remote");
  });

  test("status filter narrows the job list", async ({ page }, testInfo) => {
    const caseName = unique("Filter Case", testInfo);
    await createJob(page, caseName, { location: "Jakarta" });

    await page.goto("/jobs");
    // Filter to CANCELLED (value 5) — the brand-new NEW job must drop out.
    await page.getByTestId("filter-status").selectOption("5");
    await search(page, caseName);
    await expect(
      page.getByTestId("job-row").filter({ hasText: caseName }),
    ).toHaveCount(0);
  });

  test("job form rejects an empty case name", async ({ page }) => {
    await page.goto("/jobs");
    await page.getByTestId("job-new-button").click();
    const modal = page.getByTestId("job-form-modal");
    await expect(modal).toBeVisible();
    await modal.getByTestId("job-form-case-name").fill("");
    await modal.getByTestId("job-form-submit").click();
    await expect(modal.getByTestId("job-form-case-name-error")).toBeVisible();
    // Modal stays open because submission was blocked.
    await expect(modal).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("sidebar links route between sections", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop sidebar is always visible; mobile covered separately");
    await page.goto("/jobs");
    await page.getByTestId("nav-reporters").click();
    await expect(page).toHaveURL(/\/reporters$/);
    await expect(page.getByRole("heading", { name: "Reporters" })).toBeVisible();

    await page.getByTestId("nav-editors").click();
    await expect(page).toHaveURL(/\/editors$/);
    await expect(page.getByRole("heading", { name: "Editors" })).toBeVisible();

    await page.getByTestId("nav-jobs").click();
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test("mobile drawer exposes navigation", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile-only coverage");
    await page.goto("/jobs");
    // The sidebar toggle is only rendered on small screens.
    await expect(page.getByTestId("sidebar-toggle")).toBeVisible();
    await page.getByTestId("sidebar-toggle").click();
    await page.getByTestId("nav-reporters").click();
    await expect(page).toHaveURL(/\/reporters$/);
  });
});
