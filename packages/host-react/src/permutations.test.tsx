/**
 * The prop permutations, across all three hosts.
 *
 * `hosts.test.tsx` proves that one demo source renders under each framework.
 * This file walks the branches that source does not reach — every variant,
 * every size, both controlled and uncontrolled, and the optional props each
 * adapter has to translate or drop.
 *
 * Run against all three rather than only MUI, because a translation is only
 * correct if the same call produces the equivalent control everywhere. The
 * MUI adapter is where the conversions live, so it is where a regression would
 * appear; the antd and Oxygen cases are what say "equivalent" out loud.
 */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AntdHost } from "./antd";
import { MuiHost } from "./mui";
import { OxygenHost } from "./oxygen";
import { useHost } from "./context";
import type { HostProviderProps } from "./contract";

afterEach(cleanup);

const HOSTS: Array<[string, React.ComponentType<HostProviderProps>]> = [
  ["oxygen", OxygenHost],
  ["antd", AntdHost],
  ["mui", MuiHost],
];

function mount(Host: React.ComponentType<HostProviderProps>, children: React.ReactNode) {
  return render(<Host mode="light">{children}</Host>);
}

/**
 * Whether a toggle reads as on, in whichever way its framework says so.
 *
 * antd and the Oxygen host draw a `role="switch"` button and carry the state
 * in `aria-checked`. MUI renders a real `<input type="checkbox">` and carries
 * it in the DOM *property* — the `checked` attribute never moves, so reading
 * the attribute reports the initial value forever and a working control looks
 * broken.
 */
function isOn(element: HTMLElement): boolean {
  const aria = element.getAttribute("aria-checked");
  if (aria !== null) return aria === "true";
  return (element as HTMLInputElement).checked === true;
}

describe.each(HOSTS)("%s — buttons", (_id, Host) => {
  function Buttons() {
    const { Button } = useHost();
    return (
      <>
        <Button type="primary" size="small">
          Small
        </Button>
        <Button type="default" size="middle">
          Middle
        </Button>
        <Button type="text" size="large">
          Large
        </Button>
        <Button danger>Danger</Button>
        <Button disabled>Disabled</Button>
        <Button htmlType="submit">Submit</Button>
      </>
    );
  }

  it("renders every variant, size and state", () => {
    mount(Host, <Buttons />);
    for (const label of ["Small", "Middle", "Large", "Danger", "Disabled", "Submit"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
    expect(screen.getByRole("button", { name: "Disabled" })).toHaveProperty("disabled", true);
    // `htmlType` is the contract's name for the DOM type, because antd took
    // `type` for the visual variant. Every adapter has to make that swap.
    expect(screen.getByRole("button", { name: "Submit" }).getAttribute("type")).toBe("submit");
  });

  it("does not fire a click handler on a disabled button", async () => {
    const onClick = vi.fn();
    function One() {
      const { Button } = useHost();
      return (
        <Button disabled onClick={onClick}>
          Nope
        </Button>
      );
    }
    mount(Host, <One />);
    // MUI sets `pointer-events: none` on a disabled button, which makes
    // user-event refuse the click before it reaches the handler. Turning the
    // check off is what lets the assertion be about the handler rather than
    // about which framework happens to block the pointer.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(screen.getByRole("button", { name: "Nope" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe.each(HOSTS)("%s — fields", (_id, Host) => {
  it("renders with and without a label, and reports changes", async () => {
    const onChange = vi.fn();
    function Fields() {
      const { Input } = useHost();
      return (
        <>
          <Input label="Labelled" defaultValue="" onChange={onChange} />
          <Input aria-label="Bare" placeholder="No label" size="small" />
          <Input aria-label="Wrong" status="error" />
          <Input aria-label="Iffy" status="warning" disabled />
        </>
      );
    }
    mount(Host, <Fields />);

    expect(screen.getByLabelText("Labelled")).toBeTruthy();
    expect(screen.getByLabelText("Bare")).toBeTruthy();
    expect(screen.getByLabelText("Iffy")).toHaveProperty("disabled", true);

    await userEvent.type(screen.getByLabelText("Labelled"), "K");
    // Both frameworks hand back a change event over an `<input>`, so this is
    // the one handler in the contract that needs no translation.
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0].target.value).toBe("K");
  });
});

describe.each(HOSTS)("%s — switch", (_id, Host) => {
  it("honours a controlled value", async () => {
    const onChange = vi.fn();
    function Controlled() {
      const { Switch } = useHost();
      return <Switch checked={false} onChange={onChange} aria-label="Pinned off" />;
    }
    mount(Host, <Controlled />);
    const control = screen.getByRole("switch", { name: "Pinned off" });

    await userEvent.click(control);
    // Controlled: the caller owns the value, so the control must not move
    // itself — only report what was asked for.
    expect(onChange).toHaveBeenCalledWith(true);
    expect(isOn(control)).toBe(false);
  });

  it("manages its own value when uncontrolled, at either size", async () => {
    function Uncontrolled() {
      const { Switch } = useHost();
      return (
        <>
          <Switch defaultChecked={false} aria-label="Free" size="small" />
          <Switch disabled aria-label="Locked" />
        </>
      );
    }
    mount(Host, <Uncontrolled />);
    const free = screen.getByRole("switch", { name: "Free" });
    expect(isOn(free)).toBe(false);
    await userEvent.click(free);
    expect(isOn(free)).toBe(true);
  });
});

describe.each(HOSTS)("%s — checkbox and select", (_id, Host) => {
  it("renders a checkbox with and without a label, and indeterminate", async () => {
    const onChange = vi.fn();
    function Boxes() {
      const { Checkbox } = useHost();
      return (
        <>
          <Checkbox onChange={onChange}>Labelled</Checkbox>
          <Checkbox indeterminate defaultChecked={false} />
          <Checkbox disabled defaultChecked>
            Locked
          </Checkbox>
        </>
      );
    }
    mount(Host, <Boxes />);

    await userEvent.click(screen.getByLabelText("Labelled"));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getAllByRole("checkbox").length).toBe(3);
  });

  it("renders a select with and without a label, and a disabled option", () => {
    function Selects() {
      const { Select } = useHost();
      const options = [
        { value: "a", label: "Ward A" },
        { value: "b", label: "Ward B", disabled: true },
      ];
      return (
        <>
          <Select label="Ward" defaultValue="a" options={options} />
          <Select aria-label="Bare ward" defaultValue="a" options={options} size="small" />
          <Select aria-label="Locked ward" defaultValue="a" options={options} disabled />
        </>
      );
    }
    const { container } = mount(Host, <Selects />);
    // Each framework draws a select differently — a native element, a combobox
    // widget — so the assertion is that three of them exist, not which.
    expect(container.querySelectorAll("select, [role='combobox']").length).toBeGreaterThanOrEqual(
      3,
    );
  });
});

describe.each(HOSTS)("%s — tabs", (_id, Host) => {
  const ITEMS = [
    { key: "one", label: "One", children: <p>Panel one</p> },
    { key: "two", label: "Two", children: <p>Panel two</p> },
    { key: "three", label: "Three", disabled: true },
  ];

  it("switches panels when uncontrolled", async () => {
    function Uncontrolled() {
      const { Tabs } = useHost();
      return <Tabs items={ITEMS} aria-label="Sections" />;
    }
    mount(Host, <Uncontrolled />);

    expect(screen.getByText("Panel one")).toBeTruthy();
    await userEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(await screen.findByText("Panel two")).toBeTruthy();
  });

  it("defers to the caller when controlled, and renders an item with no panel", async () => {
    const onChange = vi.fn();
    function Controlled() {
      const { Tabs } = useHost();
      return <Tabs items={ITEMS} activeKey="one" onChange={onChange} defaultActiveKey="two" />;
    }
    mount(Host, <Controlled />);

    await userEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(onChange).toHaveBeenCalledWith("two");
    // `activeKey` wins over `defaultActiveKey` and over the click: the caller
    // owns the value, so the panel must not move on its own.
    expect(screen.getByText("Panel one")).toBeTruthy();
  });

  it("survives an empty item list", () => {
    function Empty() {
      const { Tabs } = useHost();
      return <Tabs items={[]} aria-label="Nothing" />;
    }
    // No panel, no active key, no crash — the branch a component page hits
    // while its scenarios are still loading.
    expect(() => mount(Host, <Empty />)).not.toThrow();
  });
});
