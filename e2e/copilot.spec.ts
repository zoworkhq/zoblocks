/**
 * Copilot in the live docs demo.
 *
 * The docs page hosts the real component with a scripted provider, so these
 * browser checks exercise the shipped surface without calling a model or
 * sending patient data. The unit suite covers the safety pipeline; this file
 * checks the page integration, keyboard use, and the rendered conversation.
 */

import { expect, test, type ConsoleMessage, type Locator, type Page } from "@playwright/test";
import { source as AXE_SOURCE } from "axe-core";

const PAGE = "/components/copilot?state=rest";
const QUESTION = "Where can I review the current local guidance?";
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

interface AxeResult {
  violations: {
    id: string;
    impact?: string;
    help: string;
    nodes: { target: string[]; failureSummary?: string }[];
  }[];
}

async function openCopilot(page: Page) {
  const response = await page.goto(PAGE);
  expect(response?.status()).toBe(200);
  await page.waitForLoadState("networkidle");

  const playground = page.locator("#playground");
  await playground.scrollIntoViewIfNeeded();
  // The docs page reveals sections as they enter view. Settle that presentation
  // state directly so screenshots do not capture a partially transparent frame.
  await page.evaluate(() => {
    document
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((item) => item.setAttribute("data-revealed", "true"));
  });
  const demo = page.getByRole("tabpanel", { name: "At rest" });
  await expect(demo).toBeVisible();

  const copilot = demo.locator("[data-zb-copilot]");
  await expect(copilot).toBeVisible();
  return { demo, copilot };
}

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

/** Run axe against a Copilot-owned region, leaving docs chrome and the host chart out. */
async function auditCopilotRegion(region: Locator) {
  return region.evaluate(async (element, tags) => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: Element,
            options: { runOnly: { type: "tag"; values: string[] } },
          ) => Promise<AxeResult>;
        };
      }
    ).axe;
    const result = await axe.run(element, { runOnly: { type: "tag", values: tags } });
    return result.violations;
  }, WCAG_TAGS);
}

test.describe("Copilot live demo @a11y", () => {
  test("loads the real example and exposes its named dock and controls", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    const { demo } = await openCopilot(page);

    await expect(demo.getByRole("complementary", { name: "Clinical assistant" })).toBeVisible();
    await expect(demo.getByRole("combobox", { name: "Clinical assistant" })).toHaveAttribute(
      "placeholder",
      "Search the evidence…",
    );
    await expect(demo.getByRole("button", { name: "Look up" })).toBeVisible();
    await expect(demo.getByRole("button", { name: "Start dictation" })).toBeVisible();
    await expect(demo.getByRole("button", { name: "Send" })).toBeDisabled();
    await expect(demo).toContainText("Medical knowledge only. Not for autonomous decision making.");

    expect(errors).toEqual([]);
  });

  test("submits a synthetic question and renders the scripted sourced answer", async ({ page }) => {
    const errors = collectBrowserErrors(page);
    const { demo } = await openCopilot(page);
    const field = demo.getByRole("combobox", { name: "Clinical assistant" });

    // Cmd/Ctrl+K focuses the composer when focus is outside another field.
    await page.keyboard.press("Control+k");
    await expect(field).toBeFocused();
    await field.fill(QUESTION);
    await field.press("Enter");

    const conversation = demo.getByRole("region", { name: "Assistant conversation" });
    await expect(conversation).toBeVisible();
    await expect(conversation).toContainText(QUESTION);
    await expect(conversation).toContainText(
      "Rate control is a reasonable initial approach for most patients without severe symptoms.",
    );
    await expect(
      conversation.getByRole("button", { name: /Source 1, 2023 ACC\/AHA\/HRS AF Guideline/ }),
    ).toBeVisible();
    await expect(demo.getByRole("textbox", { name: "Ask a follow-up…" })).toBeVisible();

    // Collapsing removes the panel; reopening preserves the in-memory thread.
    await demo.getByRole("button", { name: "Put the assistant away" }).click();
    await expect(conversation).toHaveCount(0);
    await demo.getByRole("button", { name: "Reopen the assistant" }).click();
    await expect(demo.getByRole("region", { name: "Assistant conversation" })).toContainText(
      QUESTION,
    );

    expect(errors).toEqual([]);
  });

  test("has no axe WCAG A/AA violations in its supported interactive states", async ({ page }) => {
    const { demo, copilot } = await openCopilot(page);
    await page.evaluate(AXE_SOURCE);
    const violations: string[] = [];

    const check = async (state: string, region: Locator = copilot) => {
      const results = await auditCopilotRegion(region);
      for (const violation of results) {
        for (const node of violation.nodes) {
          violations.push(
            `${state}: ${violation.id} (${violation.impact ?? "unknown"}) — ${violation.help}\n` +
              `  ${node.target.join(" ")}\n${node.failureSummary ?? ""}`,
          );
        }
      }
    };

    await check("initial");

    // The Copilot page's gallery is part of the component's example surface;
    // include it without pulling the site's navigation or chart into axe.
    const gallery = page.locator("#gallery");
    await expect(gallery).toBeVisible();
    const samples = gallery.locator("pre.overflow-x-auto");
    await expect(samples).toHaveCount(2);
    for (const sample of await samples.all()) {
      await expect(sample).toHaveAttribute("tabindex", "0");
    }
    await samples.nth(0).focus();
    await expect(samples.nth(0)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(samples.nth(1)).toBeFocused();
    await check("Copilot gallery", gallery);

    // Expanded mode tray.
    await demo.getByRole("button", { name: "Look up" }).click();
    await expect(demo.getByRole("group", { name: "Change mode" })).toBeVisible();
    await check("mode tray");
    await demo.getByRole("button", { name: "Look up" }).click();

    // The microphone is a local dictation state in this demo; no device or
    // external speech service is contacted.
    await demo.getByRole("button", { name: "Start dictation" }).click();
    await expect(demo.getByRole("button", { name: "Stop dictation" })).toBeVisible();
    await check("dictating");
    await demo.getByRole("button", { name: "Stop dictation" }).click();

    // Exercise the real keyboard summon and inspect the transient streaming
    // state before the docs page's deterministic provider finishes.
    const field = demo.getByRole("combobox", { name: "Clinical assistant" });
    await page.keyboard.press("Control+k");
    await expect(field).toBeFocused();
    await field.fill(QUESTION);
    await field.press("Enter");
    await expect(copilot.locator('[aria-busy="true"]')).toBeVisible();
    await check("streaming");

    const conversation = demo.getByRole("region", { name: "Assistant conversation" });
    await expect(conversation).toContainText(
      "Rate control is a reasonable initial approach for most patients without severe symptoms.",
    );
    await check("completed conversation");

    await conversation.getByRole("button", { name: "Show sources" }).click();
    await expect(demo.getByRole("region", { name: "Basis of this answer" })).toBeVisible();
    await check("sources open");

    expect(violations, violations.join("\n\n")).toEqual([]);
  });

  test("has no axe WCAG A/AA violations in the synthetic crisis state", async ({ page }) => {
    const { demo, copilot } = await openCopilot(page);
    await page.evaluate(AXE_SOURCE);
    const field = demo.getByRole("combobox", { name: "Clinical assistant" });
    await field.fill("I want to kill myself and have a plan.");
    await field.press("Enter");
    await expect(demo.getByRole("alert")).toBeVisible();

    const violations = await auditCopilotRegion(copilot);
    expect(
      violations.flatMap((violation) =>
        violation.nodes.map(
          (node) =>
            `${violation.id} (${violation.impact ?? "unknown"}) — ${violation.help}: ` +
            `${node.target.join(" ")}\n${node.failureSummary ?? ""}`,
        ),
      ),
    ).toEqual([]);
  });
});

test.describe("Copilot visual regression @vrt", () => {
  test("the resting dock is visually stable", async ({ page }) => {
    const { copilot } = await openCopilot(page);
    await expect(copilot).toHaveScreenshot("copilot-rest.png");
  });

  test("the submitted synthetic conversation is visually stable", async ({ page }) => {
    const { demo, copilot } = await openCopilot(page);
    const field = demo.getByRole("combobox", { name: "Clinical assistant" });
    await field.fill(QUESTION);
    await field.press("Enter");

    const conversation = demo.getByRole("region", { name: "Assistant conversation" });
    await expect(
      conversation.getByRole("button", { name: /Source 1, 2023 ACC\/AHA\/HRS AF Guideline/ }),
    ).toBeVisible();
    await expect(copilot).toHaveScreenshot("copilot-conversation.png");
  });
});
