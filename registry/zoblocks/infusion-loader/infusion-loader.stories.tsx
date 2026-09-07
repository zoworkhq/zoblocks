/**
 * Stories for Infusion Loader.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in infusion-loader.meta.ts.
 * The build asserts the two agree in both directions, so a component cannot
 * claim a state it never demonstrates, and cannot demonstrate one it never
 * declared.
 */

import type { Meta, StoryObj } from "@zoblocks/component-meta";
import { expect, within } from "../../../test/story-kit";
import { InfusionLoader } from "./infusion-loader";

const meta: Meta<typeof InfusionLoader> = {
  title: "Loaders/Infusion Loader",
  component: InfusionLoader,
  args: { label: "Importing records" },
};

export default meta;
type Story = StoryObj<typeof InfusionLoader>;

export const Indeterminate: Story = {
  name: "Indeterminate — the honest unknown",
  parameters: { state: "Indeterminate" },
  args: { showLabel: true, label: "Preparing the export" },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector("[data-zb-loader]");
    // Claims no value at all. A fabricated percentage parked at ninety is
    // worse than a loader that never claimed to know.
    expect(root?.getAttribute("role")).toBe("status");
    expect(root?.hasAttribute("aria-valuenow")).toBe(false);
  },
};

export const Determinate: Story = {
  name: "Determinate — a real measurement",
  parameters: { state: "Determinate (0–100)" },
  args: { showLabel: true, progress: 42 },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector("[role='progressbar']");
    expect(root?.getAttribute("aria-valuenow")).toBe("42");
    expect(root?.getAttribute("aria-valuetext")).toBe("42 percent");
    // The name comes from the label a sighted reader sees, so the two cannot
    // disagree.
    const id = root?.getAttribute("aria-labelledby") ?? "";
    expect(canvasElement.querySelector(`#${CSS.escape(id)}`)?.textContent).toBe(
      "Importing records",
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
