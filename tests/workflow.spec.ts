import { expect, test } from "@playwright/test";

test("reporters table supports create, search, sort, and pagination controls", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reporters" }).click();

  const name = `Reporter ${testInfo.project.name} ${Date.now()}`;

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Location").selectOption("Jakarta");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("cell", { name }).first()).toBeVisible();

  await page.getByPlaceholder("Search").fill(name);
  await expect(page.getByRole("cell", { name }).first()).toBeVisible();
  await page.getByRole("button", { name: /Name/ }).click();
  await page.getByRole("combobox").last().selectOption("5");
  await expect(page.getByText(/Page 1 of/)).toBeVisible();
});

test("editors table supports create and search", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Editors" }).click();

  const name = `Editor ${testInfo.project.name} ${Date.now()}`;

  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(name)).toBeVisible();

  await page.getByPlaceholder("Search").fill(name);
  await expect(page.getByText(name)).toBeVisible();
});

test("job workflow supports create, assignment, status history, and payment edit", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  const caseName = `Workflow Case ${testInfo.project.name} ${Date.now()}`;

  await page.getByLabel("Case name").fill(caseName);
  await page.getByLabel("Minutes").fill("80");
  await page.getByLabel("Location").selectOption("Jakarta");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("cell", { name: new RegExp(caseName) })).toBeVisible();

  await page.getByRole("cell", { name: new RegExp(caseName) }).click();
  await page.getByRole("button", { name: "Assign reporter" }).click();
  await expect(page.getByText("ASSIGNED")).toBeVisible();

  await page.getByRole("button", { name: "Move to TRANSCRIBED" }).click();
  await expect(page.getByText("TRANSCRIBED")).toBeVisible();

  await page.getByRole("button", { name: "Assign editor" }).click();
  await page.getByRole("button", { name: "Move to REVIEWED" }).click();
  await expect(page.getByText("REVIEWED")).toBeVisible();

  await page.getByRole("spinbutton").last().fill("99000");
  await page.getByRole("button", { name: "Save payment" }).click();
  await expect(page.getByText(/Rp99\.000/)).toBeVisible();
});

test("mobile navigation exposes paginated jobs", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only coverage");

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Jobs" })).toBeVisible();
  await expect(page.getByText(/Page 1 of/)).toBeVisible();
});
