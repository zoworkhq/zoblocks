/**
 * The helpers a bridge is built from.
 *
 * Small enough to look obviously correct and load-bearing enough that being
 * wrong is invisible: a target floor that does not clamp lets a host shrink a
 * clinical control below WCAG 2.5.5, and a radius pair that is not concentric
 * looks subtly wrong at every size.
 */

import { describe, expect, it } from "vitest";
import { MIN_TARGET_PX, compact, concentric, targetFloor } from "../src/index";

describe("targetFloor", () => {
  it("clamps rather than copies, so a small host control cannot shrink ours", () => {
    expect(targetFloor(24)).toBe("max(44px, 24px)");
  });

  it("lets a larger host value win", () => {
    // `max` is doing the work at render time; what matters is that the
    // expression keeps the host's value rather than discarding it.
    expect(targetFloor(56)).toContain("56px");
  });

  it("accepts a string a framework already formatted", () => {
    expect(targetFloor("2.5rem")).toBe("max(44px, 2.5rem)");
  });

  it("uses the WCAG 2.5.5 minimum", () => {
    expect(MIN_TARGET_PX).toBe(44);
  });
});

describe("concentric", () => {
  it("makes the inner corner the outer corner minus the inset", () => {
    expect(concentric(8, 4)).toEqual({ outer: "12px", inner: "8px" });
  });

  it("keeps them different — a shared radius is the bug this exists to prevent", () => {
    const { outer, inner } = concentric(12, 4);
    expect(outer).not.toBe(inner);
  });

  it("handles a zero radius without producing a negative", () => {
    expect(concentric(0, 4)).toEqual({ outer: "4px", inner: "0px" });
  });
});

describe("compact", () => {
  /**
   * The partial-mapping rule, mechanically. An unmapped token must be *absent*
   * so the stylesheet's own fallback chain wins; leaving it as `undefined`
   * would still spread onto the element and blank the property.
   */
  it("drops undefined so the CSS fallback wins", () => {
    expect(compact({ "--zb-accent": "#059478", "--zb-text": undefined })).toEqual({
      "--zb-accent": "#059478",
    });
  });

  it("drops empty strings, which a framework can hand back for an unset value", () => {
    expect(compact({ "--zb-accent": "" })).toEqual({});
  });

  it("keeps a legitimate zero", () => {
    expect(compact({ "--zb-duration": 0 })).toEqual({ "--zb-duration": 0 });
  });
});
