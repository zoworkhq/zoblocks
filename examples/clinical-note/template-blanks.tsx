import { ClinicalNote, para } from "@/components/zoblocks/clinical-note";
import { expand, SECTIONS } from "@zoblocks/clinical-note-core";
import type { Node as PMNode } from "prosemirror-model";
import { AUTHOR, ExampleNotice, NOW, SUBJECT, demoNote } from "./_shared/demo-note";

// Core wildcard expansion: each ***…*** becomes a blank the editor can jump to.
const expansion = expand("Fictional placeholder ***sample***", {
  provenance: { origin: "template", source: "Phrase/DEMO" },
});
const blankParagraphs: PMNode[] = [];
expansion.content.forEach((node) => blankParagraphs.push(node));

const TEMPLATE_NOTE = demoNote("progress", {
  [SECTIONS.hpi.code]: blankParagraphs,
  [SECTIONS.assessmentAndPlan.code]: [
    para("Fictional placeholder text for interface demonstration only."),
  ],
});

export default function TemplateBlanks() {
  return (
    <div>
      <ExampleNotice>
        F2 and the visible next-blank control navigate between wildcard blanks; they do not fill
        them. The phrases prop is not a phrase picker.
      </ExampleNotice>
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
