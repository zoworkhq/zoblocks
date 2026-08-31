"use client";

/**
 * ChartCommandPalette — a palette for a place where search is a regulated act.
 *
 *     <ChartCommandPalette
 *       open={open}
 *       items={items}
 *       scope={{ inScope: myPatients, breakGlass: true }}
 *       onRun={run}
 *       onSearchAudit={audit}
 *       onClose={() => setOpen(false)}
 *     />
 *
 * Three behaviours are the component rather than decoration on it.
 *
 *   Patients outside your treatment relationships are counted, never named.
 *   The reader learns the search was not empty without learning who — which
 *   is the difference between a palette and a privacy incident.
 *
 *   Every patient search emits an audit event, including the ones that
 *   returned nothing.
 *
 *   A clinically significant action never runs on the first Enter. The
 *   confirmation happens inside the palette, because handing off to a modal
 *   loses the keyboard user the palette was built for.
 *
 * Styling lives in `styles/oxygen-palette.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ITEM_KIND_LABEL,
  applyScope,
  auditFor,
  describeResults,
  describeWithheld,
  group,
  outcomeFor,
  rank,
  type PaletteItem,
  type PatientScope,
  type SearchAudit,
} from "@/lib/oxygen-palette";

export {
  ITEM_KIND_LABEL,
  KIND_ORDER,
  KIND_WEIGHT,
  applyScope,
  auditFor,
  describeResults,
  describeWithheld,
  group,
  outcomeFor,
  rank,
  score,
  scoreItem,
  type ItemKind,
  type PaletteItem,
  type PatientScope,
  type RankedItem,
  type RunOutcome,
  type ScopedResults,
  type SearchAudit,
  type Unavailable,
} from "@/lib/oxygen-palette";

export interface ChartCommandPaletteProps {
  /** Whether the palette is showing. Controlled, so the host owns the shortcut that summons it. */
  open: boolean;
  /**
   * Everything the palette may match.
   *
   * A flat list rather than registered providers: the provider interface, its
   * abort signals and its per-source failure handling belong to the host,
   * which is the only place that knows which of them is a slow terminology
   * server.
   */
  items: readonly PaletteItem[];
  /**
   * The treatment relationship this search is bounded by. Every query is scoped to it, and
   * searches it refuses are audited too.
   */
  scope?: PatientScope;
  /**
   * The empty-field prompt. Say what can be typed — "Search, or start with a verb" — rather
   * than "Ask anything", which promises a scope the palette will refuse.
   */
  placeholder?: string;
  /** Runs an item. Only ever called for an outcome of `run`. */
  onRun?: (item: PaletteItem) => void;
  /**
   * Called once per search that touched the patient index — including the ones
   * that matched nobody. The host writes the audit entry.
   */
  onSearchAudit?: (audit: SearchAudit) => void;
  /** Fired on Escape, on backdrop click, and after a command runs. */
  onClose?: () => void;
  /** Applied to the palette's outer element. */
  className?: string;
}

export function ChartCommandPalette({
  open,
  items,
  scope,
  placeholder = "Search or run a command…",
  onRun,
  onSearchAudit,
  onClose,
  className,
}: ChartCommandPaletteProps) {
  const [term, setTerm] = React.useState("");
  const [active, setActive] = React.useState(0);
  /** The item awaiting its second Enter. Cleared by any other keystroke. */
  const [confirming, setConfirming] = React.useState<string | null>(null);
  const [announced, setAnnounced] = React.useState("");

  const listId = React.useId();
  const input = React.useRef<HTMLInputElement>(null);
  /** The element to give focus back to. Always, on every close path. */
  const opener = React.useRef<Element | null>(null);

  const results = React.useMemo(() => applyScope(rank(term, items), scope), [term, items, scope]);
  const grouped = React.useMemo(() => group(results.visible), [results]);
  const flat = React.useMemo(() => grouped.flatMap((entry) => entry.items), [grouped]);
  const current = flat[active]?.item;
  const withheld = describeWithheld(results.withheld, scope);

  /** Whether this term reached the patient index at all. */
  const searchedPatients = items.some((item) => item.kind === "patient");

  React.useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    input.current?.focus();
    return () => {
      // Focus returns to the invoking element on close. Always — a palette
      // that drops focus to the body has stranded the keyboard user it exists
      // for.
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  React.useEffect(() => {
    setActive(0);
    setConfirming(null);
  }, [term]);

  /*
   * The count, debounced.
   *
   * A palette that announces on every keystroke is a palette a screen-reader
   * user cannot type into: the announcement restarts before the previous word
   * finishes and nothing is ever heard in full.
   */
  React.useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setAnnounced(describeResults(results, scope)), 350);
    return () => clearTimeout(timer);
  }, [open, results, scope]);

  /*
   * One audit event per settled search, including the empty ones.
   *
   * Debounced against the same delay as the announcement so a nine-character
   * name is one entry rather than nine — but never suppressed, because a
   * search that found nobody is still a search that was made.
   */
  React.useEffect(() => {
    if (!open || !term.trim() || !onSearchAudit) return;
    const timer = setTimeout(() => {
      const audit = auditFor(term, results, searchedPatients);
      if (audit) onSearchAudit(audit);
    }, 350);
    return () => clearTimeout(timer);
  }, [open, term, results, searchedPatients, onSearchAudit]);

  if (!open) return null;

  const activate = (item: PaletteItem) => {
    const outcome = outcomeFor(item, confirming === item.id);

    if (outcome.kind === "blocked") return;
    if (outcome.kind === "argument") {
      // Tab semantics on Enter too: the verb keeps the palette open until it
      // has its object.
      setTerm(`${item.label} `);
      input.current?.focus();
      return;
    }
    if (outcome.kind === "confirm") {
      setConfirming(item.id);
      return;
    }

    onRun?.(item);
    onClose?.();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose?.();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setConfirming(null);
      setActive((index) => {
        const next = index + (event.key === "ArrowDown" ? 1 : -1);
        return Math.min(flat.length - 1, Math.max(0, next));
      });
      return;
    }

    if (event.key === "Tab" && current?.argument) {
      event.preventDefault();
      setTerm(`${current.label} `);
      return;
    }

    if (event.key === "Enter" && current) {
      event.preventDefault();
      activate(current);
    }
  };

  return (
    <div className={cn("ox-palette", className)} data-ox-palette="" role="presentation">
      <div className="ox-palette__panel">
        <input
          ref={input}
          type="text"
          className="ox-palette__input"
          value={term}
          placeholder={placeholder}
          onChange={(event) => setTerm(event.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Search or run a command"
          {...(current ? { "aria-activedescendant": `${listId}-${current.id}` } : {})}
        />

        {/*
          The scroll container, not the listbox.

          A `role="listbox"` may own only options and groups (ARIA 1.2), so the
          two rows that are neither — the withheld count and the empty state —
          are siblings of the list rather than children of it. They still read
          as rows and still sit where the results would be; they are simply not
          pretending to be options, which is what `role="presentation"` inside
          a listbox amounts to.
        */}
        <div className="ox-palette__results">
          <div id={listId} className="ox-palette__list" role="listbox" aria-label="Results">
            {grouped.map((entry) => (
              <div
                key={entry.kind}
                className="ox-palette__group"
                role="group"
                aria-label={ITEM_KIND_LABEL[entry.kind]}
              >
                <p className="ox-palette__group-label" aria-hidden="true">
                  {ITEM_KIND_LABEL[entry.kind]}
                </p>
                {entry.items.map(({ item }) => {
                  const index = flat.findIndex((candidate) => candidate.item.id === item.id);
                  const isActive = index === active;
                  // Armed, not "about to be armed": the prompt appears after
                  // the first Enter, not on every significant row from the
                  // moment it is listed. A confirmation shown before anybody
                  // pressed anything is a confirmation people stop reading.
                  const armed = confirming === item.id;

                  return (
                    <div
                      key={item.id}
                      id={`${listId}-${item.id}`}
                      role="option"
                      aria-selected={isActive}
                      aria-disabled={item.unavailable ? true : undefined}
                      className="ox-palette__option"
                      data-ox-kind={item.kind}
                      data-ox-active={isActive ? "" : undefined}
                      data-ox-significant={item.significant ? "" : undefined}
                      data-ox-armed={armed ? "" : undefined}
                      data-ox-unavailable={item.unavailable ? "" : undefined}
                      onMouseDown={(event) => {
                        // Mousedown rather than click: click would blur the
                        // input first and the combobox would lose its own
                        // activedescendant mid-selection.
                        event.preventDefault();
                        setActive(index);
                        activate(item);
                      }}
                    >
                      <span className="ox-palette__label">{item.label}</span>
                      {item.detail ? (
                        <span className="ox-palette__detail">{item.detail}</span>
                      ) : null}
                      {item.argument ? (
                        <span className="ox-palette__argument">↹ {item.argument.label}</span>
                      ) : null}
                      {/*
                        An unavailable action is shown with its reason rather
                        than hidden. Hiding it teaches somebody the feature
                        does not exist; showing it teaches them to reconnect.
                      */}
                      {item.unavailable ? (
                        <span className="ox-palette__unavailable">{item.unavailable.reason}</span>
                      ) : null}
                      {armed ? (
                        <span className="ox-palette__confirm">Press Enter again to confirm</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/*
            The count of what may not be named.
            A row, not a footnote: a reader who does not see it concludes the
            search was empty, which is the one wrong conclusion available.
          */}
          {withheld ? <p className="ox-palette__withheld">{withheld}</p> : null}

          {/* Before anything is typed there is no search and nothing to
              report — including nothing to count, which matters: a withheld
              total on an empty input discloses the size of the index. */}
          {!term.trim() ? (
            <p className="ox-palette__empty">
              Type to search, or start with a verb — “start”, “order”, “open”.
            </p>
          ) : null}

          {term.trim() && !flat.length && !withheld ? (
            <p className="ox-palette__empty">Nothing matches “{term}”.</p>
          ) : null}
        </div>

        {/* Debounced, so typing is not a running commentary. */}
        <p className="ox-palette__sr" aria-live="polite">
          {announced}
        </p>
      </div>
    </div>
  );
}

ChartCommandPalette.displayName = "ChartCommandPalette";
