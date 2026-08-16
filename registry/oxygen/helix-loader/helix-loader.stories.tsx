/**
 * Stories for Helix Loader.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in helix-loader.meta.ts.
 * The build asserts the two agree in both directions, so a component cannot
 * claim a state it never demonstrates, and cannot demonstrate one it never
 * declared.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, within } from "../../../test/story-kit";
import { HelixLoader } from "./helix-loader";

const meta: Meta<typeof HelixLoader> = {
  title: "Loaders/Helix Loader",
  component: HelixLoader,
  args: { label: "Running the panel" },
};

export default meta;
type Story = StoryObj<typeof HelixLoader>;

export const Indeterminate: Story = {
  name: "Indeterminate",
  parameters: { state: "Indeterminate" },
  args: { showLabel: true },
  play: async ({ canvasElement }) => {
    const dots = canvasElement.querySelectorAll(".ox-loader__dot");
    expect(dots).toHaveLength(18);
    // Depth is faked with scale and opacity, never a 3D transform — those
    // render differently across browsers and cost a layer per dot.
    expect(canvasElement.innerHTML).not.toMatch(/rotate[XY3]|preserve-3d/);
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
