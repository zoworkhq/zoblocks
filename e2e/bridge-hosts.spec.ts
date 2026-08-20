/**
 * The architectural claim, executed.
 *
 * Section 4 of the theming architecture says application code never names a UI
 * framework, so the same source renders under an Ant Design host, a Material UI
 * host, or neither, and only the styling differs. `apps/smoke-hosts` mounts
 * literally the same `<Application />` module in all three, so this test can ask
 * the only question that matters: **is the accessibility tree identical?**
 *
 * If a framework ever leaks into a component — a different role, a different
 * accessible name, a different focus order — the three trees stop agreeing and
 * this fails. Nothing else in the suite can see that: each page renders
 * perfectly on its own.
 *
 * The second half is the rule from ADR 0012. Both host themes deliberately set
 * their error colour to magenta. A bridge that mapped it onto
 * `--ox-status-critical` would replace a colour carrying a validated contrast
 * floor and a 60° hue separation with an arbitrary brand pink, and the page
 * would look fine.
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.OXYGEN_HOSTS_URL ?? "http://localhost:6012";

const HOSTS = [
  { id: "none", url: `${BASE}/none/` },
  { id: "antd", url: `${BASE}/antd/` },
  { id: "mui", url: `${BASE}/mui/` },
] as const;

/**
 * The accessibility tree, reduced to what a screen reader conveys.
 *
 * Deliberately not Playwright's full snapshot: that includes geometry, which
 * is *supposed* to differ between hosts. Roles, names and states are what must
 * not.
 */
async function tree(page: Page): Promise<string> {
  return page.evaluate(() => {
    const interesting = "h1,h2,button,[role='switch'],[role='status'],li,[aria-label]";
    return [...document.querySelectorAll(interesting)]
      .map((el) => {
        const role =
          el.getAttribute("role") ??
          { H1: "heading", H2: "heading", BUTTON: "button", LI: "listitem" }[el.tagName] ??
          el.tagName.toLowerCase();
        const name =
          el.getAttribute("aria-label") ??
          (el as HTMLElement).innerText?.trim().replace(/\s+/g, " ").slice(0, 80) ??
          "";
        const state = ["aria-checked", "aria-disabled", "aria-busy", "aria-current"]
          .map((a) => (el.hasAttribute(a) ? `${a}=${el.getAttribute(a)}` : ""))
          .filter(Boolean)
          .join(",");
        return `${role}|${name}|${state}`;
      })
      .join("\n");
  });
}

test.describe("@bridge the same application under three hosts", () => {
  test("renders an identical accessibility tree", async ({ page }) => {
    const trees: Record<string, string> = {};

    for (const { id, url } of HOSTS) {
      await page.goto(url);
      await expect(page.locator("#host")).toHaveText(id);
      await expect(page.getByRole("heading", { name: "Patient record" })).toBeVisible();
      trees[id] = await tree(page);
    }

    expect(trees.none, "the control must not be empty").not.toBe("");
    expect(trees.antd, "antd host differs from no host").toBe(trees.none);
    expect(trees.mui, "MUI host differs from no host").toBe(trees.none);
  });

  test("the third switch value survives every host", async ({ page }) => {
    // Neither antd's nor MUI's Switch can express it. A component-swapping
    // adapter would have had to drop it to be portable; a token bridge does
    // not touch the component at all.
    for (const { id, url } of HOSTS) {
      await page.goto(url);
      const directive = page.locator("#directive");
      await expect(directive, `${id}: the unknown state must render`).toBeVisible();
      await expect(
        page.getByText("Not asked", { exact: false }).first(),
        `${id}: the absence must say which kind of absence it is`,
      ).toBeVisible();
    }
  });

  test("keyboard operation is unchanged by a bridge", async ({ page }) => {
    for (const { id, url } of HOSTS) {
      await page.goto(url);
      const precautions = page.locator("#precautions");
      await precautions.focus();
      await expect(precautions, `${id}: focusable`).toBeFocused();

      const before = await precautions.getAttribute("aria-checked");
      await page.keyboard.press("Space");
      await expect
        .poll(() => precautions.getAttribute("aria-checked"), {
          message: `${id}: Space must toggle`,
        })
        .not.toBe(before);
    }
  });
});

test.describe("@bridge clinical colour is never a host's to set", () => {
  /**
   * Both hosts set their error colour to magenta. Oxygen's critical red must
   * be unmoved in both — it holds a validated 4.5:1 floor against its own
   * background and 60° of hue separation from `status.low`, and a brand colour
   * carries neither.
   */
  test("a host's error colour does not reach status.critical", async ({ page }) => {
    const read = async (url: string) => {
      await page.goto(url);
      return page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const bridge = document.querySelector("[data-ox-bridge]");
        const scoped = bridge ? getComputedStyle(bridge) : root;
        return {
          critical: scoped.getPropertyValue("--ox-status-critical").trim(),
          high: scoped.getPropertyValue("--ox-status-high").trim(),
          low: scoped.getPropertyValue("--ox-status-low").trim(),
          // Chrome, which the host *is* allowed to set.
          accent: scoped.getPropertyValue("--ox-accent").trim(),
        };
      });
    };

    const none = await read(`${BASE}/none/`);
    const antd = await read(`${BASE}/antd/`);
    const mui = await read(`${BASE}/mui/`);

    for (const [id, host] of [
      ["antd", antd],
      ["mui", mui],
    ] as const) {
      expect(host.critical, `${id}: critical must be Oxygen's`).toBe(none.critical);
      expect(host.high, `${id}: high must be Oxygen's`).toBe(none.high);
      expect(host.low, `${id}: low must be Oxygen's`).toBe(none.low);
      expect(
        host.critical.toLowerCase(),
        `${id}: the host's magenta must not appear`,
      ).not.toContain("ff00ff");
    }

    // ...while the chrome the host *is* entitled to set has actually changed,
    // so a passing test cannot mean "the bridge did nothing".
    expect(antd.accent, "antd must have themed the accent").not.toBe(none.accent);
    expect(mui.accent, "MUI must have themed the accent").not.toBe(none.accent);
  });

  test("each bridge marks the subtree it owns", async ({ page }) => {
    await page.goto(`${BASE}/antd/`);
    await expect(page.locator("[data-ox-bridge='antd']")).toBeAttached();

    await page.goto(`${BASE}/mui/`);
    await expect(page.locator("[data-ox-bridge='mui']")).toBeAttached();

    await page.goto(`${BASE}/none/`);
    await expect(page.locator("[data-ox-bridge]")).toHaveCount(0);
  });
});
