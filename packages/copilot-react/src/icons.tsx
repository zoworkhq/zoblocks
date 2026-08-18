/**
 * The icon set, shared by both skins.
 *
 * Presentational, and living in the headless package anyway. Two reasons that
 * is the right place rather than a compromise.
 *
 * **They are not decoration to the accessibility tree.** Every one renders
 * `aria-hidden` with `focusable="false"`, because in this component an icon is
 * *always* paired with a real accessible name on the control that holds it —
 * the dock's shortcut button, the message actions, the mode chips. An icon that
 * announced itself would double every one of those. Getting that wrong is an
 * accessibility defect rather than an ugly component, which is the test for
 * what belongs in this package.
 *
 * **Two skins drawing different glyphs for the same control is drift.** A
 * clinician who learns that the square glyph opens shortcuts in the antd build
 * should not have to relearn it in the Tailwind one.
 *
 * Stroke-based on a 24px grid, sized by `em` so they scale with whatever text
 * they sit beside rather than needing a size prop at every call site. No
 * dependency: `lucide-react` is 1.4MB installed for a dozen glyphs, and a
 * registry component that is copied into a customer's tree should not drag an
 * icon library in behind it.
 */

import type { SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** The square glyph from the dock. Opens shortcuts; also the "/" affordance. */
export const ShortcutIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <path d="M8.5 15.5 15.5 8.5" />
  </Icon>
);

/** Prepare — a checklist. */
export const PrepareIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M2.5 6.5l2 2 3-3.5" />
    <path d="M2.5 15.5l2 2 3-3.5" />
    <path d="M11 7h10M11 16h10" />
  </Icon>
);

/** Look up — a magnifier. */
export const LookUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20 20l-4.7-4.7" />
  </Icon>
);

/** Work up — a stethoscope. */
export const WorkUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 3v5.5a4.5 4.5 0 0 0 9 0V3" />
    <path d="M4.5 3H3M13.5 3H15" />
    <path d="M9 13v2.5a4.5 4.5 0 0 0 9 0V14" />
    <circle cx="18" cy="11.5" r="2.4" />
  </Icon>
);

export const MicIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="9.2" y="2.5" width="5.6" height="10.5" rx="2.8" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2" />
  </Icon>
);

export const SendIcon = (props: IconProps) => (
  <Icon strokeWidth={1.9} {...props}>
    <path d="M12 19.5V5M5.5 11.5 12 5l6.5 6.5" />
  </Icon>
);

export const StopIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <rect x="9.2" y="9.2" width="5.6" height="5.6" rx="1.2" />
  </Icon>
);

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icon>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Icon strokeWidth={1.9} {...props}>
    <path d="M6 9.5l6 6 6-6" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Icon>
);

/** Thread history. */
export const HistoryIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.3l3.2 2" />
  </Icon>
);

/** Toggle the side panel. */
export const PanelIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M14.5 4.5v15" />
  </Icon>
);

export const ThumbUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 21.5V10.5l4.6-7.4a2.3 2.3 0 0 1 2.2 3l-1 3.9h5.3a1.9 1.9 0 0 1 1.9 2.3l-1.5 6.5a1.9 1.9 0 0 1-1.9 1.5H7z" />
    <path d="M7 10.5H3v11h4" />
  </Icon>
);

export const ThumbDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <g transform="rotate(180 12 12)">
      <path d="M7 21.5V10.5l4.6-7.4a2.3 2.3 0 0 1 2.2 3l-1 3.9h5.3a1.9 1.9 0 0 1 1.9 2.3l-1.5 6.5a1.9 1.9 0 0 1-1.9 1.5H7z" />
      <path d="M7 10.5H3v11h4" />
    </g>
  </Icon>
);

export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="9" y="9" width="11.5" height="11.5" rx="2.5" />
    <path d="M5.5 15V5.5a2 2 0 0 1 2-2H16" />
  </Icon>
);

/** Insert into the note — a list with a plus. */
export const InsertIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 6.5h13M3.5 12h9M3.5 17.5h7" />
    <path d="M17.5 13.5v7M14 17h7" />
  </Icon>
);

export const MoreIcon = (props: IconProps) => (
  <Icon fill="currentColor" stroke="none" {...props}>
    <circle cx="5.5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="18.5" cy="12" r="1.5" />
  </Icon>
);

/** Show sources — a shield with a check. The verification control. */
export const VerifyIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 2.6 20 6v6c0 4.8-3.3 8.2-8 9.4C7.3 20.2 4 16.8 4 12V6z" />
    <path d="M9 12.2l2.2 2.2 4-4.4" />
  </Icon>
);

export const BookIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 4.5h5.5a3 3 0 0 1 3 3v12a2.4 2.4 0 0 0-2.4-2.4H3z" />
    <path d="M21 4.5h-5.5a3 3 0 0 0-3 3v12a2.4 2.4 0 0 1 2.4-2.4H21z" />
  </Icon>
);

export const ExpandIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9.5 3.5h-6v6M14.5 20.5h6v-6M3.5 3.5l6.5 6.5M20.5 20.5 14 14" />
  </Icon>
);

export const CollapseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 9.5h6v-6M20.5 14.5h-6v6M10 10 3.5 3.5M14 14l6.5 6.5" />
  </Icon>
);

/** New chat — a pencil over a square. */
export const NewChatIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.5H5.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V12" />
    <path d="M18.2 2.8a2 2 0 0 1 2.9 2.9L12 14.8l-3.8 1 1-3.8z" />
  </Icon>
);

export const PersonIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="8" r="3.8" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </Icon>
);

export const AlertIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.5 2.8 20h18.4z" />
    <path d="M12 9.5v4.5M12 17.2v.05" />
  </Icon>
);

export const LockIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Icon>
);

export const GridIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
  </Icon>
);

/** The reasoning disclosure marker. */
export const ThoughtIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8 17.5a5 5 0 0 1-1.6-9.7A4.5 4.5 0 0 1 15 6.3a4 4 0 0 1 1.6 7.6" />
    <path d="M12 12v9M9 15.5l3-2 3 2" />
  </Icon>
);

/** Flag a problem with an answer. Feeds the eval loop. */
export const FlagIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 21V4.5M5 4.5c4-2 8 2 12 0v9c-4 2-8-2-12 0" />
  </Icon>
);

/** The mode chip in the dock, when the tray is closed. */
export const SparkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M13.2 2.5 4.5 14h6.6l-1.3 7.5L19.5 10h-6.6z" />
  </Icon>
);

/** Resolve a mode id to its glyph. Falls back rather than rendering nothing. */
export function modeIcon(modeId: string): (props: IconProps) => React.ReactElement {
  switch (modeId) {
    case "prepare":
    case "between-visits":
      return PrepareIcon;
    case "work-up":
    case "formulate":
      return WorkUpIcon;
    case "look-up":
      return LookUpIcon;
    default:
      return SparkIcon;
  }
}
