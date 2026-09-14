// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/zoblocks/recorder/recorder.tsx. Edit that file, not this one.
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
} from "@zoblocks/recorder-core";

import {
  RecorderBars,
  RecorderButton,
  RecorderIcon,
  RecorderFaultBanner,
  RecorderFrame,
  RecorderTell,
  paintLane,
  useLaneBars,
  useRecorderSignal,
  type RecorderArt,
  type RecorderMotion,
} from "../../lib/recorder";

import { cn } from "../../lib/utils";

export type { RecorderArt, RecorderMotion };

/**
 * Fallback bar counts, used until the lane has been measured once.
 *
 * The real count comes from `useLaneBars`, because a fixed count is right at
 * exactly one width and leaves dead lane at every other.
 */
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
  /** Drop a marker at the current position. */
  readonly onMark?: () => void;
  /**
   * Strike the last `strikeWindowMs` from the record.
   *
   * Mid-consultation a patient says something and asks for it not to be
   * recorded. Every ambient scribe on the market answers that with "stop and
   * start again", which loses the consultation's continuity at exactly the
   * moment nobody wants to operate a UI. The component only RAISES this — the
   * host zeroes the samples, writes the audit record, and hands back a struck
   * marker so the gap stays visible on the timeline. A removal a reader cannot
   * see is a removal nobody can audit.
   */
  readonly onStrike?: () => void;
  /** How much a strike removes. Thirty seconds by default. */
  readonly strikeWindowMs?: number;
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
  /**
   * How far the transcript trails the audio, in ms. The host's recogniser
   * knows this; the component does not. Past four seconds while recording or
   * transcribing, Stream says the transcript stalled.
   */
  readonly transcriptLagMs?: number;
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
  onMark,
  onStrike,
  strikeWindowMs = 30_000,
  track = null,
  autoGainControl,
  transcriptLagMs,
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
  const laneBars = useLaneBars(laneRef, LANE_BARS[variant] || LANE_BARS.bars);
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
    transcriptLagMs,
    silenceBudgetMs,
  });
  const fault = primaryFault(faults);
  // From every fault, not the primary: a worse one must not hide the stall.
  const stalled = faults.some((candidate) => candidate.code === "recogniser-stalled");

  const lastFault = React.useRef<RecorderFault | null>(null);
  React.useEffect(() => {
    if (lastFault.current?.code !== fault?.code) {
      lastFault.current = fault;
      onFault?.(fault);
    }
  }, [fault, onFault]);

  // A stalled recogniser says nothing about the audio, which is still arriving.
  const hasSignal = fault === null || !fault.capturing || fault.code === "recogniser-stalled";
  const elapsed = frame?.elapsedMs ?? 0;
  // Stream states the stall in place, politely. The banner would repeat it as an alert.
  const bannerFault = variant === "stream" && fault?.code === "recogniser-stalled" ? null : fault;

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
      data-stalled={variant === "stream" ? String(stalled) : undefined}
      aria-label={label}
      {...rest}
    >
      {/* role="timer" is an aria-live="off" region by default. Making it polite
          is the commonest audio-UI accessibility defect: it announces a number
          every second for twenty minutes. */}
      <span className="zb-rec-sr" role="timer" aria-label={`${label} elapsed`}>
        {recorderClock(elapsed)}
      </span>

      {blockedByConsent(phase, consent) ? (
        <div className="zb-rec-fault" data-severity="critical" role="alert">
          <span>
            <b>Consent not recorded.</b> Recording cannot start. Capture the basis, or start an
            unrecorded encounter.
          </span>
        </div>
      ) : (
        <RecorderFaultBanner fault={bannerFault} />
      )}

      {variant === "pulse" ? <PulseArt phase={phase} elapsed={elapsed} frame={frame} /> : null}

      {variant === "bars" ? (
        <BarsArt
          laneRef={laneRef}
          phase={phase}
          elapsed={elapsed}
          frame={frame}
          bars={laneBars}
          device={device}
          context={context}
          onPause={onPause}
          onStop={onStop}
          onMark={onMark}
          onStrike={onStrike}
          strikeWindowMs={strikeWindowMs}
        />
      ) : null}

      {variant === "strip" ? (
        <StripArt
          laneRef={laneRef}
          bars={laneBars}
          elapsed={elapsed}
          context={context}
          onSend={onSend}
        />
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

      {variant === "stream" ? <StreamArt turns={turns} stalled={stalled} /> : null}
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
      <div className="zb-rec-stage">
        <div className="zb-rec-sonar" />
        <div className="zb-rec-ring" data-ring="glow" />
        <div className="zb-rec-ring" data-ring="hold" />
        <div className="zb-rec-ring" data-ring="level" />
        <button
          type="button"
          className="zb-rec-btn"
          data-mode={capturing ? "stop" : "record"}
          aria-label={capturing ? "Stop recording and attach" : "Start recording"}
          onClick={onStop}
        >
          <span />
        </button>
      </div>
      <div className="zb-rec-row" style={{ justifyContent: "center" }}>
        {capturing ? <RecorderTell label="Rec" /> : null}
        {/* A timecode, not a clock. With one control and no lane, the frames
            field is the only thing on screen still moving — it is the evidence
            that the machine is advancing. */}
        <span className="zb-rec-clock" data-size="lg">
          {recorderTimecode(elapsed)}
        </span>
        <span className="zb-rec-meta">{describeLevel(frame)}</span>
      </div>
    </>
  );
}

function BarsArt({
  laneRef,
  phase,
  elapsed,
  frame,
  bars,
  device,
  context,
  onPause,
  onStop,
  onMark,
  onStrike,
  strikeWindowMs = 30_000,
}: {
  readonly laneRef: React.RefObject<HTMLDivElement | null>;
  readonly phase: RecorderPhase;
  readonly elapsed: number;
  readonly frame: SignalFrame | null;
  readonly bars: number;
  readonly device: RecorderDevice | null;
  readonly context?: string;
  readonly onPause?: () => void;
  readonly onStop?: () => void;
  readonly onMark?: () => void;
  readonly onStrike?: () => void;
  readonly strikeWindowMs?: number;
}): React.JSX.Element {
  return (
    <>
      <div className="zb-rec-row">
        {phase === "recording" ? <RecorderTell /> : null}
        <span className="zb-rec-clock" data-size="lg">
          {recorderClock(elapsed)}
        </span>
      </div>
      <div className="zb-rec-pane">
        <div className="zb-rec-lane" ref={laneRef}>
          <RecorderBars count={bars} />
        </div>
      </div>
      <div className="zb-rec-row">
        {/* The device name is permanent, never behind a hover or a settings
            panel: §11 row 7 has no signal-level defence and this is the only
            one there is. The context sits beside it rather than replacing it. */}
        <span className="zb-rec-meta">
          {context !== undefined ? `${context} · ` : ""}
          {device?.label ?? "No input device"}
          {" · "}
          {describeLevel(frame)}
        </span>
        <span className="zb-rec-transport">
          {onPause !== undefined ? (
            <RecorderButton icon="pause" onClick={onPause}>
              Pause
            </RecorderButton>
          ) : null}
          {onMark !== undefined ? (
            <RecorderButton icon="flag" onClick={onMark}>
              Mark
            </RecorderButton>
          ) : null}
          {onStrike !== undefined ? (
            <RecorderButton icon="alert" onClick={onStrike}>
              Strike {Math.round(strikeWindowMs / 1000)}&nbsp;s
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
  bars,
  elapsed,
  context,
  onSend,
}: {
  readonly laneRef: React.RefObject<HTMLDivElement | null>;
  readonly bars: number;
  readonly elapsed: number;
  readonly context?: string;
  readonly onSend?: () => void;
}): React.JSX.Element {
  return (
    <>
      <div className="zb-rec-bar">
        {/* A real glyph rather than a dot: at 40px the microphone is the only
            thing telling a reader what this strip is before it moves. */}
        <span className="zb-rec-mic">
          <RecorderIcon name="mic" size={18} />
        </span>
        <div className="zb-rec-lane" ref={laneRef}>
          <RecorderBars count={bars} />
        </div>
        <span className="zb-rec-clock">{recorderClockShort(elapsed)}</span>
        {onSend !== undefined ? (
          <button
            type="button"
            className="zb-rec-send"
            aria-label="Stop and insert"
            onClick={onSend}
          >
            <RecorderIcon name="send" />
          </button>
        ) : null}
      </div>
      {context !== undefined ? (
        <p className="zb-rec-meta zb-rec-context">
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
      <div className="zb-rec-row">
        {/* The take's own name, not the speakers — they are already on the
            axis, and printing them twice spends the one line a reviewer reads
            first on something the picture already says. */}
        <b className="zb-rec-title">{title ?? "Recording"}</b>
        <span className="zb-rec-clock">
          {takeClock(played * durationMs)} / {takeClock(durationMs)}
        </span>
      </div>
      {!split ? <span className="zb-rec-meta">Single rail — no diarisation</span> : null}
      {markers.length > 0 ? (
        <div className="zb-rec-markbar">
          {markers.map((marker) => (
            <span
              key={marker.id}
              className="zb-rec-mark"
              data-struck={marker.struck === true ? "true" : "false"}
              style={{ left: `${Math.max(0, Math.min(1, marker.at)) * 100}%` }}
            >
              <span>{marker.label}</span>
              <i />
            </span>
          ))}
        </div>
      ) : null}
      <div className="zb-rec-pane">
        <div className="zb-rec-played" style={{ width: `${played * 100}%` }} />
        <div className="zb-rec-rails">
          <div className="zb-rec-rail" data-rail="a">
            {rail(0)}
          </div>
          {split ? (
            <div className="zb-rec-rail" data-rail="b">
              {rail(1)}
            </div>
          ) : null}
          <div className="zb-rec-axis" />
          <span className="zb-rec-who" data-rail="a">
            {labels[0]}
          </span>
          {split ? (
            <span className="zb-rec-who" data-rail="b">
              {labels[1]}
            </span>
          ) : null}
        </div>
        <div className="zb-rec-head" style={{ left: `${played * 100}%` }} />
      </div>
      {balance !== null ? (
        <div className="zb-rec-balance">
          <div className="zb-rec-balance-track">
            <div className="zb-rec-balance-fill" style={{ width: `${balance}%` }} />
          </div>
          <span className="zb-rec-meta">
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
  stalled,
}: {
  readonly turns: readonly RecorderTurn[];
  readonly stalled: boolean;
}): React.JSX.Element {
  return (
    <div>
      <div className="zb-rec-log">
        {turns.map((turn) => (
          <div className="zb-rec-turn" key={turn.id}>
            <b>{turn.speaker}</b>
            <p className="zb-rec-words">
              {turn.words}
              {turn.interim !== undefined ? (
                <span className="zb-rec-interim"> {turn.interim}</span>
              ) : null}
            </p>
          </div>
        ))}
      </div>
      {stalled ? (
        <div className="zb-rec-fault" data-severity="warn" role="status">
          <RecorderIcon name="alert" />
          <span>
            <b>Transcript stalled.</b> The audio is still being written to disk — the recogniser is
            behind, not the recorder.
          </span>
        </div>
      ) : null}
      <p className="zb-rec-meta zb-rec-context">
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

/* ==================================================================== *
 *  RecorderDisposition — the companion, not a sixth art.
 * ==================================================================== */

/**
 * Where the recording actually is.
 *
 * A companion rather than a variant: it has no waveform and no transport, so
 * counting it as an art would be counting a status strip as a renderer. It sits
 * beside a recorder, or replaces it once capture has finished.
 *
 * Four states after `stop`, each of which can fail on its own and each of which
 * is rendered. The first is the one every thin `MediaRecorder` wrapper skips —
 * **held**: captured, on this device, not yet anywhere else. A tick at that
 * moment is a falsehood about a legal record.
 */
export interface RecorderDispositionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Where the bytes are. The component renders this; the host moves them. */
  readonly disposition: RecorderDisposition;
  /** Length of the take, for the "captured" step's readout. */
  readonly durationMs?: number;
  /** Recogniser language, for the "transcribed" step. */
  readonly language?: string;
  /** What the transcript is attached to once it is ready. */
  readonly attachedTo?: string;
  /** Offered on `failed`, and only then — a retry that cannot retry is a lie. */
  readonly onRetry?: () => void;
}

const DISPOSITION_STEPS = ["Captured", "Uploaded", "Transcribed", "Attached"] as const;

const DISPOSITION_INDEX: Readonly<Record<RecorderDisposition["state"], number>> = {
  held: 0,
  uploading: 1,
  queued: 1,
  transcribing: 2,
  ready: 3,
  failed: 1,
};

function megabytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function RecorderDispositionStrip({
  disposition,
  durationMs = 0,
  language = "en-GB",
  attachedTo = "encounter",
  onRetry,
  className,
  ...rest
}: RecorderDispositionProps): React.JSX.Element {
  const { state, bytes, sent } = disposition;
  const active = DISPOSITION_INDEX[state];
  /*
   * Floor, not round, and it has to match faults.ts.
   *
   * 8.9 of 14.2 MB is 62.67%. Rounding calls that 63 and the fault banner —
   * which floors — calls it 62, so the same recording reports two different
   * numbers depending on which surface you happen to be looking at. Beyond the
   * inconsistency, flooring is the honest direction: it never claims more bytes
   * are on the server than actually are.
   */
  const percent = bytes > 0 ? Math.min(100, Math.floor((sent / bytes) * 100)) : 0;

  // One sentence per state, and each says what is TRUE of the audio right now
  // rather than how far along a bar has crept.
  const note =
    state === "held"
      ? `Held on this device. ${megabytes(bytes)}, not yet uploaded.`
      : state === "uploading"
        ? `Uploading — ${megabytes(sent)} of ${megabytes(bytes)}. Resumes if the connection drops.`
        : state === "queued"
          ? "Queued. The audio is on the server and waiting its turn."
          : state === "transcribing"
            ? "Transcribing. The audio is safe; this step can be retried."
            : state === "ready"
              ? `Ready. Transcript attached to the ${attachedTo}.`
              : (disposition.error ?? "Upload failed.");

  const values = [
    durationMs > 0 ? `${recorderClockShort(durationMs)} · ${megabytes(bytes)}` : megabytes(bytes),
    state === "failed" ? `stalled at ${percent}%` : "resumable",
    language,
    attachedTo,
  ];

  return (
    <div
      className={cn("zb-rec", "zb-rec-stack", className)}
      data-zb-recorder="disposition"
      data-state={state}
      {...rest}
    >
      <ol className="zb-rec-steps">
        {DISPOSITION_STEPS.map((step, index) => (
          <li
            key={step}
            className="zb-rec-step"
            data-done={index < active ? "true" : "false"}
            data-live={index === active ? "true" : "false"}
            data-failed={index === active && state === "failed" ? "true" : "false"}
          >
            <span className="zb-rec-step-name">{step}</span>
            <span className="zb-rec-step-value">{values[index]}</span>
          </li>
        ))}
      </ol>

      {/* Hatched while held: there is no progress to report, because nothing
          is moving. A bar creeping forward would be inventing one. */}
      <div className="zb-rec-track" data-indeterminate={state === "held" ? "true" : "false"}>
        <div
          className="zb-rec-track-fill"
          style={{ width: `${state === "ready" ? 100 : percent}%` }}
        />
      </div>

      <div className="zb-rec-row">
        <span className="zb-rec-meta" role={state === "failed" ? "alert" : undefined}>
          {note}
        </span>
        {state === "failed" && onRetry !== undefined ? (
          <RecorderButton primary onClick={onRetry}>
            Retry from {percent}%
          </RecorderButton>
        ) : (
          <span className="zb-rec-meta">{state === "ready" ? "done" : `${percent}%`}</span>
        )}
      </div>
    </div>
  );
}
