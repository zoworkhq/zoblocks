"use client";

/**
 * Shared fixtures and demos for Chart Command Palette — its Playground and
 * its Examples both need a real, open palette with a believable item list,
 * so both live here rather than duplicating the list twice.
 */

import * as React from "react";
import {
  ChartCommandPalette,
  type PaletteItem,
  type PatientScope,
  type SearchAudit,
} from "@/registry/zoblocks/chart-command-palette/chart-command-palette";

/**
 * Three of these verbs are behavioral-health-specific and no general
 * clinical library ships them. The fourth is the one with consequences.
 */
export const CP_ITEMS: PaletteItem[] = [
  {
    id: "phq",
    kind: "action",
    label: "Start PHQ-9",
    detail: "Assessment · 9 items · 4 min",
    keywords: ["depression screen"],
  },
  { id: "safety", kind: "action", label: "Open safety plan", detail: "Reviewed 12 Aug" },
  { id: "collateral", kind: "action", label: "Log a collateral contact" },
  { id: "noshow", kind: "action", label: "Document a no-show", detail: "Today, 14:00" },
  {
    id: "order",
    kind: "action",
    label: "Order lithium level",
    detail: "Serum · trough",
    argument: { label: "when" },
  },
  { id: "stop", kind: "action", label: "Discontinue lithium", significant: true },
  { id: "sign", kind: "action", label: "Sign note", unavailable: { reason: "Offline" } },
  { id: "phq-doc", kind: "chart-resource", label: "PHQ-9 result, 12 Aug", detail: "Score 14" },
  { id: "p-mine", kind: "patient", label: "A. Okonkwo", detail: "093-441-208" },
  { id: "p-other-1", kind: "patient", label: "A. Okonjo", detail: "093-118-774" },
  { id: "p-other-2", kind: "patient", label: "A. Okoro", detail: "093-772-115" },
  { id: "theme", kind: "setting", label: "Appearance and theme" },
];

export const CP_SCOPE: PatientScope = { inScope: new Set(["p-mine"]), breakGlass: true };

/**
 * The palette is `position: fixed`. `contain: layout paint` turns this box
 * into its containing block instead, so a fixed descendant positions itself
 * against this stage rather than the real viewport — the same trick the
 * component's own Preview gallery uses.
 */
export function CpStage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        // A fixed-position child is out of flow and contributes no width of
        // its own, so this box needs an explicit size rather than relying on
        // the parent to stretch it. It did, inside the Playground's own
        // layout — and did not inside the Examples section's centred flex
        // column, where that left this at 0px wide and the palette
        // positioned against a box with nothing to contain it.
        inlineSize: "100%",
        minBlockSize: 320,
        overflow: "hidden",
        borderRadius: 12,
        contain: "layout paint",
      }}
    >
      {children}
    </div>
  );
}

/**
 * The Playground's own renderer. `open` is fixed to `true` rather than a
 * knob — the component returns null when it is false, and a knob whose true
 * value is "render nothing" fails the playground walk's survives check for
 * that exact setting every time, the same reason Copilot's `suppressed`
 * and Chart Command Palette's own `open` were never knobs before this.
 */
export function ChartCommandPalettePlayground(
  props: Partial<React.ComponentProps<typeof ChartCommandPalette>>,
) {
  return (
    <CpStage>
      <ChartCommandPalette items={CP_ITEMS} scope={CP_SCOPE} {...props} open />
    </CpStage>
  );
}

/* ------------------------------------------------------------------ */
/* Examples                                                             */
/* ------------------------------------------------------------------ */

export function OutOfScopeCount() {
  return (
    <CpStage>
      <ChartCommandPalette open items={CP_ITEMS} scope={CP_SCOPE} placeholder={'Try "oko"…'} />
    </CpStage>
  );
}

/**
 * The one example with no visible component state to point at — the thing
 * it demonstrates is a side effect, not a render. So the preview adds one
 * line underneath showing the last audit record, fed by the same prop a
 * host would wire to its own sink.
 */
export function EveryPatientSearchRecorded() {
  const [last, setLast] = React.useState<SearchAudit | null>(null);
  return (
    <CpStage>
      <ChartCommandPalette
        open
        items={CP_ITEMS}
        scope={CP_SCOPE}
        placeholder={'Try "okonkwo", or a term that matches nobody…'}
        onSearchAudit={setLast}
      />
      <p
        style={{
          position: "absolute",
          insetInlineStart: 16,
          insetBlockEnd: 16,
          insetInlineEnd: 16,
          margin: 0,
          fontSize: "0.75rem",
          opacity: 0.7,
        }}
      >
        {last
          ? `Recorded — term "${last.term}", shown ${last.shown}, withheld ${last.withheld}${last.empty ? ", empty" : ""}`
          : "Last audit record: none yet. A patient search writes one, even an empty one."}
      </p>
    </CpStage>
  );
}

export function VerbsFirst() {
  return (
    <CpStage>
      <ChartCommandPalette open items={CP_ITEMS} scope={CP_SCOPE} placeholder={'Try "phq"…'} />
    </CpStage>
  );
}

export function SecondEnterConfirms() {
  return (
    <CpStage>
      <ChartCommandPalette
        open
        items={CP_ITEMS}
        scope={CP_SCOPE}
        placeholder={'Try "discontinue", then Enter twice…'}
      />
    </CpStage>
  );
}
