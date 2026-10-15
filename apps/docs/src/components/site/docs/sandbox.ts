/**
 * Where a component's runnable demo lives online.
 *
 * The demos are real Vite projects in their own repository, one folder per
 * component, each with the component's registry source copied in the way
 * `zoblocks add` would. StackBlitz and CodeSandbox both read a folder straight
 * from GitHub, so a link is all this site needs — no project is generated in
 * the browser, and what opens is always what is on `main` there.
 *
 * A component is listed here once its folder exists. A button that opens a
 * 404 inside someone else's editor is worse than no button, so the set is
 * explicit rather than derived from the catalogue.
 */

export const DEMO_REPO = "md-nabas-pm/zoblocks-examples";

export const HOSTED_DEMOS: ReadonlySet<string> = new Set([
  "accordion",
  "breath-loader",
  "care-timeline",
  "clinical-status",
  "data-grid",
  "date-picker",
  "helix-loader",
  "infusion-loader",
  "pulse-loader",
  "recorder",
  "rhythm-loader",
  "switch",
]);

export interface Platform {
  id: string;
  label: string;
  /** Two-letter mark drawn in the button, as on the design. */
  mark: string;
  href: (demo: string) => string;
}

/** Append a platform here; the order is the order the buttons render in. */
export const PLATFORMS: readonly Platform[] = [
  {
    id: "stackblitz",
    label: "StackBlitz",
    mark: "SB",
    href: (demo) =>
      `https://stackblitz.com/github/${DEMO_REPO}/tree/main/demos/${demo}?file=src/App.tsx`,
  },
  {
    id: "codesandbox",
    label: "CodeSandbox",
    mark: "CS",
    href: (demo) => `https://codesandbox.io/p/devbox/github/${DEMO_REPO}/tree/main/demos/${demo}`,
  },
];

export interface DemoLink {
  id: string;
  label: string;
  mark: string;
  href: string;
  title: string;
}

/** The buttons for a component, or none when it has no hosted demo yet. */
export function demoLinks(name: string, title: string): DemoLink[] {
  if (!HOSTED_DEMOS.has(name)) return [];
  return PLATFORMS.map((platform) => ({
    id: platform.id,
    label: platform.label,
    mark: platform.mark,
    href: platform.href(name),
    title: `Open the ${title} demo in ${platform.label}`,
  }));
}
