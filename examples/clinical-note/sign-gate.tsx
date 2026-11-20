import * as React from "react";
import { ClinicalNote, para } from "@/components/zoblocks/clinical-note";
import { SECTIONS } from "@zoblocks/clinical-note-core";
import { AUTHOR, ExampleNotice, NOW, SUBJECT, demoNote } from "./_shared/demo-note";

const COMPLETE_PROGRESS = demoNote("progress", {
  [SECTIONS.hpi.code]: [para("Fictional placeholder text for interface demonstration only.")],
  [SECTIONS.assessmentAndPlan.code]: [
    para("Fictional placeholder text for interface demonstration only."),
  ],
});

export default function WhatBlocksSigning() {
  const [complete, setComplete] = React.useState(false);
  const [callbackArgs, setCallbackArgs] = React.useState<unknown>();
  return (
    <div>
      <ExampleNotice>
        No note is persisted or cryptographically signed. The panel shows callback arguments only.
      </ExampleNotice>
      <button
        type="button"
        className="mb-3 rounded-md border border-[var(--zb-border)] px-3 py-1.5 text-sm text-[var(--zb-text)]"
        onClick={() => setComplete((current) => !current)}
      >
        {complete ? "Show empty draft" : "Show schema-complete draft"}
      </button>
      <ClinicalNote
        key={complete ? "complete" : "empty"}
        subject={SUBJECT}
        author={AUTHOR}
        noteType="progress"
        value={complete ? COMPLETE_PROGRESS : undefined}
        now={NOW}
        attestation="I reviewed this fictional example for interface demonstration."
        onCommit={(kind, doc, acknowledged) =>
          setCallbackArgs({ kind, doc: doc.toJSON(), acknowledged })
        }
      />
      <pre
        className="mt-3 overflow-auto rounded-md border border-[var(--zb-border)] bg-[var(--zb-surface)] p-3 text-xs text-[var(--zb-text)]"
        aria-live="polite"
      >
        {callbackArgs === undefined
          ? "No callback received yet."
          : JSON.stringify(callbackArgs, null, 2)}
      </pre>
    </div>
  );
}
