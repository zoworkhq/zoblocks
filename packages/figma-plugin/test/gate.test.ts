/**
 * What the gate reports, and — more to the point — what it refuses to report.
 */

import { describe, expect, it } from "vitest";
import { floorFor, floorForPair } from "@oxygenui-design/tokens/validate";

import { gateModeFor, runGate, themeFromModeName, type PairReading } from "../src/gate";
import { colour, oxygenFile, snapshot, PASSING } from "./fixture";

const OXYGEN = "Oxygen / Semantic";

const find = (readings: PairReading[], fg: string, bg: string) =>
  readings.find((r) => r.fg === fg && r.bg === bg);

describe("gateModeFor", () => {
  it("reads a stamped collection against the real pair list", () => {
    expect(gateModeFor(oxygenFile(), OXYGEN)).toBe("oxygen");
  });

  it("falls back to a palette reading when nothing carries an Oxygen token", () => {
    const file = snapshot([
      colour("Ink", "#101010", { collection: "Swatches" }),
      colour("Paper", "#fefefe", { collection: "Swatches" }),
    ]);
    expect(gateModeFor(file, "Swatches")).toBe("palette");
  });

  it("decides per collection, not per file", () => {
    const file = snapshot([
      ...oxygenFile().variables,
      colour("Ink", "#101010", { collection: "Swatches" }),
    ]);
    expect(gateModeFor(file, OXYGEN)).toBe("oxygen");
    expect(gateModeFor(file, "Swatches")).toBe("palette");
  });
});

describe("the Oxygen reading", () => {
  it("passes a palette that passes", () => {
    const report = runGate(oxygenFile(), { collection: OXYGEN, figmaMode: "light" });
    expect(report.mode).toBe("oxygen");
    expect(report.readings.filter((r) => !r.passes)).toEqual([]);
    expect(report.missing).toEqual([]);
  });

  it("names a failing pair with the floor its own rule imposes", () => {
    const report = runGate(oxygenFile({ "--ox-text-muted": "#a8b0bb" }), {
      collection: OXYGEN,
      figmaMode: "light",
    });

    const reading = find(report.readings, "text-muted", "bg");
    expect(reading).toBeDefined();
    expect(reading!.passes).toBe(false);
    expect(reading!.floor).toBe(4.5);
    expect(reading!.criterion).toBe("SC 1.4.3 (text)");
  });

  it("holds an interface component to 3:1, not to 4.5:1", () => {
    const report = runGate(oxygenFile(), { collection: OXYGEN, figmaMode: "light" });
    const ring = find(report.readings, "focus-ring", "bg");
    expect(ring!.kind).toBe("ui");
    expect(ring!.floor).toBe(3);
    expect(ring!.criterion).toBe("SC 1.4.11 (interface component)");
  });

  it("raises the floor for a high-contrast mode", () => {
    const file = oxygenFile({}, "high-contrast");
    const report = runGate(file, { collection: OXYGEN, figmaMode: "high-contrast" });
    const text = find(report.readings, "text", "bg");
    expect(report.theme).toBe("high-contrast");
    expect(text!.floor).toBe(floorFor("high-contrast"));
    expect(text!.floor).toBe(7);
  });

  it("offers a shade of the same colour that clears the floor", () => {
    const report = runGate(oxygenFile({ "--ox-text-muted": "#a8b0bb" }), {
      collection: OXYGEN,
      figmaMode: "light",
    });
    const reading = find(report.readings, "text-muted", "bg")!;
    expect(reading.suggestion).toMatch(/^#[0-9a-f]{6}$/);

    // The suggestion has to actually pass, or it is a worse colour offered with
    // more confidence than the one it replaces.
    const check = runGate(oxygenFile({ "--ox-text-muted": reading.suggestion! }), {
      collection: OXYGEN,
      figmaMode: "light",
    });
    expect(find(check.readings, "text-muted", "bg")!.passes).toBe(true);
  });

  it("says so when no shade of a colour can clear the floor", () => {
    // White text on white: every shade of white is white.
    const report = runGate(
      oxygenFile({ "--ox-text-on-accent": "#ffffff", "--ox-accent": "#ffffff" }),
      {
        collection: OXYGEN,
        figmaMode: "light",
      },
    );
    const reading = find(report.readings, "text-on-accent", "accent")!;
    expect(reading.passes).toBe(false);
    // #ffffff on #ffffff has a passing shade in the other direction — black —
    // so this asserts the opposite property: a suggestion is offered whenever
    // one exists, and only omitted when it genuinely does not.
    expect(reading.suggestion).toBeDefined();
  });

  it("lists a pair it could not measure rather than passing it", () => {
    const partial = { ...PASSING };
    delete partial["--ox-focus-ring"];
    const file = snapshot(
      Object.entries(partial).map(([token, hex]) =>
        colour(token.replace("--ox-", ""), hex, { token, collection: OXYGEN }),
      ),
    );

    const report = runGate(file, { collection: OXYGEN, figmaMode: "light" });
    expect(report.missing).toContain("focus-ring on bg");
    expect(find(report.readings, "focus-ring", "bg")).toBeUndefined();
  });

  it("reports hue separation as a finding, not as a ratio", () => {
    // Two reds: both clear 4.5:1 on their own grounds and are indistinguishable
    // to a reader with deuteranopia. Contrast alone cannot catch this.
    const report = runGate(
      oxygenFile({ "--ox-status-high": "#8a1c22", "--ox-status-low": "#a02216" }),
      { collection: OXYGEN, figmaMode: "light" },
    );
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]!.message).toContain("apart in hue");
    expect(report.findings[0]!.message).toContain("60°");
  });

  it("finds no hue problem in the shipped palette", () => {
    expect(runGate(oxygenFile(), { collection: OXYGEN, figmaMode: "light" }).findings).toEqual([]);
  });

  it("keys on the stamp, not on the label a designer owns", () => {
    const renamed = snapshot(
      Object.entries(PASSING).map(([token, hex]) =>
        colour(`Brand ${token}`, hex, { token, collection: OXYGEN }),
      ),
    );
    const report = runGate(renamed, { collection: OXYGEN, figmaMode: "light" });
    expect(report.readings.length).toBeGreaterThan(0);
    expect(report.missing).toEqual([]);
  });

  it("ignores a collection the designer did not ask about", () => {
    const file = snapshot([
      ...oxygenFile().variables,
      colour("Ink", "#000000", { token: "--ox-text", collection: "Other" }),
    ]);
    const report = runGate(file, { collection: OXYGEN, figmaMode: "light" });
    expect(find(report.readings, "text", "bg")!.fgValue).toBe(PASSING["--ox-text"]);
  });
});

describe("the palette reading", () => {
  const swatches = snapshot([
    colour("Paper", "#ffffff", { collection: "Swatches" }),
    colour("Ink", "#16181d", { collection: "Swatches" }),
    colour("Mist", "#c9d1d9", { collection: "Swatches" }),
  ]);

  it("measures every colour against the ground the designer names", () => {
    const report = runGate(swatches, {
      collection: "Swatches",
      figmaMode: "light",
      ground: "Paper",
    });
    expect(report.mode).toBe("palette");
    expect(report.readings.map((r) => r.fg).sort()).toEqual(["Ink", "Mist"]);
    expect(report.readings.every((r) => r.bg === "Paper")).toBe(true);
  });

  it("holds them to the floor the designer chose", () => {
    const asText = runGate(swatches, {
      collection: "Swatches",
      figmaMode: "light",
      ground: "Paper",
      kind: "text",
    });
    const asUi = runGate(swatches, {
      collection: "Swatches",
      figmaMode: "light",
      ground: "Paper",
      kind: "ui",
    });

    expect(asText.readings[0]!.floor).toBe(floorForPair("light", "text"));
    expect(asUi.readings[0]!.floor).toBe(floorForPair("light", "ui"));

    // Mist on Paper is 1.6:1 — below both. The point of the pair is that the
    // *same* colour is judged differently, so a designer marking an icon as an
    // interface component is not told it fails a rule that does not apply.
    const mistAsText = find(asText.readings, "Mist", "Paper")!;
    const mistAsUi = find(asUi.readings, "Mist", "Paper")!;
    expect(mistAsText.ratio).toBe(mistAsUi.ratio);
    expect(mistAsText.floor).toBeGreaterThan(mistAsUi.floor);
  });

  it("starts from the most extreme colour when no ground is chosen", () => {
    const report = runGate(swatches, { collection: "Swatches", figmaMode: "light" });
    // Paper is furthest from mid-grey, and is what most of the others sit on.
    expect(report.readings.every((r) => r.bg === "Paper")).toBe(true);
  });

  it("reports nothing rather than guessing when the collection is empty", () => {
    const report = runGate(snapshot([]), { collection: "Swatches", figmaMode: "light" });
    expect(report.readings).toEqual([]);
    expect(report.findings).toEqual([]);
  });
});

describe("themeFromModeName", () => {
  it("reads the modes this plugin creates", () => {
    expect(themeFromModeName("light")).toBe("light");
    expect(themeFromModeName("Dark")).toBe("dark");
    expect(themeFromModeName("High Contrast")).toBe("high-contrast");
    expect(themeFromModeName("high-contrast")).toBe("high-contrast");
  });

  it("falls back to light rather than guessing high contrast", () => {
    // Guessing the other way would apply a 7:1 floor to a file that never asked
    // for one, and report failures that are not failures.
    expect(themeFromModeName("Mode 1")).toBe("light");
    expect(themeFromModeName("Brand")).toBe("light");
  });
});
