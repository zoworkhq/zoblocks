import { Tabs } from "@zoblocks/tabs";

function DocIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
      <path
        d="M5 2.5h6l4 4v11H5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M11 2.5v4h4M7 10h6M7 13h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
      <path
        d="M10 17s-7-4.3-7-9a3.8 3.8 0 0 1 7-2 3.8 3.8 0 0 1 7 2c0 4.7-7 9-7 9Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4.5 10h3L9 7.5l2.2 5 1.3-2.5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
      <path
        d="M7 2.5h6M8 2.5v5l-4.5 7.2A1.8 1.8 0 0 0 5 17.5h10a1.8 1.8 0 0 0 1.5-2.8L12 7.5v-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 12h7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PillIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
      <path
        d="M6.1 13.9a4 4 0 0 1 0-5.7l2.1-2.1a4 4 0 0 1 5.7 5.7l-2.1 2.1a4 4 0 0 1-5.7 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="m8.2 8.2 5.7 5.7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
      <path
        d="M5 2.5h10v15H5zM7.5 6h5M7.5 9h5M7.5 12h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
      {children}
    </div>
  );
}

export default function SeverityInStripExample() {
  return (
    <section className="space-y-4">
      <Tabs
        as="tabs"
        variant="underline"
        aria-label="Chart sections"
        defaultValue="summary"
        items={[
          {
            value: "summary",
            label: "Summary",
            icon: <DocIcon />,
            children: (
              <Panel>
                <strong>Summary</strong> — Problems, allergies, recent encounters.
              </Panel>
            ),
          },
          {
            value: "vitals",
            label: "Vitals",
            icon: <HeartIcon />,
            children: (
              <Panel>
                <strong>Vitals</strong> — Latest observations recorded.
              </Panel>
            ),
          },
          {
            value: "labs",
            label: "Labs",
            icon: <FlaskIcon />,
            count: 2,
            tone: "critical",
            children: (
              <div className="space-y-3">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="font-semibold text-red-800">2 critical results, unacknowledged.</p>

                  <p className="mt-2 text-sm leading-relaxed text-red-700">
                    Potassium 6.4 mmol/L (ref 3.5–5.1) · Troponin I 0.94 ng/mL (ref &lt;0.04)
                  </p>
                </div>
                <Panel>
                  <strong>Labs</strong> — 2 critical results.
                </Panel>
              </div>
            ),
          },
          {
            value: "meds",
            label: "Medications",
            icon: <PillIcon />,
            count: 9,
            children: (
              <Panel>
                <strong>Medications</strong> — 9 active.
              </Panel>
            ),
          },
          {
            value: "notes",
            label: "Notes",
            icon: <NoteIcon />,
            children: (
              <Panel>
                <strong>Notes</strong> — Recent clinical notes.
              </Panel>
            ),
          },
        ]}
      />
    </section>
  );
}
