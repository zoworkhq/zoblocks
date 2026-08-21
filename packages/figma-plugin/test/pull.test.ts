/**
 * What a pull would change, before it changes anything.
 *
 * Preview-first is not politeness. A sync that writes on the button marked
 * "sync" leaves a designer with no moment at which "what is about to happen to
 * my file" has an answer other than "run it and find out" — and the answer
 * matters most in the file they have spent a week on.
 */

import { describe, expect, it } from "vitest";
import { hexToFigmaRgb } from "@oxygenui-design/figma-core";

import { contrastBetween, generateRamp } from "@oxygenui-design/tokens/validate";

import {
  accentStep,
  applyOrder,
  modesFor,
  previewPull,
  readAnchorLocally,
  summarise,
  versionMove,
} from "../src/pull";
import type { ResolvedPayload } from "../src/console";
import { snapshot } from "./fixture";

const CLINICAL = "Clinical. Carries a validated contrast floor and 60° of hue separation.";

function payload(over: Partial<ResolvedPayload> = {}): ResolvedPayload {
  return {
    slug: "clinical",
    name: "Clinical",
    version: 3,
    status: "published",
    ramp: { "600": "#1d63c9", "700": "#1851a5" },
    semantic: {
      light: {
        "--ox-accent": "#1851a5",
        "--ox-text": "#16181d",
        "--ox-status-critical": "#b4232b",
      },
      dark: { "--ox-accent": "#5a94e7", "--ox-text": "#e8ecf1", "--ox-status-critical": "#f08b96" },
      "high-contrast": {
        "--ox-accent": "#0f3568",
        "--ox-text": "#000000",
        "--ox-status-critical": "#8c0d16",
      },
    },
    locked: { "--ox-status-critical": CLINICAL },
    ...over,
  };
}

const rgb = (hex: string) => hexToFigmaRgb(hex)!;

/** A variable as the sandbox would have read it back out of a file. */
function inFile(token: string, name: string, light: string, collection = "Oxygen / Semantic") {
  return {
    token,
    name,
    collection,
    values: { light: { kind: "color" as const, hex: light, rgb: rgb(light) } },
  };
}

describe("the first pull into an empty file", () => {
  it("creates everything and updates nothing", () => {
    const preview = previewPull(payload(), snapshot([]));

    expect(preview.diff.update).toEqual([]);
    expect(preview.diff.orphan).toEqual([]);
    expect(preview.diff.create.length).toBeGreaterThan(0);
    expect(preview.diff.clean).toBe(false);
  });

  it("plans the brand tier in one mode and the semantic tier in three", () => {
    const preview = previewPull(payload(), snapshot([]));
    const brand = preview.diff.create.find((v) => v.tier === "brand")!;
    const semantic = preview.diff.create.find((v) => v.token === "--ox-accent")!;

    // The ramp is the palette the themes select *from*; three identical modes
    // would imply a choice that does not exist.
    expect(Object.keys(brand.values)).toEqual(["default"]);
    expect(Object.keys(semantic.values).sort()).toEqual(["dark", "high-contrast", "light"]);
  });

  it("carries the reason a clinical variable cannot be edited", () => {
    const preview = previewPull(payload(), snapshot([]));
    const critical = preview.diff.create.find((v) => v.token === "--ox-status-critical")!;
    expect(critical.locked).toBe(CLINICAL);
  });

  it("leaves the component tier out unless asked", () => {
    const withComponent = previewPull(payload(), snapshot([]), { includeComponent: true });
    const without = previewPull(payload(), snapshot([]));
    expect(without.diff.create.every((v) => v.tier !== "component")).toBe(true);
    expect(withComponent.diff.create.length).toBeGreaterThanOrEqual(without.diff.create.length);
  });
});

describe("pulling the same version twice", () => {
  /** The file as the first pull would have left it. */
  function pulled() {
    const plan = previewPull(payload(), snapshot([])).plan;
    return snapshot(
      plan.variables.map((v) => ({
        token: v.token,
        name: v.name,
        collection: v.collection,
        values: v.values,
      })),
    );
  }

  it("writes nothing the second time", () => {
    const preview = previewPull(payload(), pulled());
    // Without this every sync churns the file's version history, and a designer
    // loses the ability to see what actually changed — which is the reason they
    // opened history.
    expect(preview.diff.clean).toBe(true);
    expect(summarise(preview.diff)).toContain("Nothing to change");
  });
});

describe("a designer's edits", () => {
  it("updates a renamed variable rather than creating a second one", () => {
    const file = snapshot([inFile("--ox-accent", "Brand blue", "#1851a5")]);
    const preview = previewPull(payload(), file);

    expect(preview.diff.create.some((v) => v.token === "--ox-accent")).toBe(false);
    const update = preview.diff.update.find((u) => u.variable.token === "--ox-accent")!;
    expect(update.because).toContain("name");
  });

  it("names a clinical variable it is putting back, with the reason", () => {
    // A colour a customer cannot change in the console, changed here.
    const file = snapshot([inFile("--ox-status-critical", "status/critical", "#ff00ff")]);
    const preview = previewPull(payload(), file);

    expect(preview.restores).toEqual([{ name: "status/critical", reason: CLINICAL }]);
  });

  it("does not call a rename a restoration", () => {
    // Renaming a clinical variable is a label change, and the label is the
    // designer's. Reporting it as a restored clinical signal would cry wolf.
    const file = snapshot([inFile("--ox-status-critical", "Critical (ours)", "#b4232b")]);
    const preview = previewPull(payload(), file);

    expect(preview.diff.update.some((u) => u.variable.token === "--ox-status-critical")).toBe(true);
    expect(preview.restores).toEqual([]);
  });

  it("lists a variable that is ours and no longer in the theme, and never deletes it", () => {
    const file = snapshot([inFile("--ox-legacy-accent", "legacy/accent", "#123456")]);
    const preview = previewPull(payload(), file);

    expect(preview.diff.orphan.map((o) => o.name)).toEqual(["legacy/accent"]);
    expect(summarise(preview.diff)).toContain("no longer in this theme");
  });

  it("leaves a swatch that was never ours entirely alone", () => {
    const file = snapshot([{ name: "Scratch pink", collection: "Swatches", values: {} }]);
    const preview = previewPull(payload(), file);
    expect(preview.diff.orphan).toEqual([]);
  });
});

describe("the sentence the preview leads with", () => {
  it("counts each kind separately, because they mean different things", () => {
    const file = snapshot([
      inFile("--ox-accent", "accent", "#ff0000"),
      inFile("--ox-legacy", "legacy", "#00ff00"),
    ]);
    const summary = summarise(previewPull(payload(), file).diff);
    expect(summary).toMatch(/\d+ created/);
    expect(summary).toContain("1 updated");
    expect(summary).toContain("1 no longer in this theme");
  });
});

describe("which way a pull moves the file", () => {
  it("distinguishes the four ways it can", () => {
    const at = (version: number) => ({ slug: "clinical", version });
    expect(versionMove(undefined, at(3))).toBe("first");
    expect(versionMove(at(3), at(3))).toBe("same");
    expect(versionMove(at(3), at(4))).toBe("forward");
    // Legitimate on purpose, and also how somebody undoes a week by misclicking.
    expect(versionMove(at(4), at(3))).toBe("back");
    expect(versionMove(at(3), { slug: "oncology", version: 1 })).toBe("different-theme");
  });
});

describe("the order things are written in", () => {
  it("puts the brand tier before anything that aliases it", () => {
    const plan = previewPull(payload(), snapshot([])).plan;
    const tiers = applyOrder(plan.variables).map((v) => v.tier);
    const lastBrand = tiers.lastIndexOf("brand");
    const firstSemantic = tiers.indexOf("semantic");
    // An alias resolves a token name to an id at the moment of writing, so the
    // target has to exist by then.
    expect(lastBrand).toBeLessThan(firstSemantic);
  });

  it("gives brand one mode and the themed tiers three", () => {
    expect(modesFor("Oxygen / Brand")).toEqual(["Default"]);
    expect(modesFor("Oxygen / Semantic")).toEqual(["light", "dark", "high-contrast"]);
  });
});

describe("the one pair measured in the panel", () => {
  /** A payload whose accent is the 700 step, as the shipped semantic tier is. */
  const real = payload({
    ramp: Object.fromEntries(Object.entries(generateRamp("#1d63c9")!).map(([k, v]) => [k, v])),
    semantic: {
      light: {
        "--ox-accent": generateRamp("#1d63c9")![700],
        "--ox-text-on-accent": "#ffffff",
      },
      dark: {},
      "high-contrast": {},
    } as never,
  });

  it("recovers which ramp step the accent comes from", () => {
    expect(accentStep(real)).toBe("700");
  });

  it("measures that step, not the anchor", () => {
    /*
     * The bug this test exists for. `generateRamp` pins the seed at 600 and
     * derives the rest at fixed lightnesses, so a seed darker than 600's
     * nominal lightness produces a *lighter* 700. Measuring the anchor reported
     * 5.47:1 for #0f766e where the console reports 2.98:1 — confidently wrong,
     * in the direction that says pass where the gate says fail.
     */
    const reading = readAnchorLocally(real, "#0f766e")!;
    expect(reading.passes).toBe(false);
    expect(reading.ratio).toBeCloseTo(2.98, 1);

    const anchorItself = contrastBetween("#ffffff", "#0f766e")!;
    expect(anchorItself).toBeGreaterThan(4.5);
  });

  it("agrees with itself on a colour that passes", () => {
    const reading = readAnchorLocally(real, "#7c3aed")!;
    expect(reading.passes).toBe(true);
  });

  it("says nothing rather than guessing when the accent is not a ramp step", () => {
    // A customer who overrode `accent` to a literal. No number beats a wrong
    // one, and the console is still authoritative.
    const overridden = payload({
      semantic: {
        light: { "--ox-accent": "#123456", "--ox-text-on-accent": "#ffffff" },
        dark: {},
        "high-contrast": {},
      } as never,
    });
    expect(accentStep(overridden)).toBeUndefined();
    expect(readAnchorLocally(overridden, "#1d63c9")).toBeUndefined();
  });

  it("says nothing for a colour that is not one", () => {
    expect(readAnchorLocally(real, "burnt sienna")).toBeUndefined();
  });
});
