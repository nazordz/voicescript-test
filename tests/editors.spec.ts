import { expect, test } from "@playwright/test";
import { createEditor, search, unique } from "./helpers";

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
