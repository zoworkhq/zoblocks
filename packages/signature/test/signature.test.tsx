/**
 * The React surface.
 *
 * The test that matters most is `signs with the keyboard alone` — it never
 * dispatches a pointer event, so if it passes, the WCAG 2.1.1 argument in the
 * design brief is a test result rather than a claim. Everything else is
 * grouped around a failure that ships in real signature components: an error
 * border that never appears, a decline that cannot be submitted, an antd
 * accessibility gap left open, or ink that vanishes because the tab changed.
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Form } from "antd";
import axe from "axe-core";
import {
  Signature,
  SignatureManifest,
  SignaturePad,
  signatureAffirmative,
  signatureRequired,
  type SignatureValue,
} from "../src/index";

const NOW = "2026-08-16T14:36:02.000Z";

/**
 * Walk focus to `target` with Tab presses only.
 *
 * Deliberately not `target.focus()`: the claim being tested is that a keyboard
 * can *reach* the control, and a programmatic focus call proves nothing about
 * that. Bounded so a control that is genuinely unreachable fails with a useful
 * message instead of hanging.
 */
async function tabTo(
  user: ReturnType<typeof userEvent.setup>,
  target: HTMLElement,
  limit = 40,
): Promise<void> {
  for (let i = 0; i < limit; i++) {
    if (document.activeElement === target) return;
    await user.tab();
  }
  if (document.activeElement !== target) {
    throw new Error(
      `never reached ${target.tagName}[${target.getAttribute("aria-label") ?? target.textContent?.trim().slice(0, 40)}] with ${limit} Tab presses`,
    );
  }
}

const SIGNED: SignatureValue = {
  outcome: "signed",
  method: "type",
  ink: {
    strokes: [],
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60"><text y="40">Josh Randall</text></svg>',
    // Structured, because the manifest renders elements rather than injecting
    // the string above — see SignatureInk.
    render: {
      viewBox: "0 0 200 60",
      paths: [],
      text: { value: "Josh Randall", x: 16, y: 40, fontSize: 44, fontFamily: "serif" },
    },
    bounds: { x: 0, y: 0, width: 200, height: 60 },
  },
  signer: { name: "Josh Randall" },
  capacity: "self",
  meaning: "consent",
  attestation: "I agree to the procedure described above.",
  recordedAt: NOW,
  recordedBy: { name: "A. Okafor", credential: "RN" },
  provenance: { method: "type" },
};

const DECLINED: SignatureValue = {
  outcome: "declined",
  reason: "Wants to discuss with her daughter first.",
  recordedAt: NOW,
  recordedBy: { name: "A. Okafor", credential: "RN" },
};

async function noViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // jsdom reports every element as zero-sized, so a colour-contrast pass
      // here would be meaningless. Contrast is gated by the token build and
      // checked for real in the Playwright suite.
      "color-contrast": { enabled: false },
    },
  });
  return results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`);
}

/* ------------------------------------------------------------------ */

describe("SignaturePad accessibility", () => {
  it("is a labelled group, not a bare canvas", async () => {
    // A <canvas> has no implicit role and there is no role meaning "drawing
    // surface". The group is what ties label, hint and error to the control,
    // which is what SC 1.3.1 asks for.
    render(<SignaturePad label="Patient signature" hint="Sign above the line." />);
    const group = screen.getByRole("group", { name: "Patient signature" });
    expect(group).toBeInTheDocument();
    expect(group).toHaveAccessibleDescription("Sign above the line.");
  });

  it("gives every toolbar control a real name, not a glyph", async () => {
    // An icon-only button whose accessible name is its glyph announces as
    // "left arrow", which tells nobody anything.
    render(<SignaturePad />);
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /redo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("carries a polite live region for state nothing else reports", () => {
    // SVG and canvas changes are invisible to assistive technology. Without
    // this a screen-reader user cannot tell whether anything was captured.
    const { container } = render(<SignaturePad />);
    const live = container.querySelector('[role="status"][aria-live="polite"]');
    expect(live).toBeInTheDocument();
  });

  it("hides the drawing surface from assistive technology", () => {
    // role="img" on a live capture surface would assert a non-interactive
    // graphic — a lie about an element that takes input, and an SC 4.1.2
    // failure. The surface is the affordance for one mode; the group is the
    // control.
    const { container } = render(<SignaturePad />);
    const ink = container.querySelector(".ox-signature__ink");
    expect(ink).toHaveAttribute("aria-hidden", "true");
  });

  it("marks the toolbar as buttons, not submits", async () => {
    // The default type is "submit". Inside a form — which is where this always
    // lives — Clear would submit the consent form.
    render(<SignaturePad />);
    for (const name of [/undo/i, /redo/i, /clear/i]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("type", "button");
    }
  });

  it("passes axe", async () => {
    const { container } = render(<SignaturePad label="Signature" hint="Sign here." />);
    expect(await noViolations(container)).toEqual([]);
  });

  it("disables undo, redo and clear when there is nothing to act on", () => {
    render(<SignaturePad />);
    expect(screen.getByRole("button", { name: /undo/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /redo/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
  });
});

describe("the typed path", () => {
  it("signs with the keyboard alone", async () => {
    /*
     * No pointer events anywhere in this test — that is the whole point, and
     * it is easy to lose. This used to reach each control with `user.click()`,
     * which dispatches a full pointer sequence, so the test that the WCAG
     * 2.1.1 (Level A) argument rests on was quietly proving the component
     * works with a mouse. Only `user.tab()` and `user.keyboard()` appear
     * below; `tabTo` walks focus the way a keyboard actually does rather than
     * calling `.focus()`, which no keyboard can do.
     */
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    const onChange = vi.fn();

    render(<Signature now={NOW} onChange={onChange} attestation="I agree." />);

    await user.tab();
    expect(screen.getByRole("button", { name: /add signature/i })).toHaveFocus();
    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("dialog");

    // The dialog opens with focus on the first required field, so the signer's
    // name is typed without moving at all. Waited for rather than asserted
    // outright: antd moves focus in `afterOpenChange`, which fires when the
    // open transition ends, so the dialog exists in the DOM slightly before it
    // has decided where focus goes.
    const fullName = within(dialog).getByLabelText(/full name/i);
    await waitFor(() => expect(fullName).toHaveFocus());
    await user.keyboard("Josh Randall");

    // antd's Tabs use manual activation: arrow keys move focus along the
    // tablist and Enter selects. Tabbing past the tablist would skip it.
    await tabTo(user, within(dialog).getByRole("tab", { name: /draw/i }));
    await user.keyboard("{ArrowRight}{Enter}");
    expect(within(dialog).getByRole("tab", { name: /type/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await tabTo(user, within(dialog).getByLabelText(/type your name to sign/i));
    await user.keyboard("Josh Randall");

    await tabTo(user, within(dialog).getByRole("button", { name: /sign and continue/i }));
    await user.keyboard("{Enter}");

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const value = onChange.mock.calls[0]?.[0] as SignatureValue;
    expect(value.outcome).toBe("signed");
    expect(value.outcome === "signed" && value.method).toBe("type");
  });

  it("never pre-fills the signature field", async () => {
    // Cunningham v. Zurich held a signature block was not a signature because
    // nothing showed it was "typed purposefully rather than generated
    // automatically". An autofilled name is exactly that fact pattern, so the
    // identity field may be pre-filled and the signature field may not.
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    render(<Signature now={NOW} signer={{ name: "Josh Randall" }} />);

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("tab", { name: /type/i }));

    expect(within(dialog).getByLabelText(/full name/i)).toHaveValue("Josh Randall");
    expect(within(dialog).getByLabelText(/type your name to sign/i)).toHaveValue("");
  });

  it("says the typed name has the same legal effect", async () => {
    // The sentence that stops people retreating to the inaccessible tab.
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    render(<Signature now={NOW} />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("tab", { name: /type/i }));

    expect(within(dialog).getByText(/same legal effect as signing by hand/i)).toBeInTheDocument();
  });

  it("still renders when the typed path is removed, so the lint rule is the guard", () => {
    // A component that writes to a customer's console is forbidden here, and
    // the mistake is invisible at runtime anyway — it renders and passes every
    // other test. `@oxygenui/signature-requires-typed-path` is what catches it,
    // with its own tests in the eslint plugin.
    render(<Signature now={NOW} methods={["draw"]} />);
    expect(screen.getByRole("button", { name: /add signature/i })).toBeInTheDocument();
  });
});

describe("antd gaps this component closes", () => {
  it("names the dialog even though the header is custom", async () => {
    // antd wires aria-labelledby only when `title` is passed; a custom header
    // otherwise leaves the dialog anonymous.
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    render(<Signature now={NOW} title="Sign consent for treatment" />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName(/sign consent for treatment/i);
  });

  it("wires the tabs to their panels", async () => {
    // Without an `id` on antd's Tabs, aria-controls and aria-labelledby are
    // omitted entirely and the relationship is invisible to assistive tech.
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    render(<Signature now={NOW} />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));

    const dialog = await screen.findByRole("dialog");
    for (const name of [/draw/i, /type/i, /upload/i]) {
      expect(within(dialog).getByRole("tab", { name })).toHaveAttribute("aria-controls");
    }
  });

  it("keeps the ink when the user peeks at another tab", async () => {
    // antd destroys hidden panes by default. That would silently erase a
    // signature the moment somebody glanced at the Type tab.
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    render(<Signature now={NOW} />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("tab", { name: /type/i }));
    await user.click(within(dialog).getByRole("tab", { name: /draw/i }));

    // The pad is still mounted rather than rebuilt from nothing.
    expect(within(dialog).getByRole("group", { name: /signature/i })).toBeInTheDocument();
  });
});

describe("the outcomes", () => {
  it("offers a way out for someone who cannot sign", async () => {
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    render(<Signature now={NOW} outcomes={["declined", "unable"]} />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: /can't sign/i })).toBeInTheDocument();
  });

  it("records a decline with its reason", async () => {
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    const onChange = vi.fn();
    render(
      <Signature
        now={NOW}
        onChange={onChange}
        recordedBy={{ name: "A. Okafor", credential: "RN" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    await user.click(await screen.findByRole("button", { name: /can't sign/i }));

    const sheet = await screen.findByRole("dialog");
    await user.type(within(sheet).getByRole("textbox"), "Wants to discuss with her daughter.");
    await user.click(within(sheet).getByRole("button", { name: /^record$/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const value = onChange.mock.calls[0]?.[0] as SignatureValue;
    expect(value.outcome).toBe("declined");
    expect(value.outcome === "declined" && value.reason).toMatch(/daughter/);
    // Attribution is not optional: an outcome with no signer has to say who
    // recorded it.
    expect(value.recordedBy?.name).toBe("A. Okafor");
  });

  it("refuses to record an unwitnessed 'unable'", async () => {
    // The type makes `witness` mandatory. The interface must not let someone
    // reach submit and then be surprised by it.
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    const onChange = vi.fn();
    render(<Signature now={NOW} onChange={onChange} outcomes={["declined", "unable"]} />);

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    await user.click(await screen.findByRole("button", { name: /can't sign/i }));

    const sheet = await screen.findByRole("dialog");
    await user.click(within(sheet).getByRole("radio", { name: /unable to sign/i }));
    await user.click(within(sheet).getByRole("button", { name: /^record$/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(within(sheet).getByText(/still needed/i)).toBeInTheDocument();
  });

  it("says a witness is required where the choice is made", async () => {
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    render(<Signature now={NOW} outcomes={["unable"]} />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    await user.click(await screen.findByRole("button", { name: /can't sign/i }));

    const sheet = await screen.findByRole("dialog");
    // Twice, deliberately: once where the outcome is chosen so nobody is
    // ambushed later, and once beside the field itself.
    expect(within(sheet).getAllByText(/a witness is required/i).length).toBeGreaterThanOrEqual(1);
  });

  it("frames a decline as a decision rather than a failure", async () => {
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    render(<Signature now={NOW} />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    await user.click(await screen.findByRole("button", { name: /can't sign/i }));

    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText(/not a dead end/i)).toBeInTheDocument();
  });
});

describe("Form integration", () => {
  it("accepts a decline as an answer to a required rule", async () => {
    // The single most likely integration mistake, guarded here: a rule that
    // demands "signed" makes a refusal impossible to submit, which defeats the
    // whole point of the component.
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    const onFinish = vi.fn();

    render(
      <Form onFinish={onFinish} initialValues={{ consent: DECLINED }}>
        <Form.Item name="consent" label="Patient signature" rules={[signatureRequired()]}>
          <Signature now={NOW} />
        </Form.Item>
        <Button htmlType="submit">Submit</Button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => expect(onFinish).toHaveBeenCalled());
  });

  it("blocks submission when the field is untouched", async () => {
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    const onFinish = vi.fn();

    render(
      <Form onFinish={onFinish}>
        <Form.Item name="consent" label="Patient signature" rules={[signatureRequired()]}>
          <Signature now={NOW} />
        </Form.Item>
        <Button htmlType="submit">Submit</Button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => expect(screen.getByText(/signature is required/i)).toBeInTheDocument());
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("offers a stricter rule for the cases that need agreement", async () => {
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    const onFinish = vi.fn();

    render(
      <Form onFinish={onFinish} initialValues={{ consent: DECLINED }}>
        <Form.Item name="consent" label="Consent" rules={[signatureAffirmative()]}>
          <Signature now={NOW} />
        </Form.Item>
        <Button htmlType="submit">Submit</Button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => expect(screen.getByText(/has not been given/i)).toBeInTheDocument());
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("attaches the id from Form.Item so the label resolves", async () => {
    // Three props, not two: without `id`, `<label for>` points at nothing and
    // the visible label is decorative.
    render(
      <Form>
        <Form.Item name="consent" label="Patient signature">
          <Signature now={NOW} />
        </Form.Item>
      </Form>,
    );

    const label = document.querySelector("label[for]");
    expect(label).not.toBeNull();
    expect(document.getElementById(label!.getAttribute("for")!)).toBeInTheDocument();
  });
});

describe("SignatureManifest", () => {
  it("shows the three things 21 CFR 11.50 requires", async () => {
    const { container } = render(<SignatureManifest value={SIGNED} />);
    // Printed name — scoped past the SVG, which also contains the typed name.
    const printed = container.querySelector(".ox-signature-manifest__ink > div:last-child");
    expect(printed).toHaveTextContent("Josh Randall");
    // …the meaning…
    expect(screen.getByText(/consent — agreement/i)).toBeInTheDocument();
    // …and a date and time.
    expect(document.querySelector("time")).toHaveAttribute("datetime", NOW);
  });

  it("names the signature by whose it is, not by what it looks like", async () => {
    // SC 1.1.1's equivalent purpose for a signature image is whose it is and
    // that it was given — never a description of the strokes.
    render(<SignatureManifest value={SIGNED} />);
    const image = screen.getByRole("img");
    expect(image).toHaveAccessibleName(/signature of josh randall/i);
    expect(image).not.toHaveAccessibleName(/handwritten|strokes|scribble/i);
  });

  it("says plainly that a PNG is not a cryptographic signature", () => {
    render(<SignatureManifest value={SIGNED} />);
    expect(screen.getByText(/not a cryptographic signature/i)).toBeInTheDocument();
  });

  it("renders a decline as a record, not an empty field", () => {
    render(<SignatureManifest value={DECLINED} />);
    expect(screen.getByText(/declined/i)).toBeInTheDocument();
    expect(screen.getByText(/daughter/i)).toBeInTheDocument();
  });

  it("keeps the original signature visible after revocation", () => {
    // Consent given and then withdrawn is a different fact from consent never
    // given, and only the retained signature can tell them apart.
    render(
      <SignatureManifest
        value={{
          outcome: "revoked",
          original: SIGNED,
          revokedBy: { name: "A. Okafor", credential: "RN" },
          revokedAt: "2026-08-18T09:00:00.000Z",
          reason: "Patient withdrew before the procedure.",
          recordedAt: "2026-08-18T09:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByRole("img")).toHaveAccessibleName(/withdrawn signature of josh randall/i);
    expect(screen.getByText(/withdrew before the procedure/i)).toBeInTheDocument();
  });

  it("never relies on colour alone for a status", () => {
    // Every state is also named in text, which is what survives forced-colors
    // mode and colour blindness.
    render(<SignatureManifest value={DECLINED} />);
    expect(screen.getByText("Declined")).toBeInTheDocument();
  });

  it("passes axe for every outcome", async () => {
    const values: SignatureValue[] = [
      SIGNED,
      DECLINED,
      {
        outcome: "unable",
        reason: "sedated-or-unconscious",
        witness: { name: "M. Silva", credential: "MD" },
        recordedAt: NOW,
        recordedBy: { name: "A. Okafor", credential: "RN" },
      },
      {
        outcome: "verbal",
        channel: "phone",
        witness: { name: "M. Silva", credential: "MD" },
        recordedAt: NOW,
        recordedBy: { name: "A. Okafor", credential: "RN" },
      },
      { outcome: "on-paper", recordedAt: NOW, recordedBy: { name: "A. Okafor" } },
    ];

    for (const value of values) {
      const { container, unmount } = render(<SignatureManifest value={value} title="Record" />);
      expect(await noViolations(container), value.outcome).toEqual([]);
      unmount();
    }
  });

  /*
   * The evidence each outcome carries.
   *
   * `passes axe for every outcome` above renders most of the union, but only
   * ever in its barest form — so the fields that make a non-signed outcome an
   * actual record, rather than a label, went unasserted. Each of these is a
   * field §11.50 or the pathway depends on: what was read out, where the scan
   * went, who watched, what is still outstanding.
   */

  it("renders a countersignature that is still outstanding", () => {
    // Signed by the resident, awaiting the attending. Rendering this as an
    // empty field is the case the union exists to prevent.
    render(
      <SignatureManifest
        value={{
          outcome: "pending",
          awaiting: "clinician",
          since: NOW,
          soFar: [SIGNED],
          recordedAt: NOW,
          recordedBy: { name: "A. Okafor", credential: "RN" },
        }}
      />,
    );

    expect(screen.getByText("Awaiting countersignature")).toBeInTheDocument();
    expect(screen.getByText("Clinician")).toBeInTheDocument();
    expect(document.querySelector("time")).toHaveAttribute("datetime", NOW);
  });

  it("spells out an unable reason and keeps the free text beside it", () => {
    // The coded reason drives the pathway; `detail` is what the nurse actually
    // saw. Showing only one of them loses half the record.
    render(
      <SignatureManifest
        value={{
          outcome: "unable",
          reason: "physically-unable",
          detail: "Right arm in a cast after this morning's fall.",
          witness: { name: "M. Silva", credential: "MD" },
          recordedAt: NOW,
          recordedBy: { name: "A. Okafor", credential: "RN" },
        }}
      />,
    );

    expect(screen.getByText(/physically unable to hold a pen or stylus/i)).toBeInTheDocument();
    expect(screen.getByText(/right arm in a cast/i)).toBeInTheDocument();
    expect(screen.getByText("M. Silva, MD")).toBeInTheDocument();
  });

  it("shows the wording that was read out, not just that a call happened", () => {
    render(
      <SignatureManifest
        value={{
          outcome: "verbal",
          channel: "phone",
          script: "I have explained the risks and she confirmed she understood them.",
          witness: { name: "M. Silva", credential: "MD" },
          recordedAt: NOW,
          recordedBy: { name: "A. Okafor", credential: "RN" },
        }}
      />,
    );

    expect(screen.getByText("Consented verbally")).toBeInTheDocument();
    expect(screen.getByText(/confirmed she understood/i)).toBeInTheDocument();
  });

  it("points at the scan once one exists", () => {
    render(
      <SignatureManifest
        value={{
          outcome: "on-paper",
          scanRef: "DocumentReference/scan-4471",
          recordedAt: NOW,
          recordedBy: { name: "A. Okafor", credential: "RN" },
        }}
      />,
    );

    expect(screen.getByText("Signed on paper")).toBeInTheDocument();
    expect(screen.getByText("DocumentReference/scan-4471")).toBeInTheDocument();
  });

  it("names the witness to a decline when there was one", () => {
    render(
      <SignatureManifest
        value={{
          outcome: "declined",
          reason: "Wants to discuss with her daughter first.",
          witness: { name: "M. Silva", credential: "MD" },
          recordedAt: NOW,
          recordedBy: { name: "A. Okafor", credential: "RN" },
        }}
      />,
    );

    expect(screen.getByText("M. Silva, MD")).toBeInTheDocument();
  });

  it("distinguishes an unchecked document from a checked one", () => {
    // An absent check and a passing check must not look the same — the whole
    // reason `verified` is optional rather than defaulting to false.
    const { rerender } = render(<SignatureManifest value={SIGNED} title="Record" />);
    expect(screen.queryByText(/document/i)).not.toBeInTheDocument();

    rerender(<SignatureManifest value={SIGNED} title="Record" verified />);
    expect(screen.getByText(/valid — document unchanged/i)).toBeInTheDocument();

    rerender(<SignatureManifest value={SIGNED} title="Record" verified={false} />);
    expect(screen.getByText(/document has changed since signing/i)).toBeInTheDocument();
  });

  it("says who the signer was acting for when it is not themselves", () => {
    render(
      <SignatureManifest
        value={{
          ...SIGNED,
          capacity: "proxy",
          onBehalfOf: { display: "Eleanor Randall" },
          signer: { name: "Josh Randall", credential: "Healthcare proxy" },
        }}
      />,
    );

    expect(
      screen.getByText(/healthcare proxy · on behalf of eleanor randall/i),
    ).toBeInTheDocument();
  });

  it("describes a drawn mark by its strokes and the pointer that made it", () => {
    const drawn: SignatureValue = {
      ...SIGNED,
      method: "draw",
      documentHash: "sha256:9f2c",
      provenance: { method: "draw", pointerType: "pen", strokeCount: 3 },
    };
    const { rerender } = render(<SignatureManifest value={drawn} />);
    expect(screen.getByText("Drawn · 3 strokes · stylus")).toBeInTheDocument();
    expect(screen.getByText("sha256:9f2c")).toBeInTheDocument();

    // Singular, because "1 strokes" on a legal record reads as a bug.
    rerender(
      <SignatureManifest
        value={{ ...drawn, provenance: { method: "draw", pointerType: "touch", strokeCount: 1 } }}
      />,
    );
    expect(screen.getByText("Drawn · 1 stroke · finger on a touchscreen")).toBeInTheDocument();
  });

  it("falls back to the raw timestamp rather than printing 'Invalid Date'", () => {
    render(<SignatureManifest value={{ ...SIGNED, recordedAt: "not-a-date" }} />);
    expect(screen.getByText("not-a-date")).toBeInTheDocument();
  });

  it("drops the integrity note when the host has its own", () => {
    render(<SignatureManifest value={SIGNED} hideIntegrityNote />);
    expect(screen.queryByText(/not a cryptographic signature/i)).not.toBeInTheDocument();
  });
});

describe("the field", () => {
  it("shows the record once signed, not a blank box", () => {
    const { container } = render(<Signature now={NOW} value={SIGNED} />);
    expect(container.querySelector(".ox-signature-manifest")).toHaveTextContent("Josh Randall");
    expect(screen.queryByRole("button", { name: /add signature/i })).not.toBeInTheDocument();
  });

  it("says 'Not signed' rather than nothing when locked", () => {
    // Absence is stated, never punctuated — the same rule the lint plugin
    // enforces on values.
    render(<Signature now={NOW} disabled />);
    expect(screen.getByText(/not signed/i)).toBeInTheDocument();
  });

  it("works uncontrolled", async () => {
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    const { container } = render(<Signature now={NOW} defaultValue={SIGNED} />);
    expect(container.querySelector(".ox-signature-manifest")).toHaveTextContent("Josh Randall");
    await user.click(screen.getByRole("button", { name: /change/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("clears between openings, because bedside tablets are shared", async () => {
    // A previous patient's ink carried into the next signing is a disclosure,
    // not a convenience.
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    render(<Signature now={NOW} />);

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    let dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("tab", { name: /type/i }));
    await user.type(within(dialog).getByLabelText(/type your name to sign/i), "Someone Else");
    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

    await user.click(screen.getByRole("button", { name: /add signature/i }));
    dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("tab", { name: /type/i }));
    expect(within(dialog).getByLabelText(/type your name to sign/i)).toHaveValue("");
  });

  it("emits audit events without ever transmitting anything", async () => {
    const user = userEvent.setup({
      // jsdom runs no CSS transitions, so the `pointer-events: none` antd sets
      // on a modal while it animates in never clears — a real browser clears it
      // in about 200ms, and the Playwright suite exercises these same paths for
      // real. Checking it here tests jsdom, not the component.
      pointerEventsCheck: 0,
    });
    const onAuditEvent = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<Signature now={NOW} onAuditEvent={onAuditEvent} />);
    await user.click(screen.getByRole("button", { name: /add signature/i }));
    await screen.findByRole("dialog");

    expect(onAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "opened", at: NOW }));
    // The host writes the trail. The component never phones home.
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
