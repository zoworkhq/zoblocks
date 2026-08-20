/**
 * The two override tiers, through the console's own operation.
 *
 * `packages/theme` tests the rules; these test the thing that decides whether a
 * customer can act on them — that a refusal is a refusal at *save*, not a
 * surprise at publish, and that what is saved is what comes back.
 */

import { describe, expect, it } from "vitest";
import { withTierDefaults } from "@oxygenui-design/theme";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@oxygenui-design/tokens/validate";
import { ThemeError, createTheme, publishTheme, saveOverrides, versionCss } from "@/lib/themes";
import { twoOrgs, storedTokens } from "./harness";

let base: TokenSource;
const tokens = async () => (base ??= await loadTokenSource());

async function aTheme() {
  const { asNorthwind, asSouthmere } = await twoOrgs();
  const nw = await asNorthwind();
  const sm = await asSouthmere();
  const { id } = await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });
  return { nw, sm, id };
}

describe("saving overrides", () => {
  it("stores a semantic override and hands it back", async () => {
    const { nw, id } = await aTheme();

    const { changed } = await saveOverrides(nw, await tokens(), id, {
      semantic: { light: { accent: "#7c3aed" } },
    });

    expect(changed).toBe(1);
    const theme = await nw.data.themes.findOne({ _id: id });
    expect(storedTokens(theme).semantic.light["accent"]).toBe("#7c3aed");
  });

  /**
   * A per-theme tier, kept per-theme.
   *
   * The whole reason overrides are keyed by theme is that one literal cannot
   * clear 4.5:1 on both a white and a near-black ground. A save that leaked
   * across themes would reintroduce exactly the problem the shape prevents.
   */
  it("keeps the three themes apart", async () => {
    const { nw, id } = await aTheme();

    await saveOverrides(nw, await tokens(), id, {
      semantic: { light: { accent: "#0b5aa8" }, dark: { accent: "#7dd3fc" } },
    });

    const theme = await nw.data.themes.findOne({ _id: id });
    expect(storedTokens(theme).semantic.light["accent"]).toBe("#0b5aa8");
    expect(storedTokens(theme).semantic.dark["accent"]).toBe("#7dd3fc");
    expect(storedTokens(theme).semantic["high-contrast"]).toEqual({});
  });

  it("refuses a clinical token, naming why", async () => {
    const { nw, id } = await aTheme();

    await expect(
      saveOverrides(nw, await tokens(), id, {
        semantic: { light: { "status.critical": "#7c3aed" } },
      }),
    ).rejects.toThrow(ThemeError);

    // And nothing was written on the way to refusing.
    const theme = await nw.data.themes.findOne({ _id: id });
    expect(storedTokens(theme).semantic.light).toEqual({});
  });

  /**
   * Refused at save rather than at publish.
   *
   * A draft a customer believes is fine, which turns out not to be at the one
   * moment they most want it to work, is worse than a refusal they can act on
   * immediately — and they still have the ramp and the rest of the draft.
   */
  it("refuses an override that fails the contrast gate", async () => {
    const { nw, id } = await aTheme();

    await expect(
      saveOverrides(nw, await tokens(), id, {
        semantic: { light: { text: "#f2f4f7" } },
      }),
    ).rejects.toThrow(/cannot be saved/);
  });

  it("refuses a component token the manifest does not declare", async () => {
    const { nw, id } = await aTheme();

    await expect(
      saveOverrides(nw, await tokens(), id, {
        component: { light: { "--ox-accordion-header-bgg": "#0b5aa8" } },
      }),
    ).rejects.toThrow(/cannot be saved/);
  });

  it("leaves the brand ramp alone", async () => {
    const { nw, id } = await aTheme();
    const before = (await nw.data.themes.findOne({ _id: id }))?.tokens.ref;

    await saveOverrides(nw, await tokens(), id, { semantic: { light: { accent: "#0b5aa8" } } });

    expect((await nw.data.themes.findOne({ _id: id }))?.tokens.ref).toEqual(before);
  });

  it("cannot reach another organisation's theme", async () => {
    const { sm, id } = await aTheme();

    await expect(
      saveOverrides(sm, await tokens(), id, { semantic: { light: { accent: "#0b5aa8" } } }),
    ).rejects.toThrow("No such theme");
  });
});

describe("overrides reach the published stylesheet", () => {
  /**
   * The end of the chain, and the only proof that matters: a customer's
   * override has to arrive in the bytes a browser fetches, under the right
   * selector, with the clinical tokens still absent.
   */
  it("emits them under the theme selector they belong to", async () => {
    const { nw, id } = await aTheme();

    await saveOverrides(nw, await tokens(), id, {
      semantic: { light: { accent: "#0b5aa8" }, dark: { accent: "#7dd3fc" } },
      component: { light: { "--ox-accordion-header-bg": "#eef3f1" } },
    });
    const { version } = await publishTheme(nw, await tokens(), id);
    const css = await versionCss(nw, id, version);

    expect(css).toContain("--ox-accent: #0b5aa8;");
    expect(css).toContain('[data-ox-theme="dark"]');
    expect(css).toContain("--ox-accent: #7dd3fc;");
    expect(css).toContain("--ox-accordion-header-bg: #eef3f1;");

    // The rule that survives every tier: no clinical token, ever.
    expect(css).not.toContain("--ox-status-");
    expect(css).not.toContain("--ox-flag-");
  });
});

describe("themes stored before the override tiers existed", () => {
  it("still publish, because a published version is immutable", async () => {
    const { nw, id } = await aTheme();

    // Exactly what such a document looks like in Mongo.
    await nw.data.themes.updateOne(
      { _id: id },
      // Cast on purpose: `ThemeDoc.tokens` is the *current* shape, and the
      // point of the test is a document that predates it. The type refusing
      // this is the type doing its job.
      { $set: { tokens: { ref: { brand: { "600": "#1d63c9" } } } } } as never,
    );

    await expect(publishTheme(nw, await tokens(), id)).resolves.toMatchObject({ version: 1 });
  });

  it("normalise on the next save rather than staying half-shaped", async () => {
    const { nw, id } = await aTheme();
    await nw.data.themes.updateOne(
      { _id: id },
      // Cast on purpose: `ThemeDoc.tokens` is the *current* shape, and the
      // point of the test is a document that predates it. The type refusing
      // this is the type doing its job.
      { $set: { tokens: { ref: { brand: { "600": "#1d63c9" } } } } } as never,
    );

    await saveOverrides(nw, await tokens(), id, { semantic: { light: { accent: "#0b5aa8" } } });

    const theme = await nw.data.themes.findOne({ _id: id });
    expect(theme?.tokens).toEqual(
      withTierDefaults({
        ref: { brand: { "600": "#1d63c9" } },
        semantic: { light: { accent: "#0b5aa8" } },
      }),
    );
  });
});

describe("two screens, one document", () => {
  /**
   * The token editor owns `semantic`; the components screen owns `component`.
   * Each submits only its own tier, so a tier the payload does not mention has
   * to be kept rather than cleared.
   *
   * The first version replaced both unconditionally, and zod's `.default({})`
   * made the damage invisible: an absent tier arrived as three empty objects,
   * indistinguishable from "the customer deleted every override". The second
   * save of the day silently wiped the first, with nothing in the audit trail
   * to suggest anything had been lost.
   */
  it("a component save leaves semantic overrides alone", async () => {
    const { nw, id } = await aTheme();

    await saveOverrides(nw, await tokens(), id, { semantic: { light: { accent: "#0b5aa8" } } });
    await saveOverrides(nw, await tokens(), id, {
      component: { light: { "--ox-accordion-header-bg": "#eef3f1" } },
    });

    const theme = await nw.data.themes.findOne({ _id: id });
    expect(storedTokens(theme).semantic.light["accent"]).toBe("#0b5aa8");
    expect(storedTokens(theme).component.light["--ox-accordion-header-bg"]).toBe("#eef3f1");
  });

  it("a semantic save leaves component overrides alone", async () => {
    const { nw, id } = await aTheme();

    await saveOverrides(nw, await tokens(), id, {
      component: { light: { "--ox-accordion-header-bg": "#eef3f1" } },
    });
    await saveOverrides(nw, await tokens(), id, { semantic: { light: { accent: "#0b5aa8" } } });

    const theme = await nw.data.themes.findOne({ _id: id });
    expect(storedTokens(theme).component.light["--ox-accordion-header-bg"]).toBe("#eef3f1");
    expect(storedTokens(theme).semantic.light["accent"]).toBe("#0b5aa8");
  });

  /**
   * And clearing has to remain possible, or "revert everything" would be
   * unreachable — the distinction is the key being *present and empty* rather
   * than absent.
   */
  it("an explicitly empty tier still clears it", async () => {
    const { nw, id } = await aTheme();

    await saveOverrides(nw, await tokens(), id, { semantic: { light: { accent: "#0b5aa8" } } });
    await saveOverrides(nw, await tokens(), id, { semantic: { light: {} } });

    const theme = await nw.data.themes.findOne({ _id: id });
    expect(storedTokens(theme).semantic.light).toEqual({});
  });
});
