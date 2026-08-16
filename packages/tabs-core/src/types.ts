/**
 * The vocabulary. Nothing here imports anything.
 *
 * `label` is deliberately `unknown` rather than `ReactNode`: this package has
 * no opinion about what renders a label, and typing it as React would make the
 * core unusable from Vue, Svelte or a server that only needs the ARIA shape.
 * The React layer narrows it.
 */

/**
 * What the control *is*, which is a different question from what it looks
 * like. This is the only required option in the whole API — see
 * `validateTabsConfig` for why it has no default.
 */
export type SemanticMode = "tabs" | "nav" | "radiogroup" | "steps";

/** What the control looks like. Orthogonal to {@link SemanticMode}. */
export type TabVariant =
  | "segmented"
  | "underline"
  | "pill"
  | "enclosed"
  | "rail"
  | "ghost"
  | "stepper"
  | "command"
  | "card"
  | "stat"
  | "unstyled";

export type Orientation = "horizontal" | "vertical";

/**
 * `automatic` selects as focus moves; `manual` moves focus and waits for
 * Enter/Space. Manual is required when a panel fetches — automatic across six
 * tabs fires six requests and reads six live regions.
 */
export type Activation = "automatic" | "manual";

export type OverflowStrategy = "scroll" | "menu" | "collapse" | "wrap" | "none";

export type IndicatorKind = "auto" | "thumb" | "line" | "none";

export type TransitionKind = "slide" | "fade" | "view" | "none";

export type TabSize = "sm" | "md" | "lg";

export type FillMode = "none" | "equal" | "stretch";

/** Panel mounting. `lazy-once` mounts on first visit and keeps it mounted. */
export type MountStrategy = "eager" | "lazy" | "lazy-once";

/**
 * Colour is never the signal in Oxygen, so a tone always travels with a word
 * in the accessible name. See {@link describeCount}.
 */
export type Tone = "neutral" | "critical" | "high" | "normal";

/**
 * Offline and degraded connectivity are their own designed state. `stale`
 * shows cached content with a staleness marker; `unavailable` is present and
 * cannot load. Neither disables the tab — a clinician looking at stale vitals
 * needs to know they are stale, not that the section does not exist.
 */
export type Availability = "ready" | "stale" | "unavailable";

/** Step lifecycle, only meaningful when `as="steps"`. */
export type StepState = "done" | "current" | "locked";

/** How a change was requested. Carried to `onChange` so hosts can tell apart
 *  a deliberate click from a URL restore. */
export type ChangeSource = "pointer" | "keyboard" | "menu" | "url" | "programmatic";

export interface TabItem {
  /** Stable key. Never the array index — reordering would move selection. */
  value: string;
  label?: unknown;
  /**
   * Required when `label` is not a string. Typeahead, the overflow menu and
   * the collapsed `<select>` all need text, and a component that silently
   * degrades those is worse than one that asks.
   */
  textLabel?: string;
  icon?: unknown;
  count?: number;
  tone?: Tone;
  dot?: boolean | "dirty" | "error";
  disabled?: boolean;
  /** Mandatory when `disabled` — a control that refuses without saying why is
   *  indistinguishable from one that is broken. */
  disabledReason?: string;
  closable?: boolean;
  /** Only legal when `as="nav"`. */
  href?: string;
  availability?: Availability;
  state?: StepState;
  /** Escape hatch for host data; never read by the component. */
  meta?: Record<string, unknown>;
}

export interface AuditEvent {
  type:
    | "tabs.change"
    | "tabs.change-vetoed"
    | "tabs.disabled-attempt"
    | "tabs.restricted-attempt"
    | "tabs.close"
    | "tabs.add";
  /**
   * ISO 8601, and only present when the host supplied a `now` function.
   *
   * The component never reads the clock — an untestable dependency that also
   * breaks visual-regression determinism, and the same reason `Signature`
   * takes `now` as a prop. A host that wants timestamps passes `now`; a host
   * that already stamps its own audit log ignores this and uses its own.
   */
  at?: string;
  value?: string;
  from?: string;
  detail?: string;
}

/** The subset of a DOMRect this package needs. Passing plain numbers keeps
 *  the geometry testable without a DOM. */
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}
