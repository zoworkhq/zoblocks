/**
 * The high-contrast theme is reachable, and audited.
 *
 * It was neither. `packages/tokens` has emitted 59 high-contrast values held to
 * a 7:1 floor since the pipeline landed, selected by
 * `[data-ox-theme="high-contrast"]` — an attribute nothing in the repository
 * ever set. A mode we advertise, hold to AAA, and had no evidence for is worse
 * than one we do not ship: the token gate reported it green while no page could
 * turn it on and `scripts/a11y.ts` iterated two themes.
 *
 * These assertions are cheap and they are the ones that would have caught it.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");

const SELECTOR = '[data-ox-theme="high-contrast"]';

describe("the token build emits it", () => {
  it("declares a high-contrast block", () => {
    expect(read("packages/tokens/src/oxygen-tokens.css")).toContain(`${SELECTOR} {`);
  });

  it("gives it the same key space as light, per the parity gate", () => {
    const tokens = JSON.parse(read("packages/tokens/src/tokens.json")) as {
      themes: Record<string, Record<string, string>>;
    };
    expect(Object.keys(tokens.themes["high-contrast"] ?? {}).sort()).toEqual(
      Object.keys(tokens.themes.light ?? {}).sort(),
    );
  });

  it("holds it to 7:1 rather than 4.5:1", () => {
    const readings = JSON.parse(read("packages/tokens/src/contrast.json")) as {
      theme: string;
      ratio: number;
      floor: number;
      token: string;
    }[];
    const hc = readings.filter((r) => r.theme === "high-contrast");
    expect(hc.length).toBeGreaterThan(20);
    expect(hc.some((r) => r.floor === 7)).toBe(true);
    for (const r of hc) expect(r.ratio, r.token).toBeGreaterThanOrEqual(r.floor);
  });
});

describe("a page can select it", () => {
  it("is an option in the theme toggle", () => {
    const toggle = read("apps/docs/src/components/site/theme-toggle.tsx");
    expect(toggle).toContain('value: "high-contrast"');
    expect(toggle).toContain('setAttribute("data-ox-theme", "high-contrast")');
  });

  /**
   * High contrast is a third theme, not a modifier: layering it over `.dark`
   * would give a reader two half-applied palettes.
   */
  it("clears the dark class rather than combining with it", () => {
    const toggle = read("apps/docs/src/components/site/theme-toggle.tsx");
    const branch = toggle.slice(toggle.indexOf('if (theme === "high-contrast")'));
    expect(branch.slice(0, 200)).toContain('classList.remove("dark")');
  });

  it("is applied before first paint, like the other themes", () => {
    // A deferred application paints light and snaps, which for a reader who
    // needs high contrast is the flash that matters most.
    expect(read("apps/docs/src/app/layout.tsx")).toContain("high-contrast");
  });

  it("removes the attribute when another theme is chosen", () => {
    expect(read("apps/docs/src/components/site/theme-toggle.tsx")).toContain(
      'removeAttribute("data-ox-theme")',
    );
  });
});

describe("the page chrome follows it", () => {
  /**
   * Without its own site palette the page keeps the ordinary paper ground
   * while the components go high-contrast, which is a mismatch rather than a
   * mode — and it fails contrast in places neither palette fails alone.
   */
  it("has a high-contrast site palette", () => {
    const css = read("apps/docs/src/app/globals.css");
    expect(css).toContain(`${SELECTOR} {`);
  });

  it("defines every site token the light palette defines", () => {
    const css = read("apps/docs/src/app/globals.css");
    const block = (start: string) => {
      const from = css.indexOf(start);
      const body = css.slice(from, css.indexOf("\n}", from));
      return new Set([...body.matchAll(/(--site-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    };
    const light = block(":root {");
    const hc = block(`${SELECTOR} {`);
    expect([...light].filter((t) => !hc.has(t as string))).toEqual([]);
  });
});

describe("the audit covers it", () => {
  it("iterates three themes, not two", () => {
    const a11y = read("scripts/a11y.ts");
    expect(a11y).toContain('["light", "dark", "high-contrast"] as const');
  });

  it("says three in what it prints, so a green run is not misread", () => {
    expect(read("scripts/a11y.ts")).toContain("× 3 themes");
  });
});
