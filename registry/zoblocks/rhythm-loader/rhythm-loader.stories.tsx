/**
 * Stories for Rhythm Loader.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in rhythm-loader.meta.ts.
 * The build asserts the two agree in both directions, so a component cannot
 * claim a state it never demonstrates, and cannot demonstrate one it never
 * declared.
 */

import type { Meta, StoryObj } from "@zoblocks/component-meta";
import { expect, within } from "../../../test/story-kit";
import { RhythmLoader } from "./rhythm-loader";

const meta: Meta<typeof RhythmLoader> = {
  title: "Loaders/Rhythm Loader",
  component: RhythmLoader,
  args: { label: "Loading results" },
};

export default meta;
type Story = StoryObj<typeof RhythmLoader>;

export const Indeterminate: Story = {
  name: "Indeterminate",
  parameters: { state: "Indeterminate" },
  args: { showLabel: true },
  play: async ({ canvasElement }) => {
    // Track, tail, head — three passes over one path. The static track is why
    // the shape never vanishes between beats.
    expect(canvasElement.querySelectorAll("path")).toHaveLength(3);
    expect(canvasElement.querySelector(".zb-loader__beat")).toBeNull();
  },
};

export const Inline: Story = {
  name: "Inline — beside a control",
  parameters: { state: "Inline" },
  args: { size: "sm" },
  render: (args) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
      <RhythmLoader {...args} />
      <span style={{ fontSize: "0.875rem" }}>Checking coverage</span>
    </span>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>("[data-zb-loader]");
    // The stroke stops thinning below 28px so the trace survives at 20px.
    expect(root?.style.getPropertyValue("--zb-loader-stroke")).toBe("2px");
  },
};

export const Delayed: Story = {
  name: "Delayed — not yet shown",
  parameters: {
    state: "Delayed (not yet shown)",
    // Nothing is on screen for the first 400ms by design, so there is no frame
    // worth capturing and nothing for axe to inspect.
    skipVrt: true,
    skipA11y: true,
    a11yReason: "Renders null until the delay elapses — there is no tree to audit.",
  },
  args: { delay: 400 },
  play: async ({ canvasElement }) => {
    // The whole point of `delay`: a fast response must never flash a loader.
    expect(canvasElement.querySelector("[data-zb-loader]")).toBeNull();
  },
};

export const SlowWait: Story = {
  name: "Slow wait",
  parameters: { state: "Slow wait" },
  args: { showLabel: true, slowAfter: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // After the stall the loader stops pretending everything is fine: it names
    // the situation and says what remains possible.
    await canvas.findByText(/Still loading/);
  },
};

export const ReducedMotion: Story = {
  name: "Reduced motion",
  parameters: { state: "Reduced motion" },
  args: { showLabel: true, motion: "reduced" },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector("[data-zb-loader]");
    // Designed, not paused. The CSS does the work; this asserts the hook the
    // CSS keys off is actually set.
    expect(root?.getAttribute("data-zb-motion")).toBe("reduced");
  },
};
