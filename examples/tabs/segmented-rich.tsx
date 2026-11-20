import { Tabs } from "@zoblocks/tabs";

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </svg>
  );
}

function Inbox({ filter }: { filter: string }) {
  const messages: Record<string, React.ReactNode> = {
    all: (
      <>
        <strong>All</strong> — 128 messages.
      </>
    ),
    unread: (
      <>
        <strong>Unread</strong> — 12 messages.
      </>
    ),
    action: (
      <>
        <strong>Needs action</strong> — 3 awaiting your response.
      </>
    ),
  };

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-[#F8FAFC] p-4">
      <p className="text-sm">{messages[filter]}</p>
    </div>
  );
}

export default function SegmentedIconsCountsExample() {
  return (
    <section className="space-y-4">
      <Tabs
        as="tabs"
        variant="segmented"
        aria-label="Inbox filter"
        defaultValue="all"
        items={[
          {
            value: "all",
            label: "All",
            icon: <MailIcon />,
            count: 128,
            children: <Inbox filter="all" />,
          },
          {
            value: "unread",
            label: "Unread",
            icon: <BellIcon />,
            count: 12,
            children: <Inbox filter="unread" />,
          },
          {
            value: "action",
            label: "Needs action",
            icon: <ShieldIcon />,
            count: 3,
            tone: "high",
            children: <Inbox filter="action" />,
          },
          {
            value: "archive",
            label: "Archive",
            icon: <DocIcon />,
            disabled: true,
            disabledReason: "Archive is disabled for this mailbox",
          },
        ]}
      />
    </section>
  );
}
