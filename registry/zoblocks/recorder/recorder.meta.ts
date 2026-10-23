import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "recorder",
  title: "Recorder",
  tier: "free",
  status: "beta",
  since: "0.3.0",
  layer: "pattern",

  summary:
    "A capture surface that cannot lie about whether it is listening. Five arts over one signal engine, and thirteen failure modes it can tell apart.",

  tagline: "It cannot lie about whether it is listening.",
  description:
    "Ambient documentation, dictation, voice messaging and transcript review. Five arts — pulse, bars, strip, duet, stream — over one engine, with an analyser-driven meter, a silence budget and thirteen device faults.",
  rationale:
    "Every voice recorder on the web animates on a timer. An OS mute, a Bluetooth profile switch and a swapped device all deliver digital silence on schedule, and a timer cannot tell that from a quiet room. This one draws only what the analyser reports, then names which of the thirteen faults it is.",

  categories: ["Media", "Clinical"],
  fhir: [],

  states: [
    "Recording",
    "Armed, awaiting consent",
    "Microphone muted",
    "Device lost",
    "Held, not yet uploaded",
    "Playback with speakers",
    "Playback without diarisation",
    "Live transcript",
    "Transcript stalled",
    "Inline dictation",
    "Single control",
  ],

  a11y: [
    {
      label: "The timer is polled, never pushed",
      detail:
        "role=timer, an aria-live=off region. Polite would announce a number every second for twenty minutes.",
    },
    {
      label: "Announced on transitions, not continuously",
      detail:
        "One status region carries phase changes, a sentence each. Crossing the silence budget is the only assertive announcement.",
    },
    {
      label: "The waveform is hidden; the transcript is the equivalent",
      detail:
        "The art is aria-hidden: it pictures a number already announced. Where a transcript exists, Stream is what a screen reader reads instead.",
    },
    {
      label: "Motion is replaced by a number, not removed",
      detail:
        "The scroll stops; the meter does not. A dBFS readout and a tabular timer carry what the scroll carried. `motion` is the WCAG 2.2.2 mechanism.",
    },
    {
      label: "Non-text contrast is solved against the pane",
      detail:
        "Played and unplayed cannot both clear 3:1 on one ramp. Unplayed is solved against the pane; the boundary is a wash plus the playhead.",
    },
  ],

  guidance: {
    use: [
      "Ambient documentation and dictation, where the clinician is looking at the patient rather than the screen and needs to see at a glance that capture is working.",
      "Reviewing a finished take — an appeal, a supervision session, a patient asking what was said. Duet folds the speaker onto the axis so talk-time balance reads without reading.",
      "Anywhere the network is not a given. The disposition states make held-but-not-sent a thing the interface can say.",
    ],
    avoid: [
      "As proof that audio was captured. It reports thirteen faults and there are more; recording the wrong microphone produces plausible room tone and passes every one of them.",
      "Starting a restricted or Part 2 recording from the strip art. A control that quiet is not where a disclosure should begin.",
      "As a consent mechanism. It renders a basis the host asserts and refuses to start without one; it does not obtain consent and does not know what a lawful basis is.",
    ],
  },

  limitations: [
    "It does not move bytes. No upload, no retry, no queue, no recogniser — it renders where a recording is and the host is responsible for getting it there.",
    "Duet needs a peaks sidecar and one speaker byte per bucket, emitted at ingest. Without diarisation it renders a single rail rather than guessing.",
    "Consent copy, disclosure wording and mid-session redaction are deliberately unbuilt, pending clinical and legal review. consent is a typed opaque object the component renders and never authors.",
    "Requires styles/zoblocks-recorder.css, installed with recorder-core. Without it the arts render as unstyled markup.",
  ],
  related: ["pulse-loader", "rhythm-loader", "clinical-note"],

  controls: [
    {
      prop: "variant",
      control: "select",
      label: "Art",
      options: ["pulse", "bars", "strip", "duet", "stream"],
      defaultValue: "bars",
    },
    {
      prop: "phase",
      control: "select",
      label: "Phase",
      options: [
        "idle",
        "requesting",
        "armed",
        "recording",
        "paused",
        "stopping",
        "held",
        "uploading",
        "queued",
        "transcribing",
        "ready",
      ],
      defaultValue: "recording",
    },
    {
      prop: "sensitivity",
      control: "segmented",
      label: "Sensitivity",
      options: ["routine", "confidential", "restricted"],
      defaultValue: "routine",
    },
    {
      prop: "motion",
      control: "segmented",
      label: "Motion",
      options: ["auto", "reduced", "full"],
      defaultValue: "auto",
    },
    { prop: "onPause", control: "event", label: "onPause" },
    { prop: "onStop", control: "event", label: "onStop" },
    { prop: "onSend", control: "event", label: "onSend" },
    { prop: "onMark", control: "event", label: "onMark" },
    { prop: "onStrike", control: "event", label: "onStrike" },
    { prop: "onFault", control: "event", label: "onFault" },
  ],

  examples: [
    /* ---------------------------------------------------------------- */
    /* Capture                                                           */
    /* ---------------------------------------------------------------- */
    {
      id: "recording",
      group: "Capture",
      title: "Capturing, and nothing owns a clock",
      description:
        "Peak buckets at 30 Hz, newest at the right, read from a declared source exactly as an AnalyserNode would be. Take the signal away with the switch and the art stops — the centre hairline is true zero, so a bar touching it means nothing is arriving.",
      code: `<Recorder
  variant="bars"
  phase="recording"
  source={analyser}
  device={{ deviceId: "jabra", label: "Jabra Link 380" }}
  expectedDevice={{ deviceId: "jabra", label: "Jabra Link 380" }}
  context="Encounter · Room 4"
  onPause={pause}
  onStop={stop}
/>`,
    },
    {
      id: "console",
      group: "Capture",
      title: "The full encounter surface",
      description:
        "Consent, participants, device, level, markers and mid-session redaction, assembled. Not a sixth art — bars with the host's own regions around it. Mark and strike add markers to the take.",
      code: `<Recorder
  variant="bars"
  phase="recording"
  source={analyser}
  device={device}
  expectedDevice={device}
  markers={markers}
  onMark={() => addMarker("Mark")}
  onStrike={() => addMarker("Struck 0:30", { struck: true })}
/>`,
    },
    {
      id: "single-control",
      group: "Capture",
      title: "One control, at 44px",
      description:
        "Is it recording — the dot and its shape — and is it hearing me — the rings. The only art that keeps a real level meter at thumb size, which a phone or a patient-facing surface needs.",
      code: `<Recorder variant="pulse" phase="recording" source={analyser} />`,
    },
    {
      id: "dictation",
      group: "Capture",
      title: "Inline dictation",
      description:
        "Forty pixels tall inside a note field, and still a real level meter rather than a static glyph. It refuses to start a restricted recording: a control this quiet is not where a disclosure begins.",
      code: `<Recorder
  variant="strip"
  phase="recording"
  source={analyser}
  context="History of presenting complaint"
  onSend={insertIntoNote}
/>`,
    },

    /* ---------------------------------------------------------------- */
    /* When it is lying                                                  */
    /* ---------------------------------------------------------------- */
    {
      id: "muted",
      group: "When it is lying",
      title: "Microphone muted",
      description:
        "Digital silence, arriving on schedule. A timer-driven waveform looks identical here to one with speech behind it; this one stops, and once the silence budget runs out it says which fault it is. The demo's budget is three seconds rather than twenty.",
      code: `<Recorder
  variant="bars"
  phase="recording"
  source={analyser}
  track={{ readyState: "live", muted: true }}
  silenceBudgetMs={20_000}
  onFault={(fault) => fault && report(fault.code)}
/>`,
    },
    {
      id: "device-lost",
      group: "When it is lying",
      title: "Device lost",
      description:
        "The track ended. Not silence — absence. The recording so far is intact and held, which is the distinction that keeps a pipeline from throwing away the expensive artefact.",
      code: `<Recorder
  variant="bars"
  phase="held"
  source={analyser}
  track={{ readyState: "ended", muted: false }}
/>`,
    },
    {
      id: "wrong-device",
      group: "When it is lying",
      title: "Recording the wrong microphone",
      description:
        "A headset user with the laptop mic live produces plausible room tone and passes every signal check. Caught by comparing the delivering device against the chosen one — which is why the name is rendered, not filed in a settings panel.",
      code: `<Recorder
  variant="bars"
  phase="recording"
  source={analyser}
  device={{ deviceId: "builtin", label: "MacBook Pro Microphone" }}
  expectedDevice={{ deviceId: "jabra", label: "Jabra Link 380" }}
/>`,
    },
    {
      id: "no-consent",
      group: "When it is lying",
      title: "Armed, awaiting consent",
      description:
        "Armed is not idle: permission granted, device chosen, nothing captured, no basis recorded. The engine refuses the edge to recording; the surface says why.",
      code: `<Recorder variant="bars" phase="armed" consent={null} />`,
    },
    {
      id: "held",
      group: "When it is lying",
      title: "Held, not yet uploaded",
      description:
        "The state every thin MediaRecorder wrapper skips. The bytes exist on this device and nobody else has them; a tick here would be a falsehood about a legal record. The upload resumes by byte range from 62%.",
      code: `<Recorder
  variant="bars"
  phase="held"
  disposition={{ state: "failed", bytes: 14_200_000, sent: 8_900_000, error: "network" }}
/>`,
    },
    {
      id: "disposition",
      group: "When it is lying",
      title: "Where the recording is",
      description:
        "The companion strip, stepped through held, uploading, transcribing, ready and failed. While held there is no progress bar, because nothing is moving and a bar creeping forward would invent it.",
      code: `<RecorderDispositionStrip
  disposition={{ state: "uploading", bytes: 14_200_000, sent: 8_900_000 }}
  durationMs={252_000}
  onRetry={retryUpload}
/>`,
    },

    /* ---------------------------------------------------------------- */
    /* Reviewing a take                                                  */
    /* ---------------------------------------------------------------- */
    {
      id: "duet",
      group: "Reviewing a take",
      title: "Playback with speakers",
      description:
        "The axis carries the speaker, so talk-time balance reads without reading anything. Position is the channel, not colour: the two accents sit within 2:1 in luminance.",
      code: `<Recorder
  variant="duet"
  phase="ready"
  peaks={peaks}
  speakers={speakers}
  position={0.44}
  durationMs={754_000}
  speakerLabels={["Dr Okafor", "Patient"]}
  title="Consultation — 14 Aug, 09:12"
  markers={markers}
/>`,
    },
    {
      id: "duet-no-speakers",
      group: "Reviewing a take",
      title: "Playback without diarisation",
      description:
        "Peaks but no speaker byte: one rail, and it says so. It does not guess — a reader who trusts the axis would read the patient's words as the clinician's.",
      code: `<Recorder variant="duet" phase="ready" peaks={peaks} speakers={null} durationMs={754_000} />`,
    },

    /* ---------------------------------------------------------------- */
    /* Transcript                                                        */
    /* ---------------------------------------------------------------- */
    {
      id: "transcript",
      group: "Transcript",
      title: "Live transcript",
      description:
        "The accessible equivalent of every waveform here. The last token is drawn as a guess because the recogniser may take it back; committing an interim result and then rewriting it loses a clinician in thirty seconds.",
      code: `<Recorder variant="stream" phase="recording" turns={turns} />`,
    },
    {
      id: "stalled",
      group: "Transcript",
      title: "Transcript stalled",
      description:
        "Past four seconds of recogniser lag it says the transcript stalled — and that the audio is still arriving. The recogniser is behind, not the recorder, and the status says which.",
      code: `<Recorder variant="stream" phase="recording" turns={turns} transcriptLagMs={lagMs} />`,
    },
  ],

  dependencies: ["clsx", "tailwind-merge", "@zoblocks/recorder-core"],
  registryDependencies: ["utils", "tokens", "recorder-core"],

  usage: `import { Recorder } from "@/components/zoblocks/recorder";

// Ambient capture. The host owns getUserMedia; the component owns the truth
// about what is arriving.
<Recorder
  variant="bars"
  phase="recording"
  source={analyser}
  device={{ deviceId: "jabra", label: "Jabra Link 380" }}
  expectedDevice={{ deviceId: "jabra", label: "Jabra Link 380" }}
  onFault={(fault) => fault && report(fault.code)}
/>

// Live transcript. Pass the recogniser's lag; past 4 s it says it stalled.
<Recorder variant="stream" phase="recording" turns={turns} transcriptLagMs={lagMs} />

// Reviewing the take. Peaks and speakers come from the ingest sidecar.
<Recorder
  variant="duet"
  phase="ready"
  peaks={peaks}
  speakers={speakers}
  position={0.44}
  durationMs={754_000}
  speakerLabels={["Dr Okafor", "Patient"]}
/>`,
});
