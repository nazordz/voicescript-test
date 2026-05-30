import { expect, test } from "@playwright/test";
import {
  createEditor,
  createJob,
  createReporter,
  detailStatus,
  openJob,
  search,
  unique,
} from "./helpers";

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

  test("auto-assign prefers a same-city reporter for physical jobs", async ({
    page,
  }, testInfo) => {
    // A different-city reporter is created first so it has the older createdAt:
    // a naive "pick the oldest available reporter" would grab it. The same-city
    // rule must skip it in favour of the Surabaya reporter.
    const otherCity = unique("Medan Reporter", testInfo);
    const sameCity = unique("Surabaya Reporter", testInfo);
    await createReporter(page, otherCity, "Medan", true);
    await createReporter(page, sameCity, "Surabaya", true);

    const caseName = unique("Same City Case", testInfo);
    await createJob(page, caseName, { location: "Surabaya", remote: false });
    await openJob(page, caseName);

    // Leave the select on "Auto assign" (empty) so the server picks the match.
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/assign-reporter") &&
          r.request().method() === "POST" &&
          r.ok(),
      ),
      page.getByTestId("assign-reporter-button").click(),
    ]);

    // The serialized job carries the assigned reporter relation. It must be in
    // the job's city, never the cross-city candidate.
    const assigned = (await response.json()) as {
      reporter: { location: string } | null;
    };
    expect(assigned.reporter?.location).toBe("Surabaya");
    expect(assigned.reporter?.location).not.toBe("Medan");
    await expect(detailStatus(page)).toHaveText("ASSIGNED");
  });

  test("payment recalculates when the reporter rate changes", async ({
    page,
  }, testInfo) => {
    const caseName = unique("Reporter Rate Case", testInfo);
    await createJob(page, caseName, { minutes: 80, location: "Jakarta" });
    await openJob(page, caseName);

    // Default rate 2000 IDR/min * 80 = 160.000; editor 50.000; total 210.000.
    await expect(page.getByTestId("payment-reporter")).toContainText("160.000");
    await expect(page.getByTestId("payment-total")).toContainText("210.000");

    // The reporter rate lives on the job form, not the detail payment panel.
    await page.getByTestId("job-edit-button").click();
    const modal = page.getByTestId("job-form-modal");
    await expect(modal).toBeVisible();
    await modal.getByTestId("job-form-reporter-rate").fill("3000");
    await modal.getByTestId("job-form-submit").click();
    await expect(modal).toBeHidden();

    // Reopen the persisted record to read the recalculated payout.
    await page.reload();
    await openJob(page, caseName);

    // 3000 * 80 = 240.000; editor unchanged 50.000; total 290.000.
    await expect(page.getByTestId("payment-reporter")).toContainText("240.000");
    await expect(page.getByTestId("payment-total")).toContainText("290.000");
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
