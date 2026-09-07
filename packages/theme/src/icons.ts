/**
 * The glyphs a customer may replace, and the ones they may not.
 *
 * "A custom icon set" sounds like two hundred icons across the design system.
 * Read against the library it is twenty-nine, all of them chrome in one
 * component — send, stop, close, copy, the chevron — plus a second group that
 * must never be swappable at all.
 *
 * That second group is the reason this file is a registry rather than a list of
 * filenames. The switch draws four marks and one of them, `unknown`, is that
 * component's entire clinical contribution: a binary control cannot tell "no"
 * from "nobody asked". A customer who replaces it with something that reads as
 * "off" has silently deleted the distinction the component exists for, and
 * nothing downstream would notice. That is the same failure the clinical colour
 * rule exists to prevent, so it is refused the same way — declared here,
 * enforced by the schema, and re-checked on save.
 *
 * Everything else that draws an `<svg>` in this library — the five loaders, the
 * avatar, the switch's progress ring, signature ink — is generated artwork
 * rather than a glyph. It is computed from data or animated at render time,
 * so there is no file to replace and it does not appear here.
 */

export interface IconSlot {
  /** Stable id. Becomes `--zb-icon-{slot}` and the upload's filename match. */
  slot: string;
  /** What it is, for somebody choosing which file to drop on it. */
  label: string;
  /** Which component draws it, so the app can group the grid. */
  component: string;
  /**
   * Why it cannot be replaced, or absent when it can.
   *
   * Present means refused — and the string is the refusal message, because a
   * lock without a reason reads as an oversight and generates a support ticket
   * asking to have it removed.
   */
  locked?: string;
}

/**
 * The copilot's chrome. Pure affordance: nothing about a paper aeroplane
 * meaning "send" is load-bearing, and a customer whose product uses a different
 * send glyph everywhere else is right to want theirs.
 */
const COPILOT: readonly IconSlot[] = [
  { slot: "shortcut", label: "Shortcuts", component: "copilot" },
  { slot: "prepare", label: "Prepare", component: "copilot" },
  { slot: "look-up", label: "Look up", component: "copilot" },
  { slot: "work-up", label: "Work up", component: "copilot" },
  { slot: "mic", label: "Dictate", component: "copilot" },
  { slot: "send", label: "Send", component: "copilot" },
  { slot: "stop", label: "Stop", component: "copilot" },
  { slot: "close", label: "Close", component: "copilot" },
  { slot: "chevron-down", label: "Chevron", component: "copilot" },
  { slot: "plus", label: "Add", component: "copilot" },
  { slot: "history", label: "History", component: "copilot" },
  { slot: "panel", label: "Side panel", component: "copilot" },
  { slot: "thumb-up", label: "Helpful", component: "copilot" },
  { slot: "thumb-down", label: "Not helpful", component: "copilot" },
  { slot: "copy", label: "Copy", component: "copilot" },
  { slot: "insert", label: "Insert into note", component: "copilot" },
  { slot: "more", label: "More actions", component: "copilot" },
  { slot: "verify", label: "Show sources", component: "copilot" },
  { slot: "book", label: "Reference", component: "copilot" },
  { slot: "expand", label: "Expand", component: "copilot" },
  { slot: "collapse", label: "Collapse", component: "copilot" },
  { slot: "new-chat", label: "New thread", component: "copilot" },
  { slot: "person", label: "Person", component: "copilot" },
  { slot: "alert", label: "Alert", component: "copilot" },
  { slot: "lock", label: "Locked", component: "copilot" },
  { slot: "grid", label: "All modes", component: "copilot" },
  { slot: "thought", label: "Reasoning", component: "copilot" },
  { slot: "flag", label: "Flag a problem", component: "copilot" },
  { slot: "spark", label: "Copilot", component: "copilot" },
];

/**
 * Shown in the app and refused there, rather than hidden.
 *
 * Hiding them would make the refusal invisible and the list look arbitrary —
 * somebody would ask why the switch is missing. The token editor already shows
 * clinical rows locked with the reason attached, and this is the same
 * treatment for the same argument.
 */
const LOCKED: readonly IconSlot[] = [
  {
    slot: "switch-on",
    label: "Switch · on",
    component: "switch",
    locked:
      "The switch's marks carry its meaning rather than decorating it. A tick that no longer reads as a tick makes a recorded clinical value ambiguous.",
  },
  {
    slot: "switch-unknown",
    label: "Switch · unknown",
    component: "switch",
    locked:
      "This mark is the whole reason the component has a third value: it distinguishes “no” from “nobody asked”. Replacing it with something that reads as “off” deletes that distinction silently.",
  },
  {
    slot: "switch-queued",
    label: "Switch · queued",
    component: "switch",
    locked:
      "It says the value has not reached the record yet. A glyph that looks settled would tell a clinician something was saved when it was not.",
  },
  {
    slot: "switch-locked",
    label: "Switch · read-only",
    component: "switch",
    locked:
      "It says this value cannot be changed here. Anything less legible invites somebody to keep trying.",
  },
  {
    slot: "accordion-chevron",
    label: "Accordion · chevron",
    component: "accordion",
    locked:
      "It rotates to show open and closed state, so it has to be a shape whose rotation is visible. An arbitrary glyph breaks the only affordance the header has.",
  },
];

export const ICON_SLOTS: readonly IconSlot[] = [...COPILOT, ...LOCKED];

/** The ones a customer may actually set. */
export const REPLACEABLE_SLOTS: readonly string[] = COPILOT.map((s) => s.slot);

export function iconSlot(slot: string): IconSlot {
  const found = ICON_SLOTS.find((s) => s.slot === slot);
  if (!found) throw new Error(`Unknown icon slot: ${slot}`);
  return found;
}

/** `--zb-icon-send`. The property a stylesheet reads and a bridge may not. */
export function iconVar(slot: string): string {
  return `--zb-icon-${slot}`;
}
