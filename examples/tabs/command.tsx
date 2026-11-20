import { Tabs } from "@zoblocks/tabs";

function ListIcon() {
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
      <path d="M9 6h12M9 12h12M9 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}

function BoardIcon() {
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
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="10" y="4" width="5" height="10" rx="1" />
      <rect x="17" y="4" width="4" height="13" rx="1" />
    </svg>
  );
}

function CalendarIcon() {
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
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

export default function CommandVariantExample() {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          as="radiogroup"
          variant="command"
          aria-label="Layout"
          defaultValue="list"
          items={[
            {
              value: "list",
              label: <ListIcon />,
              textLabel: "List view",
            },
            {
              value: "grid",
              label: <GridIcon />,
              textLabel: "Grid view",
            },
            {
              value: "board",
              label: <BoardIcon />,
              textLabel: "Board view",
            },
            {
              value: "calendar",
              label: <CalendarIcon />,
              textLabel: "Calendar view",
            },
          ]}
        />

        <Tabs
          as="radiogroup"
          variant="command"
          size="sm"
          aria-label="Density"
          defaultValue="compact"
          items={[
            {
              value: "comfy",
              label: "Comfy",
            },
            {
              value: "compact",
              label: "Compact",
            },
          ]}
        />
      </div>
    </section>
  );
}
