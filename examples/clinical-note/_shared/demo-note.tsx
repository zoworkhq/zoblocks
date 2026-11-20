import type { ReactNode } from "react";
import { noteDoc, noteSection } from "@/components/zoblocks/clinical-note";
import { NOTE_TYPES, type NoteTypeName } from "@zoblocks/clinical-note-core";
import type { Node as PMNode } from "prosemirror-model";

/** Fixed clock so every render shows the same timestamps. */
export const NOW = new Date("2026-08-16T14:38:00+05:30");

export const SUBJECT = {
  reference: "Patient/DEMO-001",
  display: "FICTIONAL SAMPLE",
  identifier: "DEMO-001",
  detail: "Synthetic demo record",
};

export const AUTHOR = { display: "Example Author", role: "Demonstration only" };

const NOTICE =
  "Fictional synthetic content for interface demonstration only; not clinical advice or a clinically validated workflow.";

/** The fictional-data notice, plus an optional line about what the example does not do. */
export function ExampleNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-3 grid gap-1 text-xs text-[var(--zb-text-muted)]">
      <p>{NOTICE}</p>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

/** Every section of a note type, in order, with the given content keyed by LOINC section code. */
export function demoNote(noteType: NoteTypeName, content: Record<string, PMNode[]> = {}) {
  return noteDoc(
    ...NOTE_TYPES[noteType].sections.map((section) =>
      noteSection(
        { code: section.code, title: section.title, required: section.required },
        ...(content[section.code] ?? []),
      ),
    ),
  );
}
