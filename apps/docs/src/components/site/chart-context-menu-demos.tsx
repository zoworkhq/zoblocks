"use client";

/**
 * Live examples for ChartContextMenu, one per argument the component makes.
 *
 * A menu is invisible until someone summons it, so every example is a chart
 * row the reader right-clicks (or focuses and opens with Shift+F10), with a
 * line underneath saying what the host was told. Nothing opens itself: a page
 * of examples that each pop a menu on mount is a page that steals focus a
 * dozen times before anyone has read a word.
 *
 * The menus portal into `<body>`. Each preview sits inside a stage that clips,
 * and a menu portalled into it would lose its bottom half.
 */

import * as React from "react";
import {
  ChartContextMenu,
  type ChartContextMenuProps,
  type ChartMenuAction,
  type MenuSubject,
} from "@/registry/zoblocks/chart-context-menu/chart-context-menu";

/** Injected, never read from a clock — the disclosure record takes it as a prop. */
export const NOW = "2026-08-31T09:24:00-04:00";

const NURSE = { role: "a registered nurse", breakGlass: true } as const;

/* ------------------------------------------------------------------ */
/* Subjects                                                           */
/* ------------------------------------------------------------------ */

const LISINOPRIL: MenuSubject = {
  resource: "MedicationRequest",
  id: "med-4471",
  label: "Lisinopril 10 mg",
  detail: "Oral · daily · started 4 Mar 2026",
};

/** Buprenorphine is prescribed by a Part 2 program, so its notes are Part 2 records. */
export const BUPRENORPHINE: MenuSubject = {
  resource: "MedicationRequest",
  id: "med-5120",
  label: "Buprenorphine–naloxone 8/2 mg",
  detail: "Sublingual · daily · OTP prescriber",
};

const POTASSIUM: MenuSubject = {
  resource: "Observation",
  id: "obs-8812",
  label: "Potassium 6.8 mmol/L",
  detail: "Critical high · preliminary · 09:12 today",
};

const GROUP_NOTE: MenuSubject = {
  resource: "DocumentReference",
  id: "doc-9911",
  label: "Group therapy note — Nwosu, C.",
  detail: "Signed by R. Adeyemi, LPC",
  masked: true,
};

/* ------------------------------------------------------------------ */
/* Actions                                                            */
/* ------------------------------------------------------------------ */

const ROUTINE: ChartMenuAction[] = [
  { id: "open", label: "Open order", tier: "routine", shortcut: "↵" },
  { id: "copy", label: "Copy as text", tier: "routine", shortcut: "⌘C" },
  { id: "history", label: "Administration history", tier: "routine" },
];

const MAR_NOTE: ChartMenuAction = {
  id: "mar",
  label: "Add a note to the MAR",
  tier: "documented",
  applies: ["MedicationRequest"],
  records: "Writes a note on the medication record. Nursing sees it at the next round.",
};

const PHARMACY: ChartMenuAction = {
  id: "pharmacy",
  label: "Flag for pharmacy review",
  tier: "documented",
  applies: ["MedicationRequest"],
  records: "Creates a Task for pharmacy. It appears in their queue with your name on it.",
};

const DISCONTINUE: ChartMenuAction = {
  id: "dc",
  label: "Discontinue",
  tier: "clinical",
  applies: ["MedicationRequest"],
  confirm: "The next scheduled dose is 14:00 today. Discontinuing stops it.",
  confirmVerb: "Discontinue",
};

const RENEW: ChartMenuAction = {
  id: "renew",
  label: "Renew for 90 days",
  tier: "clinical",
  applies: ["MedicationRequest"],
  confirm: "Issues a new order in your name.",
  availability: {
    status: "unavailable",
    reason: "Prescriber role required — you are signed in as a registered nurse",
  },
};

const DELETE: ChartMenuAction = {
  id: "delete",
  label: "Delete order",
  tier: "clinical",
  applies: ["MedicationRequest"],
  confirm: "Removes the order entirely.",
  availability: { status: "withheld" },
};

const PART2_REASONS = [
  "Treatment of this patient",
  "Medical emergency (42 CFR §2.51)",
  "Written patient consent on file",
];

/** The full ladder on one order: routine, recorded, clinical, disclosive, withheld. */
export const PLAYGROUND_ACTIONS: ChartMenuAction[] = [
  ...ROUTINE,
  MAR_NOTE,
  DISCONTINUE,
  RENEW,
  {
    id: "part2",
    label: "Reveal Part 2 program notes",
    tier: "disclosive",
    applies: ["MedicationRequest"],
    reasons: PART2_REASONS,
  },
  DELETE,
];

/* ------------------------------------------------------------------ */
/* The row and the stage                                              */
/* ------------------------------------------------------------------ */

type RowProps = Omit<ChartContextMenuProps, "children" | "now"> & {
  /** Right-aligned detail on the row: a time, a count. */
  aside?: string;
  /** What the row itself shows. Defaults to the subject, masked the way the menu masks it. */
  title?: string;
  caption?: string;
};

/** A chart row that owns a menu — the host's markup, spread with the trigger props. */
export function MenuRow({ aside, title, caption, ...props }: RowProps) {
  const { subject } = props;
  return (
    <ChartContextMenu now={NOW} {...props}>
      {(trigger) => (
        <div
          {...trigger}
          className="flex select-none items-center gap-3 rounded-md border border-[var(--zb-border)] bg-[var(--zb-surface)] px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--zb-focus-ring)]"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-[var(--zb-text)]">
              {title ?? (subject.masked ? "Restricted record" : subject.label)}
            </span>
            <span className="block truncate text-xs text-[var(--zb-text-subtle)]">
              {caption ?? (subject.masked ? "42 CFR Part 2 · not disclosed" : subject.detail)}
            </span>
          </span>
          {aside ? (
            <span className="shrink-0 text-xs tabular-nums text-[var(--zb-text-subtle)]">
              {aside}
            </span>
          ) : null}
        </div>
      )}
    </ChartContextMenu>
  );
}

/**
 * The host's side of the conversation: the last few things it was told.
 * Newest first and capped, so the log never pushes the rows off the stage.
 */
function useHostLog(hint = "Right-click a row, or focus it and press Shift+F10.") {
  const [lines, setLines] = React.useState<string[]>([]);
  const say = React.useCallback(
    (line: string) => setLines((current) => [line, ...current].slice(0, 3)),
    [],
  );
  const handlers = {
    onRun: (action: ChartMenuAction) => say(`onRun("${action.id}") — ${action.label}`),
    onBlocked: (_action: ChartMenuAction, reason: string) => say(`onBlocked — ${reason}`),
    onDisclose: (record: { action: string; outcome: string; reason: string | null }) =>
      say(
        `onDisclose — ${record.action}, ${record.outcome}${record.reason ? `: ${record.reason}` : ""}`,
      ),
    onToggle: (action: ChartMenuAction, checked: boolean) =>
      say(`onToggle("${action.id}", ${checked})`),
  };
  const log = (
    <div aria-live="polite" className="grid min-h-5 gap-0.5 text-xs text-[var(--zb-text-muted)]">
      {lines.length === 0 ? (
        <p className="m-0">{hint}</p>
      ) : (
        lines.map((line, index) => (
          <p key={`${index}-${line}`} className={index === 0 ? "m-0" : "m-0 opacity-60"}>
            {line}
          </p>
        ))
      )}
    </div>
  );
  return { handlers, log, say };
}

function Stage({ children, log }: { children: React.ReactNode; log: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3">
      <div className="grid gap-2">{children}</div>
      {log}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* What it is about                                                   */
/* ------------------------------------------------------------------ */

export function SubjectHeader() {
  const { handlers, log } = useHostLog();
  return (
    <Stage log={log}>
      <MenuRow subject={LISINOPRIL} actions={[...ROUTINE, MAR_NOTE]} aside="14:00" {...handlers} />
    </Stage>
  );
}

export function MaskedSubject() {
  const { handlers, log } = useHostLog();
  return (
    <Stage log={log}>
      <MenuRow
        subject={GROUP_NOTE}
        actions={[
          { id: "open", label: "Open note", tier: "routine" },
          { id: "print", label: "Print", tier: "routine", shortcut: "⌘P" },
          {
            id: "part2",
            label: "Reveal Part 2 content",
            tier: "disclosive",
            applies: ["DocumentReference"],
            reasons: PART2_REASONS,
          },
        ]}
        policy={NURSE}
        aside="28 Aug"
        {...handlers}
      />
    </Stage>
  );
}

export function BulkSelection() {
  const { handlers, log } = useHostLog("Right-click the selection. Twelve orders, counted.");
  return (
    <Stage log={log}>
      <MenuRow
        subject={{
          ...LISINOPRIL,
          plural: "orders",
          bulkDetail: "Morning round",
          also: Array.from({ length: 11 }, (_, index) => ({
            resource: "MedicationRequest",
            id: `med-${4472 + index}`,
          })),
        }}
        actions={[
          { id: "copy", label: "Copy as text", tier: "routine", shortcut: "⌘C", bulk: "allowed" },
          DISCONTINUE,
        ]}
        title="12 orders selected"
        caption="Morning round · Bay 4"
        {...handlers}
      />
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Consequence                                                        */
/* ------------------------------------------------------------------ */

export function ConsequenceTiers() {
  const { handlers, log } = useHostLog("Try Copy, then the MAR note, then Discontinue.");
  return (
    <Stage log={log}>
      <MenuRow
        subject={LISINOPRIL}
        actions={[...ROUTINE, MAR_NOTE, PHARMACY, DISCONTINUE]}
        aside="14:00"
        {...handlers}
      />
    </Stage>
  );
}

export function DisclosureRecordDemo() {
  const { handlers, log } = useHostLog(
    "Choose Reveal Part 2, then pick a reason — or press Escape and watch it record anyway.",
  );
  return (
    <Stage log={log}>
      <MenuRow
        subject={BUPRENORPHINE}
        actions={[
          { id: "open", label: "Open order", tier: "routine" },
          {
            id: "part2",
            label: "Reveal Part 2 program notes",
            tier: "disclosive",
            applies: ["MedicationRequest"],
            reasons: PART2_REASONS,
          },
        ]}
        policy={NURSE}
        aside="08:00"
        {...handlers}
      />
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Availability                                                       */
/* ------------------------------------------------------------------ */

export function UnavailableInPlace() {
  const { handlers, log } = useHostLog();
  return (
    <Stage log={log}>
      <MenuRow
        subject={LISINOPRIL}
        actions={[...ROUTINE.slice(0, 2), RENEW]}
        policy={NURSE}
        aside="14:00"
        {...handlers}
      />
      <MenuRow
        subject={POTASSIUM}
        actions={[
          { id: "open", label: "Open result", tier: "routine" },
          {
            id: "portal",
            label: "Release to patient portal",
            tier: "documented",
            applies: ["Observation"],
            records: "Publishes the value to the patient's portal immediately.",
            availability: {
              status: "unavailable",
              reason: "Preliminary results are not released. The lab has not verified this one.",
            },
          },
        ]}
        aside="09:12"
        {...handlers}
      />
    </Stage>
  );
}

export function WithheldCounted() {
  const { handlers, log } = useHostLog();
  return (
    <Stage log={log}>
      <MenuRow
        subject={LISINOPRIL}
        actions={[...ROUTINE, MAR_NOTE, DISCONTINUE, DELETE]}
        policy={{ ...NURSE, permitted: ["open", "copy", "history", "mar"] }}
        aside="14:00"
        {...handlers}
      />
    </Stage>
  );
}

/**
 * The check resolves 1.5 seconds after the menu opens, in place. Restarted on
 * every open, so the reader sees the row change rather than arrive.
 */
export function PendingInPlace() {
  const { handlers, log, say } = useHostLog(
    "Open the menu and watch Copy: it is checked in place, never appended.",
  );
  const [pending, setPending] = React.useState(true);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const actions: ChartMenuAction[] = [
    ROUTINE[0]!,
    pending ? { ...ROUTINE[1]!, availability: { status: "pending" } } : ROUTINE[1]!,
    ROUTINE[2]!,
  ];

  return (
    <Stage log={log}>
      <MenuRow
        subject={LISINOPRIL}
        actions={actions}
        aside="14:00"
        onOpenChange={(open) => {
          clearTimeout(timer.current);
          setPending(true);
          if (!open) return;
          timer.current = setTimeout(() => {
            setPending(false);
            say("Availability check resolved — Copy is now available");
          }, 1500);
        }}
        {...handlers}
      />
    </Stage>
  );
}

export function TwoEmpties() {
  const { handlers, log } = useHostLog("Right-click each row. Two empty menus, two sentences.");
  return (
    <Stage log={log}>
      <MenuRow subject={LISINOPRIL} actions={[]} caption="No actions defined" {...handlers} />
      <MenuRow
        subject={LISINOPRIL}
        actions={[...ROUTINE, DISCONTINUE]}
        policy={{ role: "a scheduling clerk", permitted: [], breakGlass: false }}
        caption="Signed in as a scheduling clerk"
        {...handlers}
      />
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Structure                                                          */
/* ------------------------------------------------------------------ */

export function ViewState() {
  const { handlers, log } = useHostLog(
    "Right-click the column. The toggles change view state, not the record.",
  );
  const [pinned, setPinned] = React.useState(true);
  const [abnormal, setAbnormal] = React.useState(false);
  const [density, setDensity] = React.useState<"comfortable" | "compact">("comfortable");

  return (
    <Stage log={log}>
      <MenuRow
        subject={{ resource: "Encounter", id: "col-vitals", label: "Vitals column" }}
        title="Vitals column"
        caption={`Flowsheet · ${pinned ? "pinned" : "unpinned"} · ${abnormal ? "abnormal only" : "all values"} · ${density}`}
        actions={[
          {
            id: "pin",
            label: "Pin this column",
            tier: "routine",
            kind: "checkbox",
            checked: pinned,
          },
          {
            id: "abn",
            label: "Abnormal values only",
            tier: "routine",
            kind: "checkbox",
            checked: abnormal,
          },
          {
            id: "comfortable",
            label: "Comfortable",
            tier: "routine",
            kind: "radio",
            radioGroup: "density",
            group: "Density",
            checked: density === "comfortable",
          },
          {
            id: "compact",
            label: "Compact",
            tier: "routine",
            kind: "radio",
            radioGroup: "density",
            group: "Density",
            checked: density === "compact",
          },
        ]}
        {...handlers}
        onToggle={(action, checked) => {
          handlers.onToggle(action, checked);
          if (action.id === "pin") setPinned(checked);
          if (action.id === "abn") setAbnormal(checked);
          if (action.radioGroup === "density" && checked) {
            setDensity(action.id as "comfortable" | "compact");
          }
        }}
      />
    </Stage>
  );
}

export function SubmenuBeside() {
  const { handlers, log } = useHostLog("Right-click the result and open Trend.");
  return (
    <Stage log={log}>
      <MenuRow
        subject={POTASSIUM}
        actions={[
          { id: "open", label: "Open result", tier: "routine", shortcut: "↵" },
          { id: "range", label: "Show reference range", tier: "routine" },
          {
            id: "trend",
            label: "Trend",
            tier: "routine",
            submenu: [
              { id: "t7", label: "Last 7 days", tier: "routine" },
              { id: "t30", label: "Last 30 days", tier: "routine" },
              { id: "t365", label: "Last year", tier: "routine" },
            ],
          },
        ]}
        aside="09:12"
        {...handlers}
      />
    </Stage>
  );
}
