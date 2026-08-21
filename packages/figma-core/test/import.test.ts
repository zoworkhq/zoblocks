/**
 * Figma variables read back as Oxygen overrides.
 *
 * The failure this guards is quiet and total: a theme that has lost a clinical
 * signal renders correctly, passes every other check, and ships. Severity in
 * this system is carried by a validated contrast floor and 60° of hue
 * separation between *high* and *low*; a designer who nudges one of those in
 * Figma and pushes it back has removed the thing that survives colour-vision
 * deficiency, and nothing downstream would notice.
 *
 * So the refusal is named rather than silent, in the same report shape
 * `importDtcg` already returns — because a designer meeting this should meet
 * the words an app user meets.
 */

import { describe, expect, it } from "vitest";
import { fromVariables, type VariableSnapshot } from "../src/index";
import { CLINICAL } from "./fixture";

const colour = (hex: string) => ({
  kind: "color" as const,
  hex,
  rgb: { r: 0.5, g: 0.5, b: 0.5 },
});

const snapshot: VariableSnapshot = {
  variables: [
    {
      token: "--ox-accent",
      name: "accent",
      collection: "Oxygen / Semantic",
      values: { light: colour("#1851a5") },
    },
    ...CLINICAL.map((token) => ({
      token,
      name: token.replace("--ox-", ""),
      collection: "Oxygen / Semantic",
      values: { light: colour("#b4232b") },
    })),
    {
      name: "somebody else's blue",
      collection: "Local variables",
      values: { light: colour("#0000ff") },
    },
  ],
};

describe("the report a designer gets back", () => {
  it("refuses every clinical token and names each one", () => {
    const report = fromVariables(snapshot, { locked: CLINICAL });

    expect(report.discardedClinical).toEqual([...CLINICAL].sort());
    for (const token of CLINICAL) expect(report.matched).not.toHaveProperty(token);
  });

  it("accepts what a customer may set", () => {
    const report = fromVariables(snapshot, { locked: CLINICAL });
    // The rgb wins over the stored hex — it is what the file actually holds.
    expect(report.matched["--ox-accent"]).toBe("#808080");
  });

  /**
   * A variable with no plugin data is not an Oxygen token.
   *
   * Reported by the label a designer sees rather than dropped, because "we
   * ignored four of your variables" is a thing they need to be able to check
   * against what they expected.
   */
  it("lists what it did not recognise, by the name on screen", () => {
    const report = fromVariables(snapshot, { locked: CLINICAL });
    expect(report.unmatched).toEqual(["somebody else's blue"]);
  });

  it("returns the shape importDtcg returns, so one vocabulary covers both", () => {
    const report = fromVariables(snapshot, { locked: CLINICAL });
    expect(Object.keys(report).sort()).toEqual(["discardedClinical", "matched", "unmatched"]);
  });
});

describe("what it will not turn into a value", () => {
  /**
   * An alias means "whatever that token is" — not a colour this customer chose.
   *
   * Importing its resolved value would turn a link into a literal and flatten
   * the tiering the push direction went to trouble to build, one pull at a time.
   */
  it("skips an alias rather than resolving it to a literal", () => {
    const report = fromVariables(
      {
        variables: [
          {
            token: "--ox-accent",
            name: "accent",
            collection: "Oxygen / Semantic",
            values: { light: { kind: "alias", token: "--ox-ref-brand-700" } },
          },
        ],
      },
      { locked: CLINICAL },
    );

    expect(report.matched).toEqual({});
    // Not "unmatched" either: it is ours and it is understood, it simply
    // carries no value of its own to import.
    expect(report.unmatched).toEqual([]);
  });

  it("skips a variable with nothing in the mode it was asked for", () => {
    const report = fromVariables(
      {
        variables: [
          {
            token: "--ox-accent",
            name: "accent",
            collection: "Oxygen / Semantic",
            values: { dark: colour("#5a94e7") },
          },
        ],
      },
      { locked: CLINICAL, mode: "light" },
    );
    expect(report.matched).toEqual({});
  });

  it("reads the mode it is asked for", () => {
    const report = fromVariables(
      {
        variables: [
          {
            token: "--ox-accent",
            name: "accent",
            collection: "Oxygen / Semantic",
            values: { dark: colour("#5a94e7") },
          },
        ],
      },
      { locked: CLINICAL, mode: "dark" },
    );
    expect(report.matched["--ox-accent"]).toBe("#808080");
  });

  /**
   * With no lock list supplied, nothing is refused — which would be the wrong
   * default in production and is the caller's decision, not this function's.
   * Asserted so that a caller forgetting to pass one is a visible behaviour
   * rather than a silent acceptance of clinical colour.
   */
  it("refuses nothing when given no lock list, and that is the caller's problem", () => {
    const report = fromVariables(snapshot);
    expect(report.discardedClinical).toEqual([]);
    expect(Object.keys(report.matched)).toContain("--ox-status-critical");
  });
});
