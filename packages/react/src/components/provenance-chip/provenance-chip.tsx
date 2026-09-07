// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/zoblocks/provenance-chip/provenance-chip.tsx. Edit that file, not this one.
/**
 * ProvenanceChip — where a value came from, and how much of it a human has
 * actually looked at.
 *
 *     <ProvenanceChip record={provenance} now={serverTime} />
 *     <ProvenanceChip resourceId="obs-1" ledger={ledger} now={serverTime} />
 *
 * An affix, never a headline. It sits beside a value and does not compete with
 * it, because the value is what the reader came for and the provenance is what
 * decides whether they can act on it.
 *
 * Six source classes, each with a CSS glyph rather than a colour — colour
 * would put them on a scale from better to worse, and they are not one. A
 * patient-reported PHQ-9 is the correct provenance for a PHQ-9; the same class
 * standing in for a blood-pressure measurement is not, and that judgement
 * belongs to the caller.
 *
 * Styling lives in `styles/zoblocks-provenance.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  SOURCE_GLYPH,
  SOURCE_LABEL,
  describeAgeShort,
  describeProvenance,
  staleness,
  type ProvenanceLedger,
  type ProvenanceRecord,
  type StalenessPolicy,
} from "../../lib/provenance";

export {
  SOURCE_GLYPH,
  SOURCE_LABEL,
  describeAgeShort,
  describeProvenance,
  fromProvenance,
  ledgerFrom,
  staleness,
  toSource,
  type ProvenanceAgent,
  type ProvenanceLedger,
  type ProvenanceRecord,
  type ProvenanceSource,
  type Staleness,
  type StalenessPolicy,
} from "../../lib/provenance";

type Base = Omit<React.HTMLAttributes<HTMLElement>, "children">;

export interface ProvenanceChipProps extends Base {
  /** The record, or a ledger lookup below. One of the two is required. */
  record?: ProvenanceRecord;
  /**
   * Read from a ledger instead.
   *
   * Components never fetch their own provenance: a chart with two hundred
   * values would make two hundred requests and every chip would settle at a
   * different moment. The host subscribes once and passes this down.
   */
  ledger?: ProvenanceLedger;
  /**
   * The resource this provenance is about. Used to link back to the record rather than to
   * re-fetch it.
   */
  resourceId?: string;
  /**
   * Which version was seen. Provenance for a value that has since changed is provenance for a
   * different value.
   */
  versionId?: string;

  /** ISO 8601, supplied by the host. No relative age is shown without it. */
  now?: string;
  /** How old is too old, per kind of datum. Four days differs by datum. */
  stalenessPolicy?: StalenessPolicy;

  /** Hides the source word, leaving the glyph and the age. For dense grids. */
  glyphOnly?: boolean;
  /** Opens the chain: the agents, the device, the document, the versions. */
  onOpenChain?: (record: ProvenanceRecord) => void;
  /**
   * Jumps to the span an extracted value was lifted from.
   *
   * The single most requested behaviour from clinicians reviewing extraction,
   * which is why it is its own handler rather than something folded into the
   * chain.
   */
  onOpenSpan?: (span: NonNullable<ProvenanceRecord["span"]>, record: ProvenanceRecord) => void;
}

export const ProvenanceChip = React.forwardRef<HTMLElement, ProvenanceChipProps>(
  function ProvenanceChip(
    {
      record: given,
      ledger,
      resourceId,
      versionId,
      now,
      stalenessPolicy,
      glyphOnly = false,
      onOpenChain,
      onOpenSpan,
      className,
      ...rest
    },
    ref,
  ) {
    const record = given ?? (resourceId ? ledger?.get(resourceId, versionId) : undefined);

    // Nothing rather than a chip claiming an unknown origin. A chip that says
    // "unknown" on every value it has no ledger entry for teaches readers to
    // ignore the whole column.
    if (!record) return null;

    const age = now ? staleness(record, now, stalenessPolicy) : { state: "unknown" as const };
    // The age is a fact and the staleness judgement is an opinion, so the age
    // shows whenever there is a date to measure from and only the highlight
    // waits for a policy.
    const at = record.observedAt ?? record.recordedAt;
    const elapsedMs = now && at ? Date.parse(now) - Date.parse(at) : Number.NaN;
    const showAge = Number.isFinite(elapsedMs) && elapsedMs >= 0;
    const label = describeProvenance(record, now, stalenessPolicy);
    const extracted = record.source === "ai-extracted";
    const unconfirmed = extracted && !record.confirmed;

    const shared = {
      className: cn("zb-prov", className),
      "data-zb-provenance": "",
      "data-zb-source": record.source,
      "data-zb-staleness": age.state,
      "data-zb-unconfirmed": unconfirmed ? "" : undefined,
      "aria-label": label,
      ...rest,
    };

    const body = (
      <>
        <span
          className="zb-prov__glyph"
          data-zb-glyph={SOURCE_GLYPH[record.source]}
          aria-hidden="true"
        />
        {glyphOnly ? null : (
          <span className="zb-prov__word" aria-hidden="true">
            {SOURCE_LABEL[record.source]}
          </span>
        )}
        {/*
          Staleness is folded in rather than kept in the chain. A device
          reading from four days ago and one from four minutes ago carry
          different weight, and the reader has to see that without hovering.
        */}
        {showAge ? (
          <span className="zb-prov__age" data-zb-staleness={age.state} aria-hidden="true">
            {describeAgeShort(elapsedMs)}
          </span>
        ) : null}
        {/*
          The confirmation state, for extracted values only.
          Absent means the question does not apply; a dot means nobody has
          looked, which is a different thing from a low-confidence score.
        */}
        {unconfirmed ? (
          <span className="zb-prov__unconfirmed" aria-hidden="true">
            unreviewed
          </span>
        ) : null}
      </>
    );

    const chip = onOpenChain ? (
      <button
        {...(shared as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={() => onOpenChain(record)}
      >
        {body}
      </button>
    ) : (
      // A span when there is nothing to open. A focusable element with no
      // action is worse here than anywhere: there is one beside every value.
      <span
        {...(shared as React.HTMLAttributes<HTMLSpanElement>)}
        ref={ref as React.Ref<HTMLSpanElement>}
        role="img"
      >
        {body}
      </span>
    );

    if (extracted && record.span && onOpenSpan) {
      const span = record.span;
      return (
        <span className="zb-prov__pair">
          {chip}
          <button
            type="button"
            className="zb-prov__span"
            onClick={() => onOpenSpan(span, record)}
            aria-label={`View the source span: ${span.document}${
              typeof span.page === "number" ? `, page ${span.page}` : ""
            }`}
          >
            View span
          </button>
        </span>
      );
    }

    return chip;
  },
);
