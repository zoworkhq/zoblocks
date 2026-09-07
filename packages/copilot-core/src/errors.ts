/**
 * Errors, as a closed union rather than thrown strings.
 *
 * Every one of these has a designed UI state behind it — ZoBlocks's DESIGN.md
 * requires loading, empty, error, offline, permission-denied and restricted to
 * each be a decision rather than a default. A union is what lets the skin prove
 * it handled all of them: add a member here and every `switch` that renders one
 * fails to compile until it is addressed.
 */

export type CopilotErrorCode =
  /** Transport failed — offline, DNS, TLS, timeout. Retryable. */
  | "network"
  /** The endpoint answered, unhappily. Retryable depending on status. */
  | "provider"
  /** The user or the host aborted. Not an error state in the UI; a stop. */
  | "aborted"
  /** The caller is not permitted to use this mode or reach this data. */
  | "permission-denied"
  /** Context resolution failed. The answer would have been built on sand. */
  | "context-unavailable"
  /**
   * The configuration is wrong in a way that would leak PHI. Never retried,
   * never degraded — see `assembleRequest`.
   */
  | "phi-not-permitted"
  /** The mode declined the question. Carries the reason and a suggestion. */
  | "out-of-scope"
  /** The provider produced something the output contract forbids. */
  | "contract-violation";

export interface CopilotError {
  readonly code: CopilotErrorCode;
  /** Operator-facing. Never rendered to a clinician verbatim. */
  readonly message: string;
  /**
   * Whether a retry could plausibly succeed. The UI uses this to decide
   * between offering "Try again" and offering a way out.
   */
  readonly retryable: boolean;
  /** For `out-of-scope`: the mode that would have accepted the question. */
  readonly suggestedModeId?: string;
  readonly cause?: unknown;
}

export function copilotError(
  code: CopilotErrorCode,
  message: string,
  extra: Partial<Omit<CopilotError, "code" | "message">> = {},
): CopilotError {
  const retryable = extra.retryable ?? (code === "network" || code === "provider");
  return { code, message, retryable, ...extra };
}

/**
 * The one error this package throws rather than returns.
 *
 * Everything else is data, because everything else has a UI state. A PHI
 * misconfiguration has no UI state on purpose: there is no version of "we
 * nearly sent this patient's record to an uncovered endpoint" that a clinician
 * should be asked to acknowledge. It is a programming error and it should stop
 * the process in development.
 */
export class PhiNotPermittedError extends Error {
  readonly code = "phi-not-permitted" as const;
  constructor(readonly providerId: string) {
    super(
      `Provider "${providerId}" is not marked phiPermitted, and this mode reads patient ` +
        `data. Either set phiPermitted on a provider whose endpoint is covered by a BAA, ` +
        `or use a mode that declares no reads.`,
    );
    this.name = "PhiNotPermittedError";
  }
}
