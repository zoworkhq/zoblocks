/**
 * Stories for Timeline.
 *
 * The primitive has no clinical opinion, so these are about parity: an antd
 * call site, written antd's way, rendering the same tree here. The last one is
 * deliberately written in Ant Design v5's spellings, because "migrates by
 * changing one import" is a claim and this is where it gets checked.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, within } from "../../../test/story-kit";
import { Timeline } from "./timeline";

const RELEASES = [
  { key: "0.4.0", title: "0.4.0", content: "Timeline and CareTimeline." },
  { key: "0.3.0", title: "0.3.0", content: "Switch, Tabs, ChartAccordion." },
  { key: "0.2.0", title: "0.2.0", content: "Signature and Identity." },
  { key: "0.1.0", title: "0.1.0", content: "Five loaders." },
];

const meta: Meta<typeof Timeline> = {
  title: "Data Display/Timeline",
  component: Timeline,
  args: { "aria-label": "Release history", items: RELEASES },
};

export default meta;
type Story = StoryObj<typeof Timeline>;

export const Vertical: Story = {
  name: "Vertical, the default",
  parameters: { state: "Vertical, the default" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // An ordered list, named, with role="list" stated so Safari keeps the
    // semantics after list-style: none.
    const list = canvas.getByRole("list", { name: "Release history" });
    expect(list.tagName).toBe("OL");
    expect(list.getAttribute("role")).toBe("list");
    expect(canvas.getAllByRole("listitem")).toHaveLength(4);
  },
};

export const Alternate: Story = {
  name: "Alternate, items on both sides",
  parameters: { state: "Alternate, items on both sides" },
  args: { mode: "alternate" },
  play: async ({ canvasElement }) => {
    const items = [...canvasElement.querySelectorAll("li")];
    // Sides alternate, and the modifier is on the item rather than computed in
    // a media query, so the layout can collapse without losing the placement.
    expect(items[0]?.className).toContain("ox-timeline__item--end");
    expect(items[1]?.className).toContain("ox-timeline__item--start");
  },
};

export const Horizontal: Story = {
  name: "Horizontal",
  parameters: { state: "Horizontal" },
  args: { orientation: "horizontal" },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("ol")?.className).toContain("ox-timeline--horizontal");
  },
};

export const Variants: Story = {
  name: "Filled and outlined variants",
  parameters: { state: "Filled and outlined variants" },
  render: () => (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <Timeline aria-label="Outlined" variant="outlined" items={RELEASES.slice(0, 2)} />
      <Timeline aria-label="Filled" variant="filled" items={RELEASES.slice(0, 2)} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelectorAll(".ox-timeline--outlined")).toHaveLength(1);
    expect(canvasElement.querySelectorAll(".ox-timeline--filled")).toHaveLength(1);
  },
};

export const CustomIcons: Story = {
  name: "Custom node icons",
  parameters: { state: "Custom node icons" },
  args: {
    items: RELEASES.map((release) => ({
      ...release,
      icon: <span aria-hidden="true">◆</span>,
    })),
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent).toContain("◆");
  },
};

export const Colours: Story = {
  name: "Preset and custom node colours",
  parameters: { state: "Preset and custom node colours" },
  args: {
    items: [
      { key: "a", title: "blue", content: "The default preset.", color: "blue" },
      { key: "b", title: "red", content: "Maps to the critical token.", color: "red" },
      { key: "c", title: "green", content: "Maps to the normal token.", color: "green" },
      { key: "d", title: "custom", content: "Any CSS colour passes through.", color: "#7c3aed" },
    ],
  },
  play: async ({ canvasElement }) => {
    // The presets resolve to semantic tokens rather than palette values, so a
    // brand override reaches them. A custom colour is passed through as given.
    const nodes = [...canvasElement.querySelectorAll<HTMLElement>(".ox-timeline__node")];
    expect(nodes[0]?.style.color).toContain("--ox-accent");
    expect(nodes[3]?.style.color).toBe("rgb(124, 58, 237)");
  },
};

export const Loading: Story = {
  name: "A loading node",
  parameters: { state: "A loading node" },
  args: {
    items: [
      { key: "next", title: "0.5.0", content: "In progress.", loading: true },
      ...RELEASES.slice(0, 2),
    ],
  },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-loading]")).not.toBeNull();
  },
};

export const Reversed: Story = {
  name: "Reversed",
  parameters: { state: "Reversed" },
  args: { reverse: true },
  play: async ({ canvasElement }) => {
    const first = canvasElement.querySelector("li");
    // antd's own Timeline computes `current` after reversing, so the oldest
    // item ends up with a dotted "in progress" rail. There is no current here,
    // so reversing only reverses.
    expect(first?.textContent).toContain("0.1.0");
    expect(canvasElement.querySelector("[data-loading]")).toBeNull();
  },
};

export const LegacyProps: Story = {
  name: "Ant Design v5 prop names, still accepted",
  parameters: { state: "Ant Design v5 prop names, still accepted" },
  args: {
    mode: "left",
    items: [
      {
        key: "a",
        label: "0.4.0",
        children: "label and children, as v5 spelled them.",
        dot: <span aria-hidden="true">●</span>,
      },
      { key: "b", label: "0.3.0", children: "position instead of placement.", position: "right" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The claim in the component's own doc comment: an antd v5 call site
    // compiles and renders unchanged.
    await canvas.findByText("0.4.0");
    await canvas.findByText("label and children, as v5 spelled them.");
    expect(canvasElement.querySelector("ol")?.className).toContain("ox-timeline--start");
    expect(canvasElement.querySelectorAll("li")[1]?.className).toContain("ox-timeline__item--end");
  },
};
