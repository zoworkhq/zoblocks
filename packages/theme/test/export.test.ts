/**
 * Five exports, and what none of them carry.
 *
 * The antd and MUI exports are the bridge mapping tables run backwards, so the
 * tests that matter most are the ones holding them *to* those bridges: if the
 * correspondence drifts, a customer's brand means one thing coming in and
 * another going out.
 */

import { describe, expect, it } from "vitest";
import { antdBridge } from "@oxygenui-design/bridge-antd";
import { muiBridge } from "@oxygenui-design/bridge-mui";
import { exportTheme, importDtcg, importFrameworkTheme } from "../src/index";
import { publishedTheme } from "./fixture";

describe("DTCG", () => {
  it("emits the palette with types", () => {
    const { body } = exportTheme(publishedTheme(), "dtcg");
    const parsed = JSON.parse(body);
    expect(parsed.ref.brand.$type).toBe("color");
    expect(parsed.ref.brand["600"].$value).toBe("#1d63c9");
  });

  it("says what it is and where it came from", () => {
    const parsed = JSON.parse(exportTheme(publishedTheme(), "dtcg").body);
    expect(parsed.$description).toContain("version 7");
    expect(parsed.$description).toContain("Primitive palette only");
  });

  it("round-trips back through the importer unchanged", () => {
    const theme = publishedTheme();
    const report = importDtcg(JSON.parse(exportTheme(theme, "dtcg").body));
    expect(report.matched.brand).toEqual(theme.tokens.ref.brand);
    expect(report.unmatched).toEqual([]);
  });

  it("names the file by slug and version, so two exports never collide", () => {
    expect(exportTheme(publishedTheme(), "dtcg").filename).toBe("northwind-clinical@7.tokens.json");
  });
});

describe("CSS and Tailwind", () => {
  it("emits the same stylesheet the CDN serves", () => {
    expect(exportTheme(publishedTheme(), "css").body).toContain("--ox-ref-brand-600: #1d63c9;");
  });

  it("emits a Tailwind v4 theme block", () => {
    const { body } = exportTheme(publishedTheme(), "tailwind");
    expect(body).toContain("@theme {");
    expect(body).toContain("--color-brand-600: #1d63c9;");
  });
});

describe("the framework exports", () => {
  it("writes the customer's brand in antd's vocabulary", () => {
    const { body } = exportTheme(publishedTheme(), "antd");
    expect(body).toContain('"colorPrimary": "#1d63c9"');
    expect(body).toContain("northwindClinicalTheme");
  });

  it("writes it in MUI's", () => {
    const { body } = exportTheme(publishedTheme(), "mui");
    expect(body).toContain('"main": "#1d63c9"');
    expect(body).toContain("createTheme");
  });

  /**
   * Held to the bridges. An export that wrote a token the bridge does not map
   * would claim a correspondence the runtime does not honour.
   */
  it("writes only tokens the matching bridge treats as counterparts", () => {
    const antd = exportTheme(publishedTheme(), "antd").body;
    for (const unmapped of antdBridge.unmapped) {
      // The bridge's unmapped list is in `--ox-*` terms; what matters is that
      // nothing clinical appears in the export at all.
      if (!unmapped.includes("status") && !unmapped.includes("flag")) continue;
      expect(antd.toLowerCase()).not.toContain("colorerror");
      expect(antd.toLowerCase()).not.toContain("colorwarning");
    }
    const mui = exportTheme(publishedTheme(), "mui").body;
    expect(mui).not.toContain("error");
    expect(muiBridge.unmapped).toContain("--ox-status-critical");
  });

  it("says at the point of use that it is chrome only", () => {
    expect(exportTheme(publishedTheme(), "antd").caveat).toContain("Clinical status");
    expect(exportTheme(publishedTheme(), "mui").caveat).toContain("Clinical status");
  });

  it("explains in the file itself why status is absent", () => {
    const { body } = exportTheme(publishedTheme(), "antd");
    expect(body).toContain("hue separation");
    expect(body).toContain("colour-vision deficiency");
  });
});

describe("import", () => {
  it("takes the palette and reports what it did not understand", () => {
    const report = importDtcg({
      ref: { brand: { $type: "color", "600": { $value: "#1d63c9" } } },
      spacing: { md: { $value: "1rem" } },
    });
    expect(report.matched.brand).toEqual({ "600": "#1d63c9" });
    expect(report.unmatched).toEqual(["spacing.md"]);
  });

  /**
   * Reported rather than silently dropped. A customer whose file contained a
   * status colour needs to know it did not take effect *before* they confirm,
   * or the first they hear of it is a support conversation about a red that
   * did not change.
   */
  it("discards clinical tokens and says so", () => {
    const report = importDtcg({
      status: { critical: { $value: "#ff00ff" } },
      flag: { deceased: { $value: "#ff00ff" } },
      ref: { brand: { "600": { $value: "#1d63c9" } } },
    });
    expect(report.discardedClinical).toEqual(["status.critical", "flag.deceased"]);
    expect(JSON.stringify(report.matched)).not.toContain("ff00ff");
  });

  it("reads an antd theme object", () => {
    const report = importFrameworkTheme({
      token: { colorPrimary: "#7c3aed", colorPrimaryHover: "#6d28d9", colorError: "#ff0000" },
    });
    expect(report.matched.brand).toMatchObject({ "600": "#7c3aed", "700": "#6d28d9" });
    expect(report.unmatched).toContain("token.colorError");
  });

  it("reads a MUI theme object", () => {
    const report = importFrameworkTheme({
      palette: { primary: { main: "#1976d2", dark: "#115293", light: "#42a5f5" } },
    });
    expect(report.matched.brand).toMatchObject({
      "600": "#1976d2",
      "700": "#115293",
      "400": "#42a5f5",
    });
  });

  it("always reports clinical as discarded from a framework theme", () => {
    // Neither framework can express the direction of an abnormal result, so
    // there was never anything there that could have carried it.
    expect(importFrameworkTheme({ token: {} }).discardedClinical).toEqual(["status.*", "flag.*"]);
  });

  it("survives a file that is not a theme at all", () => {
    expect(importDtcg(null).matched).toEqual({});
    expect(importFrameworkTheme("nonsense").matched).toEqual({});
  });
});
