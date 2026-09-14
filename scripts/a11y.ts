/**
 * Accessibility audit.
 *
 * The site tells visitors that WCAG 2.2 AA is the bar and lists per-component
 * accessibility notes. Those were originally written from how the components
 * were built, not from test results — this makes the claim checkable, and the
 * first run found four real violations including a contrast failure on the
 * footer's own legal limitation statement.
 *
 * Both themes are audited: a token that passes on paper can fail on the dark
 * page, and the dark theme is a first-class surface here.
 *
 * Automated testing catches roughly a third of WCAG issues. This is a floor,
 * not a certificate — keyboard and screen-reader passes stay manual.
 *
 * Usage: pnpm a11y [baseUrl]
 */

import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { isDocumented } from "@zoblocks/component-meta";
import { CATALOG } from "../apps/docs/src/lib/generated/catalog";

const requireFrom = createRequire(process.cwd() + "/");
const AXE_SOURCE = readFileSync(requireFrom.resolve("axe-core/axe.min.js"), "utf8");

const BASE = process.argv[2] ?? "http://localhost:6001";

/**
 * Every static page, plus one detail page per documented component in the
 * generated catalog. The component list used to be written out by hand here,
 * which meant a new component was audited only if someone remembered to add
 * it. Deriving it from `pnpm gen` output keeps the audit and the catalog the
 * same list.
 *
 * Documented only: the route 404s for anything else. Until 14 Sept this took
 * the whole catalog, so 15 of its pages were the not-found page, and each one
 * "passed" by auditing a 404 instead of the component.
 */
const PAGES = [
  "/",
  "/components",
  "/install",
  "/pro",
  "/enterprise",
  "/compare",
  "/showcase",
  "/marketplace",
  ...CATALOG.filter((component) => isDocumented(component.name)).map(
    (component) => `/components/${component.name}`,
  ),
];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function main() {
  const browser = await chromium.launch();

  let failures = 0;

  // Three, not two. `high-contrast` was emitted by the token build and audited
  // by nothing, which is the worst combination: a mode we advertise, hold to a
  // 7:1 floor, and had no evidence for.
  for (const theme of ["light", "dark", "high-contrast"] as const) {
    /*
     * One page per theme, not one page for the whole run.
     *
     * `addInitScript` is cumulative and it used to be called inside the inner
     * loop, so by the second theme every navigation carried thirty copies of
     * the same script and by the third, sixty. The first page of the dark pass
     * stopped reaching `networkidle` inside thirty seconds and the run failed
     * on `/` — a timeout that looked like a slow home page and was actually the
     * harness loading itself.
     *
     * Setting it before the first navigation is still required: the no-flash
     * head script has to see the value during first paint. Toggling after load
     * leaves translucent surfaces composited against the previous theme and
     * produces phantom contrast failures a real visitor would never see.
     */
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript((t) => {
      try {
        localStorage.setItem("zoblocks-theme", t);
      } catch {}
    }, theme);

    for (const path of PAGES) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      await page.addScriptTag({ content: AXE_SOURCE });

      await page.evaluate(() => {
        // Reveal-on-scroll content is invisible to a viewport-height audit.
        document
          .querySelectorAll("[data-reveal]")
          .forEach((el) => el.setAttribute("data-revealed", "true"));
      });

      /*
       * Settle every running animation before measuring contrast.
       *
       * axe computes a contrast ratio from what is composited, so an element
       * caught mid-fade reports its blended colour: the Pro page's entrance
       * animation made a 5.1:1 label read as 2.29:1 and failed the run for a
       * state no visitor is ever shown. Finishing the animations audits the
       * page a reader actually sees — the opposite of relaxing the check,
       * because a genuinely low-contrast element still fails afterwards.
       */
      await page.evaluate(async () => {
        for (const animation of document.getAnimations()) {
          try {
            animation.finish();
          } catch {
            // An infinite animation cannot finish. Pausing it is the honest
            // equivalent: it settles at a frame the reader really sees.
            animation.pause();
          }
        }
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      });

      const result = await page.evaluate(
        async (tags) =>
          (window as any).axe.run(document, { runOnly: { type: "tag", values: tags } }),
        TAGS,
      );

      if (result.violations.length) {
        failures += result.violations.length;
        console.error(`\n✗ ${theme} ${path}`);
        for (const v of result.violations) {
          console.error(`  [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`);
          console.error(`    ${v.nodes[0]?.html?.slice(0, 120)}`);
          const d: any = v.nodes[0]?.any?.[0]?.data;
          if (d?.contrastRatio) {
            console.error(
              `    fg ${d.fgColor} on bg ${d.bgColor} = ${d.contrastRatio}:1 (need ${d.expectedContrastRatio})`,
            );
          }
        }
      } else {
        console.log(`✓ ${theme.padEnd(5)} ${path}  (${result.passes.length} checks passed)`);
      }
    }

    await page.close();
  }

  await browser.close();

  if (failures > 0) {
    console.error(`\n✗ ${failures} accessibility violation(s)`);
    process.exit(1);
  }
  console.log(`\n✓ no WCAG 2.2 AA violations across ${PAGES.length} pages × 3 themes`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
