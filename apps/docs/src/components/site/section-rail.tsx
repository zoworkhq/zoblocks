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

  React.useEffect(() => {
    function update() {
      // 40% down the viewport: the section a reader is actually looking at,
      // not the one just scrolling past the top edge.
      const line = window.innerHeight * 0.4;
      let current = sections[0]?.id ?? "";
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= line) current = section.id;
      }
      setActive(current);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  // Keep the active tab visible when the bar scrolls horizontally on narrow screens.
  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-id="${active}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-13 z-30 border-b border-rule bg-paper/85 backdrop-blur-xl"
    >
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
