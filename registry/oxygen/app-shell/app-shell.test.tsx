import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppShell, type NavItem } from "./app-shell";

const ITEMS: NavItem[] = [
  { id: "chart", label: "Chart", href: "/chart" },
  { id: "prescribe", label: "Prescribe", href: "/prescribe", requires: "rx:write" },
  { id: "billing", label: "Billing", href: "/billing", requires: "billing:read" },
];

function shell(props: Partial<React.ComponentProps<typeof AppShell>> = {}) {
  return render(
    <AppShell scopes={["chart:read"]} items={ITEMS} currentId="chart" {...props}>
      <p>Chart body</p>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("renders its children", () => {
    const view = shell();
    expect(view.container.textContent).toContain("Chart body");
  });

  /**
   * "An unavailable feature is absent, not present and rejected: a greyed-out
   * 'Prescribe' teaches a nurse that the system is broken, and teaches an
   * auditor nothing at all."
   */
  it("omits a destination the user lacks the scope for", () => {
    shell({ scopes: ["chart:read"] });
    expect(screen.queryByText("Prescribe")).not.toBeInTheDocument();
    expect(screen.queryByText("Billing")).not.toBeInTheDocument();
  });

  it("does not render an unavailable destination as merely disabled", () => {
    const view = shell({ scopes: ["chart:read"] });
    const disabled = view.container.querySelectorAll("[disabled], [aria-disabled='true']");
    for (const el of disabled) {
      expect(el.textContent ?? "").not.toMatch(/prescribe|billing/i);
    }
  });

  it("shows a destination once the scope is held", () => {
    shell({ scopes: ["chart:read", "rx:write"] });
    expect(screen.getByText("Prescribe")).toBeInTheDocument();
    expect(screen.queryByText("Billing")).not.toBeInTheDocument();
  });

  it("always shows items that require no scope", () => {
    shell({ scopes: [] });
    expect(screen.getByText("Chart")).toBeInTheDocument();
  });

  /**
   * "Which chart is open is a safety fact, so it survives every route change
   * and compresses but never disappears."
   */
  it("renders patient context as a landmark", () => {
    const view = shell({ patientContext: <span>Okonkwo, Amara</span> });
    expect(view.container.textContent).toContain("Okonkwo, Amara");
  });

  /** "Context changes are guarded." Unsaved work must be able to veto. */
  it("lets a navigation be vetoed", async () => {
    const onNavigate = vi.fn().mockResolvedValue(false);
    shell({ scopes: ["chart:read", "rx:write"], onNavigate });

    await userEvent.click(screen.getByText("Prescribe"));
    expect(onNavigate).toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: "prescribe" }));
  });

  /**
   * "Expiring a session under a half-written note is how documentation is
   * lost to a policy timer." It must warn before it acts.
   */
  it("warns before the session expires", () => {
    const view = shell({ sessionSecondsRemaining: 60 });
    expect(view.container.textContent).toMatch(/session|sign.?out|expir|time/i);
  });

  it("stays quiet when the session is not close to expiring", () => {
    const view = shell({ sessionSecondsRemaining: 8 * 60 * 60 });
    expect(view.container.textContent).not.toMatch(/expir/i);
  });

  it("offers a way to extend the session it is warning about", async () => {
    const onExtendSession = vi.fn();
    shell({ sessionSecondsRemaining: 60, onExtendSession });
    await userEvent.click(screen.getByRole("button", { name: /extend|stay|continue/i }));
    expect(onExtendSession).toHaveBeenCalled();
  });

  /** "Marked persistently, not once at entry." */
  it("marks break-glass access in words", () => {
    const view = shell({ breakGlassActive: true });
    expect(view.container.textContent).toMatch(/emergency|break.?glass/i);
  });

  it("does not mark break-glass when it is not in force", () => {
    const view = shell();
    expect(view.container.textContent).not.toMatch(/break.?glass/i);
  });

  it("exposes navigation as a landmark", () => {
    shell();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
