/**
 * The mapping, asserted as a mapping.
 *
 * Not a screenshot. A screenshot proves the strip is teal and says nothing
 * about *why*; the failure this catches is `colorPrimary` landing on the
 * border instead of the accent, which looks plausible in a picture and is
 * obvious in an assertion.
 */

import { describe, expect, it } from "vitest";
import { resolvePatch, verifyPatch } from "@oxygenui-design/bridge-core";
import { NOT_BRIDGEABLE } from "@oxygenui-design/tokens/surface";
import { antdBridge, type AntdTokens } from "../src/map";

const patch = (token: AntdTokens) => resolvePatch(antdBridge, token);

describe("identity of the mapping", () => {
  it("puts colorPrimary on the accent, and not on something adjacent", () => {
    const out = patch({ colorPrimary: "#7c3aed" });
    expect(out["--ox-accent"]).toBe("#7c3aed");
    expect(out["--ox-focus-ring"]).toBe("#7c3aed");
    expect(out["--ox-border"]).toBeUndefined();
    expect(out["--ox-text"]).toBeUndefined();
  });

  it("maps the text ramp in the right order of emphasis", () => {
    const out = patch({
      colorText: "#111111",
      colorTextSecondary: "#555555",
      colorTextTertiary: "#888888",
    });
    expect(out["--ox-text"]).toBe("#111111");
    expect(out["--ox-text-muted"]).toBe("#555555");
    expect(out["--ox-text-subtle"]).toBe("#888888");
  });

  it("distinguishes the container surface from the page ground", () => {
    const out = patch({ colorBgContainer: "#ffffff", colorBgLayout: "#f5f5f5" });
    expect(out["--ox-surface"]).toBe("#ffffff");
    expect(out["--ox-bg"]).toBe("#f5f5f5");
  });

  it("converts antd's numeric radii to CSS lengths", () => {
    const out = patch({ borderRadius: 8, borderRadiusLG: 12, borderRadiusSM: 4 });
    expect(out["--ox-radius"]).toBe("8px");
    expect(out["--ox-radius-lg"]).toBe("12px");
    expect(out["--ox-radius-sm"]).toBe("4px");
  });

  it("carries motion through as the host declared it", () => {
    const out = patch({ motionDurationMid: "0.2s", motionEaseInOut: "ease-in-out" });
    expect(out["--ox-duration"]).toBe("0.2s");
    expect(out["--ox-ease"]).toBe("ease-in-out");
  });
});

describe("the partial-mapping rule", () => {
  /**
   * An unmapped token must be *absent*, not `undefined`. A key present with an
   * undefined value still spreads onto the element and blanks the property,
   * which defeats the fallback chain the stylesheet relies on.
   */
  it("omits keys entirely rather than writing undefined", () => {
    const out = patch({ colorPrimary: "#7c3aed" });
    expect(Object.keys(out)).not.toContain("--ox-text");
    expect("--ox-text" in out).toBe(false);
  });

  it("writes nothing at all for an empty theme", () => {
    expect(patch({})).toEqual({});
  });

  it("declares what it cannot express instead of guessing", () => {
    expect(antdBridge.unmapped).toContain("--ox-status-critical");
    expect(antdBridge.unmapped).toContain("--ox-status-low");
    expect(antdBridge.unmapped).toContain("--ox-text-on-accent");
  });
});

describe("clinical status is never mapped", () => {
  /**
   * The rule the whole architecture rests on. A host's `colorError` is an
   * arbitrary brand red; ours holds a validated contrast floor and a 60° hue
   * separation from `status.low` so the direction of an abnormal result
   * survives colour-vision deficiency. antd has no notion of direction, so
   * there is not even a wrong answer available for `status.low`.
   */
  it("writes no clinical token, given a theme that defines every status colour", () => {
    const out = patch({
      colorPrimary: "#1677ff",
      colorError: "#ff4d4f",
      colorWarning: "#faad14",
      colorSuccess: "#52c41a",
    } as AntdTokens);

    const forbidden = new Set<string>(NOT_BRIDGEABLE);
    expect(Object.keys(out).filter((k) => forbidden.has(k))).toEqual([]);
  });

  it("passes bridge-core's own verification", () => {
    const result = verifyPatch(
      patch({
        colorPrimary: "#1677ff",
        colorText: "#000000",
        colorBgContainer: "#ffffff",
        borderRadius: 6,
        controlHeight: 32,
      }),
    );
    expect(result.clinical).toEqual([]);
    expect(result.unknown).toEqual([]);
    expect(result.ok).toBe(true);
  });
});

describe("derived geometry", () => {
  /**
   * The reason `components` exists in the contract at all: a track radius is
   * the thumb's plus the inset, and CSS cannot express that over a value the
   * host supplied.
   */
  it("keeps the tab track and thumb concentric", () => {
    const out = patch({ borderRadiusLG: 12 });
    expect(out["--ox-tabs-thumb-radius"]).toBe("12px");
    expect(out["--ox-tabs-track-radius"]).toBe("16px");
    expect(out["--ox-tabs-track-pad"]).toBe("4px");
  });

  it("falls back to the base radius when the host defines no large one", () => {
    const out = patch({ borderRadius: 6 });
    expect(out["--ox-tabs-thumb-radius"]).toBe("6px");
    expect(out["--ox-tabs-track-radius"]).toBe("10px");
  });

  it("writes no geometry at all when the host declares no radius", () => {
    const out = patch({ colorPrimary: "#000" });
    expect(out["--ox-tabs-track-radius"]).toBeUndefined();
  });
});

describe("accessibility floors survive a hostile host", () => {
  /**
   * A host asking for 24px controls does not get to shrink a clinical control
   * below WCAG 2.5.5. The floor is expressed as `max()` so a *larger* host
   * value still wins.
   */
  it("clamps the hit target rather than copying it", () => {
    expect(patch({ controlHeight: 24 })["--ox-density-target"]).toBe("max(44px, 24px)");
  });

  it("keeps a generous host control at its own size", () => {
    expect(patch({ controlHeight: 56 })["--ox-density-target"]).toBe("max(44px, 56px)");
  });

  it("reports a host theme whose primary button label would be unreadable", () => {
    // White-on-pale-mint is roughly 1.6:1. The bridge maps it faithfully; the
    // check is what says the host's theme is the problem.
    const result = verifyPatch({
      ...patch({ colorPrimary: "#9fd8c8" }),
      "--ox-text-on-accent": "#ffffff",
    });
    expect(result.contrast).toHaveLength(1);
    expect(result.contrast[0]?.reason).toContain("the host's theme is what fails");
    // Still a valid patch: the bridge did nothing wrong.
    expect(result.ok).toBe(true);
  });
});

describe("version policy", () => {
  /**
   * A bridge written against v6 names reads `undefined` on v5, and `undefined`
   * means "fall through" — so a version mismatch is a component quietly
   * wearing the wrong brand rather than an error. One major makes it a
   * resolution failure at install time instead.
   */
  it("declares a single antd major", () => {
    expect(antdBridge.supports).toBe("^6.0.0");
    expect(antdBridge.supports).not.toContain("||");
  });
});
