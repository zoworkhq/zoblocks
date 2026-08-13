import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Observation } from "@oxygenui-design/fhir";
import { ObservationTrend, buildSeries } from "./observation-trend";

/** A potassium result. Interpretation is stated, never inferred by the chart. */
function potassium(
  value: number | undefined,
  at: string | undefined,
  interpretation?: string,
  range: { low?: number; high?: number } | null = { low: 3.5, high: 5.3 },
  unit = "mmol/L",
): Observation {
  return {
    resourceType: "Observation",
    status: "final",
    code: { text: "Potassium", coding: [{ system: "http://loinc.org", code: "2823-3" }] },
    effectiveDateTime: at,
    valueQuantity: value === undefined ? undefined : { value, unit },
    interpretation: interpretation
      ? [{ coding: [{ code: interpretation }] }]
      : undefined,
    referenceRange: range
      ? [
          {
            low: range.low === undefined ? undefined : { value: range.low, unit },
            high: range.high === undefined ? undefined : { value: range.high, unit },
          },
        ]
      : undefined,
  };
}

/** A glucose result, for testing a series that mixes two different analytes. */
function glucose(value: number, at: string, unit = "mmol/L"): Observation {
  return {
    resourceType: "Observation",
    status: "final",
    code: { text: "Glucose", coding: [{ system: "http://loinc.org", code: "2339-0" }] },
    effectiveDateTime: at,
    valueQuantity: { value, unit },
  };
}

const SERIES = [
  potassium(4.1, "2026-08-01T09:00:00Z"),
  potassium(4.6, "2026-08-02T09:00:00Z"),
  potassium(5.0, "2026-08-03T09:00:00Z"),
  potassium(6.8, "2026-08-04T09:00:00Z", "HH"),
];

describe("buildSeries", () => {
  it("sorts by time regardless of input order", () => {
    const series = buildSeries(
      [
        potassium(6.8, "2026-08-04T09:00:00Z", "HH"),
        potassium(4.1, "2026-08-01T09:00:00Z"),
        potassium(5.0, "2026-08-03T09:00:00Z"),
      ],
      "from-observations",
    );
    expect(series.points.map((p) => p.value)).toEqual([4.1, 5.0, 6.8]);
  });

  /**
   * "Counted rather than silently dropped." A trend built from six of nine
   * results that presents itself as the whole series is worse than no chart.
   */
  it("counts observations with no value instead of dropping them silently", () => {
    const series = buildSeries(
      [...SERIES, potassium(undefined, "2026-08-05T09:00:00Z")],
      "from-observations",
    );
    expect(series.points).toHaveLength(4);
    expect(series.excluded.noValue).toBe(1);
  });

  it("counts observations with no usable time", () => {
    const series = buildSeries([...SERIES, potassium(5.2, undefined)], "from-observations");
    expect(series.points).toHaveLength(4);
    expect(series.excluded.noTime).toBe(1);
  });

  /** The rule inherited from ReferenceRange: no stated bound, nothing drawn. */
  it("draws no band when no observation states a numeric range", () => {
    const series = buildSeries(
      [potassium(4.1, "2026-08-01T09:00:00Z", undefined, null)],
      "from-observations",
    );
    expect(series.band).toBeUndefined();
  });

  it("draws no band when the range is explicitly none, even if one was stated", () => {
    expect(buildSeries(SERIES, "none").band).toBeUndefined();
  });

  it("accepts a one-sided range", () => {
    const series = buildSeries(
      [potassium(4.1, "2026-08-01T09:00:00Z", undefined, { high: 5.3 })],
      "from-observations",
    );
    expect(series.band?.[1]).toBe(5.3);
    expect(Number.isFinite(series.band?.[0] as number)).toBe(false);
  });

  /**
   * A flat series entirely below its band would otherwise scale to itself and
   * lose the context that makes it readable.
   */
  it("extends the scale so the band stays visible when every value is outside it", () => {
    const series = buildSeries(
      [
        potassium(1.1, "2026-08-01T09:00:00Z", "LL"),
        potassium(1.2, "2026-08-02T09:00:00Z", "LL"),
      ],
      "from-observations",
    );
    expect(series.scale[1]).toBeGreaterThanOrEqual(5.3);
  });

  it("preserves reported precision rather than re-rounding", () => {
    const series = buildSeries([potassium(5.1, "2026-08-01T09:00:00Z")], "from-observations");
    expect(series.points[0]?.display).toBe("5.1");
  });

  /**
   * The bug this catches renders perfectly. mg/dL and mmol/L differ by a factor
   * of 18 for glucose, so plotting both against one axis draws a cliff where
   * the real event was a change of unit.
   */
  it("refuses to share an axis across two units", () => {
    const series = buildSeries(
      [
        potassium(4.1, "2026-08-01T09:00:00Z", undefined, null, "mmol/L"),
        potassium(16, "2026-08-02T09:00:00Z", undefined, null, "mg/dL"),
      ],
      "none",
    );
    expect(series.conflict).toEqual({ kind: "unit", values: ["mmol/L", "mg/dL"] });
    expect(series.unit).toBeUndefined();
  });

  it("refuses to share an axis across two codes", () => {
    const series = buildSeries(
      [potassium(4.1, "2026-08-01T09:00:00Z"), glucose(5.4, "2026-08-02T09:00:00Z")],
      "none",
    );
    expect(series.conflict?.kind).toBe("code");
  });

  it("reports no conflict for a well-formed single-analyte series", () => {
    expect(buildSeries(SERIES, "from-observations").conflict).toBeUndefined();
    expect(buildSeries(SERIES, "from-observations").unit).toBe("mmol/L");
  });

  it("does not treat a missing unit on one point as a second unit", () => {
    const noUnit: Observation = {
      resourceType: "Observation",
      status: "final",
      code: { text: "Potassium", coding: [{ system: "http://loinc.org", code: "2823-3" }] },
      effectiveDateTime: "2026-08-05T09:00:00Z",
      valueQuantity: { value: 4.9 },
    };
    const series = buildSeries([...SERIES, noUnit], "from-observations");
    expect(series.conflict).toBeUndefined();
    expect(series.unit).toBe("mmol/L");
  });
});

describe("ObservationTrend", () => {
  it("renders every value in the data table", () => {
    render(<ObservationTrend observations={SERIES} timeZone="UTC" label="Potassium" />);
    // Cells only — the caption repeats the latest value, so a table-wide text
    // query would match it twice and prove nothing about the rows.
    const cells = within(screen.getByRole("table"))
      .getAllByRole("cell")
      .map((cell) => cell.textContent?.trim());

    expect(cells).toEqual(
      expect.arrayContaining(["4.1 mmol/L", "4.6 mmol/L", "5 mmol/L", "6.8 mmol/L"]),
    );
  });

  /**
   * The table is the accessible peer, not a fallback: it is in the
   * accessibility tree whether or not it is visible, and the drawing is not.
   */
  it("keeps the table in the accessibility tree while it is visually hidden", () => {
    render(<ObservationTrend observations={SERIES} timeZone="UTC" />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("hides the drawing from assistive technology", () => {
    const { container } = render(<ObservationTrend observations={SERIES} timeZone="UTC" />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("reveals the table on request", async () => {
    const user = userEvent.setup();
    render(<ObservationTrend observations={SERIES} timeZone="UTC" />);

    const toggle = screen.getByRole("button", { name: /show values/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: /hide values/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  /** "Not interpreted" is never rendered as "Normal". */
  it("labels an uninterpreted result as not interpreted", () => {
    render(
      <ObservationTrend
        observations={[potassium(4.1, "2026-08-01T09:00:00Z", undefined, null)]}
        timeZone="UTC"
      />,
    );
    expect(within(screen.getByRole("table")).getByText("Not interpreted")).toBeInTheDocument();
  });

  it("says so when there is no reference range to draw", () => {
    render(
      <ObservationTrend
        observations={[potassium(4.1, "2026-08-01T09:00:00Z", undefined, null)]}
        timeZone="UTC"
      />,
    );
    expect(screen.getAllByText(/no reference range stated/i).length).toBeGreaterThan(0);
  });

  it("states how many results could not be plotted", () => {
    render(
      <ObservationTrend
        observations={[...SERIES, potassium(undefined, "2026-08-05T09:00:00Z")]}
        timeZone="UTC"
      />,
    );
    expect(screen.getAllByText(/1 with no value/i).length).toBeGreaterThan(0);
  });

  /** Shape, not only hue — the mark must differ for high, low and critical. */
  it("draws a distinct mark shape for each interpretation", () => {
    const { container } = render(
      <ObservationTrend
        observations={[
          potassium(4.1, "2026-08-01T09:00:00Z", "N"),
          potassium(5.9, "2026-08-02T09:00:00Z", "H"),
          potassium(2.9, "2026-08-03T09:00:00Z", "L"),
          potassium(6.8, "2026-08-04T09:00:00Z", "HH"),
        ]}
        timeZone="UTC"
      />,
    );
    // Marks live in their own per-point SVGs, outside the stretched plot layer.
    const marks = container.querySelector("div.relative") as HTMLElement;
    expect(marks.querySelectorAll("span > svg circle").length).toBeGreaterThan(0); // normal
    expect(marks.querySelectorAll("span > svg polygon").length).toBeGreaterThan(0); // high + low
    expect(marks.querySelectorAll("span > svg rect").length).toBeGreaterThan(0); // critical
  });

  it("renders an absence rather than an empty chart when nothing can be plotted", () => {
    render(
      <ObservationTrend
        observations={[potassium(undefined, undefined)]}
        timeZone="UTC"
        label="Potassium"
      />,
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText(/could not be plotted/i)).toBeInTheDocument();
  });

  it("withholds the drawing but keeps every value when units conflict", () => {
    const { container } = render(
      <ObservationTrend
        observations={[
          potassium(4.1, "2026-08-01T09:00:00Z", undefined, null, "mmol/L"),
          potassium(16, "2026-08-02T09:00:00Z", undefined, null, "mg/dL"),
        ]}
        timeZone="UTC"
      />,
    );

    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByRole("note")).toHaveTextContent(/more than one unit/i);

    // The table is still correct, because it carries a unit per row.
    const cells = within(screen.getByRole("table"))
      .getAllByRole("cell")
      .map((cell) => cell.textContent?.trim());
    expect(cells).toEqual(expect.arrayContaining(["4.1 mmol/L", "16 mg/dL"]));
  });

  it("shows the table outright when the drawing was withheld", () => {
    render(
      <ObservationTrend
        observations={[
          potassium(4.1, "2026-08-01T09:00:00Z", undefined, null, "mmol/L"),
          potassium(16, "2026-08-02T09:00:00Z", undefined, null, "mg/dL"),
        ]}
        timeZone="UTC"
      />,
    );
    // Nothing left to toggle — the table is the only representation.
    expect(screen.queryByRole("button", { name: /show values/i })).not.toBeInTheDocument();
    expect(screen.getByRole("table").closest("div")).not.toHaveClass("sr-only");
  });

  it("withholds the drawing when two different analytes are passed", () => {
    const { container } = render(
      <ObservationTrend
        observations={[potassium(4.1, "2026-08-01T09:00:00Z"), glucose(5.4, "2026-08-02T09:00:00Z")]}
        timeZone="UTC"
      />,
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByRole("note")).toHaveTextContent(/more than one code/i);
  });

  /**
   * The shape encoding is the whole accessibility argument, and a viewBox
   * stretched to fit its container destroys it. With preserveAspectRatio="none"
   * and a fixed 600-unit viewBox, a 1038px container scaled x by 1.73: the
   * circle rendered as a 10.4 × 6 ellipse and the critical square as a
   * 15.6 × 9 rectangle. Marks must be drawn at 1:1.
   */
  it("keeps every mark out of the stretched layer so shapes cannot distort", () => {
    const { container } = render(<ObservationTrend observations={SERIES} timeZone="UTC" />);
    const svgs = [...container.querySelectorAll("svg")];
    const stretched = svgs.filter((s) => s.getAttribute("preserveAspectRatio") === "none");

    // Exactly one stretched layer, and it carries only the band and the line.
    expect(stretched).toHaveLength(1);
    const plot = stretched[0] as SVGElement;
    expect(plot.querySelectorAll("circle, polygon, text")).toHaveLength(0);

    // Every mark lives in its own square-viewBox SVG, so it renders at its
    // authored pixel size regardless of how wide the plot behind it stretches.
    const markSvgs = svgs.filter((s) => s !== plot);
    expect(markSvgs.length).toBe(SERIES.length);
    for (const mark of markSvgs) {
      const [, , w, h] = (mark.getAttribute("viewBox") ?? "").split(" ").map(Number);
      expect(w).toBe(h);
      expect(w).toBe(Number(mark.getAttribute("width")));
      expect(h).toBe(Number(mark.getAttribute("height")));
      expect(mark.getAttribute("preserveAspectRatio")).not.toBe("none");
    }
  });

  it("keeps the band and line strokes at constant weight when stretched", () => {
    const { container } = render(<ObservationTrend observations={SERIES} timeZone="UTC" />);
    const plot = container.querySelector('svg[preserveAspectRatio="none"]') as SVGElement;
    for (const stroked of plot.querySelectorAll("rect, polyline")) {
      expect(stroked.getAttribute("vector-effect")).toBe("non-scaling-stroke");
    }
  });

  /** A lone reading has no time extent; left-aligning it implies one. */
  it("centres a single point rather than pinning it to the axis start", () => {
    const { container } = render(
      <ObservationTrend
        observations={[potassium(4.1, "2026-08-01T09:00:00Z")]}
        timeZone="UTC"
      />,
    );
    // Position is carried by the wrapper's percentage offset, not by the mark's
    // own coordinates — the mark SVG is always drawn at its own origin.
    const wrapper = container.querySelector("div.relative > span.absolute") as HTMLElement;
    const left = Number.parseFloat(wrapper.style.left);
    expect(left).toBeGreaterThan(40);
    expect(left).toBeLessThan(60);
  });

  it("positions marks by percentage so they track the stretched plot", () => {
    const { container } = render(<ObservationTrend observations={SERIES} timeZone="UTC" />);
    const wrappers = [...container.querySelectorAll("div.relative > span.absolute")];
    const lefts = wrappers.map((w) => (w as HTMLElement).style.left);

    expect(lefts.length).toBeGreaterThanOrEqual(SERIES.length);
    for (const left of lefts) expect(left).toMatch(/%$/);
    // First point near the left pad, last near the right pad.
    expect(Number.parseFloat(lefts[0] as string)).toBeLessThan(5);
    expect(Number.parseFloat(lefts[SERIES.length - 1] as string)).toBeGreaterThan(95);
  });

  it("does not produce NaN geometry when every value is identical", () => {
    const { container } = render(
      <ObservationTrend
        observations={[
          potassium(4.1, "2026-08-01T09:00:00Z"),
          potassium(4.1, "2026-08-02T09:00:00Z"),
        ]}
        timeZone="UTC"
      />,
    );
    expect(container.querySelector("svg")?.innerHTML).not.toMatch(/NaN/);
  });

  it("does not produce NaN geometry for a one-sided reference range", () => {
    const { container } = render(
      <ObservationTrend
        observations={[
          potassium(4.1, "2026-08-01T09:00:00Z", undefined, { high: 5.3 }),
          potassium(5.9, "2026-08-02T09:00:00Z", "H", { high: 5.3 }),
        ]}
        timeZone="UTC"
      />,
    );
    const svg = container.querySelector("svg")?.innerHTML ?? "";
    expect(svg).not.toMatch(/NaN/);
    expect(svg).not.toMatch(/Infinity/);
  });

  it("marks an imprecise date rather than inventing a day", () => {
    render(
      <ObservationTrend
        observations={[potassium(4.1, "2026-08"), potassium(4.4, "2026-08-04T09:00:00Z")]}
        timeZone="UTC"
      />,
    );
    expect(within(screen.getByRole("table")).getByText(/date imprecise/i)).toBeInTheDocument();
  });
});
