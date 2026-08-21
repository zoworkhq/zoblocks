/**
 * A colour survives the whole journey, or the feature is worthless.
 *
 * The plan names round-trip identity as its first correctness property, and
 * `figma-core` tests the two conversion functions in isolation. This tests the
 * *journey*: an Oxygen hex becomes a plan, becomes floats written into a file,
 * is read back out by the adapter, and has to be the same byte.
 *
 * Colour conversion drifts at the edges — 0 and 255, the values that round
 * across a boundary — and nobody notices until a brand is one value off in a
 * file somebody has since built on. Testing the ends in isolation would not
 * catch an adapter that stored `r` where it meant `g`.
 */

import { describe, expect, it } from "vitest";
import { generateRamp } from "@oxygenui-design/tokens/validate";

import { applyPull } from "../src/sandbox/apply";
import { readFile } from "../src/sandbox/read";
import { previewPull } from "../src/pull";
import { colourAt } from "../src/snapshot";
import type { ResolvedPayload } from "../src/console";
import { FakeFigma } from "./fake-figma";

const THEMES = ["light", "dark", "high-contrast"] as const;

/** Every ramp step, and the values most likely to round wrong. */
const RAMP = generateRamp("#1d63c9")!;
const EDGES = ["#000000", "#ffffff", "#010101", "#fefefe", "#ff0000", "#00ff00", "#0000ff"];

function payloadFor(semantic: Record<string, string>): ResolvedPayload {
  return {
    slug: "clinical",
    name: "Clinical",
    version: 1,
    status: "published",
    ramp: Object.fromEntries(Object.entries(RAMP).map(([k, v]) => [k, v])),
    semantic: Object.fromEntries(THEMES.map((t) => [t, semantic])) as ResolvedPayload["semantic"],
    locked: {},
  };
}

async function pullInto(figma: FakeFigma, payload: ResolvedPayload) {
  const { snapshot } = await readFile(figma.api());
  const preview = previewPull(payload, snapshot);
  await applyPull(figma.api(), {
    write: [...preview.diff.create, ...preview.diff.update.map((u) => u.variable)],
    pin: { slug: payload.slug, version: payload.version },
  });
  return readFile(figma.api());
}

describe("a colour that has been through a file", () => {
  it("comes back as the byte it went in as, for every ramp step", async () => {
    const figma = new FakeFigma();
    const { snapshot } = await pullInto(figma, payloadFor({}));

    for (const [step, hex] of Object.entries(RAMP)) {
      const variable = snapshot.variables.find((v) => v.token === `--ox-ref-brand-${step}`);
      expect(variable, `step ${step}`).toBeDefined();
      expect(colourAt(variable!, "default"), `step ${step}`).toBe(hex);
    }
  });

  it("survives the values that round across a boundary", async () => {
    const figma = new FakeFigma();
    const semantic = Object.fromEntries(EDGES.map((hex, i) => [`--ox-edge-${i}`, hex]));
    const { snapshot } = await pullInto(figma, payloadFor(semantic));

    for (const [i, hex] of EDGES.entries()) {
      const variable = snapshot.variables.find((v) => v.token === `--ox-edge-${i}`)!;
      expect(colourAt(variable, "light"), hex).toBe(hex);
    }
  });

  it("keeps each theme's own value, in every theme", async () => {
    const figma = new FakeFigma();
    const payload: ResolvedPayload = {
      ...payloadFor({}),
      semantic: {
        light: { "--ox-text": "#16181d" },
        dark: { "--ox-text": "#e8ecf1" },
        "high-contrast": { "--ox-text": "#000000" },
      },
    };

    const { snapshot } = await pullInto(figma, payload);
    const text = snapshot.variables.find((v) => v.token === "--ox-text")!;

    // A transposed mode id would leave all three the same colour, or two of
    // them swapped — and both render plausibly.
    expect(colourAt(text, "light")).toBe("#16181d");
    expect(colourAt(text, "dark")).toBe("#e8ecf1");
    expect(colourAt(text, "high-contrast")).toBe("#000000");
  });

  it("is stable across repeated pulls, not merely correct once", async () => {
    const figma = new FakeFigma();
    await pullInto(figma, payloadFor({ "--ox-accent": RAMP[700] }));
    const first = await pullInto(figma, payloadFor({ "--ox-accent": RAMP[700] }));
    const second = await pullInto(figma, payloadFor({ "--ox-accent": RAMP[700] }));

    // Drift that is one value per pull is invisible in a single round trip and
    // obvious after a fortnight of them.
    expect(second.snapshot).toEqual(first.snapshot);
  });

  it("comes back as an alias, not as the colour the alias points at", async () => {
    const figma = new FakeFigma();
    const { snapshot } = await pullInto(figma, payloadFor({ "--ox-accent": RAMP[700] }));
    const accent = snapshot.variables.find((v) => v.token === "--ox-accent")!;

    // Resolving it on the way out would make the next diff compare a literal
    // against an alias and report a change on every pull.
    expect(accent.values.light).toEqual({ kind: "alias", token: "--ox-ref-brand-700" });
  });
});
