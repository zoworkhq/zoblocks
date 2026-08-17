"use client";

/**
 * The tab gallery — every demo from the component brief, live.
 *
 * A gallery of screenshots can show eleven skins. Only this can show that all
 * eleven produce the same accessibility tree, that the indicator survives a
 * density change, and that a restricted tab is present-and-explained rather
 * than missing. So everything here is the real package: click it, arrow
 * through it, flip it to RTL, and read the announced names in a screen reader.
 *
 * The control bar is the point of the whole page. Theme, density and direction
 * are the three axes a design system is most often wrong on, and they are the
 * three nobody checks by hand — so they are one click each, applied to every
 * demo at once.
 */

import * as React from "react";
import { Tabs, type TabVariant } from "@oxygenui-design/tabs";
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
    <div className="ox-demo-panel">
      <b>{title}</b>
      {children ? <span> — {children}</span> : null}
    </div>
  );
}

interface DemoProps {
  id: string;
  name: string;
  api: string;
  tags?: string[];
  note: React.ReactNode;
  children: React.ReactNode;
  /** Stretches the stage for a vertical or wide composition. */
  wide?: boolean;
}

/**
 * One framed demo.
 *
 * The frame states the API being demonstrated, because a gallery where you
 * cannot tell which prop produced which pixels teaches nothing.
 */
function Demo({ id, name, api, tags, note, children, wide }: DemoProps) {
  return (
    <figure id={id} className="ox-demo scroll-mt-28" data-reveal>
      <figcaption className="ox-demo__head">
        <span className="ox-demo__id">{id.toUpperCase()}</span>
        <span className="ox-demo__name">{name}</span>
        <code className="ox-demo__api">{api}</code>
        <span className="grow" />
        {tags?.map((tag) => (
          <span key={tag} className="ox-demo__tag">
            {tag}
          </span>
        ))}
      </figcaption>
      <div className={cn("ox-demo__stage", wide && "ox-demo__stage--wide")}>{children}</div>
      <p className="ox-demo__note">{note}</p>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Individual demos                                                     */
/* ------------------------------------------------------------------ */

/** The control from the original screenshot, rebuilt. */
function Flagship() {
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

function RichSegmented() {
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

function Underline() {
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
function ChartHeader() {
  return (
    <div className="ox-chart">
      <div className="ox-chart__head">
        <div>
          <div className="ox-chart__name">Ravi Menon</div>
          <div className="ox-chart__mrn">MRN 88-2049 · 47 y · DOB 1979-02-11</div>
        </div>
        <div className="ox-chart__actions">
          <button type="button" className="ox-demo-btn">
            Share
          </button>
          <button type="button" className="ox-demo-btn ox-demo-btn--primary">
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
                <div className="ox-alert ox-alert--critical" role="alert">
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

function PillFilters() {
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
function Editable() {
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
      <ul className="ox-log">
        {log.map((line, index) => (
          <li key={`${line}-${index}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function Rail({ collapsed }: { collapsed?: boolean }) {
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

function CommandBar() {
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

function Stepper() {
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

function CardChoice() {
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
            <span className="ox-card">
              <span className="ox-card__title">Immediate</span>
              <span className="ox-card__body">
                Visible in the patient portal as soon as it is verified.
              </span>
            </span>
          ),
          textLabel: "Immediate",
        },
        {
          value: "reviewed",
          label: (
            <span className="ox-card">
              <span className="ox-card__title">After review</span>
              <span className="ox-card__body">
                Held until a clinician marks it reviewed. Median delay 6 h.
              </span>
            </span>
          ),
          textLabel: "After review",
        },
        {
          value: "scheduled",
          label: (
            <span className="ox-card">
              <span className="ox-card__title">Scheduled</span>
              <span className="ox-card__body">
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
    <div className="ox-spark" aria-hidden="true">
      {bars.map((height, index) => (
        <span key={index} style={{ height: `${height}%`, animationDelay: `${index * 55}ms` }} />
      ))}
    </div>
  );
}

function StatTiles() {
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
          <span className="ox-stat">
            <span className="ox-stat__key">{stat.key}</span>
            <span className="ox-stat__value">{stat.amount}</span>
            <span className={cn("ox-stat__delta", stat.good ? "is-good" : "is-bad")}>
              {stat.delta}
            </span>
          </span>
        ),
        children: <Spark seed={index + 1} />,
      }))}
    />
  );
}

function GhostTabs() {
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

function NavTabs() {
  return (
    <Tabs
      as="nav"
      variant="underline"
      aria-label="Project"
      defaultValue="overview"
      items={[
        { value: "overview", label: "Overview", href: "#nav-demo" },
        { value: "issues", label: "Issues", href: "#nav-demo", count: 31 },
        { value: "pulls", label: "Pull requests", href: "#nav-demo", count: 7 },
        { value: "actions", label: "Actions", href: "#nav-demo" },
        { value: "insights", label: "Insights", href: "#nav-demo" },
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
function OverflowDemo({ strategy }: { strategy: "scroll" | "menu" | "collapse" }) {
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
function GuardDemo() {
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
        <div className="ox-sheet" role="alertdialog" aria-label="Unsaved changes">
          <h5>This note has unsigned changes</h5>
          <p>
            Switching away keeps the draft but does not sign it. An unsigned note is not part of the
            legal record.
          </p>
          <div className="ox-sheet__actions">
            <button
              type="button"
              className="ox-demo-btn"
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
              className="ox-demo-btn ox-demo-btn--primary"
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

      <ul className="ox-log">
        {log.map((line, index) => (
          <li key={`${line}-${index}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function RestrictedDemo() {
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
    <div className="ox-matrix__cell" data-ox-demo-theme={theme} data-ox-density={density}>
      <div className="ox-matrix__label">
        {theme} · {density}
      </div>
      <div className="ox-matrix__body">
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

type Chapter = "gallery" | "modes" | "overflow" | "states" | "matrix";

const CHAPTERS: Array<{ id: Chapter; label: string; blurb: string }> = [
  {
    id: "gallery",
    label: "Variants",
    blurb: "Eleven skins. Every one is the same accessibility tree.",
  },
  {
    id: "modes",
    label: "Semantic modes",
    blurb: "Identical pixels, four different DOMs. Inspect them.",
  },
  {
    id: "overflow",
    label: "Overflow",
    blurb: "Eleven tabs, and five ways to survive a narrow container.",
  },
  {
    id: "states",
    label: "States",
    blurb: "Restricted, stale, unsaved — the states a chart actually reaches.",
  },
  {
    id: "matrix",
    label: "Theme × density",
    blurb: "Nine combinations at once, which is how a token bug is caught.",
  },
];

export function TabsGallery() {
  const [chapter, setChapter] = React.useState<Chapter>("gallery");
  const [theme, setTheme] = React.useState<"light" | "dark" | "hc">("light");
  const [density, setDensity] = React.useState<(typeof DENSITIES)[number]>("standard");
  const [rtl, setRtl] = React.useState(false);
  const [motion, setMotion] = React.useState(true);

  /*
   * The demo theme starts at whatever the site is showing, and keeps following
   * it until the reader picks one here.
   *
   * It used to be hardcoded to "light". The demo scopes set their own literal
   * `--ox-*` values — that is the point of them, and why the matrix can show
   * three themes at once — so on the dark site every stage rendered as a white
   * slab. Nothing was broken, but a page whose argument is "the tokens carry
   * the theme" opening on eleven light-mode panels in a dark page argues the
   * opposite.
   *
   * `hc` is only ever a deliberate choice, so it is never selected here — the
   * site has no high-contrast mode to follow.
   */
  const [themePinned, setThemePinned] = React.useState(false);

  React.useEffect(() => {
    if (themePinned) return;
    const root = document.documentElement;
    const sync = () => setTheme(root.classList.contains("dark") ? "dark" : "light");
    sync();
    // The site theme is a class on <html>, written by the toggle and by the
    // pre-paint script. Observing it covers both, and the OS-level flip that
    // reaches neither.
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [themePinned]);

  const active = CHAPTERS.find((item) => item.id === chapter) ?? CHAPTERS[0]!;

  return (
    <div className="ox-gallery">
      {/* Control bar — the three axes nobody checks by hand, one click each. */}
      <div className="ox-gallery__bar">
        <div className="ox-gallery__group" role="group" aria-label="Component theme">
          <span className="ox-gallery__legend">Theme</span>
          {(["light", "dark", "hc"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={theme === option}
              onClick={() => {
                setThemePinned(true);
                setTheme(option);
              }}
              className="ox-gallery__switch"
            >
              {option}
            </button>
          ))}
        </div>

        <div className="ox-gallery__group" role="group" aria-label="Density">
          <span className="ox-gallery__legend">Density</span>
          {DENSITIES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={density === option}
              onClick={() => setDensity(option)}
              className="ox-gallery__switch"
            >
              {option}
            </button>
          ))}
        </div>

        <div className="ox-gallery__group" role="group" aria-label="Text direction">
          <span className="ox-gallery__legend">Dir</span>
          {(
            [
              ["ltr", false],
              ["rtl", true],
            ] as const
          ).map(([label, value]) => (
            <button
              key={label}
              type="button"
              aria-pressed={rtl === value}
              onClick={() => setRtl(value)}
              className="ox-gallery__switch"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ox-gallery__group" role="group" aria-label="Motion">
          <span className="ox-gallery__legend">Motion</span>
          {(
            [
              ["on", true],
              ["off", false],
            ] as const
          ).map(([label, value]) => (
            <button
              key={label}
              type="button"
              aria-pressed={motion === value}
              onClick={() => setMotion(value)}
              className="ox-gallery__switch"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chapter navigation — itself a tablist, built from the component. */}
      <div className="ox-gallery__chapters">
        <Tabs
          as="radiogroup"
          variant="segmented"
          aria-label="Gallery chapter"
          value={chapter}
          onChange={(next) => setChapter(next as Chapter)}
          items={CHAPTERS.map((item) => ({ value: item.id, label: item.label }))}
        />
        <p className="ox-gallery__blurb">{active.blurb}</p>
      </div>

      <div
        className="ox-gallery__stage"
        data-ox-demo-theme={theme}
        data-ox-density={density}
        data-ox-motion={motion ? "on" : "off"}
        dir={rtl ? "rtl" : "ltr"}
      >
        {chapter === "gallery" ? (
          <div className="ox-gallery__grid">
            <Demo
              id="v01"
              name="Segmented"
              api='variant="segmented" fill="equal"'
              tags={["tablist"]}
              note="The control this whole system started from. The thumb is one transformed element, so it interpolates position and width together and never repaints the track. Click either half, or focus it and press ← / →."
            >
              <Flagship />
            </Demo>

            <Demo
              id="v02"
              name="Segmented · rich triggers"
              api="icon + count + tone"
              tags={["counts", "aria-disabled"]}
              note="The count reads as a number, not a label: “Needs action, 3 abnormal”. Archive is aria-disabled rather than disabled, so a keyboard user can discover it exists and is unavailable."
            >
              <RichSegmented />
            </Demo>

            <Demo
              id="v03"
              name="Underline"
              api='variant="underline"'
              tags={["6+ items"]}
              note="The workhorse: more than four items, labels of unequal length, panels that are whole screens. The rail is an inset shadow rather than a border, so the 2 px indicator can sit at bottom:0 and overlap it exactly at any zoom."
              // Six labels of unequal length need a row of their own. In a
              // column they render permanently scrolled, which demonstrates the
              // overflow behaviour in the chapter about variants.
              wide
            >
              <Underline />
            </Demo>

            <Demo
              id="v04"
              name="Pill filters"
              api='as="radiogroup" overflow="wrap"'
              tags={["radiogroup", "wraps"]}
              note="Pills are the only variant allowed to wrap, and only as a radiogroup — once a tablist wraps, “the next tab” stops being a direction. There is no indicator: with a line break there is no continuous path for one to travel along."
            >
              <PillFilters />
            </Demo>

            <Demo
              id="v05"
              name="Enclosed · editable"
              api="editable={{ onClose, onAdd }}"
              tags={["closable", "addable"]}
              note="The × is aria-hidden and the keyboard path is Delete on the tab, because an interactive control inside role=tab is invalid ARIA. After a close, focus moves to the neighbour deterministically — never to <body>."
              // Each tab carries an icon, a dirty dot and a close control, so a
              // strip of them is wider than its labels suggest — and a demo
              // about closing tabs has to show more than one.
              wide
            >
              <Editable />
            </Demo>

            <Demo
              id="v06"
              name="Rail"
              api='variant="rail" orientation="vertical"'
              tags={["aria-orientation"]}
              note="Vertical means ↑ / ↓, not ← / →. Setting aria-orientation without rebinding the keys is a lie to the screen reader, so both come from one prop."
              wide
            >
              <Rail />
            </Demo>

            <Demo
              id="v07"
              name="Ghost"
              api='variant="ghost"'
              note="No track, no rail, no indicator element — so no measurement pass and no ResizeObserver. For dense toolbars and popovers, where a second bordered box would compete with the container that already has one."
            >
              <GhostTabs />
            </Demo>

            <Demo
              id="v08"
              name="Command"
              api='variant="command" as="radiogroup"'
              tags={["icon-only"]}
              note="Two radiogroups, not one toolbar: layout and density are independent values, and merging them would lose the “checked, 1 of 4” that tells a screen-reader user what the current view is. Every icon carries a textLabel."
            >
              <CommandBar />
            </Demo>

            <Demo
              id="v09"
              name="Stepper"
              api='as="steps" variant="stepper"'
              tags={["gated"]}
              note="Backwards is free, forwards is earned. Completed steps stay reachable — locking them is the classic wizard mistake, and it forces a restart to fix a typo. Try Review: it is locked, focusable, and says why."
            >
              <Stepper />
            </Demo>

            <Demo
              id="v10"
              name="Card"
              api='variant="card" as="radiogroup"'
              note="When choosing wrong has a consequence the label cannot carry, the option needs a sentence — and a sentence does not fit in a pill. Same accessibility tree as the filters above, three times the surface area."
              wide
            >
              <CardChoice />
            </Demo>

            <Demo
              id="v11"
              name="Stat"
              api='variant="stat"'
              tags={["analytics"]}
              note="Arrow direction and colour disagree on purpose: “No-show rate ▲” is bad and “Median wait ▼” is good, so direction alone cannot carry meaning. The accessible name says better or worse in words."
              wide
            >
              <StatTiles />
            </Demo>
          </div>
        ) : null}

        {chapter === "modes" ? (
          <div className="ox-gallery__grid">
            <Demo
              id="m1"
              name='as="tabs"'
              api='role="tablist" + buttons'
              tags={["owns panels"]}
              note="Announced as “Summary, tab, selected, 1 of 6”. → moves selection, Tab exits to the panel. This is the only mode that owns panels."
            >
              <Underline />
            </Demo>

            <Demo
              id="m2"
              name='as="nav"'
              api="<nav> + real anchors"
              tags={["links"]}
              note="Announced as “Overview, link, current page”. No arrow-key hijack, and cmd-click and middle-click work — because these are real anchors. Hover one and the browser shows the URL: that is the tell."
            >
              <div id="nav-demo">
                <NavTabs />
              </div>
            </Demo>

            <Demo
              id="m3"
              name='as="radiogroup"'
              api='role="radiogroup" + radios'
              tags={["form value"]}
              note="Announced as “Filter documents by type, Everything, radio button, checked, 1 of 6”. It owns no panels, emits a form value, and validates like a field."
            >
              <PillFilters />
            </Demo>

            <Demo
              id="m4"
              name='as="steps"'
              api="tablist + gate"
              tags={["ordered"]}
              note="The tree is a tablist; the difference is that selection is a request. Forward moves into a locked step are refused and audited, and the refusal says why rather than silently doing nothing."
            >
              <Stepper />
            </Demo>
          </div>
        ) : null}

        {chapter === "overflow" ? (
          <div className="ox-gallery__grid">
            <Demo
              id="o1"
              name="Scroll"
              api='overflow="scroll"'
              tags={["default"]}
              note="Fade masks, nudge buttons and scroll-snap. The nudges are tabindex=-1 on purpose: arrow keys already move selection and scroll follows, so putting them in the tab order adds two stops that do nothing for a keyboard user."
              wide
            >
              <OverflowDemo strategy="scroll" />
            </Demo>

            <Demo
              id="o2"
              name="Priority-plus menu"
              api='overflow="menu"'
              tags={["measured"]}
              note="Widths are measured once with everything visible and cached. Resize the window: tabs that no longer fit move into a real role=menu, and the selected tab is pinned so it can never be the one that disappears."
              wide
            >
              <OverflowDemo strategy="menu" />
            </Demo>

            <Demo
              id="o3"
              name="Collapse"
              api='overflow="collapse"'
              tags={["container query"]}
              note="Below a container width the whole strip becomes a native <select> — the only picker that already works on every phone. Driven by the container, never the viewport: tabs in a 380 px drawer on a 1440 px monitor need the same treatment."
            >
              <OverflowDemo strategy="collapse" />
            </Demo>

            <Demo
              id="o4"
              name="Wrap"
              api='overflow="wrap"'
              tags={["radiogroup only"]}
              note="Legal for a pill radiogroup and refused on a tablist — the component throws rather than rendering a two-row tablist whose arrow keys have no correct answer."
            >
              <PillFilters />
            </Demo>
          </div>
        ) : null}

        {chapter === "states" ? (
          <div className="ox-gallery__grid">
            <Demo
              id="s1"
              name="Unsaved-changes guard"
              api="onBeforeChange"
              tags={["interactive", "async"]}
              note="onBeforeChange may return a promise, because vetoing usually means asking a human. While it is pending the strip is inert and aria-busy — the one case where an unresponsive tab strip is correct. Cancel and focus returns to where you were."
              wide
            >
              <GuardDemo />
            </Demo>

            <Demo
              id="s2"
              name="Restricted and stale"
              api="disabledReason · availability"
              tags={["break-the-glass"]}
              note="Hiding a restricted section teaches clinicians the record is incomplete, which is worse than telling them it exists and is gated. Vitals is stale rather than missing — a clinician reading cached observations needs to know they are cached."
              wide
            >
              <RestrictedDemo />
            </Demo>

            <Demo
              id="s3"
              name="Severity in the strip"
              api="count + tone"
              tags={["colour ≠ signal"]}
              note="A clinician scanning five tabs must be able to tell where the problem is without opening each. The red 2 carries a border, a hidden “2 critical”, and the panel repeats it as text. What the component refuses to do is reorder tabs by severity — position is memory."
              wide
            >
              <ChartHeader />
            </Demo>

            <Demo
              id="s4"
              name="Every variant, one tree"
              api="variant × 11"
              note="The same items in all eleven skins. Tab into any of them and the keyboard model is identical, because the skin is CSS and the mode is the accessibility tree."
              wide
            >
              <div className="ox-variants">
                {VARIANTS.map((variant) => (
                  <div key={variant} className="ox-variants__row">
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
            </Demo>
          </div>
        ) : null}

        {chapter === "matrix" ? (
          <div className="ox-matrix">
            {THEMES.map(([themeKey]) =>
              DENSITIES.map((densityKey) => (
                <MatrixCell
                  key={`${themeKey}-${densityKey}`}
                  theme={themeKey}
                  density={densityKey}
                />
              )),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
