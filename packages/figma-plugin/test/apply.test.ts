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
import { hexToFigmaRgb } from "@oxygenui-design/figma-core";

import { applyPull, readPin } from "../src/sandbox/apply";
import { readFile } from "../src/sandbox/read";
import { previewPull, PIN } from "../src/pull";
import type { ResolvedPayload } from "../src/console";
import { FakeFigma } from "./fake-figma";

const CLINICAL = "Clinical. Carries a validated contrast floor and 60° of hue separation.";

const payload: ResolvedPayload = {
  slug: "clinical",
  name: "Clinical",
  version: 3,
  status: "published",
  ramp: { "600": "#1d63c9", "700": "#1851a5" },
  semantic: {
    // `--ox-accent` is exactly the 700 step, so the plan aliases it rather than
    // flattening — which is what makes the ordering test below meaningful.
    light: { "--ox-accent": "#1851a5", "--ox-text": "#16181d", "--ox-status-critical": "#b4232b" },
    dark: { "--ox-accent": "#5a94e7", "--ox-text": "#e8ecf1", "--ox-status-critical": "#f08b96" },
    "high-contrast": {
      "--ox-accent": "#0f3568",
      "--ox-text": "#000000",
      "--ox-status-critical": "#8c0d16",
    },
  },
  locked: { "--ox-status-critical": CLINICAL },
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
    expect(figma.writes.createdCollections.sort()).toEqual(["Oxygen / Brand", "Oxygen / Semantic"]);
  });

  it("renames the mode Figma gave it rather than leaving a spare", async () => {
    await pull();
    // A new collection arrives with one mode already named by Figma. Adding
    // three beside it leaves a "Mode 1" nobody uses next to three that are.
    expect(figma.writes.addedModes).toEqual([
      "Oxygen / Semantic/dark",
      "Oxygen / Semantic/high-contrast",
    ]);
    expect(figma.writes.renamedModes).toEqual([
      "Oxygen / Brand/Default",
      "Oxygen / Semantic/light",
    ]);
  });

  it("stamps the Oxygen token on every variable it creates", async () => {
    await pull();
    expect(figma.variable("--ox-accent")).toBeDefined();
    expect(figma.variable("--ox-ref-brand-700")).toBeDefined();
  });

  it("writes an alias to the brand variable, not a flattened colour", async () => {
    await pull();
    const accent = figma.variable("--ox-accent")!;
    const brand = figma.variable("--ox-ref-brand-700")!;
    const light = Object.values(accent.valuesByMode)[0];

    // Flattened it renders identically and severs the link, so moving the brand
    // stops moving the accent — the problem a token system exists to prevent,
    // rebuilt inside somebody's design file.
    expect(light).toEqual({ type: "VARIABLE_ALIAS", id: brand.id });
  });

  it("puts the reason a clinical variable is fixed in Figma's own field", async () => {
    await pull();
    // Where a designer is actually looking when they wonder why it changed back.
    expect(figma.variable("--ox-status-critical")!.description).toBe(CLINICAL);
  });

  it("pins the theme and version to every collection", async () => {
    await pull();
    const brand = figma.collection("Oxygen / Brand")!;
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
    const accent = figma.variable("--ox-accent")!;
    accent.name = "Brand blue";
    figma.settle();

    const { applied } = await pull();

    expect(figma.writes.createdVariables).toEqual([]);
    expect(applied.updated).toBe(1);
    // The identity came from plugin data; the label is restored because it is
    // what keeps a collection navigable.
    expect(figma.variable("--ox-accent")!.name).toBe("accent");
  });

  it("restores a clinical value they changed, and names it", async () => {
    await pull();
    const critical = figma.variable("--ox-status-critical")!;
    const light = figma.collection("Oxygen / Semantic")!.modes.find((m) => m.name === "light")!;
    critical.setValueForMode(light.modeId, hexToFigmaRgb("#ff00ff")!);
    figma.settle();

    const { preview, applied } = await pull();

    expect(preview.restores).toEqual([{ name: "status/critical", reason: CLINICAL }]);
    expect(applied.restored).toEqual(["status/critical"]);
    expect(critical.valuesByMode[light.modeId]).toEqual(hexToFigmaRgb("#b4232b"));
  });

  it("never deletes a variable that has left the theme", async () => {
    await pull();
    const before = figma.variable("--ox-accent")!;
    figma.settle();

    const shrunk: ResolvedPayload = {
      ...payload,
      semantic: {
        light: { "--ox-text": "#16181d" },
        dark: { "--ox-text": "#e8ecf1" },
        "high-contrast": { "--ox-text": "#000000" },
      },
      locked: {},
    };
    const { preview } = await pull(shrunk);

    expect(preview.diff.orphan.map((o) => o.token)).toContain("--ox-accent");
    // Listed in the preview and left exactly as it was. `api.ts` declares no
    // removal call, so this is structural rather than a decision made here.
    expect(figma.variable("--ox-accent")).toBe(before);
  });

  it("puts back a collection somebody deleted", async () => {
    await pull();
    figma.settle();

    // A fresh file that has the semantic collection and not the brand one is
    // the state after somebody tidies. The next pull should heal it rather than
    // fail at alias resolution with half a write applied.
    const fresh = new FakeFigma();
    fresh.seedCollection("Oxygen / Semantic", ["light", "dark", "high-contrast"]);
    const { snapshot } = await readFile(fresh.api());
    const preview = previewPull(payload, snapshot);
    await applyPull(fresh.api(), {
      write: [...preview.diff.create, ...preview.diff.update.map((u) => u.variable)],
      pin: { slug: "clinical", version: 3 },
    });

    expect(fresh.writes.createdCollections).toEqual(["Oxygen / Brand"]);
    expect(fresh.variable("--ox-ref-brand-700")).toBeDefined();
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
        light: { ...payload.semantic.light, "--ox-text": "#0b0d11" },
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
