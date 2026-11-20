import { Tabs } from "@zoblocks/tabs";

function DocIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
      <path
        d="M5 2.5h6l4 4v11H5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
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

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
      <rect x="4" y="8" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 8V5.5a3 3 0 0 1 6 0V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
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

function HeartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4">
      <path
        d="M10 17s-7-4.3-7-9a3.8 3.8 0 0 1 7-2 3.8 3.8 0 0 1 7 2c0 4.7-7 9-7 9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 10h3l1.5-2.5 2.2 5 1.3-2.5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Summary() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-[#F8FAFC] p-4">
      <strong>Summary</strong> — Problems, allergies, recent encounters.
    </div>
  );
}

function Meds() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-[#F8FAFC] p-4">
      <strong>Medications</strong> — 9 active.
    </div>
  );
}

function Vitals() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-[#F8FAFC] p-4">
      <strong>Vitals</strong> — Cached — last synced 14 minutes ago.
    </div>
  );
}

export default function RestrictedAndStaleExample() {
  return (
    <section className="space-y-4">
      <Tabs
        as="tabs"
        variant="rail"
        orientation="vertical"
        aria-label="Sections"
        defaultValue="summary"
        items={[
          {
            value: "summary",
            label: "Summary",
            icon: <DocIcon />,
            children: <Summary />,
          },
          {
            value: "bh",
            label: "Behavioural health",
            icon: <LockIcon />,
            disabled: true,
            disabledReason:
              "Restricted. Opening it records an access event against your account and notifies the record owner.",
          },
          {
            value: "meds",
            label: "Medications",
            icon: <PillIcon />,
            children: <Meds />,
          },
          {
            value: "vitals",
            label: "Vitals",
            icon: <HeartIcon />,
            availability: "stale",
            children: <Vitals />,
          },
        ]}
      />
    </section>
  );
}
