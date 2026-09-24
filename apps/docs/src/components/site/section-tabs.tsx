"use client";

/**
 * The section bar on a component page, as tabs rather than as anchors.
 *
 * It was a row of `#links` over one very long document with a scroll-spy
 * underline. Clicking "Usage & props" jumped the page to the section — a
 * long, animated document scroll past everything in between — and Rahul
 * called it what it is: the page leaping about under the reader. What a
 * reader expects from a row like this is what every other library gives them:
 * one section at a time, in place.
 *
 * So this is an APG tablist. One panel is shown, the rest are `hidden`, and
 * nothing scrolls when a tab is chosen. Three things are deliberately kept
 * from the old bar:
 *
 *   - Every section still renders on the server and stays in the document.
 *     Hidden, not unmounted. Crawlers and answer engines read all of it, the
 *     axe audit still sees every state, and a reader who prints gets the page.
 *   - The URL still carries the section. Choosing a tab writes `#usage` with
 *     `replaceState`, so a link copied from the bar opens the same tab, and an
 *     old `#usage` link from anywhere still lands on Usage — via `hashchange`,
 *     which is the one case that *does* scroll, once, to the bar, because a
 *     reader arriving by link has to be shown where they landed.
 *   - The bar is sticky under the site header, so a long panel — Source runs
 *     to thousands of lines — keeps its tabs within reach.
 *
 * The panels are the page's own `<section id=…>` children. This component
 * does not know what is in them; it reads each one's `id`, gives it the tab
 * role and labelling, and toggles `hidden`. That is why the page's JSX did
 * not have to move: wrap the run of sections, and they become panels.
 *
 * Automatic activation — arrow keys move focus *and* select — because every
 * panel is already rendered and switching costs nothing.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RailSection {
  id: string;
  label: string;
}

/** Height of the scrolled site header: `top-13`, which is what the bar sticks under. */
const HEADER = 52;

/** Width of the edge fade on a strip that scrolls: `.tab-strip` in globals.css. */
const FADE = 28;

export function SectionTabs({
  sections,
  children,
}: {
  sections: readonly RailSection[];
  children: React.ReactNode;
}) {
  const ids = React.useMemo(() => sections.map((section) => section.id), [sections]);
  const key = ids.join("|");
  const [active, setActive] = React.useState(ids[0] ?? "");
  const bar = React.useRef<HTMLElement>(null);
  const list = React.useRef<HTMLUListElement>(null);
  const uid = React.useId();

  /*
   * True once the client has taken over, surfaced as `data-hydrated` purely so
   * tests can wait for it — the same contract as the signature demo. A tab
   * clicked before hydration lands on server-rendered markup and does nothing,
   * and on a contended CI runner a fixed sleep did not cover that gap.
   */
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  /*
   * Which edges of the strip hide tabs.
   *
   * On a phone eight tabs need about 700px and the strip has 300. The
   * scrollbar is hidden, so nothing said the other five existed. A fade at the
   * clipped edge is that sign, and it goes away at the end of the scroll.
   */
  const [edges, setEdges] = React.useState({ start: false, end: false });
  React.useEffect(() => {
    const el = list.current;
    if (!el) return;
    const read = () => {
      const start = el.scrollLeft > 1;
      const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    read();
    el.addEventListener("scroll", read, { passive: true });
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", read);
      observer.disconnect();
    };
  }, []);

  /*
   * The hash chooses the tab — on arrival, and whenever it changes.
   *
   * On arrival the browser has already tried to scroll to `#usage` and found
   * it hidden, so nothing moved; selecting the tab is enough. On a later
   * `hashchange` — a link on the page, or the back button — the bar is
   * brought to the top of the viewport as well, once, because a reader who
   * followed a link is owed a visible landing.
   */
  React.useEffect(() => {
    const fromHash = (scroll: boolean) => {
      const id = window.location.hash.slice(1);
      if (!id || !ids.includes(id)) return;
      setActive(id);
      if (scroll && bar.current) {
        const top = bar.current.getBoundingClientRect().top + window.scrollY - HEADER;
        window.scrollTo({
          top,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      }
    };
    fromHash(false);
    const onHash = () => fromHash(true);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // `key` stands in for `ids`: same content, stable identity.
  }, [key, ids]);

  const select = React.useCallback((id: string) => {
    setActive(id);
    /*
     * The URL carries the tab, and the router is kept out of it.
     *
     * Three ways to write a hash, two of them wrong here. `location.hash = …`
     * is a navigation and scrolls. `router.replace("#id", { scroll: false })`
     * dropped the hash altogether. A bare `history.replaceState` is patched by
     * the App Router: it saw the new URL, went looking for `#usage` — hidden
     * at that instant — and scrolled the document to the top, measured at
     * 300px → 3px.
     *
     * The patch steps aside when the state it wrote is handed back to it —
     * `history.state` carries the router's own marker — so this reaches the
     * native call and nothing else: the address bar changes, the page does
     * not move, and the router's tree is untouched, which is right, because
     * nothing about the route changed.
     */
    window.history.replaceState(window.history.state, "", `#${id}`);
  }, []);

  /*
   * Keep the chosen tab visible when the bar scrolls sideways on a phone —
   * by moving this list and nothing else. `scrollIntoView` walks every
   * scrollable ancestor and the document has smooth scrolling, so it would
   * start an animated page scroll, which is exactly what tabs must not do.
   */
  React.useEffect(() => {
    const el = list.current;
    const item = el?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!el || !item) return;
    const listBox = el.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    // Clear of the edge fade, not merely inside the strip.
    if (itemBox.left < listBox.left + FADE) el.scrollLeft -= listBox.left + FADE - itemBox.left;
    else if (itemBox.right > listBox.right - FADE)
      el.scrollLeft += itemBox.right - (listBox.right - FADE);
  }, [active]);

  const onKey = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const index = ids.indexOf(active);
    let next: number | undefined;
    if (event.key === "ArrowRight") next = (index + 1) % ids.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + ids.length) % ids.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ids.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    const id = ids[next]!;
    select(id);
    list.current?.querySelector<HTMLButtonElement>(`[data-id="${id}"] button`)?.focus();
  };

  const tabId = (id: string) => `${uid}-tab-${id}`;

  /*
   * The sections become the panels.
   *
   * Only an element whose `id` is one of the tabs is touched; anything else in
   * the run — a script, a stray wrapper — is rendered as it came. Fragments
   * are walked, because a conditional block sometimes arrives as one.
   */
  const panels = (nodes: React.ReactNode): React.ReactNode =>
    React.Children.map(nodes, (child) => {
      if (!React.isValidElement(child)) return child;
      if (child.type === React.Fragment) {
        const inner = (child.props as { children?: React.ReactNode }).children;
        return <React.Fragment key={child.key ?? undefined}>{panels(inner)}</React.Fragment>;
      }
      const id = (child.props as { id?: unknown }).id;
      if (typeof id !== "string" || !ids.includes(id)) return child;
      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        hidden: id !== active,
        role: "tabpanel",
        "aria-labelledby": tabId(id),
        tabIndex: 0,
      });
    });

  return (
    <>
      {/*
        Opaque rather than blurred: it sits under the header's own backdrop
        blur, and a second one re-blurs the viewport every scrolled frame to
        soften a strip nobody looks through.
      */}
      <nav
        ref={bar}
        aria-label="On this page"
        data-hydrated={hydrated || undefined}
        /*
          Not sticky on a short screen. A landscape phone is 393px tall, and
          the header plus this bar took 97 of them on every scrolled frame.
        */
        className="sticky top-13 z-30 border-b border-rule bg-paper [@media(max-height:500px)]:static"
      >
        {/* No gutter of its own under `sm`: the component page already has one. */}
        <div className="mx-auto max-w-6xl px-5 max-sm:px-0 sm:px-8">
          <ul
            ref={list}
            role="tablist"
            onKeyDown={onKey}
            data-fade-start={edges.start || undefined}
            data-fade-end={edges.end || undefined}
            className="tab-strip scroll-hidden flex gap-1 overflow-x-auto"
          >
            {sections.map((section) => {
              const current = active === section.id;
              return (
                <li key={section.id} data-id={section.id} role="presentation" className="shrink-0">
                  <button
                    type="button"
                    role="tab"
                    id={tabId(section.id)}
                    aria-selected={current}
                    aria-controls={section.id}
                    tabIndex={current ? 0 : -1}
                    onClick={() => select(section.id)}
                    className={cn(
                      "relative block whitespace-nowrap px-3 py-3 text-[0.8125rem] transition-colors duration-200",
                      current ? "font-medium text-ink" : "text-graphite hover:text-ink",
                    )}
                  >
                    {section.label}
                    {/* The same measured underline as the site nav, so "you
                        are here" reads identically at both levels. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3 bottom-0 h-px origin-left bg-brand transition-transform duration-400 ease-[var(--ease-out-expo)]",
                        current ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {panels(children)}
    </>
  );
}
