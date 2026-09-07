/**
 * The guard that stops a bridge doing damage.
 *
 * Both failures it catches render perfectly, which is why they need a check
 * rather than a reviewer: a clinical token overwritten with a brand red looks
 * like a themed component, and unreadable text looks like a design choice.
 */

import { describe, expect, it } from "vitest";
import {
  assertBridgeOutput,
  clinicalViolations,
  contrastViolations,
  unknownTokens,
  verifyPatch,
} from "../src/index";
import { NOT_BRIDGEABLE } from "@zoblocks/tokens/surface";

describe("clinical tokens are refused", () => {
  it("has real clinical tokens to refuse", () => {
    expect(NOT_BRIDGEABLE.length).toBeGreaterThan(20);
  });

  it("names a badge's critical background", () => {
    const found = clinicalViolations({ "--zb-badge-critical-bg": "#ff0000" });
    expect(found).toHaveLength(1);
    expect(found[0]?.token).toBe("--zb-badge-critical-bg");
    expect(found[0]?.reason).toContain("passed no contrast gate");
  });

  it("refuses every token the manifest marks unbridgeable", () => {
    const patch = Object.fromEntries(NOT_BRIDGEABLE.map((t) => [t, "#ff0000"]));
    expect(clinicalViolations(patch)).toHaveLength(NOT_BRIDGEABLE.length);
  });

  it("allows brand chrome through", () => {
    expect(
      clinicalViolations({
        "--zb-accent": "#1677ff",
        "--zb-surface": "#ffffff",
        "--zb-tabs-accent": "#1677ff",
      }),
    ).toEqual([]);
  });
});

describe("unknown tokens are refused", () => {
  it("rejects a component token the manifest does not declare", () => {
    const found = unknownTokens({ "--zb-tabs-invented": "#000000" });
    expect(found).toHaveLength(1);
    expect(found[0]?.reason).toContain("not in the published token surface");
  });

  it("permits the semantic tier, which a bridge writes once for every component", () => {
    expect(
      unknownTokens({
        "--zb-accent": "#000",
        "--zb-accent-hover": "#000",
        "--zb-text-muted": "#000",
        "--zb-surface": "#000",
        "--zb-border": "#000",
        "--zb-radius": "8px",
        "--zb-font-sans": "system-ui",
        "--zb-duration": "180ms",
        "--zb-density-target": "44px",
      }),
    ).toEqual([]);
  });

  it("ignores properties that are not ours to police", () => {
    expect(unknownTokens({ "--ant-color-primary": "#1677ff" })).toEqual([]);
  });
});

describe("contrast is checked where both sides are known", () => {
  it("flags a host theme whose label fails on its own accent", () => {
    const found = contrastViolations({
      "--zb-text-on-accent": "#ffffff",
      "--zb-accent": "#9fd8c8",
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.reason).toContain("SC 1.4.3 (text)");
    expect(found[0]?.reason).toMatch(/is \d+\.\d{2}:1 in the host theme/);
  });

  /**
   * A focus ring is an interface component, not body text. Holding it to 4.5
   * would reject themes that are correct.
   */
  it("holds an interface component to 3:1, not 4.5:1", () => {
    const passes = contrastViolations({ "--zb-focus-ring": "#3f9e88", "--zb-bg": "#ffffff" });
    expect(passes).toEqual([]);

    const fails = contrastViolations({ "--zb-focus-ring": "#a8ddcf", "--zb-bg": "#ffffff" });
    expect(fails).toHaveLength(1);
    expect(fails[0]?.reason).toContain("SC 1.4.11");
  });

  it("says the host's theme is what failed, not the bridge", () => {
    const found = contrastViolations({ "--zb-text": "#bbbbbb", "--zb-surface": "#ffffff" });
    expect(found[0]?.reason).toContain("the host's theme is what fails");
  });

  it("stays silent when only one side is mapped", () => {
    // The other side comes from ZoBlocks's own token, which is not visible here.
    // A guess would be worse than silence.
    expect(contrastViolations({ "--zb-text": "#bbbbbb" })).toEqual([]);
  });

  it("stays silent on a value it cannot parse", () => {
    expect(
      contrastViolations({ "--zb-text": "var(--something)", "--zb-surface": "#ffffff" }),
    ).toEqual([]);
  });
});

describe("verifyPatch", () => {
  it("is ok for a faithful chrome-only mapping", () => {
    const result = verifyPatch({ "--zb-accent": "#1677ff", "--zb-surface": "#ffffff" });
    expect(result.ok).toBe(true);
  });

  /**
   * Contrast alone does not make a patch invalid: it is the host's theme that
   * is wrong, and failing our build for their colour choice would be the wrong
   * place to enforce it.
   */
  it("stays ok when the only problem is the host's contrast", () => {
    const result = verifyPatch({ "--zb-text": "#bbbbbb", "--zb-surface": "#ffffff" });
    expect(result.contrast.length).toBeGreaterThan(0);
    expect(result.ok).toBe(true);
  });

  it("is not ok when a clinical token is written", () => {
    expect(verifyPatch({ "--zb-badge-critical-bg": "#f00" }).ok).toBe(false);
  });
});

describe("assertBridgeOutput", () => {
  /**
   * A bridge writing a clinical token is a programming error, so it throws
   * rather than warning. The house rule settled this: reading `process.env`
   * from source a customer copies is forbidden, and a warning is the wrong
   * volume for a defect that renders perfectly — a host's brand red standing
   * in for `status.critical` looks like a themed component.
   */
  it("throws when a clinical token is written, naming it", () => {
    expect(() => assertBridgeOutput("antd", { "--zb-badge-critical-bg": "#f00" })).toThrow(
      /\[zoblocks:bridge-antd\].*--zb-badge-critical-bg/s,
    );
  });

  it("throws on a token outside the published surface", () => {
    expect(() => assertBridgeOutput("mui", { "--zb-tabs-invented": "#000" })).toThrow(
      /not in the published token surface/,
    );
  });

  it("counts every violation rather than reporting the first", () => {
    expect(() =>
      assertBridgeOutput("antd", {
        "--zb-badge-critical-bg": "#f00",
        "--zb-alert-critical-fg": "#f00",
      }),
    ).toThrow(/wrote 2 token\(s\)/);
  });

  it("is silent for a faithful chrome mapping", () => {
    expect(() =>
      assertBridgeOutput("antd", { "--zb-accent": "#1677ff", "--zb-surface": "#ffffff" }),
    ).not.toThrow();
  });

  /**
   * Host contrast is not the bridge's defect and does not throw. It belongs to
   * whoever chose the colour, which is why `verifyPatch` returns it for the
   * theme app to surface where a person can change it.
   */
  it("does not throw over the host's own contrast choices", () => {
    expect(() =>
      assertBridgeOutput("antd", { "--zb-text": "#bbbbbb", "--zb-surface": "#ffffff" }),
    ).not.toThrow();
    expect(
      verifyPatch({ "--zb-text": "#bbbbbb", "--zb-surface": "#ffffff" }).contrast,
    ).toHaveLength(1);
  });
});
