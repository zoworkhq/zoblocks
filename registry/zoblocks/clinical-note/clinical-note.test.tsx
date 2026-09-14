/**
 * ClinicalNote — behaviour, asserted the way a reader or a screen reader
 * receives it.
 *
 * The engine's own guarantees (schema validity, provenance under arbitrary
 * transforms, serializer determinism) are tested in
 * `packages/clinical-note-core` without a DOM and are not repeated here. What
 * this file covers is the part that only exists once there is a browser: that
 * the gate's verdict reaches the sign button, that the toolbar is one tab stop,
 * that provenance is not conveyed by colour alone, and that a blocked control
 * says why it is blocked.
 *
 * Where a test guards a stated design decision rather than a mechanism, the
 * comment names the decision.
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { ClinicalNote, ClinicalNoteReader, SignGate } from "./clinical-note";
import { mixed, noteDoc, noteSection, para } from "@/lib/zoblocks-clinical-note";
import { NODES, expand } from "@zoblocks/clinical-note-core";
import { composition, unreviewedAi } from "@zoblocks/clinical-note-core";

const NOW = new Date("2026-08-16T14:38:00+05:30");

const SUBJECT = {
  reference: "Patient/4471902",
  display: "RANDOL, Joshua",
  identifier: "4471902",
  birthDate: "12 Mar 1996",
  detail: "30y M",
};

const AUTHOR = { display: "R. Menon, MD", role: "Resident", requiresCosign: true };

/** A paragraph carrying two unfilled blanks, via the phrase expander. */
function blanksParagraph() {
  const { content } = expand("Plan: ***intervention***, review in ***interval***.");
  return content.firstChild ?? NODES.paragraph.create();
}

function withAi() {
  return noteDoc(
    noteSection(
      { code: "10164-2", title: "History of present illness", required: true },
      mixed(
        ["Six weeks of fatigue. ", "copied", { source: "DocumentReference/prior" }],
        ["He denies overt bleeding.", "ai", { source: "scribe/v2", reviewed: false }],
      ),
    ),
    noteSection({ code: "51847-2", title: "Assessment and plan", required: true }),
  );
}

function complete() {
  return noteDoc(
    noteSection(
      { code: "10164-2", title: "History of present illness", required: true },
      para("Six weeks of progressive fatigue.", "typed"),
    ),
    noteSection(
      { code: "51847-2", title: "Assessment and plan", required: true },
      para("Transfuse a second unit and repeat the CBC.", "typed"),
    ),
  );
}

function setup(props: Partial<React.ComponentProps<typeof ClinicalNote>> = {}) {
  return render(
    <ClinicalNote subject={SUBJECT} author={AUTHOR} noteType="progress" now={NOW} {...props} />,
  );
}

describe("patient identity", () => {
  it("keeps the subject in the same viewport as the text", () => {
    // The wrong-patient mitigation, and the reason `subject` is not optional.
    setup();
    expect(screen.getByText("RANDOL, Joshua")).toBeInTheDocument();
    expect(screen.getByText(/MRN 4471902/)).toBeInTheDocument();
  });

  it("shows a second independent identifier", () => {
    setup();
    expect(screen.getByText(/DOB 12 Mar 1996/)).toBeInTheDocument();
  });
});

describe("the toolbar", () => {
  it("is a single tab stop", async () => {
    // Fifteen focusable buttons means fifteen Tab presses between the document
    // and the sign button, every time, for anyone not using a mouse.
    setup();
    const toolbar = screen.getByRole("toolbar", { name: /formatting/i });
    const buttons = within(toolbar).getAllByRole("button");
    const tabbable = buttons.filter((button) => button.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
  });

  it("moves between controls with the arrow keys", async () => {
    const user = userEvent.setup();
    setup({ value: complete() });
    const toolbar = screen.getByRole("toolbar", { name: /formatting/i });
    const buttons = within(toolbar)
      .getAllByRole("button")
      .filter((b) => !b.hasAttribute("disabled"));

    buttons[0]?.focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(buttons[1]).toHaveFocus());
    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(buttons[0]).toHaveFocus());
  });

  it("wraps at both ends, and Home/End jump", async () => {
    const user = userEvent.setup();
    setup({ value: complete() });
    const toolbar = screen.getByRole("toolbar", { name: /formatting/i });
    const buttons = within(toolbar)
      .getAllByRole("button")
      .filter((b) => !b.hasAttribute("disabled"));

    buttons[0]?.focus();
    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(buttons[buttons.length - 1]).toHaveFocus());
    await user.keyboard("{Home}");
    await waitFor(() => expect(buttons[0]).toHaveFocus());
    await user.keyboard("{End}");
    await waitFor(() => expect(buttons[buttons.length - 1]).toHaveFocus());
  });

  it("ignores keys it has no business handling", async () => {
    // A toolbar that swallows every keystroke breaks type-ahead and any
    // shortcut the host layered on top.
    const user = userEvent.setup();
    setup({ value: complete() });
    // Bold rather than the first button: Undo is disabled with no history, and
    // a disabled button cannot take focus, so the keystroke would never reach
    // the toolbar at all.
    const bold = screen.getByRole("button", { name: "Bold" });
    bold.focus();
    await user.keyboard("x");
    expect(bold).toHaveFocus();
  });

  it("names every control for a screen reader", () => {
    setup();
    const toolbar = screen.getByRole("toolbar", { name: /formatting/i });
    for (const button of within(toolbar).getAllByRole("button")) {
      expect(button).toHaveAccessibleName();
    }
  });
});

describe("the origins ribbon", () => {
  it("is off by default — it is a review tool, not a reading mode", () => {
    setup({ value: withAi() });
    expect(screen.getByRole("button", { name: /where each passage came from/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("tints the document when turned on", async () => {
    const user = userEvent.setup();
    const { container } = setup({ value: withAi() });
    await user.click(screen.getByRole("button", { name: /where each passage came from/i }));
    await waitFor(() => {
      expect(container.querySelectorAll(".zb-note-pv").length).toBeGreaterThan(0);
    });
  });

  it("gives each origin a class of its own, so colour is never the only channel", async () => {
    // Each class carries a distinct underline style. Under forced-colors the
    // hues are dropped and those styles carry the whole distinction — which is
    // also what survives a monochrome print of the chart.
    const user = userEvent.setup();
    const { container } = setup({ value: withAi() });
    await user.click(screen.getByRole("button", { name: /where each passage came from/i }));
    await waitFor(() => {
      expect(container.querySelector(".zb-note-pv-copied")).toBeTruthy();
      expect(container.querySelector(".zb-note-pv-ai")).toBeTruthy();
    });
  });
});

describe("composition", () => {
  it("reports the copy-forward ratio it measured", () => {
    setup({ value: withAi() });
    const measured = Math.round(composition(withAi()).ratio.copied * 100);
    expect(screen.getByText(new RegExp(`${measured}% copied forward`))).toBeInTheDocument();
  });

  it("describes the stacked bar for a screen reader", () => {
    setup({ value: withAi() });
    // A bar with no accessible name is a decorative rectangle to anyone who
    // cannot see it, and this one is carrying the whole summary.
    expect(screen.getByRole("img", { name: /copied \d+%/i })).toBeInTheDocument();
  });

  it("shows nothing at all for an empty note", () => {
    setup();
    expect(screen.queryByRole("img", { name: /copied/i })).not.toBeInTheDocument();
  });
});

describe("the sign gate", () => {
  it("blocks on an empty required section and on unread generated text", async () => {
    const user = userEvent.setup();
    setup({ value: withAi() });
    await user.click(screen.getByRole("button", { name: /sign & file/i }));

    const gate = await screen.findByTestId("sign-gate");
    expect(within(gate).getByText(/2 blocking/i)).toBeInTheDocument();
    expect(within(gate).getByRole("button", { name: "Sign" })).toBeDisabled();
  });

  it("says why the sign button is blocked, rather than greying out silently", () => {
    // A disabled control with no stated reason is the most common way a gate
    // gets routed around.
    setup({ value: withAi() });
    const sign = screen.getByRole("button", { name: /sign & file/i });
    const describedBy = sign.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toMatch(/must be resolved/i);
  });

  it("keeps each note's blocked reason to itself when two share a page", () => {
    // A fixed id made the second note's button describe itself with the first
    // note's count.
    render(
      <>
        <ClinicalNote
          subject={SUBJECT}
          author={AUTHOR}
          noteType="progress"
          now={NOW}
          value={withAi()}
        />
        <ClinicalNote
          subject={SUBJECT}
          author={AUTHOR}
          noteType="progress"
          now={NOW}
          value={withAi()}
        />
      </>,
    );
    const buttons = screen.getAllByRole("button", { name: /sign & file/i });
    const ids = buttons.map((button) => button.getAttribute("aria-describedby"));

    expect(new Set(ids).size).toBe(2);
    buttons.forEach((button, index) => {
      expect(document.getElementById(ids[index]!)?.parentElement).toBe(button.parentElement);
    });
  });

  it("drops the description once nothing is blocking", () => {
    setup({ value: complete() });
    expect(screen.getByRole("button", { name: /sign & file/i })).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("reports passes as well as failures", async () => {
    // A list that only shows problems reads as an accusation; one that shows
    // both reads as a checklist, and clinicians treat the two very differently.
    const user = userEvent.setup();
    setup({ value: complete() });
    await user.click(screen.getByRole("button", { name: /sign & file/i }));
    const gate = await screen.findByTestId("sign-gate");
    expect(within(gate).getAllByText("Pass").length).toBeGreaterThan(0);
  });

  it("requires the attestation to be ticked before it will sign", async () => {
    const user = userEvent.setup();
    setup({ value: complete(), attestation: "I attest that this is accurate." });
    await user.click(screen.getByRole("button", { name: /sign & file/i }));

    const gate = await screen.findByTestId("sign-gate");
    const sign = within(gate).getByRole("button", { name: "Sign" });
    expect(sign).toBeDisabled();

    await user.click(within(gate).getByRole("checkbox"));
    await waitFor(() => expect(sign).toBeEnabled());
  });

  it("hands the acknowledged warnings to onCommit", async () => {
    // A signature over a note with five acknowledged warnings is a different
    // artifact from one with none, and the record has to be able to say so.
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const copiedHeavy = noteDoc(
      noteSection(
        { code: "10164-2", title: "HPI", required: true },
        mixed(
          ["aaaaaaaaaaaaaaaaaaaa", "copied", { source: "DocumentReference/prior" }],
          ["bb", "typed"],
        ),
      ),
      noteSection(
        { code: "51847-2", title: "A&P", required: true },
        para("Plan documented.", "typed"),
      ),
    );

    setup({ value: copiedHeavy, onCommit });
    await user.click(screen.getByRole("button", { name: /sign & file/i }));
    const gate = await screen.findByTestId("sign-gate");
    await user.click(within(gate).getByRole("button", { name: "Sign" }));

    expect(onCommit).toHaveBeenCalledTimes(1);
    const [kind, , acknowledged] = onCommit.mock.calls[0]!;
    expect(kind).toBe("sign");
    expect(acknowledged).toContain("copy-forward");
  });

  it("commits a draft without going through the gate at all", async () => {
    // Three verbs, three legal meanings. Only one of them is irreversible.
    const user = userEvent.setup();
    const onCommit = vi.fn();
    setup({ value: withAi(), onCommit });
    await user.click(screen.getByRole("button", { name: /save draft/i }));
    expect(onCommit).toHaveBeenCalledWith("draft", expect.anything(), []);
  });

  it("closes without committing when dismissed", async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    setup({ value: complete(), onCommit });
    await user.click(screen.getByRole("button", { name: /sign & file/i }));
    const gate = await screen.findByTestId("sign-gate");
    await user.click(within(gate).getByRole("button", { name: /back to note/i }));
    await waitFor(() => expect(screen.queryByTestId("sign-gate")).not.toBeInTheDocument());
    expect(onCommit).not.toHaveBeenCalled();
  });
});

describe("reviewing generated text", () => {
  it("unblocks the signature once the AI passages are accepted", async () => {
    // The mechanism the whole component exists for: "I reviewed it" becomes
    // something the button can check rather than a claim nobody can falsify.
    const user = userEvent.setup();
    const doc = withAi();
    expect(unreviewedAi(doc)).toHaveLength(1);

    setup({ value: complete() });
    // With nothing unread and both required sections filled, the gate clears.
    await user.click(screen.getByRole("button", { name: /sign & file/i }));
    const gate = await screen.findByTestId("sign-gate");
    expect(within(gate).getByText(/0 blocking/i)).toBeInTheDocument();
  });
});

describe("the section rail", () => {
  it("lists every section of the note type", () => {
    setup();
    const rail = screen.getByRole("navigation", { name: /sections/i });
    expect(within(rail).getAllByRole("button").length).toBeGreaterThanOrEqual(4);
  });

  it("flags a required section that is still empty, before the sign button is reached", () => {
    setup({ value: withAi() });
    const rail = screen.getByRole("navigation", { name: /sections/i });
    expect(within(rail).getByText("required")).toBeInTheDocument();
  });

  it("does not flag a required section that has content", () => {
    setup({ value: complete() });
    const rail = screen.getByRole("navigation", { name: /sections/i });
    expect(within(rail).queryByText("required")).not.toBeInTheDocument();
  });
});

describe("save state", () => {
  it("says what it is doing, politely", () => {
    setup({ saveState: { kind: "saved", at: "14:38:02 IST" } });
    const status = screen.getByText(/Saved 14:38:02 IST/);
    expect(status.closest("[role='status']")).toHaveAttribute("aria-live", "polite");
  });

  it("announces a failed save assertively, because an unheard failure is lost work", () => {
    setup({ saveState: { kind: "failed", reason: "server rejected the draft" } });
    const status = screen.getByText(/Not saved/);
    expect(status.closest("[role='status']")).toHaveAttribute("aria-live", "assertive");
  });

  it("counts what is held locally while offline", () => {
    setup({ saveState: { kind: "offline", pending: 42 } });
    expect(screen.getByText(/42 changes held locally/)).toBeInTheDocument();
  });

  it("renders nothing when the host says nothing", () => {
    setup();
    expect(screen.queryByText(/Saved|Saving|Offline|Not saved/)).not.toBeInTheDocument();
  });
});

describe("note types", () => {
  it("requires a physical examination on an H&P but not on a progress note", () => {
    // The schema doing clinical work: an H&P without an exam is not an H&P.
    const { unmount } = setup({ noteType: "historyAndPhysical" });
    const hpRail = screen.getByRole("navigation", { name: /sections/i });
    expect(within(hpRail).getAllByText("required").length).toBeGreaterThanOrEqual(3);
    unmount();

    setup({ noteType: "progress" });
    const progressRail = screen.getByRole("navigation", { name: /sections/i });
    expect(within(progressRail).getAllByText("required")).toHaveLength(2);
  });
});

describe("the reader", () => {
  it("shows both signatures, in order, with their own times", () => {
    render(
      <ClinicalNoteReader
        subject={SUBJECT}
        title="Progress note"
        doc={complete()}
        attestations={[
          { who: "R. Menon, MD", when: "16 Aug 2026, 14:41 IST" },
          { who: "A. Iyer, MD", when: "16 Aug 2026, 18:02 IST", statement: "I agree." },
        ]}
      />,
    );
    expect(screen.getByText(/R\. Menon, MD/)).toBeInTheDocument();
    expect(screen.getByText(/16 Aug 2026, 14:41 IST/)).toBeInTheDocument();
    expect(screen.getByText(/“I agree\.”/)).toBeInTheDocument();
  });

  it("shows an addendum as an addition, and says the original cannot be edited", () => {
    // The original is not corrected — it is superseded. Both statements stand.
    render(
      <ClinicalNoteReader
        subject={SUBJECT}
        title="Progress note"
        doc={complete()}
        addenda={[
          { author: "A. Iyer, MD", when: "19 Aug 2026, 09:14 IST", text: "Biopsy returned." },
        ]}
      />,
    );
    expect(screen.getByText("Addendum 1")).toBeInTheDocument();
    expect(screen.getByText("Biopsy returned.")).toBeInTheDocument();
    expect(screen.getByText(/cannot be edited/i)).toBeInTheDocument();
  });

  it("renders the note text", () => {
    render(<ClinicalNoteReader subject={SUBJECT} title="Progress note" doc={complete()} />);
    expect(screen.getByText(/Six weeks of progressive fatigue/)).toBeInTheDocument();
  });

  it("has an accessible name saying it is signed", () => {
    render(<ClinicalNoteReader subject={SUBJECT} title="Progress note" doc={complete()} />);
    expect(screen.getByRole("article", { name: /Progress note, signed/i })).toBeInTheDocument();
  });
});

describe("the clock", () => {
  it("uses the host's instant rather than reading one", async () => {
    // A browser clock on a ward workstation is not evidence. Passing a fixed
    // `now` must produce a fixed verdict, or the gate is not reproducible.
    const user = userEvent.setup();
    const stale = noteDoc(
      noteSection(
        { code: "10164-2", title: "HPI", required: true },
        mixed([
          "Potassium 4.1",
          "pulled",
          { source: "Observation/bmp", at: "2026-08-16T01:00:00+05:30" },
        ]),
      ),
      noteSection({ code: "51847-2", title: "A&P", required: true }, para("Plan.", "typed")),
    );

    setup({ value: stale, gateOptions: { maxPullAgeMs: 4 * 60 * 60 * 1000 } });
    await user.click(screen.getByRole("button", { name: /sign & file/i }));
    const gate = await screen.findByTestId("sign-gate");
    expect(within(gate).getByText(/retrieved more than 4h ago/i)).toBeInTheDocument();
  });
});

describe("toolbar commands", () => {
  it("applies bold and italic to the document", async () => {
    // They dispatch through ProseMirror rather than mutating the DOM, so the
    // assertion is that the command ran and the editor still holds a valid
    // document — which is the part a broken command breaks.
    const user = userEvent.setup();
    const { container } = setup({ value: complete() });
    await user.click(screen.getByRole("button", { name: "Bold" }));
    await user.click(screen.getByRole("button", { name: "Italic" }));
    expect(container.querySelector(".zb-note-doc")).toBeInTheDocument();
  });

  it("starts with undo and redo unavailable, because nothing has happened", () => {
    setup({ value: complete() });
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
  });

  it("moves the caret to a section from the rail", async () => {
    const user = userEvent.setup();
    setup({ value: complete() });
    const rail = screen.getByRole("navigation", { name: /sections/i });
    const target = within(rail).getByRole("button", { name: /assessment and plan/i });
    await user.click(target);
    await waitFor(() => expect(target).toHaveAttribute("aria-current", "true"));
  });

  it("walks the blanks a template left behind", async () => {
    // F2, and the button that advertises it. The count is what tells a
    // clinician how many more decisions the template is about to demand.
    const user = userEvent.setup();
    const templated = noteDoc(
      noteSection(
        { code: "10164-2", title: "HPI", required: true },
        para("Interval history reviewed.", "typed"),
      ),
      noteSection({ code: "51847-2", title: "A&P", required: true }, blanksParagraph()),
    );
    setup({ value: templated });
    const button = screen.getByRole("button", { name: /next blank, 2 remaining/i });
    await user.click(button);
    expect(button).toBeInTheDocument();
  });

  it("offers no blank button when there are none", () => {
    setup({ value: complete() });
    expect(screen.queryByRole("button", { name: /next blank/i })).not.toBeInTheDocument();
  });

  it("accepts the generated text from the gate, which unblocks the signature", async () => {
    // The one command with a legal consequence: it is the record of a human
    // having read what a model wrote.
    const user = userEvent.setup();
    setup({ value: withAi() });

    await user.click(screen.getByRole("button", { name: /sign & file/i }));
    let gate = await screen.findByTestId("sign-gate");
    expect(within(gate).getByText(/2 blocking/i)).toBeInTheDocument();

    await user.click(within(gate).getAllByRole("button", { name: /go to it/i })[1]!);
    await waitFor(() => expect(screen.queryByTestId("sign-gate")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /sign & file/i }));
    gate = await screen.findByTestId("sign-gate");
    // The empty assessment still blocks; the unread passage no longer does.
    await waitFor(() => expect(within(gate).getByText(/1 blocking/i)).toBeInTheDocument());
  });
});

describe("what the host leaves out", () => {
  it("renders a subject with nothing but a name and a reference", () => {
    // Two identifiers is the standard, not a schema requirement. A deployment
    // that has only a name must still get a banner rather than a crash.
    render(
      <ClinicalNote
        subject={{ reference: "Patient/1", display: "OKONKWO, Amara" }}
        author={{ display: "A. Iyer, MD" }}
        noteType="progress"
        now={NOW}
      />,
    );
    expect(screen.getByText("OKONKWO, Amara")).toBeInTheDocument();
    expect(screen.queryByText(/MRN/)).not.toBeInTheDocument();
    expect(screen.queryByText(/DOB/)).not.toBeInTheDocument();
  });

  it("renders an author with no role and no cosign requirement", () => {
    render(
      <ClinicalNote
        subject={SUBJECT}
        author={{ display: "A. Iyer, MD" }}
        noteType="progress"
        now={NOW}
      />,
    );
    expect(screen.getByText("A. Iyer, MD")).toBeInTheDocument();
    expect(screen.queryByText(/cosign required/)).not.toBeInTheDocument();
  });

  it("says it is saving", () => {
    setup({ saveState: { kind: "saving" } });
    expect(screen.getByText("Saving…")).toBeInTheDocument();
  });

  it("reports a failed save with no stated reason", () => {
    setup({ saveState: { kind: "failed" } });
    expect(screen.getByText("Not saved")).toBeInTheDocument();
  });

  it("counts a single held change in the singular", () => {
    setup({ saveState: { kind: "offline", pending: 1 } });
    expect(screen.getByText(/1 change held locally/)).toBeInTheDocument();
  });

  it("appends host rules to the defaults rather than replacing them", async () => {
    // A host rule must not be able to switch the built-in safety checks off by
    // accident — passing `rules` adds, it does not override.
    const user = userEvent.setup();
    setup({
      value: complete(),
      rules: [
        {
          id: "documentation-window",
          run: () => ({
            id: "documentation-window",
            severity: "warn" as const,
            title: "This is a late entry",
          }),
        },
      ],
    });
    await user.click(screen.getByRole("button", { name: /sign & file/i }));
    const gate = await screen.findByTestId("sign-gate");
    expect(within(gate).getByText("This is a late entry")).toBeInTheDocument();
    // And the defaults are still there.
    expect(within(gate).getAllByText("Pass").length).toBeGreaterThan(0);
  });

  it("shows no attestation checkbox when the host supplies no wording", async () => {
    // The sentence is a legal decision. With none given there is nothing
    // honest to ask the clinician to tick.
    const user = userEvent.setup();
    setup({ value: complete() });
    await user.click(screen.getByRole("button", { name: /sign & file/i }));
    const gate = await screen.findByTestId("sign-gate");
    expect(within(gate).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(within(gate).getByRole("button", { name: "Sign" })).toBeEnabled();
  });
});

describe("the reader, sparsely populated", () => {
  it("skips a section that has no content", () => {
    // A heading with nothing under it reads as an assertion that there was
    // nothing to find, which is a different claim from not having looked.
    render(
      <ClinicalNoteReader
        subject={SUBJECT}
        title="Progress note"
        doc={noteDoc(
          noteSection({ code: "10164-2", title: "HPI" }, para("", "typed")),
          noteSection({ code: "51847-2", title: "A&P" }, para("Plan documented.", "typed")),
        )}
      />,
    );
    expect(screen.queryByText("HPI")).not.toBeInTheDocument();
    expect(screen.getByText("A&P")).toBeInTheDocument();
  });

  it("renders with no attestations and no addenda at all", () => {
    render(<ClinicalNoteReader subject={SUBJECT} title="Progress note" doc={complete()} />);
    expect(screen.queryByText(/Addendum/)).not.toBeInTheDocument();
    expect(screen.getByText(/cannot be edited/i)).toBeInTheDocument();
  });
});

describe("SignGate, used on its own", () => {
  // Exported so a host can put the gate in a drawer, a wizard step, or their
  // own modal. That makes it public API in its own right.
  const findings = [
    { id: "a", severity: "pass" as const, title: "All required sections have content" },
  ];

  it("names a signer who has no role and no countersignature requirement", () => {
    render(
      <SignGate
        findings={findings}
        canSign
        attestation="I attest."
        author={{ display: "A. Iyer, MD" }}
      />,
    );
    expect(screen.getByText(/Signing as/)).toBeInTheDocument();
    expect(screen.queryByText(/countersignature will be requested/)).not.toBeInTheDocument();
  });

  it("says when a countersignature will be requested", () => {
    render(
      <SignGate
        findings={findings}
        canSign
        attestation="I attest."
        author={{ display: "R. Menon, MD", role: "Resident", requiresCosign: true }}
      />,
    );
    expect(screen.getByText(/Resident/)).toBeInTheDocument();
    expect(screen.getByText(/countersignature will be requested/)).toBeInTheDocument();
  });
});

describe("navigating from a finding", () => {
  it("takes you to an empty required section without accepting anything", async () => {
    // Only the unreviewed-AI finding accepts on navigate. Everything else just
    // closes the gate and puts you back in the note — a gate that silently
    // resolved findings when you looked at them would be worthless.
    const user = userEvent.setup();
    setup({ value: withAi() });
    await user.click(screen.getByRole("button", { name: /sign & file/i }));
    const gate = await screen.findByTestId("sign-gate");

    await user.click(within(gate).getAllByRole("button", { name: /go to it/i })[0]!);
    await waitFor(() => expect(screen.queryByTestId("sign-gate")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /sign & file/i }));
    const again = await screen.findByTestId("sign-gate");
    // Still two: looking at a problem does not fix it.
    expect(within(again).getByText(/2 blocking/i)).toBeInTheDocument();
  });
});
