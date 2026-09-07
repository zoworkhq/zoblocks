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
