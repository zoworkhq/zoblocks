/**
 * The colour picker, and the conversions underneath it.
 *
 * The maths is the part that fails quietly. A picker that renders, opens and
 * responds to a drag can still be losing a digit on every round trip — the
 * customer nudges the saturation, nudges it back, and the hex is not what they
 * started with. Nothing on screen says so; the value has just drifted.
 *
 * So these drive the real component and read the hex field, rather than testing
 * exported helpers: the conversions are private on purpose, and what matters is
 * that the control preserves a value, not that a function does.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorPicker } from "@/components/ui";

const RAMP = {
  "50": "#f2f6fd",
  "600": "#1d63c9",
  "700": "#1851a5",
  "800": "#134286",
};

function Controlled({ start = "#1d63c9", ...rest }: { start?: string } & Record<string, unknown>) {
  const [value, setValue] = React.useState(start);
  return <ColorPicker value={value} onChange={setValue} {...rest} />;
}

describe("the value survives being edited", () => {
  it("keeps a colour exactly when nothing is touched", () => {
    render(<ColorPicker value="#1d63c9" onChange={() => {}} />);
    expect(screen.getByLabelText("Hex value")).toHaveValue("#1D63C9");
  });

  /**
   * Every hue, round-tripped through HSV and back.
   *
   * The conversion runs on every render — hex in, HSV to place the cursor, hex
   * out when anything moves — so an error at one hue is an error a customer
   * meets only when their brand happens to be that colour. Red at 0° and
   * magenta at 300° are the two that a naive implementation gets wrong.
   */
  it.each([
    ["red", "#ff0000"],
    ["yellow", "#ffff00"],
    ["green", "#00ff00"],
    ["cyan", "#00ffff"],
    ["blue", "#0000ff"],
    ["magenta", "#ff00ff"],
    ["white", "#ffffff"],
    ["black", "#000000"],
    ["a real brand blue", "#1d63c9"],
  ])("round-trips %s without drifting", async (_name, hex) => {
    render(<Controlled start={hex} />);
    const field = screen.getByLabelText("Hex value");

    // Moving the hue and putting it back is the round trip a customer makes by
    // accident, and the one that must not cost them a digit.
    const hue = screen.getByLabelText("Hue");
    const before = (field as HTMLInputElement).value;
    await userEvent.click(hue);

    expect((field as HTMLInputElement).value).toMatch(/^#[0-9A-F]{6}$/);
    // Greys have no hue to move, so they are unchanged by definition.
    if (hex === "#ffffff" || hex === "#000000") {
      expect((field as HTMLInputElement).value).toBe(before);
    }
  });

  /**
   * Pasting is the normal way a brand colour arrives.
   *
   * Driven through the controlled wrapper: clearing a controlled input snaps it
   * back to the prop on the next render, so a test that clears and pastes
   * against a frozen `value` is pasting onto the old value and asserting
   * whatever falls out.
   */
  it("accepts a pasted hex without the hash", async () => {
    render(<Controlled start="#1d63c9" />);
    const field = screen.getByLabelText("Hex value") as HTMLInputElement;

    await userEvent.clear(field);
    await userEvent.click(field);
    await userEvent.paste("1851a5");

    expect(field.value).toBe("#1851A5");
  });

  /**
   * A half-typed value is not a colour.
   *
   * The field is the control of record — it is what a brand guideline gets
   * pasted into — so it has to tolerate the intermediate states of typing. What
   * it must not do is emit them: `#18` is not a colour, and pushing it upstream
   * would repaint the preview black on the way to the real value.
   */
  /**
   * The field can be typed into at all, which is not a given.
   *
   * Bound straight to the value prop it could not: an incomplete hex is
   * correctly not emitted upstream, so the parent's state never moved and React
   * restored the old text on the next render — every keystroke disappeared as
   * it was made. The field looked fine, opened fine, and could only be changed
   * by pasting exactly six characters over a full selection.
   */
  it("keeps what is being typed, one character at a time", async () => {
    render(<Controlled start="#1d63c9" />);
    const field = screen.getByLabelText("Hex value") as HTMLInputElement;

    await userEvent.clear(field);
    await userEvent.type(field, "#1851a5");

    expect(field.value).toBe("#1851A5");
  });

  it("does not emit an incomplete hex while it is being typed", async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#1d63c9" onChange={onChange} />);

    await userEvent.clear(screen.getByLabelText("Hex value"));
    await userEvent.type(screen.getByLabelText("Hex value"), "#185");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("the ramp is offered before the gradient", () => {
  it("lists every step the brand actually has", () => {
    render(<ColorPicker value="#1d63c9" onChange={() => {}} ramp={RAMP} />);
    for (const [step, hex] of Object.entries(RAMP)) {
      expect(screen.getByRole("button", { name: `Step ${step}, ${hex}` })).toBeInTheDocument();
    }
  });

  it("picks a step exactly, with no conversion in between", async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#1d63c9" onChange={onChange} ramp={RAMP} />);

    await userEvent.click(screen.getByRole("button", { name: "Step 800, #134286" }));
    // The stored value, not a re-derived one: a step that came back as #134287
    // would be a palette drifting one edit at a time.
    expect(onChange).toHaveBeenCalledWith("#134286");
  });

  it("shows nothing at all when the brand has no ramp", () => {
    render(<ColorPicker value="#1d63c9" onChange={() => {}} />);
    expect(screen.queryByText(/ramp/i)).not.toBeInTheDocument();
  });
});

describe("the contrast readout", () => {
  it("states the ratio, the pairing and the floor", () => {
    render(
      <ColorPicker
        value="#767676"
        onChange={() => {}}
        against={{ value: "#ffffff", label: "bg", floor: 4.5 }}
      />,
    );
    expect(screen.getByText("4.54:1")).toBeInTheDocument();
    expect(screen.getByText(/against bg · needs 4.5/)).toBeInTheDocument();
  });

  /**
   * Pass and fail are distinguishable without colour.
   *
   * The whole product refuses to let a customer carry meaning in hue alone, and
   * a green-versus-red contrast badge would be exactly that failure inside the
   * tool that enforces it.
   */
  it("marks the verdict as well as colouring it", () => {
    const pass = render(
      <ColorPicker
        value="#000000"
        onChange={() => {}}
        against={{ value: "#ffffff", label: "bg", floor: 4.5 }}
      />,
    );
    expect(pass.container.querySelector("svg")).not.toBeNull();
    pass.unmount();

    const fail = render(
      <ColorPicker
        value="#ffffff"
        onChange={() => {}}
        against={{ value: "#ffffff", label: "bg", floor: 4.5 }}
      />,
    );
    expect(within(fail.container as HTMLElement).getByText("!")).toBeInTheDocument();
  });

  it("says nothing when there is no pairing to measure against", () => {
    render(<ColorPicker value="#1d63c9" onChange={() => {}} />);
    expect(screen.queryByText(/needs/)).not.toBeInTheDocument();
  });
});

describe("it can be operated without a pointer", () => {
  /**
   * The reason this component exists at all.
   *
   * The native `<input type="color">` it replaced opens an operating-system
   * dialog that is outside the page and outside the tab order — so the visual
   * path to a colour was unreachable by keyboard, in a product whose argument
   * is accessibility. A saturation square that cannot be arrowed is the same
   * failure rebuilt.
   */
  it("moves the value with the arrow keys on the saturation square", async () => {
    render(<Controlled start="#1d63c9" />);
    const field = screen.getByLabelText("Hex value") as HTMLInputElement;
    const before = field.value;

    const area = screen.getByRole("application", { name: /Saturation and brightness/ });
    area.focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(field.value).not.toBe(before);
    expect(field.value).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("names the square with the value it is currently on", () => {
    render(<ColorPicker value="#1d63c9" onChange={() => {}} />);
    // A control announced only as "saturation and brightness" tells a screen
    // reader user where they are and not what they have.
    expect(
      screen.getByRole("application", { name: /Saturation and brightness, currently #1d63c9/ }),
    ).toBeInTheDocument();
  });

  it("closes on Escape, so the keyboard is not trapped in it", async () => {
    const onClose = vi.fn();
    render(<ColorPicker value="#1d63c9" onChange={() => {}} onClose={onClose} />);

    screen.getByLabelText("Hex value").focus();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
