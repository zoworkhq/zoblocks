/**
 * Keyboard behaviour, end to end through the real components.
 *
 * The core has unit tests for the intent arithmetic; these prove the wiring —
 * that focus actually moves, that the roving tab stop follows, and that manual
 * activation really does decouple focus from selection.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "../src/index.js";

const items = [
  { value: "summary", label: "Summary", children: <p>Summary panel</p> },
  { value: "vitals", label: "Vitals", children: <p>Vitals panel</p> },
  { value: "labs", label: "Labs", children: <p>Labs panel</p> },
];

function setup(props: Partial<React.ComponentProps<typeof Tabs>> = {}) {
  const onChange = vi.fn();
  render(
    <Tabs
      as="tabs"
      aria-label="Chart"
      defaultValue="summary"
      items={items}
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange, user: userEvent.setup() };
}

describe("arrow keys", () => {
  it("moves and selects the next tab", async () => {
    const { user } = setup();
    await user.tab();
    expect(screen.getByRole("tab", { name: "Summary" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Vitals" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Vitals" })).toHaveAttribute("aria-selected", "true");
  });

  it("moves backwards", async () => {
    const { user } = setup({ defaultValue: "labs" });
    await user.tab();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Vitals" })).toHaveFocus();
  });

  it("wraps around both ends", async () => {
    const { user } = setup({ defaultValue: "labs" });
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Summary" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Labs" })).toHaveFocus();
  });

  it("Home and End jump to the ends", async () => {
    const { user } = setup({ defaultValue: "vitals" });
    await user.tab();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Labs" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Summary" })).toHaveFocus();
  });

  it("uses the block axis when vertical, and ignores the inline one", async () => {
    const { user } = setup({ orientation: "vertical" });
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Summary" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("tab", { name: "Vitals" })).toHaveFocus();
  });

  it("reports the source as keyboard", async () => {
    const { user, onChange } = setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("vitals", { via: "keyboard" });
  });

  it("does not hijack arrows in nav mode", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="nav"
        aria-label="Settings"
        defaultValue="a"
        onChange={onChange}
        items={[
          { value: "a", label: "Account", href: "/a" },
          { value: "b", label: "Billing", href: "/b" },
        ]}
      />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("the tab key", () => {
  it("enters at the selected tab and leaves the group entirely", async () => {
    const { user } = setup({ defaultValue: "vitals" });
    await user.tab();
    expect(screen.getByRole("tab", { name: "Vitals" })).toHaveFocus();
    await user.tab();
    // One stop for the whole strip: the next Tab lands on the panel, not on
    // the third tab.
    expect(screen.getByRole("tab", { name: "Labs" })).not.toHaveFocus();
  });

  it("moves the tab stop with the selection", async () => {
    const { user } = setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Summary" }).tabIndex).toBe(-1);
    expect(screen.getByRole("tab", { name: "Vitals" }).tabIndex).toBe(0);
  });
});

describe("activation modes", () => {
  it("automatic selects as focus moves", async () => {
    const { user, onChange } = setup({ activation: "automatic" });
    await user.tab();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    // Two moves, two selections — which is exactly why `manual` exists for
    // panels that fetch.
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("manual moves focus without selecting until Enter", async () => {
    const { user, onChange } = setup({ activation: "manual" });
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Vitals" })).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Summary" })).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("vitals", { via: "keyboard" });
  });

  it("manual also activates on Space", async () => {
    const { user, onChange } = setup({ activation: "manual" });
    await user.tab();
    await user.keyboard("{ArrowRight}");
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith("vitals", { via: "keyboard" });
  });
});

describe("typeahead", () => {
  it("jumps to the next tab starting with the typed letter", async () => {
    const { user } = setup();
    await user.tab();
    await user.keyboard("l");
    expect(screen.getByRole("tab", { name: "Labs" })).toHaveFocus();
  });

  it("cycles through tabs sharing an initial", async () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Docs"
        defaultValue="a"
        items={[
          { value: "a", label: "Labs" },
          { value: "b", label: "Ledger" },
          { value: "c", label: "Letters" },
        ]}
      />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("l");
    expect(screen.getByRole("tab", { name: "Ledger" })).toHaveFocus();
    await user.keyboard("l");
    expect(screen.getByRole("tab", { name: "Letters" })).toHaveFocus();
  });

  it("does nothing when nothing matches", async () => {
    const { user } = setup();
    await user.tab();
    await user.keyboard("z");
    expect(screen.getByRole("tab", { name: "Summary" })).toHaveFocus();
  });

  it("does not treat Space as a search", async () => {
    const { user, onChange } = setup({ activation: "manual" });
    await user.tab();
    await user.keyboard(" ");
    // Space activated rather than searching for a tab beginning with a space.
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Summary" })).toHaveFocus();
  });
});

describe("disabled triggers", () => {
  const withDisabled = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Bravo", disabled: true, disabledReason: "Not yet available" },
    { value: "c", label: "Charlie" },
  ];

  it("arrow keys land on a disabled tab so it can be discovered", async () => {
    render(<Tabs as="tabs" aria-label="Letters" defaultValue="a" items={withDisabled} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Bravo/ })).toHaveFocus();
  });

  it("but selection does not follow onto it", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Letters"
        defaultValue="a"
        items={withDisabled}
        onChange={onChange}
      />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
  });

  it("clicking a disabled tab does nothing", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Letters"
        defaultValue="a"
        items={withDisabled}
        onChange={onChange}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Bravo/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("emits an audit event so a restricted-access attempt is recorded", async () => {
    const onAuditEvent = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        defaultValue="a"
        onAuditEvent={onAuditEvent}
        items={[
          { value: "a", label: "Summary" },
          {
            value: "bh",
            label: "Behavioural health",
            disabled: true,
            disabledReason: "Restricted",
            availability: "unavailable",
          },
        ]}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: /Behavioural health/ }));
    expect(onAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "tabs.restricted-attempt",
        value: "bh",
        detail: "Restricted",
      }),
    );
  });
});

describe("radiogroup keyboard", () => {
  it("arrows move and check", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="radiogroup"
        aria-label="Range"
        defaultValue="7d"
        onChange={onChange}
        items={[
          { value: "7d", label: "7 days" },
          { value: "30d", label: "30 days" },
        ]}
      />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "30 days" })).toHaveAttribute("aria-checked", "true");
    expect(onChange).toHaveBeenCalledWith("30d", { via: "keyboard" });
  });
});

describe("pointer selection", () => {
  it("reports the source as pointer", async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByRole("tab", { name: "Labs" }));
    expect(onChange).toHaveBeenCalledWith("labs", { via: "pointer" });
  });

  it("does not re-fire for the already-selected tab", async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByRole("tab", { name: "Summary" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
