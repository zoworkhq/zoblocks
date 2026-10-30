/**
 * SafetyPlan in a real browser.
 *
 * The docs gallery is the fixture host. The plan is interactive, and its
 * crisis step must remain available without requiring the person to expand it.
 * These tests cover the rendered plan, the pinned accordion behaviour, the
 * unfinished state, and visual regression.
 */

import { expect, test, type Page } from "@playwright/test";

const PAGE = "/components/safety-plan";

async function openSafetyPlan(page: Page, scenario: "Complete" | "Unfinished" = "Complete") {
  await page.goto(PAGE);
  await page.waitForLoadState("networkidle");

  await page.getByRole("tab", { name: scenario, exact: true }).click();

  const plan = page.locator(".zb-safety-plan").first();
  await expect(plan).toBeVisible();

  return plan;
}

test.describe("@a11y safety plan", () => {
  test("renders all six steps in the intended order", async ({ page }) => {
    const plan = await openSafetyPlan(page);

    const expectedHeadings = [
      /Signs that things are getting harder/,
      /Things I can do on my own/,
      /People and places that take my mind off it/,
      /People I can ask for help/,
      /If none of that is working/,
      /Making home safer/,
    ];

    const accordion = plan.locator("[data-zb-accordion]");
    await expect(accordion).toBeVisible();

    const buttons = accordion.locator(".zb-accordion__trigger");
    await expect(buttons).toHaveCount(expectedHeadings.length);

    for (let index = 0; index < expectedHeadings.length; index += 1) {
      await expect(buttons.nth(index)).toContainText(expectedHeadings[index]);
    }
  });

  test("keeps the pinned crisis step open", async ({ page }) => {
    const plan = await openSafetyPlan(page);
    const crisisStep = plan.locator('[data-pinned="true"]');

    await expect(crisisStep).toHaveCount(1);
    await expect(crisisStep).toHaveAttribute("data-open", "true");
    await expect(crisisStep.getByText("Always open")).toBeVisible();
    await expect(crisisStep.getByText(/This part of your plan stays open/)).toBeVisible();

    const trigger = crisisStep.getByRole("button");
    await expect(trigger).toHaveAttribute("aria-disabled", "true");

    // The pinned crisis section stays open and cannot be collapsed.
    await expect(trigger).toBeDisabled();
    await expect(crisisStep).toHaveAttribute("data-open", "true");
  });

  test("identifies incomplete steps instead of leaving them blank", async ({ page }) => {
    const plan = await openSafetyPlan(page, "Unfinished");

    const warningSigns = plan
      .locator(".zb-accordion__item")
      .filter({
        has: page.getByRole("button", {
          name: /Signs that things are getting harder/,
        }),
      })
      .first();

    await warningSigns.getByRole("button").click();
    await expect(warningSigns).toContainText("Sleeping less than four hours");

    const crisisStep = plan.locator('[data-pinned="true"]');
    await expect(crisisStep).toContainText("988");

    const internalCoping = plan
      .locator(".zb-accordion__item")
      .filter({
        has: page.getByRole("button", {
          name: /Things I can do on my own/,
        }),
      })
      .first();

    await internalCoping.getByRole("button").click();
    await expect(internalCoping).toContainText(
      "Not filled in yet. You can add to this with your clinician.",
    );
  });

  test("allows an ordinary step to expand and collapse", async ({ page }) => {
    const plan = await openSafetyPlan(page);
    const step = plan
      .locator(".zb-accordion__item")
      .filter({ has: page.getByRole("button", { name: /Signs that things are getting harder/ }) })
      .first();

    const trigger = step.getByRole("button");
    await expect(step).toHaveAttribute("data-open", "false");

    await trigger.click();
    await expect(step).toHaveAttribute("data-open", "true");
    await expect(step).toContainText("Sleeping less than four hours");

    await trigger.click();
    await expect(step).toHaveAttribute("data-open", "false");
  });
});

test.describe("visual regression @vrt", () => {
  test("complete plan", async ({ page }) => {
    const plan = await openSafetyPlan(page, "Complete");
    await expect(plan).toHaveScreenshot("safety-plan-complete.png");
  });

  test("unfinished plan", async ({ page }) => {
    const plan = await openSafetyPlan(page, "Unfinished");
    await expect(plan).toHaveScreenshot("safety-plan-unfinished.png");
  });
});
