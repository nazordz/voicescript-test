import { expect, test } from "@playwright/test";

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
