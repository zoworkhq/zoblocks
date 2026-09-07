/**
 * The two delivery channels must draw the same loader.
 *
 * Zoblocks ships each loader twice: as React source copied into a customer's repo
 * by the Zoblocks CLI, and as a custom element on npm for every other framework.
 * The React file has to be self-contained — it is copied verbatim, so it cannot
 * import from a workspace package — which means the geometry genuinely exists
 * in two places.
 *
 * Two copies of anything drift. This is the test that makes drift a build
 * failure instead of a support ticket, and it earned its place immediately: it
 * caught a mistyped control point in the rhythm strip on the first run, a
 * difference invisible in review and barely visible on screen.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  LOADER_ART as REGISTRY_ART,
  LOADER_SIZE_PX as REGISTRY_SIZES,
  LOADER_VIEWBOX as REGISTRY_VIEWBOX,
  DEFAULT_SLOW_HINT as REGISTRY_SLOW_HINT,
  beatMs as registryBeatMs,
  cycleMs as registryCycleMs,
  strokePx as registryStrokePx,
  clamp as registryClamp,
} from "../registry/zoblocks/lib/loader";

import {
  LOADER_ART as PACKAGE_ART,
  LOADER_SIZE_PX as PACKAGE_SIZES,
  LOADER_VIEWBOX as PACKAGE_VIEWBOX,
  DEFAULT_SLOW_HINT as PACKAGE_SLOW_HINT,
  HELIX_COLUMNS,
  INFUSION,
  PULSE_MIN_SIZE_PX as PACKAGE_PULSE_MIN,
} from "../packages/loaders/src/art";

import {
  beatMs as packageBeatMs,
  cycleMs as packageCycleMs,
  strokePx as packageStrokePx,
  clamp as packageClamp,
} from "../packages/loaders/src/base";

import { PULSE_MIN_SIZE_PX as REGISTRY_PULSE_MIN } from "../registry/zoblocks/pulse-loader/pulse-loader";
import { slugWidth as registrySlugWidth } from "../registry/zoblocks/infusion-loader/infusion-loader";
import { slugWidth as packageSlugWidth } from "../packages/loaders/src/infusion";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => readFileSync(path.join(ROOT, relative), "utf8");

describe("art parity between the registry and the npm package", () => {
  it("declares the same set of paths", () => {
    expect(Object.keys(PACKAGE_ART).sort()).toEqual(Object.keys(REGISTRY_ART).sort());
  });

  it.each(Object.keys(REGISTRY_ART) as Array<keyof typeof REGISTRY_ART>)(
    "draws an identical %s path",
    (key) => {
      expect(PACKAGE_ART[key]).toBe(REGISTRY_ART[key]);
    },
  );

  it("uses the same viewBoxes", () => {
    expect(PACKAGE_VIEWBOX).toEqual(REGISTRY_VIEWBOX);
  });

  it("uses the same size steps", () => {
    expect(PACKAGE_SIZES).toEqual(REGISTRY_SIZES);
  });

  it("agrees on where the pulse stops being legible", () => {
    expect(PACKAGE_PULSE_MIN).toBe(REGISTRY_PULSE_MIN);
  });

  it("says the same thing when a wait stalls", () => {
    // Two channels inventing their own wording is how a product ends up
    // apologising in one place and explaining in another.
    expect(PACKAGE_SLOW_HINT).toBe(REGISTRY_SLOW_HINT);
  });
});

describe("timing parity", () => {
  it.each([40, 52, 60, 72, 100, 180, 0, Number.NaN])("converts %s bpm identically", (bpm) => {
    expect(packageBeatMs(bpm, 1)).toBe(registryBeatMs(bpm, 1));
  });

  it.each([0.25, 0.5, 1, 1.5, 2, 8])("scales a cycle at speed %s identically", (speed) => {
    expect(packageCycleMs(4000, speed)).toBe(registryCycleMs(4000, speed));
  });

  it.each([12, 20, 27, 28, 56, 88, 200])("picks the same stroke at %spx", (size) => {
    expect(packageStrokePx(size)).toBe(registryStrokePx(size));
  });

  it.each([
    [-5, 0, 100],
    [50, 0, 100],
    [420, 0, 100],
    [Number.NaN, 0, 100],
  ])("clamps %s to the same value", (value, min, max) => {
    expect(packageClamp(value, min, max)).toBe(registryClamp(value, min, max));
  });

  it("falls back to speed when no bpm is given, in both channels", () => {
    expect(packageBeatMs(undefined, 2)).toBe(registryBeatMs(undefined, 2));
    expect(packageBeatMs(undefined, 0.5)).toBe(registryBeatMs(undefined, 0.5));
  });
});

describe("infusion geometry parity", () => {
  it.each([0, 1, 25, 42, 50, 99, 100, -20, 140])("fills to the same width at %s%%", (percent) => {
    expect(packageSlugWidth(percent)).toBeCloseTo(registrySlugWidth(percent), 10);
  });

  it("never renders an empty slug in either channel", () => {
    expect(packageSlugWidth(0)).toBe(INFUSION.slugMin);
    expect(registrySlugWidth(0)).toBe(INFUSION.slugMin);
    expect(INFUSION.slugMin).toBeGreaterThan(0);
  });
});

describe("stylesheet parity", () => {
  const registryCss = read("registry/zoblocks/lib/loader.css");
  const packageCss = read("packages/loaders/src/css.ts");

  /** Every `@keyframes name` declared in a stylesheet. */
  function keyframes(css: string): string[] {
    return [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]!).sort();
  }

  it("declares the same animations in both channels", () => {
    // The two stylesheets are necessarily different — one uses :host, the other
    // class selectors — but a loader that animates in React and not in Vue is
    // the exact failure this catches.
    expect(keyframes(packageCss)).toEqual(keyframes(registryCss));
  });

  it("keeps the six numbers that govern the calm in step", () => {
    for (const css of [registryCss, packageCss]) {
      expect(css).toContain("scale(1.07)"); // beat amplitude
      expect(css).toContain("scale(1.18)"); // breath core
      expect(css).toContain("700ms"); // draw-in
      expect(css).toContain("2400ms"); // reduced-motion breath
      expect(css).toContain("translateX(88px)"); // infusion drift
      expect(css).toContain("0.22"); // track strength
    }
  });

  it("handles reduced motion in both channels", () => {
    for (const css of [registryCss, packageCss]) {
      expect(css).toContain("prefers-reduced-motion: reduce");
      expect(css).toContain("forced-colors: active");
      expect(css).toContain("zb-loader-still");
    }
  });

  it("references no primitive palette token in either channel", () => {
    // Semantic tokens only, so a brand override actually reaches the loaders.
    for (const css of [registryCss, packageCss]) {
      expect(css).not.toMatch(/--zb-ref-/);
      expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });
});

describe("the registry component stays self-contained", () => {
  const files = [
    "registry/zoblocks/lib/loader.tsx",
    "registry/zoblocks/pulse-loader/pulse-loader.tsx",
    "registry/zoblocks/rhythm-loader/rhythm-loader.tsx",
    "registry/zoblocks/breath-loader/breath-loader.tsx",
    "registry/zoblocks/helix-loader/helix-loader.tsx",
    "registry/zoblocks/infusion-loader/infusion-loader.tsx",
  ];

  it.each(files)("%s imports nothing from the workspace", (file) => {
    // These files are copied verbatim into a customer's project. A workspace
    // import compiles here and fails there, which is the worst possible place
    // for it to fail.
    const source = read(file);
    expect(source).not.toMatch(/from\s+["']@zoblocks\//);
    expect(source).not.toMatch(/from\s+["']\.\.\/\.\.\//);
  });

  it.each(files)("%s reaches for no capability a customer's security review would flag", (file) => {
    const source = read(file);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/process\.env/);
    expect(source).not.toMatch(/dangerouslySetInnerHTML/);
    expect(source).not.toMatch(/\bconsole\./);
    expect(source).not.toMatch(/\beval\s*\(/);
  });
});

describe("helix geometry", () => {
  it("uses the same column count in both channels", () => {
    const source = read("registry/zoblocks/helix-loader/helix-loader.tsx");
    expect(source).toContain(`const COLUMNS = ${HELIX_COLUMNS}`);
  });
});
