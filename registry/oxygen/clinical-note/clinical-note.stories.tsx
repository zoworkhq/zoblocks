/**
 * Stories for ClinicalNote.
 *
 * Written once, consumed four ways (ADR 0007): the documentation demos, the
 * visual-regression fixture, the accessibility fixture, and — through play
 * functions — the interaction test.
 *
 * Every document here is built from the engine's own builders, so a story
 * cannot show a state the schema would refuse to hold. The states worth
 * demonstrating are mostly the ones you never want to wait for in real use: a
 * note that is 62% copied forward, a passage a model wrote that nobody has
 * read, a pulled potassium that went stale eight hours ago. Each is one
 * document literal here and an afternoon of setup in a live system.
 *
 * `now` is frozen in every story. The gate compares against it, so a floating
 * clock would make the stale-value story pass one day and fail the next — and
 * the VRT baseline along with it.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, waitFor, within } from "../../../test/story-kit";
import { ClinicalNote, ClinicalNoteReader } from "./clinical-note";
import { mixed, noteDoc, noteSection, para } from "@/lib/oxygen-clinical-note";

/** Frozen. Every relative age in these stories is measured from here. */
const NOW = new Date("2026-08-16T14:38:00+05:30");

const SUBJECT = {
  reference: "Patient/4471902",
  display: "RANDOL, Joshua",
  identifier: "4471902",
  birthDate: "12 Mar 1996",
  detail: "30y M · Bed 4E-12",
};

const RESIDENT = { display: "R. Menon, MD", role: "Resident", requiresCosign: true };

const ATTESTATION =
  "I have reviewed this note in its entirety and attest that it accurately reflects the care I provided.";

const TIMESTAMP = "Created 16 Aug 2026, 14:02 IST (UTC+05:30) · edited 14:38 IST";

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

/** A day-four progress note: mostly yesterday's, with today's edits on top. */
function workingNote() {
  return noteDoc(
    noteSection(
      { code: "10154-3", title: "Chief complaint" },
      para("Admitted for blood transfusion.", "typed"),
    ),
    noteSection(
      { code: "10164-2", title: "History of present illness", required: true },
      mixed(
        [
          "Mr. Randol is a 30-year-old man with type 2 diabetes mellitus who presents with six weeks of progressive fatigue and exertional dyspnea. Symptoms began gradually and have worsened over the past two weeks, now limiting him to one flight of stairs. ",
          "copied",
          { source: "DocumentReference/prior-1" },
        ],
        ["Today he reports the lightheadedness has resolved since the first unit.", "typed"],
      ),
      mixed(
        [
          "He denies overt bleeding — no melena, hematochezia or epistaxis. ",
          "ai",
          { source: "scribe/v2", reviewed: false },
        ],
        [
          "Hemoglobin 7.1 g/dL",
          "pulled",
          { source: "Observation/cbc-1", at: "2026-08-16T06:12:00+05:30" },
        ],
        [", down from 11.8 g/dL in March.", "typed"],
      ),
    ),
    noteSection(
      { code: "10187-3", title: "Review of systems" },
      para(
        "Constitutional — positive for fatigue; denies fever, night sweats or weight loss. Cardiovascular — positive for exertional dyspnea; denies chest pain or edema.",
        "template",
        { source: "phrase/ros" },
      ),
    ),
    noteSection({ code: "51847-2", title: "Assessment and plan", required: true }),
  );
}

/** The same note, finished: nothing blocking, one acknowledged warning left. */
function completeNote() {
  return noteDoc(
    noteSection(
      { code: "10154-3", title: "Chief complaint" },
      para("Admitted for blood transfusion.", "typed"),
    ),
    noteSection(
      { code: "10164-2", title: "History of present illness", required: true },
      para(
        "Six weeks of progressive fatigue and exertional dyspnea, worse over two weeks. Lightheadedness resolved after the first unit.",
        "typed",
      ),
    ),
    noteSection(
      { code: "51847-2", title: "Assessment and plan", required: true },
      para(
        "Symptomatic iron-deficiency anaemia. Transfuse a second unit, repeat CBC in six hours, iron studies sent, GI referral placed.",
        "typed",
      ),
    ),
  );
}

/** A template fired and left three blanks behind. */
function templatedNote() {
  const note = noteDoc(
    noteSection(
      { code: "10164-2", title: "History of present illness", required: true },
      para("Interval history reviewed.", "typed"),
    ),
    noteSection({ code: "51847-2", title: "Assessment and plan", required: true }),
  );
  return note;
}

const meta: Meta<typeof ClinicalNote> = {
  title: "Clinical/ClinicalNote",
  component: ClinicalNote,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof ClinicalNote>;

/* ------------------------------------------------------------------ */
/* Demos                                                               */
/* ------------------------------------------------------------------ */

/**
 * A new note. Every section exists from the first keystroke, so the rail can
 * show the shape of the note — and its gaps — before the clinician reaches the
 * sign button rather than after.
 */
export const EmptyDraft: Story = {
  name: "Empty draft",
  parameters: { state: "Empty draft" },
  args: {
    subject: SUBJECT,
    author: RESIDENT,
    noteType: "progress",
    now: NOW,
    attestation: ATTESTATION,
    timestampLine: TIMESTAMP,
    saveState: { kind: "saved", at: "14:38:02 IST" },
  },
};

/**
 * The working state, and the one the whole component exists for.
 *
 * Two things are true here that no other editor can tell you: 62% of this note
 * describes yesterday, and a passage a model drafted has not been read. Both
 * are computed from the marks rather than estimated, and both are shown before
 * the signature rather than discovered after it.
 */
export const InProgress: Story = {
  name: "In progress",
  parameters: { state: "In progress" },
  args: {
    ...EmptyDraft.args,
    value: workingNote(),
  } as Story["args"],
};

/**
 * "Origins" on.
 *
 * Off by default: this is a review tool, not a reading mode. Each origin
 * carries an underline style as well as a hue, so the distinction survives
 * greyscale, colour-vision deficiency, forced colours and the ward printer.
 */
export const OriginsRibbon: Story = {
  name: "Origins ribbon",
  parameters: { state: "Origins ribbon" },
  args: InProgress.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /where each passage came from/i }));
    await waitFor(() => {
      expect(canvasElement.querySelectorAll(".ox-note-pv").length).toBeGreaterThan(0);
    });
  },
};

/**
 * The gate, blocking.
 *
 * Three severities and only one of them stops you. A gate that blocks on
 * everything is routed around within a week; one that blocks on nothing is
 * decoration. The warnings are counted and handed to `onCommit`, because a
 * signature over a note with acknowledged warnings is a different artifact
 * from one with none.
 */
export const GateBlocking: Story = {
  name: "Gate blocking",
  parameters: { state: "Gate blocking" },
  args: InProgress.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /sign & file/i }));
    const gate = await canvas.findByTestId("sign-gate");
    // The assessment is empty and a model's paragraph is unread. Both block.
    await waitFor(() => {
      expect(within(gate).getAllByText(/Blocks/i).length).toBeGreaterThanOrEqual(2);
    });
    expect(within(gate).getByRole("button", { name: "Sign" })).toBeDisabled();
  },
};

/**
 * The gate, clear.
 *
 * Every required section has content, nothing is unread, nothing is copied
 * beyond the threshold. The attestation still has to be ticked — the wording
 * is the deployment's, because it is a legal decision rather than ours.
 */
export const GateClear: Story = {
  name: "Gate clear",
  parameters: { state: "Gate clear" },
  args: {
    ...EmptyDraft.args,
    value: completeNote(),
  } as Story["args"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /sign & file/i }));
    const gate = await canvas.findByTestId("sign-gate");
    expect(within(gate).getByText(/0 blocking/i)).toBeInTheDocument();

    // Disabled until attested, then enabled. The checkbox is the whole point.
    const sign = within(gate).getByRole("button", { name: "Sign" });
    expect(sign).toBeDisabled();
    await userEvent.click(within(gate).getByRole("checkbox"));
    await waitFor(() => expect(sign).toBeEnabled());
  },
};

/**
 * A pulled value that has gone stale.
 *
 * "8h 26m old" is the fact a reader needs and the fact the gate acts on. A
 * number with no timestamp is an assertion; a number with one is evidence.
 */
export const StalePulledValue: Story = {
  name: "Stale pulled value",
  parameters: { state: "Stale pulled value" },
  args: {
    ...EmptyDraft.args,
    value: workingNote(),
    gateOptions: { maxPullAgeMs: 4 * 60 * 60 * 1000 },
  } as Story["args"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /sign & file/i }));
    const gate = await canvas.findByTestId("sign-gate");
    await waitFor(() => {
      expect(within(gate).getByText(/retrieved more than/i)).toBeInTheDocument();
    });
  },
};

/**
 * Offline.
 *
 * Four honest save states — saved, saving, offline, failed — and never a
 * silent spinner. A clinician interrupted mid-sentence by a code needs to know
 * whether the last twelve minutes exist anywhere. A failed save announces
 * assertively, because an unheard save failure is lost work.
 */
export const OfflineDraft: Story = {
  name: "Offline draft",
  parameters: { state: "Offline draft" },
  args: {
    ...EmptyDraft.args,
    value: workingNote(),
    saveState: { kind: "offline", pending: 42 },
  } as Story["args"],
};

export const SaveFailed: Story = {
  name: "Save failed",
  parameters: { state: "Save failed" },
  args: {
    ...EmptyDraft.args,
    value: workingNote(),
    saveState: { kind: "failed", reason: "the server rejected the draft" },
  } as Story["args"],
};

/**
 * A signed note with an addendum.
 *
 * The original is not shown as corrected — it is shown as superseded. Both
 * statements stand, in order, with their own authors and times. That is the
 * difference between a record and a document, and it is what a patient's right
 * to amend under 45 CFR 164.526 actually requires.
 *
 * This path loads no editor at all: most people who open a note never edit one.
 */
export const SignedWithAddendum: Story = {
  name: "Signed with addendum",
  parameters: { state: "Signed with addendum" },
  args: EmptyDraft.args,
  render: () => (
    <ClinicalNoteReader
      subject={SUBJECT}
      title="Progress note"
      doc={completeNote()}
      attestations={[
        {
          who: "Rohit Menon, MD",
          role: "Resident, Internal Medicine",
          when: "16 Aug 2026, 14:41:07 IST (UTC+05:30)",
        },
        {
          who: "Anjali Iyer, MD",
          role: "Attending, Internal Medicine",
          when: "16 Aug 2026, 18:02:55 IST (UTC+05:30)",
          statement:
            "I have reviewed the note and the patient, and agree with the findings and plan.",
        },
      ]}
      addenda={[
        {
          author: "Anjali Iyer, MD",
          when: "19 Aug 2026, 09:14 IST",
          text: "Bone marrow biopsy performed 18 Aug returned consistent with iron deficiency; the assessment of anaemia of chronic disease documented above is superseded. Iron studies and GI referral ordered.",
        },
      ]}
    />
  ),
};

/**
 * An H&P, which requires a physical examination where a progress note does not.
 *
 * This is the schema doing clinical work: the required-section set is a
 * property of the note type, so an H&P without an exam refuses to sign and a
 * progress note without one signs happily.
 */
export const HistoryAndPhysical: Story = {
  name: "History and physical",
  parameters: { state: "In progress" },
  args: {
    ...EmptyDraft.args,
    noteType: "historyAndPhysical",
    author: { display: "A. Iyer, MD", role: "Attending" },
  } as Story["args"],
};

/**
 * Read-only, mid-edit — what a reviewer sees while someone else holds the note.
 */
export const ReadOnly: Story = {
  name: "Read only",
  parameters: { state: "In progress" },
  args: {
    ...EmptyDraft.args,
    value: workingNote(),
    readOnly: true,
  } as Story["args"],
};

/**
 * Unfilled blanks.
 *
 * A signed note containing `***` is unambiguous evidence the template was
 * inserted and never read, so it blocks. F2 walks them, which is the muscle
 * memory every SmartList has trained.
 */
export const UnfilledBlanks: Story = {
  name: "Unfilled blanks",
  parameters: { state: "Unfilled blanks" },
  args: {
    ...EmptyDraft.args,
    value: templatedNote(),
    phrases: [
      {
        id: "ap",
        label: "Assessment and plan",
        description: "Three blanks",
        body: "Assessment: ***diagnosis***. Plan: ***intervention***, follow up in ***interval***.",
      },
    ],
  } as Story["args"],
};

/**
 * Unreviewed AI, on its own.
 *
 * The state the component exists for. A model drafted a paragraph; nobody has
 * read it; the signature is blocked until someone does. CMS's July 2025
 * guidance makes the clinician accountable for every word regardless of who
 * typed it, which makes this gate the only mechanical protection the signer
 * has — and turns "I reviewed it" from an unfalsifiable claim into a check.
 */
export const UnreviewedAi: Story = {
  name: "Unreviewed AI",
  parameters: { state: "Unreviewed AI" },
  args: {
    ...EmptyDraft.args,
    value: noteDoc(
      noteSection(
        { code: "10164-2", title: "History of present illness", required: true },
        para(
          "Patient reports three days of productive cough and subjective fever. No dyspnoea at rest.",
          "ai",
          { source: "scribe/v2", reviewed: false },
        ),
      ),
      noteSection(
        { code: "51847-2", title: "Assessment and plan", required: true },
        para("Community-acquired pneumonia. Start amoxicillin.", "typed"),
      ),
    ),
  } as Story["args"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByText(/AI-drafted passage has not been reviewed/i)).toBeInTheDocument();
    });
  },
};

/**
 * Copy-forward, measured rather than estimated.
 *
 * A 2022 analysis of over 100 million notes found 50.1% of note text
 * duplicated from prior documentation on the same patient. Those numbers came
 * from someone auditing a corpus afterwards; here the note measures itself, at
 * the moment of signing, while the author can still do something about it.
 */
export const CopiedForward: Story = {
  name: "Copied forward",
  parameters: { state: "Copied forward" },
  args: {
    ...EmptyDraft.args,
    value: noteDoc(
      noteSection(
        { code: "10164-2", title: "History of present illness", required: true },
        mixed(
          [
            "Day 4 of admission for symptomatic anaemia. Mr. Randol is a 30-year-old man with type 2 diabetes who presented with six weeks of progressive fatigue and exertional dyspnea, limiting him to one flight of stairs. He denied melena, hematochezia and epistaxis on admission. ",
            "copied",
            { source: "DocumentReference/day-3" },
          ],
          ["Two units given overnight; he reports feeling steadier this morning.", "typed"],
        ),
      ),
      noteSection(
        { code: "51847-2", title: "Assessment and plan", required: true },
        para("Repeat CBC this afternoon. Iron studies pending.", "typed"),
      ),
    ),
  } as Story["args"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByText(/% copied forward/i)).toBeInTheDocument();
    });
  },
};

/**
 * A signed note with no addendum — the ordinary case.
 */
export const Signed: Story = {
  name: "Signed",
  parameters: { state: "Signed" },
  args: EmptyDraft.args,
  render: () => (
    <ClinicalNoteReader
      subject={SUBJECT}
      title="Progress note"
      doc={completeNote()}
      attestations={[
        {
          who: "Rohit Menon, MD",
          role: "Resident, Internal Medicine",
          when: "16 Aug 2026, 14:41:07 IST (UTC+05:30)",
        },
      ]}
    />
  ),
};

/**
 * Written by a resident, awaiting an attending's countersignature.
 *
 * Two signatures, two times, two actors, in order — and the second one is not
 * an edit of the first. In teaching settings this is the norm rather than the
 * exception, and an editor that cannot express it cannot be used on a ward.
 */
export const AwaitingCountersignature: Story = {
  name: "Awaiting countersignature",
  parameters: { state: "Awaiting countersignature" },
  args: EmptyDraft.args,
  render: () => (
    <ClinicalNoteReader
      subject={SUBJECT}
      title="Progress note"
      doc={completeNote()}
      attestations={[
        {
          who: "Rohit Menon, MD",
          role: "Resident, Internal Medicine",
          when: "16 Aug 2026, 14:41:07 IST (UTC+05:30)",
        },
        {
          who: "Anjali Iyer, MD",
          role: "Attending — countersignature requested 14:41 IST",
          when: "Pending",
        },
      ]}
    />
  ),
};
