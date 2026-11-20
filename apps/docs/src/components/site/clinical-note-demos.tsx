"use client";

import * as React from "react";
import {
  ClinicalNote,
  mixed,
  noteDoc,
  noteSection,
  para,
} from "@/registry/zoblocks/clinical-note/clinical-note";
import { expand, NOTE_TYPES, SECTIONS, type NoteTypeName } from "@zoblocks/clinical-note-core";
import type { Node as PMNode } from "prosemirror-model";

const NOW = new Date("2026-08-16T14:38:00+05:30");
const PULLED_AT = "2026-08-16T06:12:00+05:30";
const SUBJECT = {
  reference: "Patient/DEMO-001",
  display: "FICTIONAL SAMPLE",
  identifier: "DEMO-001",
  detail: "Synthetic demo record",
};
const AUTHOR = { display: "Example Author", role: "Demonstration only" };
const NOTICE =
  "Fictional synthetic content for interface demonstration only; not clinical advice or a clinically validated workflow.";

function ExampleNotice() {
  return <p className="mb-3 text-xs text-graphite-soft">{NOTICE}</p>;
}

function demoNote(noteType: NoteTypeName, content: Record<string, ReturnType<typeof para>[]> = {}) {
  return noteDoc(
    ...NOTE_TYPES[noteType].sections.map((section) =>
      noteSection(
        { code: section.code, title: section.title, required: section.required },
        ...(content[section.code] ?? []),
      ),
    ),
  );
}

function completeProgress() {
  return demoNote("progress", {
    [SECTIONS.hpi.code]: [para("Fictional placeholder text for interface demonstration only.")],
    [SECTIONS.assessmentAndPlan.code]: [
      para("Fictional placeholder text for interface demonstration only."),
    ],
  });
}

const PROVENANCE_NOTE = demoNote("progress", {
  [SECTIONS.hpi.code]: [
    mixed(
      ["Fictional placeholder text ", "typed"],
      ["with a dictated sample range ", "dictated", { confidence: 0.96 }],
      ["and a pulled sample range ", "pulled", { source: "Observation/DEMO-001", at: PULLED_AT }],
      ["plus copied sample text", "copied", { source: "Composition/DEMO-PRIOR" }],
    ),
  ],
  [SECTIONS.assessmentAndPlan.code]: [
    para("Fictional placeholder text for interface demonstration only."),
  ],
});

const TEMPLATE_EXPANSION = expand("Fictional placeholder ***sample***", {
  provenance: { origin: "template", source: "Phrase/DEMO" },
});
const TEMPLATE_PARAGRAPHS: PMNode[] = [];
TEMPLATE_EXPANSION.content.forEach((node) => TEMPLATE_PARAGRAPHS.push(node));
const TEMPLATE_NOTE = demoNote("progress", {
  [SECTIONS.hpi.code]: TEMPLATE_PARAGRAPHS,
  [SECTIONS.assessmentAndPlan.code]: [
    para("Fictional placeholder text for interface demonstration only."),
  ],
});

const READER_NOTE = completeProgress();
const READER_ATTESTATIONS = [
  {
    who: "Example Author",
    role: "Demonstration only",
    when: "16 Aug 2026, 14:38 IST (UTC+05:30)",
    statement: "Illustrative supplied attestation text.",
  },
];
const READER_ADDENDA = [
  {
    author: "Example Author",
    when: "16 Aug 2026, 14:42 IST (UTC+05:30)",
    text: "Fictional addendum text for interface demonstration only.",
  },
];

export function EmptyProgressDraft() {
  return (
    <div>
      <ExampleNotice />
      <ClinicalNote subject={SUBJECT} author={AUTHOR} noteType="progress" now={NOW} />
    </div>
  );
}

export function OriginVisibility() {
  return (
    <div>
      <ExampleNotice />
      <p className="mb-3 text-xs text-graphite-soft">
        The origins describe sample text sources; they do not establish whether a passage is true.
      </p>
      <ClinicalNote
        subject={SUBJECT}
        author={AUTHOR}
        noteType="progress"
        value={PROVENANCE_NOTE}
        now={NOW}
      />
    </div>
  );
}

export function WhatBlocksSigning() {
  const [complete, setComplete] = React.useState(false);
  const [callbackArgs, setCallbackArgs] = React.useState<unknown>();
  return (
    <div>
      <ExampleNotice />
      <p className="mb-3 text-xs text-graphite-soft">
        No note is persisted or cryptographically signed. The panel shows callback arguments only.
      </p>
      <button
        type="button"
        className="mb-3 rounded-md border border-rule px-3 py-1.5 text-sm text-ink"
        onClick={() => setComplete((current) => !current)}
      >
        {complete ? "Show empty draft" : "Show schema-complete draft"}
      </button>
      <ClinicalNote
        key={complete ? "complete" : "empty"}
        subject={SUBJECT}
        author={AUTHOR}
        noteType="progress"
        value={complete ? completeProgress() : undefined}
        now={NOW}
        attestation="I reviewed this fictional example for interface demonstration."
        onCommit={(kind, doc, acknowledged) =>
          setCallbackArgs({ kind, doc: doc.toJSON(), acknowledged })
        }
      />
      <pre
        className="mt-3 overflow-auto rounded-md border border-rule bg-paper p-3 text-xs text-ink"
        aria-live="polite"
      >
        {callbackArgs === undefined
          ? "No callback received yet."
          : JSON.stringify(callbackArgs, null, 2)}
      </pre>
    </div>
  );
}

export function TemplateBlanks() {
  return (
    <div>
      <ExampleNotice />
      <p className="mb-3 text-xs text-graphite-soft">
        F2 and the visible next-blank control navigate between wildcard blanks; they do not fill
        them. The phrases prop is not a phrase picker.
      </p>
      <ClinicalNote
        subject={SUBJECT}
        author={AUTHOR}
        noteType="progress"
        value={TEMPLATE_NOTE}
        now={NOW}
      />
    </div>
  );
}

export function SignedReader() {
  return (
    <div>
      <ExampleNotice />
      <p className="mb-3 text-xs text-graphite-soft">
        Attestations and addenda are supplied display data; the reader does not verify signatures or
        create legal supersession.
      </p>
      <ClinicalNote.Reader
        subject={SUBJECT}
        title="Illustrative progress note"
        doc={READER_NOTE}
        attestations={READER_ATTESTATIONS}
        addenda={READER_ADDENDA}
      />
    </div>
  );
}
