/**
 * The vocabulary the element shares with the React component.
 *
 * Restated here rather than imported: this package is dependency-free and must
 * stay loadable from a `<script type="module">` with no bundler, no React and
 * no build step. That makes drift the obvious risk, so
 * `test/switch-parity.test.ts` in the repository root asserts that these values
 * are identical to `registry/zoblocks/lib/switch.tsx`'s — the same discipline the
 * loaders package uses for its art constants, which has already caught two
 * divergences.
 */

export type SwitchValue = "on" | "off" | "unknown";

export type CommitPhase =
  "idle" | "pending" | "committed" | "reverted" | "blocked" | "queued" | "stale";

export const COMMIT_PHASES: readonly CommitPhase[] = [
  "idle",
  "pending",
  "committed",
  "reverted",
  "blocked",
  "queued",
  "stale",
];

export type AbsentReason =
  | "unknown"
  | "pending"
  | "not-collected"
  | "declined"
  | "masked"
  | "not-permitted"
  | "not-applicable"
  | "not-performed"
  | "as-text"
  | "error"
  | "unstated";

export const ABSENT_REASON_LABEL: Record<AbsentReason, string> = {
  unknown: "Not known",
  pending: "Result pending",
  "not-collected": "Not asked",
  declined: "Declined to answer",
  masked: "Restricted — not shown",
  "not-permitted": "Not available to you",
  "not-applicable": "Does not apply",
  "not-performed": "Not performed",
  "as-text": "Recorded as text",
  error: "Could not load",
  unstated: "Not recorded",
};

export interface StateLabels {
  on: string;
  off: string;
  unknown: string;
}

export const STATE_LABEL_PRESETS = {
  "on-off": { on: "On", off: "Off", unknown: "Not set" },
  "yes-no": { on: "Yes", off: "No", unknown: "Not asked" },
  "active-inactive": { on: "Active", off: "Inactive", unknown: "Not started" },
  "in-effect": { on: "In effect", off: "Not in effect", unknown: "Not assessed" },
  "allowed-blocked": { on: "Allowed", off: "Blocked", unknown: "Not specified" },
  "given-declined": { on: "Given", off: "Declined", unknown: "Not asked" },
  "enabled-disabled": { on: "Enabled", off: "Disabled", unknown: "Not configured" },
} as const satisfies Record<string, StateLabels>;

export type StateLabelPreset = keyof typeof STATE_LABEL_PRESETS;

export type SwitchSize = "micro" | "small" | "default" | "large";

export const SWITCH_SIZE: Record<SwitchSize, { track: [number, number]; thumb: number }> = {
  micro: { track: [26, 14], thumb: 10 },
  small: { track: [32, 18], thumb: 14 },
  default: { track: [44, 24], thumb: 20 },
  large: { track: [56, 30], thumb: 26 },
};

export type SwitchTone = "affirmative" | "neutral" | "caution" | "critical";

export function wordFor(value: SwitchValue, labels: StateLabels): string {
  if (value === "unknown") return labels.unknown;
  return value === "on" ? labels.on : labels.off;
}

export function resolveStateLabels(
  preset: string | null,
  absentReason: string | null,
): StateLabels {
  const base =
    preset && preset in STATE_LABEL_PRESETS
      ? STATE_LABEL_PRESETS[preset as StateLabelPreset]
      : STATE_LABEL_PRESETS["on-off"];

  if (absentReason && absentReason in ABSENT_REASON_LABEL) {
    return { ...base, unknown: ABSENT_REASON_LABEL[absentReason as AbsentReason] };
  }
  return { ...base };
}

/**
 * What activating the control commits.
 *
 * From `"unknown"` this is `"on"` — the affirmative, because that is the answer
 * somebody is recording. There is no path back: re-entering `"unknown"` would
 * be un-asking a question, and the correction for a wrong answer is a new
 * answer with a provenance, not an erasure.
 */
export function nextValueFor(current: SwitchValue): "on" | "off" {
  return current === "on" ? "off" : "on";
}
