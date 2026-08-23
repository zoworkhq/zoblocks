/**
 * AllergyChip — the two failures, and one describe block each.
 *
 * The first is that `criticality` and `reaction.severity` are severity-shaped
 * fields that mean opposite things, and implementations drop the one that
 * matters. The second is that "no known allergies" and "nobody asked" get
 * rendered the same way, which turns an unanswered question into a cleared
 * one beside a prescribing button.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AllergyChip,
  AllergyList,
  INACTIVE_VERIFICATIONS,
  VERIFICATION_LABEL,
  describeAllergy,
  fromAllergyIntolerance,
  isActive,
  noKnownFromFHIR,
  resolveListState,
  toKind,
  toVerification,
  worstReaction,
  type AllergyRecord,
  type Verification,
} from "./allergy-chip";

const penicillin: AllergyRecord = {
  id: "1",
  substance: "Penicillin G",
  kind: "allergy",
  criticality: "high",
  verification: "confirmed",
  reactions: [{ manifestation: "Urticaria", severity: "mild", onset: "1998", note: "age 6" }],
};

const amoxicillin: AllergyRecord = {
  id: "2",
  substance: "Amoxicillin",
  kind: "allergy",
  criticality: "low",
  verification: "unconfirmed",
  reactions: [{ manifestation: "Urticaria", severity: "mild", onset: "2019" }],
};

/* ------------------------------------------------------------------ */
/* Failure 1 — criticality is not severity                             */
/* ------------------------------------------------------------------ */

describe("criticality and reaction severity are different facts", () => {
  it("renders both, as different kinds of thing", () => {
    const { container } = render(<AllergyChip record={penicillin} />);
    // Future risk is a chip with a shape; the past is plain text.
    expect(
      container.querySelector("[data-ox-scale='criticality'][data-ox-step='critical']"),
    ).toBeTruthy();
    expect(container.querySelector(".ox-allergy__manifestation")).toHaveTextContent("Urticaria");
    expect(container.querySelector(".ox-allergy__severity")).toHaveTextContent("mild");
  });

  it("keeps them apart when they disagree, which is the whole point", () => {
    // Same manifestation, same severity, opposite consequences. If the two
    // rows render identically the component has failed.
    const high = render(<AllergyChip record={penicillin} />);
    const highChip = high.container.querySelector("[data-ox-allergy]")!;
    high.unmount();

    const low = render(<AllergyChip record={amoxicillin} />);
    const lowChip = low.container.querySelector("[data-ox-allergy]")!;

    expect(highChip.getAttribute("data-ox-criticality")).toBe("high");
    expect(lowChip.getAttribute("data-ox-criticality")).toBe("low");
    expect(highChip.getAttribute("aria-label")).not.toBe(lowChip.getAttribute("aria-label"));
  });

  it("maps high criticality to critical, not to high", () => {
    // The FHIR word understates it: a high-criticality allergy is the one that
    // kills somebody, and the amber chip is the wrong signal for it.
    const { container } = render(<AllergyChip record={penicillin} />);
    expect(container.querySelector("[data-ox-step='critical']")).toBeTruthy();
  });

  it("says so out loud when a criticality has no reaction behind it", () => {
    // The combination a reader is most likely to misread as a contradiction.
    render(
      <AllergyChip
        record={{ id: "x", substance: "Codeine", kind: "allergy", criticality: "high" }}
      />,
    );
    const group = screen.getByRole("group");
    expect(group).toHaveTextContent("No reaction recorded");
    expect(group.getAttribute("aria-label")).toContain("no reaction recorded");
  });

  it("picks the worst past reaction rather than the first", () => {
    const worst = worstReaction({
      id: "x",
      substance: "X",
      kind: "allergy",
      reactions: [
        { manifestation: "Rash", severity: "mild" },
        { manifestation: "Anaphylaxis", severity: "severe" },
        { manifestation: "Nausea", severity: "moderate" },
      ],
    });
    expect(worst?.manifestation).toBe("Anaphylaxis");
  });

  it("orders the accessible name: kind, substance, criticality, verification", () => {
    const label = describeAllergy(penicillin);
    expect(label).toBe(
      "Allergy: Penicillin G, high criticality, confirmed, worst recorded reaction urticaria, mild, 1998.",
    );
    // Criticality before verification: the first decides whether to prescribe,
    // the second how much to trust the rest.
    expect(label.indexOf("high criticality")).toBeLessThan(label.indexOf("confirmed"));
  });
});

/* ------------------------------------------------------------------ */
/* Failure 2 — the two empty states                                    */
/* ------------------------------------------------------------------ */

describe("the two absences", () => {
  it("treats a properly asserted no-known as a positive finding", () => {
    render(<AllergyList noneKnown={{ asserter: "R. Okafor, RN", assertedAt: "14 Aug 2026" }} />);
    const group = screen.getByRole("group");
    expect(group).toHaveTextContent("No known allergies");
    expect(group).toHaveTextContent("R. Okafor, RN");
    expect(group.getAttribute("aria-label")).toContain("Asserted by R. Okafor, RN");
  });

  it("degrades an assertion with no author to not-asked", () => {
    // An empty allergy list beside a prescribing button is a claim the
    // software has not earned, and this is the line that refuses to make it.
    render(<AllergyList noneKnown={{ assertedAt: "14 Aug 2026" }} />);
    expect(screen.getByRole("group")).toHaveTextContent("Allergy status not recorded");
  });

  it("degrades an assertion with no date too", () => {
    render(<AllergyList noneKnown={{ asserter: "R. Okafor, RN" }} />);
    expect(screen.getByRole("group")).toHaveTextContent("Allergy status not recorded");
  });

  it("renders not-asked for an empty list with no assertion at all", () => {
    render(<AllergyList records={[]} />);
    expect(screen.getByRole("group")).toHaveTextContent(
      "no assertion that there is nothing to enter",
    );
  });

  it("distinguishes the two by shape, not only by colour", () => {
    // A reader scanning a chart has to tell them apart without reading either,
    // and the dash is what survives greyscale and the ward printer.
    const asserted = render(<AllergyList noneKnown={{ asserter: "A", assertedAt: "1 Jan" }} />);
    expect(asserted.container.querySelector(".ox-allergy-none")).toBeTruthy();
    asserted.unmount();

    const unasked = render(<AllergyList />);
    expect(unasked.container.querySelector(".ox-allergy-unknown")).toBeTruthy();
  });

  it("counts a list of only refuted entries as not-asked", () => {
    // The list is empty of warnings, and nobody has asserted that it should be.
    const state = resolveListState({
      records: [{ id: "1", substance: "Sulfa", kind: "allergy", verification: "refuted" }],
    });
    expect(state.kind).toBe("not-asked");
  });

  it("offers the ask affordance as a real button", async () => {
    const onAsk = vi.fn();
    render(<AllergyList onAsk={onAsk} />);
    const button = screen.getByRole("button", { name: "Ask and record" });
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onAsk).toHaveBeenCalledTimes(1);
  });
});

/* ------------------------------------------------------------------ */
/* Kinds and verification                                              */
/* ------------------------------------------------------------------ */

describe("kinds", () => {
  it("renders an intolerance as its own class", () => {
    // Not a weak allergy. These are the entries most often lost from a
    // psychotropic history.
    const { container } = render(
      <AllergyChip
        record={{
          id: "3",
          substance: "Lithium carbonate",
          kind: "intolerance",
          criticality: "unable-to-assess",
        }}
      />,
    );
    expect(container.querySelector(".ox-allergy__kind")).toHaveTextContent("Intolerance");
    expect(screen.getByRole("group").getAttribute("aria-label")).toMatch(/^Intolerance: /);
  });

  it("leaves the common case unlabelled so the exceptions carry weight", () => {
    const { container } = render(<AllergyChip record={penicillin} />);
    expect(container.querySelector(".ox-allergy__kind")).toBeNull();
  });
});

describe("verification", () => {
  const all: Verification[] = [
    "unconfirmed",
    "presumed",
    "confirmed",
    "refuted",
    "entered-in-error",
    "unable-to-verify",
  ];

  it("covers six states", () => {
    expect(Object.keys(VERIFICATION_LABEL)).toHaveLength(6);
  });

  it.each(all)("%s reaches the accessible name", (verification) => {
    render(<AllergyChip record={{ ...penicillin, verification }} />);
    expect(screen.getByRole("group").getAttribute("aria-label")).toContain(
      VERIFICATION_LABEL[verification].toLowerCase(),
    );
  });

  it("knows which two mean the entry is no longer a warning", () => {
    expect(INACTIVE_VERIFICATIONS).toEqual(["refuted", "entered-in-error"]);
    expect(isActive("refuted")).toBe(false);
    expect(isActive("entered-in-error")).toBe(false);
    expect(isActive("unconfirmed")).toBe(true);
    // Undefined is active: a record with no verification status is still a
    // warning, and treating it as cleared would be the dangerous default.
    expect(isActive(undefined)).toBe(true);
  });

  it("keeps a refuted entry readable rather than deleting it", () => {
    // A refuted allergy that vanishes gets re-reported at the next intake.
    const { container } = render(
      <AllergyChip
        record={{
          id: "4",
          substance: "Sulfa drugs",
          kind: "allergy",
          verification: "refuted",
          note: "Rechallenged 2024 · tolerated",
        }}
      />,
    );
    const chip = container.querySelector("[data-ox-allergy]")!;
    expect(chip.hasAttribute("data-ox-inactive")).toBe(true);
    expect(chip).toHaveTextContent("Sulfa drugs");
    expect(chip).toHaveTextContent("Rechallenged 2024");
  });
});

/* ------------------------------------------------------------------ */
/* Class expansion                                                     */
/* ------------------------------------------------------------------ */

describe("class expansion", () => {
  it("renders an expansion when the host supplies one", () => {
    render(
      <AllergyChip
        record={penicillin}
        expandClass={(s) =>
          s.startsWith("Penicillin") ? { label: "beta-lactam", count: 12 } : null
        }
      />,
    );
    expect(screen.getByRole("group")).toHaveTextContent("Class: beta-lactam · 12 members");
  });

  it("renders nothing when the host has no expansion", () => {
    // Different from an expansion of zero, and neither is a guess.
    const { container } = render(<AllergyChip record={penicillin} expandClass={() => null} />);
    expect(container.querySelector(".ox-allergy__class")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Interaction                                                         */
/* ------------------------------------------------------------------ */

describe("interaction", () => {
  it("has no tab stop without a history to open", () => {
    render(<AllergyChip record={penicillin} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("opens the history from the keyboard", async () => {
    const onOpenDetail = vi.fn();
    render(<AllergyChip record={penicillin} onOpenDetail={onOpenDetail} />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onOpenDetail).toHaveBeenCalledWith(penicillin);
  });

  it("renders every record in a list", () => {
    const { container } = render(<AllergyList records={[penicillin, amoxicillin]} />);
    expect(container.querySelectorAll("[data-ox-allergy]")).toHaveLength(2);
    const list = container.querySelector("[data-ox-allergy-list]")!;
    expect(list.getAttribute("data-ox-allergy-list")).toBe("records");
    expect(within(list as HTMLElement).getAllByRole("group")).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------ */
/* FHIR                                                                */
/* ------------------------------------------------------------------ */

describe("fromAllergyIntolerance", () => {
  it("reads substance, criticality, verification and reactions", () => {
    const record = fromAllergyIntolerance({
      id: "a1",
      type: "allergy",
      criticality: "high",
      code: { text: "Penicillin G" },
      verificationStatus: { coding: [{ code: "confirmed" }] },
      reaction: [{ manifestation: [{ text: "Urticaria" }], severity: "mild", onset: "1998" }],
    });
    expect(record).toMatchObject({
      substance: "Penicillin G",
      kind: "allergy",
      criticality: "high",
      verification: "confirmed",
    });
    expect(record?.reactions?.[0]).toMatchObject({ manifestation: "Urticaria", severity: "mild" });
  });

  it("does not guess allergy when the type is missing", () => {
    // "allergy" is the stronger claim and the one that stops a prescription.
    expect(toKind({ code: { text: "X" } })).toBe("adverse-reaction");
    expect(toKind({ type: "intolerance" })).toBe("intolerance");
  });

  it("returns null for a no-known-allergy resource", () => {
    // Rendering one as an allergy to "No known allergy" is a real bug that
    // ships, and it reads as a warning rather than a clearance.
    expect(
      fromAllergyIntolerance({
        id: "n",
        code: { coding: [{ code: "716186003" }], text: "No known allergy" },
      }),
    ).toBeNull();
  });

  it("reads a no-known assertion only when it has an author and a date", () => {
    const complete = noKnownFromFHIR({
      code: { coding: [{ code: "409137002" }] },
      asserter: { display: "R. Okafor, RN" },
      recordedDate: "2026-08-14",
    });
    expect(complete).toMatchObject({ asserter: "R. Okafor, RN", scope: "medication" });

    // No author: not an assertion, and the caller gets nothing rather than
    // something it would render as a clearance.
    expect(
      noKnownFromFHIR({ code: { coding: [{ code: "409137002" }] }, recordedDate: "2026-08-14" }),
    ).toBeNull();
  });

  it("maps every verification code, and nothing else", () => {
    for (const code of ["unconfirmed", "presumed", "confirmed", "refuted", "entered-in-error"]) {
      expect(toVerification({ coding: [{ code }] })).toBe(code);
    }
    expect(toVerification({ coding: [{ code: "something" }] })).toBeUndefined();
    expect(toVerification(undefined)).toBeUndefined();
  });

  it("joins several manifestations rather than dropping all but one", () => {
    const record = fromAllergyIntolerance({
      id: "x",
      code: { text: "Lithium" },
      reaction: [
        { manifestation: [{ text: "Tremor" }, { text: "Polyuria" }], severity: "moderate" },
      ],
    });
    expect(record?.reactions?.[0]?.manifestation).toBe("Tremor, Polyuria");
  });
});
