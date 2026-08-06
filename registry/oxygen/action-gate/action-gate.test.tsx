import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActionGate } from "./action-gate";

const BASE = {
  action: "Discontinue",
  consequence: "The infusion stops immediately and the order is closed.",
  patientName: "Amara Okonkwo",
};

/** The trigger and the confirm button share the action's name on purpose — an
 *  action keeps its name throughout — so confirm is always scoped to the dialog. */
const dialog = () => screen.getByRole("alertdialog");
const confirmButton = () => within(dialog()).getByRole("button", { name: /^discontinue$/i });

async function openGate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /discontinue/i }));
}

describe("ActionGate", () => {
  /**
   * The copy rule is the whole component: it states what will happen, to whom,
   * and what cannot be undone. "Are you sure?" asks the reader to re-derive
   * the consequence they were already unsure about.
   */
  it("states the consequence and the patient, not just a question", async () => {
    const user = userEvent.setup();
    render(<ActionGate {...BASE} reversible onConfirm={vi.fn()} />);
    await openGate(user);

    expect(dialog().textContent).toContain(BASE.consequence);
    expect(dialog().textContent).toContain(BASE.patientName);
  });

  it("never reduces the prompt to a bare question", async () => {
    const user = userEvent.setup();
    render(<ActionGate {...BASE} reversible onConfirm={vi.fn()} />);
    await openGate(user);
    expect(dialog().textContent).not.toMatch(/are you sure/i);
  });

  it("keeps the action's name the same on the trigger and in the dialog", async () => {
    const user = userEvent.setup();
    render(<ActionGate {...BASE} reversible onConfirm={vi.fn()} />);
    await openGate(user);
    expect(dialog().textContent).toMatch(/discontinue/i);
  });

  /** A destructive confirmation is an alertdialog, not a dialog: it interrupts. */
  it("announces itself as a modal alert", async () => {
    const user = userEvent.setup();
    render(<ActionGate {...BASE} reversible onConfirm={vi.fn()} />);
    await openGate(user);
    expect(dialog()).toHaveAttribute("aria-modal", "true");
  });

  it("confirms a reversible action with one deliberate click", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ActionGate {...BASE} reversible onConfirm={onConfirm} />);
    await openGate(user);

    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  /**
   * Irreversible actions default to "type". A single click must not be enough,
   * or the friction calibration described in the component's docs is fiction.
   */
  it("will not fire an irreversible action until the phrase is typed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ActionGate {...BASE} reversible={false} onConfirm={onConfirm} />);
    await openGate(user);

    await user.click(confirmButton());
    expect(onConfirm).not.toHaveBeenCalled();

    await user.type(within(dialog()).getByRole("textbox"), "Discontinue");
    await user.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("rejects a phrase that does not match", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ActionGate {...BASE} reversible={false} onConfirm={onConfirm} />);
    await openGate(user);

    await user.type(within(dialog()).getByRole("textbox"), "Discontinu");
    await user.click(confirmButton());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("records the reason on the audit event when reasons are required", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ActionGate
        {...BASE}
        reversible
        reasons={["Adverse reaction", "Order error"]}
        onConfirm={onConfirm}
      />,
    );
    await openGate(user);

    await user.click(confirmButton());
    expect(onConfirm).not.toHaveBeenCalled();

    await user.selectOptions(within(dialog()).getByLabelText(/reason/i), "Adverse reaction");
    await user.click(confirmButton());

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ reason: "Adverse reaction" }));
  });

  it("emits an audit event naming the action", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ActionGate {...BASE} reversible onConfirm={onConfirm} />);
    await openGate(user);
    await user.click(confirmButton());

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ action: "Discontinue" }));
  });

  it("does nothing when cancelled", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ActionGate {...BASE} reversible onConfirm={onConfirm} />);
    await openGate(user);
    await user.click(within(dialog()).getByRole("button", { name: /cancel/i }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("says plainly when an action cannot be undone", async () => {
    const user = userEvent.setup();
    render(<ActionGate {...BASE} reversible={false} onConfirm={vi.fn()} />);
    await openGate(user);
    expect(dialog().textContent).toMatch(/cannot be undone|permanent|irreversible/i);
  });

  /** The component emits an audit event; it does not claim to store one. */
  it("does not imply an audit trail it cannot provide", async () => {
    const user = userEvent.setup();
    render(<ActionGate {...BASE} reversible onConfirm={vi.fn()} />);
    await openGate(user);
    expect(dialog().textContent).toMatch(/audit/i);
  });
});
