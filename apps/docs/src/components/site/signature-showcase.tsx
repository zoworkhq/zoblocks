"use client";

/**
 * The two pieces of the Signature page that move.
 *
 * Both are driven by `SIGNATURE_STROKES` — the same recorded stroke model the
 * catalog mark is rendered from, and the same one `signature-core` produced
 * when someone actually signed. That is what makes them worth showing rather
 * than decorating with.
 *
 * `SignatureDrawing` replays it at the speed it was written. The delays are
 * not a tween anyone chose: each segment appears at the millisecond its end
 * point was sampled at, so the hesitation before the second stroke is a real
 * hesitation and the 100ms pen-lift between them is the real gap. An eased
 * two-second sweep would look smoother and would be a lie about the data.
 *
 * `StrokeAnatomy` is the brief's central claim laid out in three panels —
 * store strokes, render pixels. It matters because it is the decision every
 * other signature component gets wrong: hand back a PNG, and the width curve,
 * the smoothing and the export resolution are all frozen at capture time,
 * against whatever screen happened to be in front of the patient.
 */

import * as React from "react";
import {
  SIGNATURE_PATHS,
  SIGNATURE_STROKES,
  SIGNATURE_VIEW_BOX,
} from "@/components/site/signature-mark";
import { cn } from "@/lib/utils";

/** The mark's own box, so every panel here lines up with the catalog card. */
const VIEW_BOX = SIGNATURE_VIEW_BOX;

type Point = { x: number; y: number; t: number };

/** The recorded model, flattened per stroke and typed. */
const STROKES: Point[][] = SIGNATURE_STROKES.map((stroke) =>
  stroke.map(([x, y, t]) => ({ x: x ?? 0, y: y ?? 0, t: t ?? 0 })),
);

/**
 * When each drawn segment finishes, in recorded milliseconds.
 *
 * One entry per emitted segment, in the order `toInkPaths` emits them: a
 * lead-in from the landing point to the first midpoint, a quadratic through
 * each interior sample, and a lift out to the last — so a stroke of n samples
 * becomes n segments, and the kth of them is drawn as the pen passes the kth
 * sample.
 *
 * Derived rather than written down, because the engine decides how many
 * segments a stroke becomes. It used to assume n−1, which was right while the
 * renderer emitted a line between each pair of samples and quietly wrong the
 * moment it started emitting curves — the animation then stopped three
 * segments short of the finished name, on every loop, forever.
 */
const SEGMENT_TIMES: number[] = STROKES.flatMap((stroke) => stroke.map((p) => p.t));

const DURATION = SEGMENT_TIMES[SEGMENT_TIMES.length - 1] ?? 1200;
/** How long the finished signature rests before the loop starts over. */
const HOLD = 1600;

/** Where the nib is at `elapsed`, or null once the pen has left the paper. */
function nibAt(elapsed: number): { x: number; y: number; lifted: boolean } | null {
  for (let s = 0; s < STROKES.length; s++) {
    const stroke = STROKES[s];
    if (!stroke || stroke.length === 0) continue;
    const first = stroke[0]!;
    const last = stroke[stroke.length - 1]!;

    // Between two strokes the pen is off the paper. Showing the nib parked on
    // the last point would read as a pause in the writing rather than a lift.
    if (elapsed < first.t) return { x: first.x, y: first.y, lifted: true };
    if (elapsed > last.t) continue;

    for (let i = 1; i < stroke.length; i++) {
      const a = stroke[i - 1]!;
      const b = stroke[i]!;
      if (elapsed > b.t) continue;
      const span = b.t - a.t;
      const k = span > 0 ? (elapsed - a.t) / span : 1;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, lifted: false };
    }
    return { x: last.x, y: last.y, lifted: false };
  }
  return null;
}

/** Honours the OS setting, and re-reads it if it changes mid-session. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);
  return reduced;
}

export interface SignatureDrawingProps {
  /** 1 is the speed it was written at. Lower is slower. */
  speed?: number;
  loop?: boolean;
  className?: string;
}

export function SignatureDrawing({ speed = 1, loop = true, className }: SignatureDrawingProps) {
  const reduced = usePrefersReducedMotion();
  const [elapsed, setElapsed] = React.useState(0);
  const [runId, setRunId] = React.useState(0);

  React.useEffect(() => {
    /*
     * Reduced motion gets the finished signature, not a faster one.
     *
     * SC 2.3.3 is about motion that conveys nothing the still state cannot.
     * Here the still state is the whole point — a signature — so the honest
     * accommodation is to skip straight to it rather than to shorten the
     * animation, which would keep the movement and lose only the legibility.
     */
    if (reduced) {
      setElapsed(DURATION);
      return;
    }

    let frame = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const next = (now - start) * speed;

      if (next > DURATION + HOLD) {
        if (!loop) {
          setElapsed(DURATION);
          return;
        }
        start = now;
        setElapsed(0);
      } else {
        setElapsed(next);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, speed, loop, runId]);

  const drawn = SEGMENT_TIMES.filter((t) => t <= elapsed).length;
  const complete = drawn >= SEGMENT_TIMES.length;

  // Gone once the name is finished, because the pen has been put down. A dot
  // resting on the last letter through the whole hold reads as a cursor.
  const nib = reduced || complete ? null : nibAt(elapsed);

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={VIEW_BOX}
        className="w-full overflow-visible"
        // Decorative twice over: the heading beside it names what it is, and
        // the paragraph says what it proves. A description of the strokes is
        // never the equivalent purpose of a signature under SC 1.1.1.
        aria-hidden="true"
        // The signal the visual-regression and e2e suites wait on, so a
        // screenshot is never taken of a half-written name.
        data-drawing-complete={complete || undefined}
      >
        {/*
          The finished shape, very faint, underneath. Without it the signature
          appears to grow out of nothing and the eye has nowhere to anticipate
          — with it, the animation reads as ink filling a path.
        */}
        <g opacity={0.08}>
          {SIGNATURE_PATHS.map((segment, i) => (
            <path
              key={`ghost-${i}`}
              d={segment.d}
              stroke="currentColor"
              strokeWidth={segment.width}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </g>

        <g>
          {SIGNATURE_PATHS.slice(0, drawn).map((segment, i) => (
            <path
              key={i}
              d={segment.d}
              stroke="currentColor"
              strokeWidth={segment.width}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </g>

        {nib && !nib.lifted ? (
          <circle cx={nib.x} cy={nib.y} r={1.6} className="fill-trace" opacity={0.9} />
        ) : null}
      </svg>

      {loop && !reduced ? null : (
        <button
          type="button"
          onClick={() => setRunId((n) => n + 1)}
          className="mt-2 rounded-md px-2 py-1 font-mono text-[0.625rem] uppercase tracking-wider text-panel-muted transition-colors hover:text-panel-fg"
        >
          Replay
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const ALL_POINTS = STROKES.flat();

/**
 * The three stages, side by side.
 *
 * Panel one is what the device handed over — nothing but samples. Panel two is
 * those samples joined, which is what a component that stored a path would
 * keep. Panel three is what the engine renders from the same data, where the
 * width at each point is a function of how fast the pen was moving there.
 */
const STAGES = [
  {
    id: "samples",
    label: "Sampled",
    caption: `${ALL_POINTS.length} points, each with position, time and pressure. This is what the record stores.`,
  },
  {
    id: "joined",
    label: "Joined",
    caption: "The same points as one path. Legible, but every stroke is the same weight.",
  },
  {
    id: "rendered",
    label: "Rendered",
    caption:
      "Width as a function of pen speed, smoothed. Recomputed from the samples at any size, on any screen.",
  },
] as const;

export function StrokeAnatomy({ className }: { className?: string }) {
  const [active, setActive] = React.useState<(typeof STAGES)[number]["id"]>("rendered");
  const current = STAGES.find((s) => s.id === active) ?? STAGES[2];

  return (
    <div className={cn("relative", className)}>
      <div className="grid gap-3 sm:grid-cols-3">
        {STAGES.map((stage) => (
          <button
            key={stage.id}
            type="button"
            onClick={() => setActive(stage.id)}
            aria-pressed={stage.id === active}
            className={cn(
              "group rounded-xl border p-3 text-left transition-all duration-300 ease-[var(--ease-out-expo)]",
              stage.id === active
                ? "border-trace/35 bg-trace/8"
                : "border-panel-rule bg-panel/40 hover:border-panel-fg/20",
            )}
          >
            <span className="eyebrow text-panel-muted">{stage.label}</span>
            <svg viewBox={VIEW_BOX} className="mt-2 w-full" aria-hidden="true">
              {stage.id === "samples" ? (
                ALL_POINTS.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={1.1} fill="currentColor" opacity={0.7} />
                ))
              ) : stage.id === "joined" ? (
                STROKES.map((stroke, i) => (
                  <polyline
                    key={i}
                    points={stroke.map((p) => `${p.x},${p.y}`).join(" ")}
                    stroke="currentColor"
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))
              ) : (
                <g>
                  {SIGNATURE_PATHS.map((segment, i) => (
                    <path
                      key={i}
                      d={segment.d}
                      stroke="currentColor"
                      strokeWidth={segment.width}
                      strokeLinecap="round"
                      fill="none"
                    />
                  ))}
                </g>
              )}
            </svg>
          </button>
        ))}
      </div>

      <p className="animate-rail-settle mt-3 max-w-2xl text-[0.8125rem] leading-relaxed text-panel-muted">
        {current?.caption}
      </p>
    </div>
  );
}
