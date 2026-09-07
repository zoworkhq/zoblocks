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
 * No dependency: `lucide-react` is 1.4MB installed for a dozen glyphs, and a
 * registry component that is copied into a customer's tree should not drag an
 * icon library in behind it.
 *
 * ---
 *
 * **Each glyph is a masked span rather than an inline `<svg>`, so a customer
 * can replace it.** The geometry moved to `icons.css`, where every slot reads
 * `mask-image: var(--zb-icon-{slot}, <built-in>)` — an unset property draws
 * what shipped, a set one draws theirs. CSS rather than a React prop because
 * the Tailwind skin is a file copied into the customer's tree and a framework
 * bridge writes CSS; neither imports anything from here, and both get this for
 * free.
 *
 * Sized by `em` so they scale with whatever text they sit beside, painted with
 * `currentColor` so they still inherit its colour, and `aria-hidden` exactly as
 * before — a span with a mask is as invisible to assistive technology as the
 * `aria-hidden` SVG it replaces.
 */

import type { HTMLAttributes, ReactElement } from "react";

export type IconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children">;

/*
 * The slot travels as `data-icon`, not as part of the class name.
 *
 * A class assembled from a variable is one Tailwind cannot see when it scans
 * source text, and the repository lints against exactly that. These are the
 * copilot's own classes rather than Tailwind's so nothing would have gone
 * missing here — but an attribute carries the same information without the
 * trap, and it keeps the app free to render these spans too.
 */
function icon(slot: string) {
  return function Glyph({ className, ...props }: IconProps) {
    return (
      <span
        {...props}
        aria-hidden="true"
        data-icon={slot}
        className={className ? "zb-icon " + className : "zb-icon"}
      />
    );
  };
}

/** The square glyph from the dock. Opens shortcuts; also the "/" affordance. */
export const ShortcutIcon = icon("shortcut");

/** Prepare — a checklist. */
export const PrepareIcon = icon("prepare");

/** Look up — a magnifier. */
export const LookUpIcon = icon("look-up");

/** Work up — a stethoscope. */
export const WorkUpIcon = icon("work-up");

export const MicIcon = icon("mic");

export const SendIcon = icon("send");

export const StopIcon = icon("stop");

export const CloseIcon = icon("close");

export const ChevronDownIcon = icon("chevron-down");

export const PlusIcon = icon("plus");

/** Thread history. */
export const HistoryIcon = icon("history");

/** Toggle the side panel. */
export const PanelIcon = icon("panel");

export const ThumbUpIcon = icon("thumb-up");

export const ThumbDownIcon = icon("thumb-down");

export const CopyIcon = icon("copy");

/** Insert into the note — a list with a plus. */
export const InsertIcon = icon("insert");

export const MoreIcon = icon("more");

/** Show sources — a shield with a check. The verification control. */
export const VerifyIcon = icon("verify");

export const BookIcon = icon("book");

export const ExpandIcon = icon("expand");

export const CollapseIcon = icon("collapse");

/** New chat — a pencil over a square. */
export const NewChatIcon = icon("new-chat");

export const PersonIcon = icon("person");

export const AlertIcon = icon("alert");

export const LockIcon = icon("lock");

export const GridIcon = icon("grid");

/** The reasoning disclosure marker. */
export const ThoughtIcon = icon("thought");

/** Flag a problem with an answer. Feeds the eval loop. */
export const FlagIcon = icon("flag");

/** The mode chip in the dock, when the tray is closed. */
export const SparkIcon = icon("spark");

/** Resolve a mode id to its glyph. Falls back rather than rendering nothing. */
export function modeIcon(modeId: string): (props: IconProps) => ReactElement {
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
