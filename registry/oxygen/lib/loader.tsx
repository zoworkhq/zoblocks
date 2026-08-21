"use client";

/**
 * loader-core — everything the Oxygen loaders share.
 *
 * Each loader is installed on its own (`oxygen add pulse-loader`), and the
 * CLI pulls this file in as a dependency. Two things live here because
 * duplicating them per loader would mean five copies of the same clinical
 * judgement:
 *
 *   1. `useLoadingGate` — when a loader is allowed to be on screen at all.
 *      A loader that appears for 90 ms is a flash; one that disappears the
 *      instant it arrives is a flicker; one that never admits the system has
 *      stalled is a lie. All three are timing decisions, not visual ones.
 *   2. `LoaderFrame` — the shell: placement, scrim, label, hint, and the
 *      accessibility contract. The five loaders differ only in their art.
 *
 * The art constants are here too, so that a loader and its custom-element
 * twin in @oxygenui-design/loaders cannot drift. A parity test asserts it.
 *
 * Styling lives in `styles/oxygen-loader.css`, installed alongside this file.
 * The loaders deliberately use no Tailwind utilities of their own: keyframes
 * cannot be expressed as tokens, and a component whose motion depends on the
 * host's Tailwind config is a component that renders unstyled in a Vue app.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/**
 * A style object that may also carry CSS custom properties.
 *
 * React's CSSProperties has no room for `--ox-loader-beat`, and the usual
 * workaround is an `as React.CSSProperties` cast at every call site — which
 * also silences real typos in the properties beside it. A template-literal key
 * widens the type exactly as far as it needs to go and no further.
 */
export type LoaderVars = React.CSSProperties & Record<`--${string}`, string | number>;

export type LoaderSize = "sm" | "md" | "lg" | "xl";
export type LoaderMode = "inline" | "overlay" | "page";
export type LoaderMotion = "auto" | "reduced" | "full";
export type LoaderAnnounce = "polite" | "assertive" | "off";

/** Art width in pixels for each named size. */
export const LOADER_SIZE_PX: Record<LoaderSize, number> = {
  sm: 20,
  md: 32,
  lg: 56,
  xl: 88,
};

/**
 * Said once, here, so five loaders cannot each invent their own wording.
 * Names the situation and what remains possible — CONTENT.md §5.
 */
export const DEFAULT_SLOW_HINT = "Still loading. You can keep waiting or go back.";

export interface LoaderCommonProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Named step or an explicit art width in pixels. */
  size?: LoaderSize | number;
  /** `inline` sits in the flow; `overlay` covers its positioned ancestor; `page` covers the viewport. */
  mode?: LoaderMode;
  /**
   * What is loading. Always rendered — visibly when `showLabel`, and to
   * assistive technology either way, because a loader nobody can hear is a
   * silent wait.
   */
  label?: string;
  /** Show the label as text. Defaults to true for `overlay` and `page`. */
  showLabel?: boolean;
  /** A second line under the label. Never a substitute for it. */
  hint?: string;
  /** Cadence multiplier, 0.5–2. Clamped. */
  speed?: number;
  /** Wait this long before appearing, so a fast response never flashes a loader. */
  delay?: number;
  /** Once visible, stay at least this long, so the loader never blinks out. */
  minDuration?: number;
  /** Announce a stall after this long. 0 disables. */
  slowAfter?: number;
  /** Replaces the default stall wording. */
  slowHint?: string;
  /** Controlled visibility. Setting false runs the exit and respects `minDuration`. */
  open?: boolean;
  /** `auto` follows the OS; `reduced` forces the still state; `full` opts out of the OS preference. */
  motion?: LoaderMotion;
  /** Translucent backdrop behind `overlay` and `page`. */
  scrim?: boolean;
  /** Live-region politeness while indeterminate. */
  announce?: LoaderAnnounce;
  /** 0–100 turns the loader determinate. Omit for an unknown wait. */
  progress?: number;
  /** Fires once, when `slowAfter` elapses. */
  onSlow?: () => void;
  /** Rendered under the hint — a Retry or Go back control while someone waits. */
  actions?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/* Timing                                                              */
/* ------------------------------------------------------------------ */

export interface LoadingGateOptions {
  open?: boolean;
  delay?: number;
  minDuration?: number;
  slowAfter?: number;
  onSlow?: () => void;
}

export interface LoadingGateState {
  /** Whether the loader should be on screen right now. */
  visible: boolean;
  /** Whether the wait has passed `slowAfter`. */
  slow: boolean;
}

/**
 * The three timing rules, as one hook.
 *
 * Exported on its own because an application often needs the same decision for
 * something that is not an Oxygen loader — a skeleton, a disabled button, a
 * progress line in a table.
 */
export function useLoadingGate({
  open = true,
  delay = 0,
  minDuration = 0,
  slowAfter = 0,
  onSlow,
}: LoadingGateOptions = {}): LoadingGateState {
  const [visible, setVisible] = React.useState(open && delay <= 0);
  const [slow, setSlow] = React.useState(false);
  /** True while the minimum on-screen time has not yet elapsed. */
  const [held, setHeld] = React.useState(false);

  // Held in a ref so that an inline arrow function as `onSlow` does not restart
  // the stall timer on every render — which would mean it never fires.
  const onSlowRef = React.useRef(onSlow);
  React.useEffect(() => {
    onSlowRef.current = onSlow;
  }, [onSlow]);

  /**
   * The minimum duration is tracked with a timer rather than by comparing
   * clock readings. Reading the current time inside a component makes its
   * output depend on when it rendered, which is exactly what makes a visual
   * regression test flaky — and a countdown expresses the rule directly.
   */
  React.useEffect(() => {
    if (!visible || minDuration <= 0) {
      setHeld(false);
      return;
    }
    setHeld(true);
    const timer = setTimeout(() => setHeld(false), minDuration);
    return () => clearTimeout(timer);
  }, [visible, minDuration]);

  React.useEffect(() => {
    if (open) {
      if (visible || delay <= 0) {
        setVisible(true);
        return;
      }
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }

    setSlow(false);
    // Still inside the minimum. This effect runs again when the hold expires.
    if (!visible || held) return;
    setVisible(false);
  }, [open, delay, visible, held]);

  React.useEffect(() => {
    if (!visible || !open || slowAfter <= 0) return;
    const timer = setTimeout(() => {
      setSlow(true);
      onSlowRef.current?.();
    }, slowAfter);
    return () => clearTimeout(timer);
  }, [visible, open, slowAfter]);

  return { visible, slow };
}

/* ------------------------------------------------------------------ */
/* Value resolution                                                    */
/* ------------------------------------------------------------------ */

export function resolveLoaderSize(size: LoaderSize | number | undefined, fallback: LoaderSize) {
  if (typeof size === "number") return clamp(size, 12, 480);
  return LOADER_SIZE_PX[size ?? fallback];
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Beats per minute → the CSS period, clamped to a resting range.
 *
 * 40–100 is the clamp because this is decoration on a healthcare screen, not a
 * readout. A loader beating at 180 in a cardiology product would be read as a
 * number by the only people qualified to read it.
 */
export function beatMs(bpm: number | undefined, speed: number): number {
  // A NaN bpm is a caller mistake, not a request for the slowest rate. Ignore
  // it and fall back to the default the way an omitted value does.
  const usable = typeof bpm === "number" && !Number.isNaN(bpm);
  const rate = usable ? clamp(bpm, 40, 100) : 60 * clamp(speed, 0.5, 2);
  return Math.round(60000 / rate);
}

export function cycleMs(base: number, speed: number): number {
  return Math.round(base / clamp(speed, 0.5, 2));
}

/** Hairline strokes disappear at small sizes; below 28px the stroke stops scaling down. */
export function strokePx(sizePx: number): number {
  return sizePx < 28 ? 2 : 2.4;
}

/* ------------------------------------------------------------------ */
/* Art                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Path geometry, measured from the reference animation rather than redrawn.
 *
 * The heart is deliberately open on both sides at mid-height: that gap is what
 * the rhythm line passes through, and closing it would turn a clinical mark
 * into a valentine.
 *
 * Shared with @oxygenui-design/loaders so the React component and the custom
 * element cannot drift. `test/loader-parity.test.ts` asserts they match.
 */
export const LOADER_ART = {
  /** Upper lobes of the heart, open at both sides. */
  heartTop:
    "M135.6 58.3 C137 55.3 138.2 52.3 139 49.3 C140.1 45.6 140.7 42 140.8 38.5 C140.8 38.2 140.8 37.9 140.8 37.6 C140.8 20.4 129.2 6.4 109.5 6.4 C89.9 6.4 78.3 30 78.3 30 C78.3 30 66.7 6.4 47 6.4 C27.3 6.4 15.8 20.4 15.8 37.6 C15.8 37.9 15.8 38.2 15.8 38.5 C15.9 43.2 16.9 48 18.7 52.8",
  /** Lower V of the heart. */
  heartBottom: "M128.5 71 C110.3 98.1 78.4 121.6 78.4 121.6 C78.4 121.6 46.3 97.9 28.1 70.5",
  /** The rhythm line that crosses the heart through the gap. */
  heartLine:
    "M5 63.6 L29.4 63.6 C32.7 63.6 35.6 61.5 36.6 58.3 L43 39.3 C43.7 37.2 46.7 37.6 46.9 39.7 L49.5 63.6 L58.8 63.6 C60.6 63.6 62.2 64.8 62.8 66.5 L69.1 87.7 C70.1 91.1 74.9 91.3 76.1 88 L84.2 66.6 C84.9 64.8 86.6 63.6 88.6 63.6 L101.3 63.6 L108.5 40.9 C109.3 38.5 112.8 38.7 113.3 41.1 L117.3 59.6 C117.8 61.9 119.9 63.6 122.3 63.6 L154.9 63.6",
  /** A standalone rhythm strip: one PQRST complex on a baseline. */
  strip:
    "M0 36 L40 36 C44 36 46 30 50 30 C54 30 56 36 60 36 L72 36 L76 40 L82 10 L88 48 L92 36 L110 36 C114 36 116 26 122 26 C128 26 130 36 134 36 L200 36",
} as const;

export const LOADER_VIEWBOX = {
  pulse: "-4 -4 168 136",
  rhythm: "-4 -2 208 68",
  breath: "0 0 120 120",
  helix: "0 0 160 60",
  infusion: "0 0 160 48",
} as const;

/* ------------------------------------------------------------------ */
/* Frame                                                               */
/* ------------------------------------------------------------------ */

/** Static lookup — Tailwind and CSS both need to see the whole set as text. */
const MODE_CLASS: Record<LoaderMode, string> = {
  inline: "ox-loader--inline",
  overlay: "ox-loader--overlay",
  page: "ox-loader--page",
};

/**
 * `size` and `speed` are deliberately absent.
 *
 * Each loader resolves them into the CSS custom properties it passes as
 * `vars`, because the art is the only thing that knows what a size means for
 * its own shape. The frame never needs either value, and accepting them would
 * mean silently forwarding a `size` attribute onto a `div`.
 */
export interface LoaderFrameProps extends Omit<LoaderCommonProps, "size" | "speed"> {
  /** The SVG. Decorative — the frame owns everything a reader hears. */
  art: React.ReactNode;
  /** CSS custom properties the art reads, merged into the root's style. */
  vars?: LoaderVars;
  /** Identifies the loader in the DOM for tests and styling hooks. */
  variant: string;
  /** Optional brand mark, centred over the art and decorative like it. */
  mark?: React.ReactNode;
}

/**
 * The shell every Oxygen loader renders inside.
 *
 * The accessibility contract in one place:
 *
 *   - Indeterminate is `role="status"`, whose *contents* are announced. The
 *     label is therefore always in the DOM — visually hidden when
 *     `showLabel` is false — because an empty live region announces nothing.
 *   - Determinate is `role="progressbar"`, whose contents are not announced;
 *     it takes its name from the same label element and reports its value
 *     through `aria-valuetext`.
 *   - The art is `aria-hidden`. A decorative SVG that announces itself is a
 *     second, meaningless label on every wait in the product.
 */
export function LoaderFrame({
  art,
  vars,
  variant,
  mark,
  mode = "inline",
  label = "Loading",
  showLabel,
  hint,
  delay = 0,
  minDuration = 400,
  slowAfter = 8000,
  slowHint = DEFAULT_SLOW_HINT,
  open = true,
  motion = "auto",
  scrim = true,
  announce = "polite",
  progress,
  onSlow,
  actions,
  className,
  style,
  ...rest
}: LoaderFrameProps) {
  const { visible, slow } = useLoadingGate({ open, delay, minDuration, slowAfter, onSlow });
  const labelId = React.useId();

  const determinate = typeof progress === "number";
  const value = determinate ? clamp(progress, 0, 100) : undefined;
  const withLabel = showLabel ?? mode !== "inline";
  const message = slow ? slowHint : hint;

  if (!visible) return null;

  return (
    <div
      {...rest}
      className={cn("ox-loader", MODE_CLASS[mode], className)}
      data-ox-loader={variant}
      data-ox-motion={motion}
      data-ox-determinate={String(determinate)}
      data-ox-scrim={mode === "inline" ? undefined : String(scrim)}
      style={{ ...vars, ...style }}
      role={determinate ? "progressbar" : "status"}
      aria-live={determinate || announce === "off" ? undefined : announce}
      aria-labelledby={determinate ? labelId : undefined}
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={determinate ? Math.round(value ?? 0) : undefined}
      aria-valuetext={determinate ? `${Math.round(value ?? 0)} percent` : undefined}
    >
      <div className="ox-loader__art" aria-hidden="true">
        {art}
        {mark ? <span className="ox-loader__mark">{mark}</span> : null}
      </div>

      <span id={labelId} className={withLabel ? "ox-loader__label" : "ox-loader__sr"}>
        {label}
      </span>

      {determinate && withLabel ? (
        <span className="ox-loader__value">{Math.round(value ?? 0)}%</span>
      ) : null}

      {message && withLabel ? <span className="ox-loader__hint">{message}</span> : null}
      {actions ? <div className="ox-loader__actions">{actions}</div> : null}
    </div>
  );
}
