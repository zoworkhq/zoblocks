/**
 * What the three hosts actually render.
 *
 * The assertions are deliberately about the DOM rather than about props: an
 * adapter that passes `variant="contained"` to something that is not MUI's
 * Button would satisfy a props test and render the wrong control. So each
 * case looks for the class the real library emits — `.ant-btn-primary`,
 * `.MuiButton-contained` — which is only present if the real component ran.
 */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AntdHost } from "./antd";
import { MuiHost } from "./mui";
import { ZoblocksHost } from "./zoblocks";
import { useHost } from "./context";
import type { HostProviderProps } from "./contract";

afterEach(cleanup);

const HOSTS: Array<[string, React.ComponentType<HostProviderProps>]> = [
  ["zoblocks", ZoblocksHost],
  ["antd", AntdHost],
  ["mui", MuiHost],
];

/** One demo source, mounted under all three — the claim the package makes. */
function Demo({ onToggle }: { onToggle?: (checked: boolean) => void }) {
  const { Button, Input, Switch, Checkbox, Select, Tabs } = useHost();
  return (
    <>
      <Tabs
        aria-label="Sections"
        items={[
          { key: "results", label: "Results", children: <p>Results panel</p> },
          { key: "trend", label: "Trend", children: <p>Trend panel</p> },
        ]}
      />
      <Button type="primary">Acknowledge</Button>
      <Button type="default">Order repeat</Button>
      <Input label="Note" placeholder="Add a note…" />
      <Switch aria-label="Contact precautions" defaultChecked onChange={onToggle} />
      <Checkbox defaultChecked>Seen</Checkbox>
      <Select
        aria-label="Ward"
        defaultValue="a"
        options={[
          { value: "a", label: "Ward A" },
          { value: "b", label: "Ward B" },
        ]}
      />
    </>
  );
}

describe.each(HOSTS)("the %s host", (id, Host) => {
  it("renders one demo source unchanged", async () => {
    render(
      <Host mode="light">
        <Demo />
      </Host>,
    );

    expect(screen.getByRole("button", { name: "Acknowledge" })).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Contact precautions" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Results" })).toBeTruthy();
    // The active tab's panel, which MUI does not supply and the adapter does.
    expect(await screen.findByText("Results panel")).toBeTruthy();
  });

  it("normalises the switch handler to antd's shape", async () => {
    const onToggle = vi.fn();
    render(
      <Host mode="light">
        <Demo onToggle={onToggle} />
      </Host>,
    );

    await userEvent.click(screen.getByRole("switch", { name: "Contact precautions" }));

    // antd hands back the next value; MUI hands back (event, checked). Both
    // must arrive here as one boolean, or a call site cannot be shared.
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle.mock.calls[0]).toEqual([false]);
  });

  it("exposes its id and marks the subtree", () => {
    const { container } = render(
      <Host mode="light">
        <Demo />
      </Host>,
    );
    const marked = container.querySelector("[data-zb-bridge], [data-zb-host]");
    expect(marked).not.toBeNull();
    expect(marked?.getAttribute("data-zb-bridge") ?? marked?.getAttribute("data-zb-host")).toBe(id);
  });
});

describe("the antd host", () => {
  it("renders antd's own Button, not a copy of it", () => {
    const { container } = render(
      <AntdHost mode="light">
        <Demo />
      </AntdHost>,
    );
    // Emitted by antd itself. Present only if the real component ran.
    expect(container.querySelector(".ant-btn-primary")).not.toBeNull();
    expect(container.querySelector(".ant-switch-checked")).not.toBeNull();
  });

  it("writes antd's tokens onto Zoblocks's surface but not its clinical ones", () => {
    const { container } = render(
      <AntdHost mode="light">
        <Demo />
      </AntdHost>,
    );
    const bridged = container.querySelector<HTMLElement>('[data-zb-bridge="antd"]');
    expect(bridged?.style.getPropertyValue("--zb-accent")).toBe("#1677ff");
    // The refusal that makes the whole thing safe: a host's brand never
    // reaches a status colour.
    expect(bridged?.style.getPropertyValue("--zb-status-critical")).toBe("");
  });
});

describe("the MUI host", () => {
  it("translates antd's button vocabulary to MUI's variants", () => {
    const { container } = render(
      <MuiHost mode="light">
        <Demo />
      </MuiHost>,
    );
    expect(container.querySelector(".MuiButton-contained")).not.toBeNull();
    expect(container.querySelector(".MuiButton-outlined")).not.toBeNull();
  });

  it("keeps MUI's ripple — the thing a reproduction cannot have", async () => {
    const { container } = render(
      <MuiHost mode="light">
        <Demo />
      </MuiHost>,
    );

    // Not present at rest: MUI mounts `TouchRipple` lazily on first
    // interaction rather than on mount, which is why asserting straight after
    // render fails against a perfectly working button.
    expect(container.querySelector(".MuiTouchRipple-root")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Acknowledge" }));

    // Now it exists, because the real ButtonBase ran. `disableRipple` is
    // never set by the adapter and this is what guards that.
    await waitFor(() => {
      expect(container.querySelector(".MuiTouchRipple-root")).not.toBeNull();
    });
  });

  it("renders the outlined field with its label in the notch", () => {
    const { container } = render(
      <MuiHost mode="light">
        <Demo />
      </MuiHost>,
    );
    expect(container.querySelector(".MuiOutlinedInput-notchedOutline")).not.toBeNull();
    expect(screen.getByLabelText("Note")).toBeTruthy();
  });

  it("takes the host's colour mode rather than assuming light", () => {
    const { container } = render(
      <MuiHost mode="dark">
        <Demo />
      </MuiHost>,
    );
    const bridged = container.querySelector<HTMLElement>('[data-zb-bridge="mui"]');
    // MUI's dark primary. A host that ignored `mode` would send #1976d2.
    expect(bridged?.style.getPropertyValue("--zb-accent")).toBe("#90caf9");
  });
});

describe("the Zoblocks host", () => {
  it("renders reference chrome drawn from tokens", () => {
    const { container } = render(
      <ZoblocksHost mode="light">
        <Demo />
      </ZoblocksHost>,
    );
    expect(container.querySelector(".zb-host-btn")).not.toBeNull();
    // No framework class anywhere: this host must stay dependency-free.
    expect(container.querySelector("[class*='ant-']")).toBeNull();
    expect(container.querySelector("[class*='Mui']")).toBeNull();
  });
});
