import { Tabs } from "@zoblocks/tabs";

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

function FlaskIcon() {
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
      <path d="M9 3h6M10 3v7l-5.5 9.2A1.8 1.8 0 0 0 6 22h12a1.8 1.8 0 0 0 1.5-2.8L14 10V3" />
      <path d="M8 16h8" />
    </svg>
  );
}

function ImageIcon() {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
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

export default function PillFiltersExample() {
  return (
    <section className="space-y-4">
      <Tabs
        as="radiogroup"
        variant="pill"
        overflow="wrap"
        aria-label="Filter documents by type"
        defaultValue="all"
        items={[
          {
            value: "all",
            label: "Everything",
            count: 241,
          },
          {
            value: "referrals",
            label: "Referrals",
            icon: <DocIcon />,
            count: 38,
          },
          {
            value: "labs",
            label: "Lab reports",
            icon: <FlaskIcon />,
            count: 96,
          },
          {
            value: "imaging",
            label: "Imaging",
            icon: <ImageIcon />,
            count: 22,
          },
          {
            value: "consent",
            label: "Consent forms",
            icon: <ShieldIcon />,
            count: 14,
          },
          {
            value: "letters",
            label: "Correspondence",
            icon: <MailIcon />,
            count: 71,
          },
        ]}
      />
    </section>
  );
}
