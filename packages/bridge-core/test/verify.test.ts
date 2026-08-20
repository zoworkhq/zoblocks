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
import { NOT_BRIDGEABLE } from "@oxygenui-design/tokens/surface";

describe("clinical tokens are refused", () => {
  it("has real clinical tokens to refuse", () => {
    expect(NOT_BRIDGEABLE.length).toBeGreaterThan(20);
  });

  it("names a badge's critical background", () => {
    const found = clinicalViolations({ "--ox-badge-critical-bg": "#ff0000" });
    expect(found).toHaveLength(1);
    expect(found[0]?.token).toBe("--ox-badge-critical-bg");
    expect(found[0]?.reason).toContain("passed no contrast gate");
  });

  it("refuses every token the manifest marks unbridgeable", () => {
    const patch = Object.fromEntries(NOT_BRIDGEABLE.map((t) => [t, "#ff0000"]));
    expect(clinicalViolations(patch)).toHaveLength(NOT_BRIDGEABLE.length);
  });

  it("allows brand chrome through", () => {
    expect(
      clinicalViolations({
        "--ox-accent": "#1677ff",
        "--ox-surface": "#ffffff",
        "--ox-tabs-accent": "#1677ff",
      }),
    ).toEqual([]);
  });
});

describe("unknown tokens are refused", () => {
  it("rejects a component token the manifest does not declare", () => {
    const found = unknownTokens({ "--ox-tabs-invented": "#000000" });
    expect(found).toHaveLength(1);
    expect(found[0]?.reason).toContain("not in the published token surface");
  });

  it("permits the semantic tier, which a bridge writes once for every component", () => {
    expect(
      unknownTokens({
        "--ox-accent": "#000",
        "--ox-accent-hover": "#000",
        "--ox-text-muted": "#000",
        "--ox-surface": "#000",
        "--ox-border": "#000",
        "--ox-radius": "8px",
        "--ox-font-sans": "system-ui",
        "--ox-duration": "180ms",
        "--ox-density-target": "44px",
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
      "--ox-text-on-accent": "#ffffff",
      "--ox-accent": "#9fd8c8",
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
    const passes = contrastViolations({ "--ox-focus-ring": "#3f9e88", "--ox-bg": "#ffffff" });
    expect(passes).toEqual([]);

    const fails = contrastViolations({ "--ox-focus-ring": "#a8ddcf", "--ox-bg": "#ffffff" });
    expect(fails).toHaveLength(1);
    expect(fails[0]?.reason).toContain("SC 1.4.11");
  });

  it("says the host's theme is what failed, not the bridge", () => {
    const found = contrastViolations({ "--ox-text": "#bbbbbb", "--ox-surface": "#ffffff" });
    expect(found[0]?.reason).toContain("the host's theme is what fails");
  });

  it("stays silent when only one side is mapped", () => {
    // The other side comes from Oxygen's own token, which is not visible here.
    // A guess would be worse than silence.
    expect(contrastViolations({ "--ox-text": "#bbbbbb" })).toEqual([]);
  });

  it("stays silent on a value it cannot parse", () => {
    expect(
      contrastViolations({ "--ox-text": "var(--something)", "--ox-surface": "#ffffff" }),
    ).toEqual([]);
  });
});

describe("verifyPatch", () => {
  it("is ok for a faithful chrome-only mapping", () => {
    const result = verifyPatch({ "--ox-accent": "#1677ff", "--ox-surface": "#ffffff" });
    expect(result.ok).toBe(true);
  });

  /**
   * Contrast alone does not make a patch invalid: it is the host's theme that
   * is wrong, and failing our build for their colour choice would be the wrong
   * place to enforce it.
   */
  it("stays ok when the only problem is the host's contrast", () => {
    const result = verifyPatch({ "--ox-text": "#bbbbbb", "--ox-surface": "#ffffff" });
    expect(result.contrast.length).toBeGreaterThan(0);
    expect(result.ok).toBe(true);
  });

  it("is not ok when a clinical token is written", () => {
    expect(verifyPatch({ "--ox-badge-critical-bg": "#f00" }).ok).toBe(false);
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
    expect(() => assertBridgeOutput("antd", { "--ox-badge-critical-bg": "#f00" })).toThrow(
      /\[oxygen:bridge-antd\].*--ox-badge-critical-bg/s,
    );
  });

  it("throws on a token outside the published surface", () => {
    expect(() => assertBridgeOutput("mui", { "--ox-tabs-invented": "#000" })).toThrow(
      /not in the published token surface/,
    );
  });

  it("counts every violation rather than reporting the first", () => {
    expect(() =>
      assertBridgeOutput("antd", {
        "--ox-badge-critical-bg": "#f00",
        "--ox-alert-critical-fg": "#f00",
      }),
    ).toThrow(/wrote 2 token\(s\)/);
  });

  it("is silent for a faithful chrome mapping", () => {
    expect(() =>
      assertBridgeOutput("antd", { "--ox-accent": "#1677ff", "--ox-surface": "#ffffff" }),
    ).not.toThrow();
  });

  /**
   * Host contrast is not the bridge's defect and does not throw. It belongs to
   * whoever chose the colour, which is why `verifyPatch` returns it for the
   * theme console to surface where a person can change it.
   */
  it("does not throw over the host's own contrast choices", () => {
    expect(() =>
      assertBridgeOutput("antd", { "--ox-text": "#bbbbbb", "--ox-surface": "#ffffff" }),
    ).not.toThrow();
    expect(
      verifyPatch({ "--ox-text": "#bbbbbb", "--ox-surface": "#ffffff" }).contrast,
    ).toHaveLength(1);
  });
});
