"use client";

/**
 * The Tabs demos, live — the previews behind the examples on the Tabs page.
 *
 * Every one is the real package: click it, arrow through it, read the
 * announced names in a screen reader. They used to sit in a chaptered gallery
 * of their own; each is now the preview of a documented example, beside the
 * code that produces it, which is where a reader comparing the two needs it.
 */

import * as React from "react";
import { Tabs, type TabVariant } from "@zoblocks/tabs";
import { allergyList, medicationList, observationPanel } from "@zoblocks/fixtures";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Icons — inline so the gallery carries no icon dependency.           */
/* ------------------------------------------------------------------ */

type IconName =
  | "doc"
  | "heart"
  | "flask"
  | "pill"
  | "note"
  | "image"
  | "lock"
  | "users"
  | "bell"
  | "cog"
  | "list"
  | "grid"
  | "board"
  | "calendar"
  | "shield"
  | "mail"
  | "check";

const PATHS: Record<IconName, React.ReactNode> = {
  doc: <path d="M6 3h8.5L19 7.5V21H6zM14 3v5h5M9 13h6M9 17h4" />,
  heart: (
    <path d="M12 20.2S3.6 15.3 3.6 9.4A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8.4 2.1c0 5.9-8.4 10.8-8.4 10.8Z" />
  ),
  flask: (
    <path d="M9.5 3v6.2L4.6 17a2.4 2.4 0 0 0 2 3.7h10.8a2.4 2.4 0 0 0 2-3.7l-4.9-7.8V3M8 3h8M6.6 14h10.8" />
  ),
  pill: (
    <>
      <rect x="2.6" y="8.2" width="18.8" height="7.6" rx="3.8" transform="rotate(-45 12 12)" />
      <path d="m8.7 8.7 6.6 6.6" />
    </>
  ),
  note: <path d="M6 3h8.5L19 7.5V21H6zM9 13h6M9 17h4" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.4" />
      <circle cx="8.6" cy="9.4" r="1.6" />
      <path d="m3.6 17.4 4.6-4.3 3.4 3.1 3.5-3.4 5.3 5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.2" />
      <path d="M8 10V7.4a4 4 0 0 1 8 0V10" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.1" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.4a3.1 3.1 0 0 1 0 5.6M17.5 14.2A6.5 6.5 0 0 1 21.5 20" />
    </>
  ),
  bell: (
    <path d="M6 9.4a6 6 0 0 1 12 0c0 4.6 1.6 6.1 1.6 6.1H4.4S6 14 6 9.4ZM10 19a2.2 2.2 0 0 0 4 0" />
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.6v2.6M12 18.8v2.6M4.4 12H1.8M22.2 12h-2.6M6.6 6.6 4.8 4.8M19.2 19.2l-1.8-1.8M17.4 6.6l1.8-1.8M4.8 19.2l1.8-1.8" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </>
  ),
  board: (
    <>
      <rect x="3" y="3" width="5" height="18" rx="1.6" />
      <rect x="9.5" y="3" width="5" height="12" rx="1.6" />
      <rect x="16" y="3" width="5" height="15" rx="1.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.4" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  shield: (
    <path d="M12 2.8 20 6v5.6c0 5-3.4 8.6-8 9.6-4.6-1-8-4.6-8-9.6V6zm-3 9.2 2.2 2.2L15.4 10" />
  ),
  mail: (
    <>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.4" />
      <path d="m3.4 7 8.6 6 8.6-6" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" strokeWidth={2.2} />,
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Stage furniture                                                      */
/* ------------------------------------------------------------------ */

function Panel({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="zb-demo-panel">
      <b>{title}</b>
      {children ? <span> — {children}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Individual demos                                                     */
/* ------------------------------------------------------------------ */

/** The control from the original screenshot, rebuilt. */
export function Flagship() {
  return (
    <div className="mx-auto w-full max-w-[520px]">
      <Tabs
        as="tabs"
        variant="segmented"
        fill="equal"
        aria-label="Document scope"
        defaultValue="personal"
        items={[
          {
            value: "personal",
            label: "Personal",
            children: <Panel title="Personal">14 documents only you can see.</Panel>,
          },
          {
            value: "shared",
            label: "Shared",
            children: <Panel title="Shared">6 documents shared with your care team.</Panel>,
          },
        ]}
      />
    </div>
  );
}

export function RichSegmented() {
  return (
    <Tabs
      as="tabs"
      variant="segmented"
      aria-label="Inbox filter"
      defaultValue="all"
      items={[
        {
          value: "all",
          label: "All",
          icon: <Icon name="mail" />,
          count: 128,
          children: <Panel title="All">128 messages.</Panel>,
        },
        {
          value: "unread",
          label: "Unread",
          icon: <Icon name="bell" />,
          count: 12,
          children: <Panel title="Unread">12 messages.</Panel>,
        },
        {
          value: "action",
          label: "Needs action",
          icon: <Icon name="shield" />,
          count: 3,
          tone: "high",
          children: <Panel title="Needs action">3 awaiting your response.</Panel>,
        },
        {
          value: "archive",
          label: "Archive",
          icon: <Icon name="doc" />,
          disabled: true,
          disabledReason: "Archive is disabled for this mailbox",
        },
      ]}
    />
  );
}

export function Underline() {
  return (
    <Tabs
      as="tabs"
      variant="underline"
      aria-label="Order"
      defaultValue="summary"
      items={[
        {
          value: "summary",
          label: "Summary",
          children: <Panel title="Summary">Order #4471, placed 12 Aug.</Panel>,
        },
        {
          value: "lines",
          label: "Line items",
          count: 24,
          children: <Panel title="Line items">24 rows.</Panel>,
        },
        {
          value: "ship",
          label: "Shipments",
          count: 3,
          children: <Panel title="Shipments">3 in transit.</Panel>,
        },
        {
          value: "returns",
          label: "Returns",
          count: 1,
          tone: "high",
          children: <Panel title="Returns">1 open RMA.</Panel>,
        },
        { value: "invoices", label: "Invoices", children: <Panel title="Invoices" /> },
        { value: "audit", label: "Audit log", children: <Panel title="Audit log" /> },
      ]}
    />
  );
}

/** The chart header: the composition tabs are most often part of. */
export function ChartHeader() {
  return (
    <div className="zb-chart">
      <div className="zb-chart__head">
        <div>
          <div className="zb-chart__name">Ravi Menon</div>
          <div className="zb-chart__mrn">MRN 88-2049 · 47 y · DOB 1979-02-11</div>
        </div>
        <div className="zb-chart__actions">
          <button type="button" className="zb-demo-btn">
            Share
          </button>
          <button type="button" className="zb-demo-btn zb-demo-btn--primary">
            New note
          </button>
        </div>
      </div>
      <Tabs
        as="tabs"
        variant="underline"
        aria-label="Chart sections"
        defaultValue="summary"
        items={[
          {
            value: "summary",
            label: "Summary",
            icon: <Icon name="doc" />,
            children: <Panel title="Summary">Problems, allergies, recent encounters.</Panel>,
          },
          {
            value: "vitals",
            label: "Vitals",
            icon: <Icon name="heart" />,
            children: <Panel title="Vitals">BP 128/82 · HR 74 · SpO₂ 97 %.</Panel>,
          },
          {
            value: "labs",
            label: "Labs",
            icon: <Icon name="flask" />,
            count: 2,
            tone: "critical",
            children: (
              <>
                <div className="zb-alert zb-alert--critical" role="alert">
                  <strong>2 critical results, unacknowledged.</strong> Potassium 6.4 mmol/L (ref
                  3.5–5.1) · Troponin I 0.94 ng/mL (ref &lt;0.04)
                </div>
                <Panel title="Labs">41 results · 2 critical · 5 abnormal.</Panel>
              </>
            ),
          },
          {
            value: "meds",
            label: "Medications",
            icon: <Icon name="pill" />,
            count: 9,
            children: <Panel title="Medications">9 active.</Panel>,
          },
          {
            value: "notes",
            label: "Notes",
            icon: <Icon name="note" />,
            children: <Panel title="Notes" />,
          },
        ]}
      />
    </div>
  );
}

export function PillFilters() {
  return (
    <Tabs
      as="radiogroup"
      variant="pill"
      overflow="wrap"
      aria-label="Filter documents by type"
      defaultValue="all"
      items={[
        { value: "all", label: "Everything", count: 241 },
        { value: "referrals", label: "Referrals", icon: <Icon name="doc" />, count: 38 },
        { value: "labs", label: "Lab reports", icon: <Icon name="flask" />, count: 96 },
        { value: "imaging", label: "Imaging", icon: <Icon name="image" />, count: 22 },
        { value: "consent", label: "Consent forms", icon: <Icon name="shield" />, count: 14 },
        { value: "letters", label: "Correspondence", icon: <Icon name="mail" />, count: 71 },
      ]}
    />
  );
}

/** Editable tabs, with real add and close. */
export function Editable() {
  const [items, setItems] = React.useState([
    {
      value: "note",
      label: "Progress note",
      icon: <Icon name="note" />,
      dot: "dirty" as const,
      closable: true,
    },
    { value: "cmp", label: "CMP 2026-08-14", icon: <Icon name="flask" />, closable: true },
    { value: "ct", label: "CT abdomen", icon: <Icon name="image" />, closable: true },
  ]);
  const [value, setValue] = React.useState("note");
  const [log, setLog] = React.useState<string[]>(["Close a tab, or press ＋."]);
  const added = React.useRef(0);

  const say = (line: string) => setLog((current) => [line, ...current].slice(0, 4));

  return (
    <div className="w-full">
      <Tabs
        as="tabs"
        variant="enclosed"
        aria-label="Open documents"
        value={value}
        onChange={(next) => setValue(next)}
        items={items.map((item) => ({
          ...item,
          children: (
            <Panel title={String(item.label)}>
              {item.dot === "dirty" ? "draft · unsaved changes" : "saved"}
            </Panel>
          ),
        }))}
        editable={{
          onClose: (target) => {
            const index = items.findIndex((item) => item.value === target);
            const rest = items.filter((item) => item.value !== target);
            setItems(rest);
            if (value === target) {
              setValue((rest[index] ?? rest[rest.length - 1])?.value ?? "");
            }
            // The rule APG omits: next, else previous, else the add button.
            say(`Closed “${items[index]?.label}” · focus moved to the neighbour.`);
          },
          onAdd: () => {
            const next = `new-${++added.current}`;
            setItems((current) => [
              ...current,
              {
                value: next,
                label: `Untitled ${added.current}`,
                icon: <Icon name="note" />,
                closable: true,
              },
            ]);
            setValue(next);
            say(`Added “Untitled ${added.current}” · selected and focused.`);
          },
        }}
      />
      <ul className="zb-log">
        {log.map((line, index) => (
          <li key={`${line}-${index}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function Rail({ collapsed }: { collapsed?: boolean }) {
  return (
    <Tabs
      as="tabs"
      variant="rail"
      orientation="vertical"
      aria-label="Settings"
      defaultValue="profile"
      items={[
        {
          value: "profile",
          label: collapsed ? "" : "Profile",
          textLabel: "Profile",
          icon: <Icon name="users" />,
          children: <Panel title="Profile">Name, photo, pronouns, locale, time zone.</Panel>,
        },
        {
          value: "notifications",
          label: collapsed ? "" : "Notifications",
          textLabel: "Notifications",
          icon: <Icon name="bell" />,
          count: collapsed ? undefined : 4,
          children: <Panel title="Notifications">4 channels configured.</Panel>,
        },
        {
          value: "security",
          label: collapsed ? "" : "Security",
          textLabel: "Security",
          icon: <Icon name="lock" />,
          children: <Panel title="Security">MFA, sessions, recovery.</Panel>,
        },
        {
          value: "members",
          label: collapsed ? "" : "Members",
          textLabel: "Members",
          icon: <Icon name="users" />,
          count: collapsed ? undefined : 32,
          children: <Panel title="Members">32 people, 4 roles.</Panel>,
        },
        {
          value: "api",
          label: collapsed ? "" : "API keys",
          textLabel: "API keys",
          icon: <Icon name="cog" />,
          disabled: true,
          disabledReason: "Not enabled for this workspace",
        },
      ]}
    />
  );
}

export function CommandBar() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs
        as="radiogroup"
        variant="command"
        aria-label="Layout"
        defaultValue="list"
        items={[
          { value: "list", label: <Icon name="list" />, textLabel: "List view" },
          { value: "grid", label: <Icon name="grid" />, textLabel: "Grid view" },
          { value: "board", label: <Icon name="board" />, textLabel: "Board view" },
          { value: "calendar", label: <Icon name="calendar" />, textLabel: "Calendar view" },
        ]}
      />
      <Tabs
        as="radiogroup"
        variant="command"
        size="sm"
        aria-label="Density"
        defaultValue="compact"
        items={[
          { value: "comfy", label: "Comfy" },
          { value: "compact", label: "Compact" },
        ]}
      />
    </div>
  );
}

export function Stepper() {
  return (
    <Tabs
      as="steps"
      variant="stepper"
      aria-label="Patient intake"
      defaultValue="consent"
      items={[
        {
          value: "identity",
          label: "Identity",
          state: "done",
          children: <Panel title="Identity">Complete.</Panel>,
        },
        {
          value: "insurance",
          label: "Insurance",
          state: "done",
          children: <Panel title="Insurance">Complete.</Panel>,
        },
        {
          value: "consent",
          label: "Consent",
          state: "current",
          children: (
            <Panel title="Consent">
              Signature capture, witnessed if the patient is unable to sign.
            </Panel>
          ),
        },
        {
          value: "review",
          label: "Review",
          state: "locked",
          disabled: true,
          disabledReason: "Complete the consent step first",
        },
      ]}
    />
  );
}

export function CardChoice() {
  return (
    <Tabs
      as="radiogroup"
      variant="card"
      aria-label="How should this result be released?"
      defaultValue="immediate"
      items={[
        {
          value: "immediate",
          label: (
            <span className="zb-card">
              <span className="zb-card__title">Immediate</span>
              <span className="zb-card__body">
                Visible in the patient portal as soon as it is verified.
              </span>
            </span>
          ),
          textLabel: "Immediate",
        },
        {
          value: "reviewed",
          label: (
            <span className="zb-card">
              <span className="zb-card__title">After review</span>
              <span className="zb-card__body">
                Held until a clinician marks it reviewed. Median delay 6 h.
              </span>
            </span>
          ),
          textLabel: "After review",
        },
        {
          value: "scheduled",
          label: (
            <span className="zb-card">
              <span className="zb-card__title">Scheduled</span>
              <span className="zb-card__body">
                Released at a fixed time you choose, review or not.
              </span>
            </span>
          ),
          textLabel: "Scheduled",
        },
      ]}
    />
  );
}

/** A tiny animated bar chart, so the stat panel is worth switching to. */
function Spark({ seed }: { seed: number }) {
  const bars = React.useMemo(
    () => Array.from({ length: 7 }, (_, index) => 30 + ((seed * (index + 3) * 37) % 65)),
    [seed],
  );
  return (
    <div className="zb-spark" aria-hidden="true">
      {bars.map((height, index) => (
        <span key={index} style={{ height: `${height}%`, animationDelay: `${index * 55}ms` }} />
      ))}
    </div>
  );
}

export function StatTiles() {
  const stats = [
    {
      value: "appts",
      key: "Appointments",
      amount: "1,284",
      delta: "▲ 6.2 % vs last week",
      good: true,
    },
    {
      value: "noshow",
      key: "No-show rate",
      amount: "7.4 %",
      delta: "▲ 1.1 pt vs last week",
      good: false,
    },
    { value: "wait", key: "Median wait", amount: "12 m", delta: "▼ 3 m vs last week", good: true },
    {
      value: "portal",
      key: "Portal messages",
      amount: "612",
      delta: "▲ 18 % vs last week",
      good: false,
    },
  ];
  return (
    <Tabs
      as="tabs"
      variant="stat"
      aria-label="Metric"
      defaultValue="appts"
      items={stats.map((stat, index) => ({
        value: stat.value,
        textLabel: `${stat.key}, ${stat.amount}, ${stat.good ? "better" : "worse"} than last week`,
        label: (
          <span className="zb-stat">
            <span className="zb-stat__key">{stat.key}</span>
            <span className="zb-stat__value">{stat.amount}</span>
            <span className={cn("zb-stat__delta", stat.good ? "is-good" : "is-bad")}>
              {stat.delta}
            </span>
          </span>
        ),
        children: <Spark seed={index + 1} />,
      }))}
    />
  );
}

export function GhostTabs() {
  return (
    <Tabs
      as="tabs"
      variant="ghost"
      aria-label="Preview mode"
      defaultValue="rendered"
      items={[
        {
          value: "rendered",
          label: "Rendered",
          children: (
            <Panel title="Rendered">
              No track, no rail, no indicator — selection is a filled background.
            </Panel>
          ),
        },
        {
          value: "source",
          label: "Source",
          children: (
            <Panel title="Source">
              The cheapest variant to render: no measurement pass at all.
            </Panel>
          ),
        },
        { value: "diff", label: "Diff", children: <Panel title="Diff" /> },
      ]}
    />
  );
}

export function NavTabs() {
  return (
    <Tabs
      as="nav"
      variant="underline"
      aria-label="Project"
      defaultValue="overview"
      items={[
        { value: "overview", label: "Overview", href: "#ex-nav-links" },
        { value: "issues", label: "Issues", href: "#ex-nav-links", count: 31 },
        { value: "pulls", label: "Pull requests", href: "#ex-nav-links", count: 7 },
        { value: "actions", label: "Actions", href: "#ex-nav-links" },
        { value: "insights", label: "Insights", href: "#ex-nav-links" },
      ]}
    />
  );
}

const LONG = [
  "Summary",
  "Vitals",
  "Laboratory",
  "Imaging",
  "Medications",
  "Allergies",
  "Immunisations",
  "Procedures",
  "Care plan",
  "Documents",
  "Audit trail",
] as const;

function longItems(tone = true) {
  return LONG.map((label) => ({
    value: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    ...(tone && label === "Laboratory" ? { count: 2, tone: "critical" as const } : {}),
    ...(tone && label === "Documents" ? { count: 41 } : {}),
  }));
}

/*
 * The container is narrow on purpose, at every strategy.
 *
 * This chapter's premise is "eleven tabs, and five ways to survive a narrow
 * container", and the container used to be narrow by accident — the gallery
 * column happened to be about 340px, so eleven tabs happened not to fit. When
 * the grid was widened so the *variant* demos would stop rendering permanently
 * scrolled, this chapter inherited the room and stopped overflowing at all:
 * five strategies, all shown doing nothing, on a page explaining what they do.
 *
 * Stating the width here makes the demo independent of the page it sits on,
 * which is what it should always have been. `collapse` keeps its tighter
 * bound: it is the strategy for the narrowest case, and it needs to be past the
 * point where a menu would still have fitted.
 */
export function OverflowDemo({ strategy }: { strategy: "scroll" | "menu" | "collapse" }) {
  return (
    <div className={cn("w-full", strategy === "collapse" ? "max-w-[320px]" : "max-w-[26rem]")}>
      <Tabs
        as="tabs"
        variant="underline"
        overflow={strategy}
        aria-label="Chart section"
        defaultValue="summary"
        items={longItems()}
      />
    </div>
  );
}

/** The guard: switching away from an unsaved note is a request, not a fact. */
export function GuardDemo() {
  const [dirty, setDirty] = React.useState(true);
  const [asking, setAsking] = React.useState<null | ((allowed: boolean) => void)>(null);
  const [log, setLog] = React.useState<string[]>([
    "Switch away from Compose to trigger the guard.",
  ]);

  const say = (line: string) => setLog((current) => [line, ...current].slice(0, 4));

  return (
    <div className="w-full">
      <Tabs
        as="tabs"
        variant="segmented"
        aria-label="Note editor"
        defaultValue="compose"
        onBeforeChange={() => {
          if (!dirty) return true;
          say("onBeforeChange → Promise<pending> · the strip goes inert.");
          return new Promise<boolean>((resolve) => setAsking(() => resolve));
        }}
        items={[
          {
            value: "compose",
            label: "Compose",
            dot: dirty ? "dirty" : undefined,
            children: <Panel title="Compose">{dirty ? "3 unsaved edits" : "saved"}</Panel>,
          },
          { value: "preview", label: "Preview", children: <Panel title="Preview" /> },
          { value: "history", label: "History", children: <Panel title="History" /> },
        ]}
      />

      {asking ? (
        <div className="zb-sheet" role="alertdialog" aria-label="Unsaved changes">
          <h5>This note has unsigned changes</h5>
          <p>
            Switching away keeps the draft but does not sign it. An unsigned note is not part of the
            legal record.
          </p>
          <div className="zb-sheet__actions">
            <button
              type="button"
              className="zb-demo-btn"
              onClick={() => {
                asking(false);
                setAsking(null);
                say("Resolved false · focus returned to the tab you tried to leave.");
              }}
            >
              Stay and sign
            </button>
            <button
              type="button"
              className="zb-demo-btn zb-demo-btn--primary"
              onClick={() => {
                asking(true);
                setAsking(null);
                setDirty(false);
                say("Resolved true · draft kept, switched.");
              }}
            >
              Switch, keep draft
            </button>
          </div>
        </div>
      ) : null}

      <ul className="zb-log">
        {log.map((line, index) => (
          <li key={`${line}-${index}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function RestrictedDemo() {
  return (
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
          icon: <Icon name="doc" />,
          children: <Panel title="Summary">Problems, allergies, recent encounters.</Panel>,
        },
        {
          value: "bh",
          label: "Behavioural health",
          icon: <Icon name="lock" />,
          disabled: true,
          disabledReason:
            "Restricted. Opening it records an access event against your account and notifies the record owner.",
        },
        {
          value: "meds",
          label: "Medications",
          icon: <Icon name="pill" />,
          children: <Panel title="Medications">9 active.</Panel>,
        },
        {
          value: "vitals",
          label: "Vitals",
          icon: <Icon name="heart" />,
          availability: "stale",
          children: <Panel title="Vitals">Cached — last synced 14 minutes ago.</Panel>,
        },
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* The nine-cell matrix                                                 */
/* ------------------------------------------------------------------ */

const THEMES = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["hc", "High contrast"],
] as const;
const DENSITIES = ["patient", "standard", "clinical"] as const;

function MatrixCell({ theme, density }: { theme: string; density: string }) {
  return (
    <div
      className="zb-matrix__cell"
      data-zb-theme={theme === "hc" ? "high-contrast" : theme}
      data-zb-density={density}
    >
      <div className="zb-matrix__label">
        {theme} · {density}
      </div>
      <div className="zb-matrix__body">
        <Tabs
          as="radiogroup"
          variant="segmented"
          aria-label={`Scope, ${theme} ${density}`}
          defaultValue="personal"
          items={[
            { value: "personal", label: "Personal" },
            { value: "shared", label: "Shared" },
          ]}
        />
        <Tabs
          as="tabs"
          variant="underline"
          aria-label={`Results, ${theme} ${density}`}
          defaultValue="labs"
          items={[
            { value: "labs", label: "Labs", count: 2, tone: "critical" },
            { value: "meds", label: "Meds", count: 9 },
          ]}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The gallery                                                          */
/* ------------------------------------------------------------------ */

const VARIANTS: TabVariant[] = [
  "segmented",
  "underline",
  "pill",
  "enclosed",
  "rail",
  "ghost",
  "stepper",
  "command",
  "card",
  "stat",
  "unstyled",
];

/** The same three items in every skin: one keyboard model, eleven looks. */
export function EveryVariant() {
  return (
    <div className="zb-variants w-full">
      {VARIANTS.map((variant) => (
        <div key={variant} className="zb-variants__row">
          <code>{variant}</code>
          <Tabs
            as="tabs"
            variant={variant}
            aria-label={`${variant} example`}
            defaultValue="a"
            items={[
              { value: "a", label: "Personal" },
              { value: "b", label: "Shared" },
              { value: "c", label: "Archived" },
            ]}
          />
        </div>
      ))}
    </div>
  );
}

/** Three themes by three densities, all at once — how a token bug is caught. */
export function ThemeDensityMatrix() {
  return (
    <div className="zb-matrix w-full">
      {THEMES.map(([theme]) =>
        DENSITIES.map((density) => (
          <MatrixCell key={`${theme}-${density}`} theme={theme} density={density} />
        )),
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The clinical examples                                                */
/* ------------------------------------------------------------------ */

/** The chart's sections, with counts read from the fixtures rather than typed. */
export function ChartSections() {
  return (
    <Tabs
      as="tabs"
      aria-label="Chart sections"
      defaultValue="summary"
      items={[
        {
          value: "summary",
          label: "Summary",
          children: <Panel title="Summary">Problems, allergies, recent encounters.</Panel>,
        },
        {
          value: "labs",
          label: "Labs",
          count: observationPanel.length,
          tone: "critical",
          children: (
            <Panel title="Labs">{observationPanel.length} results in the latest panel.</Panel>
          ),
        },
        {
          value: "meds",
          label: "Medications",
          count: medicationList.length,
          children: <Panel title="Medications">{medicationList.length} active.</Panel>,
        },
        {
          value: "allergies",
          label: "Allergies",
          count: allergyList.length,
          children: <Panel title="Allergies">{allergyList.length} recorded.</Panel>,
        },
      ]}
    />
  );
}

export function RestrictedSection() {
  return (
    <Tabs
      as="tabs"
      aria-label="Chart sections"
      defaultValue="summary"
      items={[
        {
          value: "summary",
          label: "Summary",
          children: <Panel title="Summary">Problems, allergies, recent encounters.</Panel>,
        },
        {
          value: "bh",
          label: "Behavioural health",
          disabled: true,
          disabledReason:
            "Restricted. Opening it records an access event and notifies the record owner.",
        },
      ]}
    />
  );
}

export function DensityFilter() {
  return (
    <Tabs
      as="radiogroup"
      variant="segmented"
      aria-label="Density"
      defaultValue="default"
      items={[
        { value: "compact", label: "Compact" },
        { value: "default", label: "Default" },
        { value: "comfortable", label: "Comfortable" },
      ]}
    />
  );
}
