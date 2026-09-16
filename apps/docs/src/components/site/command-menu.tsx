"use client";

/**
 * Command menu (⌘K).
 *
 * Built from scratch rather than pulled in, for the same reason the components
 * are: this site is the proof. A dependency here would be a library that can't
 * build its own dialog.
 *
 * Accessibility is the whole job in a component like this:
 *   - focus is trapped while open and restored to the trigger on close
 *   - the listbox is driven by aria-activedescendant, so the input keeps focus
 *     and screen readers still announce the highlighted option
 *   - background content is inert to assistive tech via aria-hidden on the app
 *   - Escape closes, arrows move, Home/End jump, Enter commits
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Search, X } from "lucide-react";
import { CATALOG } from "@/lib/catalog";
import { isReady, readyRank } from "@/lib/readiness";
import { cn } from "@/lib/utils";
import { restoreFocus } from "@/components/site/interactions";

interface Item {
  id: string;
  label: string;
  hint?: string;
  group: string;
  href: string;
  keywords: string;
}

const PAGES: Item[] = [
  { id: "p-home", label: "Home", group: "Pages", href: "/", keywords: "home start overview" },
  {
    id: "p-components",
    label: "Components",
    group: "Pages",
    href: "/components",
    keywords: "catalogue browse all",
  },
  /*
   * Install and Compare were missing.
   *
   * Both are footer-only in the site chrome, which made this the one place a
   * reader could have reached them without scrolling — and it did not list
   * them. Install is the page a developer needs most and the hardest to find.
   */
  {
    id: "p-install",
    label: "Install",
    group: "Pages",
    href: "/install",
    keywords: "setup getting started next vite tailwind alias tokens cli init",
  },
  {
    id: "p-compare",
    label: "Compare",
    group: "Pages",
    href: "/compare",
    keywords: "antd ant design mui tanstack alternatives build in-house versus",
  },
  {
    id: "p-blocks",
    label: "Blocks",
    group: "Pages",
    href: "/showcase",
    keywords: "showcase examples compositions demos dashboard note patient copilot",
  },
  {
    /*
     * Marketplace and Pro, merged. Both old names stay as keywords so a
     * reader who remembers either still finds the page.
     *
     * No "pricing" keyword: the page carries no prices, and typing "pricing"
     * should not open a screen with none on it.
     */
    id: "p-premium",
    label: "Premium",
    group: "Pages",
    href: "/premium",
    keywords:
      "pro marketplace console theming publish gate paid enterprise packs icons illustration design system figma",
  },
];

/*
 * Only components with a page.
 *
 * This mapped the whole catalogue, so over half the results led to a 404 —
 * `/components/timeline` and fifteen others resolve to nothing. The route,
 * the catalogue card and the sitemap all filter by readiness; this was the
 * one navigation surface that did not, and it is the fastest one to reach.
 *
 * Sorted the same way the catalogue is, so the first result for a vague query
 * is the most finished component rather than the alphabetically luckiest.
 */
const COMPONENT_ITEMS: Item[] = CATALOG.filter((c) => isReady(c.name))
  .slice()
  .sort((a, b) => readyRank(a.name) - readyRank(b.name))
  .map((c) => ({
    id: `c-${c.name}`,
    label: c.title,
    hint: c.resource,
    group: "Components",
    href: `/components/${c.name}`,
    keywords: `${c.name} ${c.resource} ${c.categories.join(" ")} ${c.summary}`.toLowerCase(),
  }));

const ALL = [...PAGES, ...COMPONENT_ITEMS];

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL;
    return ALL.filter((item) => item.label.toLowerCase().includes(q) || item.keywords.includes(q));
  }, [query]);

  // Grouped, but the flat index is what the keyboard walks — the two must not
  // drift apart or the highlight lands on the wrong row.
  const groups = React.useMemo(() => {
    const out: Array<{ name: string; items: Array<Item & { index: number }> }> = [];
    results.forEach((item, index) => {
      const group = out.find((g) => g.name === item.group);
      const entry = { ...item, index };
      if (group) group.items.push(entry);
      else out.push({ name: item.group, items: [entry] });
    });
    return out;
  }, [results]);

  React.useEffect(() => setActive(0), [query]);

  /*
   * The global shortcut, and Escape.
   *
   * Escape lived on the input's own `onKeyDown`, which only fires while focus
   * is inside the input. That is true most of the time and not always: the
   * dialog is opened by a shortcut from anywhere on the page, and focus moves
   * into the field on a `setTimeout`, so there is a window in which the dialog
   * is open and Escape does nothing. A dialog that cannot always be dismissed
   * with Escape is a trap, and this is the second time the same handler-on-the-
   * wrong-element shape has produced one here — `notify-dialog.tsx` had it too.
   *
   * The input keeps its own handler for the arrow keys and Enter, which do
   * belong to the field.
   */
  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock scroll, hide the app from assistive tech, restore focus on close.
  React.useEffect(() => {
    if (!open) return;
    const app = document.getElementById("app-root");
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    app?.setAttribute("aria-hidden", "true");
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 0);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = overflow;
      app?.removeAttribute("aria-hidden");
      restoreFocus(previouslyFocused, triggerRef.current);
    };
  }, [open]);

  // Keep the highlighted row in view without stealing focus from the input.
  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function commit(item: Item | undefined) {
    if (!item) return;
    setOpen(false);
    setQuery("");
    router.push(item.href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(Math.max(results.length - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      commit(results[active]);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search — press Command K"
        className="group inline-flex items-center gap-2 rounded-lg border border-rule bg-paper-sunk/60 py-1.5 pl-2.5 pr-1.5 text-sm text-graphite transition-colors duration-200 hover:border-rule-strong hover:text-ink max-md:size-10 max-md:justify-center max-md:p-0"
      >
        <Search aria-hidden="true" className="size-3.5 max-md:size-4" />
        <span className="hidden lg:inline">Search</span>
        <kbd className="numeric hidden rounded border border-rule bg-paper px-1.5 py-0.5 text-[0.625rem] text-graphite-soft lg:inline">
          ⌘K
        </kbd>
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[max(1rem,8dvh)] sm:pt-[12vh]">
            {/*
              The backdrop closes on its own click.

              The container used to test `target === currentTarget`, which is
              never true: this backdrop covers all of it, so every press outside
              the panel landed here instead. Only Escape closed the palette — a
              key a phone does not have.
            */}
            <div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] motion-safe:animate-[overlay-in_200ms_ease-out]"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Search components and pages"
              className="surface-3 relative w-full max-w-xl overflow-hidden rounded-2xl motion-safe:animate-[dialog-in_260ms_var(--ease-out-expo)]"
            >
              <div className="flex items-center gap-3 border-b border-rule px-4">
                <Search aria-hidden="true" className="size-4 shrink-0 text-graphite-soft" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search components and pages…"
                  aria-label="Search"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls="command-list"
                  aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  className="focus-ring-none w-full bg-transparent py-4 text-[0.9375rem] text-ink outline-none placeholder:text-graphite-soft"
                />
                {/* A real button: `ESC` for a keyboard, a cross for a finger. */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close search"
                  className="-mr-2 inline-flex shrink-0 items-center justify-center rounded-md p-2 text-graphite-soft transition-colors duration-200 hover:text-ink"
                >
                  <kbd className="numeric rounded border border-rule px-1.5 py-0.5 text-[0.625rem] [@media(hover:none)]:hidden">
                    ESC
                  </kbd>
                  <X aria-hidden="true" className="hidden size-4 [@media(hover:none)]:block" />
                </button>
              </div>

              <ul
                ref={listRef}
                id="command-list"
                role="listbox"
                aria-label="Results"
                className="scroll-thin max-h-[46dvh] overflow-y-auto p-2"
              >
                {results.length === 0 && (
                  <li className="px-3 py-8 text-center text-sm text-graphite">
                    No match for “{query}”.
                  </li>
                )}

                {groups.map((group) => (
                  <li key={group.name}>
                    <p className="axis-label px-3 pb-1 pt-3">{group.name}</p>
                    <ul role="group" aria-label={group.name}>
                      {group.items.map((item) => (
                        <li
                          key={item.id}
                          id={`cmd-${item.id}`}
                          role="option"
                          aria-selected={item.index === active}
                          data-index={item.index}
                          onMouseEnter={() => setActive(item.index)}
                          onClick={() => commit(item)}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm",
                            item.index === active
                              ? "bg-brand/10 text-ink"
                              : "text-graphite hover:bg-paper-sunk",
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <ArrowRight
                              aria-hidden="true"
                              className={cn(
                                "size-3.5 shrink-0 transition-opacity",
                                item.index === active ? "text-brand-deep opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="truncate font-medium">{item.label}</span>
                          </span>
                          {item.hint && (
                            <span className="numeric shrink-0 text-xs text-brand-deep">
                              {item.hint}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-4 border-t border-rule px-4 py-2.5 text-[0.6875rem] text-graphite-soft">
                {/* Keyboard hints mean nothing to a finger. */}
                <span className="inline-flex items-center gap-1.5 [@media(hover:none)]:hidden">
                  <kbd className="numeric rounded border border-rule px-1 py-0.5">↑↓</kbd> navigate
                </span>
                <span className="inline-flex items-center gap-1.5 [@media(hover:none)]:hidden">
                  <kbd className="numeric rounded border border-rule px-1 py-0.5">
                    <CornerDownLeft className="size-2.5" aria-hidden="true" />
                  </kbd>
                  open
                </span>
                <span className="numeric ml-auto">
                  {results.length} result{results.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
