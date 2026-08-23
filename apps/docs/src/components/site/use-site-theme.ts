"use client";

import * as React from "react";

/**
 * Follows the site's theme, and keeps following it.
 *
 * antd is themed by an algorithm passed in React, not by CSS that inherits, so
 * anything rendering antd inside this site has to be told. A component that
 * hardcodes `defaultAlgorithm` renders antd's light palette whatever the page
 * around it is doing — on the dark site that put near-black body text on a
 * near-black surface, and left the playground as a white card in a dark page.
 *
 * `false` on the server and on first paint, then corrected in an effect: the
 * class is written by a blocking script in `layout.tsx` before hydration, so
 * reading it during render would disagree with the server-rendered HTML.
 *
 * Shared rather than written per demo. The second copy is where the two
 * implementations start to differ, and the difference is invisible until
 * somebody switches theme on one page and not another.
 */
export function useSiteTheme(): boolean {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains("dark"));
    read();

    // The site toggle mutates the class rather than firing an event, so the
    // class itself is what gets watched.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}
