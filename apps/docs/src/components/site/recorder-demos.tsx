"use client";

/**
 * Live examples for Recorder, and the synthetic microphone they share.
 *
 * Every example is the shipped component, driven by props or by a declared
 * demo source — never by a timer, which is the defect the component exists to
 * argue against. The source and the takes below also feed the gallery in
 * component-preview, so the two cannot drift apart.
 *
 * The chrome around the art — the signal switch, the console's host regions —
 * is drawn in page tokens, not panel tokens. It sits on the light example
 * panel, where the panel's muted ink measured 2.9:1 and the console's dark
 * fill put the recorder's own clock at 1.1:1.
 */

import * as React from "react";
import {
  Recorder,
  RecorderDispositionStrip,
  type RecorderProps,
} from "@/registry/zoblocks/recorder/recorder";

/**
 * A synthetic microphone for the previews, and the switch that takes it away.
 *
 * This is NOT the defect the component argues against. The defect is art that
 * moves with no source behind it; here there is a source, it is declared, and
 * the component reads it exactly as it would read an AnalyserNode. The clock
 * lives in the source — as it does in a real microphone — and the art still has
 * none, which is the whole point: change the source and the art follows,
 * including all the way to nothing.
 *
 * A docs page cannot ask for microphone permission, and faking the waveform
 * instead would demonstrate the failure on the component's own documentation.
 */
export type RecSignalMode = "speech" | "quiet" | "muted" | "lost";

const REC_MODES: ReadonlyArray<{ id: RecSignalMode; label: string; note: string }> = [
  { id: "speech", label: "Speech", note: "Someone is talking. The lane fills, the level moves." },
  {
    id: "quiet",
    label: "Quiet room",
    note: "Room tone, a few dB above the floor. This is what an OPEN microphone in an empty room looks like — not silence.",
  },
  {
    id: "muted",
    label: "Microphone muted",
    note: "Digital silence, arriving on schedule. A timer-driven waveform is identical here to the one above; this one stops, and then says which fault it is.",
  },
  {
    id: "lost",
    label: "Device unplugged",
    note: "The track ended. Not silence — absence. The recording so far is intact and is held, which is the distinction that keeps a pipeline from throwing away the expensive artefact.",
  },
];

export function makeRecDemoSource(modeRef: { current: RecSignalMode }) {
  let t = 0;
  return {
    getFloatTimeDomainData(target: Float32Array) {
      t += 1 / 60;
      const mode = modeRef.current;
      let level = 0;
      if (mode === "speech") {
        // A phrase, then a breath. 4.6 Hz syllables under a 1.3 Hz word
        // envelope — the rates ordinary speech actually runs at.
        const phrase = (t % 4.3) / 4.3;
        const gate = phrase < 0.8 ? 1 : 0;
        const syllable = 0.5 + 0.5 * Math.sin(2 * Math.PI * 4.6 * t);
        const word = 0.52 + 0.48 * Math.sin(2 * Math.PI * 1.31 * t + 1.7);
        level = Math.min(1, gate * (0.16 + 0.84 * syllable ** 1.4 * word) + 0.03);
      } else if (mode === "quiet") {
        level = 0.03 + 0.02 * Math.abs(Math.sin(t * 5.3));
      }
      // muted and lost both report exactly nothing, which is the point: they
      // are separated by the TRACK, never by the signal.
      target[0] = level;
      for (let i = 1; i < target.length; i += 1) target[i] = 0;
    },
  };
}

/**
 * A capture art wired to the demo source, with the switch above it.
 *
 * The switch is the argument in §01 made operable: mute the microphone and
 * watch which parts of the surface admit it.
 */
export function RecLive({
  switchable = false,
  initial = "speech",
  ...props
}: Omit<React.ComponentProps<typeof Recorder>, "source" | "phase" | "track"> & {
  switchable?: boolean;
  /** The signal the switch starts on. */
  initial?: RecSignalMode;
}) {
  const [mode, setMode] = React.useState<RecSignalMode>(initial);
  const modeRef = React.useRef<RecSignalMode>(mode);
  modeRef.current = mode;
  const source = React.useMemo(() => makeRecDemoSource(modeRef), []);

  const track = React.useMemo(
    () => ({
      readyState: mode === "lost" ? ("ended" as const) : ("live" as const),
      muted: mode === "muted",
    }),
    [mode],
  );

  const active = REC_MODES.find((m) => m.id === mode) ?? REC_MODES[0];

  if (!switchable) {
    return <Recorder {...props} phase="recording" source={source} track={track} />;
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-graphite">
          Signal
        </span>
        {REC_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            aria-pressed={m.id === mode}
            className={[
              "rounded-lg px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-wider transition-colors",
              m.id === mode
                ? "bg-paper-sunk font-semibold text-ink ring-1 ring-ink/40"
                : "text-graphite hover:bg-paper-sunk hover:text-ink",
            ].join(" ")}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Recorder
        {...props}
        phase={mode === "lost" ? "held" : "recording"}
        source={source}
        track={track}
        /* Three seconds rather than the twenty a real capture uses: a reader
           pressing "muted" should not have to wait out a clinical budget to
           see what the component does about it. */
        silenceBudgetMs={3000}
      />
      <p className="max-w-prose text-xs text-graphite">{active?.note}</p>
    </div>
  );
}

/**
 * The Console composition — the brief's flagship figure.
 *
 * Not a component: the whole point of calling it a composition is that it is
 * `bars` with the host's own regions around it. What a host supplies is exactly
 * what is here — a consent tag, participants, a sensitivity badge, a disclosure
 * footer — and none of it is invented by the recorder.
 */
export function RecConsole() {
  const [markers, setMarkers] = React.useState<
    Array<{ id: string; at: number; label: string; struck?: boolean }>
  >([]);
  const stamp = React.useRef(0);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-rule bg-paper">
      <div className="flex flex-wrap items-center gap-2 border-b border-rule bg-paper-sunk px-3 py-2">
        <span className="zb-rec-tell">Recording</span>
        <span className="rounded border border-rule px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-graphite">
          Consent 09:11
        </span>
        <span className="rounded border border-rule px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-graphite">
          42 CFR Part 2
        </span>
        <span className="ms-auto font-mono text-[0.6rem] uppercase tracking-wider text-graphite">
          3 in room · Jabra Link 380
        </span>
      </div>
      <div className="p-3">
        <RecLive
          switchable
          variant="bars"
          device={REC_JABRA}
          expectedDevice={REC_JABRA}
          context="Encounter · Room 4"
          markers={markers}
          onPause={() => {}}
          onStop={() => {}}
          onMark={() => {
            stamp.current += 1;
            setMarkers((m) => [
              ...m,
              {
                id: `m${stamp.current}`,
                at: Math.min(0.95, 0.15 + m.length * 0.18),
                label: "Mark",
              },
            ]);
          }}
          onStrike={() => {
            stamp.current += 1;
            setMarkers((m) => [
              ...m,
              {
                id: `s${stamp.current}`,
                at: Math.min(0.95, 0.2 + m.length * 0.18),
                label: "Struck 0:30",
                struck: true,
              },
            ]);
          }}
        />
      </div>
      <p className="border-t border-rule bg-paper-sunk px-3 py-2 text-[0.7rem] text-graphite">
        Audio stays in-region. Transcription is on-premise for Part 2 records. Retention 30 days,
        then transcript only.
      </p>
    </div>
  );
}

/** The four post-stop states, steppable rather than on a loop. */
export function RecDispositionCycle() {
  const STATES = [
    { state: "held" as const, bytes: 14_200_000, sent: 0 },
    { state: "uploading" as const, bytes: 14_200_000, sent: 8_900_000 },
    { state: "transcribing" as const, bytes: 14_200_000, sent: 14_200_000 },
    { state: "ready" as const, bytes: 14_200_000, sent: 14_200_000 },
    {
      state: "failed" as const,
      bytes: 14_200_000,
      sent: 8_900_000,
      error: "Network dropped at 62%.",
    },
  ];
  const [i, setI] = React.useState(0);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {STATES.map((s, index) => (
          <button
            key={s.state}
            type="button"
            onClick={() => setI(index)}
            aria-pressed={i === index}
            className={[
              "rounded-lg px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-wider transition-colors",
              i === index
                ? "bg-paper-sunk font-semibold text-ink ring-1 ring-ink/40"
                : "text-graphite hover:bg-paper-sunk hover:text-ink",
            ].join(" ")}
          >
            {s.state}
          </button>
        ))}
      </div>
      <RecorderDispositionStrip
        disposition={STATES[i]!}
        durationMs={252_000}
        onRetry={() => setI(1)}
      />
    </div>
  );
}

export function RecStage({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-xl">{children}</div>;
}

export const REC_JABRA = { deviceId: "jabra", label: "Jabra Link 380" };
export const REC_BUILTIN = { deviceId: "builtin", label: "MacBook Pro Microphone" };

/**
 * A deterministic take.
 *
 * Generated from a formula rather than a random seed, so the previews are
 * byte-identical between runs and a visual regression means something changed
 * rather than that the noise moved.
 */
export const REC_PEAKS = Float32Array.from({ length: 180 }, (_, i) => {
  const t = i / 12;
  const phrase = (t % 3.9) / 3.9 < 0.82 ? 1 : 0.06;
  const syllable = 0.5 + 0.5 * Math.sin(2 * Math.PI * 4.4 * t);
  return Math.min(1, phrase * (0.2 + 0.8 * syllable ** 1.3));
});
export const REC_SPEAKERS = Uint8Array.from({ length: 180 }, (_, i) =>
  Math.floor(i / 26) % 2 === 0 ? 0 : 1,
);

export const REC_MARKERS = [
  { id: "exam", at: 0.31, label: "Exam" },
  { id: "plan", at: 0.58, label: "Plan" },
  { id: "struck", at: 0.79, label: "Struck 0:22", struck: true, span: 0.03 },
];

export const REC_TURNS = [
  { id: "1", speaker: "Dr Okafor", words: "And how long has the breathlessness been going on for" },
  { id: "2", speaker: "Patient", words: "Maybe three weeks now It is worse going up the stairs" },
  { id: "3", speaker: "Patient", words: "I have to stop halfway which I", interim: "never" },
];

/* ------------------------------------------------------------------ */
/* Capture                                                            */
/* ------------------------------------------------------------------ */

export function Capturing() {
  return (
    <RecStage>
      <RecLive
        switchable
        variant="bars"
        device={REC_JABRA}
        expectedDevice={REC_JABRA}
        context="Encounter · Room 4"
        onPause={() => {}}
        onStop={() => {}}
      />
    </RecStage>
  );
}

export function EncounterSurface() {
  return (
    <RecStage>
      <RecConsole />
    </RecStage>
  );
}

export function SingleControl() {
  return (
    <RecStage>
      <RecLive variant="pulse" />
    </RecStage>
  );
}

export function InlineDictation() {
  return (
    <RecStage>
      <RecLive variant="strip" context="History of presenting complaint" onSend={() => {}} />
    </RecStage>
  );
}

/* ------------------------------------------------------------------ */
/* When it is lying                                                   */
/* ------------------------------------------------------------------ */

export function MicrophoneMuted() {
  return (
    <RecStage>
      <RecLive
        switchable
        initial="muted"
        variant="bars"
        device={REC_JABRA}
        expectedDevice={REC_JABRA}
      />
    </RecStage>
  );
}

export function DeviceLost() {
  return (
    <RecStage>
      <RecLive
        switchable
        initial="lost"
        variant="bars"
        device={REC_JABRA}
        expectedDevice={REC_JABRA}
      />
    </RecStage>
  );
}

export function WrongDevice() {
  return (
    <RecStage>
      <RecLive variant="bars" device={REC_BUILTIN} expectedDevice={REC_JABRA} />
    </RecStage>
  );
}

export function AwaitingConsent() {
  return (
    <RecStage>
      <Recorder variant="bars" phase="armed" consent={null} />
    </RecStage>
  );
}

export function HeldNotSent() {
  return (
    <RecStage>
      <Recorder
        variant="bars"
        phase="held"
        disposition={{ state: "failed", bytes: 14_200_000, sent: 8_900_000, error: "network" }}
      />
    </RecStage>
  );
}

export function WhereItIs() {
  return (
    <RecStage>
      <RecDispositionCycle />
    </RecStage>
  );
}

/* ------------------------------------------------------------------ */
/* Reviewing a take                                                   */
/* ------------------------------------------------------------------ */

export function WhoSpokeWhen() {
  return (
    <RecStage>
      <Recorder
        variant="duet"
        phase="ready"
        peaks={REC_PEAKS}
        speakers={REC_SPEAKERS}
        position={0.44}
        durationMs={754_000}
        speakerLabels={["Dr Okafor", "Patient"]}
        title="Consultation — 14 Aug, 09:12"
        markers={REC_MARKERS}
      />
    </RecStage>
  );
}

export function WithoutDiarisation() {
  return (
    <RecStage>
      <Recorder
        variant="duet"
        phase="ready"
        peaks={REC_PEAKS}
        speakers={null}
        position={0.3}
        durationMs={754_000}
      />
    </RecStage>
  );
}

/* ------------------------------------------------------------------ */
/* Transcript                                                         */
/* ------------------------------------------------------------------ */

export function LiveTranscript() {
  return (
    <RecStage>
      <Recorder variant="stream" phase="recording" turns={REC_TURNS} />
    </RecStage>
  );
}

export function TranscriptStalled() {
  return (
    <RecStage>
      <Recorder variant="stream" phase="recording" turns={REC_TURNS} transcriptLagMs={7_000} />
    </RecStage>
  );
}

/* ------------------------------------------------------------------ */
/* Playground                                                         */
/* ------------------------------------------------------------------ */

/**
 * Each art with the input it reads: the demo microphone for the capture arts,
 * a finished take for duet, a transcript for stream. Without them duet would
 * draw one empty rail and stream an empty pane, and neither says anything
 * about the knob the reader just moved.
 */
export function RecorderPlayground(props: Partial<RecorderProps>) {
  const variant = props.variant ?? "bars";
  const source = React.useMemo(() => makeRecDemoSource({ current: "speech" }), []);
  const input: Partial<RecorderProps> =
    variant === "duet"
      ? {
          peaks: REC_PEAKS,
          speakers: REC_SPEAKERS,
          position: 0.44,
          durationMs: 754_000,
          speakerLabels: ["Dr Okafor", "Patient"],
          markers: REC_MARKERS,
        }
      : variant === "stream"
        ? { turns: REC_TURNS }
        : { source, device: REC_JABRA, expectedDevice: REC_JABRA };
  return (
    <RecStage>
      <Recorder phase="recording" context="Encounter · Room 4" {...input} {...props} />
    </RecStage>
  );
}

/** What the playground's code view shows the input as, per art. */
export function recorderPlaygroundAttrs(props: Record<string, unknown>): readonly string[] {
  if (props.variant === "duet") {
    return [
      "peaks={peaks}",
      "speakers={speakers}",
      "position={0.44}",
      "durationMs={754_000}",
      'speakerLabels={["Dr Okafor", "Patient"]}',
    ];
  }
  if (props.variant === "stream") return ["turns={turns}"];
  return ["source={analyser}", "device={device}", "expectedDevice={device}"];
}
