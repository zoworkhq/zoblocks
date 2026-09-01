"use client";

/**
 * ChartContextMenu — a right-click menu that names what it is about before it
 * offers to change it.
 *
 *     <ChartContextMenu
 *       subject={{ resource: "MedicationRequest", id, label: "Lisinopril 10 mg" }}
 *       actions={medicationActions}
 *       policy={{ role: "a registered nurse", permitted, breakGlass: true }}
 *       now={serverTime}
 *       onRun={run}
 *       onDisclose={audit}
 *     >
 *       {(trigger) => <tr {...trigger}>{cells}</tr>}
 *     </ChartContextMenu>
 *
 * Three behaviours are the component rather than decoration on it, and all
 * three live in `@/lib/oxygen-menu` so they can be tested without a DOM.
 *
 *   The menu states its subject, and the subject row is the safe landing. The
 *   pixel under the pointer at the moment of opening is never a verb.
 *
 *   Consequence is a rank, not a boolean. The tier decides the interaction:
 *   run; run and say what was written; take a second step inside the menu;
 *   take a recorded reason.
 *
 *   The menu cannot out-disclose its trigger. A masked row produces a masked
 *   header, and a disclosure emits its record on every path — including the
 *   one where the reader read the reasons and backed out.
 *
 * `children` is a render function rather than an element because in a data
 * grid the trigger is a `<tr>` you do not own, and a component that wraps it
 * in a `<div>` has broken the table.
 *
 * Styling lives in `styles/oxygen-menu.css`, installed alongside.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  RESOURCE_WORD,
  actionOutcome,
  describeHiddenActions,
  disclosureRecord,
  focusableRows,
  matchFirstLetter,
  nextIndex,
  resolveMenu,
  type ActionTier,
  type DisclosureRecord,
  type MenuAction,
  type MenuOutcome,
  type MenuPolicy,
  type MenuSubject,
  type ResolvedAction,
} from "@/lib/oxygen-menu";

export {
  ACTION_TIER_LABEL,
  RESOURCE_WORD,
  TIER_ORDER,
  TIER_RULE,
  actionOutcome,
  appliesTo,
  bulkPartition,
  describeHiddenActions,
  describeSubject,
  disclosureRecord,
  focusableRows,
  matchFirstLetter,
  nextIndex,
  resolveMenu,
  tierOf,
  toPaletteItems,
  validateActions,
  type ActionKind,
  type ActionTier,
  type Availability,
  type BulkBehaviour,
  type DisclosureOptions,
  type DisclosureOutcome,
  type DisclosureRecord,
  type MenuAction,
  type MenuLadder,
  type MenuOutcome,
  type MenuPolicy,
  type MenuSection,
  type MenuSubject,
  type PaletteItemLike,
  type ResolvedAction,
  type ResolvedMenu,
  type SubjectLine,
} from "@/lib/oxygen-menu";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

/**
 * A `MenuAction` with somewhere to put a glyph.
 *
 * The core has no `icon` field, because L0 holds no React
 * (ENGINEERING.md §2.2) and `React.ReactNode` would put it there. The generic
 * on `resolveMenu` carries this richer type through untouched.
 */
export interface ChartMenuAction extends MenuAction {
  icon?: React.ReactNode;
  submenu?: readonly ChartMenuAction[];
}

/** How the menu is drawn. `auto` picks the sheet on a coarse pointer or a narrow viewport. */
export type MenuPresentation = "auto" | "popup" | "anchored" | "sheet";

/** Props the host spreads onto whatever it uses as the trigger. */
export interface MenuTriggerProps {
  onContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
  /**
   * A trigger that cannot be focused cannot be opened from a keyboard, which
   * fails SC 2.1.1 outright. Inside a `role="grid"` the grid owns the roving
   * tabstop — spread this first and set your own `tabIndex` after it.
   */
  tabIndex: number;
  /**
   * A default, so a host that spreads these onto a bare `<div>` gets valid
   * ARIA rather than an axe violation. Override it after the spread when the
   * element already has a role that fits — `<tr {...trigger} role={undefined}>`
   * in a table, where `row` is right and `button` would break the grid.
   */
  role: "button";
  /**
   * `aria-haspopup`, and deliberately **not** `aria-expanded`.
   *
   * The first version carried both, and axe was right to reject it twice
   * over: `aria-expanded` is disallowed on a generic element, and on a `<tr>`
   * it is conditional on the row being expandable inside a treegrid. It was
   * also wrong on the merits — the menu is a transient popup, not content
   * belonging to the row, and announcing a row as "collapsed" is a claim about
   * structure that is not true.
   */
  "aria-haspopup": "menu";
  /**
   * Identity, always present — a styling hook for "this row owns a menu", and
   * the marker the story harness looks for to prove a story rendered
   * something of ours. `data-ox-menu-open` is the state and comes and goes.
   */
  "data-ox-menu": "";
  "data-ox-menu-open"?: "";
}

export interface ChartContextMenuProps {
  /**
   * What was right-clicked. Required, and there is no prop that suppresses
   * the header it produces: a configurable safety feature is one that is off
   * in the codebase that needed it most.
   */
  subject: MenuSubject;
  /**
   * Every verb the surface offers. One flat array; `applies` does the routing,
   * so nothing at the call site needs to know what a `MedicationRequest` is.
   */
  actions: readonly ChartMenuAction[];
  /**
   * Who is asking. Without one, nothing is withheld — correct for a demo and
   * wrong for a chart.
   */
  policy?: MenuPolicy;
  /**
   * How the menu is drawn. `auto` — the default — picks the bottom sheet on a
   * coarse pointer or below 40rem and the pointer popup everywhere else, which
   * is the choice a host almost never wants to make itself.
   */
  presentation?: MenuPresentation;
  /** Overrides the inherited density scope. */
  density?: "comfortable" | "compact";
  /**
   * An ISO instant for the disclosure record. Required whenever any action is
   * `disclosive`: the record needs a timestamp and a component may not read
   * the clock (ENGINEERING.md §9).
   */
  now?: string;
  /**
   * Runs an action. Only ever called for an outcome of `run`.
   *
   * Receives the whole subject, `also` included, so a host writes and reports
   * per subject rather than pretending twelve writes are one boolean.
   */
  onRun?: (action: ChartMenuAction, subject: MenuSubject, outcome: MenuOutcome) => void;
  /** A toggle changed. Separate from `onRun`, because view state is not an act. */
  onToggle?: (action: ChartMenuAction, checked: boolean) => void;
  /**
   * The disclosure record, on all three outcomes. The component makes it; the
   * host keeps it, because the host is the only thing that knows the actor.
   */
  onDisclose?: (record: DisclosureRecord) => void;
  /** A blocked verb was chosen. Worth wiring: repeated blocks are a permissions problem. */
  onBlocked?: (action: ChartMenuAction, reason: string) => void;
  /**
   * The menu opened or closed. For hosts that pause a poll, dismiss a hover
   * card, or count how often the right-click path is actually used — which is
   * the measurement that says whether the ⋯ button is the product.
   */
  onOpenChange?: (open: boolean, subject: MenuSubject) => void;
  /**
   * Whether opening moves focus into the menu. Defaults to `true`.
   *
   * Set `false` only for a menu the reader did not summon — a demo that opens
   * itself, a product tour, a walkthrough. Such a menu renders and reads
   * normally but leaves the caret alone; on a page that opens one every few
   * seconds the alternative is focus jumping under the reader and a screen
   * reader announcing a menu nobody asked for.
   *
   * A prop rather than sniffing `event.isTrusted`, which was the first attempt:
   * that inferred intent from whether a human dispatched the event, so the
   * component behaved one way in tests and another in production — which is
   * the property a test exists to rule out.
   */
  autoFocus?: boolean;
  /**
   * Where the popup is portalled. Defaults to `document.body`.
   *
   * Worth setting when the surrounding page scopes theme, density or `dir` on
   * an element the menu should stay inside, or when a test wants the popup in
   * the same tree it is auditing.
   */
  container?: HTMLElement | null;
  /** Lets the browser's own context menu through — the right behaviour over selected text. */
  disabled?: boolean;
  /** A render function, not an element. See the note at the top of this file. */
  children: (trigger: MenuTriggerProps) => React.ReactNode;
  /** Applied to the popup. */
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Geometry                                                           */
/* ------------------------------------------------------------------ */

/**
 * The popup's corner sits three pixels *behind* the cursor, and the sign is
 * the whole point.
 *
 * With the corner exactly on the cursor an 8px `border-radius` leaves the
 * pointer outside the menu shape — `document.elementFromPoint` returns the row
 * underneath, which makes "the first thing under the pointer is the subject
 * header" false at precisely the pixel that matters. The first attempt at this
 * pushed the menu away from the cursor and made it worse.
 */
const CURSOR_INSET = 3;

/** Distance kept from the viewport edge when the menu has to shift. */
const EDGE_PAD = 8;

/**
 * The least room worth opening downward into.
 *
 * Below this the menu flips above the cursor, and a flipped menu is the one
 * case where Rule 1 needs help — see `placeAtPoint`.
 */
const MIN_DROP = 180;

/**
 * How long a pointer must rest on a submenu trigger before it opens.
 *
 * The same 100ms Base UI uses. There is no safe triangle in v1, so the
 * mitigation for a diagonal sweep is not geometry but a rule: an open submenu
 * closes when the pointer reaches a *different row*, not when it leaves this
 * one. Crossing the gap between the two menus therefore closes nothing.
 */
const SUBMENU_DELAY = 100;

/** Long-press duration for a touch trigger, and how far a finger may drift. */
const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP = 10;

/**
 * Where the popup goes, expressed so it never depends on its own height.
 *
 * Exactly one of `top` / `bottom` is set. A menu that opens upward is anchored
 * by its *bottom* edge, because anchoring it by the top would mean subtracting
 * a height that the `maxHeight` in this same object is about to constrain —
 * a feedback loop that settled on a different answer every frame and put the
 * cursor over a row roughly one time in three.
 */
interface Placement {
  top?: number;
  bottom?: number;
  left: number;
  origin: string;
  /** Applied inline; the list scrolls inside it, the header and footer do not. */
  maxHeight: number;
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

/**
 * Where the popup goes, given the point it was summoned from.
 *
 * Flip before shift: a menu that would run off the right edge opens to the
 * *left* of the cursor rather than being pushed back under it, because a
 * shifted menu puts a verb where the subject header should be.
 */
function placeAtPoint(x: number, y: number, width: number): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const below = vh - y - EDGE_PAD;
  const above = y - EDGE_PAD * 2;

  /*
   * The menu is capped and scrolls rather than growing until it has to flip.
   * A flipped menu is the one arrangement that breaks Rule 1: because
   * consequence sorts to the bottom, opening upward would otherwise put the
   * *most* consequential verb under the cursor.
   */
  const drop = below >= MIN_DROP || below >= above;

  let left = x - CURSOR_INSET;
  let originX = "left";
  if (left + width > vw - EDGE_PAD) {
    left = x - width + CURSOR_INSET;
    originX = "right";
  }
  const clampedLeft = clamp(left, EDGE_PAD, Math.max(EDGE_PAD, vw - width - EDGE_PAD));

  if (drop) {
    return {
      top: y - CURSOR_INSET,
      left: clampedLeft,
      origin: `top ${originX}`,
      maxHeight: Math.max(MIN_DROP, below + CURSOR_INSET),
    };
  }

  /*
   * Flipped: the menu's bottom sits a padding *above* the cursor, so the
   * pointer lands in the gap below it. Not a verb, not the header — nothing.
   * That is the honest answer when the header cannot be at the cursor, and it
   * is still not a verb.
   */
  return {
    bottom: vh - (y - EDGE_PAD),
    left: clampedLeft,
    origin: `bottom ${originX}`,
    maxHeight: Math.max(MIN_DROP, above),
  };
}

/**
 * Where the popup goes when it was opened from the trigger rather than from a
 * point — the ⋯ button and the keyboard both land here.
 *
 * SC 2.4.11: focus returns to the trigger on close, so the menu may not be
 * sitting on top of it. It flips above when there is not room below.
 */
function placeAtRect(rect: DOMRect, width: number): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const below = vh - rect.bottom - EDGE_PAD;
  const above = rect.top - EDGE_PAD;
  const flip = below < MIN_DROP && above > below;
  const left = clamp(rect.left, EDGE_PAD, Math.max(EDGE_PAD, vw - width - EDGE_PAD));

  /* SC 2.4.11: never on top of the control focus returns to. */
  return flip
    ? {
        bottom: vh - rect.top + 4,
        left,
        origin: "bottom left",
        maxHeight: Math.max(MIN_DROP, above - 4),
      }
    : { top: rect.bottom + 4, left, origin: "top left", maxHeight: Math.max(MIN_DROP, below - 4) };
}

/**
 * Where a child menu goes: beside its parent row, flipping to the other side
 * when there is no room, and anchored by its bottom edge when there is not
 * room below — the same reason the parent flips that way.
 */
function placeBeside(rect: DOMRect, width: number): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = rect.right - 4;
  let originX = "left";
  if (left + width > vw - EDGE_PAD) {
    left = rect.left - width + 4;
    originX = "right";
  }
  const clampedLeft = clamp(left, EDGE_PAD, Math.max(EDGE_PAD, vw - width - EDGE_PAD));

  /* Align the child's first row with the row that opened it. */
  const top = rect.top - 4;
  const below = vh - top - EDGE_PAD;
  if (below >= MIN_DROP) {
    return { top, left: clampedLeft, origin: `top ${originX}`, maxHeight: below };
  }
  return {
    bottom: EDGE_PAD,
    left: clampedLeft,
    origin: `bottom ${originX}`,
    maxHeight: Math.max(MIN_DROP, vh - EDGE_PAD * 2),
  };
}

/**
 * The token scope the trigger sits in, as props for a portalled copy.
 *
 * Escaping the ancestor that clips you also escapes the ancestor that themes
 * you: a dark menu opened from a dark row arrives white otherwise. `dir` is
 * here for the same reason — a menu whose separators and chevrons do not
 * mirror while the row beside them does is worse than one that never mirrored.
 */
function scopeOf(element: HTMLElement | null): Record<string, string> {
  if (!element || typeof element.closest !== "function") return {};
  const scope: Record<string, string> = {};
  for (const attribute of ["data-ox-theme", "data-ox-density", "data-ox-brand", "dir"]) {
    const value = element.closest(`[${attribute}]`)?.getAttribute(attribute);
    if (value) scope[attribute] = value;
  }
  return scope;
}

/** Initials, and only for a person. "LM" for "Lisinopril 10 mg" spells nothing. */
function initialsOf(label: string): string {
  const words = label
    .replace(/[^\p{L} ]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = words.at(0) ?? "";
  const last = words.length > 1 ? (words.at(-1) ?? "") : "";
  if (!first) return "··";
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                       */
/* ------------------------------------------------------------------ */

/** A 16px slot that is always there, so every label starts at the same x. */
function Glyph({ children }: { children?: React.ReactNode }) {
  return (
    <span className="ox-menu__icon" aria-hidden="true">
      {children}
    </span>
  );
}

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ox-menu__chevron"
      aria-hidden="true"
    >
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </svg>
  );
}

function Pen() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3.5a2.1 2.1 0 0 1 3 3L7.5 19 3 20.5 4.5 16Z" />
    </svg>
  );
}

function Alert() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.2 1.8 20.8h20.4z" />
      <path d="M12 9.5v5M12 17.8v.01" />
    </svg>
  );
}

function Key() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="7.5" cy="15.5" r="4" />
      <path d="m10.4 12.6 8-8M16.5 6.5l2 2M14 9l2 2" />
    </svg>
  );
}

/**
 * The mark a tier wears when the host supplies no icon of its own.
 *
 * `routine` deliberately has none. A glyph on every row would be decoration;
 * a glyph on the rows that cost something is signal, and the empty slot keeps
 * every label starting at the same x, which is what the fixed column was for.
 *
 * This exists because the first version left the column to the host, and a
 * host that passed no icons — the docs demo among them — got no glyph and no
 * hue, since the tier colour is carried on the glyph. `Discontinue` and
 * `Copy as text` rendered identically, which made this component's own
 * SC 1.4.1 claim ("a glyph, a band position and a word as well as a hue")
 * false wherever anyone actually used it.
 */
const TIER_GLYPH: Record<ActionTier, React.ReactNode> = {
  routine: null,
  documented: <Pen />,
  clinical: <Alert />,
  disclosive: <Key />,
};

function Pill() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m10.5 20.5-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z" />
      <path d="m7 10 7 7" />
    </svg>
  );
}

function Flask() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 3v6.5L3.6 18A2 2 0 0 0 5.3 21h13.4a2 2 0 0 0 1.7-3L15 9.5V3" />
      <path d="M7.5 3h9M6.2 15h11.6" />
    </svg>
  );
}

function Doc() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

/**
 * What the subject header wears when the subject is not a person.
 *
 * Initials are a person's affordance and spell nonsense on anything else, but
 * the first fix — a single letter from the resource word — reads as an avatar
 * for somebody called "M". A glyph says "medication" the way initials say
 * "person", and both are the same 24px circle.
 */
const SUBJECT_GLYPH: Record<string, React.ReactNode> = {
  MedicationRequest: <Pill />,
  MedicationStatement: <Pill />,
  Observation: <Flask />,
  DiagnosticReport: <Flask />,
  DocumentReference: <Doc />,
  AllergyIntolerance: <Alert />,
  Condition: <Doc />,
  Encounter: <Doc />,
  Task: <Doc />,
  CarePlan: <Doc />,
  ServiceRequest: <Doc />,
  Immunization: <Pill />,
};

function Lock() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function People() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.6 20a6.4 6.4 0 0 1 12.8 0M16.5 5.2a3.4 3.4 0 0 1 0 5.6M18 20a6.4 6.4 0 0 0-2-4.6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* The component                                                      */
/* ------------------------------------------------------------------ */

interface OpenState {
  /**
   * Where it was summoned from, as an offset *inside the trigger* rather than
   * a viewport coordinate.
   *
   * Storing the viewport point looked right and was subtly wrong: the moment
   * anything scrolled, the point named a place the row was no longer at. The
   * first fix closed the menu on scroll, which then closed it whenever the
   * browser scrolled the row into view a frame before the click that opened
   * it — including every time Playwright clicked a row. An offset makes the
   * menu track its subject instead, which is what it was always about.
   */
  point: { dx: number; dy: number } | null;
  presentation: Exclude<MenuPresentation, "auto">;
  /** True when a keyboard opened it, which is the only case that pre-highlights a row. */
  fromKeyboard: boolean;
}

export function ChartContextMenu(props: ChartContextMenuProps) {
  const {
    subject,
    actions,
    policy,
    presentation = "auto",
    density,
    now,
    onRun,
    onToggle,
    onDisclose,
    onBlocked,
    onOpenChange,
    autoFocus = true,
    container,
    disabled = false,
    children,
    className,
  } = props;

  const [open, setOpen] = React.useState<OpenState | null>(null);
  const [box, setBox] = React.useState<Placement | null>(null);
  const [active, setActive] = React.useState(-1);
  const [confirming, setConfirming] = React.useState<string | null>(null);
  const [reasoning, setReasoning] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  /** Bumped to re-run placement when an anchored menu's element has moved. */
  const [tick, setTick] = React.useState(0);
  /** The open child menu: the id of the row that owns it, and how it was opened. */
  const [sub, setSub] = React.useState<{ id: string; fromKeyboard: boolean } | null>(null);

  /*
   * `useId`, not a constant. The panel is portalled into `<body>`, so two
   * mounted menus with a literal id would give the document duplicate ids and
   * `aria-labelledby` would resolve to whichever came first — which is the
   * wrong patient's name on the other menu.
   */
  const subjectId = `${React.useId()}-subject`;
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  /*
   * Keyed by action id rather than by index. An inline ref callback has a new
   * identity every render, so React detaches every row and reattaches it; with
   * an array, a detach closure holding last render's index writes `null` over
   * a slot the new render already filled once the sections shift.
   */
  const rowRefs = React.useRef(new Map<string, HTMLDivElement | null>());
  const pressRef = React.useRef<{ timer: number; x: number; y: number } | null>(null);
  /** The hover-intent timer for a submenu trigger. */
  const subTimerRef = React.useRef<number | null>(null);
  /**
   * The child menu's own element.
   *
   * The child is a second portal, so it is not inside `panelRef` — and the
   * outside-click listener therefore treated a click on one of its items as a
   * click away, dismissing everything on `mousedown` before the `click` that
   * would have run it. Every submenu item was inert.
   */
  const subPanelRef = React.useRef<HTMLElement | null>(null);
  /**
   * The open state, readable synchronously.
   *
   * The trigger handlers are built during render, so `open` inside them is the
   * value from *before* the keydown that just opened the menu. Chromium fires
   * its synthesised `contextmenu` in the same tick, so the state guard read
   * `null` and the menu opened a second time as a pointer open — dropping the
   * highlight the keyboard user had just been given.
   */
  const openRef = React.useRef<OpenState | null>(null);
  /** Set by `close(true)`; consumed by the effect that puts focus back. */
  const restoreFocusRef = React.useRef(false);

  /*
   * A disclosure that was offered and abandoned is still a disclosure, and it
   * is recorded on every close path — Escape, click-away, and an external
   * close alike. Kept in a ref so the cleanup that fires on close can see it
   * without the effect re-running every time the ladder moves.
   */
  const reasoningRef = React.useRef<string | null>(null);
  reasoningRef.current = reasoning;

  /**
   * The container, when it is one the popup must position *within* rather than
   * against the viewport. `null` for the ordinary `<body>` case.
   */
  const contained =
    container && typeof document !== "undefined" && container !== document.body ? container : null;

  // A portal needs a document, and the server has none.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const resolved = React.useMemo(
    () => resolveMenu<ChartMenuAction>(subject, actions, policy ?? {}),
    [subject, actions, policy],
  );
  const rows = React.useMemo(() => focusableRows(resolved), [resolved]);
  const withheldSentence = describeHiddenActions(resolved.withheld, policy ?? {});

  const emitDisclosure = React.useCallback(
    (action: ChartMenuAction, outcome: "offered" | "disclosed" | "abandoned", reason?: string) => {
      if (!onDisclose) return;
      const record = disclosureRecord(action, subject, {
        /*
         * `now` is required by the docs whenever an action is disclosive. The
         * empty string is what a host that forgot gets: a record with a blank
         * timestamp is obviously broken, where `new Date()` would be silently
         * untestable and would make the component non-deterministic.
         */
        now: now ?? "",
        outcome,
        reason: reason ?? null,
        breakGlass: Boolean(policy?.breakGlass),
      });
      if (record) onDisclose(record);
    },
    [onDisclose, subject, now, policy],
  );

  const close = React.useCallback(
    (returnFocus = true) => {
      const pending = reasoningRef.current;
      if (pending) {
        const action = actions.find((candidate) => candidate.id === pending);
        if (action) emitDisclosure(action, "abandoned");
      }
      reasoningRef.current = null;
      openRef.current = null;
      setOpen(null);
      setBox(null);
      setActive(-1);
      setConfirming(null);
      setReasoning(null);
      /*
       * Restored in an effect, not here.
       *
       * Calling `.focus()` synchronously looked right and lost a race under
       * load: a passive focus effect from the placement render could still be
       * pending, and React flushes it after this handler — so it moved focus
       * back into a popup that was about to unmount, and the unmount dropped
       * focus to `<body>`. It reproduced about one full-suite run in three and
       * never in isolation, which is the worst kind of flake to inherit.
       */
      restoreFocusRef.current = returnFocus;
      onOpenChange?.(false, subject);
    },
    [actions, emitDisclosure, onOpenChange, subject],
  );

  /* ---- opening ---------------------------------------------------- */

  const start = React.useCallback(
    (element: HTMLElement, next: OpenState) => {
      triggerRef.current = element;
      openRef.current = next;
      reasoningRef.current = null;
      setConfirming(null);
      setReasoning(null);
      setBox(null);
      setActive(next.fromKeyboard ? nextIndex(rows, -1, 1, false) : -1);
      setOpen(next);
      setAnnouncement(
        `${resolved.count} ${resolved.count === 1 ? "action" : "actions"} for ${resolved.subject.who}` +
          (resolved.withheld ? `, ${resolved.withheld} hidden` : ""),
      );
      onOpenChange?.(true, subject);
    },
    [onOpenChange, resolved, rows, subject],
  );

  const chooseMode = React.useCallback(
    (requested: Exclude<MenuPresentation, "auto">): Exclude<MenuPresentation, "auto"> => {
      if (presentation !== "auto") return presentation;
      if (requested === "sheet") return "sheet";
      if (typeof window === "undefined") return requested;
      const narrow = window.matchMedia?.("(max-width: 40rem)")?.matches;
      const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
      return narrow || coarse ? "sheet" : requested;
    },
    [presentation],
  );

  const cancelPress = React.useCallback(() => {
    if (pressRef.current) {
      window.clearTimeout(pressRef.current.timer);
      pressRef.current = null;
    }
  }, []);

  const trigger: MenuTriggerProps = {
    tabIndex: 0,
    role: "button",
    "aria-haspopup": "menu",
    "data-ox-menu": "",
    ...(open !== null ? { "data-ox-menu-open": "" as const } : {}),

    onContextMenu: (event) => {
      if (disabled) return;
      event.preventDefault();
      /*
       * Chromium and Firefox synthesise a `contextmenu` event for Shift+F10 in
       * addition to the keydown, and `preventDefault` on the keydown does not
       * suppress it. Without this guard the menu opens twice — the second time
       * as a pointer open, which drops the highlight the keyboard user needs
       * and leaves them on a menu with nothing selected. A genuine right-click
       * while this is open cannot reach here: its `mousedown` closes the menu
       * first.
       */
      if (openRef.current?.fromKeyboard) return;
      const box = event.currentTarget.getBoundingClientRect();
      start(event.currentTarget, {
        point: { dx: event.clientX - box.left, dy: event.clientY - box.top },
        presentation: chooseMode("popup"),
        fromKeyboard: false,
      });
    },

    onKeyDown: (event) => {
      if (disabled) return;
      /*
       * Shift+F10 and the Menu key, handled rather than left to the browser.
       * Chrome and Firefox synthesise a `contextmenu` event for both; Safari
       * does not, and a right-click-only feature fails SC 2.1.1 outright.
       */
      const wanted = event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");
      if (!wanted) return;
      event.preventDefault();
      start(event.currentTarget, {
        point: null,
        presentation: chooseMode("anchored"),
        fromKeyboard: true,
      });
    },

    onPointerDown: (event) => {
      if (disabled || event.pointerType !== "touch") return;
      const element = event.currentTarget;
      const { clientX: x, clientY: y } = event;
      cancelPress();
      pressRef.current = {
        x,
        y,
        timer: window.setTimeout(() => {
          pressRef.current = null;
          const box = element.getBoundingClientRect();
          start(element, {
            point: { dx: x - box.left, dy: y - box.top },
            presentation: "sheet",
            fromKeyboard: false,
          });
        }, LONG_PRESS_MS),
      };
    },

    /*
     * A press that drifts is a scroll, not a long press. Without this, a nurse
     * carrying a tablet opens menus with their palm.
     */
    onPointerMove: (event) => {
      const press = pressRef.current;
      if (!press) return;
      if (
        Math.abs(event.clientX - press.x) > LONG_PRESS_SLOP ||
        Math.abs(event.clientY - press.y) > LONG_PRESS_SLOP
      ) {
        cancelPress();
      }
    },
    onPointerUp: cancelPress,
    onPointerCancel: cancelPress,
  };

  /* ---- placement, dismissal, and the events that must close it ----- */

  React.useLayoutEffect(() => {
    if (!open || !mounted || open.presentation === "sheet") return undefined;

    const place = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const w = panel.offsetWidth;
      /* Only used to clamp inside a container — never to size the menu. */
      const h = panel.offsetHeight;
      const rect = triggerRef.current?.getBoundingClientRect?.();
      if (!rect) return;
      const next = open.point
        ? placeAtPoint(rect.left + open.point.dx, rect.top + open.point.dy, w)
        : placeAtRect(rect, w);
      if (!next) return;
      /*
       * Everything above is in viewport coordinates, which is what a pointer
       * event gives you and what `position: fixed` wants. A container that is
       * not `<body>` is almost always a contained or transformed region — the
       * two things that make a fixed element position against *it* rather than
       * against the viewport — so the offsets are rebased and the popup
       * switches to `absolute`. Without this the menu lands correctly on a
       * page and hundreds of pixels away inside a docs card.
       */
      if (contained) {
        const box = contained.getBoundingClientRect();
        /*
         * Clamped to the container, not to the viewport.
         *
         * `placeAtPoint` works in viewport terms because that is what a pointer
         * event gives you — but a host that portals into a bounded pane has told
         * us the pane is the boundary, and the viewport has nothing to do with
         * what clips. On the home page a menu opened from the third row of a
         * worklist lost its withheld count off the bottom of the stage, which is
         * the one row that must never be the one that goes missing.
         *
         * Only the offset is clamped. `maxHeight` stays the viewport's, so this
         * cannot re-enter the loop that measuring a height while capping it
         * caused.
         */
        const pad = EDGE_PAD;
        const viewportTop =
          next.top === undefined ? window.innerHeight - (next.bottom ?? 0) - h : next.top;
        setBox({
          top: clamp(
            viewportTop - box.top + contained.scrollTop,
            pad,
            Math.max(pad, contained.clientHeight - h - pad),
          ),
          left: clamp(
            next.left - box.left + contained.scrollLeft,
            pad,
            Math.max(pad, contained.clientWidth - w - pad),
          ),
          origin: next.origin,
          maxHeight: next.maxHeight,
        });
      } else {
        setBox(next);
      }
    };

    place();
    // A second pass once the panel has a measured height, so the flip decision
    // is made against the real one rather than against zero.
    const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame(place) : null;
    return () => {
      if (raf !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
    };
    // `resolved` is a dependency because the confirm strip changes the height,
    // and a taller menu near the bottom edge has to move to stay on screen.
  }, [open, mounted, confirming, reasoning, resolved, contained, tick]);

  React.useEffect(() => {
    if (!open || !mounted) return undefined;

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (subPanelRef.current?.contains(target)) return;
      close(false);
    };
    /*
     * Both kinds of menu follow their trigger, because both are anchored to it
     * — one to a point inside it, one to its edge. A resize still closes: a
     * rotation or a pane resize reflows the layout the placement was computed
     * against, and there is no correct place to put a stale popup.
     */
    const onScroll = () => setTick((value) => value + 1);
    const onResize = () => close(false);

    document.addEventListener("mousedown", onPointer);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, mounted, close]);

  React.useEffect(() => {
    if (!open) return;
    /*
     * Stand down while a keyboard-opened child has focus.
     *
     * React runs a child's effects before its parent's, so opening a submenu
     * ran the child's focus effect and then this one — and this one won,
     * putting focus back on the trigger row while the child sat open and
     * unreachable. jsdom did not reproduce it; Chromium did, first try.
     */
    if (sub?.fromKeyboard) return;
    /* A menu the reader did not summon does not take their focus. */
    if (!autoFocus) return;
    /*
     * `preventScroll`, and it is load-bearing rather than tidy.
     *
     * The popup is portalled and absolutely placed. Focusing it without this
     * makes the browser scroll it into view — which moves the trigger, which
     * looks to the scroll handler exactly like the reader scrolling away, so
     * the menu closed itself the instant it opened. It reproduced only in a
     * real browser; jsdom does not scroll on focus.
     */
    const id = active >= 0 ? rows[active]?.action.id : undefined;
    const target = id ? rowRefs.current.get(id) : panelRef.current;
    /*
     * Re-placing on every scroll event re-runs this effect, and a scroll that
     * settles over a few hundred milliseconds fires dozens of them. Focusing
     * something that already has focus is not free — it re-fires focus events
     * the host may be listening to.
     */
    if (target && document.activeElement !== target) target.focus({ preventScroll: true });
    /*
     * `box` is a dependency, and it is the whole reason the keyboard path
     * worked in jsdom and not in a browser. Until the popup has been placed it
     * renders `visibility: hidden`, and a hidden element cannot take focus —
     * the call succeeded silently and focus stayed on the trigger. Re-running
     * once the placement lands is what actually arms the first verb.
     */
  }, [open, active, rows, confirming, reasoning, box, sub, autoFocus]);

  /*
   * Focus goes back to the trigger once the popup is gone, and only then.
   *
   * Keyed on `open` becoming null rather than on unmount, so it runs after
   * every effect the open menu owned — the ordering the synchronous version
   * could not guarantee. The ref makes it one-shot: without it this would take
   * focus on the initial mount, where `open` is null too.
   */
  React.useEffect(() => {
    if (open || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    triggerRef.current?.focus?.();
  }, [open]);

  const cancelSubTimer = React.useCallback(() => {
    if (subTimerRef.current !== null) {
      window.clearTimeout(subTimerRef.current);
      subTimerRef.current = null;
    }
  }, []);

  const closeSub = React.useCallback(
    (returnFocus: boolean) => {
      cancelSubTimer();
      setSub((current) => {
        if (current && returnFocus) {
          rowRefs.current.get(current.id)?.focus?.({ preventScroll: true });
        }
        return null;
      });
    },
    [cancelSubTimer],
  );

  /* Closing the whole menu closes the child with it. */
  React.useEffect(() => {
    if (!open) {
      cancelSubTimer();
      setSub(null);
    }
  }, [open, cancelSubTimer]);

  /* ---- running ----------------------------------------------------- */

  const runAction = React.useCallback(
    (action: ChartMenuAction, outcome: MenuOutcome) => {
      if (outcome.kind === "run" && outcome.reason) {
        emitDisclosure(action, "disclosed", outcome.reason);
        reasoningRef.current = null;
      }
      onRun?.(action, subject, outcome);
      close();
    },
    [close, emitDisclosure, onRun, subject],
  );

  const choose = React.useCallback(
    (row: ResolvedAction<ChartMenuAction>, index: number) => {
      const { action } = row;
      const outcome = actionOutcome(
        { ...action, availability: row.availability },
        { confirming, reasoning, reason: null },
        resolved.bulk,
      );

      if (outcome.kind === "blocked") {
        onBlocked?.(action, outcome.reason);
        return;
      }
      if (outcome.kind === "toggle") {
        onToggle?.(action, !action.checked);
        return;
      }
      if (outcome.kind === "submenu") {
        /*
         * A click, Enter or ArrowRight is a commitment, so it takes focus.
         * Hover opens through `armSub` instead and deliberately does not.
         */
        cancelSubTimer();
        setActive(index);
        setSub({ id: action.id, fromKeyboard: true });
        return;
      }
      if (outcome.kind === "confirm") {
        setConfirming(action.id);
        setReasoning(null);
        setActive(index);
        return;
      }
      if (outcome.kind === "reason") {
        setReasoning(action.id);
        reasoningRef.current = action.id;
        setConfirming(null);
        setActive(index);
        /* Recorded when the list is *offered*, not when it is answered. */
        emitDisclosure(action, "offered");
        return;
      }
      runAction(action, outcome);
    },
    [
      confirming,
      reasoning,
      resolved.bulk,
      onBlocked,
      onToggle,
      emitDisclosure,
      runAction,
      cancelSubTimer,
    ],
  );

  /* ---- keyboard ---------------------------------------------------- */

  const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        setActive(nextIndex(rows, active, event.key === "ArrowDown" ? 1 : -1, true));
        return;
      case "Home":
        event.preventDefault();
        setActive(nextIndex(rows, -1, 1, false));
        return;
      case "End":
        event.preventDefault();
        setActive(nextIndex(rows, rows.length, -1, false));
        return;
      case "ArrowRight": {
        /* Only meaningful on a row that has children; otherwise it is a no-op
           rather than a caret move, because there is no text to move through. */
        const row = active >= 0 ? rows[active] : undefined;
        if (row?.action.submenu?.length) {
          event.preventDefault();
          choose(row, active);
        }
        return;
      }
      case "ArrowLeft":
        if (sub) {
          event.preventDefault();
          closeSub(true);
        }
        return;
      case "Enter":
      case " ": {
        const row = active >= 0 ? rows[active] : undefined;
        if (row) {
          event.preventDefault();
          choose(row, active);
        }
        return;
      }
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        /* One level at a time — Base UI's `closeParentOnEsc: false`, and the
           behaviour every desktop menu has. */
        if (sub) closeSub(true);
        else close();
        return;
      case "Tab":
        // A menu is not a place to Tab through. Closing keeps the tab order
        // the page's rather than trapping focus in a transient popup.
        close();
        return;
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          const found = matchFirstLetter(rows, event.key, active);
          if (found !== active) {
            event.preventDefault();
            setActive(found);
          }
        }
    }
  };

  /* ---- rendering --------------------------------------------------- */

  if (!open || !mounted) return <>{children(trigger)}</>;

  const isSheet = open.presentation === "sheet";
  /*
   * Looked up from the *resolved* rows rather than from `actions`, so a child
   * cannot outlive a parent the policy withheld or a bulk selection disabled.
   */
  const subAction = sub ? (rows.find((row) => row.action.id === sub.id)?.action ?? null) : null;
  let flat = -1;

  const panel = (
    <div
      ref={panelRef}
      role="menu"
      tabIndex={-1}
      aria-labelledby={subjectId}
      aria-orientation="vertical"
      className={cn(
        "ox-menu",
        isSheet && "ox-menu--sheet",
        open.presentation === "anchored" && "ox-menu--anchored",
        className,
      )}
      style={
        isSheet
          ? undefined
          : box
            ? ({
                ...(box.top === undefined ? { bottom: box.bottom } : { top: box.top }),
                left: box.left,
                maxBlockSize: box.maxHeight,
                // A custom property, which `CSSProperties` has no room for.
                "--ox-menu-origin": box.origin,
              } as unknown as React.CSSProperties)
            : ({ visibility: "hidden", top: 0, left: 0 } as React.CSSProperties)
      }
      onKeyDown={onPanelKeyDown}
      {...(contained ? { "data-ox-contained": "" } : {})}
      {...scopeOf(triggerRef.current)}
      {...(density ? { "data-ox-density": density } : {})}
    >
      {isSheet ? <div className="ox-menu__grip" aria-hidden="true" /> : null}

      {/* Region one. Always. Never interactive. Names the popup. */}
      <div
        id={subjectId}
        className="ox-menu__subject"
        role="presentation"
        {...(resolved.subject.masked ? { "data-ox-masked": "" } : {})}
      >
        <span className="ox-menu__avatar" aria-hidden="true">
          {resolved.subject.bulk > 1 ? (
            <People />
          ) : resolved.subject.masked ? (
            <Lock />
          ) : subject.resource === "Patient" || subject.resource === "Practitioner" ? (
            initialsOf(resolved.subject.who)
          ) : (
            (SUBJECT_GLYPH[subject.resource] ?? (
              /* Anything the map does not know still gets its type's initial
                 rather than an empty circle. */
              <span>
                {(RESOURCE_WORD[subject.resource] ?? subject.resource).charAt(0).toUpperCase()}
              </span>
            ))
          )}
        </span>
        <span>
          <span className="ox-menu__who">{resolved.subject.who}</span>
          {resolved.subject.what ? (
            <span className="ox-menu__what">{resolved.subject.what}</span>
          ) : null}
        </span>
      </div>

      <div className="ox-menu__list">
        {resolved.sections.length === 0 ? (
          <p className="ox-menu__empty">
            {resolved.withheld
              ? "No action on this record is available to you."
              : "This record supports no actions."}
          </p>
        ) : null}

        {resolved.sections.map((section, sectionIndex) => (
          <React.Fragment key={`${section.tier}-${section.label ?? ""}`}>
            {sectionIndex > 0 ? <hr className="ox-menu__separator" /> : null}
            {section.label ? <div className="ox-menu__group">{section.label}</div> : null}
            {section.items.map((row) => {
              flat += 1;
              const index = flat;
              const { action, tier, availability } = row;
              const pending = availability.status === "pending";
              const blocked = availability.status === "unavailable";
              const toggle = action.kind === "checkbox" || action.kind === "radio";

              const note = pending
                ? "Checking…"
                : blocked
                  ? availability.reason
                  : tier === "documented"
                    ? action.records
                    : undefined;

              return (
                <React.Fragment key={action.id}>
                  <div
                    ref={(node) => {
                      if (node) rowRefs.current.set(action.id, node);
                      else rowRefs.current.delete(action.id);
                    }}
                    id={action.submenu?.length ? `${subjectId}-${action.id}` : undefined}
                    role={
                      action.kind === "checkbox"
                        ? "menuitemcheckbox"
                        : action.kind === "radio"
                          ? "menuitemradio"
                          : "menuitem"
                    }
                    tabIndex={active === index ? 0 : -1}
                    className="ox-menu__item"
                    data-ox-tier={tier}
                    {...(pending ? { "data-ox-pending": "" } : {})}
                    {...(active === index ? { "data-ox-active": "" } : {})}
                    {...(toggle ? { "aria-checked": Boolean(action.checked) } : {})}
                    {...(action.submenu?.length
                      ? {
                          "aria-haspopup": "menu" as const,
                          /* Allowed on `menuitem`, unlike on the generic
                             trigger element — and here it is true: this row
                             really does own a menu that opens and closes. */
                          "aria-expanded": sub?.id === action.id,
                        }
                      : {})}
                    {...(pending || blocked ? { "aria-disabled": true } : {})}
                    onMouseEnter={(event) => {
                      setActive(index);
                      cancelSubTimer();
                      if (action.submenu?.length) {
                        if (sub?.id === action.id) return;
                        const target = event.currentTarget;
                        subTimerRef.current = window.setTimeout(() => {
                          subTimerRef.current = null;
                          /* Hover has committed to nothing, so this does not
                             take focus — see the note on `Submenu`. */
                          if (target.isConnected) setSub({ id: action.id, fromKeyboard: false });
                        }, SUBMENU_DELAY);
                        return;
                      }
                      /*
                       * Reaching a *different* row is what closes an open
                       * child, rather than leaving the trigger. Without a safe
                       * triangle that is the difference between a diagonal
                       * sweep working and a menu that shuts under the pointer.
                       */
                      if (sub) closeSub(false);
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      choose(row, index);
                    }}
                  >
                    {toggle ? (
                      <span
                        className="ox-menu__indicator"
                        data-ox-shape={action.kind === "radio" ? "radio" : "checkbox"}
                        aria-hidden="true"
                      >
                        {action.kind === "checkbox" ? <Check /> : null}
                      </span>
                    ) : (
                      <Glyph>{action.icon ?? TIER_GLYPH[tier]}</Glyph>
                    )}

                    {pending ? (
                      <span className="ox-menu__skeleton" aria-hidden="true" />
                    ) : (
                      <span className="ox-menu__label">{action.label}</span>
                    )}

                    {action.submenu?.length ? (
                      <Chevron />
                    ) : (
                      <span className="ox-menu__shortcut">{action.shortcut ?? ""}</span>
                    )}

                    {/*
                    Not a `title` attribute. A tooltip is unavailable to a
                    keyboard user, and this is exactly the text that person
                    needs most: what the action writes, or why it will not run.
                  */}
                    {note ? <span className="ox-menu__note">{note}</span> : null}
                  </div>

                  {confirming === action.id ? (
                    <ConfirmStrip
                      action={action}
                      bulk={resolved.bulk}
                      onKeep={() => setConfirming(null)}
                      onGo={() =>
                        runAction(
                          action,
                          actionOutcome(action, { confirming: action.id }, resolved.bulk),
                        )
                      }
                    />
                  ) : null}

                  {reasoning === action.id ? (
                    <ReasonList
                      action={action}
                      onPick={(reason) =>
                        runAction(
                          action,
                          actionOutcome(action, { reasoning: action.id, reason }, resolved.bulk),
                        )
                      }
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {withheldSentence ? (
        <p className="ox-menu__withheld">
          <span className="ox-menu__icon" aria-hidden="true">
            <Lock />
          </span>
          <span>{withheldSentence}</span>
        </p>
      ) : null}

      <span className="ox-menu__live" aria-live="polite">
        {announcement}
      </span>
    </div>
  );

  return (
    <>
      {children(trigger)}
      {createPortal(
        <>
          {isSheet ? <div className="ox-menu__backdrop" onClick={() => close()} /> : null}
          {panel}
        </>,
        container ?? document.body,
      )}
      {subAction ? (
        <Submenu
          key={subAction.id}
          parent={subAction}
          anchorEl={rowRefs.current.get(subAction.id) ?? null}
          contained={contained}
          container={container ?? null}
          labelledBy={`${subjectId}-${subAction.id}`}
          autoFocus={sub?.fromKeyboard ?? false}
          compact={density === "compact"}
          scope={scopeOf(triggerRef.current)}
          tick={tick}
          onRun={(item) => {
            /* A child item is a routine action by construction, so it runs and
               takes the whole menu down with it. */
            onRun?.(item, subject, { kind: "run" });
            close();
          }}
          onDismiss={closeSub}
          onPointerEnter={cancelSubTimer}
          registerPanel={(node) => {
            subPanelRef.current = node;
          }}
        />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Step two                                                           */
/* ------------------------------------------------------------------ */

/**
 * The confirmation for a `clinical` action.
 *
 * Drawn under the row it belongs to rather than replacing the list, so nothing
 * above it moves and the pointer is still over the verb it chose. Never a
 * modal: a modal moves focus off the surface, takes the keyboard away from the
 * person who was using it, and re-anchors the interaction where the pointer is
 * not.
 */
function ConfirmStrip(props: {
  action: ChartMenuAction;
  bulk: number;
  onGo: () => void;
  onKeep: () => void;
}) {
  const { action, bulk, onGo, onKeep } = props;
  const outcome = actionOutcome(action, {}, bulk);
  if (outcome.kind !== "confirm") return null;

  return (
    <div className="ox-menu__confirm" role="group" aria-label={outcome.verb}>
      <p className="ox-menu__prompt">{outcome.prompt}</p>
      {outcome.bulkPrompt ? <p className="ox-menu__bulk-prompt">{outcome.bulkPrompt}</p> : null}
      <div className="ox-menu__actions">
        <button
          type="button"
          className="ox-menu__button"
          data-ox-primary=""
          onClick={(event) => {
            event.stopPropagation();
            onGo();
          }}
        >
          {outcome.verb}
        </button>
        <button
          type="button"
          className="ox-menu__button"
          onClick={(event) => {
            event.stopPropagation();
            onKeep();
          }}
        >
          Keep
        </button>
      </div>
    </div>
  );
}

/**
 * The reason list for a `disclosive` action.
 *
 * The footnote is not reassurance. It is the one fact a reader needs before
 * deciding: the record has already been made, and closing this does not unmake
 * it — it changes the outcome to `abandoned`.
 */
function ReasonList(props: { action: ChartMenuAction; onPick: (reason: string) => void }) {
  const { action, onPick } = props;
  const reasons = action.reasons ?? [];

  return (
    <div className="ox-menu__reasons" role="group" aria-label={`Reason for ${action.label}`}>
      <p className="ox-menu__reasons-head">
        This reveals data you are not currently entitled to. <strong>Record a reason.</strong>
      </p>
      {reasons.map((reason) => (
        <button
          key={reason}
          type="button"
          className="ox-menu__reason"
          onClick={(event) => {
            event.stopPropagation();
            onPick(reason);
          }}
        >
          <span className="ox-menu__indicator" data-ox-shape="radio" aria-hidden="true" />
          <span>{reason}</span>
        </button>
      ))}
      <p className="ox-menu__reasons-foot">
        Recorded either way — including if you close this menu now.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Submenu                                                            */
/* ------------------------------------------------------------------ */

/**
 * A child menu, beside the row that owns it.
 *
 * Routine actions only — `validateActions` refuses anything above that inside
 * a submenu, because without a safe triangle a diagonal sweep can close one
 * mid-flight and the cost of that has to stay "move the mouse again" rather
 * than "you discontinued something".
 *
 * It does not take focus when a pointer opened it. A hover has committed to
 * nothing yet, and moving focus out of the parent list would throw away the
 * keyboard user's place in it. Opening by click, Enter or ArrowRight does take
 * focus, because those are commitments.
 */
function Submenu(props: {
  parent: ChartMenuAction;
  anchorEl: HTMLElement | null;
  contained: HTMLElement | null;
  container: HTMLElement | null;
  labelledBy: string;
  autoFocus: boolean;
  compact?: boolean;
  scope: Record<string, string>;
  tick: number;
  onRun: (action: ChartMenuAction) => void;
  onDismiss: (returnFocus: boolean) => void;
  onPointerEnter: () => void;
  /** Hands the parent this panel, so its outside-click check can see it. */
  registerPanel: (node: HTMLElement | null) => void;
}) {
  const {
    parent,
    anchorEl,
    contained,
    container,
    labelledBy,
    autoFocus,
    compact,
    scope,
    tick,
    onRun,
    onDismiss,
    onPointerEnter,
    registerPanel,
  } = props;

  /*
   * Memoised because `?? []` mints a new array whenever `submenu` is absent,
   * and this list is an effect dependency — an unstable identity would re-run
   * the focus effect on every render of the parent, which is once per scroll
   * event while the menu is open.
   */
  const items = React.useMemo(() => parent.submenu ?? [], [parent.submenu]);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const rowRefs = React.useRef(new Map<string, HTMLDivElement | null>());
  const [box, setBox] = React.useState<Placement | null>(null);
  const [active, setActive] = React.useState(autoFocus ? 0 : -1);

  React.useLayoutEffect(() => {
    const panel = panelRef.current;
    const rect = anchorEl?.getBoundingClientRect?.();
    if (!panel || !rect) return;
    const next = placeBeside(rect, panel.offsetWidth);
    if (!contained) {
      setBox(next);
      return;
    }
    const host = contained.getBoundingClientRect();
    setBox({
      ...(next.top === undefined
        ? { bottom: host.bottom - (window.innerHeight - (next.bottom ?? 0)) - contained.scrollTop }
        : { top: next.top - host.top + contained.scrollTop }),
      left: next.left - host.left + contained.scrollLeft,
      origin: next.origin,
      maxHeight: next.maxHeight,
    });
  }, [anchorEl, contained, tick, items.length]);

  React.useEffect(() => {
    if (!autoFocus) return;
    const id = items[active]?.id;
    const node = id ? rowRefs.current.get(id) : undefined;
    if (node && document.activeElement !== node) node.focus({ preventScroll: true });
  }, [autoFocus, active, items, box]);

  const move = (delta: 1 | -1) =>
    setActive((current) => {
      if (items.length === 0) return -1;
      const next = current + delta;
      return next < 0 ? items.length - 1 : next >= items.length ? 0 : next;
    });

  React.useEffect(() => () => registerPanel(null), [registerPanel]);

  const panel = (
    <div
      ref={(node) => {
        panelRef.current = node;
        registerPanel(node);
      }}
      role="menu"
      tabIndex={-1}
      aria-labelledby={labelledBy}
      aria-orientation="vertical"
      className={cn("ox-menu", "ox-menu--sub")}
      data-ox-submenu=""
      style={
        box
          ? ({
              ...(box.top === undefined ? { bottom: box.bottom } : { top: box.top }),
              left: box.left,
              maxBlockSize: box.maxHeight,
              "--ox-menu-origin": box.origin,
            } as unknown as React.CSSProperties)
          : ({ visibility: "hidden", top: 0, left: 0 } as React.CSSProperties)
      }
      onMouseEnter={onPointerEnter}
      onKeyDown={(event) => {
        /*
         * Stopped here rather than allowed to bubble: the parent panel is
         * still mounted and still listening, and without this every arrow key
         * moved both highlights at once.
         */
        switch (event.key) {
          case "ArrowDown":
          case "ArrowUp":
            event.preventDefault();
            event.stopPropagation();
            move(event.key === "ArrowDown" ? 1 : -1);
            return;
          case "ArrowLeft":
          case "Escape":
            /* Closes the child only, and hands the parent back its row. */
            event.preventDefault();
            event.stopPropagation();
            onDismiss(true);
            return;
          case "Enter":
          case " ": {
            const item = items[active];
            if (!item) return;
            event.preventDefault();
            event.stopPropagation();
            onRun(item);
            return;
          }
          default:
        }
      }}
      {...scope}
      {...(compact ? { "data-ox-density": "compact" } : {})}
    >
      <div className="ox-menu__list">
        {items.map((item, index) => (
          <div
            key={item.id}
            ref={(node) => {
              if (node) rowRefs.current.set(item.id, node);
              else rowRefs.current.delete(item.id);
            }}
            role="menuitem"
            tabIndex={active === index ? 0 : -1}
            className="ox-menu__item"
            data-ox-tier="routine"
            {...(active === index ? { "data-ox-active": "" } : {})}
            onMouseEnter={() => setActive(index)}
            onClick={(event) => {
              event.stopPropagation();
              onRun(item);
            }}
          >
            <Glyph>{item.icon}</Glyph>
            <span className="ox-menu__label">{item.label}</span>
            <span className="ox-menu__shortcut">{item.shortcut ?? ""}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(panel, container ?? document.body);
}
