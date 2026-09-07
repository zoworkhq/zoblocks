"use client";

/**
 * The left-hand component list on every component page.
 *
 * What a reader of any component library expects and this site did not have:
 * a pane that lists every component, filters as you type, and lets you move
 * between pages without going back to the catalogue. Mocked, approved, and
 * built to the mock.
 *
 * Three rules it shares with the rest of the site rather than inventing:
 *
 *   - Each component appears once, under its first category — the rule the
 *     catalogue page uses to band its cards, so the two never disagree about
 *     where a component lives.
 *   - Only a documented component is a link. The sixteen that install but
 *     have no page yet sit in a collapsed group, dimmed and unlinked; the
 *     readiness list decides, exactly as it does for the palette and the
 *     sitemap, so nothing in this pane can lead to a 404.
 *   - The current page is marked by a bar *and* a wash *and* weight, never by
 *     colour alone — the rule every clinical component is held to.
 *
 * It filters rather than searches: typing narrows the list in place across
 * title, slug and category. Whole-site search stays in ⌘K.
 *
 * A client component for the same reason the site header is: the filter and
 * the keyboard model are state, and `usePathname` cannot run on the server.
 * The list it renders is a small projection the page computes — name, title,
 * stability, first category — not the catalogue, so a navigation does not
 * ship every prop table on the site to the browser to draw fourteen names.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { STATUS_LABEL, type Stability } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  title: string;
  status: Stability;
  /** First category — the group it is listed under. */
  category: string;
  /** Every category, for the filter. */
  categories: readonly string[];
}

/**
 * Group order, so the clinical work leads and the primitives close.
 *
 * Anything not named here sorts after everything that is, alphabetically —
 * a new category appears rather than vanishing, and somebody then decides
 * where it belongs.
 */
const GROUP_ORDER = [
  "Clinical",
  "Loaders",
  "Navigation",
  "Forms",
  "Disclosure",
  "Media",
  "Data Display",
  "Layout",
  "Feedback",
  "Primitives",
  "Documentation",
  "Patterns",
  "AI",
  "Data Entry",
];

function groupRank(category: string): number {
  const index = GROUP_ORDER.indexOf(category);
  return index === -1 ? GROUP_ORDER.length : index;
}

function matches(item: NavItem, needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  return (
    item.title.toLowerCase().includes(n) ||
    item.name.includes(n) ||
    item.categories.some((category) => category.toLowerCase().includes(n))
  );
}

/** The matched run, marked — so a reader sees *why* a row survived the filter. */
function Highlight({ text, needle }: { text: string; needle: string }) {
  const n = needle.trim();
  if (!n) return <>{text}</>;
  const index = text.toLowerCase().indexOf(n.toLowerCase());
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent font-semibold text-brand-deep">
        {text.slice(index, index + n.length)}
      </mark>
      {text.slice(index + n.length)}
    </>
  );
}

/**
 * Stable is unmarked because it is the majority; the list should read as
 * names first. Beta and experimental get a small mono tag on the right, in
 * words, so the distinction survives a monochrome print.
 */
function StabilityTag({ status }: { status: Stability }) {
  if (status === "stable") return null;
  return (
    <span className="numeric shrink-0 text-[0.5625rem] uppercase tracking-[0.08em] text-graphite-soft">
      {status === "experimental" ? "exp" : STATUS_LABEL[status]}
    </span>
  );
}

export function ComponentNav({
  items,
  soon,
  current,
}: {
  /** Documented components, in catalogue order. */
  items: readonly NavItem[];
  /** Installable, not yet documented. Listed, never linked. */
  soon: readonly NavItem[];
  /** The component this page is for. */
  current: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState(-1);
  const [open, setOpen] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const list = React.useRef<HTMLElement>(null);
  const id = React.useId();

  // Leaving a page closes the phone-width disclosure and drops the cursor,
  // so the pane on the next page opens in its resting state.
  React.useEffect(() => {
    setOpen(false);
    setCursor(-1);
  }, [current]);

  /*
   * `/` focuses the filter from anywhere on the page — the convention every
   * developer already has in their hands from GitHub and the terminal. Not
   * while something else is being typed into, and not with a modifier held.
   */
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      event.preventDefault();
      setOpen(true);
      input.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const visible = React.useMemo(() => items.filter((item) => matches(item, query)), [items, query]);
  const visibleSoon = React.useMemo(
    () => soon.filter((item) => matches(item, query)),
    [soon, query],
  );

  const groups = React.useMemo(() => {
    const map = new Map<string, NavItem[]>();
    for (const item of visible) {
      const list = map.get(item.category);
      if (list) list.push(item);
      else map.set(item.category, [item]);
    }
    return [...map.entries()].sort(([a], [b]) => groupRank(a) - groupRank(b));
  }, [visible]);

  /*
   * Rows in the order a reader sees them, for the arrow keys — the groups
   * reorder the items, so `visible` is not the sequence on screen.
   */
  const rows = React.useMemo(() => groups.flatMap(([, list]) => list), [groups]);

  const onInputKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!rows.length) return;
      const next =
        event.key === "ArrowDown" ? Math.min(cursor + 1, rows.length - 1) : Math.max(cursor - 1, 0);
      setCursor(next);
      list.current
        ?.querySelector<HTMLElement>(`[data-nav-index="${next}"]`)
        ?.scrollIntoView({ block: "nearest" });
      return;
    }
    if (event.key === "Enter") {
      const target = cursor >= 0 ? rows[cursor] : rows.length === 1 ? rows[0] : undefined;
      if (target) {
        event.preventDefault();
        router.push(`/components/${target.name}`);
      }
      return;
    }
    if (event.key === "Escape") {
      if (query) {
        event.preventDefault();
        setQuery("");
        setCursor(-1);
      }
    }
  };

  const filtering = query.trim().length > 0;
  const listId = `${id}-list`;

  return (
    <aside
      className={cn(
        "border-rule lg:sticky lg:top-13 lg:flex lg:h-[calc(100vh-3.25rem)] lg:flex-col lg:border-r lg:pr-5 lg:pt-6",
        "border-b lg:border-b-0",
      )}
    >
      {/*
        On a phone the pane is a disclosure above the content, not a column
        beside it. A column that stays fixed on a phone eats the viewport.
      */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={listId}
        className="flex w-full items-center justify-between py-3.5 text-sm font-medium text-ink lg:hidden"
      >
        <span>Components</span>
        <span className="axis-label inline-flex items-center gap-2">
          {items.length} of {items.length + soon.length}
          <ChevronDown
            aria-hidden="true"
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      <div
        id={listId}
        className={cn("lg:flex lg:min-h-0 lg:flex-1 lg:flex-col", !open && "hidden lg:flex")}
      >
        <div className="relative">
          <label htmlFor={`${id}-filter`} className="sr-only">
            Filter components
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-graphite-soft"
          />
          <input
            ref={input}
            id={`${id}-filter`}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(-1);
            }}
            onKeyDown={onInputKey}
            placeholder="Filter components…"
            autoComplete="off"
            spellCheck={false}
            aria-controls={`${id}-results`}
            className={cn(
              "w-full rounded-lg border border-rule bg-paper-sunk py-2 pl-8 pr-8 text-sm text-ink",
              "placeholder:text-graphite-soft focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15",
            )}
          />
          <kbd
            aria-hidden="true"
            className="numeric pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-rule-strong bg-paper px-1.5 text-[0.625rem] text-graphite-soft"
          >
            /
          </kbd>
        </div>

        <nav
          ref={list}
          id={`${id}-results`}
          aria-label="All components"
          className="scroll-thin -mr-2 min-h-0 flex-1 overflow-y-auto py-3 pr-2 lg:pb-4"
        >
          {!visible.length && !visibleSoon.length ? (
            <p className="px-2.5 py-4 text-[0.8125rem] leading-relaxed text-graphite-soft">
              Nothing matches <b className="font-medium text-ink">&ldquo;{query.trim()}&rdquo;</b>.
              The full list is one Esc away.
            </p>
          ) : null}

          {groups.map(([category, entries]) => {
            const headingId = `${id}-${category.replace(/\W+/g, "-").toLowerCase()}`;
            return (
              <div
                key={category}
                role="group"
                aria-labelledby={headingId}
                className="mt-4 first:mt-0"
              >
                <p id={headingId} className="axis-label mb-1 flex justify-between px-2.5">
                  {category}
                  <span className="numeric tracking-normal">{entries.length}</span>
                </p>
                <ul className="list-none space-y-px">
                  {entries.map((item) => {
                    const index = rows.indexOf(item);
                    const active = item.name === current;
                    return (
                      <li key={item.name}>
                        <Link
                          href={`/components/${item.name}`}
                          aria-current={active ? "page" : undefined}
                          data-nav-index={index}
                          className={cn(
                            "relative flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[0.875rem] text-graphite",
                            "transition-colors duration-150 hover:bg-paper-sunk hover:text-ink",
                            active && "bg-brand/10 font-medium text-ink",
                            index === cursor && "outline outline-2 -outline-offset-2 outline-brand",
                          )}
                        >
                          {/* The bar. With the wash and the weight, that is
                              three cues for one state — the rule the clinical
                              status tokens are held to. */}
                          {active ? (
                            <span
                              aria-hidden="true"
                              className="absolute -left-px bottom-1.5 top-1.5 w-0.5 rounded-full bg-brand"
                            />
                          ) : null}
                          <span className="truncate">
                            <Highlight text={item.title} needle={query} />
                          </span>
                          <StabilityTag status={item.status} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {visibleSoon.length ? (
            <details className="mt-4" open={filtering || undefined}>
              <summary
                className="axis-label flex cursor-pointer list-none items-center justify-between px-2.5 [&::-webkit-details-marker]:hidden"
                title="Installable today. The documentation page is not written yet."
              >
                Not yet documented
                <span className="numeric tracking-normal">{visibleSoon.length}</span>
              </summary>
              <ul className="mt-1 list-none space-y-px">
                {visibleSoon.map((item) => (
                  <li key={item.name}>
                    <span
                      aria-disabled="true"
                      title="Installs from the registry today. No page yet."
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[0.875rem] text-graphite-soft"
                    >
                      <span className="truncate">
                        <Highlight text={item.title} needle={query} />
                      </span>
                      <span className="numeric shrink-0 text-[0.5625rem] uppercase tracking-[0.08em]">
                        soon
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </nav>

        <p className="numeric hidden border-t border-rule px-2.5 pb-4 pt-3 text-[0.625rem] leading-relaxed tracking-[0.06em] text-graphite-soft lg:block">
          {filtering ? (
            <>
              <b className="font-medium text-graphite">{visible.length}</b> of {items.length} match
              · <kbd className="rounded border border-rule-strong px-1">Esc</kbd> clears
            </>
          ) : (
            <>
              <b className="font-medium text-graphite">{items.length}</b> documented · {soon.length}{" "}
              installable, docs in progress
              <br />
              <kbd className="rounded border border-rule-strong px-1">/</kbd> filter &nbsp;
              <kbd className="rounded border border-rule-strong px-1">↑</kbd>
              <kbd className="rounded border border-rule-strong px-1">↓</kbd> move &nbsp;
              <kbd className="rounded border border-rule-strong px-1">↵</kbd> open
            </>
          )}
        </p>
      </div>
    </aside>
  );
}
