"use client";

/**
 * In-page section navigation for the documentation pages.
 *
 * This was originally a vertical rail placed in the content flow under the
 * install command. On a page built from full-width bands that left it stranded
 * in a wide, mostly-empty block — a sidebar with no sidebar to live in.
 *
 * A horizontal bar that sticks under the header fits the band layout, costs no
 * dead space, and works identically at every breakpoint.
 *
 * The active section is resolved by nearest-heading-above-the-fold rather than
 * by IntersectionObserver ratios, which is stable when sections differ wildly
 * in height (the source block is many times the height of the header).
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RailSection {
  id: string;
  label: string;
}

export function SectionRail({ sections }: { sections: RailSection[] }) {
  const [active, setActive] = React.useState(sections[0]?.id ?? "");
  const listRef = React.useRef<HTMLUListElement>(null);

  /*
   * Coalesced to one measurement per frame.
   *
   * This ran on every scroll event. A trackpad emits them far faster than the
   * page paints, and each pass called `getBoundingClientRect` once per section
   * plus `documentElement.scrollHeight` — every one of which forces a
   * synchronous layout, on a document that is tens of thousands of pixels tall.
   * That is measured layout work per event rather than per frame, and it is
   * felt as the scroll being heavy rather than as anything visibly wrong.
   *
   * The reads now happen inside `requestAnimationFrame`, so at most one pass
   * runs per painted frame no matter how many events arrive, and it runs at the
   * point in the frame where layout is being computed anyway.
   */
  React.useEffect(() => {
    let frame = 0;

    function update() {
      // 40% down the viewport: the section a reader is actually looking at,
      // not the one just scrolling past the top edge.
      const line = window.innerHeight * 0.4;
      let current = sections[0]?.id ?? "";
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= line) current = section.id;
      }

      /*
       * At the end of the document, the last section wins outright.
       *
       * A section shorter than 60% of the viewport can be entirely on screen
       * and still start below the 40% line, so it never became current at all
       * — scrolled fully to the bottom, with Related filling the screen, the
       * rail went on claiming the reader was in Quality. There is nowhere
       * further to scroll to fix that, which makes it the one case the line
       * cannot answer.
       */
      const documentEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const last = sections.at(-1);
      if (documentEnd && last && document.getElementById(last.id)) current = last.id;

      setActive(current);
    }

    function schedule() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sections]);

  /*
   * Keep the active tab visible when the bar scrolls horizontally on narrow
   * screens — by moving this list, and nothing else.
   *
   * This used to call `scrollIntoView`, which is the wrong tool twice over.
   * It walks *every* scrollable ancestor up to the document, and `html` carries
   * `scroll-behavior: smooth`, so each call started an animated document scroll.
   * The active section changes while the reader is scrolling, so that fired
   * mid-gesture, repeatedly, competing with their own momentum — the page
   * stuttering and yanking under the pointer with nothing on screen to explain
   * it. Adjusting `scrollLeft` by the measured overhang cannot reach the
   * document at all.
   */
  React.useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector(`[data-id="${active}"]`);
    if (!list || !item) return;

    const listBox = list.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();

    if (itemBox.left < listBox.left) {
      list.scrollLeft -= listBox.left - itemBox.left;
    } else if (itemBox.right > listBox.right) {
      list.scrollLeft += itemBox.right - listBox.right;
    }
  }, [active]);

  /*
   * The bar is opaque rather than blurred.
   *
   * It sits directly beneath the header, which is itself a full-width
   * `backdrop-blur(24px)`. Two stacked backdrop filters mean the compositor
   * re-blurs the full viewport width twice on every scrolled frame, and the
   * second one buys nothing a reader can see: it is a 45px strip against the
   * page background and was already almost opaque at 85%. The blur was costing
   * most of the scroll's smoothness to soften a few pixels nobody looks through.
   */
  return (
    <nav aria-label="On this page" className="sticky top-13 z-30 border-b border-rule bg-paper">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <ul ref={listRef} className="scroll-hidden flex gap-1 overflow-x-auto">
          {sections.map((section) => {
            const current = active === section.id;
            return (
              <li key={section.id} data-id={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  aria-current={current ? "true" : undefined}
                  className={cn(
                    "relative block whitespace-nowrap px-3 py-3 text-[0.8125rem] transition-colors duration-200",
                    current ? "font-medium text-ink" : "text-graphite hover:text-ink",
                  )}
                >
                  {section.label}
                  {/* Same measured-underline device as the main nav, so "you
                      are here" reads identically at both levels. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-3 bottom-0 h-px origin-left bg-oxygen transition-transform duration-400 ease-[var(--ease-out-expo)]",
                      current ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
