import { expect, test } from "@playwright/test";
import { createReporter, search, unique } from "./helpers";

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
