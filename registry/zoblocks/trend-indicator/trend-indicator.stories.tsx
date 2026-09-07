/**
 * Stories for TrendIndicator.
 *
 * `parameters.state` ties each to a state declared in
 * `trend-indicator.meta.ts`, and the build asserts the two agree in both
 * directions.
 *
 * The first two are the argument, and they have to be read together: the same
 * falling shape, one improvement and one deterioration. Every sparkline
 * library draws both in the same colour.
 */

import type { Meta, StoryObj } from "@zoblocks/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { TrendIndicator, type TrendPoint, type TrendSeries } from "./trend-indicator";

const at = (month: number, value: number, breaks?: string): TrendPoint => {
  const point: TrendPoint = { at: `2026-0${month}-04T09:00:00Z`, value };
  if (breaks) point.breaksComparability = breaks;
  return point;
};

const phq9: TrendSeries = {
  id: "phq9",
  label: "PHQ-9",
  valence: "higher-is-worse",
  significantChange: 5,
  referenceRange: { low: 0, high: 4 },
  points: [at(3, 21), at(4, 18), at(5, 14), at(6, 11), at(7, 9)],
};

const meta: Meta<typeof TrendIndicator> = {
  title: "Clinical/Trend Indicator",
  component: TrendIndicator,
  args: { series: phq9 },
};

export default meta;
type Story = StoryObj<typeof TrendIndicator>;

/* ------------------------------------------------------------------ */
/* Valence — the argument                                              */
/* ------------------------------------------------------------------ */

export const FallingAndImproving: Story = {
  name: "Falling, and improving",
  parameters: { state: "Falling, and improving" },
  play: async ({ canvasElement }) => {
    const figure = within(canvasElement).getByRole("figure");
    // Direction and judgement are different facts, and both are spoken.
    expect(figure.getAttribute("aria-label")).toContain("falling, improving");
    expect(figure.getAttribute("data-zb-judgement")).toBe("better");
  },
};

export const RisingAndWorsening: Story = {
  name: "Rising, and worsening",
  parameters: { state: "Rising, and worsening" },
  args: {
    series: {
      id: "cr",
      label: "Creatinine",
      valence: "higher-is-worse",
      unit: "µmol/L",
      points: [at(3, 78), at(4, 84), at(5, 96), at(6, 108), at(7, 121)],
    },
  },
  play: async ({ canvasElement }) => {
    const figure = within(canvasElement).getByRole("figure");
    expect(figure.getAttribute("aria-label")).toContain("rising, worsening");
    // The glyph carries the direction independently of the hue.
    expect(canvasElement.querySelector("[data-zb-direction='rising']")).toBeTruthy();
  },
};

export const Neutral: Story = {
  name: "Neutral valence",
  parameters: { state: "Neutral valence" },
  args: {
    series: {
      id: "wt",
      label: "Weight",
      valence: "neutral",
      unit: "kg",
      points: [at(3, 82), at(4, 81), at(5, 79), at(6, 78), at(7, 77)],
    },
  },
  play: async ({ canvasElement }) => {
    // Weight has no valence without a clinical context the component does not
    // have, so it declines to colour the answer.
    expect(within(canvasElement).getByRole("figure").getAttribute("data-zb-judgement")).toBe(
      "unknown",
    );
  },
};

/* ------------------------------------------------------------------ */
/* Significance                                                        */
/* ------------------------------------------------------------------ */

export const WithinNoise: Story = {
  name: "Within the reliable-change threshold",
  parameters: { state: "Within the reliable-change threshold" },
  args: {
    series: { ...phq9, points: [at(5, 14), at(6, 13), at(7, 12)] },
  },
  play: async ({ canvasElement }) => {
    const figure = within(canvasElement).getByRole("figure");
    // A two-point PHQ-9 move is noise. That is the clinical rule for the
    // instrument, not a visual softening of a real change.
    expect(figure.hasAttribute("data-zb-noise")).toBe(true);
    expect(figure.getAttribute("aria-label")).toContain("within the noise threshold of 5");
  },
};

/* ------------------------------------------------------------------ */
/* Comparability                                                       */
/* ------------------------------------------------------------------ */

export const AssayChange: Story = {
  name: "Broken by an assay change",
  parameters: { state: "Broken by an assay change" },
  args: {
    series: {
      id: "fer",
      label: "Ferritin",
      valence: "neutral",
      unit: "µg/L",
      // Three comparable points before the break, so there is a real trend
      // for the switch to interrupt. Two and two would correctly render no
      // trend at all, which demonstrates a different rule.
      points: [
        at(1, 180),
        at(2, 176),
        at(3, 171),
        at(5, 212, "switched to Roche Elecsys"),
        at(7, 218),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // A lab switching platform shifts every ferritin by 20% with no clinical
    // change at all. Two lines that do not join say so without a legend.
    expect(canvasElement.querySelectorAll(".zb-trend__line")).toHaveLength(2);
    expect(within(canvasElement).getByRole("figure")).toHaveTextContent(
      "switched to Roche Elecsys",
    );
  },
};

export const UnitChange: Story = {
  name: "Broken by a silent unit change",
  parameters: { state: "Broken by a silent unit change" },
  args: {
    series: {
      id: "b12",
      label: "Vitamin B12",
      valence: "higher-is-better",
      unit: "ng/L",
      points: [
        { at: "2026-01-04T09:00:00Z", value: 320, unit: "ng/L" },
        { at: "2026-03-04T09:00:00Z", value: 310, unit: "ng/L" },
        { at: "2026-05-04T09:00:00Z", value: 229, unit: "pmol/L" },
        { at: "2026-07-04T09:00:00Z", value: 240, unit: "pmol/L" },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // Nobody declared this one. An interface feed that starts sending pmol/L
    // is indistinguishable from a real fall unless something compares units.
    expect(within(canvasElement).getByRole("figure")).toHaveTextContent("unit changed to pmol/L");
  },
};

/* ------------------------------------------------------------------ */
/* Too few points                                                      */
/* ------------------------------------------------------------------ */

export const TwoPoints: Story = {
  name: "Two points",
  parameters: { state: "Two points — no trend" },
  args: {
    series: {
      id: "cr2",
      label: "Creatinine",
      valence: "higher-is-worse",
      points: [at(6, 88), at(7, 104)],
    },
  },
  play: async ({ canvasElement }) => {
    // A line between two points is not a trend, it is a rhetorical device.
    expect(canvasElement.querySelector(".zb-trend__chart")).toBeNull();
    expect(within(canvasElement).getByRole("figure")).toHaveTextContent("A trend needs at least 3");
  },
};

export const OnePoint: Story = {
  name: "One point",
  parameters: { state: "One point" },
  args: {
    series: { id: "one", label: "HbA1c", valence: "higher-is-worse", points: [at(7, 52)] },
  },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).getByRole("figure")).toHaveTextContent("One result");
  },
};

export const NoResults: Story = {
  name: "No results",
  parameters: { state: "No results at all" },
  args: { series: { id: "none", label: "TSH", valence: "neutral", points: [] } },
  play: async ({ canvasElement }) => {
    // An absent trend and a trend that did not move are different facts.
    expect(within(canvasElement).getByRole("figure")).toHaveTextContent("No results");
  },
};

/* ------------------------------------------------------------------ */
/* Presentation                                                        */
/* ------------------------------------------------------------------ */

export const ReferenceBand: Story = {
  name: "With a reference band",
  parameters: { state: "With a reference band" },
  args: { width: 160, height: 32 },
  play: async ({ canvasElement }) => {
    // The band is what turns a shape into a judgement, and it sits behind the
    // line rather than competing with it.
    expect(canvasElement.querySelector(".zb-trend__band")).toBeTruthy();
  },
};

export const Narrow: Story = {
  name: "Narrow",
  parameters: { state: "Narrow — glyph and delta only" },
  args: { width: 32 },
  play: async ({ canvasElement }) => {
    // Never an unreadable line: below 40px the glyph and the delta are more
    // honest than a compressed shape.
    expect(canvasElement.querySelector(".zb-trend__chart")).toBeNull();
    expect(canvasElement.querySelector(".zb-trend__readout")).toBeTruthy();
  },
};

export const SixtyPoints: Story = {
  name: "Sixty points",
  parameters: { state: "Sixty points" },
  args: {
    width: 200,
    height: 32,
    series: {
      id: "many",
      label: "Systolic",
      valence: "higher-is-worse",
      unit: "mmHg",
      points: Array.from({ length: 60 }, (_, i) => ({
        at: new Date(Date.UTC(2026, 0, i + 1, 9)).toISOString(),
        value: Math.round(128 + Math.sin(i / 5) * 9 + i * 0.2),
      })),
    },
  },
  play: async ({ canvasElement }) => {
    // One path element, no per-point DOM.
    expect(canvasElement.querySelectorAll(".zb-trend__line")).toHaveLength(1);
    expect(within(canvasElement).getAllByRole("rowheader")).toHaveLength(60);
  },
};

export const SelectablePoints: Story = {
  name: "Points reachable from the table",
  parameters: { state: "Points reachable from the table" },
  render: (args) => <TrendIndicator {...args} onSelectPoint={() => {}} />,
  play: async ({ canvasElement }) => {
    // The hidden table is the alternative representation, and it is where
    // keyboard access to individual points lives.
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button");
    expect(buttons).toHaveLength(phq9.points.length);
    const first = buttons[0];
    if (first) await userEvent.click(first);
  },
};
