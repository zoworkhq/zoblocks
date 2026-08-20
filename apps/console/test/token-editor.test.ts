/**
 * The model every editing screen renders from.
 *
 * Pure, and worth testing precisely because it is: the token editor, the brand
 * screen, the components screen and the playground all read this, so a mistake
 * here is four wrong screens that each look plausible. It went in at 0% test
 * coverage, which the console's own floor caught.
 */

import { describe, expect, it } from "vitest";
import { TOKEN_SURFACE } from "@oxygenui-design/tokens/surface";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@oxygenui-design/tokens/validate";
import { buildEditorModel, componentIsEditable } from "@/lib/token-editor";

let base: TokenSource;
const source = async () => (base ??= await loadTokenSource());

const RAMP = { ref: { brand: { "600": "#1d63c9", "700": "#1a53a8" } } } as never;

describe("buildEditorModel", () => {
  it("groups every semantic token by its first segment", async () => {
    const model = buildEditorModel(await source(), "nw", RAMP, "light");

    const names = model.groups.map((group) => group.name);
    expect(names).toContain("accent");
    expect(names).toContain("text");
    expect(names).toContain("status");
    // Sorted, so the navigator does not reorder itself between renders.
    expect(names).toEqual([...names].sort());
  });

  it("marks clinical tokens locked and nothing else", async () => {
    const model = buildEditorModel(await source(), "nw", RAMP, "light");
    const all = model.groups.flatMap((group) => group.tokens);

    const locked = all.filter((token) => token.locked).map((token) => token.path);
    expect(locked.length).toBeGreaterThan(0);
    for (const path of locked) expect(path).toMatch(/^(status|flag)[.-]/);
    for (const token of all.filter((t) => !t.locked)) {
      expect(token.path).not.toMatch(/^(status|flag)[.-]/);
    }
  });

  /**
   * The per-theme tier, kept per theme. `accent` in dark and `accent` in light
   * are two different values, and conflating them is the bug the whole shape
   * exists to prevent.
   */
  it("resolves a different value per theme", async () => {
    const light = buildEditorModel(await source(), "nw", RAMP, "light");
    const dark = buildEditorModel(await source(), "nw", RAMP, "dark");

    expect(light.resolved["--ox-accent"]).not.toBe(dark.resolved["--ox-accent"]);
    expect(light.resolved["--ox-bg"]).not.toBe(dark.resolved["--ox-bg"]);
  });

  it("applies the customer's ramp, so the model is their palette not ours", async () => {
    const mine = buildEditorModel(await source(), "nw", RAMP, "light");
    const theirs = buildEditorModel(
      await source(),
      "nw",
      { ref: { brand: { "600": "#7c3aed", "700": "#5b21b6" } } } as never,
      "light",
    );

    expect(mine.resolved["--ox-accent"]).not.toBe(theirs.resolved["--ox-accent"]);
  });

  it("shows an override as the resolved value and keeps the base for revert", async () => {
    const model = buildEditorModel(
      await source(),
      "nw",
      {
        ref: {},
        semantic: { light: { accent: "#0b5aa8" }, dark: {}, "high-contrast": {} },
        component: { light: {}, dark: {}, "high-contrast": {} },
      } as never,
      "light",
    );

    const accent = model.groups
      .flatMap((group) => group.tokens)
      .find((token) => token.path === "accent");

    expect(accent?.override).toBe("#0b5aa8");
    expect(accent?.resolved).toBe("#0b5aa8");
    // The value with no override — otherwise revert would be a no-op that
    // looks like a bug.
    expect(accent?.base).not.toBe("#0b5aa8");
  });

  it("records both sides of every pair the gate checks", async () => {
    const model = buildEditorModel(await source(), "nw", RAMP, "light");

    // `text` is a foreground; `surface` is the background of the same pair.
    const asForeground = model.pairs["text"]?.filter((pair) => pair.isForeground) ?? [];
    const asBackground = model.pairs["surface"]?.filter((pair) => !pair.isForeground) ?? [];

    expect(asForeground.length).toBeGreaterThan(0);
    expect(asBackground.length).toBeGreaterThan(0);
    expect(asForeground.some((pair) => pair.againstPath === "surface")).toBe(true);
  });

  it("carries the floor and the criterion, not just a number", async () => {
    const model = buildEditorModel(await source(), "nw", RAMP, "light");
    const pair = model.pairs["text"]?.find((entry) => entry.isForeground);

    expect(pair?.floor).toBe(4.5);
    expect(pair?.criterion).toContain("SC 1.4.3");
  });

  /** High contrast targets AAA, which is the entire reason to select it. */
  it("raises the floor in high contrast", async () => {
    const model = buildEditorModel(await source(), "nw", RAMP, "high-contrast");
    const pair = model.pairs["text"]?.find((entry) => entry.isForeground);
    expect(pair?.floor).toBe(7);
  });

  /**
   * The map that makes a scoped preview honest. Every component token with a
   * semantic parent is listed — clinical ones included, because "may not be
   * written" and "must be rendered correctly" are different rules.
   */
  it("lists every component token under the semantic token it inherits", async () => {
    const model = buildEditorModel(await source(), "nw", RAMP, "light");

    expect(model.dependents["--ox-accent"]).toContain("--ox-switch-track-on-bg");
    // Clinical, and present: the preview has to draw it correctly. The parent
    // is the `-bg` variant, not `status.critical` itself — a background token
    // inherits a background token.
    expect(model.dependents["--ox-status-critical-bg"]).toContain("--ox-badge-critical-bg");
    expect(model.dependents["--ox-status-critical"]).toContain("--ox-badge-critical-fg");

    const listed = Object.values(model.dependents).flat().length;
    expect(listed).toBe(TOKEN_SURFACE.filter((entry) => entry.semantic).length);
  });

  it("counts all three tiers from the data", async () => {
    const model = buildEditorModel(await source(), "nw", RAMP, "light");

    expect(model.counts.component).toBe(TOKEN_SURFACE.length);
    expect(model.counts.semantic).toBeGreaterThan(0);
    expect(model.counts.primitive).toBeGreaterThan(model.counts.semantic);
  });

  it("marks non-colour tokens so they get no contrast reading", async () => {
    const model = buildEditorModel(await source(), "nw", RAMP, "light");
    const all = model.groups.flatMap((group) => group.tokens);

    const duration = all.find((token) => token.path.startsWith("duration"));
    expect(duration?.isColour).toBe(false);
    expect(all.find((token) => token.path === "accent")?.isColour).toBe(true);
  });

  it("accepts a theme stored before the override tiers existed", async () => {
    const tokens = await source();
    // Resolved first: `await` cannot appear inside the synchronous callback
    // `toThrow` needs.
    expect(() =>
      buildEditorModel(tokens, "nw", { ref: { brand: { "600": "#1d63c9" } } } as never, "light"),
    ).not.toThrow();
  });
});

describe("componentIsEditable", () => {
  it("is true for a bridgeable token and false for a clinical one", () => {
    expect(componentIsEditable("--ox-accordion-header-bg")).toBe(true);
    expect(componentIsEditable("--ox-badge-critical-bg")).toBe(false);
  });

  it("is false for a property the manifest does not declare", () => {
    expect(componentIsEditable("--ox-not-a-token")).toBe(false);
  });
});
