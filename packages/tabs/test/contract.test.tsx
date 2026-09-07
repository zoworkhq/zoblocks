/**
 * The shipped component, held to the published contract.
 *
 * `@zoblocks/tabs-testing` exists so a customer can hold *their* tab
 * strip to this standard. Running it against ours is the part that keeps it
 * honest — an assertion package whose own component does not pass is a
 * recommendation nobody should take.
 *
 * It also closes a gap the rest of the suite has by construction: these
 * assertions read the accessibility tree rather than the props we passed in,
 * so they would catch a regression where the prop is still handled correctly
 * and the DOM stops reflecting it.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describeTabs, expectTabsContract } from "@zoblocks/tabs-testing";
import { Tabs, type TabVariant } from "../src/index.js";

const VARIANTS: TabVariant[] = [
  "segmented",
  "underline",
  "pill",
  "enclosed",
  "rail",
  "ghost",
  "stepper",
  "command",
  "card",
  "stat",
  "unstyled",
];

const items = [
  { value: "summary", label: "Summary", children: <p>Summary</p> },
  { value: "labs", label: "Labs", count: 2, tone: "critical" as const, children: <p>Labs</p> },
  { value: "meds", label: "Medications", count: 9, children: <p>Meds</p> },
];

describe("every variant satisfies the contract", () => {
  it.each(VARIANTS)("%s", (variant) => {
    const { unmount } = render(
      <Tabs
        as="tabs"
        aria-label="Chart sections"
        variant={variant}
        defaultValue="summary"
        items={items}
      />,
    );
    expectTabsContract(screen.getByRole("tablist"));
    unmount();
  });
});

describe("the awkward configurations satisfy it too", () => {
  it("a radiogroup", () => {
    render(
      <Tabs
        as="radiogroup"
        aria-label="Range"
        defaultValue="7d"
        items={[
          { value: "7d", label: "7 days" },
          { value: "30d", label: "30 days" },
        ]}
      />,
    );
    expectTabsContract(screen.getByRole("radiogroup"), { panels: false });
  });

  it("editable tabs, where a close affordance sits inside each trigger", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Open notes"
        variant="enclosed"
        defaultValue="a"
        items={[
          { value: "a", label: "Note A", closable: true, dot: "dirty" },
          { value: "b", label: "Note B", closable: true },
        ]}
        editable={{ onClose: () => {}, onAdd: () => {} }}
      />,
    );
    // The add button must be outside the list, and the close affordance must
    // not be interactive. Both were wrong in an earlier version.
    expectTabsContract(screen.getByRole("tablist"), { panels: false });
  });

  it("a restricted tab", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        defaultValue="summary"
        items={[
          { value: "summary", label: "Summary", children: <p>Summary</p> },
          {
            value: "bh",
            label: "Behavioural health",
            disabled: true,
            disabledReason: "Restricted — request access",
          },
        ]}
      />,
    );
    expectTabsContract(screen.getByRole("tablist"));
  });

  it("a vertical rail", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Settings"
        variant="rail"
        orientation="vertical"
        defaultValue="summary"
        items={items}
      />,
    );
    expectTabsContract(screen.getByRole("tablist"));
  });

  it("still holds after the selection moves", async () => {
    render(<Tabs as="tabs" aria-label="Chart" defaultValue="summary" items={items} />);
    await userEvent.setup().click(screen.getByRole("tab", { name: /Medications/ }));
    // The roving stop has to follow selection, not stay where it started.
    expectTabsContract(screen.getByRole("tablist"));
  });
});

describe("describeTabs", () => {
  it("summarises what a screen reader would work from", () => {
    render(<Tabs as="tabs" aria-label="Chart sections" defaultValue="labs" items={items} />);
    const text = describeTabs(screen.getByRole("tablist"));
    expect(text).toContain('tablist "Chart sections" — 3 item(s)');
    // The announced name, tone word included.
    expect(text).toContain("Labs, 2 critical [selected] [tab stop]");
  });
});
