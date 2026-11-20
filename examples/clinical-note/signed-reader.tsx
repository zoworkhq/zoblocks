import { ClinicalNote, para } from "@/components/zoblocks/clinical-note";
import { SECTIONS } from "@zoblocks/clinical-note-core";
import { ExampleNotice, SUBJECT, demoNote } from "./_shared/demo-note";

const READER_NOTE = demoNote("progress", {
  [SECTIONS.hpi.code]: [para("Fictional placeholder text for interface demonstration only.")],
  [SECTIONS.assessmentAndPlan.code]: [
    para("Fictional placeholder text for interface demonstration only."),
  ],
});

const ATTESTATIONS = [
  {
    who: "Example Author",
    role: "Demonstration only",
    when: "16 Aug 2026, 14:38 IST (UTC+05:30)",
    statement: "Illustrative supplied attestation text.",
  },
];

const ADDENDA = [
  {
    author: "Example Author",
    when: "16 Aug 2026, 14:42 IST (UTC+05:30)",
    text: "Fictional addendum text for interface demonstration only.",
  },
];

export default function SignedReader() {
  return (
    <div>
      <ExampleNotice>
        Attestations and addenda are supplied display data; the reader does not verify signatures or
        create legal supersession.
      </ExampleNotice>
      <ClinicalNote.Reader
        subject={SUBJECT}
        title="Illustrative progress note"
        doc={READER_NOTE}
        attestations={ATTESTATIONS}
        addenda={ADDENDA}
      />
    </div>
  );
}
