// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/risk-indicator/risk-indicator.tsx. Edit that file, not this one.
/**
 * RiskIndicator — a risk score that cannot be displayed without its date, its
 * drivers, and the fact that it is not a diagnosis.
 *
 *     <RiskIndicator
 *       assessment={readmission}
 *       now={serverTime}
 *       notADiagnosis="A statistical estimate, not a diagnosis."
 *     />
 *
 * The band leads and the numeral is demoted: two decimal places imply a
 * precision the model does not have. Staleness is on the face rather than in a
 * tooltip, because a score computed nightly and read at noon — after the
 * admission that would have changed it — is the failure nobody sees.
 *
 * `notADiagnosis` is a required prop rather than a convention. Every product
 * that made it optional shipped without it.
 *
 * Styling lives in `styles/oxygen-risk.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import { ClinicalStatus } from "../../components/clinical-status/clinical-status";
import {
  BAND_STEP,
  concentration,
  describeAge,
  describeRisk,
  driverDirection,
  freshness,
  ordinal,
  topDrivers,
  type RiskAssessment,
  type RiskDriver,
} from "../../lib/risk";

export {
  BAND_LABEL,
  BAND_STEP,
  concentration,
  describeAge,
  describeRisk,
  driverDirection,
  freshness,
  fromRiskAssessment,
  ordinal,
  toBand,
  topDrivers,
  type Freshness,
  type RiskAssessment,
  type RiskAssessmentInput,
  type RiskBand,
  type RiskDriver,
} from "../../lib/risk";

export interface RiskIndicatorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * The RiskAssessment, with its drivers and the date it was computed. A score cannot render
   * without them — it is a statistical estimate, not a diagnosis, and undated it is not even
   * that.
   */
  assessment: RiskAssessment;
  /** ISO 8601, supplied by the host. The component never reads a clock. */
  now: string;
  /**
   * The framing, and it is required.
   *
   * Not a default string either: what a score is not depends on what it is —
   * a readmission model and a suicide-risk model need different sentences, and
   * a shared one would be wrong for both.
   */
  notADiagnosis: string;
  /** How many drivers to show on the face. The rest live in the explanation. */
  driverCount?: number;
  /** Row height and type scale. Inherited from the nearest density provider when omitted. */
  density?: "compact" | "default";
  /** Opens the model card. See the DSI source-attribute record. */
  onOpenModel?: (assessment: RiskAssessment) => void;
  /**
   * Acknowledges an expired score.
   *
   * A stale score cannot be dismissed — only recomputed or acknowledged — and
   * the acknowledgement is the host's to record.
   */
  onAcknowledge?: (assessment: RiskAssessment) => void;
  /**
   * Fired when the reader asks for a fresh score. Without it a stale score says it is stale
   * and offers nothing to do about it.
   */
  onRecompute?: (assessment: RiskAssessment) => void;
}

export const RiskIndicator = React.forwardRef<HTMLDivElement, RiskIndicatorProps>(
  function RiskIndicator(
    {
      assessment,
      now,
      notADiagnosis,
      driverCount = 4,
      density = "default",
      onOpenModel,
      onAcknowledge,
      onRecompute,
      className,
      ...rest
    },
    ref,
  ) {
    const fresh = freshness(assessment, now);
    const drivers = topDrivers(assessment.drivers ?? [], driverCount);
    const dominant = concentration(assessment.drivers ?? []);
    const scored = assessment.band !== "unknown";

    return (
      <div
        {...rest}
        ref={ref}
        className={cn("ox-risk", className)}
        data-ox-risk=""
        data-ox-band={assessment.band}
        data-ox-freshness={fresh.state}
        data-ox-density={density}
        role="group"
        aria-label={describeRisk(assessment, now, notADiagnosis, driverCount)}
      >
        <div className="ox-risk__head" aria-hidden="true">
          <span className="ox-risk__outcome">{assessment.outcome}</span>
          <ClinicalStatus
            scale="risk"
            step={BAND_STEP[assessment.band]}
            density="compact"
            aria-hidden="true"
          />
        </div>

        {scored ? (
          <div className="ox-risk__figures" aria-hidden="true">
            {/*
              The numeral is demoted, not hidden. Two decimal places imply a
              precision the model does not have, so it is rounded to a whole
              per cent and set below the band rather than beside it.
            */}
            {typeof assessment.probability === "number" ? (
              <span className="ox-risk__probability">
                {Math.round(assessment.probability * 100)}
                <span className="ox-risk__unit">%</span>
              </span>
            ) : null}

            {/*
              A percentile is never rendered without the cohort it is a
              percentile of. "94th percentile" of an unnamed population reads
              as "94th percentile of people like this patient", which is a
              claim nobody made.
            */}
            {typeof assessment.percentile === "number" && assessment.cohort ? (
              <span className="ox-risk__percentile">
                {ordinal(assessment.percentile)} pct · {assessment.cohort}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="ox-risk__unscored" aria-hidden="true">
            The model could not score this patient. This is not a low score.
          </p>
        )}

        {drivers.length ? <Drivers drivers={drivers} dominant={dominant} /> : null}

        {/*
          Staleness on the face, never in a tooltip.
          Computed nightly, read at noon, after the admission that would have
          changed it — and nobody hovered.
        */}
        {/*
          Not aria-hidden as a whole: it holds the model button.
          Hiding a container hides everything focusable inside it, which is
          both an axe violation and a button nobody can reach.
        */}
        <div className="ox-risk__foot">
          <span className="ox-risk__age" data-ox-freshness={fresh.state} aria-hidden="true">
            {fresh.state === "expired"
              ? `Expired ${describeAge(fresh.expiredForMs)} ago`
              : `Computed ${describeAge(fresh.ageMs)} ago`}
          </span>

          {assessment.model ? (
            onOpenModel ? (
              <button
                type="button"
                className="ox-risk__model"
                onClick={() => onOpenModel(assessment)}
              >
                {assessment.model.name}
                {typeof assessment.model.auc === "number" ? ` · AUC ${assessment.model.auc}` : ""}
              </button>
            ) : (
              <span className="ox-risk__model" data-ox-static="">
                {assessment.model.name}
                {typeof assessment.model.auc === "number" ? ` · AUC ${assessment.model.auc}` : ""}
              </span>
            )
          ) : null}
        </div>

        {/*
          An expired score offers two ways out and no third.
          Dismissal is not one of them: a score somebody waved away is a score
          that stays on the panel looking current.
        */}
        {fresh.state === "expired" && (onRecompute || onAcknowledge) ? (
          <div className="ox-risk__expired">
            {onRecompute ? (
              <button
                type="button"
                className="ox-risk__action"
                onClick={() => onRecompute(assessment)}
              >
                Recompute
              </button>
            ) : null}
            {onAcknowledge ? (
              <button
                type="button"
                className="ox-risk__action"
                data-ox-secondary=""
                onClick={() => onAcknowledge(assessment)}
              >
                Acknowledge as expired
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Last on the face and last in the spoken sentence: put first it is
            boilerplate a reader skips. */}
        <p className="ox-risk__framing" aria-hidden="true">
          {notADiagnosis}
        </p>
      </div>
    );
  },
);

/**
 * The drivers, with direction and weight.
 *
 * Weights are the model's own units and are never normalised across models —
 * rescaling somebody else's attributions to fit a bar is how a driver
 * contributing 11.2 and one contributing 0.4 end up looking comparable. The
 * bar is scaled within *this* set only, which is a comparison the data
 * supports.
 */
function Drivers({ drivers, dominant }: { drivers: RiskDriver[]; dominant: number | null }) {
  const widest = Math.max(...drivers.map((d) => Math.abs(d.weight)), 1);
  const weighted = drivers.some((d) => d.weight !== 0);

  return (
    <div className="ox-risk__drivers" aria-hidden="true">
      <p className="ox-risk__drivers-title">Top drivers</p>
      <ul className="ox-risk__driver-list">
        {drivers.map((driver) => (
          <li
            key={driver.label}
            className="ox-risk__driver"
            data-ox-direction={driverDirection(driver)}
          >
            <span className="ox-risk__driver-label">{driver.label}</span>
            {weighted ? (
              <>
                <span className="ox-risk__driver-bar">
                  <span
                    className="ox-risk__driver-fill"
                    style={{ inlineSize: `${(Math.abs(driver.weight) / widest) * 100}%` }}
                  />
                </span>
                <span className="ox-risk__driver-weight">
                  {driver.weight > 0 ? "+" : ""}
                  {driver.weight}
                </span>
              </>
            ) : (
              // `basis` from a FHIR RiskAssessment names references with no
              // weights. Drawing a bar for them would be inventing one.
              <span className="ox-risk__driver-weight" data-ox-unweighted="">
                contributing
              </span>
            )}
          </li>
        ))}
      </ul>

      {/*
        The number that says whether this is a synthesis or a proxy.
        A model whose top driver is most of the total is not modelling a
        patient; it is reporting one event, and the clinician should know which.
      */}
      {dominant !== null && dominant >= 0.5 ? (
        <p className="ox-risk__concentration">
          {Math.round(dominant * 100)}% of this score comes from one factor.
        </p>
      ) : null}
    </div>
  );
}
