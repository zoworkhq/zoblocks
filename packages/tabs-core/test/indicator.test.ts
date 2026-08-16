import { describe, expect, it } from "vitest";
import {
  geometryChanged,
  indicatorAxis,
  indicatorGeometry,
  indicatorStyle,
  resolveIndicator,
  scrollIntoViewDelta,
} from "../src/index.js";

describe("indicatorGeometry", () => {
  it("maps offsets straight through", () => {
    expect(
      indicatorGeometry({ offsetLeft: 12, offsetTop: 4, offsetWidth: 120, offsetHeight: 36 }),
    ).toEqual({ x: 12, y: 4, width: 120, height: 36 });
  });

  it("emits the four custom properties the stylesheet consumes", () => {
    expect(indicatorStyle({ x: 12, y: 4, width: 120, height: 36 })).toEqual({
      "--ox-tabs-ind-x": "12px",
      "--ox-tabs-ind-y": "4px",
      "--ox-tabs-ind-w": "120px",
      "--ox-tabs-ind-h": "36px",
    });
  });
});

describe("resolveIndicator", () => {
  it("gives segmented and command a thumb", () => {
    expect(resolveIndicator("auto", "segmented")).toBe("thumb");
    expect(resolveIndicator("auto", "command")).toBe("thumb");
  });

  it("gives underline and rail a line", () => {
    expect(resolveIndicator("auto", "underline")).toBe("line");
    expect(resolveIndicator("auto", "rail")).toBe("line");
  });

  it("gives wrapping and self-coloured variants nothing to animate", () => {
    // No continuous path across a line break, and card/stat/ghost already
    // carry selection in their own background.
    for (const variant of ["pill", "card", "stat", "ghost", "stepper", "enclosed"] as const) {
      expect(resolveIndicator("auto", variant)).toBe("none");
    }
  });

  it("respects an explicit choice over the variant default", () => {
    expect(resolveIndicator("line", "segmented")).toBe("line");
    expect(resolveIndicator("none", "underline")).toBe("none");
    expect(resolveIndicator("thumb", "pill")).toBe("thumb");
  });
});

describe("geometryChanged", () => {
  const base = { x: 10, y: 0, width: 100, height: 32 };

  it("is true on first measurement", () => {
    expect(geometryChanged(null, base)).toBe(true);
  });

  it("ignores sub-pixel jitter rather than rewriting properties every frame", () => {
    expect(geometryChanged(base, { ...base, x: 10.3 })).toBe(false);
  });

  it("notices a real move on any axis", () => {
    expect(geometryChanged(base, { ...base, x: 40 })).toBe(true);
    expect(geometryChanged(base, { ...base, y: 40 })).toBe(true);
    expect(geometryChanged(base, { ...base, width: 140 })).toBe(true);
    expect(geometryChanged(base, { ...base, height: 40 })).toBe(true);
  });
});

describe("scrollIntoViewDelta", () => {
  it("is zero when the trigger is comfortably in view", () => {
    expect(scrollIntoViewDelta(100, 80, 0, 400)).toBe(0);
  });

  it("scrolls back just enough when the trigger is before the viewport", () => {
    // `nearest`, not `center`: centring re-centres the strip on every keypress.
    expect(scrollIntoViewDelta(10, 80, 100, 400)).toBe(-114);
  });

  it("scrolls forward just enough when the trigger is past the viewport", () => {
    expect(scrollIntoViewDelta(500, 80, 0, 400)).toBe(204);
  });

  it("respects a custom padding", () => {
    expect(scrollIntoViewDelta(500, 80, 0, 400, 0)).toBe(180);
  });
});

describe("indicatorAxis", () => {
  it("moves in block flow when vertical and inline otherwise", () => {
    expect(indicatorAxis("vertical")).toBe("block");
    expect(indicatorAxis("horizontal")).toBe("inline");
  });
});
