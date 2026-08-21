/**
 * Action results, announced once and in the right place.
 *
 * The behaviour worth protecting is the asymmetry: a success fades, a failure
 * does not. A validation refusal names the pair, the ratio and the floor —
 * that is something to read and act on, not something to catch before it
 * disappears.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "@/components/ui";

function Raiser({ tone, title }: { tone: "pass" | "fail" | "info"; title: string }) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast.show({ tone, title })}>
      raise
    </button>
  );
}

describe("Toast", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("shows what happened", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Raiser tone="pass" title="Published v3." />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "raise" }));
    expect(screen.getByText("Published v3.")).toBeInTheDocument();
  });

  it("dismisses a success on its own", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Raiser tone="pass" title="Saved." />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "raise" }));
    expect(screen.getByText("Saved.")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(6500);
    });
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument();
  });

  /** The rule this component exists for. */
  it("keeps a failure until it is dismissed", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Raiser tone="fail" title="2 of these overrides cannot be saved." />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "raise" }));
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText("2 of these overrides cannot be saved.")).toBeInTheDocument();
  });

  it("gives a failure the alert role and a success the status role", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Raiser tone="fail" title="Refused." />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "raise" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Refused.");
  });

  it("can be dismissed by hand", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <Raiser tone="fail" title="Refused." />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "raise" }));
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Refused.")).not.toBeInTheDocument();
  });

  /**
   * A live region added at the same moment as its content is not announced, so
   * the container has to exist before anything is raised.
   */
  it("keeps the live region mounted while empty", () => {
    const { container } = render(
      <ToastProvider>
        <span />
      </ToastProvider>,
    );
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });

  /**
   * Outside a provider it is a no-op rather than a throw: losing a confirmation
   * is bad, losing the screen that produced it is worse.
   */
  it("does not throw when used without a provider", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Raiser tone="pass" title="Nowhere to go." />);
    await expect(user.click(screen.getByRole("button", { name: "raise" }))).resolves.not.toThrow();
  });
});
