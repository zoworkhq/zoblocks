/**
 * recorder-core's React binding: the loop, the frame, and the shared chrome.
 *
 * Everything with an opinion about audio lives in
 * `@oxygenui-design/recorder-core`, which has no React and no DOM and can be
 * asserted numerically in Node. This file supplies the two things that
 * genuinely need a browser — a requestAnimationFrame delta and an
 * `AnalyserNode` — and then gets out of the way.
 *
 * The division matters more than it looks. `useRecorderSignal` owns no state
 * about the audio: it hands `step()` a delta and writes the result to custom
 * properties. There is no `setInterval`, no phase counter and no fallback
 * animation, so when frames stop arriving the art stops with them. That is the
 * whole claim of §01 of the brief, and it is a structural property here rather
 * than a discipline anyone has to remember.
 */

"use client";

import * as React from "react";
import {
  createSignal,
  detectFaults,
  primaryFault,
  visualGain,
  type FaultObservation,
  type RecorderFault,
  type Signal,
  type SignalFrame,
  type TimeDomainSource,
} from "@oxygenui-design/recorder-core";

import { cn } from "@/lib/utils";

export type RecorderArt = "pulse" | "bars" | "strip" | "duet" | "stream";
export type RecorderMotion = "auto" | "reduced" | "full";

/**
 * Art → class, written out.
 *
 * A template literal would be shorter and would produce no CSS: Tailwind
 * resolves classes by scanning source text, so an interpolated name is invisible
 * to it and the element renders unstyled. `@oxygenui/no-dynamic-class-name`
 * fails the build on it, which is how this stayed a five-line map.
 */
const ART_CLASS: Readonly<Record<RecorderArt, string>> = {
  pulse: "ox-rec-pulse",
  bars: "ox-rec-bars",
  strip: "ox-rec-strip",
  duet: "ox-rec-duet",
  stream: "ox-rec-stream",
};

/** Below this the `bars` art reports itself as `strip`. §14 of the brief. */
export const BARS_MIN_WIDTH_PX = 280;

/* ------------------------------------------------------------------ the loop */

export interface UseRecorderSignalOptions {
  readonly source?: TimeDomainSource | null;
  readonly running?: boolean;
  readonly release?: number;
  readonly floor?: number;
  /** Called on every frame. Keep it cheap: this is the render path. */
  readonly onFrame?: (frame: SignalFrame, signal: Signal) => void;
}

/**
 * One requestAnimationFrame loop, one signal, and no clock of its own.
 *
 * Returns a ref to attach to the element the custom properties are written to.
 * Level is written as a CSS variable rather than as React state on purpose: a
 * setState at 60 Hz re-renders the whole subtree sixty times a second to move
 * some bars, and the bars are the one thing that does not need reconciling.
 */
export function useRecorderSignal(options: UseRecorderSignalOptions = {}): {
  readonly ref: React.RefObject<HTMLDivElement | null>;
  readonly signal: Signal;
} {
  const { source = null, running = true, release, floor, onFrame } = options;

  const ref = React.useRef<HTMLDivElement | null>(null);
  const onFrameRef = React.useRef(onFrame);
  onFrameRef.current = onFrame;

  const signal = React.useMemo(() => createSignal({ release, floor }), [release, floor]);

  React.useEffect(() => {
    signal.setSource(source);
  }, [signal, source]);

  React.useEffect(() => {
    if (!running) return;
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      return;
    }

    let raf = 0;
    let last = 0;

    const tick = (now: number): void => {
      const dt = last === 0 ? 16 : now - last;
      last = now;
      const frame = signal.step(dt);

      const node = ref.current;
      if (node !== null) {
        node.style.setProperty("--_lv", visualGain(frame.level).toFixed(3));
        node.style.setProperty("--_pk", visualGain(frame.hold).toFixed(3));
      }

      onFrameRef.current?.(frame, signal);
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [signal, running]);

  return { ref, signal };
}

/**
 * Writes bucket heights onto a lane of bars.
 *
 * Direct style writes rather than React children: 72 bars reconciled at 60 Hz
 * is 4,300 element diffs a second to change a number that no other part of the
 * tree reads.
 */
export function paintLane(lane: HTMLElement | null, read: (index: number) => number): void {
  if (lane === null) return;
  const bars = lane.children;
  const count = bars.length;
  for (let i = 0; i < count; i += 1) {
    // i = 0 is the right edge = newest. The lane appears to scroll because the
    // data moves, not because a transform is animating.
    const value = visualGain(read(i));
    const bar = bars[count - 1 - i] as HTMLElement | undefined;
    if (bar === undefined) continue;
    bar.style.setProperty("--_h", Math.max(0.02, value).toFixed(3));
    bar.style.setProperty("--_now", i < 4 ? (1 - i / 4).toFixed(2) : "0");
  }
}

/**
 * How many bars fit, measured rather than assumed.
 *
 * A fixed count is wrong at every width but one. The lane is `flex-end`, and a
 * bar is capped at `--ox-recorder-bar-w` so it stays a bar rather than becoming
 * a block — so 72 bars span about 360px however wide the pane is, and on a
 * 550px pane that leaves 190px of empty lane on the left. It does not read as
 * "no data yet". It reads as broken.
 *
 * Deriving the count from the measured width fixes it at every width, and it
 * also fixes the thing behind it: the lane is a WINDOW ONTO TIME, so a wider
 * pane should show more seconds, not the same seconds further apart.
 */
export function useLaneBars(ref: React.RefObject<HTMLElement | null>, fallback = 72): number {
  const [count, setCount] = React.useState(fallback);

  React.useEffect(() => {
    const node = ref.current;
    if (node === null || typeof ResizeObserver === "undefined") return;

    const measure = (): void => {
      const style = getComputedStyle(node);
      const barW = Number.parseFloat(style.getPropertyValue("--_bar-w")) || 3;
      const gap = Number.parseFloat(style.columnGap) || 2;
      const width = node.clientWidth;
      if (width <= 0) return;
      const next = Math.max(8, Math.min(512, Math.floor((width + gap) / (barW + gap))));
      setCount((current) => (current === next ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return count;
}

/* -------------------------------------------------------------- the chrome */

export interface RecorderFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly art: RecorderArt;
  readonly motion?: RecorderMotion;
  /** Whether the analyser is delivering anything at all. Drives the grey-out. */
  readonly hasSignal?: boolean;
  readonly fault?: RecorderFault | null;
  readonly innerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * The shared shell every art renders inside.
 *
 * `data-fault` and `data-signal` are on the host rather than buried inside,
 * so an application's own queries and tests can see them and a host stylesheet
 * can react to them without knowing our internals.
 */
export const RecorderFrame = React.forwardRef<HTMLDivElement, RecorderFrameProps>(
  function RecorderFrame(
    {
      art,
      motion = "auto",
      hasSignal = true,
      fault = null,
      innerRef,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        ref={mergeRefs(ref, innerRef)}
        className={cn("ox-rec", ART_CLASS[art], className)}
        data-ox-recorder={art}
        data-motion={motion}
        data-signal={hasSignal ? "live" : "none"}
        data-fault={fault?.severity ?? "none"}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

/** The record tell. Present whenever capture is running — see recorder.css. */
export function RecorderTell({
  label = "Recording",
}: {
  readonly label?: string;
}): React.JSX.Element {
  return <span className="ox-rec-tell">{label}</span>;
}

/**
 * The fault banner.
 *
 * One fault at a time, worst first. Rendering thirteen simultaneous banners is
 * its own failure mode.
 */
export function RecorderFaultBanner({
  fault,
}: {
  readonly fault: RecorderFault | null;
}): React.JSX.Element | null {
  if (fault === null) return null;
  return (
    <div className="ox-rec-fault" data-severity={fault.severity} role="alert">
      <span>
        <b>{fault.message}</b>
        {fault.fix !== undefined ? ` ${fault.fix}` : null}
      </span>
    </div>
  );
}

/** Fixed-width bars for a lane. Count is stable, so React never reconciles them. */
export function RecorderBars({ count }: { readonly count: number }): React.JSX.Element {
  const bars = React.useMemo(() => Array.from({ length: count }, (_, index) => index), [count]);
  return (
    <>
      {bars.map((index) => (
        <i key={index} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------- icons */

/**
 * Lucide geometry: a 24px grid, 2px stroke, round caps and joins.
 *
 * Inlined rather than imported so the registry copy has no icon dependency —
 * a customer installing `recorder` should not also be installing an icon
 * library to see a microphone.
 */
export type RecorderIconName = "mic" | "mic-off" | "pause" | "square" | "send" | "alert" | "flag";

const ICON_PATHS: Readonly<Record<RecorderIconName, string>> = {
  mic: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2M12 19v3",
  "mic-off":
    "m2 2 20 20M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V5a3 3 0 0 0-5.7-1.3M19 10v2a7 7 0 0 1-.6 2.8M5 10v2a7 7 0 0 0 12 5M12 19v3",
  pause: "M7 4v16M17 4v16",
  square: "M7 7h10v10H7z",
  send: "m22 2-7 20-4-9-9-4ZM22 2 11 13",
  alert:
    "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1ZM4 22v-7",
};

export function RecorderIcon({
  name,
  size = 14,
}: {
  readonly name: RecorderIconName;
  readonly size?: number;
}): React.JSX.Element {
  return (
    <svg
      className="ox-rec-icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

/**
 * A transport control.
 *
 * `data-primary` rather than a colour prop: the stylesheet decides what the
 * primary action looks like, so a host retheming the recorder does not have to
 * find every button that hard-coded an accent.
 */
export function RecorderButton({
  icon,
  children,
  primary = false,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly icon?: RecorderIconName;
  readonly primary?: boolean;
}): React.JSX.Element {
  return (
    <button type="button" className="ox-rec-btn-sm" data-primary={primary} {...rest}>
      {icon !== undefined ? <RecorderIcon name={icon} /> : null}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ helpers */

export function useFaults(observation: FaultObservation): {
  readonly faults: readonly RecorderFault[];
  readonly primary: RecorderFault | null;
} {
  const faults = detectFaults(observation);
  return { faults, primary: primaryFault(faults) };
}

function mergeRefs<T>(
  ...refs: ReadonlyArray<React.Ref<T> | React.RefObject<T | null> | undefined>
): React.RefCallback<T> {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(value);
      else if (ref != null && typeof ref === "object") {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}
