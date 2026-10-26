"use client";

/**
 * "On this page": the section list beside a component page, with scroll-spy.
 *
 * Replaces the tab bar the page used to have. Every section is in one
 * document again, so a reader can scroll it end to end, print it, or search
 * it with the browser — and this list is the index into it, marking the
 * section under the header as the page moves.
 *
 * Choosing an entry scrolls to it and writes the hash with `replaceState`, so a
 * copied link opens the same place without adding a history entry per click.
 * A link that arrives with a hash is handled by the browser, which lands on the
 * section's `scroll-margin-top`.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TocEntry {
  id: string;
  label: string;
  /** Examples sit one level in, under "Examples". */
  depth?: 0 | 1;
}

/**
 * Where a section counts as current. The site's `scroll-padding-top` (72px)
 * is where an anchor lands, so the line sits a little below it: a section
 * reached by clicking its entry is the one marked.
 */
const LINE = 140;

export function OnThisPage({ entries }: { entries: readonly TocEntry[] }) {
  const [active, setActive] = React.useState(entries[0]?.id ?? "");

  React.useEffect(() => {
    const ids = entries.map((entry) => entry.id);
    let frame = 0;
    const measure = () => {
      frame = 0;
      let current = ids[0] ?? "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < LINE) current = id;
      }
      // At the very bottom the last short sections can never reach the line,
      // so the last one is marked rather than leaving the list stuck above it.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = ids[ids.length - 1] ?? current;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    // A link that arrives with a hash is scrolled by the browser after
    // hydration, sometimes without a scroll event reaching us; measure again
    // once it has settled.
    const settle = window.setTimeout(onScroll, 250);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", onScroll);
    };
  }, [entries]);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-[calc(var(--header-h)+2.75rem)] hidden max-h-[calc(100vh-var(--header-h)-4rem)] w-[200px] flex-none self-start overflow-y-auto xl:block"
    >
      <p className="m-0 pb-2.5 pl-3 text-xs font-medium text-graphite-soft">On this page</p>
      <ul className="m-0 flex list-none flex-col border-l border-rule p-0">
        {entries.map((entry) => {
          const on = entry.id === active;
          return (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                aria-current={on ? "location" : undefined}
                onClick={(event) => {
                  const el = document.getElementById(entry.id);
                  if (!el) return;
                  event.preventDefault();
                  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  /*
                   * Glide a short hop; jump a long one. A component page runs
                   * to ten thousand pixels, and a smooth scroll that far is
                   * seconds of travel past previews that mount as they enter
                   * view and move the target while it is underway — WebKit
                   * stops short of it outright. The same reasoning as the
                   * `scroll-behavior` note in globals.css, applied here.
                   */
                  const far = Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 1.5;
                  el.scrollIntoView({
                    behavior: reduce || far ? "auto" : "smooth",
                    block: "start",
                  });
                  history.replaceState(null, "", `#${entry.id}`);
                  setActive(entry.id);
                }}
                className={cn(
                  "-ml-px block border-l py-[5px] pr-2 text-[13px] leading-[1.4] no-underline transition-colors hover:text-ink",
                  entry.depth ? "pl-6" : "pl-3",
                  on ? "border-ink font-medium text-ink" : "border-transparent text-graphite",
                )}
              >
                {entry.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
