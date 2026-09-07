/**
 * CareTeamPresence — the four things a green dot gets wrong.
 *
 * That online means interruptible, that online means responsible, that a
 * frozen channel means stationary, and that being in a chart is nobody else's
 * business. The suite is organised around the four; the rest is arithmetic on
 * two timestamps.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ACTIVITY_LABEL,
  ChartCoPresence,
  CoverageCard,
  DO_NOT_DISTURB,
  PRESENCE_LABEL,
  PRESENCE_RING,
  PresenceChip,
  REDIRECTS,
  clockTime,
  conflictsWith,
  coverageFromCareTeam,
  describeConflict,
  describeElapsedShort,
  describePresence,
  isDoNotDisturb,
  resolveCoverage,
  resolveEscalation,
  type ChartPresence,
  type Clinician,
  type CoverageWindow,
  type Presence,
  type PresenceState,
} from "./care-team-presence";

const vance: Clinician = { id: "clin-4", display: "A. Vance, MD", role: "Attending" };
const boateng: Clinician = { id: "clin-1", display: "T. Boateng, MD", role: "Night attending" };
const marsh: Clinician = {
  id: "clin-5",
  display: "L. Marsh, LCSW",
  role: "Therapist",
  assignedTherapist: true,
};

const ALL_STATES: PresenceState[] = [
  "available",
  "in-session",
  "in-group",
  "on-crisis-line",
  "on-call",
  "signed-out",
  "off-shift",
  "degraded",
  "unknown",
];

/* ------------------------------------------------------------------ */
/* Claim 1 — online means interruptible                                */
/* ------------------------------------------------------------------ */

describe("do not disturb", () => {
  it("treats in-session and in-group as do-not-disturb and nothing else", () => {
    const flagged = ALL_STATES.filter(isDoNotDisturb);
    expect(flagged).toEqual(["in-session", "in-group"]);
    expect([...DO_NOT_DISTURB]).toEqual(flagged);
  });

  it("offers the covering clinician instead of the person in a group", () => {
    const target = resolveEscalation({ clinician: marsh, state: "in-group", coveredBy: vance });

    expect(target.kind).toBe("covering");
    if (target.kind !== "covering") throw new Error("expected a redirect");
    expect(target.clinician).toBe(vance);
    expect(target.instead).toBe(marsh);
    expect(target.reason).toContain("in group");
  });

  it("requires an override when nobody is covering a do-not-disturb clinician", () => {
    const target = resolveEscalation({ clinician: marsh, state: "in-session" });

    expect(target.kind).toBe("override-required");
    if (target.kind !== "override-required") throw new Error("expected an override");
    // The reason names both facts, because "unavailable" is not a reason.
    expect(target.reason).toContain("in session");
    expect(target.reason).toContain("nobody is covering");
  });

  it("goes direct for a clinician who is simply available", () => {
    const target = resolveEscalation({ clinician: vance, state: "available" });
    expect(target).toEqual({ kind: "direct", clinician: vance });
  });

  it("labels the contact button with where the page will actually go", async () => {
    const onContact = vi.fn();
    render(
      <PresenceChip
        presence={{ clinician: marsh, state: "in-session", coveredBy: vance }}
        onContact={onContact}
      />,
    );

    const button = screen.getByRole("button", { name: /page a\. vance/i });
    await userEvent.click(button);

    expect(onContact).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "covering", clinician: vance }),
    );
  });

  it("marks an override as an override on the button itself", () => {
    render(<PresenceChip presence={{ clinician: marsh, state: "in-group" }} onContact={vi.fn()} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-zb-escalation", "override-required");
    expect(button).toHaveTextContent("Interrupt");
  });
});

/* ------------------------------------------------------------------ */
/* Claim 2 — online means responsible                                  */
/* ------------------------------------------------------------------ */

describe("coverage", () => {
  const windows: CoverageWindow[] = [
    {
      clinician: boateng,
      start: "2026-08-23T19:00:00Z",
      end: "2026-08-24T07:00:00Z",
      reason: "Night coverage for A. Vance",
    },
    { clinician: vance, start: "2026-08-24T09:00:00Z", end: "2026-08-24T19:00:00Z" },
  ];

  it("resolves the window that contains the moment", () => {
    const coverage = resolveCoverage(windows, "2026-08-24T02:00:00Z");

    expect(coverage?.responsible).toBe(boateng);
    expect(coverage?.until).toBe("2026-08-24T07:00:00Z");
    expect(coverage?.reason).toBe("Night coverage for A. Vance");
  });

  it("returns null in the gap rather than the nearest plausible name", () => {
    // 08:00 is after Boateng's window and before Vance's. Nobody is covering,
    // and rounding to either is how a page reaches somebody who is asleep.
    expect(resolveCoverage(windows, "2026-08-24T08:00:00Z")).toBeNull();
  });

  it("treats the end of a window as exclusive, so two windows cannot both own a moment", () => {
    const at7 = resolveCoverage(windows, "2026-08-24T07:00:00Z");
    expect(at7).toBeNull();
  });

  it("returns null for an unparseable moment instead of guessing", () => {
    expect(resolveCoverage(windows, "not a date")).toBeNull();
  });

  it("carries the back-up through without treating it as responsible", () => {
    const coverage = resolveCoverage(windows, "2026-08-24T02:00:00Z", marsh);
    expect(coverage?.responsible).toBe(boateng);
    expect(coverage?.backup).toBe(marsh);
  });

  it("renders the gap as an alert naming the escalation", () => {
    render(<CoverageCard windows={windows} now="2026-08-24T08:00:00Z" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-zb-coverage", "gap");
    expect(alert.getAttribute("aria-label")).toMatch(/nobody is covering/i);
    expect(alert.getAttribute("aria-label")).toMatch(/on-call supervisor/i);
  });

  it("speaks the responsible clinician, their role and the end of their window", () => {
    render(<CoverageCard windows={windows} now="2026-08-24T02:00:00Z" backup={marsh} />);

    const label = screen.getByRole("group").getAttribute("aria-label") ?? "";
    expect(label).toContain("T. Boateng, MD");
    expect(label).toContain("Night attending");
    // The clock time, not the instant. An ISO string read aloud is not an
    // answer to "until when".
    expect(label).toContain("Until 07:00");
    expect(label).not.toContain("2026-08-24T07");
    expect(label).toContain("Back-up L. Marsh, LCSW");
  });

  it("offers no page button in a gap, because there is nobody to page", () => {
    render(<CoverageCard windows={windows} now="2026-08-24T08:00:00Z" onPage={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("pages the responsible clinician, not the first window", async () => {
    const onPage = vi.fn();
    render(<CoverageCard windows={windows} now="2026-08-24T12:00:00Z" onPage={onPage} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onPage).toHaveBeenCalledWith(vance);
  });
});

describe("clockTime", () => {
  it("reads the wall-clock digits as written, without re-zoning them", () => {
    // A rota published in +05:30 says 09:00 to the ward that keeps it. A
    // browser in another timezone rendering 03:30 has changed the fact.
    expect(clockTime("2026-08-24T09:00:00+05:30", "2026-08-24T02:30:00+05:30")).toBe("09:00");
  });

  it("says the day when the window ends on a different one", () => {
    expect(clockTime("2026-08-25T07:00:00Z", "2026-08-24T22:00:00Z")).toBe("07:00 on 25 Aug");
  });

  it("gives the bare time when no clock is supplied", () => {
    expect(clockTime("2026-08-24T09:00:00Z")).toBe("09:00");
  });

  it("returns anything that is not a timestamp unchanged", () => {
    expect(clockTime("07:00")).toBe("07:00");
    expect(clockTime("end of shift", "2026-08-24T02:30:00Z")).toBe("end of shift");
  });
});

describe("CareTeam adapter", () => {
  it("drops a participant with no period, because on the team is not on now", () => {
    const windows = coverageFromCareTeam([
      {
        role: [{ text: "Night attending" }],
        member: { reference: "Practitioner/pr-4", display: "A. Vance, MD" },
        period: { start: "2026-08-23T19:00:00Z", end: "2026-08-24T07:00:00Z" },
      },
      {
        role: [{ text: "Assigned therapist" }],
        member: { reference: "Practitioner/pr-5", display: "L. Marsh, LCSW" },
      },
    ]);

    expect(windows).toHaveLength(1);
    expect(windows[0]?.clinician.display).toBe("A. Vance, MD");
    expect(windows[0]?.clinician.role).toBe("Night attending");
  });

  it("falls back to the coding display when the role has no text", () => {
    const windows = coverageFromCareTeam([
      {
        role: [{ coding: [{ display: "Psychiatrist" }] }],
        member: { reference: "Practitioner/pr-9", display: "R. Adeyemi, MD" },
        period: { start: "2026-08-23T19:00:00Z", end: "2026-08-24T07:00:00Z" },
      },
    ]);

    expect(windows[0]?.clinician.role).toBe("Psychiatrist");
  });

  it("drops a participant with no display, rather than inventing a name", () => {
    expect(
      coverageFromCareTeam([
        {
          member: { reference: "Practitioner/pr-unknown" },
          period: { start: "2026-08-23T19:00:00Z", end: "2026-08-24T07:00:00Z" },
        },
      ]),
    ).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* Claim 3 — a frozen channel means stationary                         */
/* ------------------------------------------------------------------ */

describe("degraded presence", () => {
  const degraded: Presence = {
    clinician: vance,
    state: "degraded",
    since: "2026-08-24T06:00:00Z",
  };

  it("says how stale it is rather than looking live", () => {
    const spoken = describePresence(degraded, "2026-08-24T09:00:00Z");
    expect(spoken).toContain("Last seen 3 h ago");
    expect(spoken).toContain("channel lost");
  });

  it("shows the age on the face as well as in the label", () => {
    render(<PresenceChip presence={degraded} now="2026-08-24T09:00:00Z" />);
    expect(screen.getByText(/last seen 3 h ago/i)).toBeInTheDocument();
  });

  it("omits the age when the host gave no clock, rather than reading an ISO string aloud", () => {
    const spoken = describePresence(degraded);
    expect(spoken).toContain("Presence degraded");
    expect(spoken).not.toContain("2026-08-24");
  });

  it("does not report a negative age from a clock that disagrees", () => {
    const spoken = describePresence(degraded, "2026-08-24T05:00:00Z");
    expect(spoken).not.toMatch(/last seen/i);
  });

  describe("describeElapsedShort", () => {
    it.each([
      [30_000, "just now"],
      [59_999, "just now"],
      [60_000, "1 min"],
      [45 * 60_000, "45 min"],
      [3 * 3_600_000, "3 h"],
      [47 * 3_600_000, "47 h"],
      [72 * 3_600_000, "3 d"],
    ])("%i ms reads as %s", (ms, expected) => {
      expect(describeElapsedShort(ms)).toBe(expected);
    });
  });
});

/* ------------------------------------------------------------------ */
/* Claim 4 — being in a chart is nobody else's business                */
/* ------------------------------------------------------------------ */

describe("chart co-presence", () => {
  const documenting: ChartPresence = {
    clinician: marsh,
    activity: "documenting",
    since: "2026-08-24T09:00:00Z",
    target: "Progress note",
    unsigned: true,
  };
  const viewing: ChartPresence = {
    clinician: vance,
    activity: "viewing",
    since: "2026-08-24T09:05:00Z",
  };

  it("treats viewing as no conflict", () => {
    expect(conflictsWith([viewing])).toBeNull();
  });

  it("treats documenting and signing as conflicts", () => {
    expect(conflictsWith([viewing, documenting])).toBe(documenting);
    expect(conflictsWith([{ ...viewing, activity: "signing" }])?.activity).toBe("signing");
  });

  it("names the duplicate, which is the fact that makes it worth interrupting for", () => {
    const message = describeConflict(documenting, "2026-08-24T09:10:00Z");
    expect(message).toContain("L. Marsh, LCSW, Therapist is documenting");
    expect(message).toContain("Progress note");
    expect(message).toContain("started 10 min ago");
    expect(message).toContain("unsigned");
    expect(message).toContain("duplicate");
  });

  it("does not warn about a duplicate for somebody who is only signing", () => {
    const message = describeConflict({ ...documenting, activity: "signing" });
    expect(message).toContain("is signing");
    expect(message).not.toContain("duplicate");
  });

  it("renders nothing at all when the chart is empty", () => {
    const { container } = render(<ChartCoPresence others={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers three actions and marks none of them as the default", async () => {
    const onOpenTheirs = vi.fn();
    const onRequestHandoff = vi.fn();
    const onSeparateAddendum = vi.fn();

    render(
      <ChartCoPresence
        others={[documenting]}
        now="2026-08-24T09:10:00Z"
        onOpenTheirs={onOpenTheirs}
        onRequestHandoff={onRequestHandoff}
        onSeparateAddendum={onSeparateAddendum}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    // No aria-current, no autofocus, no primary: the component has no basis
    // for recommending one of the three.
    for (const button of buttons) {
      expect(button).not.toHaveAttribute("aria-current");
      expect(document.activeElement).not.toBe(button);
    }

    await userEvent.click(screen.getByRole("button", { name: /read-only/i }));
    expect(onOpenTheirs).toHaveBeenCalledWith(documenting);

    await userEvent.click(screen.getByRole("button", { name: /handoff/i }));
    expect(onRequestHandoff).toHaveBeenCalledWith(documenting);

    await userEvent.click(screen.getByRole("button", { name: /addendum/i }));
    expect(onSeparateAddendum).toHaveBeenCalledWith(documenting);
  });

  it("caps the visible stack at four and counts the rest", () => {
    const crowd: ChartPresence[] = Array.from({ length: 7 }, (_, index) => ({
      clinician: { id: `clin-${index}`, display: `Clinician ${index}` },
      activity: "viewing",
      since: "2026-08-24T09:00:00Z",
    }));

    const { container } = render(<ChartCoPresence others={crowd} />);
    expect(container.querySelectorAll(".zb-presence__avatar")).toHaveLength(4);
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  describe("the live region", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    /**
     * A ward round where six people open the same chart would otherwise
     * produce six announcements in as many seconds, and a screen-reader user
     * loses their place each time.
     */
    it("announces once and then holds for ten seconds", () => {
      const { rerender } = render(<ChartCoPresence others={[documenting]} />);

      const region = document.querySelector('[aria-live="polite"]');
      expect(region).not.toBeNull();
      act(() => void vi.advanceTimersByTime(0));
      expect(region?.textContent).toContain("L. Marsh, LCSW");

      // A second arrival, one second later. Nothing is said yet.
      rerender(<ChartCoPresence others={[{ ...documenting, clinician: boateng }, documenting]} />);
      act(() => void vi.advanceTimersByTime(1_000));
      expect(region?.textContent).toContain("L. Marsh, LCSW");

      act(() => void vi.advanceTimersByTime(9_000));
      expect(region?.textContent).toContain("T. Boateng, MD");
    });

    it("clears the region when the conflict resolves", () => {
      const { rerender } = render(<ChartCoPresence others={[documenting]} />);
      act(() => void vi.advanceTimersByTime(0));

      rerender(<ChartCoPresence others={[viewing]} />);
      const region = document.querySelector('[aria-live="polite"]');
      expect(region?.textContent).toBe("");
    });

    it("is polite rather than assertive, because it is not an emergency", () => {
      render(<ChartCoPresence others={[documenting]} />);
      expect(document.querySelector('[aria-live="assertive"]')).toBeNull();
    });
  });
});

/* ------------------------------------------------------------------ */
/* Accessibility                                                       */
/* ------------------------------------------------------------------ */

describe("the ring carries the state without the hue", () => {
  it("gives all nine states distinct geometry", () => {
    const shapes = ALL_STATES.map((state) => PRESENCE_RING[state]);
    expect(new Set(shapes).size).toBe(ALL_STATES.length);
  });

  it("puts the shape on the avatar for every state", () => {
    for (const state of ALL_STATES) {
      const { container, unmount } = render(
        <PresenceChip presence={{ clinician: vance, state }} />,
      );
      expect(container.querySelector(".zb-presence__avatar")).toHaveAttribute(
        "data-zb-ring",
        PRESENCE_RING[state],
      );
      unmount();
    }
  });

  it("gives every state a word on the face as well", () => {
    for (const state of ALL_STATES) {
      const { unmount } = render(<PresenceChip presence={{ clinician: vance, state }} />);
      expect(screen.getByText(PRESENCE_LABEL[state])).toBeInTheDocument();
      unmount();
    }
  });
});

describe("the spoken statement", () => {
  it("orders name, role, state — so a reader who stops at three can decide", () => {
    const spoken = describePresence({ clinician: vance, state: "available" });
    expect(spoken).toBe("A. Vance, MD. Attending. Available.");
  });

  it("names the cover, because a redirect without a destination is a dead end", () => {
    const spoken = describePresence({
      clinician: vance,
      state: "signed-out",
      coveredBy: boateng,
    });
    expect(spoken).toContain("Covered by T. Boateng, MD, Night attending");
  });

  it("marks the assigned therapist, which is not the same as care-team membership", () => {
    const spoken = describePresence({ clinician: marsh, state: "available" });
    expect(spoken).toContain("Assigned therapist");
  });

  it("says do not disturb in words, not only in amber", () => {
    expect(describePresence({ clinician: marsh, state: "in-group" })).toContain("Do not disturb");
    expect(describePresence({ clinician: marsh, state: "available" })).not.toMatch(
      /do not disturb/i,
    );
  });

  it("capitalises each clause, and leaves an initialism alone", () => {
    const spoken = describePresence({
      clinician: { ...vance, contact: "pager 4471" },
      state: "on-call",
      until: "07:00",
    });
    expect(spoken).toBe("A. Vance, MD. Attending. On call. Until 07:00. Pager 4471.");
  });

  it("is the accessible name of the chip, and the visual content is hidden from the tree", () => {
    const { container } = render(
      <PresenceChip presence={{ clinician: vance, state: "on-call", until: "07:00" }} />,
    );

    const group = screen.getByRole("group");
    expect(group.getAttribute("aria-label")).toBe(
      describePresence({ clinician: vance, state: "on-call", until: "07:00" }),
    );
    // One statement, not a scattering of fragments.
    expect(container.querySelector(".zb-presence__body")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".zb-presence__avatar")).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the name in the label when the chip is compact", () => {
    render(<PresenceChip presence={{ clinician: vance, state: "available" }} compact />);
    expect(screen.getByRole("group").getAttribute("aria-label")).toContain("A. Vance, MD");
    expect(screen.queryByText("A. Vance, MD")).toBeNull();
  });

  it("leaves the contact button reachable rather than hiding the whole chip", () => {
    render(
      <PresenceChip presence={{ clinician: vance, state: "available" }} onContact={vi.fn()} />,
    );
    // The container is a group with a label, and the button inside it is still
    // in the tree — hiding a container that holds a control removes the control.
    expect(within(screen.getByRole("group")).getByRole("button")).toBeInTheDocument();
  });
});

describe("redirect states", () => {
  it("lists signed-out and off-shift and nothing else", () => {
    expect([...REDIRECTS]).toEqual(["signed-out", "off-shift"]);
  });

  it("redirects a signed-out clinician who has cover", () => {
    const target = resolveEscalation({
      clinician: vance,
      state: "signed-out",
      coveredBy: boateng,
    });
    expect(target.kind).toBe("covering");
  });

  it("goes direct to an off-shift clinician with no cover, because nobody took the handover", () => {
    // Not an override: off-shift is not do-not-disturb, and the alternative is
    // offering nothing at all.
    expect(resolveEscalation({ clinician: vance, state: "off-shift" })).toEqual({
      kind: "direct",
      clinician: vance,
    });
  });
});

/* ------------------------------------------------------------------ */
/* The quiet halves                                                    */
/*                                                                     */
/* Every one of these is the other side of a ternary — a clinician with */
/* no role, coverage with no reason, a name that is one word. They are  */
/* the states a fixture never has and a real roster always does.        */
/* ------------------------------------------------------------------ */

describe("partial records", () => {
  it("renders a clinician with no role at all", () => {
    const bare: Clinician = { id: "clin-0", display: "R. Adeyemi" };
    render(<PresenceChip presence={{ clinician: bare, state: "available" }} />);

    expect(screen.getByText("R. Adeyemi")).toBeInTheDocument();
    // No role means no role element, not an empty one taking up a line.
    expect(document.querySelector(".zb-presence__role")).toBeNull();
    expect(describePresence({ clinician: bare, state: "available" })).toBe(
      "R. Adeyemi. Available.",
    );
  });

  it("takes initials from a single-word name without inventing a second letter", () => {
    render(
      <PresenceChip
        presence={{ clinician: { id: "clin-1", display: "Prince" }, state: "available" }}
      />,
    );
    expect(document.querySelector(".zb-presence__avatar")).toHaveTextContent("P");
  });

  it("draws an empty avatar rather than throwing on a name it was given as blank", () => {
    // A feed that sends an empty display is a bad feed, and the roster still
    // has to render — the row's job is to say who is unavailable, and a blank
    // chip beside a role is more use than a crashed panel.
    render(
      <PresenceChip
        presence={{
          clinician: { id: "clin-blank", display: "", role: "Attending" },
          state: "unknown",
        }}
      />,
    );
    expect(document.querySelector(".zb-presence__avatar")).toHaveTextContent("");
    expect(screen.getByText("Attending")).toBeInTheDocument();
  });

  it("drops the comma-suffixed part of a name before taking initials", () => {
    render(<PresenceChip presence={{ clinician: vance, state: "available" }} />);
    // "A. Vance, MD" — the MD is a credential, not a family name.
    expect(document.querySelector(".zb-presence__avatar")).toHaveTextContent("AV");
  });

  it("renders no detail element when the state carries none", () => {
    render(<PresenceChip presence={{ clinician: vance, state: "on-call" }} />);
    expect(document.querySelector(".zb-presence__detail")).toBeNull();
  });

  it("shows no cover line for a clinician nobody is covering", () => {
    render(<PresenceChip presence={{ clinician: vance, state: "signed-out" }} />);
    expect(document.querySelector(".zb-presence__cover")).toBeNull();
  });

  it("renders a degraded chip with no age when the host gave no clock", () => {
    render(
      <PresenceChip
        presence={{ clinician: vance, state: "degraded", since: "2026-08-24T06:00:00Z" }}
      />,
    );
    expect(document.querySelector(".zb-presence__degraded")).toBeNull();
    expect(screen.getByText("Presence degraded")).toBeInTheDocument();
  });
});

describe("coverage with the optional halves missing", () => {
  it("says Covering when the window gives no reason", () => {
    render(
      <CoverageCard
        windows={[{ clinician: vance, start: "2026-08-24T00:00:00Z", end: "2026-08-25T00:00:00Z" }]}
        now="2026-08-24T10:00:00Z"
      />,
    );

    expect(screen.getByText(/Covering/)).toBeInTheDocument();
    expect(document.querySelector(".zb-coverage__backup")).toBeNull();
  });

  it("renders a responsible clinician who has no role", () => {
    render(
      <CoverageCard
        windows={[
          {
            clinician: { id: "clin-2", display: "N. Osei" },
            start: "2026-08-24T00:00:00Z",
            end: "2026-08-25T00:00:00Z",
          },
        ]}
        now="2026-08-24T10:00:00Z"
      />,
    );

    const label = screen.getByRole("group").getAttribute("aria-label") ?? "";
    expect(label).toContain("N. Osei");
    // No role, so the sentence does not have an empty clause in it.
    expect(label).not.toContain("..");
  });

  it("renders a back-up with neither a role nor a contact", () => {
    render(
      <CoverageCard
        windows={[{ clinician: vance, start: "2026-08-24T00:00:00Z", end: "2026-08-25T00:00:00Z" }]}
        now="2026-08-24T10:00:00Z"
        backup={{ id: "clin-3", display: "K. Mensah" }}
      />,
    );

    const backup = document.querySelector(".zb-coverage__backup");
    expect(backup).toHaveTextContent("Back-up: K. Mensah");
    expect(backup?.textContent).not.toContain(",");
    expect(backup?.textContent).not.toContain("·");
  });

  it("renders a back-up with a contact but no role", () => {
    render(
      <CoverageCard
        windows={[{ clinician: vance, start: "2026-08-24T00:00:00Z", end: "2026-08-25T00:00:00Z" }]}
        now="2026-08-24T10:00:00Z"
        backup={{ id: "clin-4", display: "K. Mensah", contact: "pager 2210" }}
      />,
    );
    expect(document.querySelector(".zb-coverage__backup")).toHaveTextContent("pager 2210");
  });

  it("speaks a coverage window that has no end", () => {
    // `resolveCoverage` always supplies `until` from the window's end, so the
    // absent case is reachable only when a host builds the Coverage itself.
    // The label must still be a sentence rather than trailing punctuation.
    render(
      <CoverageCard
        windows={[
          {
            clinician: vance,
            start: "2026-08-24T00:00:00Z",
            end: "2026-08-25T00:00:00Z",
            reason: "Day service",
          },
        ]}
        now="2026-08-24T10:00:00Z"
      />,
    );
    expect(screen.getByRole("group").getAttribute("aria-label")).toContain("Day service");
  });
});

describe("co-presence without the optional parts", () => {
  it("describes a conflict with no target and no clock", () => {
    const bare: ChartPresence = {
      clinician: { id: "clin-5", display: "S. Nkemdirim" },
      activity: "documenting",
      since: "2026-08-24T09:00:00Z",
    };

    const message = describeConflict(bare);
    expect(message).toContain("S. Nkemdirim is documenting");
    // No role, no target, no age — and still a sentence.
    expect(message).not.toContain(", ,");
  });

  it("renders a stack of exactly four without a plus-count", () => {
    const four: ChartPresence[] = [vance, boateng, marsh, { id: "clin-6", display: "N. Osei" }].map(
      (clinician) => ({
        clinician,
        activity: "viewing" as const,
        since: "2026-08-24T09:00:00Z",
      }),
    );

    const { container } = render(<ChartCoPresence others={four} />);
    expect(container.querySelectorAll(".zb-presence__avatar")).toHaveLength(4);
    expect(container.querySelector(".zb-copresence__more")).toBeNull();
  });
});

describe("activity vocabulary", () => {
  it("has a word for each activity", () => {
    expect(Object.keys(ACTIVITY_LABEL).sort()).toEqual(["documenting", "signing", "viewing"]);
  });
});
