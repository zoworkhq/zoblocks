/**
 * The cross-framework claim, executed.
 *
 * `@oxygenui-design/loaders` says it "works in React, Vue, Angular, Svelte, or
 * plain HTML". That sentence sits on the npm page and in the docs, and until
 * this file existed nothing tested it — the unit suite runs in jsdom against
 * elements constructed by hand, which is precisely the layer where none of the
 * framework-specific failures live.
 *
 * Every page in apps/smoke (and apps/smoke-react18) implements the same tiny
 * contract, so one script drives all six. A framework-specific bug therefore
 * shows up as one row failing while the others pass, which points at the
 * integration rather than the component.
 *
 * See apps/smoke/README.md for the failure each page is positioned to catch.
 */

import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";

const SMOKE = process.env.OXYGEN_SMOKE_URL ?? "http://localhost:6010";
const SMOKE_18 = process.env.OXYGEN_SMOKE_18_URL ?? "http://localhost:6011";

const PAGES = [
  { id: "html", url: `${SMOKE}/html/` },
  { id: "react", url: `${SMOKE}/react/` },
  { id: "vue", url: `${SMOKE}/vue/` },
  { id: "svelte", url: `${SMOKE}/svelte/` },
  { id: "angular", url: `${SMOKE}/angular/` },
  { id: "react18", url: `${SMOKE_18}/` },
] as const;

/**
 * Console output that means the integration is wrong even though the page
 * rendered. Vue's unresolved-component message is a warning, not an error, so
 * a page can look correct and still be telling every consumer's console that
 * the elements are not registered.
 */
function isIntegrationFailure(message: ConsoleMessage): boolean {
  const text = message.text();
  if (message.type() === "error") return true;
  return (
    /failed to resolve component/i.test(text) ||
    /is not a known element/i.test(text) ||
    /unknown custom element/i.test(text) ||
    /received .* for a non-boolean attribute/i.test(text) ||
    /invalid dom property/i.test(text)
  );
}

async function collectConsole(page: Page): Promise<string[]> {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (isIntegrationFailure(message)) problems.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

for (const { id, url } of PAGES) {
  test.describe(`@framework ${id}`, () => {
    test(`${id}: the elements upgrade, respond, and keep their a11y contract`, async ({ page }) => {
      const problems = await collectConsole(page);
      await page.goto(url);

      // A mis-wired route would otherwise let one page satisfy two rows.
      await expect(page.locator("#framework")).toHaveText(id);

      /* The element is defined and this instance was upgraded ------------- */
      const upgraded = await page.evaluate(() => {
        const element = document.querySelector("#loader");
        return {
          defined: Boolean(customElements.get("ox-pulse-loader")),
          hasShadow: Boolean(element?.shadowRoot),
          constructedByUs: element?.constructor.name.startsWith("Ox") ?? false,
        };
      });
      expect(upgraded, `${id}: <ox-pulse-loader> must upgrade`).toEqual({
        defined: true,
        hasShadow: true,
        constructedByUs: true,
      });

      /* The a11y contract survives the framework's rendering -------------- */
      const loader = page.locator("#loader");
      await expect(loader).toHaveAttribute("role", "status");
      await expect(loader).toHaveAttribute("aria-live", "polite");
      await expect(loader).toHaveAttribute("data-ox-loader", "pulse");

      // The art is inside a shadow root, so a plain locator cannot see it.
      const artNodes = await page.evaluate(
        () => document.querySelector("#loader")?.shadowRoot?.querySelectorAll("svg").length ?? 0,
      );
      expect(artNodes, `${id}: the loader must actually draw something`).toBeGreaterThan(0);

      const labelled = page.getByRole("status").filter({ hasText: "Loading patient record" });
      await expect(labelled.first()).toBeAttached();

      /* Framework state → attribute → element ----------------------------- */
      // The React 18 case: `open={false}` arrives as the string "false", and a
      // component reading attribute *presence* would stay open forever.
      await expect(loader).not.toHaveAttribute("hidden", /.*/);
      await page.locator("#toggle").click();
      await expect(loader).toHaveAttribute("hidden", "");
      await page.locator("#toggle").click();
      await expect(loader).not.toHaveAttribute("hidden", /.*/);

      /* A numeric binding, which frameworks stringify differently ---------- */
      const determinate = page.locator("#determinate");
      await expect(determinate).toHaveAttribute("role", "progressbar");
      await expect(determinate).toHaveAttribute("aria-valuenow", "0");
      await page.locator("#step").click();
      await expect(determinate).toHaveAttribute("aria-valuenow", "25");
      await expect(determinate).toHaveAttribute("aria-valuetext", "25 percent");

      /* Custom events reach the host application --------------------------- */
      // Asserted as a delta rather than an absolute count: frameworks attach
      // host listeners at different points relative to the element's first
      // connect, so whether the initial show is observed is a property of the
      // framework, not of the component.
      const before = Number(await page.locator("#events").innerText());
      await page.locator("#toggle").click();
      await expect
        .poll(async () => Number(await page.locator("#events").innerText()))
        .toBeGreaterThan(before);

      expect(problems, `${id}: console must be clean`).toEqual([]);
    });
  });
}
