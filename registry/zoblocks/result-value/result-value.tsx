/**
 * ResultValue — a single observation, rendered so the four ways it can lie are
 * all impossible.
 *
 *     <ResultValue value={potassium} now={serverTime} />
 *     <ResultValue value={fromObservation(observation)} density="compact" />
 *
 * The four failures it exists to prevent, each with the shape that prevents it:
 *
 *   a preliminary result that looks final      → status is always rendered
 *   a rangeless result that looks normal       → "not interpreted", never blank
 *   a correction that replaced what you read   → the superseded value is shown
 *   an absence rendered as an em dash          → seven reasons, seven sentences
 *
 * `now` is a prop, not a clock. A relative time computed at render is
 * untestable, non-deterministic in a screenshot, and on a ward workstation
 * left open all shift it silently ages.
 *
 * Memoised on `(id, versionId)`: a grid of five hundred rows re-renders none of
 * them when a filter changes, and re-renders exactly the one that was
 * corrected.
 *
 * Styling lives in `styles/zoblocks-result-value.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { ClinicalStatus } from "@/components/zoblocks/clinical-status";
import {
  ABSENCE,
  PROVENANCE_LABEL,
  describeElapsed,
  describeResult,
  formatRange,
  resolveDelta,
  resolveInterpretation,
  type ResultValueData,
} from "@/lib/zoblocks-result-value";

export {
  ABSENCE,
  ABSENT_REASONS,
  PROVENANCE_LABEL,
  describeElapsed,
  describeRange,
  describeResult,
  formatRange,
  fromDataAbsentReason,
  fromObservation,
  resolveDelta,
  resolveInterpretation,
  type ResultAbsence,
  type Interpretation,
  type PriorValue,
  type Provenance,
  type ReferenceRange,
  type ResultValueData,
} from "@/lib/zoblocks-result-value";

export interface ResultValueProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * The result itself, already adapted from FHIR. Use `fromObservation()` rather than building
   * it by hand — the adapter leaves undefined everything it cannot determine, which is what
   * keeps a missing range from becoming an assumed one.
   */
  value: ResultValueData;
  /**
   * ISO 8601, supplied by the host.
   *
   * Without it no relative time is rendered at all — which is correct. A
   * result with no age is less misleading than one whose age is wrong.
   */
  now?: string;
  /** Row height and type scale. Inherited from the nearest density provider when omitted. */
  density?: "compact" | "default";
  /** Hides the analyte name, for a grid whose column header already carries it. */
  hideAnalyte?: boolean;
  /** Opens the specimen chain. Makes the value a button; inert without it. */
  onOpenReport?: (value: ResultValueData) => void;
}

function ResultValueImpl({
  value: data,
  now,
  density = "default",
  hideAnalyte = false,
  onOpenReport,
  className,
  ...rest
}: ResultValueProps) {
  const interpretation = resolveInterpretation(data);
  const delta = resolveDelta(data);
  const range = formatRange(data.range);
  const sentence = describeResult(data, now);

  /*
   * One accessible name for the whole thing, and everything inside hidden
   * from the tree.
   *
   * The alternative is six labelled nodes, which a screen reader reads as six
   * fragments with pauses between them — and the clinical meaning of a result
   * is in the *combination*: 6.8 is unremarkable until you hear the unit, the
   * range and the word "critical" in the same breath.
   */
  const shell = {
    className: cn("zb-rv", className),
    "data-zb-result": "",
    "data-zb-density": density,
    "data-zb-absent": data.absent ?? undefined,
    "data-zb-interpretation": interpretation?.step ?? undefined,
    "data-zb-status": data.status ?? undefined,
    "aria-label": sentence,
    ...rest,
  };

  const body = data.absent ? <Absent data={data} /> : <Present data={data} />;

  const qualifiers = (
    <>
      {/* The range, or the explicit absence of one. Never nothing: a number
          with nothing beside it reads as in range, and that is the second of
          the four failures. */}
      {range ? (
        <span className="zb-rv__range">
          {range}
          {data.range?.appliesTo ? (
            <span className="zb-rv__applies"> {data.range.appliesTo}</span>
          ) : null}
        </span>
      ) : data.noRangeReason ? (
        <span className="zb-rv__range" data-zb-norange="">
          {data.noRangeReason}
        </span>
      ) : null}

      {data.status ? (
        <ClinicalStatus
          scale="result-status"
          step={data.status}
          shape="chip"
          density="compact"
          aria-hidden="true"
        />
      ) : null}

      {data.provenance && data.provenance !== "lab" ? (
        <span className="zb-rv__provenance" data-zb-provenance={data.provenance}>
          {PROVENANCE_LABEL[data.provenance]}
        </span>
      ) : null}

      {now && data.resultedAt ? <Age at={data.resultedAt} now={now} /> : null}

      {(data.notes ?? []).map((note) => (
        <span key={note} className="zb-rv__note">
          {note}
        </span>
      ))}
    </>
  );

  const content = (
    <>
      <span className="zb-rv__line" aria-hidden="true">
        {hideAnalyte ? null : <span className="zb-rv__analyte">{data.analyte}</span>}
        {body}
        {interpretation && !data.absent ? (
          <ClinicalStatus
            scale="criticality"
            step={interpretation.step}
            shape="chip"
            density="compact"
            aria-hidden="true"
          />
        ) : null}
        {delta && delta.direction !== "flat" ? (
          <span className="zb-rv__delta" data-zb-direction={delta.direction}>
            {delta.direction === "up" ? "▲" : "▼"} {Math.abs(delta.change)}
            <span className="zb-rv__delta-since"> / {describeElapsed(delta.sinceMs)}</span>
          </span>
        ) : null}
      </span>

      {/*
        The superseded value, struck through, with when it changed.
        Not a badge saying "corrected": the hazard is the clinician's memory of
        the old number, and a badge does not address it. Showing the old number
        with a line through it does.
      */}
      {data.superseded ? (
        <span className="zb-rv__superseded" aria-hidden="true">
          <s>{data.superseded.value}</s> superseded {data.superseded.at}
        </span>
      ) : null}

      <span className="zb-rv__qualifiers" aria-hidden="true">
        {qualifiers}
      </span>
    </>
  );

  if (onOpenReport) {
    return (
      <button
        {...(shell as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        type="button"
        onClick={() => onOpenReport(data)}
      >
        {content}
      </button>
    );
  }

  // `role="group"` with a label rather than a focusable div: there is nothing
  // to activate, so there must be no tab stop.
  return (
    <div {...(shell as React.HTMLAttributes<HTMLDivElement>)} role="group">
      {content}
    </div>
  );
}

function Present({ data }: { data: ResultValueData }) {
  return (
    <span className="zb-rv__value">
      {data.comparator ? <span className="zb-rv__comparator">{data.comparator}</span> : null}
      <span className="zb-rv__number">{data.value}</span>
      {data.unit ? <span className="zb-rv__unit">{data.unit}</span> : null}
    </span>
  );
}

/**
 * Absence, in the slot the number would occupy.
 *
 * A word and a sentence, never an em dash — which is indistinguishable from a
 * rendering bug, and which asks the reader to guess between "nobody ordered
 * it", "the specimen haemolysed" and "you are not allowed to see it".
 */
function Absent({ data }: { data: ResultValueData }) {
  // Only ever rendered when `absent` is set; the guard keeps that true at the
  // type level rather than by assertion.
  if (!data.absent) return null;
  const copy = ABSENCE[data.absent];
  return (
    <span className="zb-rv__value" data-zb-absent-value="">
      <span className="zb-rv__absent-word">{copy.short}</span>
      <span className="zb-rv__absent-detail">{data.absentDetail ?? copy.detail}</span>
    </span>
  );
}

function Age({ at, now }: { at: string; now: string }) {
  const elapsed = Date.parse(now) - Date.parse(at);
  if (!Number.isFinite(elapsed) || elapsed < 0) return null;
  return <span className="zb-rv__age">{describeElapsed(elapsed)} ago</span>;
}

/**
 * Memoised on identity and version.
 *
 * A results grid re-renders on every filter keystroke, and each row does range
 * arithmetic, delta arithmetic and sentence composition. Comparing the whole
 * object would defeat that — hosts rebuild these from a query response, so the
 * reference changes every time even when nothing did. `versionId` is the
 * field that actually moves when the record does.
 */
export const ResultValue = React.memo(ResultValueImpl, (a, b) => {
  return (
    a.value.id === b.value.id &&
    a.value.versionId === b.value.versionId &&
    a.now === b.now &&
    a.density === b.density &&
    a.hideAnalyte === b.hideAnalyte &&
    a.onOpenReport === b.onOpenReport &&
    a.className === b.className
  );
});

ResultValue.displayName = "ResultValue";
