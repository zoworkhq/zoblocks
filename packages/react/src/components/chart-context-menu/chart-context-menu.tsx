"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/chart-context-menu/chart-context-menu.tsx. Edit that file, not this one.
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
import { cn } from "../../lib/utils";
import {
  RESOURCE_WORD,
  actionOutcome,
  describeHiddenActions,
  disclosureRecord,
  focusableRows,
  matchFirstLetter,
  nextIndex,
  resolveMenu,
  type DisclosureRecord,
  type MenuAction,
  type MenuOutcome,
  type MenuPolicy,
  type MenuSubject,
  type ResolvedAction,
} from "../../lib/menu";

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
} from "../../lib/menu";

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
        setBox({
          ...(next.top === undefined
            ? {
                bottom:
                  box.bottom - (window.innerHeight - (next.bottom ?? 0)) - contained.scrollTop,
              }
            : { top: next.top - box.top + contained.scrollTop }),
          left: next.left - box.left + contained.scrollLeft,
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
  }, [open, active, rows, confirming, reasoning, box]);

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
    [confirming, reasoning, resolved.bulk, onBlocked, onToggle, emitDisclosure, runAction],
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
        close();
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
            /*
             * A type letter, not initials. "LM" for "Lisinopril 10 mg" spells
             * nothing, and an empty bordered circle reads as a missing avatar
             * rather than as a medication.
             */
            (RESOURCE_WORD[subject.resource] ?? subject.resource).charAt(0).toUpperCase()
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
                    {...(action.submenu ? { "aria-haspopup": "menu" as const } : {})}
                    {...(pending || blocked ? { "aria-disabled": true } : {})}
                    onMouseEnter={() => setActive(index)}
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
                      <Glyph>{action.icon}</Glyph>
                    )}

                    {pending ? (
                      <span className="ox-menu__skeleton" aria-hidden="true" />
                    ) : (
                      <span className="ox-menu__label">{action.label}</span>
                    )}

                    {action.submenu ? (
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
