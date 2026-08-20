/**
 * The kit's accessibility contracts.
 *
 * Not "does it render". Every assertion here is a property that is invisible on
 * screen and load-bearing for somebody: a hint that is announced, a disabled
 * control whose reason can still be reached, a state that survives greyscale.
 * Each is the kind of thing that gets written correctly once, copied wrongly
 * twelve times, and noticed by a customer — which is precisely why the kit
 * exists before the screens do.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Button,
  Callout,
  ColorField,
  ContrastBadge,
  DataTable,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Panel,
  Ramp,
  StatusChip,
  AxisGroup,
} from "@/components/ui";

describe("PageHeader", () => {
  it("gives every screen exactly one h1", () => {
    render(<PageHeader title="Themes" />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  /**
   * The single clearest fault in the screenshot this kit replaces: the primary
   * action floated in the flow after the help text, so no two screens put it in
   * the same place.
   */
  it("keeps actions in the header rather than in the flow", () => {
    render(<PageHeader title="Themes" actions={<Button variant="primary">New theme</Button>} />);
    const header =
      screen.getByRole("banner", { hidden: true }) ??
      screen.getByRole("heading", { level: 1 }).closest("header");
    expect(header?.contains(screen.getByRole("button", { name: "New theme" }))).toBe(true);
  });
});

describe("Field", () => {
  /*
   * `exact: false` throughout, and it is not laziness.
   *
   * An optional field carries the word "optional" inside its `<label>`, so its
   * accessible name is "Theme name optional" — deliberately, because that is
   * the announcement a screen-reader user needs and a `*` glyph is not. These
   * tests are about the *binding* of hints and errors, so they match the label
   * they care about and stay silent on the suffix, which has its own test
   * below.
   */
  it("names an optional field as optional, and says nothing on a required one", () => {
    render(
      <>
        <Field label="Homepage">{(props) => <Input {...props} />}</Field>
        <Field label="Email" required>
          {(props) => <Input {...props} />}
        </Field>
      </>,
    );

    // The exception is marked, not the rule: marking every field required on a
    // form where everything is required tells a reader nothing.
    expect(screen.getByLabelText("Homepage optional")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toHaveAttribute("required");
  });

  /**
   * A hint in a `<p>` beside an input is invisible to a screen reader. This is
   * the binding that makes it part of the control.
   */
  it("binds the hint to the control", () => {
    render(
      <Field label="Theme name" hint="Becomes the theme's address.">
        {(props) => <Input {...props} />}
      </Field>,
    );
    const input = screen.getByLabelText("Theme name", { exact: false });
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)?.textContent).toContain("address");
  });

  it("binds the error and marks the control invalid", () => {
    render(
      <Field label="Brand colour" error="2.14:1, below the 4.5:1 floor for SC 1.4.3.">
        {(props) => <Input {...props} />}
      </Field>,
    );
    const input = screen.getByLabelText("Brand colour", { exact: false });
    expect(input).toHaveAttribute("aria-invalid", "true");
    const describedBy = input.getAttribute("aria-describedby") as string;
    expect(document.getElementById(describedBy)?.textContent).toContain("4.5:1");
  });

  it("shows the error instead of the hint, so the two never compete", () => {
    render(
      <Field label="Colour" hint="Six hex digits." error="Not a colour.">
        {(props) => <Input {...props} />}
      </Field>,
    );
    expect(screen.queryByText("Six hex digits.")).toBeNull();
    expect(screen.getByText("Not a colour.")).toBeTruthy();
  });

  it("gives each instance its own ids, so two fields on a page do not collide", () => {
    render(
      <>
        <Field label="One" hint="a">
          {(p) => <Input {...p} />}
        </Field>
        <Field label="Two" hint="b">
          {(p) => <Input {...p} />}
        </Field>
      </>,
    );
    const one = screen.getByLabelText("One", { exact: false }).getAttribute("aria-describedby");
    const two = screen.getByLabelText("Two", { exact: false }).getAttribute("aria-describedby");
    expect(one).not.toBe(two);
  });
});

describe("Button", () => {
  /**
   * `aria-disabled`, never `disabled`. A `disabled` button is unfocusable, which
   * takes its own explanation out of reach — so a keyboard user is told they
   * cannot do something and never told why.
   */
  it("stays focusable when blocked, and carries the reason", async () => {
    render(
      <Button id="publish" reason="This needs an admin.">
        Publish
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Publish" });

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toHaveAttribute("disabled");

    button.focus();
    expect(button).toHaveFocus();

    const describedBy = button.getAttribute("aria-describedby") as string;
    expect(document.getElementById(describedBy)?.textContent).toContain("needs an admin");
  });

  it("does not fire its action when blocked", async () => {
    const onClick = vi.fn();
    render(
      <Button reason="Not yours to publish." onClick={onClick}>
        Publish
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires normally when it is not", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Publish</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("StatusChip", () => {
  /**
   * The library's own rule in its console: severity is never colour alone, so
   * the whole interface survives greyscale, colour-vision deficiency and
   * forced-colours mode without losing information.
   */
  it("always renders a word", () => {
    for (const tone of ["pass", "fail", "warn", "locked", "accent", "neutral"] as const) {
      const { unmount } = render(<StatusChip tone={tone}>published</StatusChip>);
      expect(screen.getByText("published")).toBeTruthy();
      unmount();
    }
  });

  it("keeps its icon out of the accessibility tree", () => {
    render(
      <StatusChip tone="pass" icon="✓">
        passing
      </StatusChip>,
    );
    expect(screen.getByText("✓")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("ContrastBadge", () => {
  /** The number is the actionable part; a bare tick tells a customer nothing. */
  it("states the measurement, the floor and the criterion", () => {
    render(<ContrastBadge ratio={2.14} floor={4.5} criterion="SC 1.4.3 (text)" against="accent" />);
    expect(screen.getByText("2.14:1")).toBeTruthy();
    expect(screen.getByText(/needs 4.5:1 on accent/)).toBeTruthy();
    expect(screen.getByText(/SC 1.4.3/)).toBeTruthy();
  });

  /**
   * Asserted on the tone and the number, not on the glyph.
   *
   * This used to look for a "✓" character. That was testing the decoration:
   * the icon is `aria-hidden` and carries no meaning — the ratio and the floor
   * do — so swapping the emoji for a Lucide icon broke a test without changing
   * any behaviour a reader depends on.
   */
  it("reads pass and fail from the numbers rather than a flag", () => {
    const { rerender, container } = render(<ContrastBadge ratio={5.82} floor={4.5} />);
    expect(screen.getByText("5.82:1")).toBeTruthy();
    expect(container.querySelector(".text-pass")).toBeTruthy();

    rerender(<ContrastBadge ratio={2.14} floor={4.5} />);
    expect(screen.getByText("2.14:1")).toBeTruthy();
    expect(container.querySelector(".text-fail")).toBeTruthy();
  });

  it("keeps its icon out of the accessibility tree", () => {
    const { container } = render(<ContrastBadge ratio={5.82} floor={4.5} />);
    // The word and the number carry the meaning; the tick reinforces them.
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("ColorField", () => {
  /**
   * A native colour picker cannot be operated from a keyboard in any useful
   * way, cannot be read aloud, and cannot be pasted into from a brand guide.
   * The text field is the control; the picker is the convenience.
   */
  it("makes the hex input the labelled control", () => {
    render(
      <Field label="Primary">
        {(props) => (
          <ColorField value="#1d63c9" id={props.id} describedBy={props["aria-describedby"]} />
        )}
      </Field>,
    );
    const input = screen.getByLabelText("Primary", { exact: false });
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveValue("#1d63c9");
    expect(input).not.toHaveAttribute("type", "color");
  });

  /**
   * The swatch is the picker, and it is a button.
   *
   * It used to be a decorative square beside a native `<input type="color">` —
   * two controls for one value, and a visual path no keyboard could take,
   * because the dialog that input opens lives outside the page and outside the
   * tab order. Asserting it is a button is asserting the path exists.
   */
  it("opens its own picker from a real, named button", async () => {
    render(<ColorField value="#1d63c9" onChange={() => {}} />);
    const trigger = screen.getByRole("button", { name: "Pick colour visually" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Pick a colour" })).toBeInTheDocument();
  });

  it("offers the brand's own ramp before anything else", async () => {
    render(
      <ColorField
        value="#1d63c9"
        onChange={() => {}}
        ramp={{ "600": "#1d63c9", "700": "#1851a5" }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Pick colour visually" }));

    // Named by step *and* value: "600" alone tells somebody scanning by
    // keyboard nothing about which colour they are about to choose.
    expect(screen.getByRole("button", { name: "Step 700, #1851a5" })).toBeInTheDocument();
  });

  /**
   * The number that decides whether a value can be published, shown while
   * choosing rather than after saving. This is the entire reason the console
   * has a picker of its own rather than the browser's.
   */
  it("shows the contrast against the pairing while you choose", async () => {
    render(
      <ColorField
        value="#ffffff"
        onChange={() => {}}
        against={{ value: "#ffffff", label: "bg", floor: 4.5 }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Pick colour visually" }));

    expect(screen.getByText("1.00:1")).toBeInTheDocument();
    expect(screen.getByText(/needs 4.5/)).toBeInTheDocument();
  });

  it("leaves a locked colour with no picker at all", () => {
    render(<ColorField value="#1d63c9" lockedReason="Clinical." />);
    expect(screen.queryByRole("button", { name: "Pick colour visually" })).not.toBeInTheDocument();
  });

  it("accepts a partial value while it is being typed", async () => {
    const onChange = vi.fn();
    render(<ColorField value="#1d63c9" onChange={onChange} />);
    // By role, not by value: the picker mirrors the hex field, so both inputs
    // legitimately carry the same value and only one of them is the control.
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    // Five digits — genuinely incomplete. Three would be a *valid* shorthand
    // colour and committing it is correct, which is what the first version of
    // this test got wrong.
    await userEvent.type(input, "#1d63c");
    expect(input).toHaveValue("#1d63c");
    expect(onChange).not.toHaveBeenCalledWith("#1d63c");
  });

  it("commits a three-digit shorthand, which is a whole colour", async () => {
    const onChange = vi.fn();
    render(<ColorField value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "#1d6");
    expect(onChange).toHaveBeenLastCalledWith("#1d6");
  });

  it("commits once the value is a colour", async () => {
    const onChange = vi.fn();
    render(<ColorField value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "#1d63c9");
    expect(onChange).toHaveBeenLastCalledWith("#1d63c9");
  });

  /**
   * Locked, not removed. A missing field raises more questions than a locked
   * one, and the reason has to be reachable rather than implied by a padlock.
   */
  it("stays present and readable when locked, with the reason bound", () => {
    render(
      <Field label="Critical">
        {(props) => (
          <ColorField
            value="#b91c1c"
            id={props.id}
            lockedReason="Clinical status carries a validated contrast floor."
          />
        )}
      </Field>,
    );
    const input = screen.getByLabelText("Critical", { exact: false });
    expect(input).toHaveAttribute("readonly");
    const describedBy = input.getAttribute("aria-describedby") as string;
    expect(
      describedBy
        .split(" ")
        .map((id) => document.getElementById(id)?.textContent)
        .join(" "),
    ).toContain("validated contrast floor");
  });

  it("hides the picker entirely when locked", () => {
    render(<ColorField value="#b91c1c" lockedReason="Locked." />);
    expect(screen.queryByLabelText("Pick colour visually")).toBeNull();
  });
});

describe("Ramp", () => {
  const steps = { "50": "#f2f6fd", "600": "#1d63c9", "900": "#0f3468" };

  /** A row of coloured divs is a picture. Every step here is operable. */
  it("makes every step a button naming its step and value", () => {
    render(<Ramp steps={steps} />);
    expect(screen.getByRole("button", { name: /Step 600, #1D63C9/ })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("says which one the customer actually chose", () => {
    render(<Ramp steps={steps} />);
    expect(screen.getByRole("button", { name: /your chosen colour/ })).toBeTruthy();
  });

  it("orders steps light to dark regardless of key order", () => {
    render(<Ramp steps={{ "900": "#0f3468", "50": "#f2f6fd", "600": "#1d63c9" }} />);
    const names = screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"));
    expect(names[0]).toContain("Step 50");
    expect(names[2]).toContain("Step 900");
  });

  it("reports selection with aria-pressed when it is selectable", async () => {
    const onSelect = vi.fn();
    render(<Ramp steps={steps} selected="600" onSelect={onSelect} />);
    expect(screen.getByRole("button", { name: /Step 600/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: /Step 50/ }));
    expect(onSelect).toHaveBeenCalledWith("50");
  });
});

describe("DataTable", () => {
  const rows = [{ id: "a", name: "Northwind Clinical", version: 7 }];

  /**
   * A page with two unnamed tables gives a screen-reader user two unnamed
   * tables, and there is no recovering from that by reading harder.
   */
  it("always has a caption", () => {
    render(
      <DataTable
        caption="Themes in this organisation"
        rows={rows}
        rowKey={(r) => r.id}
        columns={[{ key: "n", header: "Theme", cell: (r) => r.name }]}
      />,
    );
    expect(screen.getByRole("table", { name: "Themes in this organisation" })).toBeTruthy();
  });

  it("uses real column headers with a scope", () => {
    render(
      <DataTable
        caption="Themes"
        rows={rows}
        rowKey={(r) => r.id}
        columns={[{ key: "n", header: "Theme", cell: (r) => r.name }]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Theme" })).toHaveAttribute("scope", "col");
  });

  it("declares sort direction honestly when a column is sorted", () => {
    render(
      <DataTable
        caption="Themes"
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          {
            key: "v",
            header: "Version",
            numeric: true,
            sorted: "descending",
            cell: (r) => r.version,
          },
        ]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Version" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  /** Digits compared down a column have to line up, or the column is decoration. */
  it("applies tabular numerals to numeric cells", () => {
    render(
      <DataTable
        caption="Themes"
        rows={rows}
        rowKey={(r) => r.id}
        columns={[{ key: "v", header: "Version", numeric: true, cell: (r) => r.version }]}
      />,
    );
    expect(screen.getByRole("cell", { name: "7" }).className).toContain("tabular");
  });

  it("renders the empty state instead of a headed table with no rows", () => {
    render(
      <DataTable
        caption="Themes"
        rows={[]}
        rowKey={() => ""}
        columns={[{ key: "n", header: "Theme", cell: () => null }]}
        empty={<EmptyState title="No themes yet" body="Start from your brand colour." />}
      />,
    );
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("No themes yet")).toBeTruthy();
  });
});

describe("AxisGroup", () => {
  /**
   * Theme, density and bridge are each one choice from a set. Rendered as
   * unlabelled toggles they become six buttons with no indication that picking
   * one unpicks another.
   */
  it("is a labelled radio group, not a row of buttons", () => {
    render(
      <AxisGroup
        label="Theme"
        value="light"
        onChange={() => {}}
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />,
    );
    expect(screen.getByText("Theme")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Light" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "false");
  });

  it("does not change on a disabled option", async () => {
    const onChange = vi.fn();
    render(
      <AxisGroup
        label="Bridge"
        value="none"
        onChange={onChange}
        options={[
          { value: "none", label: "None" },
          {
            value: "mui",
            label: "MUI",
            disabled: true,
            reason: "Not enabled for this organisation.",
          },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: "MUI" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "MUI" })).toHaveAttribute("aria-disabled", "true");
  });

  /**
   * The radios are inside a group that names them.
   *
   * `role="radio"` outside a `radiogroup` is not a set of alternatives to a
   * screen reader — it is loose radios with nothing saying what they choose
   * between. The bar these sit in used to carry the role instead, which was
   * worse: three or four axes became one group of a dozen radios, so theme,
   * density and vision were announced as alternatives to each other.
   */
  it("wraps its options in a group named by the label", () => {
    render(
      <AxisGroup
        label="Density"
        value="standard"
        onChange={() => {}}
        options={[
          { value: "patient", label: "Patient" },
          { value: "standard", label: "Standard" },
        ]}
      />,
    );

    const group = screen.getByRole("radiogroup", { name: "Density" });
    expect(within(group).getAllByRole("radio")).toHaveLength(2);
  });

  /**
   * One tab stop for the whole axis, not one per option.
   *
   * A radio group that is a row of independent tab stops makes a keyboard user
   * step through every option to get past it — the playground has four axes, so
   * that is a dozen stops before the content. The roving tabindex is what makes
   * the role honest rather than decorative.
   */
  it("is a single tab stop, on the selected option", () => {
    render(
      <AxisGroup
        label="Theme"
        value="dark"
        onChange={() => {}}
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "high-contrast", label: "High contrast" },
        ]}
      />,
    );

    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute("tabindex", "0");
    for (const name of ["Light", "High contrast"]) {
      expect(screen.getByRole("radio", { name })).toHaveAttribute("tabindex", "-1");
    }
  });

  /**
   * Driven through a stateful wrapper, because the component is controlled.
   *
   * Asserting on `onChange` alone with a frozen `value` tests one keypress and
   * then lies: the second press starts from wherever the *unchanged* prop still
   * says, so a run of arrows walks a different path than a user would. This is
   * how it is actually mounted.
   */
  it("moves the selection with the arrow keys, in both directions", async () => {
    function Controlled() {
      const [value, setValue] = React.useState("light");
      return (
        <AxisGroup
          label="Theme"
          value={value}
          onChange={setValue}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "high-contrast", label: "High contrast" },
          ]}
        />
      );
    }
    render(<Controlled />);

    screen.getByRole("radio", { name: "Light" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");

    // Down is the same axis as right: these are read as a set rather than as a
    // horizontal strip, so both directions advance.
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "High contrast" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");

    // And focus follows the selection, or the next arrow starts from the wrong
    // place and the group stops being operable at all.
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveFocus();
  });

  it("wraps at the ends rather than stopping", async () => {
    const onChange = vi.fn();
    render(
      <AxisGroup
        label="Theme"
        value="light"
        onChange={onChange}
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />,
    );

    screen.getByRole("radio", { name: "Light" }).focus();
    // Backwards from the first lands on the last, which is what a set does.
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith("dark");
  });

  /**
   * A disabled option is stepped over, not landed on.
   *
   * Arrowing onto something that cannot be chosen strands the focus: the next
   * arrow press has to guess which way the user was going, and the selection
   * has silently not moved.
   */
  it("skips a disabled option when arrowing", async () => {
    const onChange = vi.fn();
    render(
      <AxisGroup
        label="Bridge"
        value="none"
        onChange={onChange}
        options={[
          { value: "none", label: "None" },
          { value: "mui", label: "MUI", disabled: true, reason: "Not enabled." },
          { value: "antd", label: "Ant Design" },
        ]}
      />,
    );

    screen.getByRole("radio", { name: "None" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("antd");
  });
});

describe("Callout", () => {
  /**
   * No longer an alert, and that is the fix rather than a regression.
   *
   * This used to assert `role="alert"` on a failing callout. Once action
   * results also raised a toast, that meant every failure announced twice. And
   * an alert only announces on *insertion*, so on the screens where a callout
   * renders with the page — a theme that already fails its gate — it never
   * announced at all. The toast is the announcement; this is the detail a
   * reader navigates to and works from.
   */
  it("is content rather than an announcement", () => {
    render(<Callout tone="fail" title="2 contrast failures" />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("2 contrast failures")).toBeTruthy();
  });

  it("keeps the severity legible without the role", () => {
    const { container } = render(<Callout tone="fail" title="2 contrast failures" />);
    // The word carries it; the colour reinforces it.
    expect(container.querySelector(".text-fail")).toBeTruthy();
  });

  it("does not shout for an ordinary notice", () => {
    render(<Callout tone="info" title="Importing writes to the draft." />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("lists problems separately so six do not become one sentence", () => {
    render(
      <Callout
        tone="fail"
        title="2 failures"
        items={["ref.brand.700 is 2.14:1, below 4.5:1", "border-strong is 2.02:1, below 3:1"]}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("EmptyState", () => {
  /** Never a dead end — the next action is part of the component. */
  it("offers a way forward", () => {
    render(
      <EmptyState
        title="No themes yet"
        body="Start from your brand colour."
        actions={<Button variant="primary">Create from brand colour</Button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Create from brand colour" })).toBeTruthy();
  });
});

describe("Panel", () => {
  it("names its region with a heading", () => {
    render(<Panel title="Brand ramp">content</Panel>);
    expect(screen.getByRole("heading", { name: "Brand ramp" })).toBeTruthy();
  });

  it("gives a panel action a fixed home in the footer", () => {
    render(
      <Panel title="Tokens" footer={<Button variant="primary">Save draft</Button>}>
        x
      </Panel>,
    );
    expect(screen.getByRole("button", { name: "Save draft" })).toBeTruthy();
  });
});
