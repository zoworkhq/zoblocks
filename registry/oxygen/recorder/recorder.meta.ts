import { defineComponentMeta } from "@oxygenui-design/component-meta";

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
    "Record, review and transcribe clinical audio: ambient documentation, dictation, voice messaging and transcript playback. Five arts — pulse, bars, strip, duet and stream — over one engine, with the level meter driven by an AnalyserNode rather than a timer, a silence budget, and thirteen distinct device faults.",
  rationale:
    "Every voice-recorder interface on the web animates on a timer, and in a consulting room that is a failure mode with a victim: an operating-system mute, a Bluetooth profile switch and a silently substituted device all produce frames of digital silence arriving on schedule, and a timer-driven waveform cannot distinguish that from a room where nobody is speaking. This one draws only what the analyser reports, so silence renders at true zero and a muted microphone stops the art dead — and then the surface says which of the thirteen faults it is, because a flat waveform and a quiet room look identical and only one of them costs you the consultation. The engine is a separate zero-dependency package: a team already running wavesurfer should import the model rather than install the renderer.",

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
    "Inline dictation",
    "Single control",
  ],

  a11y: [
    {
      label: "The timer is polled, never pushed",
      detail:
        "role=timer, which is an aria-live=off region by default. Making it polite announces a number every second for twenty minutes, and is the commonest accessibility defect in audio UI.",
    },
    {
      label: "Announced on transitions, not continuously",
      detail:
        "One status region carries phase changes — recording started, paused, held and not yet uploaded — as a single sentence each, with a slow heartbeat between them. Crossing the silence budget is the one assertive announcement, because it is the failure the component exists to prevent.",
    },
    {
      label: "The waveform is hidden; the transcript is the equivalent",
      detail:
        "The art is a picture of a number that is already announced, so it is aria-hidden. Where a transcript exists the stream art renders it alongside rather than instead, and that is what a screen-reader user reads in place of the wave.",
    },
    {
      label: "Motion is replaced by a number, not removed",
      detail:
        "Under reduced motion the scroll stops and the meter does not: translation is what triggers vestibular symptoms, a bar changing height in place does not. A live dBFS readout and a tabular elapsed timer carry what the scroll was carrying. The motion prop is an explicit mechanism, because WCAG 2.2.2's essential exception does not apply once a conforming alternative exists — and the still state is that alternative.",
    },
    {
      label: "Non-text contrast is solved against the pane",
      detail:
        "Played and unplayed fills cannot both reach 3:1 against each other and against the pane on one hue ramp. The unplayed fill is solved against the pane, and the boundary is carried by a region wash and the playhead rather than by fill colour.",
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
    "Requires styles/oxygen-recorder.css, installed with recorder-core. Without it the arts render as unstyled markup.",
  ],
  related: ["pulse-loader", "rhythm-loader", "clinical-note"],

  dependencies: ["clsx", "tailwind-merge", "@oxygenui-design/recorder-core"],
  registryDependencies: ["utils", "tokens", "recorder-core"],

  usage: `import { Recorder } from "@/components/oxygen/recorder";

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
