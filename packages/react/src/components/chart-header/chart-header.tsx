"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/chart-header/chart-header.tsx. Edit that file, not this one.
/**
 * ChartHeader — patient context that collapses to a safety bar, not to a name.
 *
 *     <ChartHeader
 *       patient={patient}
 *       identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}
 *       surface="orders"
 *       encounters={open}
 *       selectedEncounterId={encounterId}
 *       onSelectEncounter={setEncounterId}
 *       safety={{ allergies: { label: "Penicillin — anaphylaxis", tone: "critical" } }}
 *     >
 *       <OrderForm />
 *     </ChartHeader>
 *
 * The workspace chrome over `PatientBanner`, which is the safety control: two
 * identifiers before a care action, enforced by the type. This adds the three
 * things a header needs that a banner does not — it is always there, it knows
 * which encounter you are documenting into, and it degrades to the strip you
 * must not act without rather than to a heading.
 *
 * Three rules are load-bearing.
 *
 *   Collapse hides nothing. The expanded content moves behind a disclosure
 *   rather than out of the DOM, so a screen-reader user is never worse off
 *   than a sighted one, and focus never lands behind the sticky element.
 *
 *   The encounter is a control, not a subtitle. "No encounter selected" is a
 *   state it will sit in rather than pick for you, because a note filed into
 *   an encounter nobody chose is the most common misfiling in the building.
 *
 *   `Patient.gender` never appears. On an order or a result screen the header
 *   shows the Sex Parameter for Clinical Use with the context it applies to,
 *   and says "not recorded" when there is none.
 *
 * Styling lives in `styles/oxygen-chart-header.css`, installed alongside.
 */

import * as React from "react";
import {
  PatientBanner,
  type IdentifierSpec,
  type PatientBannerProps,
  type TwoOrMore,
} from "@oxygenui-design/identity";
import { cn } from "../../lib/utils";
import { clockTime } from "../../lib/clock";
import {
  SAFETY_ORDER,
  describeEncounterContext,
  describeProgram,
  describeSafety,
  describeSpcu,
  hasExpired,
  resolveEncounterContext,
  resolveSpcu,
  safetyStrip,
  type ChartSurface,
  type EncounterOption,
  type Program,
  type SafetyInput,
} from "../../lib/chart-header";

export {
  EXT_SPCU,
  SAFETY_ORDER,
  SPCU_SURFACES,
  describeEncounterContext,
  describeProgram,
  describeSafety,
  describeSpcu,
  hasExpired,
  programFromEpisode,
  resolveEncounterContext,
  resolveSpcu,
  safetyStrip,
  type ChartSurface,
  type EncounterContext,
  type EncounterOption,
  type Program,
  type SafetyFact,
  type SafetyInput,
  type SafetyKind,
  type SafetyTone,
  type SpcuReading,
} from "../../lib/chart-header";

/**
 * The FHIR `Patient` the banner accepts, taken from the banner rather than
 * re-declared. A registry component that redeclares a resource shape is one
 * upstream field away from disagreeing with the thing it renders.
 */
type BannerPatient = NonNullable<PatientBannerProps["patient"]>;

export interface ChartHeaderProps {
  patient: BannerPatient;
  /**
   * Two, enforced by the type — this is NPSG.01.01.01 in the signature rather
   * than in a review comment.
   */
  identifiers: TwoOrMore<IdentifierSpec>;
  /**
   * What the clinician has in view. Decides whether the Sex Parameter for
   * Clinical Use appears at all.
   */
  surface?: ChartSurface;
  /** ISO 8601, supplied by the host. Decides whether a dated fact has lapsed. */
  now?: string;
  /** Every encounter open for this patient. One is selected by the caller. */
  encounters?: readonly EncounterOption[];
  selectedEncounterId?: string;
  /**
   * Switching encounter is a deliberate act, and the host re-guards every open
   * form on the far side of it.
   */
  onSelectEncounter?: (id: string | undefined) => void;
  safety?: SafetyInput;
  program?: Program;
  ward?: string;
  /** Rendered at the end of the expanded row. Actions belong to the application. */
  actions?: React.ReactNode;
  /**
   * Start collapsed.
   *
   * Uncontrolled by design: the host owns the scroll sentinel because only the
   * host knows what its scroll container is, and an IntersectionObserver wired
   * to the wrong ancestor is worse than none.
   */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
  /**
   * The screen, rendered inside the patient context the banner establishes.
   *
   * This is what lets `PatientGuard` compare a form against the chart on
   * screen — the header is not a decoration above the content, it is the
   * statement the content is made under.
   */
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/* The strip                                                           */
/* ------------------------------------------------------------------ */

/**
 * The 44px bar.
 *
 * Memoised on its own inputs. A chart header re-renders whenever anything on
 * the page changes, and this is the part that must not: it is read
 * continuously and re-rendering it moves nothing but costs a frame on every
 * vitals refresh.
 */
const SafetyStrip = React.memo(function SafetyStrip({
  safety,
  now,
  scrollable,
}: {
  safety: SafetyInput;
  now?: string;
  /**
   * True when the strip is the collapsed one, which scrolls sideways.
   *
   * A scrollable region has to be reachable by keyboard or its content is
   * unreachable to anyone not using a pointer — WCAG 2.1.1, and axe's
   * `scrollable-region-focusable` caught it on the first audit after this
   * component landed. The expanded strip wraps instead of scrolling, so it
   * needs no tab stop and does not get one: an extra stop on the most-read
   * eighty pixels of the screen is a cost, and paying it twice buys nothing.
   */
  scrollable: boolean;
}) {
  const facts = React.useMemo(() => safetyStrip(safety), [safety]);

  return (
    <ul
      className="ox-chart-header__strip"
      aria-label="Safety"
      {...(scrollable ? { tabIndex: 0 } : {})}
    >
      {facts
        .slice()
        .sort((a, b) => SAFETY_ORDER.indexOf(a.kind) - SAFETY_ORDER.indexOf(b.kind))
        .map((fact, index) => {
          const expired = hasExpired(fact, now);
          return (
            <li
              key={`${fact.kind}-${index}`}
              className="ox-chart-header__fact"
              data-ox-kind={fact.kind}
              data-ox-tone={expired ? "critical" : fact.tone}
              data-ox-expired={expired ? "" : undefined}
            >
              <span className="ox-chart-header__fact-label">{fact.label}</span>
              {fact.detail ? (
                <span className="ox-chart-header__fact-detail">{fact.detail}</span>
              ) : null}
              {/*
                An expired hold is shown as expired rather than removed.
                Dropping it the moment it lapses is how somebody finds out at
                02:00 that the legal basis for an admission ended at 20:00.
              */}
              {fact.until ? (
                <span className="ox-chart-header__fact-until">
                  {expired ? "expired" : "until"} {clockTime(fact.until, now)}
                </span>
              ) : null}
            </li>
          );
        })}
    </ul>
  );
});

/* ------------------------------------------------------------------ */
/* The header                                                          */
/* ------------------------------------------------------------------ */

export function ChartHeader({
  patient,
  identifiers,
  surface = "overview",
  now,
  encounters = [],
  selectedEncounterId,
  onSelectEncounter,
  safety = {},
  program,
  ward,
  actions,
  collapsed = false,
  onCollapsedChange,
  className,
  children,
}: ChartHeaderProps) {
  const detailId = React.useId();
  const context = resolveEncounterContext(encounters, selectedEncounterId);
  const spcu = resolveSpcu(patient, surface, now);
  const facts = React.useMemo(() => safetyStrip(safety), [safety]);

  return (
    <div className={cn("ox-chart-header", className)} data-ox-chart-header="">
      <header
        className="ox-chart-header__bar"
        data-ox-collapsed={collapsed ? "" : undefined}
        data-ox-surface={surface}
        // A banner landmark, so "skip to the patient" is a thing a screen
        // reader can offer without the application inventing it.
        role="banner"
        aria-label={describeSafety(facts, now)}
      >
        {/*
          The strip is outside the disclosure on purpose. It is the one part
          that must be readable in both heights, and moving it in and out of
          the tree at 44px would be the exact failure the collapse exists to
          avoid.
        */}
        <div className="ox-chart-header__persistent">
          <button
            type="button"
            className="ox-chart-header__toggle"
            aria-expanded={!collapsed}
            aria-controls={detailId}
            onClick={() => onCollapsedChange?.(!collapsed)}
          >
            {collapsed ? "Show patient details" : "Collapse"}
          </button>
          <SafetyStrip safety={safety} now={now} scrollable={collapsed} />
        </div>

        {/*
          Hidden with `hidden`, not unmounted.
          Collapse moves content behind a disclosure so a screen-reader user is
          never worse off than a sighted one — and, just as importantly, focus
          can never land on something scrolled behind the sticky bar.
        */}
        <div id={detailId} className="ox-chart-header__detail" hidden={collapsed}>
          <PatientBanner
            context="action"
            patient={patient}
            identifiers={identifiers}
            {...(ward ? { ward } : {})}
            {...(actions ? { actions } : {})}
          />

          <div className="ox-chart-header__context">
            {/*
              The encounter is a control. A subtitle cannot be wrong on
              purpose, and this one has to be able to say "nothing is
              selected" and mean it.
            */}
            {onSelectEncounter ? (
              <label className="ox-chart-header__encounter">
                <span className="ox-chart-header__encounter-label">Documenting into</span>
                <select
                  className="ox-chart-header__encounter-select"
                  data-ox-encounter={context.kind}
                  value={context.kind === "selected" ? context.encounter.id : ""}
                  onChange={(event) => onSelectEncounter(event.target.value || undefined)}
                >
                  <option value="">No encounter selected</option>
                  {encounters.map((encounter) => (
                    <option key={encounter.id} value={encounter.id}>
                      {encounter.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              // Read-only rather than a disabled control: a disabled select
              // leaves the tab order, so a keyboard user cannot reach the one
              // fact that says where their note is going.
              <p className="ox-chart-header__encounter" data-ox-encounter={context.kind}>
                <span className="ox-chart-header__encounter-label">Documenting into</span>
                <span className="ox-chart-header__encounter-value">
                  {context.kind === "selected" ? context.encounter.label : "No encounter selected"}
                </span>
              </p>
            )}

            {/*
              Announced, because the reason changes as encounters open and
              close and the difference between "none open" and "three open,
              choose one" decides what the clinician does next.
            */}
            {context.kind === "none" ? (
              <p className="ox-chart-header__encounter-reason" role="status">
                {describeEncounterContext(context)}
              </p>
            ) : null}

            {program ? (
              <p className="ox-chart-header__program">{describeProgram(program)}</p>
            ) : null}

            {/*
              Only on an order or a result screen, and always with its context.
              Everywhere else this field is a demographic wearing a clinical
              name, which is what it was invented to replace.
            */}
            {spcu ? (
              <p
                className="ox-chart-header__spcu"
                data-ox-recorded={spcu.recorded ? "" : undefined}
              >
                {describeSpcu(spcu)}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

ChartHeader.displayName = "ChartHeader";
