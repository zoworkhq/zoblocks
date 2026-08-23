/**
 * ClinicalStatus — one status vocabulary for the whole library.
 *
 *     <ClinicalStatus scale="criticality" step="critical" />
 *     <ClinicalStatus scale="access" step="part-2" shape="dot" />
 *     <ClinicalStatus scale="result-status" step="preliminary" shape="affix" />
 *
 * Three presentations of one datum, nine scales, forty steps, and no
 * free text. The vocabulary and the FHIR adapters live in
 * `@/lib/oxygen-clinical-status`; this file is the rendering, and it is
 * deliberately almost nothing — a pure function of (scale, step, shape,
 * density) with no state, no context and no effects.
 *
 * The rule the component exists to enforce: hue, shape and word are emitted
 * together or not at all. A reader who cannot distinguish the hues reads the
 * shape. A reader on a screen reader hears the word, and hears it qualified by
 * the scale, because "Preliminary" alone does not say preliminary *what*.
 *
 * Styling lives in `styles/oxygen-clinical-status.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  SCALES,
  describeStatus,
  resolveStatus,
  wordFor,
  type ScaleName,
  type StatusAudience,
  type StatusStep,
} from "@/lib/oxygen-clinical-status";

export {
  SCALES,
  SCALE_NAMES,
  STEP_COUNT,
  UnknownStatusError,
  describeStatus,
  fromAllergyCriticality,
  fromConsent,
  fromEncounterStatus,
  fromInterpretation,
  fromIssueSeverity,
  fromObservationStatus,
  fromRequestStatus,
  resolveStatus,
  wordFor,
  type ScaleName,
  type StatusAudience,
  type StatusGlyph,
  type StatusScale,
  type StatusStep,
  type StatusTone,
  type StepOf,
} from "@/lib/oxygen-clinical-status";

/** Chip, dot, or the leading rule of a grid row. */
export type StatusShape = "chip" | "dot" | "affix";

export type StatusDensity = "compact" | "default";

export interface ClinicalStatusProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "children" | "onClick"
> {
  /** Which vocabulary. Required — there is no default scale. */
  scale: ScaleName;
  /** A step id of that scale. Anything else throws rather than degrading. */
  step: string;
  /**
   * How it presents. `chip` carries all three channels and is the default;
   * `dot` drops the visible word and is only safe in a column that is entirely
   * status; `affix` is a 3px row rule for grids past about forty rows.
   */
  shape?: StatusShape;
  density?: StatusDensity;
  /** Which register the word is written in. */
  audience?: StatusAudience;
  /**
   * Extra clause for the accessible name — "resulted 41 minutes ago", "2 no-shows".
   *
   * Goes into the name, not beside it, so a screen-reader user gets one
   * sentence rather than two fragments with a pause between them.
   */
  qualifier?: string;
  /**
   * Opens the definition of the step.
   *
   * When given, the chip becomes a real button. The meaning of "preliminary"
   * is not obvious and guessing it is a clinical act, so the affordance is
   * worth having — but only when there is something behind it, which is why it
   * is opt-in rather than always focusable.
   */
  onExplain?: (step: StatusStep, scale: ScaleName) => void;
}

export const ClinicalStatus = React.forwardRef<HTMLElement, ClinicalStatusProps>(
  function ClinicalStatus(
    {
      scale,
      step,
      shape = "chip",
      density = "default",
      audience = "clinician",
      qualifier,
      onExplain,
      className,
      ...rest
    },
    ref,
  ) {
    // Throws on an unknown pair. See `resolveStatus` for why there is no
    // fallback: a chip that renders "unknown" for a typo will one day render
    // it for a critical potassium.
    const resolved = resolveStatus(scale, step);
    const word = wordFor(resolved, audience);
    const label = describeStatus(scale, resolved, { audience, qualifier });

    const glyph = (
      <span className="ox-cs__glyph" data-ox-glyph={resolved.glyph} aria-hidden="true" />
    );

    /*
     * The word, twice, with CSS choosing.
     *
     * Both are rendered so the swap at 360px costs no JavaScript and no layout
     * measurement — and so the accessible name is unaffected by which one is
     * visible, since it comes from `aria-label` rather than from the text.
     */
    const body =
      shape === "dot" ? null : shape === "affix" ? (
        <span className="ox-cs__short">{resolved.short}</span>
      ) : (
        <>
          <span className="ox-cs__word" data-ox-full="">
            {word}
          </span>
          <span className="ox-cs__word" data-ox-abbr="">
            {resolved.short}
          </span>
        </>
      );

    const shared = {
      className: cn("ox-cs", className),
      "data-ox-status": "",
      "data-ox-scale": scale,
      "data-ox-step": resolved.id,
      "data-ox-tone": resolved.tone,
      "data-ox-shape": shape,
      "data-ox-density": density,
      "aria-label": label,
      ...rest,
    };

    if (onExplain) {
      return (
        <button
          {...(shared as React.ButtonHTMLAttributes<HTMLButtonElement>)}
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          onClick={() => onExplain(resolved, scale)}
        >
          {glyph}
          {body}
        </button>
      );
    }

    /*
     * `role="img"` with a label, not a bare span.
     *
     * The chip is a picture of a state: it has a name and no children worth
     * traversing. Without the role the `aria-label` on a generic span is
     * ignored by several screen readers, and the reader gets the visible text
     * instead — which is the abbreviation, on a narrow screen.
     */
    return (
      <span
        {...(shared as React.HTMLAttributes<HTMLSpanElement>)}
        ref={ref as React.Ref<HTMLSpanElement>}
        role="img"
      >
        {glyph}
        {body}
      </span>
    );
  },
);

/**
 * Every step of one scale, for a legend.
 *
 * A dot presentation is only legible next to one of these, and a product that
 * uses dots without a legend has shipped colour-alone with extra steps.
 */
export interface StatusLegendProps extends React.HTMLAttributes<HTMLDListElement> {
  scale: ScaleName;
  density?: StatusDensity;
  audience?: StatusAudience;
}

export const StatusLegend = React.forwardRef<HTMLDListElement, StatusLegendProps>(
  function StatusLegend(
    { scale, density = "default", audience = "clinician", className, ...rest },
    ref,
  ) {
    return (
      <dl
        {...rest}
        ref={ref}
        className={cn("ox-cs-legend", className)}
        data-ox-status-legend=""
        aria-label={`${SCALES[scale].label} legend`}
      >
        {SCALES[scale].steps.map((step: StatusStep) => (
          <div key={step.id} className="ox-cs-legend__row">
            <dt>
              <ClinicalStatus scale={scale} step={step.id} shape="dot" density={density} />
            </dt>
            <dd>{wordFor(step, audience)}</dd>
          </div>
        ))}
      </dl>
    );
  },
);
