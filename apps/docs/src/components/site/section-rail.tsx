"use client";

/**
 * In-page section navigation for the documentation pages.
 *
 * These pages are long and dense — preview, usage, props, guidance, quality,
 * source, related — and previously offered no way to move between them or to
 * see where you were. That is a usability gap on the pages a developer spends
 * the most time in.
 *
 * The active section is resolved by nearest-heading-above-the-fold rather than
 * by IntersectionObserver ratios, which is stable when sections differ wildly
 * in height (the source block is ten times the height of the header).
 */

import * as React from "react";

export interface RailSection {
  id: string;
  label: string;
}

export function SectionRail({ sections }: { sections: RailSection[] }) {
  const [active, setActive] = React.useState(sections[0]?.id ?? "");

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

  return (
    <nav aria-label="On this page" className="sticky top-24">
      <p className="axis-label mb-3">On this page</p>
      <ul>
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              // aria-current on a link inside a nav is the standard way to
              // expose "you are here" without inventing an ARIA pattern.
              aria-current={active === section.id ? "true" : undefined}
              className="rail-link"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
