"use client";

/**
 * The live ChartContextMenu demos.
 *
 * The real component, driven the way a reader would drive it. Two wrappers
 * rather than one, because a menu has a problem no other component here has:
 * it is invisible until someone summons it, and a documentation surface that
 * shows nothing until you right-click is a documentation surface most people
 * scroll past.
 *
 * `ContextMenuStage` is the interactive one — a chart pane with real rows, and
 * the reader summons the menu themselves. `ContextMenuArt` opens one on mount
 * for the catalogue card, where there is no reader to summon anything.
 *
 * Both portal into their own bounded stage rather than into `<body>`, using the
 * component's `container` prop. A card is a contained region, so a `fixed`
 * popup would position against the card and not the viewport; `container` is
 * what makes the coordinates rebase.
 */

import * as React from "react";
import {
  ChartContextMenu,
  type ChartMenuAction,
  type MenuSubject,
} from "@/registry/zoblocks/chart-context-menu/chart-context-menu";

/** Fixed, because the disclosure record takes its timestamp as a prop. */
const NOW = "2026-08-31T09:24:00-04:00";

const POLICY = { role: "a registered nurse", breakGlass: true } as const;

export const MEDICATION: MenuSubject = {
  resource: "MedicationRequest",
  id: "med-4471",
  label: "Lisinopril 10 mg",
  detail: "Oral · daily · started 4 Mar 2026",
};

const RESULT: MenuSubject = {
  resource: "Observation",
  id: "obs-8812",
  label: "Potassium 6.8 mmol/L",
  detail: "Critical high · preliminary · 09:12 today",
};

const RESTRICTED: MenuSubject = {
  resource: "DocumentReference",
  id: "doc-9911",
  label: "Group therapy note — Nwosu, C.",
  detail: "Signed by R. Adeyemi, LPC",
  masked: true,
};

export const MEDICATION_ACTIONS: ChartMenuAction[] = [
  { id: "open", label: "Open order", tier: "routine", shortcut: "↵" },
  { id: "copy", label: "Copy as text", tier: "routine", shortcut: "⌘C" },
  { id: "history", label: "Administration history", tier: "routine" },
  {
    id: "mar",
    label: "Add a note to the MAR",
    tier: "documented",
    applies: ["MedicationRequest"],
    records: "Writes a note on the medication record. Nursing sees it at the next round.",
  },
  {
    id: "dc",
    label: "Discontinue",
    tier: "clinical",
    applies: ["MedicationRequest"],
    confirm: "The next scheduled dose is 14:00 today. Discontinuing stops it.",
    confirmVerb: "Discontinue",
  },
  {
    id: "renew",
    label: "Renew for 90 days",
    tier: "clinical",
    applies: ["MedicationRequest"],
    confirm: "Issues a new order in your name.",
    availability: {
      status: "unavailable",
      reason: "Prescriber role required — you are signed in as a registered nurse",
    },
  },
  {
    id: "delete",
    label: "Delete order",
    tier: "clinical",
    applies: ["MedicationRequest"],
    confirm: "Removes the order entirely.",
    availability: { status: "withheld" },
  },
];

const RESULT_ACTIONS: ChartMenuAction[] = [
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
  {
    id: "portal",
    label: "Release to patient portal",
    tier: "documented",
    applies: ["Observation"],
    records: "Publishes the value to the patient's portal immediately.",
    availability: {
      status: "unavailable",
      reason: "Preliminary results are not released. This one has not been verified by the lab.",
    },
  },
  {
    id: "ack",
    label: "Acknowledge critical result",
    tier: "clinical",
    applies: ["Observation"],
    confirm: "Recorded against your name, and it stops the escalation page due at 09:42.",
    confirmVerb: "Acknowledge",
  },
];

const NOTE_ACTIONS: ChartMenuAction[] = [
  { id: "open", label: "Open note", tier: "routine" },
  { id: "print", label: "Print", tier: "routine", shortcut: "⌘P" },
  {
    id: "addendum",
    label: "Add an addendum",
    tier: "documented",
    applies: ["DocumentReference"],
    records: "Appended and timestamped. The original text is never altered.",
  },
  {
    id: "part2",
    label: "Reveal Part 2 content",
    tier: "disclosive",
    applies: ["DocumentReference"],
    reasons: [
      "Treatment of this patient",
      "Medical emergency (42 CFR §2.51)",
      "Written patient consent on file",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* A chart row                                                        */
/* ------------------------------------------------------------------ */

function Row(props: {
  subject: MenuSubject;
  actions: ChartMenuAction[];
  container: HTMLElement | null;
  right?: string;
  onEvent?: (line: string) => void;
}) {
  const { subject, actions, container, right, onEvent } = props;
  return (
    <ChartContextMenu
      subject={subject}
      actions={actions}
      policy={POLICY}
      now={NOW}
      container={container}
      onRun={(action) => onEvent?.(`onRun("${action.id}") — ${action.label}`)}
      onBlocked={(_action, reason) => onEvent?.(`Blocked — ${reason}`)}
      onDisclose={(record) => onEvent?.(`onDisclose — ${record.action}, ${record.outcome}`)}
    >
      {(trigger) => (
        <div
          {...trigger}
          className="flex select-none items-center gap-3 rounded-md border border-[var(--zb-border)] bg-[var(--zb-surface)] px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--zb-focus-ring)]"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-[var(--zb-text)]">
              {subject.masked ? "Restricted record" : subject.label}
            </span>
            <span className="block truncate text-xs text-[var(--zb-text-subtle)]">
              {subject.masked ? "42 CFR Part 2 · not disclosed" : subject.detail}
            </span>
          </span>
          {right ? (
            <span className="shrink-0 text-xs tabular-nums text-[var(--zb-text-subtle)]">
              {right}
            </span>
          ) : null}
        </div>
      )}
    </ChartContextMenu>
  );
}

/* ------------------------------------------------------------------ */
/* The interactive stage                                              */
/* ------------------------------------------------------------------ */

/**
 * Three rows a reader can right-click, and a line reporting what the host was
 * told. The restricted row is the one worth trying second: same component,
 * same props shape, and a menu that will not resolve the name.
 */
export function ContextMenuStage() {
  const [event, setEvent] = React.useState<string | null>(null);

  /*
   * No `container` here, deliberately. The preview sits inside a stage that
   * clips, and a menu portalled into it is a menu with its bottom half cut
   * off — which is exactly the clipping the default `<body>` portal exists to
   * escape. The card art below is the opposite case: a thumbnail that must
   * stay inside its own box.
   */
  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Row
          subject={MEDICATION}
          actions={MEDICATION_ACTIONS}
          container={null}
          right="14:00"
          onEvent={setEvent}
        />
        <Row
          subject={RESULT}
          actions={RESULT_ACTIONS}
          container={null}
          right="09:12"
          onEvent={setEvent}
        />
        <Row
          subject={RESTRICTED}
          actions={NOTE_ACTIONS}
          container={null}
          right="28 Aug"
          onEvent={setEvent}
        />
      </div>
      <p className="m-0 min-h-5 text-xs text-[var(--zb-text-muted)]">
        {event ?? "Right-click a row, or focus one and press Shift+F10."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card art                                                           */
/* ------------------------------------------------------------------ */

/**
 * One row with its menu already open, for the catalogue card.
 *
 * Opened by dispatching the same `contextmenu` event a pointer would, rather
 * than by adding a prop the component does not otherwise need. A card has no
 * reader to summon anything, and a thumbnail of an empty row would say nothing
 * about what the component is.
 */
export function ContextMenuArt({ featured = false }: { featured?: boolean }) {
  const [stage, setStage] = React.useState<HTMLDivElement | null>(null);
  const rowRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const row = rowRef.current?.firstElementChild as HTMLElement | undefined;
    const box = row?.getBoundingClientRect();
    if (!row || !box) return;
    row.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        clientX: box.left + 14,
        clientY: box.top + 10,
      }),
    );
  }, []);

  return (
    <div
      ref={setStage}
      className="relative overflow-hidden rounded-[10px] bg-[var(--zb-bg-subtle)] p-3"
      style={{
        inlineSize: "100%",
        maxInlineSize: featured ? 340 : 268,
        blockSize: featured ? 168 : 148,
        contain: "layout paint",
      }}
      // The card is decorative: the real component is one scroll further down.
      aria-hidden="true"
    >
      <div ref={rowRef}>
        <Row
          subject={MEDICATION}
          actions={MEDICATION_ACTIONS.slice(0, 5)}
          container={stage}
          right="14:00"
        />
      </div>
    </div>
  );
}
