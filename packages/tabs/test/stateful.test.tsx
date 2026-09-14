/**
 * Gates, editing, and the states a clinical surface actually hits.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "../src/index.js";

const base = [
  { value: "compose", label: "Compose", children: <p>Editor</p> },
  { value: "preview", label: "Preview", children: <p>Preview</p> },
];

describe("onBeforeChange", () => {
  it("commits when the guard allows", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Note"
        defaultValue="compose"
        items={base}
        onChange={onChange}
        onBeforeChange={() => true}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Preview" }));
    expect(onChange).toHaveBeenCalledWith("preview", { via: "pointer" });
  });

  it("vetoes and leaves selection where it was", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Note"
        defaultValue="compose"
        items={base}
        onChange={onChange}
        onBeforeChange={() => false}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Preview" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Compose" })).toHaveAttribute("aria-selected", "true");
  });

  it("records the veto as an audit event", async () => {
    const onAuditEvent = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Note"
        defaultValue="compose"
        items={base}
        onAuditEvent={onAuditEvent}
        onBeforeChange={() => false}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Preview" }));
    await waitFor(() =>
      expect(onAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: "tabs.change-vetoed", value: "preview" }),
      ),
    );
  });

  it("goes inert while an async guard is unresolved, then commits", async () => {
    let resolve!: (allowed: boolean) => void;
    render(
      <Tabs
        as="tabs"
        aria-label="Note"
        defaultValue="compose"
        items={base}
        onBeforeChange={() => new Promise<boolean>((r) => (resolve = r))}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Preview" }));

    // aria-busy is the announced half of "the strip is thinking".
    await waitFor(() => expect(screen.getByRole("tablist")).toHaveAttribute("aria-busy", "true"));

    resolve(true);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Preview" })).toHaveAttribute("aria-selected", "true"),
    );
    expect(screen.getByRole("tablist")).not.toHaveAttribute("aria-busy");
  });

  it("an async veto restores the strip without changing selection", async () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Note"
        defaultValue="compose"
        items={base}
        onBeforeChange={() => Promise.resolve(false)}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Preview" }));
    await waitFor(() => expect(screen.getByRole("tablist")).not.toHaveAttribute("aria-busy"));
    expect(screen.getByRole("tab", { name: "Compose" })).toHaveAttribute("aria-selected", "true");
  });

  it("receives the previous value", async () => {
    const guard = vi.fn(() => true);
    render(
      <Tabs
        as="tabs"
        aria-label="Note"
        defaultValue="compose"
        items={base}
        onBeforeChange={guard}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Preview" }));
    expect(guard).toHaveBeenCalledWith("preview", "compose");
  });

  it("reads the guard's current closure, so a note that became dirty after mount blocks", async () => {
    function Note() {
      const [dirty, setDirty] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setDirty(true)}>
            Type
          </button>
          <Tabs
            as="tabs"
            aria-label="Note"
            defaultValue="compose"
            items={base}
            onBeforeChange={() => !dirty}
          />
        </>
      );
    }
    render(<Note />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Type" }));
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByRole("tab", { name: "Compose" })).toHaveAttribute("aria-selected", "true");
  });

  it("honours a guard added after mount", async () => {
    const props = {
      as: "tabs",
      "aria-label": "Note",
      defaultValue: "compose",
      items: base,
    } as const;
    const { rerender } = render(<Tabs {...props} />);
    rerender(<Tabs {...props} onBeforeChange={() => false} />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByRole("tab", { name: "Compose" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("steps", () => {
  const steps = [
    { value: "identity", label: "Identity", state: "done" as const },
    { value: "insurance", label: "Insurance", state: "current" as const },
    {
      value: "review",
      label: "Review",
      state: "locked" as const,
      disabled: true,
      disabledReason: "Complete the previous step first",
    },
  ];

  it("allows going back to a completed step — locking those forces a restart to fix a typo", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="steps"
        aria-label="Intake"
        defaultValue="insurance"
        items={steps}
        onChange={onChange}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: "Identity" }));
    expect(onChange).toHaveBeenCalledWith("identity", { via: "pointer" });
  });

  it("blocks a locked step ahead", async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        as="steps"
        aria-label="Intake"
        defaultValue="insurance"
        items={steps}
        onChange={onChange}
      />,
    );
    await userEvent.setup().click(screen.getByRole("tab", { name: /Review/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("still announces the locked step and why", () => {
    render(<Tabs as="steps" aria-label="Intake" defaultValue="insurance" items={steps} />);
    const locked = screen.getByRole("tab", { name: /Review/ });
    expect(locked).toHaveAttribute("aria-disabled", "true");
    expect(locked).toHaveAccessibleDescription("Complete the previous step first");
  });
});

describe("editable tabs", () => {
  function Editable({ onClose }: { onClose?: (value: string) => void } = {}) {
    const [items, setItems] = React.useState([
      { value: "a", label: "Note A", closable: true },
      { value: "b", label: "Note B", closable: true },
      { value: "c", label: "Note C", closable: true },
    ]);
    const [value, setValue] = React.useState("a");
    return (
      <Tabs
        as="tabs"
        aria-label="Open notes"
        variant="enclosed"
        value={value}
        onChange={(next) => setValue(next)}
        items={items}
        editable={{
          onClose: (target) => {
            onClose?.(target);
            setItems((current) => current.filter((item) => item.value !== target));
            if (value === target) {
              const index = items.findIndex((item) => item.value === target);
              const rest = items.filter((item) => item.value !== target);
              setValue((rest[index] ?? rest[rest.length - 1])?.value ?? "");
            }
          },
          onAdd: () => {
            const next = `n${items.length}`;
            setItems((current) => [
              ...current,
              { value: next, label: `Note ${next}`, closable: true },
            ]);
            setValue(next);
          },
        }}
      />
    );
  }

  it("renders a close affordance that is not interactive to assistive technology", () => {
    render(<Editable />);
    const tab = screen.getByRole("tab", { name: "Note A" });
    const close = tab.querySelector(".zb-tabs__close");
    // Any interactive control inside role="tab" is invalid ARIA — axe calls it
    // `nested-interactive`, and screen readers resolve it by flattening the tab
    // or skipping the control. The pointer keeps a target; the keyboard uses
    // Delete on the tab itself, which is what APG prescribes.
    expect(close?.tagName).toBe("SPAN");
    expect(close).toHaveAttribute("aria-hidden", "true");
    expect(close).not.toHaveAttribute("role");
    expect(close).not.toHaveAttribute("tabindex");
  });

  it("closes on click without selecting the tab underneath", async () => {
    const onClose = vi.fn();
    render(<Editable onClose={onClose} />);
    const tab = screen.getByRole("tab", { name: "Note B" });
    await userEvent.setup().click(tab.querySelector(".zb-tabs__close") as HTMLElement);
    expect(onClose).toHaveBeenCalledWith("b");
    expect(screen.queryByRole("tab", { name: "Note B" })).not.toBeInTheDocument();
  });

  it("closes with Delete on the tab itself, which is what APG prescribes", async () => {
    const onClose = vi.fn();
    render(<Editable onClose={onClose} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{Delete}");
    expect(onClose).toHaveBeenCalledWith("a");
  });

  it("closes with Backspace too", async () => {
    const onClose = vi.fn();
    render(<Editable onClose={onClose} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{Backspace}");
    expect(onClose).toHaveBeenCalledWith("a");
  });

  it("adds and selects the new tab", async () => {
    render(<Editable />);
    await userEvent.setup().click(screen.getByRole("button", { name: /new tab/i }));
    expect(screen.getByRole("tab", { name: "Note n3" })).toHaveAttribute("aria-selected", "true");
  });

  it("emits audit events for close and add", async () => {
    const onAuditEvent = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Notes"
        defaultValue="a"
        onAuditEvent={onAuditEvent}
        items={[{ value: "a", label: "A", closable: true }]}
        editable={{ onClose: () => {}, onAdd: () => {} }}
      />,
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("tab", { name: "A" }).querySelector(".zb-tabs__close") as HTMLElement,
    );
    expect(onAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tabs.close", value: "a" }),
    );
    await user.click(screen.getByRole("button", { name: /new tab/i }));
    expect(onAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "tabs.add" }));
  });

  it("refuses a closable item with nothing to close it, rather than rendering a dead button", () => {
    expect(() =>
      render(
        <Tabs
          as="tabs"
          aria-label="Notes"
          defaultValue="a"
          items={[{ value: "a", label: "A", closable: true }]}
        />,
      ),
    ).toThrow(/closable-without-handler/);
  });

  it("renders no close affordance on an item that is not closable", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Notes"
        defaultValue="a"
        items={[{ value: "a", label: "A" }]}
        editable={{ onClose: () => {} }}
      />,
    );
    expect(screen.getByRole("tab").querySelector(".zb-tabs__close")).toBeNull();
  });

  it("reorders with Ctrl+Shift+Arrow, so reordering is not pointer-only", async () => {
    const onReorder = vi.fn();
    render(
      <Tabs
        as="tabs"
        aria-label="Notes"
        defaultValue="a"
        items={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
        editable={{ onReorder }}
      />,
    );
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{Control>}{Shift>}{ArrowRight}{/Shift}{/Control}");
    expect(onReorder).toHaveBeenCalledWith(0, 1);
  });

  it("keeps focus on the moved tab, so a second move moves the same tab", async () => {
    function Reorderable() {
      const [items, setItems] = React.useState([
        { value: "a", label: "A" },
        { value: "b", label: "B" },
        { value: "c", label: "C" },
      ]);
      return (
        <Tabs
          as="tabs"
          aria-label="Notes"
          defaultValue="a"
          items={items}
          editable={{
            onReorder: (from, to) =>
              setItems((current) => {
                const next = [...current];
                const [moved] = next.splice(from, 1);
                if (moved) next.splice(to, 0, moved);
                return next;
              }),
          }}
        />
      );
    }
    render(<Reorderable />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{Control>}{Shift>}{ArrowRight}{/Shift}{/Control}");
    await user.keyboard("{Control>}{Shift>}{ArrowRight}{/Shift}{/Control}");
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["B", "C", "A"]);
    expect(screen.getByRole("tab", { name: "A" })).toHaveFocus();
  });

  it("arrows follow the visual order after keyed triggers move", async () => {
    const items = [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
      { value: "c", label: "C" },
    ];
    const props = { as: "tabs", "aria-label": "Notes", defaultValue: "a" } as const;
    const { rerender } = render(<Tabs {...props} items={items} />);
    rerender(<Tabs {...props} items={[items[1]!, items[0]!, items[2]!]} />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("tab", { name: "A" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "C" })).toHaveFocus();
  });
});

describe("availability", () => {
  it("marks a stale tab without disabling it", () => {
    render(
      <Tabs
        as="tabs"
        aria-label="Chart"
        defaultValue="vitals"
        items={[{ value: "vitals", label: "Vitals", availability: "stale" }]}
      />,
    );
    const tab = screen.getByRole("tab");
    expect(tab).toHaveAttribute("data-zb-availability", "stale");
    expect(tab).not.toHaveAttribute("aria-disabled");
    expect(tab).toHaveAccessibleName("Vitals, showing cached data");
  });
});
