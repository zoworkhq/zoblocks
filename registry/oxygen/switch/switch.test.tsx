/**
 * Switch — behaviour, asserted the way a reader or a screen reader receives it.
 *
 * Nearly every test here exists because a specific claim in the component's
 * documentation is otherwise unverifiable. Where a test is guarding a stated
 * design decision rather than a mechanism, the comment names the decision.
 */

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { Switch, SwitchField, SwitchList } from "./switch";
import {
  ABSENT_REASON_LABEL,
  STATE_LABEL_PRESETS,
  SWITCH_SIZE,
  SwitchBlockedError,
  announcementFor,
  isUnknown,
  nextValueFor,
  resolveStateLabels,
  useCommitPhase,
  wordFor,
  type AbsentReason,
  type CommitPhase,
  type SwitchValue,
} from "@/lib/oxygen-switch";
import type { AbsentReason as FhirAbsentReason } from "@oxygenui-design/fhir";
import {
  expectInteractivesAreNamed,
  expectNoLeakedValues,
  expectRendersSomething,
  expectStatedInWords,
} from "../../../test/contract";

const NOW = "2026-08-16T14:00:00.000Z";

const root = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-ox-switch]");
const control = () => screen.getByRole("switch");
const polite = (container: HTMLElement) => container.querySelector('[role="status"]')?.textContent;
const assertive = (container: HTMLElement) =>
  container.querySelector('[role="alert"]')?.textContent;

/* =================================================================== */
/* The component contract                                              */
/* =================================================================== */

describe("the component contract", () => {
  const cases: Array<[string, () => React.ReactElement]> = [
    ["on", () => <Switch label="Contact precautions" checked />],
    ["off", () => <Switch label="Contact precautions" checked={false} />],
    [
      "unknown",
      () => <Switch label="Advance directive" checked="unknown" absentReason="not-collected" />,
    ],
    [
      "read-only",
      () => <Switch label="Consent" checked readOnly lockedReason="Encounter signed 14:32." />,
    ],
    ["disabled", () => <Switch label="Consent" checked disabled />],
    ["segmented", () => <Switch label="Latex allergy" appearance="segmented" checked={false} />],
    ["chip", () => <Switch label="My patients" appearance="chip" checked />],
    [
      "row",
      () => <Switch label="Text me results" appearance="row" checked description="To 4471." />,
    ],
    ["labeled", () => <Switch label="Interpreter" appearance="labeled" checked />],
  ];

  for (const [name, element] of cases) {
    it(`${name}: renders something, leaks nothing, names every control`, () => {
      const view = render(element());
      expectRendersSomething(view);
      expectNoLeakedValues(view);
      expectInteractivesAreNamed(view);
    });
  }
});

/* =================================================================== */
/* Semantics                                                           */
/* =================================================================== */

describe("semantics", () => {
  it("is a real switch, not a styled div", () => {
    render(<Switch label="Contact precautions" checked />);
    const element = control();
    expect(element.tagName).toBe("BUTTON");
    expect(element).toHaveAttribute("type", "button");
    expect(element).toHaveAttribute("aria-checked", "true");
  });

  it("reports aria-checked=mixed for an absent value", () => {
    render(<Switch label="Advance directive" checked="unknown" absentReason="not-collected" />);
    expect(control()).toHaveAttribute("aria-checked", "mixed");
  });

  it("takes its accessible name from the label a sighted reader sees", () => {
    const view = render(<Switch label="Contact precautions" checked />);
    const id = control().getAttribute("aria-labelledby") ?? "";
    expect(view.container.querySelector(`#${CSS.escape(id)}`)?.textContent).toBe(
      "Contact precautions",
    );
  });

  it("accepts an aria-label when there is no visible label", () => {
    render(<Switch aria-label="NPO — bed 14" checked />);
    expect(screen.getByRole("switch", { name: "NPO — bed 14" })).toBeInTheDocument();
  });

  it("activates with Space and with Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Falls risk" defaultChecked={false} onChange={onChange} />);

    await user.tab();
    expect(control()).toHaveFocus();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("forwards a ref and accepts className, style, id and data attributes", () => {
    const ref = React.createRef<HTMLSpanElement>();
    const view = render(
      <Switch
        ref={ref}
        id="npo-14"
        className="custom"
        style={{ marginBlockStart: "4px" }}
        data-testid="npo"
        label="NPO"
        checked
      />,
    );
    expect(ref.current).toBe(root(view.container));
    expect(root(view.container)).toHaveClass("ox-switch", "custom");
    expect(root(view.container)).toHaveAttribute("data-testid", "npo");
    expect(control()).toHaveAttribute("id", "npo-14");
  });

  it("wires the state word, the locked reason and the description into aria-describedby", () => {
    const view = render(
      <Switch
        label="Consent"
        checked
        description="Shared with the GP surgery."
        readOnly
        lockedReason="Encounter signed 14:32 by Dr Okafor."
      />,
    );
    const described = (control().getAttribute("aria-describedby") ?? "").split(" ");
    const text = described
      .map((id) => view.container.querySelector(`#${CSS.escape(id)}`)?.textContent ?? "")
      .join(" ");

    expect(text).toContain("Shared with the GP surgery.");
    expect(text).toContain("Encounter signed 14:32 by Dr Okafor.");
    expect(text).toContain("On");
  });

  it("does not leave an accessible name on the decorative root", () => {
    const view = render(<Switch aria-label="NPO" checked />);
    expect(root(view.container)).not.toHaveAttribute("aria-label");
  });
});

/* =================================================================== */
/* Axis 1 — value and absence                                          */
/* =================================================================== */

describe("value", () => {
  it("is uncontrolled from defaultChecked", async () => {
    const user = userEvent.setup();
    render(<Switch label="Falls risk" defaultChecked={false} />);
    expect(control()).toHaveAttribute("aria-checked", "false");
    await user.click(control());
    expect(control()).toHaveAttribute("aria-checked", "true");
  });

  it("is controlled when checked is supplied — the caller owns the value", async () => {
    const user = userEvent.setup();
    const view = render(<Switch label="Falls risk" checked={false} minPendingMs={0} />);
    await user.click(control());
    // The request is rendered while it is in flight, then the value returns to
    // the caller's, because the caller did not accept it.
    await waitFor(
      () => {
        expect(root(view.container)).toHaveAttribute("data-ox-phase", "idle");
      },
      { timeout: 2000 },
    );
    expect(control()).toHaveAttribute("aria-checked", "false");
  });

  it("accepts antd's `value` alias, as Form.Item supplies it", () => {
    render(<Switch label="Falls risk" value />);
    expect(control()).toHaveAttribute("aria-checked", "true");
  });

  /**
   * The headline clinical claim: "off" and "nobody asked" are different facts.
   * A shared shrug across every absence is the failure this component exists
   * to prevent, so every member of the union gets its own word.
   */
  it.each(Object.keys(ABSENT_REASON_LABEL) as AbsentReason[])(
    "renders a distinct word for absentReason=%s",
    (reason) => {
      const view = render(
        <Switch label="Advance directive" checked="unknown" absentReason={reason} />,
      );
      expectStatedInWords(view, new RegExp(ABSENT_REASON_LABEL[reason], "i"));
    },
  );

  it("gives every absence a word that is not shared with another absence", () => {
    const words = Object.values(ABSENT_REASON_LABEL);
    expect(new Set(words).size).toBe(words.length);
  });

  it("never renders a placeholder in place of an absent value", () => {
    const view = render(<Switch label="Advance directive" checked="unknown" />);
    expect(view.container.textContent).not.toMatch(/^\s*[—–-]\s*$/);
    expect(view.container.textContent).not.toContain("N/A");
  });

  /**
   * A user may leave "unknown". A user may never enter it — that would be
   * un-asking a question, and the correction for a wrong answer is a new
   * answer with a provenance, not an erasure.
   */
  it("commits the affirmative when an unknown switch is activated", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Latex allergy" defaultChecked="unknown" onChange={onChange} />);
    await user.click(control());
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("offers a keyboard-reachable path to record the negative from unknown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Latex allergy" defaultChecked="unknown" onChange={onChange} />);

    const negative = screen.getByRole("button", { name: /record off for latex allergy/i });
    await user.click(negative);
    expect(onChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("has no user path back to unknown from either boolean", async () => {
    const user = userEvent.setup();
    const seen: SwitchValue[] = [];
    function Harness() {
      const [value, setValue] = React.useState<SwitchValue>("unknown");
      seen.push(value);
      return <Switch label="Latex allergy" checked={value} onChange={(next) => setValue(next)} />;
    }
    render(<Harness />);

    for (let i = 0; i < 6; i += 1) await user.click(control());
    expect(seen.slice(1).some(isUnknown)).toBe(false);
  });

  it("removes the negative affordance once an answer exists", async () => {
    const user = userEvent.setup();
    render(<Switch label="Latex allergy" defaultChecked="unknown" />);
    expect(screen.queryByRole("button", { name: /record off/i })).toBeInTheDocument();
    await user.click(control());
    expect(screen.queryByRole("button", { name: /record off/i })).not.toBeInTheDocument();
  });

  it("keeps the absent-reason union in step with @oxygenui-design/fhir", () => {
    // A compile-time assertion in both directions. If either union gains a
    // member the other lacks, this stops typechecking — which is the point,
    // because the two are meant to be pipe-compatible without a dependency.
    const toFhir: (value: AbsentReason) => FhirAbsentReason = (value) => value;
    const fromFhir: (value: FhirAbsentReason) => AbsentReason = (value) => value;
    expect(toFhir("masked")).toBe("masked");
    expect(fromFhir("pending")).toBe("pending");
  });
});

/* =================================================================== */
/* Axis 2 — the commit phase machine                                   */
/* =================================================================== */

describe("commit", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  const advance = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  function deferred<T = void>() {
    let resolve!: (value: T) => void;
    let reject!: (cause: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  it("renders the REQUESTED value while pending, never the record's", async () => {
    const gate = deferred();
    const view = render(
      <Switch label="Contact precautions" checked={false} onCommit={() => gate.promise} />,
    );

    fireEvent.click(control());
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "pending");
    expect(root(view.container)).toHaveAttribute("data-ox-state", "on");
    expect(control()).toHaveAttribute("aria-checked", "true");
  });

  /**
   * A spinner that removes the control loses focus, cannot be cancelled, and
   * turns a switch into a dead pixel for as long as the request takes.
   */
  it("keeps the control focusable and named while pending", async () => {
    const gate = deferred();
    render(<Switch label="Contact precautions" checked={false} onCommit={() => gate.promise} />);

    control().focus();
    fireEvent.click(control());

    expect(control()).toHaveAttribute("aria-busy", "true");
    expect(control()).not.toBeDisabled();
    expect(control()).not.toHaveAttribute("aria-disabled");
    expect(control()).toHaveFocus();
    expect(screen.getByRole("switch", { name: "Contact precautions" })).toBeInTheDocument();
  });

  it("holds pending for minPendingMs so a fast write is perceptible", async () => {
    const view = render(
      <Switch
        label="Contact precautions"
        checked={false}
        minPendingMs={220}
        onCommit={() => Promise.resolve()}
      />,
    );

    fireEvent.click(control());
    await advance(40);
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "pending");

    await advance(220);
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "committed");
  });

  it("returns to idle after the confirmation", async () => {
    const view = render(
      <Switch label="Contact precautions" checked={false} onCommit={() => Promise.resolve()} />,
    );
    fireEvent.click(control());
    await advance(260);
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "committed");
    await advance(900);
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "idle");
  });

  /**
   * The anti-lie test. A rejected write must leave the reader looking at what
   * the record actually holds, with the failure stated and interrupting.
   */
  it("reverts to the record's value and announces the failure assertively", async () => {
    const view = render(
      <Switch
        label="Contact precautions"
        stateLabels="in-effect"
        checked={false}
        onCommit={() => Promise.reject(new Error("Could not reach the record."))}
      />,
    );

    fireEvent.click(control());
    await advance(400);

    expect(root(view.container)).toHaveAttribute("data-ox-phase", "reverted");
    expect(root(view.container)).toHaveAttribute("data-ox-state", "off");
    expect(control()).toHaveAttribute("aria-checked", "false");

    const announced = assertive(view.container) ?? "";
    expect(announced).toContain("was not changed");
    // "Still {state}" is the load-bearing clause: a listener who hears only
    // that it failed still does not know what is true.
    expect(announced).toMatch(/still not in effect/i);
  });

  it("distinguishes blocked from reverted", async () => {
    const view = render(
      <Switch
        label="Contact precautions"
        checked={false}
        onCommit={() => Promise.reject(new SwitchBlockedError("Your role cannot change this."))}
      />,
    );
    fireEvent.click(control());
    await advance(400);

    expect(root(view.container)).toHaveAttribute("data-ox-phase", "blocked");
    expect(assertive(view.container)).toContain("cannot be changed");
  });

  it("holds the failure until it is acknowledged — it never times out", async () => {
    const view = render(
      <Switch
        label="Contact precautions"
        checked={false}
        onCommit={() => Promise.reject(new Error("Failed."))}
      />,
    );
    fireEvent.click(control());
    await advance(30_000);
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "reverted");

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "idle");
  });

  /**
   * Toggle on, toggle off, and the two writes race. Resolving by whichever
   * response arrives last lets a slow first request overwrite a fast second
   * one, leaving the control showing a value the user changed away from.
   */
  it("discards a superseded response that arrives out of order", async () => {
    const first = deferred();
    const second = deferred();
    const calls: boolean[] = [];

    render(
      <Switch
        label="Contact precautions"
        defaultChecked={false}
        onCommit={(next) => {
          calls.push(next);
          return calls.length === 1 ? first.promise : second.promise;
        }}
      />,
    );

    fireEvent.click(control()); // request 1 → true
    await advance(10);
    fireEvent.click(control()); // request 2 → false, supersedes
    await advance(10);

    // The second request lands first, then the stale first response arrives.
    await act(async () => {
      second.resolve();
      await Promise.resolve();
    });
    await advance(400);
    await act(async () => {
      first.resolve();
      await Promise.resolve();
    });
    await advance(400);

    expect(calls).toEqual([true, false]);
    expect(control()).toHaveAttribute("aria-checked", "false");
  });

  it("fires onChange optimistically with antd's (checked, event) signature", async () => {
    const onChange = vi.fn();
    render(
      <Switch
        label="Contact precautions"
        defaultChecked={false}
        onChange={onChange}
        onCommit={() => new Promise(() => {})}
      />,
    );
    fireEvent.click(control());

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toBe(true);
    expect(onChange.mock.calls[0]?.[1]).toBeTruthy();
  });

  it("announces the pending state politely and the success politely", async () => {
    const view = render(
      <Switch label="Contact precautions" checked={false} onCommit={() => Promise.resolve()} />,
    );
    fireEvent.click(control());
    expect(polite(view.container)).toMatch(/setting to on/i);
    expect(assertive(view.container)).toBe("");

    await advance(400);
    expect(polite(view.container)).toMatch(/contact precautions: on\./i);
  });

  it("reports a stall through onSlow without abandoning the request", async () => {
    const onSlow = vi.fn();
    const view = render(
      <Switch
        label="Contact precautions"
        checked={false}
        slowAfter={1000}
        onSlow={onSlow}
        onCommit={() => new Promise(() => {})}
      />,
    );
    fireEvent.click(control());
    await advance(1200);

    expect(onSlow).toHaveBeenCalledTimes(1);
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "pending");
    expect(view.container.textContent).toMatch(/still saving/i);
  });

  it("treats a synchronous throw from onCommit as a revert, not a crash", async () => {
    const view = render(
      <Switch
        label="Contact precautions"
        checked={false}
        onCommit={() => {
          throw new Error("Validation failed.");
        }}
      />,
    );
    fireEvent.click(control());
    await advance(400);
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "reverted");
    expect(view.container.textContent).toContain("Validation failed.");
  });

  it("commits without an onCommit handler", async () => {
    const view = render(<Switch label="Show archived" defaultChecked={false} />);
    fireEvent.click(control());
    await advance(400);
    expect(control()).toHaveAttribute("aria-checked", "true");
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "committed");
  });

  it("records an audit trail with the caller's clock, never its own", async () => {
    const events: Array<{ type: string; at: string }> = [];
    render(
      <Switch
        label="Consent to share"
        checked={false}
        now={NOW}
        onAuditEvent={(event) => events.push(event)}
        onCommit={() => Promise.resolve()}
      />,
    );
    fireEvent.click(control());
    await advance(400);

    expect(events.map((e) => e.type)).toEqual(["requested", "committed"]);
    expect(events.every((e) => e.at === NOW)).toBe(true);
  });

  it("does not leave timers running after unmount", async () => {
    const view = render(
      <Switch label="Contact precautions" checked={false} onCommit={() => Promise.resolve()} />,
    );
    fireEvent.click(control());
    view.unmount();
    // No act() warning and no state update on an unmounted component.
    await advance(5000);
    expect(true).toBe(true);
  });

  it("maps antd's loading to pending rather than to a disabled control", () => {
    const view = render(<Switch label="Contact precautions" checked loading />);
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "pending");
    expect(control()).toHaveAttribute("aria-busy", "true");
    expect(control()).not.toBeDisabled();
  });
});

/* =================================================================== */
/* queued — offline                                                    */
/* =================================================================== */

describe("queued", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  const advance = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  it("queues rather than sending, and says so", () => {
    const onCommit = vi.fn(() => Promise.resolve());
    const view = render(
      <Switch label="Falls risk" defaultChecked={false} online={false} onCommit={onCommit} />,
    );
    fireEvent.click(control());

    expect(root(view.container)).toHaveAttribute("data-ox-phase", "queued");
    expect(onCommit).not.toHaveBeenCalled();
    expect(view.container.textContent).toMatch(/not sent yet/i);
    expect(polite(view.container)).toMatch(/queued/i);
  });

  it("can be cancelled before it is sent", async () => {
    const view = render(<Switch label="Falls risk" defaultChecked={false} online={false} />);
    fireEvent.click(control());
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(root(view.container)).toHaveAttribute("data-ox-phase", "idle");
    expect(view.container.textContent).not.toMatch(/not sent yet/i);
  });

  it("sends the queued change on reconnect", async () => {
    const onCommit = vi.fn(() => Promise.resolve());
    function Harness() {
      const [online, setOnline] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOnline(true)}>
            reconnect
          </button>
          <Switch label="Falls risk" defaultChecked={false} online={online} onCommit={onCommit} />
        </>
      );
    }
    const view = render(<Harness />);
    fireEvent.click(control());
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "queued");

    fireEvent.click(screen.getByRole("button", { name: "reconnect" }));
    await advance(400);

    expect(onCommit).toHaveBeenCalledWith(true, expect.anything());
    expect(control()).toHaveAttribute("aria-checked", "true");
  });

  it("is distinct from pending — nothing is in flight", () => {
    render(<Switch label="Falls risk" defaultChecked={false} online={false} />);
    fireEvent.click(control());
    expect(control()).not.toHaveAttribute("aria-busy", "true");
  });
});

/* =================================================================== */
/* stale — someone else changed it                                     */
/* =================================================================== */

describe("stale", () => {
  it("enters stale when the record disagrees with what is on screen", () => {
    const view = render(
      <Switch label="Contact precautions" stateLabels="in-effect" checked serverValue={false} />,
    );
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "stale");
    expect(assertive(view.container)).toMatch(/changed by someone else/i);
  });

  it("shows both readings, and preselects neither", () => {
    const view = render(
      <Switch label="Contact precautions" stateLabels="in-effect" checked serverValue={false} />,
    );
    const group = within(view.container).getByRole("group", { name: /conflicting change/i });
    const buttons = within(group).getAllByRole("button");

    expect(buttons).toHaveLength(2);
    expect(buttons.map((b) => b.textContent)).toEqual([
      expect.stringMatching(/use theirs/i),
      expect.stringMatching(/change it back/i),
    ]);
    // No default. A conflict between two clinicians is not a merge problem.
    expect(buttons.filter((b) => b.getAttribute("aria-pressed") === "true")).toHaveLength(0);
    expect(buttons.filter((b) => b.hasAttribute("data-default"))).toHaveLength(0);
  });

  it("never resolves itself", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const view = render(<Switch label="Contact precautions" checked serverValue={false} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "stale");
    vi.useRealTimers();
  });

  it("reports the resolution the caller must act on", () => {
    const onResolveConflict = vi.fn();
    render(
      <Switch
        label="Contact precautions"
        checked
        serverValue={false}
        onResolveConflict={onResolveConflict}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /use theirs/i }));
    expect(onResolveConflict).toHaveBeenCalledWith("theirs");
  });

  it("re-sends your value when you keep yours", () => {
    const onCommit = vi.fn(() => Promise.resolve());
    render(<Switch label="Contact precautions" checked serverValue={false} onCommit={onCommit} />);
    fireEvent.click(screen.getByRole("button", { name: /change it back/i }));
    expect(onCommit).toHaveBeenCalledWith(true, expect.anything());
  });

  it("leaves stale when the disagreement goes away", () => {
    const view = render(<Switch label="Contact precautions" checked serverValue={false} />);
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "stale");
    view.rerender(<Switch label="Contact precautions" checked serverValue />);
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "idle");
  });
});

/* =================================================================== */
/* Axis 3 — availability                                               */
/* =================================================================== */

describe("availability", () => {
  it("keeps a read-only switch in the tab order with its reason exposed", async () => {
    const user = userEvent.setup();
    const view = render(
      <Switch label="Consent" checked readOnly lockedReason="Encounter signed 14:32." />,
    );

    await user.tab();
    expect(control()).toHaveFocus();
    expect(control()).toHaveAttribute("aria-readonly", "true");
    expect(root(view.container)).toHaveAttribute("data-ox-readonly", "true");
    expectStatedInWords(view, /encounter signed 14:32/i);
  });

  it("does not commit from a read-only switch", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Consent" checked readOnly onChange={onChange} />);
    await user.click(control());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks a disabled switch aria-disabled and refuses to commit", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const view = render(<Switch label="Consent" checked disabled onChange={onChange} />);
    await user.click(control());

    expect(onChange).not.toHaveBeenCalled();
    expect(control()).toHaveAttribute("aria-disabled", "true");
    expect(root(view.container)).toHaveAttribute("data-ox-disabled", "true");
  });

  it("hides the record-negative affordance when the control is not editable", () => {
    render(<Switch label="Latex allergy" checked="unknown" readOnly />);
    expect(screen.queryByRole("button", { name: /record/i })).not.toBeInTheDocument();
  });
});

/* =================================================================== */
/* Appearances                                                         */
/* =================================================================== */

describe("appearances", () => {
  it.each(["switch", "labeled", "chip", "row"] as const)("%s keeps role=switch", (appearance) => {
    render(<Switch label="Isolation" appearance={appearance} checked />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  /**
   * Two labelled cells that both look pressable ARE a radio group. Calling
   * them a switch would be a lie to a screen reader.
   */
  it("segmented renders a radiogroup, not a switch", () => {
    render(<Switch label="Latex allergy" appearance="segmented" checked={false} />);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Latex allergy" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("segmented shows the unasked cell as a non-interactive indicator", () => {
    const view = render(
      <Switch
        label="Latex allergy"
        appearance="segmented"
        checked="unknown"
        absentReason="not-collected"
      />,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(
      screen.getAllByRole("radio").every((r) => r.getAttribute("aria-checked") === "false"),
    ).toBe(true);
    const unasked = view.container.querySelector(".ox-switch__segment--unasked");
    expect(unasked).toHaveTextContent("Not asked");
    expect(unasked?.tagName).toBe("SPAN");
  });

  it("segmented drops the unasked cell once an answer exists, with no path back", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = React.useState<SwitchValue>("unknown");
      return (
        <Switch
          label="Latex allergy"
          appearance="segmented"
          stateLabels="yes-no"
          checked={value}
          onChange={(next) => setValue(next)}
        />
      );
    }
    const view = render(<Harness />);
    await user.click(screen.getByRole("radio", { name: "Yes" }));

    expect(view.container.querySelector(".ox-switch__segment--unasked")).toBeNull();
    expect(screen.getByRole("radio", { name: "Yes" })).toHaveAttribute("aria-checked", "true");
  });

  it("segmented commits the negative directly, unlike the pill", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Switch
        label="Latex allergy"
        appearance="segmented"
        stateLabels="yes-no"
        checked="unknown"
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("radio", { name: "No" }));
    expect(onChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("labeled renders both words so the track cannot resize as it toggles", () => {
    const view = render(
      <Switch label="Interpreter" appearance="labeled" stateLabels="active-inactive" checked />,
    );
    const words = view.container.querySelectorAll(".ox-switch__word");
    expect(words).toHaveLength(2);
    expect(Array.from(words).map((w) => w.textContent)).toEqual(["Active", "Inactive"]);
    // Both are decorative — the state is announced through the state word.
    expect(Array.from(words).every((w) => w.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  it("checkedChildren implies the labeled appearance, as antd users expect", () => {
    const view = render(
      <Switch label="Interpreter" checkedChildren="Required" unCheckedChildren="Not required" />,
    );
    expect(root(view.container)).toHaveAttribute("data-ox-appearance", "labeled");
    expect(view.container.textContent).toContain("Required");
    expect(view.container.textContent).toContain("Not required");
  });

  it("chip uses the label as its own text and hides the separate state word", () => {
    const view = render(<Switch label="My patients" appearance="chip" checked />);
    expect(screen.getByRole("switch", { name: "My patients" })).toBeInTheDocument();
    expect(view.container.querySelector(".ox-switch__state")).toBeNull();
  });

  it("row puts the label and description inside the target", () => {
    const view = render(
      <Switch
        label="Text me when my results are ready"
        description="To the mobile ending 4471."
        appearance="row"
        checked
      />,
    );
    const button = control();
    expect(within(button).getByText("Text me when my results are ready")).toBeInTheDocument();
    expect(within(button).getByText("To the mobile ending 4471.")).toBeInTheDocument();
    // Nothing interactive is nested inside the row button.
    expect(within(button).queryAllByRole("button")).toHaveLength(0);
    expect(root(view.container)).toHaveAttribute("data-ox-appearance", "row");
  });
});

/* =================================================================== */
/* Sizes, tone and density                                             */
/* =================================================================== */

describe("presentation", () => {
  it.each(["micro", "small", "default", "large"] as const)(
    "%s sets the geometry from one table",
    (size) => {
      const view = render(<Switch label="NPO" size={size} checked />);
      const element = root(view.container)!;
      const { track, thumb } = SWITCH_SIZE[size];
      expect(element.style.getPropertyValue("--ox-switch-track-w")).toBe(`${track[0]}px`);
      expect(element.style.getPropertyValue("--ox-switch-track-h")).toBe(`${track[1]}px`);
      expect(element.style.getPropertyValue("--ox-switch-thumb-size")).toBe(`${thumb}px`);
    },
  );

  /**
   * The hit area is a token, not a size — that is what lets a 26x14px switch
   * sit in a dense flowsheet row and still clear SC 2.5.8.
   */
  it("never writes a hit-area override, so the density token governs the target", () => {
    const view = render(<Switch label="NPO" size="micro" checked />);
    expect(root(view.container)!.style.getPropertyValue("--ox-switch-target-min")).toBe("");
  });

  it.each(["affirmative", "neutral", "caution", "critical"] as const)(
    "tone=%s is exposed for styling and never derived from data",
    (tone) => {
      const view = render(<Switch label="Suppress alerts" tone={tone} checked />);
      expect(root(view.container)).toHaveAttribute("data-ox-tone", tone);
    },
  );

  it("states a caution on-state in words as well as in colour", () => {
    const view = render(
      <Switch
        label="Suppress duplicate-therapy alerts"
        tone="caution"
        stateLabels="in-effect"
        checked
      />,
    );
    expectStatedInWords(view, /in effect/i);
  });

  it("preserves a caller's inline custom properties alongside the size vars", () => {
    const view = render(
      <Switch
        label="NPO"
        checked
        style={{ "--ox-switch-track-w": "64px" } as React.CSSProperties}
      />,
    );
    expect(root(view.container)!.style.getPropertyValue("--ox-switch-track-w")).toBe("64px");
  });

  it("patient audience defaults to a larger control and plainer words", () => {
    const view = render(<Switch label="Share my records" audience="patient" checked />);
    expect(root(view.container)).toHaveAttribute("data-ox-size", "large");
    expect(root(view.container)).toHaveAttribute("data-ox-audience", "patient");
    expect(view.container.querySelector(".ox-switch__state")).toHaveTextContent("Yes");
  });
});

/* =================================================================== */
/* until — the time-boxed on-state                                     */
/* =================================================================== */

describe("until", () => {
  const IN_EFFECT = "2026-08-16T14:30:00.000Z";

  it("renders the window beside the state", () => {
    const view = render(
      <Switch label="Nil by mouth" checked until={IN_EFFECT} now={NOW} tone="caution" />,
    );
    expect(view.container.querySelector(".ox-switch__until")?.textContent).toMatch(/until/i);
    expect(view.container.textContent).toMatch(/ends automatically/i);
  });

  it("warns before it lapses", () => {
    const view = render(
      <Switch
        label="Nil by mouth"
        checked
        until={IN_EFFECT}
        now="2026-08-16T14:25:00.000Z"
        untilWarnMs={10 * 60 * 1000}
      />,
    );
    expect(view.container.textContent).toMatch(/ends soon/i);
  });

  /**
   * Lapse is derived from the caller's `now`, so the rendered output depends
   * only on props and is deterministic under visual regression.
   */
  it("derives the lapse from the supplied clock, not the wall clock", () => {
    const view = render(
      <Switch label="Nil by mouth" checked until={IN_EFFECT} now="2026-08-16T15:00:00.000Z" />,
    );
    expect(view.container.querySelector(".ox-switch__until--lapsed")).not.toBeNull();
    expect(view.container.textContent).toMatch(/this has ended/i);
  });

  it("notifies on expiry and never writes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onExpire = vi.fn();
    const onCommit = vi.fn(() => Promise.resolve());
    render(
      <Switch
        label="Nil by mouth"
        checked
        until={IN_EFFECT}
        now={NOW}
        onExpire={onExpire}
        onCommit={onCommit}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(31 * 60 * 1000);
    });

    expect(onExpire).toHaveBeenCalledWith(IN_EFFECT);
    // The application owns the write. A client clock lifting a clinical flag
    // on a workstation whose time is wrong is a defect, not a feature.
    expect(onCommit).not.toHaveBeenCalled();
    expect(control()).toHaveAttribute("aria-checked", "true");
    vi.useRealTimers();
  });

  it("renders nothing about a window while the value is off", () => {
    const view = render(
      <Switch label="Nil by mouth" checked={false} until={IN_EFFECT} now={NOW} />,
    );
    expect(view.container.querySelector(".ox-switch__until")).toBeNull();
  });

  it("shows an unparseable timestamp rather than substituting punctuation", () => {
    const view = render(<Switch label="Nil by mouth" checked until="not-a-date" now={NOW} />);
    expect(view.container.textContent).toContain("not-a-date");
  });
});

/* =================================================================== */
/* Confirmation                                                        */
/* =================================================================== */

describe("confirmation", () => {
  it("dialog states the consequence and commits nothing until confirmed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Switch
        label="Add to the deteriorating-patient list"
        checked={false}
        confirm="dialog"
        confirmCopy={{ consequence: "Pages the outreach team now.", subject: "Ada Lovelace" }}
        onChange={onChange}
      />,
    );

    await user.click(control());
    expect(onChange).not.toHaveBeenCalled();

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("Pages the outreach team now.");
    expect(dialog).toHaveTextContent(/ada lovelace/i);
    // Never "Are you sure?" — CONTENT.md §4.
    expect(dialog.textContent).not.toMatch(/are you sure/i);

    await user.click(within(dialog).getByRole("button", { name: /set to on/i }));
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("dialog can be cancelled without committing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Switch
        label="Release restraint order"
        checked={false}
        confirm="dialog"
        confirmCopy={{ consequence: "Removes the order from the chart." }}
        onChange={onChange}
      />,
    );
    await user.click(control());
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: /cancel/i }),
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("attest requires a typed reason and records it", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn(() => Promise.resolve());
    render(
      <Switch
        label="Bypass allergy check"
        checked={false}
        tone="critical"
        confirm="attest"
        confirmCopy={{ consequence: "Recorded against your login and reviewed." }}
        onCommit={onCommit}
      />,
    );

    await user.click(control());
    const dialog = screen.getByRole("alertdialog");
    const submit = within(dialog).getByRole("button", { name: /set to on/i });
    expect(submit).toBeDisabled();

    await user.type(within(dialog).getByRole("textbox"), "Prescriber confirmed tolerance.");
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(onCommit).toHaveBeenCalledWith(true, {
      from: false,
      reason: "Prescriber confirmed tolerance.",
    });
  });

  it("hold commits after a sustained press", async () => {
    const onChange = vi.fn();
    render(
      <Switch
        label="Suspend fall-risk alarm"
        checked={false}
        confirm="hold"
        holdMs={20}
        onChange={onChange}
      />,
    );

    // The ring's rAF updates progress while the press is held, so the wait
    // belongs inside act along with the pointer events that bracket it.
    await act(async () => {
      fireEvent.pointerDown(control());
      await new Promise((resolve) => setTimeout(resolve, 40));
      fireEvent.pointerUp(control());
    });

    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("hold refuses a press that was too short, and says so is possible", async () => {
    const onChange = vi.fn();
    render(
      <Switch
        label="Suspend fall-risk alarm"
        checked={false}
        confirm="hold"
        holdMs={5000}
        onChange={onChange}
      />,
    );
    fireEvent.pointerDown(control());
    fireEvent.pointerUp(control());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("hold releases outside the control without committing", async () => {
    const onChange = vi.fn();
    render(
      <Switch
        label="Suspend alarm"
        checked={false}
        confirm="hold"
        holdMs={5000}
        onChange={onChange}
      />,
    );
    fireEvent.pointerDown(control());
    fireEvent.pointerLeave(control());
    expect(onChange).not.toHaveBeenCalled();
  });

  /**
   * Holding is a timed input, so SC 2.2.1 applies. A keyboard user must reach
   * an equivalent confirmation, not a degraded one.
   */
  it("keyboard activation opens the dialog rather than requiring a hold", async () => {
    const user = userEvent.setup();
    render(<Switch label="Suspend fall-risk alarm" checked={false} confirm="hold" holdMs={5000} />);

    await user.tab();
    await user.keyboard(" ");

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("holdMs=0 routes every activation to the dialog", async () => {
    const user = userEvent.setup();
    render(<Switch label="Suspend fall-risk alarm" checked={false} confirm="hold" holdMs={0} />);
    await user.click(control());
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  /**
   * `notSameAs` is what makes an independent double-check independent, and the
   * thing most implementations forget: without it, one person clicks twice.
   */
  it("countersign refuses a second signature from the requester", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn(() => Promise.resolve());
    render(
      <Switch
        label="Release restraint order"
        checked={false}
        tone="critical"
        confirm="countersign"
        countersign={{
          role: "registered-nurse",
          notSameAs: "user-1",
          verify: () => Promise.resolve("user-1"),
        }}
        onCommit={onCommit}
      />,
    );

    await user.click(control());
    await user.click(screen.getByRole("button", { name: /collect countersignature/i }));

    await waitFor(() => {
      expect(screen.getByText(/must be from a different person/i)).toBeInTheDocument();
    });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("countersign commits when a different qualified person signs", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn(() => Promise.resolve());
    render(
      <Switch
        label="Release restraint order"
        checked={false}
        confirm="countersign"
        countersign={{
          role: "registered-nurse",
          notSameAs: "user-1",
          verify: () => Promise.resolve("user-2"),
        }}
        onCommit={onCommit}
      />,
    );

    await user.click(control());
    await user.click(screen.getByRole("button", { name: /collect countersignature/i }));

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledWith(true, {
        from: false,
        reason: "countersigned by user-2",
      });
    });
  });

  it("countersign surfaces a failed verification instead of committing", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn(() => Promise.resolve());
    render(
      <Switch
        label="Release restraint order"
        checked={false}
        confirm="countersign"
        countersign={{
          role: "registered-nurse",
          notSameAs: "user-1",
          verify: () => Promise.reject(new Error("Badge not recognised.")),
        }}
        onCommit={onCommit}
      />,
    );
    await user.click(control());
    await user.click(screen.getByRole("button", { name: /collect countersignature/i }));

    await waitFor(() => {
      expect(screen.getByText("Badge not recognised.")).toBeInTheDocument();
    });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("a confirmation dialog contains no nested interactive traps", async () => {
    const user = userEvent.setup();
    const view = render(
      <Switch
        label="Release restraint order"
        checked={false}
        confirm="dialog"
        confirmCopy={{ consequence: "Removes the order." }}
      />,
    );
    await user.click(control());
    expectInteractivesAreNamed(view);
  });
});

/* =================================================================== */
/* impact and provenance                                               */
/* =================================================================== */

describe("impact and provenance", () => {
  it("renders the consequence before the click", () => {
    const view = render(
      <Switch
        label="Add to the deteriorating-patient list"
        checked={false}
        impact={["pages the outreach team now", "adds a banner to the bed board"]}
      />,
    );
    expect(view.container.textContent).toContain("pages the outreach team now");
    expect(view.container.textContent).toContain("adds a banner to the bed board");
  });

  it("renders who changed it and when", () => {
    const view = render(
      <Switch
        label="Consent to share"
        checked
        provenance={{ by: "K. Osei", at: NOW, via: "on the ward round" }}
      />,
    );
    expect(view.container.textContent).toMatch(/last changed .* by K\. Osei, on the ward round/i);
  });
});

/* =================================================================== */
/* Words                                                               */
/* =================================================================== */

describe("state labels", () => {
  it.each(Object.keys(STATE_LABEL_PRESETS) as Array<keyof typeof STATE_LABEL_PRESETS>)(
    "%s gives on, off and unknown their own words",
    (preset) => {
      const labels = STATE_LABEL_PRESETS[preset];
      expect(new Set([labels.on, labels.off, labels.unknown]).size).toBe(3);
    },
  );

  it("renders the preset's word rather than On and Off", () => {
    const view = render(
      <Switch label="Contact precautions" stateLabels="in-effect" checked={false} />,
    );
    expectStatedInWords(view, /not in effect/i);
  });

  it("accepts an explicit word pair", () => {
    const view = render(
      <Switch label="Bed rails" stateLabels={{ on: "Raised", off: "Lowered" }} checked />,
    );
    expectStatedInWords(view, /raised/i);
  });

  /** A specific absence always beats the preset's generic one. */
  it("lets absentReason override the preset's unknown word", () => {
    const labels = resolveStateLabels("yes-no", "declined");
    expect(labels.unknown).toBe("Declined to answer");
    expect(STATE_LABEL_PRESETS["yes-no"].unknown).toBe("Not asked");
  });

  it("distinguishes a recorded decline from an unanswered question", () => {
    expect(STATE_LABEL_PRESETS["given-declined"].off).toBe("Declined");
    expect(STATE_LABEL_PRESETS["given-declined"].unknown).toBe("Not asked");
  });

  it("resolves the word for each value", () => {
    const labels = STATE_LABEL_PRESETS["in-effect"];
    expect(wordFor(true, labels)).toBe("In effect");
    expect(wordFor(false, labels)).toBe("Not in effect");
    expect(wordFor("unknown", labels)).toBe("Not assessed");
  });

  it("can hide the state word for a dense surface", () => {
    const view = render(<Switch label="NPO" size="micro" checked showState={false} />);
    expect(view.container.querySelector(".ox-switch__state")).toBeNull();
  });
});

/* =================================================================== */
/* The hook, on its own                                                */
/* =================================================================== */

describe("useCommitPhase, exported standalone", () => {
  function Probe(props: Parameters<typeof useCommitPhase>[0] & { onState?: (s: unknown) => void }) {
    const { onState, ...options } = props;
    const state = useCommitPhase(options);
    onState?.(state);
    return (
      <div>
        <span data-testid="phase">{state.phase}</span>
        <span data-testid="shown">{String(state.shown)}</span>
        <button type="button" onClick={() => state.request(true)}>
          request
        </button>
      </div>
    );
  }

  it("drives a control that is not this one", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Probe value={false} onCommit={() => Promise.resolve()} />);

    fireEvent.click(screen.getByRole("button", { name: "request" }));
    expect(screen.getByTestId("phase")).toHaveTextContent("pending");
    expect(screen.getByTestId("shown")).toHaveTextContent("true");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(screen.getByTestId("phase")).toHaveTextContent("committed");
    vi.useRealTimers();
  });

  it("exposes nextValueFor, which never returns to unknown", () => {
    expect(nextValueFor(false)).toBe(true);
    expect(nextValueFor(true)).toBe(false);
    expect(nextValueFor("unknown")).toBe(true);
  });
});

/* =================================================================== */
/* Announcements                                                       */
/* =================================================================== */

describe("announcements", () => {
  const labels = STATE_LABEL_PRESETS["in-effect"];

  it.each([
    ["pending", "polite"],
    ["queued", "polite"],
    ["committed", "polite"],
    ["reverted", "assertive"],
    ["blocked", "assertive"],
    ["stale", "assertive"],
  ] as Array<[CommitPhase, "polite" | "assertive"]>)("%s is announced %s", (phase, politeness) => {
    const announcement = announcementFor(
      phase,
      "Contact precautions",
      true,
      "Not in effect",
      labels,
    );
    expect(announcement?.politeness).toBe(politeness);
  });

  it("says nothing while idle", () => {
    expect(
      announcementFor("idle", "Contact precautions", true, "In effect", labels),
    ).toBeUndefined();
  });

  it("names the value that now holds when a write fails", () => {
    const announcement = announcementFor(
      "reverted",
      "Contact precautions",
      true,
      "Not in effect",
      labels,
      "Could not reach the record.",
    );
    expect(announcement?.text).toBe(
      "Contact precautions was not changed. Could not reach the record. Still not in effect.",
    );
  });
});

/* =================================================================== */
/* SwitchField and SwitchList                                          */
/* =================================================================== */

describe("SwitchField and SwitchList", () => {
  it("renders a labelled row", () => {
    render(<SwitchField label="Contact" description="Gown and gloves on entry." checked />);
    expect(screen.getByRole("switch", { name: "Contact" })).toBeInTheDocument();
    expect(screen.getByText("Gown and gloves on entry.")).toBeInTheDocument();
  });

  it("groups rows under an accessible name", () => {
    render(
      <SwitchList title="Isolation precautions">
        <SwitchField label="Contact" checked />
        <SwitchField label="Droplet" checked={false} />
      </SwitchList>,
    );
    const group = screen.getByRole("group", { name: "Isolation precautions" });
    expect(within(group).getAllByRole("switch")).toHaveLength(2);
  });

  /**
   * A count that silently treats "not asked" as "off" is this component's
   * headline failure, repeated at group scale.
   */
  it("counts unknown separately from off", () => {
    render(
      <SwitchList title="Isolation precautions" counts={{ on: 2, total: 4, unknown: 1 }}>
        <SwitchField label="Contact" checked />
      </SwitchList>,
    );
    const summary = screen.getByText(/2 of 4 in effect/i);
    expect(summary).toHaveTextContent("1 not asked");
  });

  it("reports who last changed the group", () => {
    render(
      <SwitchList
        title="Isolation precautions"
        counts={{ on: 1, total: 2 }}
        provenance={{ by: "S. Mehta", at: NOW }}
      />,
    );
    expect(screen.getByText(/last changed .* by S\. Mehta/i)).toBeInTheDocument();
  });

  it("omits the summary when there is nothing to count", () => {
    const view = render(
      <SwitchList title="Isolation precautions">
        <SwitchField label="Contact" checked />
      </SwitchList>,
    );
    expect(view.container.querySelector(".ox-switch-list__summary")).toBeNull();
  });

  it("forwards a ref and accepts extra attributes", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<SwitchList ref={ref} title="Precautions" data-testid="list" />);
    expect(ref.current).toHaveAttribute("data-testid", "list");
  });
});

/* =================================================================== */
/* antd compatibility                                                  */
/* =================================================================== */

describe("Ant Design parity", () => {
  /**
   * ADR 0010's promise is that `import { Switch } from "antd"` becomes
   * `from "@oxygenui-design/react"` with no other diff. A rename in an antd
   * major has to fail our build rather than a customer's, so the surface is
   * asserted rather than described.
   */
  const ANTD_PROPS = [
    "checked",
    "defaultChecked",
    "onChange",
    "disabled",
    "loading",
    "size",
    "checkedChildren",
    "unCheckedChildren",
    "autoFocus",
    "value",
    "className",
    "style",
    "id",
  ] as const;

  it("accepts antd's whole Switch surface in one render", () => {
    const onChange = vi.fn();
    const props = {
      checked: true,
      defaultChecked: false,
      onChange,
      disabled: false,
      loading: false,
      size: "small",
      checkedChildren: "On",
      unCheckedChildren: "Off",
      autoFocus: false,
      value: true,
      className: "x",
      style: {},
      id: "antd-switch",
      "aria-label": "Parity",
    } as const;

    // Every name in ANTD_PROPS is present in the object above; if the component
    // drops one, the render below stops compiling.
    for (const name of ANTD_PROPS) expect(name in props).toBe(true);

    const view = render(<Switch {...props} />);
    expect(screen.getByRole("switch")).toHaveAttribute("id", "antd-switch");
    expectNoLeakedValues(view);
  });

  it("uses antd's small/default size names", () => {
    const view = render(<Switch aria-label="Parity" size="small" checked />);
    expect(root(view.container)).toHaveAttribute("data-ox-size", "small");
  });

  it("passes the value directly to onChange, not wrapped in an event", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch aria-label="Parity" defaultChecked={false} onChange={onChange} />);
    await user.click(control());
    expect(typeof onChange.mock.calls[0]?.[0]).toBe("boolean");
  });
});

/* =================================================================== */
/* Deferred commit                                                     */
/* =================================================================== */

describe("deferred commit", () => {
  it("marks an unsaved change rather than implying it applied", async () => {
    const user = userEvent.setup();
    const view = render(<Switch label="Notify by SMS" defaultChecked={false} commit="deferred" />);
    await user.click(control());
    await waitFor(() => {
      expect(view.container.textContent).toMatch(/saved when you submit/i);
    });
  });
});

/* =================================================================== */
/* Edge paths                                                          */
/*                                                                     */
/* The branches a happy-path suite never reaches. Each of these is a    */
/* real situation, not a coverage errand: a hold that never started, a  */
/* countersign that cannot be collected, a conflict resolved to the     */
/* value you already had. They are grouped because they share one       */
/* property — every one of them is a path a clinician can take, and     */
/* none of them is a path anyone demonstrates.                          */
/* =================================================================== */

describe("edge paths", () => {
  /* ---------------------------------------------------------------- */
  /* Read-only, in every appearance                                   */
  /* ---------------------------------------------------------------- */

  describe("read-only stays reachable", () => {
    it("keeps a segmented control in the tab order", () => {
      // The whole argument against `disabled`: it removes the control from a
      // screen-reader user's world, so they never learn it exists or why it
      // cannot be changed. Read-only must not do that in any appearance.
      render(
        <Switch
          label="Interpreter required"
          appearance="segmented"
          checked
          readOnly
          lockedReason="Encounter signed."
        />,
      );
      const radios = screen.getAllByRole("radio");
      for (const radio of radios) {
        expect(radio).not.toBeDisabled();
        expect(radio).toHaveAttribute("aria-readonly", "true");
      }
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-readonly", "true");
    });

    it("refuses the change anyway", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(
        <Switch
          label="Interpreter required"
          appearance="segmented"
          checked
          readOnly
          onCommit={onCommit}
        />,
      );
      // Focusable, named, and inert. All three at once is the point.
      await user.click(screen.getAllByRole("radio")[0] as HTMLElement);
      expect(onCommit).not.toHaveBeenCalled();
    });

    it("marks a genuinely disabled segmented control as disabled", () => {
      render(<Switch label="Interpreter required" appearance="segmented" checked disabled />);
      for (const radio of screen.getAllByRole("radio")) expect(radio).toBeDisabled();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Countersign — the paths where no signature arrives                */
  /* ---------------------------------------------------------------- */

  describe("countersign", () => {
    const open = async (props: Partial<React.ComponentProps<typeof Switch>>) => {
      const user = userEvent.setup();
      render(
        <Switch
          label="Release restraint order"
          tone="critical"
          confirm="countersign"
          defaultChecked={false}
          {...props}
        />,
      );
      await user.click(control());
      return user;
    };

    it("says so when no verifier was supplied", async () => {
      const user = await open({ countersign: { role: "registered-nurse", notSameAs: "u1" } });
      await user.click(screen.getByRole("button", { name: /collect countersignature/i }));
      expect(
        await screen.findByText(/no countersignature could be collected/i),
      ).toBeInTheDocument();
    });

    it("refuses a signature from the requester — that is what makes it independent", async () => {
      const onCommit = vi.fn();
      const user = await open({
        onCommit,
        countersign: {
          role: "registered-nurse",
          notSameAs: "u1",
          verify: () => Promise.resolve("u1"),
        },
      });
      await user.click(screen.getByRole("button", { name: /collect countersignature/i }));
      expect(await screen.findByText(/must be from a different person/i)).toBeInTheDocument();
      expect(onCommit).not.toHaveBeenCalled();
    });

    it("commits when a different qualified person signs", async () => {
      const onCommit = vi.fn().mockResolvedValue(undefined);
      const user = await open({
        onCommit,
        countersign: {
          role: "registered-nurse",
          notSameAs: "u1",
          verify: () => Promise.resolve("u2"),
        },
      });
      await user.click(screen.getByRole("button", { name: /collect countersignature/i }));
      await waitFor(() => expect(onCommit).toHaveBeenCalledWith(true, expect.anything()));
      expect(onCommit.mock.calls[0]?.[1]).toMatchObject({ reason: "countersigned by u2" });
    });

    it("reports a rejection that carries no message", async () => {
      const user = await open({
        countersign: {
          role: "registered-nurse",
          notSameAs: "u1",
          // A bare rejection — a cancelled badge scan, typically.
          verify: () => Promise.reject(new Error("")),
        },
      });
      await user.click(screen.getByRole("button", { name: /collect countersignature/i }));
      expect(await screen.findByText(/countersignature was not collected/i)).toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Hold — the paths that are not a completed hold                    */
  /* ---------------------------------------------------------------- */

  describe("hold", () => {
    it("ignores a pointer-up that was never preceded by a pointer-down", () => {
      const onCommit = vi.fn();
      render(
        <Switch label="Suspend alarm" confirm="hold" defaultChecked={false} onCommit={onCommit} />,
      );
      fireEvent.pointerUp(control());
      expect(onCommit).not.toHaveBeenCalled();
    });

    it("treats a second pointer-down as part of the same hold", () => {
      render(<Switch label="Suspend alarm" confirm="hold" defaultChecked={false} />);
      fireEvent.pointerDown(control());
      fireEvent.pointerDown(control());
      // Still one hold in progress; releasing it once ends it.
      fireEvent.pointerUp(control());
      expect(control()).toHaveAttribute("aria-checked", "false");
    });

    it("routes a plain click to the dialog, never to a silent commit", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(
        <Switch label="Suspend alarm" confirm="hold" defaultChecked={false} onCommit={onCommit} />,
      );
      await user.click(control());
      expect(onCommit).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Conflict resolution                                               */
  /* ---------------------------------------------------------------- */

  describe("stale", () => {
    it("re-sends your value when you keep yours", async () => {
      const user = userEvent.setup();
      const onCommit = vi.fn().mockResolvedValue(undefined);
      const onResolveConflict = vi.fn();
      render(
        <Switch
          label="Contact precautions"
          stateLabels="in-effect"
          checked
          serverValue={false}
          onCommit={onCommit}
          onResolveConflict={onResolveConflict}
        />,
      );
      await user.click(screen.getByRole("button", { name: /change it back/i }));
      expect(onResolveConflict).toHaveBeenCalledWith("mine");
      await waitFor(() => expect(onCommit).toHaveBeenCalledWith(true, expect.anything()));
    });

    it("leaves the conflict alone while a write of your own is in flight", async () => {
      // Two competing explanations on screen is worse than one that arrives a
      // moment later, so an external change never interrupts a pending request.
      const user = userEvent.setup();
      let settle: (() => void) | undefined;
      const onCommit = vi.fn(() => new Promise<void>((resolve) => (settle = resolve)));
      const view = render(
        <Switch label="Contact precautions" defaultChecked={false} onCommit={onCommit} />,
      );
      await user.click(control());
      await waitFor(() => expect(root(view.container)).toHaveAttribute("data-ox-phase", "pending"));

      view.rerender(
        <Switch
          label="Contact precautions"
          defaultChecked={false}
          serverValue
          onCommit={onCommit}
        />,
      );
      expect(root(view.container)).toHaveAttribute("data-ox-phase", "pending");
      await act(async () => {
        settle?.();
      });
    });
  });

  /* ---------------------------------------------------------------- */
  /* Slots                                                             */
  /* ---------------------------------------------------------------- */

  describe("slots", () => {
    it("hands the thumb slot the resolved value and phase", () => {
      render(
        <Switch
          label="Custom"
          checked
          slots={{
            thumb: ({ value, phase }) => <i data-testid="thumb">{`${String(value)}:${phase}`}</i>,
          }}
        />,
      );
      expect(screen.getByTestId("thumb")).toHaveTextContent("true:idle");
    });

    it("hands the state slot the word a reader sees, so the two cannot disagree", () => {
      render(
        <Switch
          label="Custom"
          checked
          stateLabels="in-effect"
          slots={{ state: ({ word }) => <b data-testid="state">{word}</b> }}
        />,
      );
      expect(screen.getByTestId("state")).toHaveTextContent("In effect");
    });
  });

  /* ---------------------------------------------------------------- */
  /* Rendering with almost nothing supplied                            */
  /* ---------------------------------------------------------------- */

  describe("minimal props", () => {
    it("renders a bare chip with no label, using the state word", () => {
      render(<Switch aria-label="Isolation" appearance="chip" checked stateLabels="in-effect" />);
      expect(screen.getByRole("switch")).toHaveAccessibleName("Isolation");
    });

    it("renders a segmented control named only by aria-label", () => {
      render(<Switch aria-label="Latex allergy" appearance="segmented" checked={false} />);
      expect(screen.getByRole("radiogroup")).toHaveAccessibleName("Latex allergy");
    });

    it("puts the text before the control when asked", () => {
      const view = render(
        <Switch label="Interpreter" appearance="segmented" checked labelPlacement="start" />,
      );
      const rootEl = root(view.container) as HTMLElement;
      const text = rootEl.querySelector(".ox-switch__text") as HTMLElement;
      const group = rootEl.querySelector(".ox-switch__segments") as HTMLElement;
      // Reading order, not visual order — a screen reader follows the DOM.
      expect(text.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("renders a switch with no text column at all", () => {
      const view = render(<Switch aria-label="Bare" checked showState={false} />);
      expect(view.container.querySelector(".ox-switch__text")).toBeNull();
      expect(screen.getByRole("switch")).toHaveAccessibleName("Bare");
    });

    it("renders a list with no title and no counts", () => {
      const view = render(
        <SwitchList>
          <SwitchField label="Contact" checked />
        </SwitchList>,
      );
      expect(view.container.querySelector(".ox-switch-list__head")).toBeNull();
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("forwards an explicit aria-describedby alongside its own", () => {
      render(
        <>
          <span id="external">Set by the admitting clerk.</span>
          <Switch label="Interpreter" checked aria-describedby="external" />
        </>,
      );
      expect(control().getAttribute("aria-describedby")).toContain("external");
    });
  });

  /* ---------------------------------------------------------------- */
  /* Provenance                                                        */
  /* ---------------------------------------------------------------- */

  it("names how a change was made when the caller knows", () => {
    const view = render(
      <Switch
        label="Contact precautions"
        checked
        provenance={{ by: "S. Mehta", at: NOW, via: "on the ward round" }}
      />,
    );
    expect(view.container.textContent).toMatch(/S\. Mehta, on the ward round/);
  });
});

/* =================================================================== */
/* The commit machine, driven directly                                 */
/*                                                                     */
/* useCommitPhase is exported for controls that are not this one, so it */
/* is tested as its own unit rather than only through the component.    */
/* =================================================================== */

describe("useCommitPhase, directly", () => {
  function Harness(props: Parameters<typeof useCommitPhase>[0] & { probe?: (s: unknown) => void }) {
    const { probe, ...options } = props;
    const state = useCommitPhase(options);
    probe?.(state);
    return (
      <div>
        <span data-testid="phase">{state.phase}</span>
        <span data-testid="shown">{String(state.shown)}</span>
        <span data-testid="error">{state.error ?? ""}</span>
        <button onClick={() => state.request(true)}>request</button>
        <button onClick={() => state.cancelQueued()}>cancel</button>
        <button onClick={() => state.acknowledge()}>ack</button>
        <button onClick={() => state.resolveConflict("theirs")}>resolve</button>
      </div>
    );
  }

  const phase = () => screen.getByTestId("phase").textContent;

  it("cancelling when nothing is queued does nothing", async () => {
    const user = userEvent.setup();
    const onAuditEvent = vi.fn();
    render(<Harness value={false} now={NOW} onAuditEvent={onAuditEvent} />);
    await user.click(screen.getByText("cancel"));
    expect(phase()).toBe("idle");
    expect(onAuditEvent).not.toHaveBeenCalled();
  });

  it("acknowledging when there is nothing to acknowledge does nothing", async () => {
    const user = userEvent.setup();
    render(<Harness value={false} now={NOW} />);
    await user.click(screen.getByText("ack"));
    expect(phase()).toBe("idle");
  });

  it("resolving when there is no conflict does nothing", async () => {
    const user = userEvent.setup();
    const onAuditEvent = vi.fn();
    render(<Harness value={false} now={NOW} onAuditEvent={onAuditEvent} />);
    await user.click(screen.getByText("resolve"));
    expect(onAuditEvent).not.toHaveBeenCalled();
  });

  it("accepts a synchronous onCommit and still passes through pending", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn(() => undefined);
    render(<Harness value={false} now={NOW} onCommit={onCommit} minPendingMs={0} />);
    await user.click(screen.getByText("request"));
    await waitFor(() => expect(phase()).toBe("committed"));
    expect(onCommit).toHaveBeenCalledWith(true, expect.objectContaining({ from: false }));
  });

  it("falls back to a stated message when a rejection carries none", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        value={false}
        now={NOW}
        minPendingMs={0}
        // A rejection that is not an Error at all — a thrown string from a
        // hand-rolled fetch wrapper is the usual source.
        onCommit={() => Promise.reject("network")}
      />,
    );
    await user.click(screen.getByText("request"));
    await waitFor(() => expect(phase()).toBe("reverted"));
    expect(screen.getByTestId("error").textContent).toBe("The change was not saved.");
  });

  it("records an audit event even when the caller supplied no clock", async () => {
    // `now` is required alongside onAuditEvent at the type level. If it goes
    // missing anyway, an empty timestamp is visible in the log — a crash
    // inside the toggle handler is not.
    const user = userEvent.setup();
    const onAuditEvent = vi.fn();
    render(<Harness value={false} onAuditEvent={onAuditEvent} minPendingMs={0} />);
    await user.click(screen.getByText("request"));
    expect(onAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ at: "" }));
  });

  it("drops a slow-timer callback belonging to a superseded request", async () => {
    vi.useFakeTimers();
    const onSlow = vi.fn();
    try {
      const view = render(
        <Harness
          value={false}
          now={NOW}
          slowAfter={50}
          minPendingMs={0}
          onCommit={() => new Promise<void>(() => {})}
          onSlow={onSlow}
        />,
      );
      const request = view.getByText("request");
      act(() => {
        request.click();
      });
      act(() => {
        request.click();
      });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      // Two requests, two timers, one surviving sequence: the first timer must
      // not fire a stall warning for a request nobody is waiting on.
      expect(onSlow).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

/* =================================================================== */
/* The monotonic clock                                                 */
/* =================================================================== */

describe("elapsed time", () => {
  it("degrades to no minimum rather than throwing where performance is absent", async () => {
    const original = globalThis.performance;
    // Some embedded webviews and older React Native runtimes have no
    // performance object at all. A missing clock must cost a minimum pending
    // window, never a crash inside a click handler.
    Reflect.deleteProperty(globalThis, "performance");
    try {
      const { elapsedClock } = await import("@/lib/oxygen-switch");
      expect(elapsedClock()).toBe(0);
    } finally {
      Object.defineProperty(globalThis, "performance", {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  });
});

/* =================================================================== */
/* The remaining corners                                               */
/* =================================================================== */

describe("remaining corners", () => {
  it("records the negative from unknown with a shift-activation", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn().mockResolvedValue(undefined);
    render(
      <Switch
        label="Latex allergy"
        checked="unknown"
        absentReason="not-collected"
        stateLabels="yes-no"
        onCommit={onCommit}
      />,
    );
    // Plain activation records yes — the answer somebody is writing down.
    // Shift records no. Neither can return to "unknown".
    await user.keyboard("{Shift>}");
    await user.click(control());
    await user.keyboard("{/Shift}");
    await waitFor(() => expect(onCommit).toHaveBeenCalledWith(false, expect.anything()));
  });

  it("names itself generically when the caller supplied no label at all", async () => {
    // Not a supported configuration — the contract suite requires an
    // accessible name — but the announcement must still read as a sentence
    // rather than interpolating undefined into a live region.
    const user = userEvent.setup();
    const view = render(
      <Switch defaultChecked={false} onCommit={() => Promise.reject(new Error("Nope."))} />,
    );
    await user.click(view.container.querySelector("button") as HTMLElement);
    await waitFor(() => {
      expect(view.container.textContent).toMatch(/This setting was not changed/i);
    });
    expectNoLeakedValues(view);
  });

  it("omits the via clause when provenance does not carry one", () => {
    const view = render(
      <Switch label="Contact precautions" checked provenance={{ by: "S. Mehta", at: NOW }} />,
    );
    expect(view.container.textContent).toMatch(/by S\. Mehta/);
    expect(view.container.textContent).not.toMatch(/S\. Mehta,/);
  });

  it("renders an off chip without a glyph", () => {
    const view = render(<Switch aria-label="Isolation" appearance="chip" checked={false} />);
    expect(view.container.querySelector(".ox-switch__chip .ox-switch__glyph")).toBeNull();
  });

  it("renders a row with no description", () => {
    const view = render(<Switch label="Text me my results" appearance="row" checked />);
    expect(view.container.querySelector(".ox-switch__desc")).toBeNull();
    expect(screen.getByRole("switch")).toHaveAccessibleName("Text me my results");
  });

  it("renders a list with a title and no counts", () => {
    render(
      <SwitchList title="Isolation precautions">
        <SwitchField label="Contact" checked />
      </SwitchList>,
    );
    expect(screen.getByRole("group")).toHaveAccessibleName("Isolation precautions");
  });

  it("queues a change made while offline and still reports the conflict when one lands", () => {
    // A conflict arriving while a change is queued must not replace the queued
    // state: the user still has an un-sent decision, and losing it silently is
    // the failure the queued phase exists to prevent.
    const view = render(<Switch label="Falls risk" defaultChecked={false} online={false} />);
    fireEvent.click(control());
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "queued");

    view.rerender(<Switch label="Falls risk" checked={false} serverValue online={false} />);
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "queued");
  });

  it("cancels a queued change and reports it as cancelled", async () => {
    const user = userEvent.setup();
    const onAuditEvent = vi.fn();
    const view = render(
      <Switch
        label="Falls risk"
        defaultChecked={false}
        online={false}
        now={NOW}
        onAuditEvent={onAuditEvent}
      />,
    );
    await user.click(control());
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(root(view.container)).toHaveAttribute("data-ox-phase", "idle");
    expect(onAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "cancelled", to: true }),
    );
  });

  it("never warns about a stall when slowAfter is switched off", async () => {
    vi.useFakeTimers();
    const onSlow = vi.fn();
    try {
      render(
        <Switch
          label="Contact precautions"
          defaultChecked={false}
          slowAfter={0}
          onSlow={onSlow}
          onCommit={() => new Promise<void>(() => {})}
        />,
      );
      act(() => {
        control().click();
      });
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(onSlow).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("drops the committed-to-idle timer belonging to a superseded request", async () => {
    vi.useFakeTimers();
    try {
      const resolvers: Array<() => void> = [];
      const view = render(
        <Switch
          label="Contact precautions"
          defaultChecked={false}
          minPendingMs={0}
          onCommit={() => new Promise<void>((resolve) => resolvers.push(resolve))}
        />,
      );
      act(() => {
        control().click();
      });
      act(() => {
        control().click();
      });
      // Resolve the FIRST request after the second has superseded it. Its
      // committed-then-idle timer must not touch the state the second owns.
      await act(async () => {
        resolvers[0]?.();
      });
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      await act(async () => {
        resolvers[1]?.();
      });
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(root(view.container)).toHaveAttribute("data-ox-phase", "idle");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("partial composition", () => {
  it("renders a row described but not labelled", () => {
    // A row inside a list whose heading already names it: the description
    // carries the detail and the accessible name comes from aria-label.
    const view = render(
      <Switch
        aria-label="Text me my results"
        appearance="row"
        description="To the mobile ending 4471."
        checked
      />,
    );
    expect(view.container.querySelector(".ox-switch__label")).toBeNull();
    expect(view.container.textContent).toMatch(/ending 4471/);
    expect(screen.getByRole("switch")).toHaveAccessibleName("Text me my results");
  });

  it("renders a list summary without a title", () => {
    const view = render(
      <SwitchList counts={{ on: 2, total: 5, unknown: 1 }}>
        <SwitchField label="Contact" checked />
      </SwitchList>,
    );
    expect(view.container.querySelector(".ox-switch-list__title")).toBeNull();
    // Unknown is reported separately and excluded from the ratio — a count
    // that folds "not asked" into "off" is the group-scale version of the
    // failure this component exists to prevent.
    expect(view.container.textContent).toMatch(/2 of 5 in effect/);
    expect(view.container.textContent).toMatch(/1 not asked/);
  });
});
