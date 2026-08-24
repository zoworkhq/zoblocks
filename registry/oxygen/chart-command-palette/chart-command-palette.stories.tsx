/**
 * Stories for ChartCommandPalette.
 *
 * `parameters.state` ties each to a state declared in
 * `chart-command-palette.meta.ts`, and the build asserts the two agree in both
 * directions.
 *
 * The story that carries the argument is "Out-of-scope patients, counted". A
 * palette that autocompletes across the whole patient index has created a
 * compliance problem at the speed of thought; a count has not.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import { ChartCommandPalette, type PaletteItem } from "./chart-command-palette";

const items: PaletteItem[] = [
  {
    id: "phq",
    kind: "action",
    label: "Start PHQ-9",
    detail: "Assessment · 9 items · 4 min",
    keywords: ["depression screen"],
  },
  { id: "safety", kind: "action", label: "Open safety plan", detail: "Reviewed 12 Aug" },
  { id: "collateral", kind: "action", label: "Log a collateral contact" },
  {
    id: "order",
    kind: "action",
    label: "Order lithium level",
    detail: "Serum · trough",
    argument: { label: "when" },
  },
  { id: "stop", kind: "action", label: "Discontinue lithium", significant: true },
  { id: "sign", kind: "action", label: "Sign note", unavailable: { reason: "Offline" } },
  { id: "phq-doc", kind: "chart-resource", label: "PHQ-9 result, 12 Aug", detail: "Score 14" },
  { id: "p-mine", kind: "patient", label: "A. Okonkwo", detail: "093-441-208" },
  { id: "p-other-1", kind: "patient", label: "A. Okonjo", detail: "093-118-774" },
  { id: "p-other-2", kind: "patient", label: "A. Okoro", detail: "093-772-115" },
  { id: "theme", kind: "setting", label: "Appearance and theme" },
  { id: "shortcuts", kind: "help", label: "Keyboard shortcuts" },
];

const scope = { inScope: new Set(["p-mine"]), breakGlass: true };

const meta: Meta<typeof ChartCommandPalette> = {
  title: "Clinical/Chart Command Palette",
  component: ChartCommandPalette,
  args: { open: true, items, scope },
};

export default meta;
type Story = StoryObj<typeof ChartCommandPalette>;

/* ------------------------------------------------------------------ */
/* Scope — the argument                                                */
/* ------------------------------------------------------------------ */

export const OutOfScopeCounted: Story = {
  name: "Out-of-scope patients, counted",
  parameters: { state: "Out-of-scope patients, counted" },
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("combobox"), "oko");

    // The one relationship is named; the other two are a number.
    expect(canvasElement.textContent).toContain("A. Okonkwo");
    expect(canvasElement.textContent).not.toContain("A. Okonjo");
    expect(canvasElement.textContent).toContain("2 further matches");
  },
};

export const BreakGlassUnavailable: Story = {
  name: "Break-glass unavailable to this role",
  parameters: { state: "Break-glass unavailable to this role" },
  args: { scope: { inScope: new Set(["p-mine"]) } },
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("combobox"), "oko");
    // Still counted. What changes is whether there is a way through.
    expect(canvasElement.textContent).toContain("not available to your role");
  },
};

/* ------------------------------------------------------------------ */
/* Ranking                                                             */
/* ------------------------------------------------------------------ */

export const Empty: Story = {
  name: "Empty, before anything is typed",
  parameters: { state: "Empty, before anything is typed" },
  play: async ({ canvasElement }) => {
    // Nothing is searched and nothing is counted — a withheld total here
    // would disclose the size of the index.
    expect(canvasElement.textContent).toContain("Type to search");
    expect(canvasElement.textContent).not.toContain("further matches");
  },
};

export const ActionsFirst: Story = {
  name: "Actions ranked above records",
  parameters: { state: "Actions ranked above records" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox"), "phq");

    const options = canvas.getAllByRole("option");
    // The verb, not the document. A palette that gets this backwards has
    // stopped being a command palette.
    expect(options[0]?.textContent).toContain("Start PHQ-9");
  },
};

export const Grouped: Story = {
  name: "Grouped results",
  parameters: { state: "Grouped results" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox"), "o");

    const groups = canvas.getAllByRole("group");
    expect(groups.length).toBeGreaterThan(1);
    expect(groups[0]?.getAttribute("aria-label")).toBe("Actions");
  },
};

export const FrequencyWeighting: Story = {
  name: "Frequency weighting",
  parameters: { state: "Frequency weighting" },
  args: {
    items: [
      { id: "cold", kind: "action", label: "Sign note", detail: "Never used" },
      { id: "warm", kind: "action", label: "Sign note", detail: "Used often", frequency: 9 },
    ],
    scope: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox"), "sign");
    // Frequency breaks a tie inside a group. It never crosses one.
    expect(canvas.getAllByRole("option")[0]?.textContent).toContain("Used often");
  },
};

/* ------------------------------------------------------------------ */
/* Running                                                             */
/* ------------------------------------------------------------------ */

export const AwaitingArgument: Story = {
  name: "A verb waiting for its argument",
  parameters: { state: "A verb waiting for its argument" },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("combobox") as HTMLInputElement;
    await userEvent.type(input, "order lith");
    await userEvent.tab();
    // Tab accepts the verb and keeps the palette open until it has its object.
    expect(input.value).toBe("Order lithium level ");
  },
};

export const SignificantFirstEnter: Story = {
  name: "A significant action, first Enter",
  parameters: { state: "A significant action, first Enter" },
  args: { onRun: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox"), "discontinue");
    await userEvent.keyboard("{Enter}");
    // The confirmation is a row in the palette, not a modal that takes the
    // keyboard away from the surface built for it.
    expect(canvasElement.textContent).toContain("Press Enter again to confirm");
  },
};

export const Unavailable: Story = {
  name: "An action that cannot run",
  parameters: { state: "An action that cannot run" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox"), "sign note");

    const option = canvas.getByRole("option", { name: /Sign note/ });
    // Shown with its reason rather than hidden: an action that vanishes
    // teaches somebody the feature does not exist.
    expect(option.getAttribute("aria-disabled")).toBe("true");
    expect(option.textContent).toContain("Offline");
  },
};

export const NothingMatches: Story = {
  name: "Nothing matches",
  parameters: { state: "Nothing matches" },
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("combobox"), "zzzzz");
    expect(canvasElement.textContent).toContain("Nothing matches");
  },
};

/* ------------------------------------------------------------------ */
/* Keyboard, and closed                                                */
/* ------------------------------------------------------------------ */

export const KeyboardNavigation: Story = {
  name: "Keyboard navigation",
  parameters: { state: "Keyboard navigation" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox");

    await userEvent.type(input, "o");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");

    // Focus never leaves the field a person is typing into.
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-activedescendant")).toBeTruthy();
  },
};

export const Unscoped: Story = {
  name: "Every match named, with no scope",
  parameters: { state: "Every match named, with no scope" },
  args: { scope: undefined },
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("combobox"), "oko");
    // Read against "Out-of-scope patients, counted": this is what every other
    // palette does, and it is a privacy event before any chart is opened.
    expect(canvasElement.textContent).toContain("A. Okonjo");
    expect(canvasElement.textContent).not.toContain("further matches");
  },
};
