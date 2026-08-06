import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CareTeam } from "@oxygenui-design/fhir";
import { CareTeamPanel } from "./care-team";
import { itMeetsTheContract } from "../../../test/contract";

const AS_OF = new Date("2026-08-06T09:00:00Z");

const TEAM: CareTeam = {
  resourceType: "CareTeam",
  id: "syn-team",
  status: "active",
  subject: { reference: "Patient/syn-patient-routine" },
  participant: [
    {
      role: [{ text: "Responsible consultant" }],
      member: { reference: "Practitioner/p1", display: "Dr Nadia Farrell" },
    },
    {
      role: [{ text: "Peer support worker" }],
      member: { reference: "Practitioner/p2", display: "Sam Iyer" },
    },
    {
      role: [{ text: "Physiotherapist" }],
      member: { reference: "Practitioner/p3", display: "Ola Bergstrom" },
      period: { start: "2026-02-01", end: "2026-03-01" },
    },
  ],
};

describe("CareTeamPanel", () => {
  itMeetsTheContract("team", () => <CareTeamPanel team={TEAM} asOf={AS_OF} />);

  it("lists the current members", () => {
    const view = render(<CareTeamPanel team={TEAM} asOf={AS_OF} />);
    expect(view.container.textContent).toContain("Dr Nadia Farrell");
  });

  /**
   * "A panel that lists the assigned consultant at 2am, with no indication
   * that they are not on call, is worse than no panel — it produces a
   * confident call to a phone nobody is holding."
   */
  it("shows the covering clinician alongside the assigned one, not instead of them", () => {
    const view = render(
      <CareTeamPanel
        team={TEAM}
        coverage={{ "Practitioner/p1": { coveringName: "Dr Priya Raman", until: "2026-08-07" } }}
        asOf={AS_OF}
      />,
    );
    const text = view.container.textContent ?? "";
    expect(text).toContain("Dr Nadia Farrell");
    expect(text).toContain("Dr Priya Raman");
  });

  it("marks that the covering clinician is covering, not a second assignee", () => {
    const view = render(
      <CareTeamPanel
        team={TEAM}
        coverage={{ "Practitioner/p1": { coveringName: "Dr Priya Raman" } }}
        asOf={AS_OF}
      />,
    );
    expect(view.container.textContent).toMatch(/cover|on call|instead|standing in/i);
  });

  /**
   * "Past members are history, not deletions" — kept, because reviews ask who
   * was looking after them in March, but folded away so they cannot be read as
   * the current team.
   */
  it("keeps past members as history rather than dropping them", () => {
    const view = render(<CareTeamPanel team={TEAM} asOf={AS_OF} />);
    expect(view.container.textContent).toContain("Ola Bergstrom");
  });

  it("separates past members from the current team", () => {
    const view = render(<CareTeamPanel team={TEAM} asOf={AS_OF} />);
    const details = view.container.querySelector("details");
    expect(details?.textContent).toContain("Ola Bergstrom");
    expect(details?.textContent).not.toContain("Dr Nadia Farrell");
    // Folded by default: history should not compete with who is on now.
    expect(details?.hasAttribute("open")).toBe(false);
  });

  it("drops the history entirely when asked", () => {
    const view = render(<CareTeamPanel team={TEAM} showPast={false} asOf={AS_OF} />);
    expect(view.container.textContent).not.toContain("Ola Bergstrom");
  });

  /**
   * "In behavioral health and complex care they frequently ARE the team, and
   * demoting them to a footnote misrepresents how the care actually happens."
   */
  it("renders non-clinician members with the same weight as clinicians", () => {
    const view = render(<CareTeamPanel team={TEAM} asOf={AS_OF} />);
    expect(view.container.textContent).toContain("Sam Iyer");

    const clinician = screen.getByText("Dr Nadia Farrell").closest("li,div");
    const peer = screen.getByText("Sam Iyer").closest("li,div");
    expect(clinician?.tagName).toBe(peer?.tagName);
  });

  it("pins the responsible clinician first", () => {
    const view = render(
      <CareTeamPanel team={TEAM} responsibleRef="Practitioner/p2" asOf={AS_OF} />,
    );
    const text = view.container.textContent ?? "";
    expect(text.indexOf("Sam Iyer")).toBeLessThan(text.indexOf("Dr Nadia Farrell"));
  });

  it("includes members the CareTeam resource does not model", () => {
    const view = render(
      <CareTeamPanel
        team={TEAM}
        extraMembers={[
          { name: "Community health worker", role: "Community support", current: true },
        ]}
        asOf={AS_OF}
      />,
    );
    expect(view.container.textContent).toContain("Community health worker");
  });

  it("offers a contact route when one is supplied", async () => {
    const onMessage = vi.fn();
    render(
      <CareTeamPanel
        team={TEAM}
        contacts={{ "Practitioner/p1": { phone: "555-0188", onMessage } }}
        asOf={AS_OF}
      />,
    );
    // The call affordance is an icon link; its accessible name is its whole
    // surface, and it must name WHO it calls — the wrong-person risk is the
    // point of the panel.
    const call = screen.getByRole("link", { name: /call dr nadia farrell/i });
    expect(call).toHaveAttribute("href", "tel:555-0188");

    await userEvent.click(screen.getByRole("button", { name: /message/i }));
    expect(onMessage).toHaveBeenCalled();
  });

  it("renders a missing team as absent rather than blank", () => {
    const view = render(<CareTeamPanel team={undefined} asOf={AS_OF} />);
    const text = view.container.textContent ?? "";
    expect(text).not.toContain("undefined");
    expect(text.trim().length).toBeGreaterThan(0);
  });
});
