import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RestrictedShield } from "./restricted-shield";

const SECRET = "Positive HIV serology";

describe("RestrictedShield", () => {
  /**
   * The redacted state is the DEFAULT render, not the fallback. Every path
   * here fails closed: if the application forgets to pass a decision, the
   * content must not appear.
   */
  it("conceals content when restricted", () => {
    const view = render(
      <RestrictedShield restricted>
        <p>{SECRET}</p>
      </RestrictedShield>,
    );
    expect(view.container.textContent).not.toContain(SECRET);
  });

  it("fails closed when disclosure permission is not stated", () => {
    const view = render(
      <RestrictedShield restricted disclosurePermitted={undefined}>
        <p>{SECRET}</p>
      </RestrictedShield>,
    );
    expect(view.container.textContent).not.toContain(SECRET);
  });

  it("shows content when it is not restricted", () => {
    const view = render(
      <RestrictedShield restricted={false}>
        <p>{SECRET}</p>
      </RestrictedShield>,
    );
    expect(view.container.textContent).toContain(SECRET);
  });

  /**
   * The subtle requirement: state that restricted content EXISTS without
   * revealing what it is. A reader who cannot tell "nothing here" from
   * "something here you cannot see" misreads the chart in one direction.
   */
  it("acknowledges that something exists without revealing it", () => {
    const view = render(
      <RestrictedShield restricted category="Behavioral health">
        <p>{SECRET}</p>
      </RestrictedShield>,
    );
    expect(view.container.textContent).not.toContain(SECRET);
    expect(view.container.textContent).toMatch(/restricted|protected|hidden/i);
  });

  /** The narrower case where even the acknowledgement is not permitted. */
  it("conceals the existence of the content entirely when told to", () => {
    const view = render(
      <RestrictedShield restricted concealExistence category="Behavioral health">
        <p>{SECRET}</p>
      </RestrictedShield>,
    );
    const text = view.container.textContent ?? "";
    expect(text).not.toContain(SECRET);
    expect(text).not.toMatch(/restricted|protected|hidden|behavioral health/i);
  });

  it("does not offer disclosure when disclosure is not permitted", () => {
    render(
      <RestrictedShield restricted disclosurePermitted={false} onDisclose={vi.fn()}>
        <p>{SECRET}</p>
      </RestrictedShield>,
    );
    const reveal = screen.queryByRole("button", { name: /reveal|show|disclose/i });
    expect(reveal).not.toBeInTheDocument();
  });

  it("logs a reasoned disclosure and only then reveals", async () => {
    const onDisclose = vi.fn();
    const view = render(
      <RestrictedShield
        restricted
        disclosurePermitted
        category="Behavioral health"
        reasons={["Treatment", "Emergency"]}
        onDisclose={onDisclose}
      >
        <p>{SECRET}</p>
      </RestrictedShield>,
    );

    expect(view.container.textContent).not.toContain(SECRET);

    await userEvent.click(screen.getByRole("button", { name: /disclose with a reason/i }));
    await userEvent.selectOptions(screen.getByLabelText(/reason/i), "Treatment");
    await userEvent.click(screen.getByRole("button", { name: /^disclose$/i }));

    expect(onDisclose).toHaveBeenCalledOnce();
    expect(onDisclose).toHaveBeenCalledWith(expect.objectContaining({ reason: "Treatment" }));
    expect(view.container.textContent).toContain(SECRET);
  });

  /**
   * "Disclosure is deliberate, reasoned, time-boxed, and logged." An unreasoned
   * disclosure is none of those, so the button must not act on an empty reason.
   */
  it("refuses to disclose without a reason", async () => {
    const onDisclose = vi.fn();
    const view = render(
      <RestrictedShield
        restricted
        disclosurePermitted
        reasons={["Treatment"]}
        onDisclose={onDisclose}
      >
        <p>{SECRET}</p>
      </RestrictedShield>,
    );

    await userEvent.click(screen.getByRole("button", { name: /disclose with a reason/i }));
    await userEvent.click(screen.getByRole("button", { name: /^disclose$/i }));

    expect(onDisclose).not.toHaveBeenCalled();
    expect(view.container.textContent).not.toContain(SECRET);
  });

  it("leaves the content concealed when the disclosure is cancelled", async () => {
    const view = render(
      <RestrictedShield restricted disclosurePermitted reasons={["Treatment"]} onDisclose={vi.fn()}>
        <p>{SECRET}</p>
      </RestrictedShield>,
    );

    await userEvent.click(screen.getByRole("button", { name: /disclose with a reason/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(view.container.textContent).not.toContain(SECRET);
  });

  it("re-closes on its own rather than unlocking for the session", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const view = render(
        <RestrictedShield
          restricted
          disclosurePermitted
          durationSeconds={30}
          reasons={["Treatment"]}
          onDisclose={vi.fn()}
        >
          <p>{SECRET}</p>
        </RestrictedShield>,
      );

      await user.click(screen.getByRole("button", { name: /disclose with a reason/i }));
      await user.selectOptions(screen.getByLabelText(/reason/i), "Treatment");
      await user.click(screen.getByRole("button", { name: /^disclose$/i }));
      expect(view.container.textContent).toContain(SECRET);

      await vi.advanceTimersByTimeAsync(31_000);
      expect(view.container.textContent).not.toContain(SECRET);
    } finally {
      vi.useRealTimers();
    }
  });
});
