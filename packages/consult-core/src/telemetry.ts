/**
 * Telemetry events, and the metric that must not become the north star.
 *
 * For a consumer chat product, more messages is better. For this component it
 * is ambiguous at best: a clinician sending forty messages a shift may be
 * getting enormous value, or may have been pulled into a tool that is now the
 * work rather than a help with it. So the events below are deliberately shaped
 * around **verification and completion**, not volume, and the one number worth
 * watching is `verification-rate` — the share of answers where someone opened
 * the sources.
 *
 * A falling verification rate is the automation-bias early warning. It is the
 * single most important signal this component can emit, and it is the reason
 * `sources-opened` exists as a first-class event rather than a generic
 * interaction ping.
 *
 * Consult emits and stores nothing. The host routes these wherever its
 * analytics already live.
 */

import type { AnswerRegister } from "./answer.js";
import type { CrisisAudience, CrisisSeverity, InjectionSeverity } from "./safety/index.js";

export type TelemetryEvent =
  | { readonly type: "submitted"; readonly exchangeId: string; readonly modeId: string }
  | {
      readonly type: "first-token";
      readonly exchangeId: string;
      readonly modeId: string;
      readonly at: string;
    }
  | {
      readonly type: "answered";
      readonly exchangeId: string;
      readonly modeId: string;
      readonly register: AnswerRegister;
      readonly sourceCount: number;
      readonly findingCount: number;
    }
  /**
   * The verification signal. Emitted when the sources drawer opens, with the
   * time it took to get there — Law 2 made measurable. If `msToOpen` climbs,
   * the drawer has regressed and acceptance will follow.
   */
  | {
      readonly type: "sources-opened";
      readonly exchangeId: string;
      readonly msToOpen: number;
      readonly sourceCount: number;
    }
  | {
      readonly type: "refused";
      readonly exchangeId: string;
      readonly modeId: string;
      readonly reason: string;
    }
  | {
      readonly type: "crisis";
      readonly exchangeId: string;
      readonly modeId: string;
      readonly severity: CrisisSeverity;
      readonly audience: CrisisAudience;
    }
  | {
      readonly type: "injection";
      readonly exchangeId: string;
      readonly modeId: string;
      readonly severity: InjectionSeverity;
      readonly rules: readonly string[];
    }
  | {
      readonly type: "tool-blocked";
      readonly exchangeId: string;
      readonly modeId: string;
      readonly tool: string;
      readonly reason: string;
    }
  | { readonly type: "stopped"; readonly exchangeId: string; readonly modeId: string }
  /** Abandonment after the answer began. The answer started badly. */
  | { readonly type: "abandoned"; readonly exchangeId: string; readonly afterMs: number }
  /**
   * Confirmation dwell. A median under two seconds means the confirm step has
   * become theatre — it is laundering the model's output as human judgement
   * while adding no scrutiny, which is worse than having no step at all.
   */
  | {
      readonly type: "proposal-confirmed";
      readonly exchangeId: string;
      readonly dwellMs: number;
      readonly reflexive: boolean;
    }
  | { readonly type: "proposal-dismissed"; readonly exchangeId: string }
  | {
      readonly type: "feedback";
      readonly exchangeId: string;
      readonly rating: "up" | "down";
      readonly reason?: FeedbackReason;
    }
  | { readonly type: "audit-failed"; readonly exchangeId: string; readonly cause: unknown };

/**
 * Structured feedback options.
 *
 * Free-text thumbs are worthless — nobody types, and the ones who do write
 * "bad". A closed list is analysable on day one, and each of these maps to a
 * different fix: `unsafe` is a stop-ship, `outdated` is a corpus problem,
 * `no-source` is a retrieval problem, `wrong` is a model problem.
 */
export type FeedbackReason =
  | "wrong"
  | "outdated"
  | "not-relevant"
  | "unsafe"
  | "no-source"
  | "too-long";

export type TelemetrySink = (event: TelemetryEvent) => void;

/**
 * Roll a stream of events into the numbers §17 says to watch.
 *
 * Lives here rather than in a dashboard because the definitions should be
 * versioned with the component. Two teams computing "verification rate"
 * differently is how a safety metric quietly stops meaning anything.
 */
export interface TelemetrySummary {
  readonly answered: number;
  readonly sourcesOpened: number;
  /** The number to watch. Falling means rising automation bias. */
  readonly verificationRate: number;
  readonly refusalRate: number;
  readonly groundedRate: number;
  readonly medianConfirmDwellMs: number | null;
  readonly reflexiveConfirmRate: number;
  readonly crises: number;
}

export function summarise(events: readonly TelemetryEvent[]): TelemetrySummary {
  const answered = events.filter((e) => e.type === "answered").length;
  const submitted = events.filter((e) => e.type === "submitted").length;
  const refused = events.filter((e) => e.type === "refused").length;
  const sourcesOpened = events.filter((e) => e.type === "sources-opened").length;
  const grounded = events.filter(
    (e): e is Extract<TelemetryEvent, { type: "answered" }> =>
      e.type === "answered" && e.register === "grounded",
  ).length;
  const confirms = events.filter(
    (e): e is Extract<TelemetryEvent, { type: "proposal-confirmed" }> =>
      e.type === "proposal-confirmed",
  );

  const dwells = confirms.map((c) => c.dwellMs).sort((a, b) => a - b);
  const medianConfirmDwellMs = dwells.length === 0 ? null : median(dwells);

  return {
    answered,
    sourcesOpened,
    verificationRate: answered === 0 ? 0 : sourcesOpened / answered,
    refusalRate: submitted === 0 ? 0 : refused / submitted,
    groundedRate: answered === 0 ? 0 : grounded / answered,
    medianConfirmDwellMs,
    reflexiveConfirmRate:
      confirms.length === 0 ? 0 : confirms.filter((c) => c.reflexive).length / confirms.length,
    crises: events.filter((e) => e.type === "crisis").length,
  };
}

function median(sorted: readonly number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}
