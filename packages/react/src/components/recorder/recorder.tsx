// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/recorder/recorder.tsx. Edit that file, not this one.
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
  recorderTimecode,
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
  type TrackObservation,
} from "@oxygenui-design/recorder-core";

import {
  RecorderBars,
  RecorderButton,
  RecorderIcon,
  RecorderFaultBanner,
  RecorderFrame,
  RecorderTell,
  paintLane,
  useRecorderSignal,
  type RecorderArt,
  type RecorderMotion,
} from "../../lib/recorder";

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
  /**
   * What the take IS — "Consultation — 14 Aug, 09:12".
   *
   * The playback header carries this rather than the speaker names, because
   * the names are already on the axis; printing them twice spends the one line
   * a reviewer reads first on something the picture already says.
   */
  readonly title?: string;
  /**
   * Moments somebody marked, and spans struck from the record.
   *
   * A struck span stays on the timeline as a hatched gap rather than being
   * removed: a removal a reader cannot see is a removal nobody can audit, and
   * an audio file with an invisible splice is worse evidence than one with a
   * labelled hole.
   */
  readonly markers?: readonly RecorderMarker[];
  /**
   * Where the capture is happening, in the host's own words — "Encounter ·
   * Room 4", or the field a dictation is going into. Rendered beside the
   * device name, never instead of it.
   */
  readonly context?: string;
  /**
   * Suspend capture without ending the take. A control that is missing because
   * the host passed no handler is hidden rather than disabled: a dead button is
   * a promise the surface cannot keep.
   */
  readonly onPause?: () => void;
  /** End the take and hand it to the host. The primary action on the capture arts. */
  readonly onStop?: () => void;
  /** Stop and insert, for Strip — the dictation equivalent of stop-and-attach. */
  readonly onSend?: () => void;
  /**
   * The live state of the capture track — `readyState` and `muted`.
   *
   * This is what separates the four faults that are byte-identical at the
   * signal layer. An OS mute, a headset mute, a device that ended and a device
   * that was swapped all deliver near-silence on schedule; only the track and
   * the device tell them apart, which is why the component asks for them rather
   * than trying to read them out of the waveform.
   */
  readonly track?: TrackObservation | null;
  /**
   * Whether the browser is applying automatic gain control.
   *
   * With AGC on, the meter reports the browser's opinion of the room rather
   * than the room. Nothing is broken, so this surfaces as information — but it
   * has to surface, or the meter looks perfect under every condition.
   */
  readonly autoGainControl?: boolean;
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

export interface RecorderMarker {
  readonly id: string;
  /** 0–1 along the take. */
  readonly at: number;
  readonly label: string;
  /** A struck span is drawn as a removal, not omitted. */
  readonly struck?: boolean;
  /** How much was struck, 0–1 of the take. Only meaningful when `struck`. */
  readonly span?: number;
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
  title,
  markers = [],
  context,
  onPause,
  onStop,
  onSend,
  track = null,
  autoGainControl,
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
    track,
    device,
    expectedDevice,
    disposition,
    autoGainControl,
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
        <BarsArt
          laneRef={laneRef}
          phase={phase}
          elapsed={elapsed}
          frame={frame}
          device={device}
          context={context}
          onPause={onPause}
          onStop={onStop}
        />
      ) : null}

      {variant === "strip" ? (
        <StripArt laneRef={laneRef} elapsed={elapsed} context={context} onSend={onSend} />
      ) : null}

      {variant === "duet" ? (
        <DuetArt
          peaks={peaks}
          speakers={speakers}
          position={position}
          durationMs={durationMs}
          labels={speakerLabels}
          title={title}
          markers={markers}
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
  onStop,
}: {
  readonly phase: RecorderPhase;
  readonly elapsed: number;
  readonly frame: SignalFrame | null;
  readonly onStop?: () => void;
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
          aria-label={capturing ? "Stop recording and attach" : "Start recording"}
          onClick={onStop}
        >
          <span />
        </button>
      </div>
      <div className="ox-rec-row" style={{ justifyContent: "center" }}>
        {capturing ? <RecorderTell label="Rec" /> : null}
        {/* A timecode, not a clock. With one control and no lane, the frames
            field is the only thing on screen still moving — it is the evidence
            that the machine is advancing. */}
        <span className="ox-rec-clock" data-size="lg">
          {recorderTimecode(elapsed)}
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
  context,
  onPause,
  onStop,
}: {
  readonly laneRef: React.RefObject<HTMLDivElement | null>;
  readonly phase: RecorderPhase;
  readonly elapsed: number;
  readonly frame: SignalFrame | null;
  readonly device: RecorderDevice | null;
  readonly context?: string;
  readonly onPause?: () => void;
  readonly onStop?: () => void;
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
        {/* The device name is permanent, never behind a hover or a settings
            panel: §11 row 7 has no signal-level defence and this is the only
            one there is. The context sits beside it rather than replacing it. */}
        <span className="ox-rec-meta">
          {context !== undefined ? `${context} · ` : ""}
          {device?.label ?? "No input device"}
          {" · "}
          {describeLevel(frame)}
        </span>
        <span className="ox-rec-transport">
          {onPause !== undefined ? (
            <RecorderButton icon="pause" onClick={onPause}>
              Pause
            </RecorderButton>
          ) : null}
          {onStop !== undefined ? (
            <RecorderButton icon="square" primary onClick={onStop}>
              Stop &amp; attach
            </RecorderButton>
          ) : null}
        </span>
      </div>
    </>
  );
}

function StripArt({
  laneRef,
  elapsed,
  context,
  onSend,
}: {
  readonly laneRef: React.RefObject<HTMLDivElement | null>;
  readonly elapsed: number;
  readonly context?: string;
  readonly onSend?: () => void;
}): React.JSX.Element {
  return (
    <>
      <div className="ox-rec-bar">
        {/* A real glyph rather than a dot: at 40px the microphone is the only
            thing telling a reader what this strip is before it moves. */}
        <span className="ox-rec-mic">
          <RecorderIcon name="mic" size={18} />
        </span>
        <div className="ox-rec-lane" ref={laneRef}>
          <RecorderBars count={LANE_BARS.strip} />
        </div>
        <span className="ox-rec-clock">{recorderClockShort(elapsed)}</span>
        {onSend !== undefined ? (
          <button
            type="button"
            className="ox-rec-send"
            aria-label="Stop and insert"
            onClick={onSend}
          >
            <RecorderIcon name="send" />
          </button>
        ) : null}
      </div>
      {context !== undefined ? (
        <p className="ox-rec-meta ox-rec-context">
          Dictating into <strong>{context}</strong> · Esc discards
        </p>
      ) : null}
    </>
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
  title,
  markers,
}: {
  readonly peaks: Float32Array | null;
  readonly speakers: Uint8Array | null;
  readonly position: number;
  readonly durationMs: number;
  readonly labels: readonly [string, string];
  readonly title?: string;
  readonly markers: readonly RecorderMarker[];
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

  /*
   * Struck spans, resolved to bucket indices once rather than per bar.
   * A removal a reader cannot see is a removal nobody can audit, so a struck
   * span stays on BOTH rails as a hatched gap: hatching one side only would
   * read as one person having been edited out of the conversation.
   */
  const struck = React.useMemo(() => {
    const flags = new Uint8Array(values.length);
    for (const marker of markers) {
      if (marker.struck !== true) continue;
      const from = Math.max(0, Math.floor(marker.at * values.length));
      const to = Math.min(
        values.length,
        Math.ceil((marker.at + (marker.span ?? 0.02)) * values.length),
      );
      for (let i = from; i < to; i += 1) flags[i] = 1;
    }
    return flags;
  }, [values.length, markers]);

  const rail = (which: 0 | 1): React.JSX.Element[] =>
    Array.from({ length: values.length }, (_, i) => {
      const mine = !split || speakers?.[i] === which;
      return (
        <i
          key={i}
          data-played={i <= cut ? "true" : "false"}
          data-struck={struck[i] === 1 ? "true" : "false"}
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
        {/* The take's own name, not the speakers — they are already on the
            axis, and printing them twice spends the one line a reviewer reads
            first on something the picture already says. */}
        <b className="ox-rec-title">{title ?? "Recording"}</b>
        <span className="ox-rec-clock">
          {takeClock(played * durationMs)} / {takeClock(durationMs)}
        </span>
      </div>
      {!split ? <span className="ox-rec-meta">Single rail — no diarisation</span> : null}
      {markers.length > 0 ? (
        <div className="ox-rec-markbar">
          {markers.map((marker) => (
            <span
              key={marker.id}
              className="ox-rec-mark"
              data-struck={marker.struck === true ? "true" : "false"}
              style={{ left: `${Math.max(0, Math.min(1, marker.at)) * 100}%` }}
            >
              <span>{marker.label}</span>
              <i />
            </span>
          ))}
        </div>
      ) : null}
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
      {stalled ? (
        <div className="ox-rec-fault" data-severity="warn" role="status">
          <RecorderIcon name="alert" />
          <span>
            <b>Transcript stalled.</b> The audio is still being written to disk — the recogniser is
            behind, not the recorder.
          </span>
        </div>
      ) : null}
      <p className="ox-rec-meta ox-rec-context">
        Interim tokens are drawn as guesses. Nothing is committed until the recogniser stops
        revising it.
      </p>
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

/**
 * `05:31`, and `1:02:03` past the hour.
 *
 * A playback readout sits beside a duration it is counting toward, so the two
 * must be the same width — `5:31 / 12:34` jitters as the minute rolls over,
 * where `05:31 / 12:34` does not. The capture clock pads for the same reason.
 */
function takeClock(ms: number): string {
  const full = recorderClock(ms);
  return full.startsWith("00:") ? full.slice(3) : full;
}

function describeLevel(frame: SignalFrame | null): string {
  if (frame === null || frame.level <= 0) return "no input";
  return `${Math.round(toDbfs(frame.level))} dBFS`;
}

export const RECORDER_ARTS: readonly RecorderArt[] = ["pulse", "bars", "strip", "duet", "stream"];
export { RECORDER_PHASES };
