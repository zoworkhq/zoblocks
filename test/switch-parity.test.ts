/**
 * The Switch ships twice: as registry source a customer copies, and as a
 * custom element for pages that are not React. Two implementations of one
 * clinical control is exactly the shape that drifts, and the drift is silent —
 * a word changes in one channel, a customer reads "Not asked" in React and
 * "Unknown" in Vue, and nothing fails.
 *
 * This is the same discipline `loader-parity.test.ts` applies to the loader
 * art, which has already caught two divergences. It asserts the parts that
 * MUST be identical, and deliberately not the parts that are allowed to differ
 * — the element's stylesheet is shadow-scoped and the React one is not, so
 * their selectors are different by design.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ABSENT_REASON_LABEL as REGISTRY_ABSENT,
  STATE_LABEL_PRESETS as REGISTRY_PRESETS,
  SWITCH_SIZE as REGISTRY_SIZE,
  nextValueFor as registryNext,
} from "../registry/zoblocks/lib/switch";
import {
  ABSENT_REASON_LABEL as ELEMENT_ABSENT,
  COMMIT_PHASES,
  STATE_LABEL_PRESETS as ELEMENT_PRESETS,
  SWITCH_SIZE as ELEMENT_SIZE,
  nextValueFor as elementNext,
} from "../packages/elements/src/vocabulary";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => readFileSync(path.join(ROOT, relative), "utf8");

describe("the two channels share one vocabulary", () => {
  it("labels every absence with the same word", () => {
    expect(ELEMENT_ABSENT).toEqual(REGISTRY_ABSENT);
  });

  it("covers the same absence taxonomy", () => {
    expect(Object.keys(ELEMENT_ABSENT).sort()).toEqual(Object.keys(REGISTRY_ABSENT).sort());
  });

  it("offers the same state-label presets, with the same words", () => {
    expect(ELEMENT_PRESETS).toEqual(REGISTRY_PRESETS);
  });

  it("uses the same geometry table", () => {
    expect(ELEMENT_SIZE).toEqual(REGISTRY_SIZE);
  });

  /**
   * The rule that a user may leave "unknown" but never enter it has to hold in
   * both channels, or the React app and the Vue app disagree about whether a
   * question can be un-asked.
   */
  it("agrees that activation never returns to unknown", () => {
    expect(registryNext("unknown")).toBe(true);
    expect(elementNext("unknown")).toBe("on");
    expect(registryNext(true)).toBe(false);
    expect(elementNext("on")).toBe("off");
    expect(registryNext(false)).toBe(true);
    expect(elementNext("off")).toBe("on");
  });

  it("names the same seven commit phases", () => {
    const registrySource = read("registry/zoblocks/lib/switch.tsx");
    for (const phase of COMMIT_PHASES) {
      expect(registrySource, `registry source does not name the "${phase}" phase`).toContain(
        `"${phase}"`,
      );
    }
    expect(COMMIT_PHASES).toHaveLength(7);
  });
});

describe("the two stylesheets share their load-bearing behaviour", () => {
  const registryCss = read("registry/zoblocks/lib/switch.css");
  const elementCss = read("packages/elements/src/switch-css.ts");

  it("defines the same keyframes", () => {
    const names = (css: string) =>
      [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]!).sort();
    expect(names(elementCss)).toEqual(names(registryCss));
  });

  it("decouples the hit area from the pill in both", () => {
    // The claim that a 26x14px switch keeps a full-size target rests entirely
    // on this one expression. If either channel loses it, dense tables quietly
    // stop meeting SC 2.5.8.
    for (const [name, css] of [
      ["registry", registryCss],
      ["element", elementCss],
    ] as const) {
      expect(css, name).toMatch(/inline-size:\s*max\(/);
      expect(css, name).toMatch(/block-size:\s*max\(/);
    }
  });

  it("centres the thumb for the unknown state in both", () => {
    for (const [name, css] of [
      ["registry", registryCss],
      ["element", elementCss],
    ] as const) {
      expect(css, name).toContain("translate: -50% -50%");
    }
  });

  it("designs a reduced-motion state rather than freezing one", () => {
    for (const [name, css] of [
      ["registry", registryCss],
      ["element", elementCss],
    ] as const) {
      expect(css, name).toContain("prefers-reduced-motion");
      expect(css, name).toContain("animation: none");
      expect(css, name).toContain("transition-duration: 1ms");
    }
  });

  it("survives forced colours in both", () => {
    for (const [name, css] of [
      ["registry", registryCss],
      ["element", elementCss],
    ] as const) {
      expect(css, name).toContain("forced-colors: active");
      expect(css, name).toContain("Highlight");
      expect(css, name).toContain("CanvasText");
    }
  });

  it("uses logical properties for thumb travel in both", () => {
    // `left`/`right` do not flip in RTL, and the bug is invisible until
    // somebody opens the interface in Arabic.
    for (const [name, css] of [
      ["registry", registryCss],
      ["element", elementCss],
    ] as const) {
      expect(css, name).toContain("inset-inline-start");
      expect(css, name).not.toMatch(/^\s*left:/m);
      expect(css, name).not.toMatch(/^\s*right:/m);
    }
  });
});
