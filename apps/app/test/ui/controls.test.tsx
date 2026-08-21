/**
 * The three form controls, held to being one control.
 *
 * They were three before this: `Input` had the kit's appearance, five raw
 * `<select>`s across two screens had hand-copied subsets of it, and the import
 * `<textarea>` had a third variant. Only one of the three had a focus ring.
 *
 * What is asserted here is the property that failure had — that the shared
 * class string is actually shared — plus the accessibility contracts a native
 * control gives us for free and a custom one would have to earn.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Input, Select, Textarea, controlClasses } from "@/components/ui";

describe("every control shares one appearance", () => {
  it("gives all three the same border, focus ring and radius", () => {
    render(
      <>
        <Input aria-label="text" />
        <Select aria-label="choice">
          <option>a</option>
        </Select>
        <Textarea aria-label="prose" />
      </>,
    );

    /*
     * Read from `controlClasses` rather than written out here.
     *
     * The point of this test is that the three controls agree, not that they
     * agree on one particular string — spelling the focus ring out a second
     * time only means editing it in two places, which is what happened when
     * the ring changed and this failed on a change that was correct.
     */
    const expected = controlClasses().split(" ").filter(Boolean);
    for (const name of ["text", "choice", "prose"]) {
      const control = screen.getByLabelText(name);
      for (const token of expected) {
        expect(control.className, `${name} is missing ${token}`).toContain(token);
      }
    }

    // And the shared string is a real appearance, not an empty agreement.
    expect(expected).toEqual(
      expect.arrayContaining(["rounded-lg", "border-rule-strong", "focus:outline-none"]),
    );
  });

  it("marks an invalid control on the element itself, not only in colour", () => {
    render(<Input aria-label="hex" aria-invalid />);
    const input = screen.getByLabelText("hex");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.className).toContain("border-fail");
  });

  it("passes `invalid` through on select and textarea", () => {
    render(
      <>
        <Select aria-label="choice" invalid>
          <option>a</option>
        </Select>
        <Textarea aria-label="prose" invalid />
      </>,
    );

    expect(screen.getByLabelText("choice")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("prose")).toHaveAttribute("aria-invalid", "true");
  });

  /**
   * Disabled must not be expressed with opacity: it multiplies both sides of a
   * contrast pair by a number nobody checked, which is how the frameworks save
   * button ended up failing the axe sweep.
   */
  it("expresses disabled with its own colours rather than opacity", () => {
    expect(controlClasses()).toContain("disabled:bg-paper-sunk");
    expect(controlClasses()).not.toContain("opacity");
  });
});

describe("Select", () => {
  it("is a real select, so it is keyboard-operable without any work", async () => {
    const user = userEvent.setup();
    render(
      <Select aria-label="Role" defaultValue="viewer">
        <option value="admin">Admin</option>
        <option value="viewer">Viewer</option>
      </Select>,
    );

    const select = screen.getByLabelText("Role");
    expect(select.tagName).toBe("SELECT");

    await user.selectOptions(select, "admin");
    expect(select).toHaveValue("admin");
  });

  it("hides its own chevron from the accessibility tree", () => {
    const { container } = render(
      <Select aria-label="Role">
        <option>a</option>
      </Select>,
    );
    // The UA arrow cannot be recoloured, so we draw one — and it is decoration.
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("leaves room for that chevron so a long value does not run under it", () => {
    render(
      <Select aria-label="Role">
        <option>a</option>
      </Select>,
    );
    expect(screen.getByLabelText("Role").className).toContain("pr-9");
  });
});

describe("Textarea", () => {
  it("cannot be dragged wider than its container", () => {
    render(<Textarea aria-label="prose" />);
    // `resize: both` lets a reader break the layout, and there is no reason to.
    expect(screen.getByLabelText("prose").className).toContain("resize-y");
  });
});

describe("Button sizes", () => {
  it("offers three, and they differ", () => {
    render(
      <>
        <Button size="md">medium</Button>
        <Button size="sm">small</Button>
        <Button size="icon" aria-label="icon" />
      </>,
    );

    const md = screen.getByRole("button", { name: "medium" }).className;
    const sm = screen.getByRole("button", { name: "small" }).className;
    const icon = screen.getByRole("button", { name: "icon" }).className;

    expect(md).not.toBe(sm);
    expect(sm).not.toBe(icon);
    // An icon button is square: it holds a glyph, not a word.
    expect(icon).toContain("p-1.5");
  });

  it("keeps the disabled-with-reason contract at every size", () => {
    render(
      <Button size="sm" id="pub" reason="Needs an admin.">
        Publish
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Publish" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    // Focusable, so the reason stays reachable by keyboard.
    expect(button).not.toHaveAttribute("disabled");
    expect(screen.getByText("Needs an admin.")).toBeInTheDocument();
  });
});
