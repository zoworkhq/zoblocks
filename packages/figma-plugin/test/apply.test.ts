/**
 * Applying a pull, against a file that counts what was written to it.
 *
 * Three of the phase's acceptance criteria live here, and all three are about
 * writes rather than about the values afterwards:
 *
 *   - pulling the same version twice writes nothing the second time;
 *   - a renamed variable is updated, not duplicated;
 *   - a designer's edit to a clinical variable is restored, with the reason
 *     where they will see it.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { hexToFigmaRgb } from "@zoblocks/figma-core";

import { applyPull, readPin } from "../src/sandbox/apply";
import { readFile } from "../src/sandbox/read";
import { previewPull, PIN } from "../src/pull";
import type { ResolvedPayload } from "../src/app";
import { FakeFigma } from "./fake-figma";

const CLINICAL = "Clinical. Carries a validated contrast floor and 60° of hue separation.";

const payload: ResolvedPayload = {
  slug: "clinical",
  name: "Clinical",
  version: 3,
  status: "published",
  ramp: { "600": "#1d63c9", "700": "#1851a5" },
  semantic: {
    // `--zb-accent` is exactly the 700 step, so the plan aliases it rather than
    // flattening — which is what makes the ordering test below meaningful.
    light: { "--zb-accent": "#1851a5", "--zb-text": "#16181d", "--zb-status-critical": "#b4232b" },
    dark: { "--zb-accent": "#5a94e7", "--zb-text": "#e8ecf1", "--zb-status-critical": "#f08b96" },
    "high-contrast": {
      "--zb-accent": "#0f3568",
      "--zb-text": "#000000",
      "--zb-status-critical": "#8c0d16",
    },
  },
  locked: { "--zb-status-critical": CLINICAL },
};

let figma: FakeFigma;

beforeEach(() => {
  figma = new FakeFigma();
});

/** One full pull: read the file, work out the diff, write it. */
async function pull(next: ResolvedPayload = payload) {
  const { snapshot } = await readFile(figma.api());
  const preview = previewPull(next, snapshot);
  const applied = await applyPull(figma.api(), {
    write: [...preview.diff.create, ...preview.diff.update.map((u) => u.variable)],
    pin: { slug: next.slug, version: next.version },
  });
  return { preview, applied };
}

describe("the first pull", () => {
  it("creates the collections the plan needs and nothing else", async () => {
    await pull();
    expect(figma.writes.createdCollections.sort()).toEqual([
      "Zoblocks / Brand",
      "Zoblocks / Semantic",
    ]);
  });

  it("renames the mode Figma gave it rather than leaving a spare", async () => {
    await pull();
    // A new collection arrives with one mode already named by Figma. Adding
    // three beside it leaves a "Mode 1" nobody uses next to three that are.
    expect(figma.writes.addedModes).toEqual([
      "Zoblocks / Semantic/dark",
      "Zoblocks / Semantic/high-contrast",
    ]);
    expect(figma.writes.renamedModes).toEqual([
      "Zoblocks / Brand/Default",
      "Zoblocks / Semantic/light",
    ]);
  });

  it("stamps the Zoblocks token on every variable it creates", async () => {
    await pull();
    expect(figma.variable("--zb-accent")).toBeDefined();
    expect(figma.variable("--zb-ref-brand-700")).toBeDefined();
  });

  it("writes an alias to the brand variable, not a flattened colour", async () => {
    await pull();
    const accent = figma.variable("--zb-accent")!;
    const brand = figma.variable("--zb-ref-brand-700")!;
    const light = Object.values(accent.valuesByMode)[0];

    // Flattened it renders identically and severs the link, so moving the brand
    // stops moving the accent — the problem a token system exists to prevent,
    // rebuilt inside somebody's design file.
    expect(light).toEqual({ type: "VARIABLE_ALIAS", id: brand.id });
  });

  it("puts the reason a clinical variable is fixed in Figma's own field", async () => {
    await pull();
    // Where a designer is actually looking when they wonder why it changed back.
    expect(figma.variable("--zb-status-critical")!.description).toBe(CLINICAL);
  });

  it("pins the theme and version to every collection", async () => {
    await pull();
    const brand = figma.collection("Zoblocks / Brand")!;
    expect(brand.getPluginData(PIN.theme)).toBe("clinical");
    expect(brand.getPluginData(PIN.version)).toBe("3");
    expect(await readPin(figma.api())).toEqual({ slug: "clinical", version: 3 });
  });
});

describe("pulling the same version twice", () => {
  it("writes nothing at all the second time", async () => {
    await pull();
    figma.settle();

    const { preview, applied } = await pull();

    expect(preview.diff.clean).toBe(true);
    expect(applied).toMatchObject({ created: 0, updated: 0 });
    // Not "the values are the same" — no write of any kind. Version history is
    // what a designer opens to see what changed, and churn takes that away.
    expect(figma.total).toBe(0);
  });
});

describe("a designer who edited the file", () => {
  it("updates a renamed variable rather than creating a duplicate", async () => {
    await pull();
    const accent = figma.variable("--zb-accent")!;
    accent.name = "Brand blue";
    figma.settle();

    const { applied } = await pull();

    expect(figma.writes.createdVariables).toEqual([]);
    expect(applied.updated).toBe(1);
    // The identity came from plugin data; the label is restored because it is
    // what keeps a collection navigable.
    expect(figma.variable("--zb-accent")!.name).toBe("accent");
  });

  it("restores a clinical value they changed, and names it", async () => {
    await pull();
    const critical = figma.variable("--zb-status-critical")!;
    const light = figma.collection("Zoblocks / Semantic")!.modes.find((m) => m.name === "light")!;
    critical.setValueForMode(light.modeId, hexToFigmaRgb("#ff00ff")!);
    figma.settle();

    const { preview, applied } = await pull();

    expect(preview.restores).toEqual([{ name: "status/critical", reason: CLINICAL }]);
    expect(applied.restored).toEqual(["status/critical"]);
    expect(critical.valuesByMode[light.modeId]).toEqual(hexToFigmaRgb("#b4232b"));
  });

  it("never deletes a variable that has left the theme", async () => {
    await pull();
    const before = figma.variable("--zb-accent")!;
    figma.settle();

    const shrunk: ResolvedPayload = {
      ...payload,
      semantic: {
        light: { "--zb-text": "#16181d" },
        dark: { "--zb-text": "#e8ecf1" },
        "high-contrast": { "--zb-text": "#000000" },
      },
      locked: {},
    };
    const { preview } = await pull(shrunk);

    expect(preview.diff.orphan.map((o) => o.token)).toContain("--zb-accent");
    // Listed in the preview and left exactly as it was. `api.ts` declares no
    // removal call, so this is structural rather than a decision made here.
    expect(figma.variable("--zb-accent")).toBe(before);
  });

  it("puts back a collection somebody deleted", async () => {
    await pull();
    figma.settle();

    // A fresh file that has the semantic collection and not the brand one is
    // the state after somebody tidies. The next pull should heal it rather than
    // fail at alias resolution with half a write applied.
    const fresh = new FakeFigma();
    fresh.seedCollection("Zoblocks / Semantic", ["light", "dark", "high-contrast"]);
    const { snapshot } = await readFile(fresh.api());
    const preview = previewPull(payload, snapshot);
    await applyPull(fresh.api(), {
      write: [...preview.diff.create, ...preview.diff.update.map((u) => u.variable)],
      pin: { slug: "clinical", version: 3 },
    });

    expect(fresh.writes.createdCollections).toEqual(["Zoblocks / Brand"]);
    expect(fresh.variable("--zb-ref-brand-700")).toBeDefined();
  });
});

describe("moving between versions", () => {
  it("re-pins, and writes only what changed", async () => {
    await pull();
    figma.settle();

    const next: ResolvedPayload = {
      ...payload,
      version: 4,
      semantic: {
        ...payload.semantic,
        light: { ...payload.semantic.light, "--zb-text": "#0b0d11" },
      },
    };
    const { applied } = await pull(next);

    expect(applied).toMatchObject({ created: 0, updated: 1 });
    expect(await readPin(figma.api())).toEqual({ slug: "clinical", version: 4 });
  });

  it("does not re-stamp a pin that has not moved", async () => {
    await pull();
    figma.settle();
    await pull();
    // Plugin data is a write like any other; re-stamping an unchanged pin would
    // put a second pull in the file's history with nothing in it.
    expect(figma.writes.pluginData).toBe(0);
  });
});

describe("the file in states nobody planned for", () => {
  it("skips an alias whose target is missing rather than flattening it", async () => {
    const fresh = new FakeFigma();

    await applyPull(fresh.api(), {
      write: [
        {
          token: "--zb-accent",
          name: "accent",
          tier: "semantic",
          collection: "Zoblocks / Semantic",
          values: {
            // Points at a brand variable that is neither in this write list nor
            // already in the file — the state after somebody deletes one.
            light: { kind: "alias", token: "--zb-ref-brand-700" },
            dark: { kind: "color", hex: "#5a94e7", rgb: hexToFigmaRgb("#5a94e7")! },
          },
        },
      ],
      pin: { slug: "clinical", version: 1 },
    });

    const accent = fresh.variable("--zb-accent")!;
    const modes = fresh.collection("Zoblocks / Semantic")!.modes;
    const light = modes.find((m) => m.name === "light")!.modeId;
    const dark = modes.find((m) => m.name === "dark")!.modeId;

    /*
     * Nothing written for light, rather than the colour the alias resolves to.
     *
     * Writing the hex would silently flatten the tiering the plan went to
     * trouble to express, and it would look entirely correct in the file —
     * which is exactly why it is worth a test rather than a comment.
     */
    expect(accent.valuesByMode[light]).toBeUndefined();
    expect(accent.valuesByMode[dark]).toEqual(hexToFigmaRgb("#5a94e7"));
  });

  it("writes a variable that is not a colour", async () => {
    // Figma collections hold strings and numbers too. The adapter has a branch
    // for each and neither is reachable from a theme today.
    await applyPull(figma.api(), {
      write: [
        {
          token: "--zb-font-family",
          name: "font/family",
          tier: "semantic",
          collection: "Zoblocks / Semantic",
          values: { light: { kind: "string", value: "Inter" } },
        },
        {
          token: "--zb-radius-md",
          name: "radius/md",
          tier: "semantic",
          collection: "Zoblocks / Semantic",
          values: { light: { kind: "number", value: 8 } },
        },
      ],
      pin: { slug: "clinical", version: 1 },
    });

    const family = figma.variable("--zb-font-family")!;
    const radius = figma.variable("--zb-radius-md")!;
    expect(Object.values(family.valuesByMode)).toEqual(["Inter"]);
    expect(Object.values(radius.valuesByMode)).toEqual([8]);
  });

  it("leaves a mode the collection does not have rather than inventing one", async () => {
    const fresh = new FakeFigma();
    // A collection somebody made by hand, with only one mode.
    fresh.seedCollection("Zoblocks / Semantic", ["light"]);

    await applyPull(fresh.api(), {
      write: [
        {
          token: "--zb-text",
          name: "text",
          tier: "semantic",
          collection: "Zoblocks / Semantic",
          values: {
            light: { kind: "color", hex: "#16181d", rgb: hexToFigmaRgb("#16181d")! },
            dark: { kind: "color", hex: "#e8ecf1", rgb: hexToFigmaRgb("#e8ecf1")! },
          },
        },
      ],
      pin: { slug: "clinical", version: 1 },
    });

    // `ensureCollection` adds the missing modes, so both land. What must not
    // happen is a value written against a mode id that does not exist.
    const text = fresh.variable("--zb-text")!;
    for (const modeId of Object.keys(text.valuesByMode)) {
      expect(
        fresh.collection("Zoblocks / Semantic")!.modes.some((m) => m.modeId === modeId),
        modeId,
      ).toBe(true);
    }
  });

  it("writes nothing when the diff is empty, not even a collection", async () => {
    const fresh = new FakeFigma();
    await applyPull(fresh.api(), { write: [], pin: { slug: "clinical", version: 1 } });
    expect(fresh.total).toBe(0);
  });
});

describe("reading the pin back", () => {
  it("finds nothing in a file that has never been pulled", async () => {
    expect(await readPin(new FakeFigma().api())).toBeUndefined();
  });

  it("ignores a collection carrying a version that is not one", async () => {
    const fresh = new FakeFigma();
    const collection = fresh.seedCollection("Zoblocks / Brand", ["Default"]);
    collection.setPluginData(PIN.theme, "clinical");
    collection.setPluginData(PIN.version, "not-a-number");

    // A half-written pin is worse than none: the panel would say "this file is
    // on clinical vNaN".
    expect(await readPin(fresh.api())).toBeUndefined();
  });

  it("ignores a version with no theme beside it", async () => {
    const fresh = new FakeFigma();
    fresh.seedCollection("Zoblocks / Brand", ["Default"]).setPluginData(PIN.version, "3");
    expect(await readPin(fresh.api())).toBeUndefined();
  });
});
