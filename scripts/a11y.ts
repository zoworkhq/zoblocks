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

const requireFrom = createRequire(process.cwd() + "/");
const AXE_SOURCE = readFileSync(requireFrom.resolve("axe-core/axe.min.js"), "utf8");

const BASE = process.argv[2] ?? "http://localhost:6001";
const PAGES = [
  "/",
  "/components",
  "/pro",
  "/showcase",
  "/components/vitals-panel",
  "/components/patient-banner",
  "/components/coverage-card",
  "/components/status-badge",
  "/components/absent-value",
  "/components/clinical-value",
  "/components/reference-range",
  "/components/clinical-time",
  "/components/identity-token",
  "/components/concept-chip",
  "/components/density-provider",
  "/components/restricted-shield",
  "/components/action-gate",
  "/components/empty-state",
  "/components/clinical-skeleton",
  "/components/dose-input",
  "/components/provenance",
  "/components/unsaved-guard",
  "/components/error-boundary",
  "/components/app-shell",
  "/components/code-status",
  "/components/precautions-bar",
  "/components/care-team",
  "/components/alert-banner",
  "/components/patient-snapshot",
];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function main() {
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

let failures = 0;

for (const theme of ["light", "dark"] as const) {
  for (const path of PAGES) {
    // Set the preference BEFORE navigating so the no-flash head script applies
    // it during first paint. Toggling after load leaves translucent surfaces
    // composited against the previous theme and produces phantom contrast
    // failures that a real visitor would never see.
    await page.addInitScript((t) => {
      try { localStorage.setItem("oxygen-theme", t); } catch {}
    }, theme);

    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: AXE_SOURCE });

    await page.evaluate(() => {
      // Reveal-on-scroll content is invisible to a viewport-height audit.
      document.querySelectorAll("[data-reveal]").forEach((el) =>
        el.setAttribute("data-revealed", "true"),
      );
    });

    const result = await page.evaluate(
      async (tags) => (window as any).axe.run(document, { runOnly: { type: "tag", values: tags } }),
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
          console.error(`    fg ${d.fgColor} on bg ${d.bgColor} = ${d.contrastRatio}:1 (need ${d.expectedContrastRatio})`);
        }
      }
    } else {
      console.log(`✓ ${theme.padEnd(5)} ${path}  (${result.passes.length} checks passed)`);
    }
  }
}

await browser.close();

if (failures > 0) {
  console.error(`\n✗ ${failures} accessibility violation(s)`);
  process.exit(1);
}
console.log(`\n✓ no WCAG 2.2 AA violations across ${PAGES.length} pages × 2 themes`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
