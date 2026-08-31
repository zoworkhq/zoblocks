/**
 * AllergyChip — the chip that refuses to conflate how bad the last reaction
 * was with how bad the next one could be.
 *
 *     <AllergyChip record={penicillin} />
 *     <AllergyList records={records} noneKnown={assertion} />
 *
 * Substance first and at full weight. Criticality — future risk — as the
 * primary signal. The worst past reaction as secondary text, never as the
 * headline, because leading with it is the mistake the component exists to
 * correct: a patient whose only documented reaction was mild urticaria can
 * still be high criticality, and that is the whole reason the field exists.
 *
 * `AllergyList` carries the other half. "No known allergies" is a positive
 * clinical finding with an author and a date; "nobody asked" is an absence.
 * They look nothing alike here, and an assertion missing its author degrades
 * to the second — because an empty list beside a prescribing button is a claim
 * the software has not earned.
 *
 * Styling lives in `styles/oxygen-allergy.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { ClinicalStatus } from "@/components/oxygen/clinical-status";
import {
  KIND_LABEL,
  NOT_ASKED_SENTENCE,
  SEVERITY_LABEL,
  VERIFICATION_LABEL,
  describeAllergy,
  describeNoKnown,
  isActive,
  resolveListState,
  worstReaction,
  type AllergyRecord,
  type ClassExpander,
  type Criticality,
  type NoKnownAllergies,
} from "@/lib/oxygen-allergy";

export {
  CRITICALITY_LABEL,
  INACTIVE_VERIFICATIONS,
  KIND_LABEL,
  NOT_ASKED_SENTENCE,
  NO_KNOWN_ALLERGY_CODES,
  SEVERITY_LABEL,
  VERIFICATION_LABEL,
  describeAllergy,
  describeNoKnown,
  fromAllergyIntolerance,
  isActive,
  noKnownFromFHIR,
  resolveListState,
  toKind,
  toVerification,
  worstReaction,
  type AllergyKind,
  type AllergyListState,
  type AllergyRecord,
  type ClassExpander,
  type Criticality,
  type NoKnownAllergies,
  type Reaction,
  type ReactionSeverity,
  type Verification,
} from "@/lib/oxygen-allergy";

/** Criticality maps onto the shared vocabulary so the shape agrees library-wide. */
const CRITICALITY_STEP: Record<Criticality, string> = {
  high: "critical",
  low: "moderate",
  "unable-to-assess": "not-assessed",
};

export interface AllergyChipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * The AllergyIntolerance, already adapted. Carries `criticality` and `reaction.severity`
   * separately, because they mean opposite things and merging them is the defect this
   * component exists to prevent.
   */
  record: AllergyRecord;
  /** Row height and type scale. Inherited from the nearest density provider when omitted. */
  density?: "compact" | "default";
  /** Expands a substance into the class it implicates. Injected, never bundled. */
  expandClass?: ClassExpander;
  /** Opens the reaction history, asserter and source. */
  onOpenDetail?: (record: AllergyRecord) => void;
}

export const AllergyChip = React.forwardRef<HTMLElement, AllergyChipProps>(function AllergyChip(
  { record, density = "default", expandClass, onOpenDetail, className, ...rest },
  ref,
) {
  const worst = worstReaction(record);
  const expansion = expandClass?.(record.substance) ?? null;
  const active = isActive(record.verification);

  const shell = {
    className: cn("ox-allergy", className),
    "data-ox-allergy": "",
    "data-ox-kind": record.kind,
    "data-ox-criticality": record.criticality ?? undefined,
    "data-ox-verification": record.verification ?? undefined,
    "data-ox-density": density,
    // Refuted and entered-in-error are not warnings any more, and the record
    // has to keep saying so rather than being deleted — a refuted allergy that
    // vanishes gets re-reported at the next intake.
    "data-ox-inactive": active ? undefined : "",
    "aria-label": describeAllergy(record),
    ...rest,
  };

  const content = (
    <>
      <span className="ox-allergy__head" aria-hidden="true">
        <span className="ox-allergy__substance">{record.substance}</span>
        {record.kind !== "allergy" ? (
          <span className="ox-allergy__kind">{KIND_LABEL[record.kind]}</span>
        ) : null}
        {expansion ? (
          <span className="ox-allergy__class">
            Class: {expansion.label} · {expansion.count} members
          </span>
        ) : null}
      </span>

      <span className="ox-allergy__signals" aria-hidden="true">
        {/*
          Future risk, as the primary signal and with a shape.
          The two fields are rendered as different things on purpose: a chip
          for what could happen, plain text for what did.
        */}
        {record.criticality ? (
          <ClinicalStatus
            scale="criticality"
            step={CRITICALITY_STEP[record.criticality]}
            density="compact"
            aria-hidden="true"
          />
        ) : null}

        {record.verification ? (
          <span className="ox-allergy__verification">
            {VERIFICATION_LABEL[record.verification]}
          </span>
        ) : null}
      </span>

      {/*
        The past, as secondary text. Never the headline.
        "Urticaria — mild, 1998" beside "High criticality" reads as a
        contradiction only until you know the two fields answer different
        questions, which is why both are always present when both are known.
      */}
      <span className="ox-allergy__past" aria-hidden="true">
        {worst ? (
          <>
            <span className="ox-allergy__manifestation">{worst.manifestation}</span>
            {worst.severity ? (
              <span className="ox-allergy__severity" data-ox-severity={worst.severity}>
                {SEVERITY_LABEL[worst.severity]}
              </span>
            ) : null}
            {worst.onset ? <span className="ox-allergy__when">{worst.onset}</span> : null}
            {worst.note ? <span className="ox-allergy__when">{worst.note}</span> : null}
          </>
        ) : record.criticality ? (
          <span className="ox-allergy__manifestation" data-ox-none="">
            No reaction recorded
          </span>
        ) : null}
        {record.note ? <span className="ox-allergy__when">{record.note}</span> : null}
      </span>
    </>
  );

  if (onOpenDetail) {
    return (
      <button
        {...(shell as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={() => onOpenDetail(record)}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      {...(shell as React.HTMLAttributes<HTMLDivElement>)}
      ref={ref as React.Ref<HTMLDivElement>}
      role="group"
    >
      {content}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* The list, and its two empty states                                  */
/* ------------------------------------------------------------------ */

export interface AllergyListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * The allergies, in the order they should be read. An empty array and a `null` mean
   * different things — see `askLabel`.
   */
  records?: readonly AllergyRecord[];
  /**
   * A no-known-allergies assertion.
   *
   * Requires both an asserter and a date. Supplying one without the other
   * renders not-asked, because an unattributed assertion of absence is not an
   * assertion — and it is the one that gets prescribed against.
   */
  noneKnown?: Partial<NoKnownAllergies>;
  /** Row height and type scale. Inherited from the nearest density provider when omitted. */
  density?: "compact" | "default";
  expandClass?: ClassExpander;
  onOpenDetail?: (record: AllergyRecord) => void;
  /** Rendered inside the not-asked state. "Ask and record", typically. */
  onAsk?: () => void;
  /**
   * What to render when nobody has asked. "No known allergies" is a clinical assertion
   * somebody made; an empty list is not, and the two must not look alike.
   */
  askLabel?: string;
}

export const AllergyList = React.forwardRef<HTMLDivElement, AllergyListProps>(function AllergyList(
  {
    records,
    noneKnown,
    density = "default",
    expandClass,
    onOpenDetail,
    onAsk,
    askLabel = "Ask and record",
    className,
    ...rest
  },
  ref,
) {
  const state = resolveListState({ records: records ?? [], noneKnown: noneKnown ?? {} });

  return (
    <div
      {...rest}
      ref={ref}
      className={cn("ox-allergy-list", className)}
      data-ox-allergy-list={state.kind}
    >
      {state.kind === "records" ? (
        state.records.map((record) => (
          <AllergyChip
            key={record.id}
            record={record}
            density={density}
            {...(expandClass ? { expandClass } : {})}
            {...(onOpenDetail ? { onOpenDetail } : {})}
          />
        ))
      ) : state.kind === "none-known" ? (
        /*
         * A positive clinical finding, and it looks like one.
         *
         * Green, with an author and a date, because that is what makes it safe
         * to prescribe against — and the author and date are what separate it
         * from the state below.
         */
        <div className="ox-allergy-none" role="group" aria-label={describeNoKnown(state.assertion)}>
          <span className="ox-allergy-none__head" aria-hidden="true">
            <ClinicalStatus scale="criticality" step="normal" shape="dot" density="compact" />
            No known{state.assertion.scope ? ` ${state.assertion.scope}` : ""} allergies
          </span>
          <span className="ox-allergy-none__meta" aria-hidden="true">
            Asserted by {state.assertion.asserter} · {state.assertion.assertedAt}
            {state.assertion.context ? ` · ${state.assertion.context}` : ""}
          </span>
        </div>
      ) : (
        /*
         * Not an empty list. A gap, and a gate.
         *
         * Deliberately unlike the state above in shape as well as colour: a
         * reader scanning a chart should be able to tell these apart without
         * reading either, because the consequence of confusing them is a
         * prescription written against an allergy history nobody took.
         */
        <div className="ox-allergy-unknown" role="group" aria-label={NOT_ASKED_SENTENCE}>
          <span className="ox-allergy-unknown__head" aria-hidden="true">
            <ClinicalStatus scale="criticality" step="not-assessed" shape="dot" density="compact" />
            Allergy status not recorded
          </span>
          <span className="ox-allergy-unknown__meta" aria-hidden="true">
            No entry, and no assertion that there is nothing to enter.
          </span>
          {onAsk ? (
            <button type="button" className="ox-allergy-unknown__ask" onClick={onAsk}>
              {askLabel}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
});
