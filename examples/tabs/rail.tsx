import { Tabs } from "@zoblocks/tabs";

function UsersIcon() {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
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

function LockIcon() {
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
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CogIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2Z" />
    </svg>
  );
}

function SettingsPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-[#F8FAFC] p-4">
      <p className="text-sm">{children}</p>
    </div>
  );
}

function Profile() {
  return (
    <SettingsPanel>
      <strong>Profile</strong> — Manage your name, email address, and workspace details.
    </SettingsPanel>
  );
}

function Notifications() {
  return (
    <SettingsPanel>
      <strong>Notifications</strong> — 4 notification preferences need your attention.
    </SettingsPanel>
  );
}

function Security() {
  return (
    <SettingsPanel>
      <strong>Security</strong> — Manage password, authentication, and account security settings.
    </SettingsPanel>
  );
}

function Members() {
  return (
    <SettingsPanel>
      <strong>Members</strong> — 32 members in this workspace.
    </SettingsPanel>
  );
}

export default function RailVariantExample() {
  return (
    <section className="space-y-4">
      <Tabs
        as="tabs"
        variant="rail"
        orientation="vertical"
        aria-label="Settings"
        defaultValue="profile"
        items={[
          {
            value: "profile",
            label: "Profile",
            icon: <UsersIcon />,
            children: <Profile />,
          },
          {
            value: "notifications",
            label: "Notifications",
            icon: <BellIcon />,
            count: 4,
            children: <Notifications />,
          },
          {
            value: "security",
            label: "Security",
            icon: <LockIcon />,
            children: <Security />,
          },
          {
            value: "members",
            label: "Members",
            icon: <UsersIcon />,
            count: 32,
            children: <Members />,
          },
          {
            value: "api",
            label: "API keys",
            icon: <CogIcon />,
            disabled: true,
            disabledReason: "Not enabled for this workspace",
          },
        ]}
      />
    </section>
  );
}
