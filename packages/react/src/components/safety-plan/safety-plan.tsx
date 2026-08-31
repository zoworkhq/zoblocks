"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/safety-plan/safety-plan.tsx. Edit that file, not this one.
/**
 * SafetyPlan — the six steps, with the fifth one open.
 *
 * The Stanley-Brown Safety Planning Intervention is six ordered steps: warning
 * signs, internal coping, people and settings that distract, people to ask for
 * help, professionals and agencies, and making the environment safer. It is
 * written collaboratively in a room and read alone, often on a phone, often at
 * the worst hour of someone's week.
 *
 * That reading context is the entire design.
 *
 *   **Step five does not collapse.** It holds the crisis numbers. A person in
 *   crisis does not scroll, does not scan, and should not have to make a
 *   correct decision about a chevron to reach a phone number. The step renders
 *   open and its trigger reports itself disabled — which is exactly the case
 *   APG carves out for aria-disabled: the panel is visible and the accordion
 *   prevents collapsing it.
 *
 *   **The order is the intervention, not a layout.** Steps are rendered in the
 *   sequence the instrument defines. The component does not sort, filter, or
 *   let a caller reorder them, because the escalation from "things I can do
 *   alone" to "who I call" is the clinical content.
 *
 *   **A missing step is stated, not skipped.** A plan written in one sitting
 *   often has gaps. Rendering five steps and numbering them 1–5 would claim the
 *   sixth was never part of the instrument. Each empty step says it is not
 *   filled in yet, which is also the prompt to finish it.
 *
 * Wording here is patient-facing and second person throughout — a different
 * catalog from the clinician's, not a softened version of it (CONTENT.md §7).
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import { Accordion, type AccordionDensity } from "../../components/accordion/accordion";
import type { AccordionHeadingLevel, AccordionItem } from "../../lib/accordion-core";

/** A person or service the plan names. */
export interface SafetyPlanContact {
  name: string;
  /** How to reach them, as the plan records it. Rendered verbatim. */
  detail?: string;
  /** When they are reachable. "24 hours" is a fact worth stating. */
  availability?: string;
}

export interface SafetyPlanStepContent {
  /** Free text the person wrote. */
  entries?: readonly string[];
  /** People and services, for the steps that hold them. */
  contacts?: readonly SafetyPlanContact[];
}

export type SafetyPlanStepKey =
  | "warningSigns"
  | "internalCoping"
  | "distractions"
  | "supportContacts"
  | "professionals"
  | "environment";

export type SafetyPlanSteps = Partial<Record<SafetyPlanStepKey, SafetyPlanStepContent>>;

export interface SafetyPlanLabels {
  warningSigns: string;
  internalCoping: string;
  distractions: string;
  supportContacts: string;
  professionals: string;
  environment: string;
  /** Shown on the pinned crisis step. */
  alwaysOpen: string;
  /** Shown on the crisis step when it is not pinned, so the rail still has words. */
  crisisStep: string;
  /** Shown on a step nobody has filled in yet. */
  empty: string;
  /** Reassurance under the crisis step, so the pinning does not read as a glitch. */
  pinnedExplanation: string;
  revised: (date: string) => string;
}

/**
 * The six steps in the instrument's order. Exported so a product can label them
 * in its own words without being able to change the sequence.
 */
export const SAFETY_PLAN_STEP_ORDER: readonly SafetyPlanStepKey[] = [
  "warningSigns",
  "internalCoping",
  "distractions",
  "supportContacts",
  "professionals",
  "environment",
];

export const DEFAULT_SAFETY_PLAN_LABELS: SafetyPlanLabels = {
  warningSigns: "Signs that things are getting harder",
  internalCoping: "Things I can do on my own",
  distractions: "People and places that take my mind off it",
  supportContacts: "People I can ask for help",
  professionals: "If none of that is working",
  environment: "Making home safer",
  alwaysOpen: "Always open",
  crisisStep: "Crisis contacts",
  empty: "Not filled in yet. You can add to this with your clinician.",
  pinnedExplanation: "This part of your plan stays open. You do not have to look for it.",
  revised: (date) => `Revised ${date}`,
};

export interface SafetyPlanProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "onChange"
> {
  /**
   * The six Stanley-Brown steps, in order. The order is the intervention; a plan rendered out
   * of sequence is a different document.
   */
  steps: SafetyPlanSteps;
  /** ISO 8601. Shown so a reader knows how current the plan is. */
  revisedAt?: string;
  /** Replaces the built-in patient-facing wording. */
  labels?: Partial<SafetyPlanLabels>;
  /**
   * Keep the crisis step open and uncloseable.
   *
   * Defaults to true and should stay true on any surface a person in crisis
   * might open. Turning it off is for a clinician's editing view, where every
   * step is being worked on and none of them is the emergency.
   */
  pinCrisisStep?: boolean;
  /**
   * Where the plan's headings sit in the page outline. Set it to match the surrounding
   * document rather than letting a plan start at h1 inside a chart.
   */
  headingLevel?: AccordionHeadingLevel;
  /** Row height and type scale. Inherited from the nearest density provider when omitted. */
  density?: AccordionDensity;
}

function StepBody({
  content,
  emptyLabel,
  explanation,
}: {
  content: SafetyPlanStepContent | undefined;
  emptyLabel: string;
  explanation?: string;
}) {
  const entries = content?.entries ?? [];
  const contacts = content?.contacts ?? [];

  if (!entries.length && !contacts.length) {
    // Absence with a reason, never a blank — CONTENT.md §1.
    return <p className="ox-safety-plan__empty">{emptyLabel}</p>;
  }

  return (
    <>
      {entries.length ? (
        <ul className="ox-safety-plan__entries">
          {entries.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      ) : null}

      {contacts.length ? (
        <dl className="ox-safety-plan__contacts">
          {contacts.map((contact) => (
            <React.Fragment key={contact.name}>
              <dt>{contact.name}</dt>
              <dd>
                {contact.detail ? (
                  <span className="ox-safety-plan__detail">{contact.detail}</span>
                ) : null}
                {contact.availability ? (
                  <span className="ox-safety-plan__availability">{contact.availability}</span>
                ) : null}
              </dd>
            </React.Fragment>
          ))}
        </dl>
      ) : null}

      {explanation ? <p className="ox-safety-plan__explanation">{explanation}</p> : null}
    </>
  );
}

export function SafetyPlan({
  steps,
  revisedAt,
  labels: labelOverride,
  pinCrisisStep = true,
  headingLevel = 3,
  density = "patient",
  className,
  ...rest
}: SafetyPlanProps) {
  const labels = React.useMemo(
    () => ({ ...DEFAULT_SAFETY_PLAN_LABELS, ...labelOverride }),
    [labelOverride],
  );

  const items = React.useMemo<AccordionItem[]>(
    () =>
      SAFETY_PLAN_STEP_ORDER.map((key, index) => {
        const isCrisis = key === "professionals";
        const pinned = isCrisis && pinCrisisStep;

        return {
          key,
          // The number is part of the label rather than a separate element, so
          // it survives being read out, copied, or printed.
          label: `${index + 1} · ${labels[key]}`,
          ...(pinned ? { pinned: true } : {}),
          // The crisis step always carries words beside its rail, pinned or
          // not. In the clinician's editing view the step is closeable, so
          // "Always open" would be a lie — but a red rail with nothing beside
          // it is worse, because it is a signal only some readers receive.
          ...(isCrisis
            ? {
                severity: "critical" as const,
                summary: pinned ? labels.alwaysOpen : labels.crisisStep,
              }
            : {}),
          children: (
            <StepBody
              content={steps[key]}
              emptyLabel={labels.empty}
              {...(pinned ? { explanation: labels.pinnedExplanation } : {})}
            />
          ),
        };
      }),
    [labels, pinCrisisStep, steps],
  );

  return (
    <div className={cn("ox-safety-plan", className)} {...rest}>
      {revisedAt ? (
        <p className="ox-safety-plan__revised">
          <time dateTime={revisedAt}>{labels.revised(revisedAt)}</time>
        </p>
      ) : null}

      <Accordion
        items={items}
        // One at a time: this is read under load, and a page of six open
        // sections is a page nobody finishes.
        accordion
        variant="separate"
        density={density}
        headingLevel={headingLevel}
      />
    </div>
  );
}
