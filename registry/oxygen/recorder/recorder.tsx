/**
 * Recorder — one control, five arts, one engine.
 *
 * Record, listen, transcribe and send look like four components. They are four
 * readings of the same `Float32Array`: a recorder appends to it and a player
 * indexes into it, a transcript is a second track on the same clock, and "send"
 * is not a view at all but a disposition. Treating them as one is what makes
 * five arts cost about what two would have.
 *
 * The claim the whole thing rests on, from §01 of the brief: **the art is a
 * pure function of the signal.** Nothing here owns a timer. If the analyser
 * reports nothing, nothing moves — and then the surface says so, because a flat
 * waveform and a quiet room look identical and only one of them is a fault.
 */

"use client";

import * as React from "react";
import {
  RECORDER_PHASES,
  PeakBuffer,
  detectFaults,
  isConsentResolved,
  resolveConsent,
  primaryFault,
  recorderClock,
  recorderClockShort,
  toDbfs,
  visualGain,
  type RecorderConsent,
  type RecorderDevice,
  type RecorderDisposition,
  type RecorderFault,
  type RecorderPhase,
  type RecorderSensitivity,
  type SignalFrame,
  type TimeDomainSource,
} from "@oxygenui-design/recorder-core";

import {
  RecorderBars,
  RecorderFaultBanner,
  RecorderFrame,
  RecorderTell,
  paintLane,
  useRecorderSignal,
  type RecorderArt,
  type RecorderMotion,
} from "@/lib/oxygen-recorder";

export type { RecorderArt, RecorderMotion };

/** Bars in each capture lane. Stable, so React never reconciles them. */
const LANE_BARS: Readonly<Record<RecorderArt, number>> = {
  pulse: 0,
  bars: 72,
  strip: 22,
  duet: 0,
  stream: 0,
};

export interface RecorderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** The art. Below 280px `bars` reports itself as `strip`. */
  readonly variant?: RecorderArt;
  /** Controlled phase. The engine validates every transition. */
  readonly phase?: RecorderPhase;
  /** The analyser, for the capture arts. The host owns `getUserMedia`. */
  readonly source?: TimeDomainSource | null;
  /** A rendered take, for the playback arts. Peaks come from the ingest sidecar. */
  readonly peaks?: Float32Array | null;
  /** One byte of speaker per bucket. Without it Duet renders a single rail. */
  readonly speakers?: Uint8Array | null;
  /** Playhead, 0–1, for the playback arts. */
  readonly position?: number;
  /** Length of the take in ms, for the playback readout. */
  readonly durationMs?: number;
  /** Turns for the transcript art. `interim` is drawn as a guess. */
  readonly turns?: readonly RecorderTurn[];
  /**
   * The device actually delivering audio. Rendered permanently in the capture
   * arts, never filed behind a hover or a settings panel: recording the wrong
   * microphone produces plausible room tone and is the one fault with no
   * signal-level defence, so the name on screen is the only defence there is.
   */
  readonly device?: RecorderDevice | null;
  /**
   * The device the user chose. When it differs from `device`, the component
   * raises the fault rather than trusting the waveform to betray it.
   */
  readonly expectedDevice?: RecorderDevice | null;
  /**
   * The basis the host asserts for recording. Absent or incomplete blocks the
   * `armed → recording` edge. The component renders it and never authors it:
   * it does not obtain consent and does not know what a lawful basis is where
   * you are.
   */
  readonly consent?: RecorderConsent | null;
  /**
   * How much the recording discloses. Changes behaviour rather than only a
   * badge — `restricted` is not a surface a quiet inline control should start.
   */
  readonly sensitivity?: RecorderSensitivity;
  /**
   * Where the bytes are: held, uploading, queued, transcribing, ready, failed.
   * The component renders this; the host moves the bytes. `held` is the state
   * every thin MediaRecorder wrapper skips, and it is the one that keeps a tick
   * from being a falsehood about a legal record.
   */
  readonly disposition?: RecorderDisposition | null;
  /** Names for the two Duet rails, above the axis and below it. */
  readonly speakerLabels?: readonly [string, string];
  /** Milliseconds below the voice floor before the component escalates. */
  readonly silenceBudgetMs?: number;
  /**
   * Motion preference. An explicit mechanism rather than only the media query,
   * because WCAG 2.2.2's "essential" exception does not apply once a conforming
   * alternative exists — and the still state is that alternative.
   */
  readonly motion?: RecorderMotion;
  /** Accessible name for the recorder, and the stem of the timer's own label. */
  readonly label?: string;
  /** Fires at most 10 times a second, not once a frame. */
  readonly onLevel?: (frame: SignalFrame) => void;
  /**
   * Fires when the worst active fault changes, including back to null. Deduped
   * by code, so a fault that persists across frames reports once.
   */
  readonly onFault?: (fault: RecorderFault | null) => void;
}

export interface RecorderTurn {
  readonly id: string;
  readonly speaker: string;
  readonly words: string;
  /** A token the recogniser may still take back. Drawn as a guess. */
  readonly interim?: string;
}

/**
 * `armed` is not `idle`.
 *
 * Permission is granted and the device chosen, but nothing is captured and no
 * basis is recorded. Most implementations collapse the two and then have
 * nowhere to put consent — this is the edge rule two lives on, and the engine
 * refuses the transition rather than trusting a button handler.
 */
function blockedByConsent(
  phase: RecorderPhase,
  consent: RecorderConsent | null | undefined,
): boolean {
  // Two calls, not one. `resolveConsent` produces a VERDICT — absent,
  // incomplete, not-all-parties, resolved, not-required — and only then does
  // `isConsentResolved` say whether that verdict clears the edge. Collapsing
  // them would lose the distinction between "no basis was needed" and "a basis
  // cleared it", which are different facts on a provenance line.
  return phase === "armed" && !isConsentResolved(resolveConsent(consent));
}

export function Recorder({
  variant = "bars",
  phase = "recording",
  source = null,
  peaks = null,
  speakers = null,
  position = 0,
  durationMs = 0,
  turns = [],
  device = null,
  expectedDevice = null,
  consent = null,
  sensitivity = "routine",
  disposition = null,
  speakerLabels = ["Clinician", "Patient"],
  silenceBudgetMs,
  motion = "auto",
  label = "Recorder",
  onLevel,
  onFault,
  className,
  ...rest
}: RecorderProps): React.JSX.Element {
  const capturing = phase === "recording";
  const laneRef = React.useRef<HTMLDivElement | null>(null);
  const [frame, setFrame] = React.useState<SignalFrame | null>(null);

  /*
   * The lane is a rolling window over the buckets, not a picture of the
   * current frame. `frame.closed` holds only the buckets that closed on this
   * pass — usually none, sometimes one — so reading the lane from it fills the
   * newest few bars and leaves the rest at the current level, which looks like
   * a meter smeared sideways rather than like a history.
   */
  const history = React.useMemo(() => new PeakBuffer(), []);

  // A gate rather than a timer: it is fed the same deltas as the loop, so a
  // paused loop emits nothing instead of continuing to fire.
  const sinceEmit = React.useRef(0);

  const { ref } = useRecorderSignal({
    source,
    running: capturing,
    onFrame: React.useCallback(
      (next: SignalFrame) => {
        for (const bucket of next.closed) history.push(bucket);

        const lane = laneRef.current;
        if (lane !== null) {
          // index 0 is the newest bucket; the buffer indexes oldest-first.
          const end = history.length - 1;
          paintLane(lane, (index: number) => (index <= end ? history.at(end - index) : 0));
        }

        sinceEmit.current += 1;
        if (sinceEmit.current >= 6) {
          sinceEmit.current = 0;
          setFrame(next);
          onLevel?.(next);
        }
      },
      [onLevel, history],
    ),
  });

  const faults = detectFaults({
    phase,
    frame: frame ?? REST_FRAME,
    device,
    expectedDevice,
    disposition,
    silenceBudgetMs,
  });
  const fault = primaryFault(faults);

  const lastFault = React.useRef<RecorderFault | null>(null);
  React.useEffect(() => {
    if (lastFault.current?.code !== fault?.code) {
      lastFault.current = fault;
      onFault?.(fault);
    }
  }, [fault, onFault]);

  const hasSignal = fault === null || fault.capturing === false ? true : false;
  const elapsed = frame?.elapsedMs ?? 0;

  return (
    <RecorderFrame
      art={variant}
      motion={motion}
      hasSignal={hasSignal}
      fault={fault}
      innerRef={ref}
      className={className}
      data-phase={phase}
      data-sensitivity={sensitivity}
      aria-label={label}
      {...rest}
    >
      {/* role="timer" is an aria-live="off" region by default. Making it polite
          is the commonest audio-UI accessibility defect: it announces a number
          every second for twenty minutes. */}
      <span className="ox-rec-sr" role="timer" aria-label={`${label} elapsed`}>
        {recorderClock(elapsed)}
      </span>

      {blockedByConsent(phase, consent) ? (
        <div className="ox-rec-fault" data-severity="critical" role="alert">
          <span>
            <b>Consent not recorded.</b> Recording cannot start. Capture the basis, or start an
            unrecorded encounter.
          </span>
        </div>
      ) : (
        <RecorderFaultBanner fault={fault} />
      )}

      {variant === "pulse" ? <PulseArt phase={phase} elapsed={elapsed} frame={frame} /> : null}

      {variant === "bars" ? (
        <BarsArt laneRef={laneRef} phase={phase} elapsed={elapsed} frame={frame} device={device} />
      ) : null}

      {variant === "strip" ? <StripArt laneRef={laneRef} elapsed={elapsed} /> : null}

      {variant === "duet" ? (
        <DuetArt
          peaks={peaks}
          speakers={speakers}
          position={position}
          durationMs={durationMs}
          labels={speakerLabels}
        />
      ) : null}

      {variant === "stream" ? <StreamArt turns={turns} fault={fault} /> : null}
    </RecorderFrame>
  );
}

/* ------------------------------------------------------------------- arts */

function PulseArt({
  phase,
  elapsed,
  frame,
}: {
  readonly phase: RecorderPhase;
  readonly elapsed: number;
  readonly frame: SignalFrame | null;
}): React.JSX.Element {
  const capturing = phase === "recording";
  return (
    <>
      <div className="ox-rec-stage">
        <div className="ox-rec-sonar" />
        <div className="ox-rec-ring" data-ring="glow" />
        <div className="ox-rec-ring" data-ring="hold" />
        <div className="ox-rec-ring" data-ring="level" />
        <button
          type="button"
          className="ox-rec-btn"
          data-mode={capturing ? "stop" : "record"}
          aria-label={capturing ? "Stop recording" : "Start recording"}
        >
          <span />
        </button>
      </div>
      <div className="ox-rec-row" style={{ justifyContent: "center" }}>
        {capturing ? <RecorderTell label="Rec" /> : null}
        <span className="ox-rec-clock" data-size="lg">
          {recorderClock(elapsed)}
        </span>
        <span className="ox-rec-meta">{describeLevel(frame)}</span>
      </div>
    </>
  );
}

function BarsArt({
  laneRef,
  phase,
  elapsed,
  frame,
  device,
}: {
  readonly laneRef: React.RefObject<HTMLDivElement | null>;
  readonly phase: RecorderPhase;
  readonly elapsed: number;
  readonly frame: SignalFrame | null;
  readonly device: RecorderDevice | null;
}): React.JSX.Element {
  return (
    <>
      <div className="ox-rec-row">
        {phase === "recording" ? <RecorderTell /> : null}
        <span className="ox-rec-clock" data-size="lg">
          {recorderClock(elapsed)}
        </span>
      </div>
      <div className="ox-rec-pane">
        <div className="ox-rec-lane" ref={laneRef}>
          <RecorderBars count={LANE_BARS.bars} />
        </div>
      </div>
      <div className="ox-rec-row">
        {/* Permanently rendered, never behind a hover or a settings panel:
            §11 row 7 has no signal-level defence and this is the only one. */}
        <span className="ox-rec-meta">{device?.label ?? "No input device"}</span>
        <span className="ox-rec-meta">{describeLevel(frame)}</span>
      </div>
    </>
  );
}

function StripArt({
  laneRef,
  elapsed,
}: {
  readonly laneRef: React.RefObject<HTMLDivElement | null>;
  readonly elapsed: number;
}): React.JSX.Element {
  return (
    <div className="ox-rec-bar">
      <div className="ox-rec-lane" ref={laneRef}>
        <RecorderBars count={LANE_BARS.strip} />
      </div>
      <span className="ox-rec-clock">{recorderClockShort(elapsed)}</span>
    </div>
  );
}

/**
 * Duet — the axis carries the speaker.
 *
 * Clinician above the line, patient below. Speaker lanes under a waveform put
 * the same information one glance away; folding it onto the axis makes
 * talk-time balance readable without reading anything, and it is free because
 * the diarisation is already in the take.
 *
 * Position is the channel, not colour: accent and info sit within about 2:1 of
 * each other in luminance, and a hue-only distinction is what DESIGN.md
 * forbids. Where diarisation is absent this renders a single rail rather than
 * guessing — a wrongly attributed rail is worse than no attribution.
 */
function DuetArt({
  peaks,
  speakers,
  position,
  durationMs,
  labels,
}: {
  readonly peaks: Float32Array | null;
  readonly speakers: Uint8Array | null;
  readonly position: number;
  readonly durationMs: number;
  readonly labels: readonly [string, string];
}): React.JSX.Element {
  const values = peaks ?? EMPTY_PEAKS;
  const played = Math.max(0, Math.min(1, position));
  const cut = Math.floor(played * values.length);
  const split = speakers !== null;

  const balance = React.useMemo(() => {
    if (speakers === null) return null;
    let a = 0;
    let voiced = 0;
    for (let i = 0; i < values.length; i += 1) {
      if ((values[i] as number) <= 0.12) continue;
      voiced += 1;
      if (speakers[i] === 0) a += 1;
    }
    return voiced === 0 ? null : Math.round((a / voiced) * 100);
  }, [values, speakers]);

  const rail = (which: 0 | 1): React.JSX.Element[] =>
    Array.from({ length: values.length }, (_, i) => {
      const mine = !split || speakers?.[i] === which;
      return (
        <i
          key={i}
          data-played={i <= cut ? "true" : "false"}
          style={
            {
              "--_h": mine ? visualGain(values[i] as number).toFixed(3) : "0",
            } as React.CSSProperties
          }
        />
      );
    });

  return (
    <>
      <div className="ox-rec-row">
        <span className="ox-rec-meta">
          {split ? labels.join(" · ") : "Single rail — no diarisation"}
        </span>
        <span className="ox-rec-clock">
          {recorderClockShort(played * durationMs)} / {recorderClockShort(durationMs)}
        </span>
      </div>
      <div className="ox-rec-pane">
        <div className="ox-rec-played" style={{ width: `${played * 100}%` }} />
        <div className="ox-rec-rails">
          <div className="ox-rec-rail" data-rail="a">
            {rail(0)}
          </div>
          {split ? (
            <div className="ox-rec-rail" data-rail="b">
              {rail(1)}
            </div>
          ) : null}
          <div className="ox-rec-axis" />
          <span className="ox-rec-who" data-rail="a">
            {labels[0]}
          </span>
          {split ? (
            <span className="ox-rec-who" data-rail="b">
              {labels[1]}
            </span>
          ) : null}
        </div>
        <div className="ox-rec-head" style={{ left: `${played * 100}%` }} />
      </div>
      {balance !== null ? (
        <div className="ox-rec-balance">
          <div className="ox-rec-balance-track">
            <div className="ox-rec-balance-fill" style={{ width: `${balance}%` }} />
          </div>
          <span className="ox-rec-meta">
            {balance}% / {100 - balance}%
          </span>
        </div>
      ) : null}
    </>
  );
}

/**
 * Stream — the accessible equivalent of every waveform here.
 *
 * A screen-reader user cannot see a waveform, so where a transcript exists it
 * is rendered alongside rather than instead. An interim token is drawn as a
 * guess: committing it and then rewriting it is how a transcript loses a
 * clinician in the first thirty seconds.
 */
function StreamArt({
  turns,
  fault,
}: {
  readonly turns: readonly RecorderTurn[];
  readonly fault: RecorderFault | null;
}): React.JSX.Element {
  const stalled = fault?.code === "recogniser-stalled";
  return (
    <div data-stalled={stalled ? "true" : "false"}>
      <div className="ox-rec-log">
        {turns.map((turn) => (
          <div className="ox-rec-turn" key={turn.id}>
            <b>{turn.speaker}</b>
            <p className="ox-rec-words">
              {turn.words}
              {turn.interim !== undefined ? (
                <span className="ox-rec-interim"> {turn.interim}</span>
              ) : null}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- helpers */

const EMPTY_PEAKS = new Float32Array(0);

const REST_FRAME: SignalFrame = {
  peak: 0,
  level: 0,
  hold: 0,
  display: 0,
  dbfs: -100,
  quiet: true,
  silentMs: 0,
  elapsedMs: 0,
  buckets: 0,
  bucket: null,
  closed: [],
};

function describeLevel(frame: SignalFrame | null): string {
  if (frame === null || frame.level <= 0) return "no input";
  return `${Math.round(toDbfs(frame.level))} dBFS`;
}

export const RECORDER_ARTS: readonly RecorderArt[] = ["pulse", "bars", "strip", "duet", "stream"];
export { RECORDER_PHASES };
