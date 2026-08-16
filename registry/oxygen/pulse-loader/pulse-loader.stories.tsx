/**
 * Stories for Pulse Loader.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in pulse-loader.meta.ts.
 * The build asserts the two agree in both directions, so a component cannot
 * claim a state it never demonstrates, and cannot demonstrate one it never
 * declared.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, within } from "../../../test/story-kit";
import { PulseLoader, PageLoader } from "./pulse-loader";

const meta: Meta<typeof PulseLoader> = {
  title: "Loaders/Pulse Loader",
  component: PulseLoader,
  args: { label: "Loading your records" },
};

export default meta;
type Story = StoryObj<typeof PulseLoader>;

export const Indeterminate: Story = {
  name: "Indeterminate — the signature wait",
  parameters: { state: "Indeterminate" },
  args: { showLabel: true },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector("[data-ox-loader]");
    expect(root?.getAttribute("role")).toBe("status");
    expect(root?.getAttribute("aria-live")).toBe("polite");
    // The heart is drawn as two open arcs so the rhythm line can pass through
    // the gap. A closed outline would be a valentine.
    expect(canvasElement.querySelectorAll(".ox-loader__draw")).toHaveLength(2);
  },
};

export const BelowFortyPixels: Story = {
  name: "Below 40px — renders as Rhythm",
  parameters: { state: "Below 40px (renders as Rhythm Loader)" },
  args: { size: 24 },
  play: async ({ canvasElement }) => {
    // Not a fallback: the correct drawing of this mark at this size. The heart
    // collapses into a smudge, and a smudge is not a brand.
    const root = canvasElement.querySelector("[data-ox-loader]");
    expect(root?.getAttribute("data-ox-loader")).toBe("rhythm");
  },
};

export const PagePreset: Story = {
  name: "PageLoader preset",
  parameters: { state: "Indeterminate" },
  render: (args) => <PageLoader {...args} mode="overlay" />,
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
    expect(canvasElement.querySelector("[data-ox-loader]")).toBeNull();
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
    const root = canvasElement.querySelector("[data-ox-loader]");
    // Designed, not paused. The CSS does the work; this asserts the hook the
    // CSS keys off is actually set.
    expect(root?.getAttribute("data-ox-motion")).toBe("reduced");
  },
};
