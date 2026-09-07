/**
 * Stories for Breath Loader.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in breath-loader.meta.ts.
 * The build asserts the two agree in both directions, so a component cannot
 * claim a state it never demonstrates, and cannot demonstrate one it never
 * declared.
 */

import type { Meta, StoryObj } from "@zoblocks/component-meta";
import { expect, within } from "../../../test/story-kit";
import { BreathLoader } from "./breath-loader";

const meta: Meta<typeof BreathLoader> = {
  title: "Loaders/Breath Loader",
  component: BreathLoader,
  args: { label: "Loading your information" },
};

export default meta;
type Story = StoryObj<typeof BreathLoader>;

export const Indeterminate: Story = {
  name: "Indeterminate",
  parameters: { state: "Indeterminate" },
  args: { showLabel: true },
  play: async ({ canvasElement }) => {
    // Three rings a third of a cycle apart, so the field never empties.
    expect(canvasElement.querySelectorAll(".zb-loader__ring")).toHaveLength(3);
    expect(canvasElement.querySelectorAll("path")).toHaveLength(0);
  },
};

export const WithBrandMark: Story = {
  name: "With a brand mark in the core",
  parameters: { state: "With a brand mark in the core" },
  render: (args) => (
    <BreathLoader {...args} size={120}>
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9" />
      </svg>
    </BreathLoader>
  ),
  play: async ({ canvasElement }) => {
    // The mark replaces the core rather than sitting behind it, and stays
    // inside the aria-hidden art so a logo never becomes a second announcement.
    expect(canvasElement.querySelector(".zb-loader__mark")).not.toBeNull();
    expect(canvasElement.querySelector(".zb-loader__core")).toBeNull();
    expect(canvasElement.querySelector(".zb-loader__art")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
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
