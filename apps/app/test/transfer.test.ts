/**
 * Getting a theme out, and getting one in.
 *
 * The import tests carry the weight. An import that writes on upload gives a
 * customer no chance to see that their status colours were discarded, and the
 * first they hear of it is a support conversation about a red that did not
 * change — so the report is computed and returned before anything is saved.
 */

import { describe, expect, it } from "vitest";
import {
  ThemeError,
  applyImport,
  createTheme,
  exportThemeAs,
  previewImport,
  publishTheme,
  saveDraft,
} from "@/lib/themes";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@zoblocks/tokens/validate";
import { actingAs, seedOrg, storedTokens } from "./harness";

let base: TokenSource;
const tokens = async () => (base ??= await loadTokenSource());

describe("export", () => {
  it("exports the published version, not a half-edited draft", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(auth, await tokens(), id);

    // The draft moves on after publishing.
    await saveDraft(auth, id, { ref: { brand: { "600": "#b91c1c" } } });

    const result = await exportThemeAs(auth, id, "dtcg");
    expect(result.body).toContain("#1d63c9");
    expect(result.body).not.toContain("#b91c1c");
    expect(result.filename).toBe("clinical@1.tokens.json");
  });

  it("falls back to the draft when nothing is published yet", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    const result = await exportThemeAs(auth, id, "css");
    expect(result.body).toContain("#1d63c9");
  });

  /**
   * `colorPrimary` is the accent Zoblocks *renders*, not the swatch the customer
   * typed.
   *
   * This assertion used to expect the ramp's 600 — the brand colour as picked —
   * because the export read `ref.brand` directly. Zoblocks's `--zb-accent`
   * resolves to step 700, so an antd application themed from that file sat a
   * shade away from the Zoblocks components beside it, and the two looked subtly
   * unrelated. The export now goes through `bridge-antd`'s own table, which is
   * the same one the runtime bridge uses, so the file and the bridge cannot
   * disagree.
   */
  it("writes the accent Zoblocks renders, in antd's vocabulary", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    const result = await exportThemeAs(auth, id, "antd");

    // 700, derived from the 600 the customer chose.
    expect(result.body).toContain('"colorPrimary": "#1851a5"');
    // And far more than the four tokens the private copy knew.
    expect(result.body).toContain('"colorText"');
    expect(result.body).toContain('"borderRadius"');
    expect(result.body).toContain('"fontFamily"');
    expect(result.caveat).toContain("Clinical status");
  });

  it("never writes a clinical colour into a framework theme", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });

    for (const format of ["antd", "mui"] as const) {
      const { body } = await exportThemeAs(auth, id, format);
      // Severity is carried by hue separation and a validated floor; neither
      // framework has anywhere to record either, so a mapped status colour
      // would be a colour stripped of the thing that made it safe.
      expect(body.toLowerCase(), format).not.toContain("colorerror");
      expect(body.toLowerCase(), format).not.toContain("colorwarning");
      expect(body, format).not.toContain("palette.error");
    }
  });

  it("refuses another organisation's theme", async () => {
    const nw = await actingAs(await seedOrg("Northwind", "northwind"));
    const sm = await actingAs(await seedOrg("Southmere", "southmere"));
    const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
    await expect(exportThemeAs(sm, id, "dtcg")).rejects.toThrow("No such theme");
  });
});

describe("import preview", () => {
  it("reads a DTCG document", () => {
    const report = previewImport(
      JSON.stringify({ ref: { brand: { "600": { $value: "#7c3aed" } } } }),
    );
    expect(report.matched.brand).toEqual({ "600": "#7c3aed" });
  });

  it("recognises an antd theme object without being told which kind it is", () => {
    const report = previewImport(JSON.stringify({ token: { colorPrimary: "#7c3aed" } }));
    expect(report.matched.brand?.["600"]).toBe("#7c3aed");
  });

  it("recognises a MUI theme object", () => {
    const report = previewImport(JSON.stringify({ palette: { primary: { main: "#7c3aed" } } }));
    expect(report.matched.brand?.["600"]).toBe("#7c3aed");
  });

  /**
   * Reported, not silently dropped, and reported *before* anything is saved.
   */
  it("discards clinical tokens and names them", () => {
    const report = previewImport(
      JSON.stringify({
        status: { critical: { $value: "#ff00ff" } },
        ref: { brand: { "600": { $value: "#7c3aed" } } },
      }),
    );
    expect(report.discardedClinical).toEqual(["status.critical"]);
    expect(JSON.stringify(report.matched)).not.toContain("ff00ff");
  });

  it("refuses a file that is not JSON, with somewhere to go next", () => {
    try {
      previewImport("<xml/>");
      expect.unreachable("should have refused");
    } catch (error) {
      expect((error as ThemeError).message).toContain("not JSON");
      expect((error as ThemeError).problems.join(" ")).toContain("Tokens Studio");
    }
  });

  it("refuses a file with nothing that maps onto a palette", () => {
    try {
      previewImport(JSON.stringify({ spacing: { md: { $value: "1rem" } } }));
      expect.unreachable("should have refused");
    } catch (error) {
      expect((error as ThemeError).message).toContain("Nothing in that file");
      expect((error as ThemeError).problems.join(" ")).toContain("spacing.md");
    }
  });
});

describe("applying an import", () => {
  it("writes to the draft and leaves the published version alone", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await publishTheme(auth, await tokens(), id);

    const report = previewImport(
      JSON.stringify({ ref: { brand: { "600": { $value: "#7c3aed" } } } }),
    );
    await applyImport(auth, id, report);

    const theme = await auth.data.themes.findOne({ _id: id });
    expect(storedTokens(theme).ref.brand?.["600"]).toBe("#7c3aed");

    // v1 is untouched — an import cannot reach a running application.
    const published = await auth.data.versions.findOne({ themeId: id, version: 1 });
    expect(storedTokens(published).ref.brand?.["600"]).toBe("#1d63c9");
  });

  it("records what it discarded, so the audit trail says so a year later", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });

    const report = previewImport(
      JSON.stringify({
        status: { critical: { $value: "#ff00ff" } },
        ref: { brand: { "600": { $value: "#7c3aed" } } },
      }),
    );
    await applyImport(auth, id, report);

    const entries = await auth.data.audit.find({ action: "theme.updated" }).toArray();
    expect(entries.at(-1)?.detail).toContain("discarded 1 clinical token");
  });

  /**
   * An imported palette is not exempt from the gate. A file from another system
   * can carry colours that fail here, and publishing is where that is caught.
   */
  it("does not let an imported palette bypass the publish gate", async () => {
    const auth = await actingAs(await seedOrg("Northwind", "northwind"));
    const { id } = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });

    const report = previewImport(
      JSON.stringify({
        ref: { brand: { "600": { $value: "#cfeee6" }, "700": { $value: "#d6f2ea" } } },
      }),
    );
    await applyImport(auth, id, report);

    await expect(publishTheme(auth, await tokens(), id)).rejects.toThrow("cannot be published");
  });
});
