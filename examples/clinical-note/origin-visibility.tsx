import { ClinicalNote, mixed, para } from "@/components/zoblocks/clinical-note";
import { SECTIONS } from "@zoblocks/clinical-note-core";
import { AUTHOR, ExampleNotice, NOW, SUBJECT, demoNote } from "./_shared/demo-note";

const PULLED_AT = "2026-08-16T06:12:00+05:30";

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

export default function OriginVisibility() {
  return (
    <div>
      <ExampleNotice>
        The origins describe sample text sources; they do not establish whether a passage is true.
      </ExampleNotice>
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
