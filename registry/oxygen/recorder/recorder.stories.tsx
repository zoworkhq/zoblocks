/**
 * Stories for Recorder.
 *
 * Written once, consumed four ways (ADR 0007): documentation, the
 * visual-regression fixture, the accessibility fixture, and — through play
 * functions — the interaction test.
 *
 * `parameters.state` ties each story to a state declared in recorder.meta.ts,
 * and the build asserts the two agree in both directions. Every story below is
 * deliberately driven by props rather than by a live microphone: an analyser is
 * not available in a VRT run, and a story that needed one would either be
 * skipped or would quietly become the timer-driven waveform this component
 * exists to argue against.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, within } from "../../../test/story-kit";
import { Recorder } from "./recorder";

const JABRA = { deviceId: "jabra", label: "Jabra Link 380" };
const BUILTIN = { deviceId: "builtin", label: "MacBook Pro Microphone" };

/** A deterministic take, so the VRT baseline does not move between runs. */
const TAKE_N = 180;
const PEAKS = Float32Array.from({ length: TAKE_N }, (_, i) => {
  const t = i / 12;
  const phrase = (t % 3.9) / 3.9 < 0.82 ? 1 : 0.06;
  const syllable = 0.5 + 0.5 * Math.sin(2 * Math.PI * 4.4 * t);
  return Math.min(1, phrase * (0.2 + 0.8 * syllable ** 1.3));
});
const SPEAKERS = Uint8Array.from({ length: TAKE_N }, (_, i) =>
  Math.floor(i / 26) % 2 === 0 ? 0 : 1,
);

const MARKERS = [
  { id: "exam", at: 0.31, label: "Exam" },
  { id: "plan", at: 0.58, label: "Plan" },
  { id: "struck", at: 0.79, label: "Struck 0:22", struck: true, span: 0.03 },
];

const TURNS = [
  { id: "1", speaker: "Dr Okafor", words: "And how long has the breathlessness been going on for" },
  { id: "2", speaker: "Patient", words: "Maybe three weeks now It is worse going up the stairs" },
  { id: "3", speaker: "Patient", words: "I have to stop halfway which I", interim: "never" },
];

const meta: Meta<typeof Recorder> = {
  title: "Media/Recorder",
  component: Recorder,
  args: { label: "Encounter recorder", device: JABRA, expectedDevice: JABRA },
};

export default meta;
type Story = StoryObj<typeof Recorder>;

export const Recording: Story = {
  name: "Recording",
  parameters: { state: "Recording" },
  args: {
    variant: "bars",
    phase: "recording",
    context: "Encounter · Room 4",
    onPause: () => {},
    onStop: () => {},
  },
  play: async ({ canvasElement }) => {
    // The device name is rendered permanently rather than behind a hover:
    // §11 row 7 is the one fault with no signal-level defence at all. It shares
    // a line with the context and the level, so match the line.
    const line = canvasElement.querySelector(".ox-rec-meta");
    await expect(line?.textContent).toContain(JABRA.label);
  },
};

export const AwaitingConsent: Story = {
  name: "Armed, awaiting consent",
  parameters: { state: "Armed, awaiting consent" },
  args: { variant: "bars", phase: "armed", consent: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // `armed` is not `idle`, and recording is unreachable from it until a
    // basis is recorded. The engine enforces the edge; this proves the
    // surface states it.
    await expect(canvas.getByText(/Consent not recorded/i)).toBeInTheDocument();
  },
};

export const MicrophoneMuted: Story = {
  name: "Microphone muted",
  parameters: { state: "Microphone muted" },
  args: {
    variant: "bars",
    phase: "recording",
    device: BUILTIN,
    expectedDevice: JABRA,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Recording from the wrong device sounds entirely plausible, so the fault
    // is named rather than left to the waveform.
    await expect(canvas.getByRole("alert")).toBeInTheDocument();
  },
};

export const DeviceLost: Story = {
  name: "Device lost",
  parameters: { state: "Device lost" },
  args: { variant: "bars", phase: "held", device: JABRA, expectedDevice: JABRA },
};

export const Held: Story = {
  name: "Held, not yet uploaded",
  parameters: { state: "Held, not yet uploaded" },
  args: {
    variant: "bars",
    phase: "held",
    disposition: { state: "failed", bytes: 14_200_000, sent: 8_900_000, error: "network" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Resumable by byte range: a 14 MB re-upload on a clinic connection is a
    // minute nobody has.
    await expect(canvas.getByText(/62%/)).toBeInTheDocument();
  },
};

export const PlaybackWithSpeakers: Story = {
  name: "Playback with speakers",
  parameters: { state: "Playback with speakers" },
  args: {
    variant: "duet",
    phase: "ready",
    peaks: PEAKS,
    speakers: SPEAKERS,
    position: 0.44,
    durationMs: 754_000,
    speakerLabels: ["Dr Okafor", "Patient"],
    title: "Consultation — 14 Aug, 09:12",
    markers: MARKERS,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Talk-time balance is free, because the diarisation is already in the take.
    await expect(canvas.getByText(/%\s*\/\s*\d+%/)).toBeInTheDocument();
  },
};

export const PlaybackWithoutDiarisation: Story = {
  name: "Playback without diarisation",
  parameters: { state: "Playback without diarisation" },
  args: {
    variant: "duet",
    phase: "ready",
    peaks: PEAKS,
    speakers: null,
    position: 0.3,
    durationMs: 754_000,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A wrongly attributed rail is worse than no attribution, so it collapses
    // to one rail and says so rather than guessing.
    await expect(canvas.getByText(/no diarisation/i)).toBeInTheDocument();
  },
};

export const LiveTranscript: Story = {
  name: "Live transcript",
  parameters: { state: "Live transcript" },
  args: { variant: "stream", phase: "recording", turns: TURNS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // An interim token is a guess the recogniser may take back, and is drawn
    // as one. Committing it and then rewriting it is how a transcript loses a
    // clinician in the first thirty seconds.
    await expect(canvas.getByText("never")).toBeInTheDocument();
  },
};

export const InlineDictation: Story = {
  name: "Inline dictation",
  parameters: { state: "Inline dictation" },
  args: {
    variant: "strip",
    phase: "recording",
    context: "History of presenting complaint",
    onSend: () => {},
  },
};

export const SingleControl: Story = {
  name: "Single control",
  parameters: { state: "Single control" },
  args: { variant: "pulse", phase: "recording" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: /stop recording/i })).toBeInTheDocument();
  },
};
