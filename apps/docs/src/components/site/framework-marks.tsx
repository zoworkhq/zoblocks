/**
 * The three design languages, as marks.
 *
 * A label alone works, but the switcher sits above a preview whose whole job
 * is to show what a framework looks like, and the marks are how a reader
 * recognises which one they are looking at before reading anything.
 *
 * **Provenance, because these are other projects' trademarks.**
 *
 * - Oxygen's mark is ours: the same two bonded circles as `OxygenMark` in
 *   `chrome.tsx`, at the size this control needs.
 * - Ant Design's is the project's own `AntDesignOutlined` glyph, copied from
 *   `@ant-design/icons-svg` (MIT). The path is unmodified. It is inlined
 *   rather than imported because that package is a transitive dependency of
 *   antd rather than one this app declares, and reaching into a hoisted
 *   transitive is how a build breaks on an unrelated upgrade.
 * - Material UI's is **ours, not theirs** — a geometric stand-in in MUI's own
 *   brand blue. MUI ships no logo in any npm package we depend on, and
 *   guessing at a trademark is worse than obviously not being it. Replace it
 *   with the official SVG from MUI's brand assets, unmodified and at their
 *   published clear space, before this ships publicly.
 *
 * All three are used only to name their own framework, and none is recoloured
 * to Oxygen's palette. Oxygen UI is not affiliated with either project.
 */

import type { DesignLanguage } from "@/lib/design-language";

const SIZE = "size-4";

export function OxygenLanguageMark({ className = SIZE }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 16" className={className} aria-hidden="true">
      <line x1="8" y1="8" x2="20" y2="8" stroke="var(--color-oxygen)" strokeWidth="2.5" />
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function AntDesignMark({ className = SIZE }: { className?: string }) {
  return (
    <svg viewBox="64 64 896 896" className={className} aria-hidden="true" fill="#1677ff">
      <path d="M716.3 313.8c19-18.9 19-49.7 0-68.6l-69.9-69.9.1.1c-18.5-18.5-50.3-50.3-95.3-95.2-21.2-20.7-55.5-20.5-76.5.5L80.9 474.2a53.84 53.84 0 000 76.4L474.6 944a54.14 54.14 0 0076.5 0l165.1-165c19-18.9 19-49.7 0-68.6a48.7 48.7 0 00-68.7 0l-125 125.2c-5.2 5.2-13.3 5.2-18.5 0L189.5 521.4c-5.2-5.2-5.2-13.3 0-18.5l314.4-314.2c.4-.4.9-.7 1.3-1.1 5.2-4.1 12.4-3.7 17.2 1.1l125.2 125.1c19 19 49.8 19 68.7 0zM408.6 514.4a106.3 106.2 0 10212.6 0 106.3 106.2 0 10-212.6 0zm536.2-38.6L821.9 353.5c-19-18.9-49.8-18.9-68.7.1a48.4 48.4 0 000 68.6l83 82.9c5.2 5.2 5.2 13.3 0 18.5l-81.8 81.7a48.4 48.4 0 000 68.6 48.7 48.7 0 0068.7 0l121.8-121.7a53.93 53.93 0 00-.1-76.4z" />
    </svg>
  );
}

export function MaterialUiMark({ className = SIZE }: { className?: string }) {
  // Placeholder geometry — see the file note. Three sheared quadrilaterals in
  // MUI's brand blue (#007FFF), stepped in opacity so the shape reads at 16px.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="#007fff">
      <path d="M1.5 15.6V8.4l6.2 3.6v7.2Z" opacity="0.55" />
      <path d="M7.7 12 13.9 8.4v7.2L7.7 19.2Z" opacity="0.8" />
      <path d="M13.9 8.4 20.1 4.8V12l-6.2 3.6Z" />
    </svg>
  );
}

export const LANGUAGE_MARK: Record<
  DesignLanguage,
  (props: { className?: string }) => React.JSX.Element
> = {
  oxygen: OxygenLanguageMark,
  antd: AntDesignMark,
  mui: MaterialUiMark,
};
