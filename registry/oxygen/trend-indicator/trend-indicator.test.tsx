/**
 * TrendIndicator — four claims a sparkline makes without checking.
 *
 * That the points are comparable, that there are enough of them, that the
 * change is real, and that down is good. The suite is organised around the
 * four, because everything else the component does is arithmetic.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DEFAULT_MIN_POINTS,
  TrendIndicator,
  comparableRun,
  describeTrend,
  geometry,
  readTrend,
  segment,
  whyNoTrend,
  type TrendPoint,
  type TrendSeries,
} from "./trend-indicator";

const points = (...values: Array<[string, number, string?]>): TrendPoint[] =>
  values.map(([at, value, breaks]) =>
    breaks ? { at, value, breaksComparability: breaks } : { at, value },
  );

const phq9: TrendSeries = {
  id: "phq9",
  label: "PHQ-9",
  valence: "higher-is-worse",
  significantChange: 5,
  points: points(["2026-05-02", 18], ["2026-06-06", 14], ["2026-07-04", 9]),
};

/* ------------------------------------------------------------------ */
/* Claim 1 — the points are comparable                                 */
/* ------------------------------------------------------------------ */

describe("comparability", () => {
  const ferritin: TrendSeries = {
    id: "fer",
    label: "Ferritin",
    valence: "neutral",
    points: points(
      ["2026-01-04", 180],
      ["2026-03-02", 176],
      ["2026-05-09", 212, "switched to Roche Elecsys"],
      ["2026-07-11", 218],
    ),
  };

  it("splits the series where the assay changed", () => {
    const segments = segment(ferritin);
    expect(segments).toHaveLength(2);
    expect(segments[0]?.points).toHaveLength(2);
    expect(segments[1]?.breakReason).toBe("switched to Roche Elecsys");
  });

  it("detects a silent unit change nobody declared", () => {
    // An interface feed that starts sending pmol/L without saying so is
    // indistinguishable from a real 3.6x rise unless something compares units.
    const series: TrendSeries = {
      id: "b12",
      label: "B12",
      valence: "neutral",
      unit: "ng/L",
      points: [
        { at: "2026-01-04", value: 320, unit: "ng/L" },
        { at: "2026-03-02", value: 310, unit: "ng/L" },
        { at: "2026-05-09", value: 229, unit: "pmol/L" },
      ],
    };
    const segments = segment(series);
    expect(segments).toHaveLength(2);
    expect(segments[1]?.breakReason).toBe("unit changed to pmol/L");
  });

  it("draws one path per comparable segment, never a bridged line", () => {
    // The continuity is the claim, and it is the one that is false.
    const { paths } = geometry(ferritin);
    expect(paths).toHaveLength(2);
  });

  it("measures the delta from the longest comparable run, not end to end", () => {
    const series: TrendSeries = {
      ...ferritin,
      points: points(
        ["2026-01-04", 180],
        ["2026-03-02", 176],
        ["2026-04-02", 174],
        ["2026-05-09", 212, "switched to Roche Elecsys"],
      ),
      minPoints: 3,
    };
    const reading = readTrend(series)!;
    expect(reading.used).toBe(3);
    // 174 - 180, not 212 - 180.
    expect(reading.change).toBe(-6);
  });

  it("says which break stopped the trend", () => {
    const short: TrendSeries = { ...ferritin, minPoints: 4 };
    expect(whyNoTrend(short)).toContain("switched to Roche Elecsys");
    expect(whyNoTrend(short)).toContain("Longest comparable run is 2 of 4");
  });

  it("puts the break reason on the face, not in a tooltip", () => {
    render(<TrendIndicator series={ferritin} />);
    expect(screen.getByRole("figure")).toHaveTextContent("switched to Roche Elecsys");
  });
});

/* ------------------------------------------------------------------ */
/* Claim 2 — there are enough points                                   */
/* ------------------------------------------------------------------ */

describe("minimum points", () => {
  it("defaults to three", () => {
    expect(DEFAULT_MIN_POINTS).toBe(3);
  });

  it("draws no line for two points", () => {
    // A line between two points is not a trend, it is a rhetorical device.
    const two: TrendSeries = {
      id: "cr",
      label: "Creatinine",
      valence: "higher-is-worse",
      points: points(["2026-06-01", 88], ["2026-07-01", 104]),
    };
    const { container } = render(<TrendIndicator series={two} />);
    expect(container.querySelector(".ox-trend__chart")).toBeNull();
    expect(readTrend(two)).toBeNull();
    expect(screen.getByRole("figure")).toHaveTextContent("A trend needs at least 3");
  });

  it("distinguishes no results from a flat trend", () => {
    // An absent trend and a trend that did not move are different facts, and
    // drawing the second for the first is the lie the component refuses.
    expect(whyNoTrend({ id: "x", label: "X", valence: "neutral", points: [] })).toBe("No results.");
    expect(
      whyNoTrend({ id: "x", label: "X", valence: "neutral", points: points(["2026-01-01", 1]) }),
    ).toContain("One result");
  });

  it("honours a caller's own floor", () => {
    expect(readTrend({ ...phq9, minPoints: 4 })).toBeNull();
    expect(readTrend({ ...phq9, minPoints: 2 })).not.toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Claim 3 — the change is real                                        */
/* ------------------------------------------------------------------ */

describe("significance", () => {
  it("renders a sub-threshold move as flat", () => {
    // A two-point PHQ-9 move is noise. That is the clinical rule for the
    // instrument, not a visual softening.
    const quiet: TrendSeries = {
      ...phq9,
      points: points(["2026-05-02", 14], ["2026-06-06", 13], ["2026-07-04", 12]),
    };
    const reading = readTrend(quiet)!;
    expect(reading.withinNoise).toBe(true);
    expect(reading.direction).toBe("flat");
    expect(reading.judgement).toBe("flat");
    // The arithmetic is still reported; only the direction is suppressed.
    expect(reading.change).toBe(-2);
  });

  it("marks the noise state so the colour goes neutral", () => {
    const quiet: TrendSeries = {
      ...phq9,
      points: points(["2026-05-02", 14], ["2026-06-06", 13], ["2026-07-04", 12]),
    };
    render(<TrendIndicator series={quiet} />);
    expect(screen.getByRole("figure").hasAttribute("data-ox-noise")).toBe(true);
  });

  it("lets a supra-threshold move through", () => {
    const reading = readTrend(phq9)!;
    expect(reading.withinNoise).toBe(false);
    expect(reading.direction).toBe("falling");
  });

  it("says the threshold in the sentence when it suppressed a move", () => {
    const quiet: TrendSeries = {
      ...phq9,
      points: points(["2026-05-02", 14], ["2026-06-06", 13], ["2026-07-04", 12]),
    };
    expect(describeTrend(quiet)).toContain("within the noise threshold of 5");
  });
});

/* ------------------------------------------------------------------ */
/* Claim 4 — down is good                                              */
/* ------------------------------------------------------------------ */

describe("valence", () => {
  it("reads a falling PHQ-9 as improvement", () => {
    const reading = readTrend(phq9)!;
    expect(reading.direction).toBe("falling");
    expect(reading.judgement).toBe("better");
  });

  it("reads a falling eGFR as worsening", () => {
    // The same shape, the opposite meaning. A library that colours by
    // direction gets one of these wrong in green.
    const egfr: TrendSeries = {
      id: "egfr",
      label: "eGFR",
      valence: "higher-is-better",
      points: points(["2026-01-01", 74], ["2026-04-01", 61], ["2026-07-01", 52]),
    };
    const reading = readTrend(egfr)!;
    expect(reading.direction).toBe("falling");
    expect(reading.judgement).toBe("worse");
  });

  it("withholds judgement when the caller says neutral", () => {
    const weight: TrendSeries = {
      id: "wt",
      label: "Weight",
      valence: "neutral",
      points: points(["2026-01-01", 82], ["2026-04-01", 80], ["2026-07-01", 77]),
    };
    expect(readTrend(weight)!.judgement).toBe("unknown");
  });

  it("says both the direction and the judgement out loud", () => {
    // They are different facts, and a component that spoke only one would be
    // unreadable for exactly the readers who most need the alternative.
    expect(describeTrend(phq9)).toContain("falling, improving");

    const egfr: TrendSeries = {
      id: "egfr",
      label: "eGFR",
      valence: "higher-is-better",
      points: points(["2026-01-01", 74], ["2026-04-01", 61], ["2026-07-01", 52]),
    };
    expect(describeTrend(egfr)).toContain("falling, worsening");
  });

  it("carries direction as a glyph as well as a hue", () => {
    const { container } = render(<TrendIndicator series={phq9} />);
    expect(container.querySelector("[data-ox-direction='falling']")).toBeTruthy();
    expect(container.querySelector(".ox-trend__delta")).toHaveTextContent("-9");
  });
});

/* ------------------------------------------------------------------ */
/* The text alternative                                                */
/* ------------------------------------------------------------------ */

describe("the text alternative", () => {
  it("emits a real table with every point", () => {
    render(<TrendIndicator series={phq9} />);
    const table = screen.getByRole("table");
    // A caption, column headers and row headers — not a paragraph of
    // comma-separated numbers.
    expect(within(table).getByText("PHQ-9")).toBeTruthy();
    expect(within(table).getAllByRole("columnheader")).toHaveLength(3);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(3);
    for (const point of phq9.points) {
      expect(table).toHaveTextContent(String(point.value));
    }
  });

  it("defers to a host-supplied description", () => {
    render(<TrendIndicator series={phq9} describedBy="elsewhere" />);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("figure").getAttribute("aria-describedby")).toBe("elsewhere");
  });

  it("keeps the svg out of the accessibility tree", () => {
    // The figure carries the name and the table carries the data; an
    // unlabelled graphic between them is noise.
    const { container } = render(<TrendIndicator series={phq9} />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("carries a break reason into the table", () => {
    const ferritin: TrendSeries = {
      id: "fer",
      label: "Ferritin",
      valence: "neutral",
      points: points(["2026-01-04", 180], ["2026-03-02", 176], ["2026-05-09", 212, "new platform"]),
    };
    render(<TrendIndicator series={ferritin} />);
    expect(screen.getByRole("table")).toHaveTextContent("new platform");
  });

  it("offers each point as a button when the host wires selection", async () => {
    const onSelectPoint = vi.fn();
    render(<TrendIndicator series={phq9} onSelectPoint={onSelectPoint} />);
    await userEvent.click(screen.getByRole("button", { name: "14" }));
    expect(onSelectPoint).toHaveBeenCalledWith(1, phq9);
  });
});

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

describe("geometry", () => {
  it("puts sixty points in one path", () => {
    const many: TrendSeries = {
      id: "many",
      label: "Many",
      valence: "neutral",
      points: Array.from({ length: 60 }, (_, i) => ({
        at: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
        value: 100 + Math.sin(i / 4) * 10,
      })),
    };
    const { paths } = geometry(many);
    expect(paths).toHaveLength(1);
    expect(paths[0]?.match(/L/g)).toHaveLength(59);
  });

  it("does not divide by zero on a flat series", () => {
    // Without the guard a flat line renders at the top of the box, which
    // reads as a maximum.
    const flat: TrendSeries = {
      id: "flat",
      label: "Flat",
      valence: "neutral",
      points: points(["2026-01-01", 5], ["2026-02-01", 5], ["2026-03-01", 5]),
    };
    const { paths } = geometry(flat, 64, 20);
    expect(paths[0]).not.toContain("NaN");
    // Mid-box, not pinned to an edge.
    expect(paths[0]).toContain("10.00");
  });

  it("shades the reference band when there is one", () => {
    const band = geometry({ ...phq9, referenceRange: { low: 0, high: 4 } }).band;
    expect(band).toBeTruthy();
    expect(band!.height).toBeGreaterThan(0);
  });

  it("returns an empty geometry for an empty series", () => {
    expect(geometry({ id: "x", label: "X", valence: "neutral", points: [] }).paths).toEqual([]);
  });

  it("drops the line below 40px and keeps the readout", () => {
    // Never an unreadable line: the glyph and the delta are more honest.
    const { container } = render(<TrendIndicator series={phq9} width={32} />);
    expect(container.querySelector(".ox-trend__chart")).toBeNull();
    expect(container.querySelector(".ox-trend__readout")).toBeTruthy();
  });
});

describe("comparableRun", () => {
  it("returns the longest run, not the first", () => {
    const series: TrendSeries = {
      id: "x",
      label: "X",
      valence: "neutral",
      points: points(
        ["2026-01-01", 1],
        ["2026-02-01", 2, "changed"],
        ["2026-03-01", 3],
        ["2026-04-01", 4],
      ),
    };
    expect(comparableRun(series)?.points).toHaveLength(3);
  });

  it("returns null for an empty series", () => {
    expect(comparableRun({ id: "x", label: "X", valence: "neutral", points: [] })).toBeNull();
  });
});
