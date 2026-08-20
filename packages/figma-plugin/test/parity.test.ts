/**
 * One palette, one answer.
 *
 * This is the phase's actual acceptance criterion, and it is worth being
 * precise about what it claims. It does not assert that two implementations
 * agree — there is only one implementation, which is the point. It asserts that
 * the number this panel puts in front of a designer is the number that appears
 * in the message the publish gate would print, and the number the conformance
 * table publishes, for the same colours.
 *
 * A designer told 4.62:1 in Figma and 3.98:1 in the console will believe
 * whichever is more convenient, and they will be right to, because one of them
 * is wrong.
 */

import { describe, expect, it } from "vitest";
import {
  DENSITIES,
  THEMES,
  checkStatusContrast,
  checkTextContrast,
  measureContrast,
  type DensityName,
  type Theme,
  type TokenMap,
  type TokenProblem,
  type TokenSource,
} from "@oxygenui-design/tokens/validate";

import { runGate } from "../src/gate";
import { oxygenFile, PASSING } from "./fixture";

const OXYGEN = "Oxygen / Semantic";

function map(entries: Record<string, string>): TokenMap {
  const out: TokenMap = new Map();
  for (const [path, value] of Object.entries(entries)) out.set(path, { path, value, file: "test" });
  return out;
}

/**
 * The same palette the plugin reads, as the token source the gate reads.
 *
 * Every theme gets the same values, so a difference in the output is a
 * difference in the floors rather than a difference in the colours. Only the
 * light theme's problems are compared; the others exist because
 * `checkTextContrast` walks all three and an absent theme would throw.
 */
function sourceFor(values: Record<string, string>): TokenSource {
  const semantic = Object.fromEntries(
    THEMES.map((theme) => [
      theme,
      map(
        Object.fromEntries(
          Object.entries(values).map(([k, v]) => [
            k.replace("--ox-", "").replace(/^(status|flag)-/, "$1."),
            v,
          ]),
        ),
      ),
    ]),
  ) as Record<Theme, TokenMap>;

  return {
    primitive: map({}),
    shared: map({}),
    semantic,
    density: Object.fromEntries(DENSITIES.map((d) => [d, map({})])) as Record<
      DensityName,
      TokenMap
    >,
    densityRoot: map({}),
    component: map({}),
    brands: [],
  };
}

function gateProblems(values: Record<string, string>): TokenProblem[] {
  const problems: TokenProblem[] = [];
  const source = sourceFor(values);
  checkTextContrast(source, problems);
  checkStatusContrast(source, problems);
  return problems.filter((p) => p.message.includes('theme "light"'));
}

describe("the plugin and the publish gate", () => {
  it("agree that the shipped palette passes", () => {
    const report = runGate(oxygenFile(), { collection: OXYGEN, figmaMode: "light" });
    expect(report.readings.filter((r) => !r.passes)).toEqual([]);
    expect(gateProblems(PASSING)).toEqual([]);
  });

  it("print the same ratio for the same failing pair", () => {
    const broken = { ...PASSING, "--ox-text-muted": "#a8b0bb" };
    const report = runGate(oxygenFile({ "--ox-text-muted": "#a8b0bb" }), {
      collection: OXYGEN,
      figmaMode: "light",
    });

    const reading = report.readings.find((r) => r.fg === "text-muted" && r.bg === "bg")!;
    expect(reading.passes).toBe(false);

    const message = gateProblems(broken).find((p) => p.message.startsWith("text-muted on bg"))!;
    expect(message).toBeDefined();
    // The gate prints `ratio.toFixed(2)`; the panel prints the same. If either
    // side ever rounds differently, this is where it shows up.
    expect(message.message).toContain(`${reading.ratio.toFixed(2)}:1`);
    expect(message.message).toContain(`below the ${reading.floor}:1 floor`);
    expect(message.message).toContain(reading.criterion);
  });

  it("agree on which pairs fail, not merely on how many", () => {
    const broken = {
      ...PASSING,
      "--ox-text-muted": "#a8b0bb",
      "--ox-focus-ring": "#cfd8e3",
      "--ox-status-critical": "#e88c90",
    };

    const failing = runGate(oxygenFile(broken), { collection: OXYGEN, figmaMode: "light" })
      .readings.filter((r) => !r.passes)
      .map((r) => `${r.fg} on ${r.bg}`)
      .sort();

    const named = gateProblems(broken).map((p) => p.message);

    expect(failing.length).toBeGreaterThan(0);
    for (const pair of failing) {
      const [fg] = pair.split(" on ");
      expect(named.some((m) => m.startsWith(`${fg} `) || m.startsWith(`${fg}.`))).toBe(true);
    }
    // And nothing the gate objects to is missing from the panel.
    for (const message of named) {
      const subject = message.split(" ")[0]!;
      expect(failing.some((pair) => pair.startsWith(subject))).toBe(true);
    }
  });

  it("holds a status colour to the floor `checkStatusContrast` holds it to", () => {
    const broken = { ...PASSING, "--ox-status-critical": "#e88c90" };
    const report = runGate(oxygenFile(broken), { collection: OXYGEN, figmaMode: "light" });
    const reading = report.readings.find((r) => r.fg === "status.critical")!;

    const message = gateProblems(broken).find((p) => p.message.startsWith("status.critical"))!;
    expect(message.message).toContain(`${reading.ratio.toFixed(2)}:1`);
    expect(message.message).toContain(`below the ${reading.floor}:1 floor`);
  });

  it("uses the same hue-separation wording the gate uses", () => {
    const broken = { ...PASSING, "--ox-status-high": "#8a1c22", "--ox-status-low": "#a02216" };
    const report = runGate(oxygenFile(broken), { collection: OXYGEN, figmaMode: "light" });
    const gate = gateProblems(broken).find((p) => p.message.includes("apart in hue"))!;

    expect(gate).toBeDefined();
    expect(report.findings[0]!.message).toBe(gate.message);
  });
});

describe("the plugin and the published conformance table", () => {
  it("report the same ratio and the same floor for every pair both cover", () => {
    const report = runGate(oxygenFile(), { collection: OXYGEN, figmaMode: "light" });
    const published = measureContrast(sourceFor(PASSING)).filter((r) => r.theme === "light");

    let compared = 0;
    for (const reading of report.readings) {
      const match = published.find((p) => p.token === reading.fg && p.against === reading.bg);
      if (!match) continue;
      compared += 1;
      expect(match.ratio, `${reading.fg} on ${reading.bg}`).toBe(reading.ratio);
      expect(match.floor, `${reading.fg} on ${reading.bg}`).toBe(reading.floor);
    }

    // Guards the assertion above against passing vacuously: every pair the
    // panel showed should have been found in the published table.
    expect(compared).toBe(report.readings.length);
  });
});
