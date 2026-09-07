/**
 * axe, across the cross-product that matters.
 *
 * Worth being explicit about the limit of this file: axe cannot catch the
 * defect this component exists to prevent. A `role="tablist"` wrapped around
 * anchors passes every rule here, because every individual attribute is
 * spelled correctly — it is the *claim* that is wrong. That failure is caught
 * by `validateTabsConfig` and by `@zoblocks/tabs-semantic-mode`, and the tests
 * for it live elsewhere.
 *
 * What axe does catch is the ordinary regression: a name that went missing, a
 * dangling `aria-controls`, a nested interactive element.
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import { Tabs, type TabVariant } from "../src/index.js";

async function scan(container: HTMLElement) {
  const results = await axe.run(container, {
    // Colour contrast needs a real stylesheet and a real layout engine; it is
    // checked in the Playwright suite instead of guessed at here.
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}

const items = [
  { value: "summary", label: "Summary", children: <p>Summary content</p> },
  {
    value: "labs",
    label: "Labs",
    count: 2,
    tone: "critical" as const,
    children: <p>Labs content</p>,
  },
  { value: "meds", label: "Medications", count: 9, children: <p>Meds content</p> },
];

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

describe("axe — every variant", () => {
  it.each(VARIANTS)("%s is clean", async (variant) => {
    const { container, unmount } = render(
      <Tabs
        as="tabs"
        aria-label="Chart sections"
        variant={variant}
        defaultValue="summary"
        items={items}
      />,
    );
    expect(await scan(container)).toEqual([]);
    unmount();
  });
});

describe("axe — every semantic mode", () => {
  it("tabs", async () => {
    const { container } = render(
      <Tabs as="tabs" aria-label="Chart" defaultValue="summary" items={items} />,
    );
    expect(await scan(container)).toEqual([]);
  });

  it("nav", async () => {
    const { container } = render(
      <Tabs
        as="nav"
        aria-label="Settings"
        defaultValue="account"
        items={[
          { value: "account", label: "Account", href: "/account" },
          { value: "billing", label: "Billing", href: "/billing" },
        ]}
      />,
    );
    expect(await scan(container)).toEqual([]);
  });

  it("radiogroup", async () => {
    const { container } = render(
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
    expect(await scan(container)).toEqual([]);
  });

  it("steps", async () => {
    const { container } = render(
      <Tabs
        as="steps"
        aria-label="Intake"
        defaultValue="identity"
        items={[
          { value: "identity", label: "Identity", state: "done" },
          { value: "consent", label: "Consent", state: "current" },
          {
            value: "review",
            label: "Review",
            state: "locked",
            disabled: true,
            disabledReason: "Complete the previous step first",
          },
        ]}
      />,
    );
    expect(await scan(container)).toEqual([]);
  });
});

describe("axe — the awkward configurations", () => {
  it("vertical orientation", async () => {
    const { container } = render(
      <Tabs
        as="tabs"
        aria-label="Settings"
        variant="rail"
        orientation="vertical"
        defaultValue="summary"
        items={items}
      />,
    );
    expect(await scan(container)).toEqual([]);
  });

  it("editable tabs, where a close affordance sits inside role=tab", async () => {
    const { container } = render(
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
    expect(await scan(container)).toEqual([]);
  });

  it("a restricted tab with a reason", async () => {
    const { container } = render(
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
            disabledReason: "Restricted — opening records an access event",
            availability: "unavailable",
          },
        ]}
      />,
    );
    expect(await scan(container)).toEqual([]);
  });

  it("icon-only triggers named by aria-label", async () => {
    const { container } = render(
      <Tabs
        as="radiogroup"
        aria-label="Layout"
        variant="command"
        defaultValue="list"
        items={[
          { value: "list", label: <span aria-hidden="true">≡</span>, textLabel: "List view" },
          { value: "grid", label: <span aria-hidden="true">▦</span>, textLabel: "Grid view" },
        ]}
      />,
    );
    expect(await scan(container)).toEqual([]);
  });

  it("a panel with focusable content", async () => {
    const { container } = render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        defaultValue="a"
        items={[{ value: "a", label: "A", children: <button type="button">Inside</button> }]}
      />,
    );
    expect(await scan(container)).toEqual([]);
  });

  it("an eagerly-mounted set, where hidden panels are in the DOM", async () => {
    const { container } = render(
      <Tabs as="tabs" aria-label="Chart" mount="eager" defaultValue="summary" items={items} />,
    );
    expect(await scan(container)).toEqual([]);
  });
});
