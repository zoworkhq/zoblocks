"use client";

import { Accordion, PulseLoader, Switch, Timeline } from "@oxygenui-design/react";
import { Preview } from "@/components/ui";
import type { ThemeName } from "@/lib/token-editor";
import type { ComponentToken } from "./ComponentEditor";

/**
 * The component being edited, drawn under the edits.
 *
 * This screen let somebody change fifty-five switch tokens and showed them
 * fifty-five text fields. A hex in a box is not a switch, and the whole reason
 * a component token tier exists is that a customer can restyle one component
 * without touching the others — which is a claim about what things *look* like
 * and can only be settled by looking.
 *
 * Unlike the token editor's preview, this one does not need to fan an override
 * out to its dependents: the customer is setting the component tokens directly,
 * so what they typed is what the component reads. The semantic layer is still
 * applied underneath, because a preview that resolved `--ox-accent` from
 * Oxygen's palette would show a customer their edits sitting on our colours.
 */

/**
 * A specimen per component, and an honest gap where there is not one.
 *
 * Only components `@oxygenui-design/react` exports can be drawn here. Tabs,
 * badge, banner, avatar and patient-chip live in packages the app does not
 * depend on, and adding five dependencies to render five thumbnails is a worse
 * trade than saying so. What is not acceptable is an empty box that reads as a
 * broken preview rather than an absent one.
 */
const SPECIMENS: Record<string, () => React.ReactNode> = {
  switch: function SwitchSpecimen() {
    return (
      <div className="flex flex-col items-start gap-3">
        {/*
          All three values, because the third is the component's entire clinical
          contribution: a binary control cannot tell "no" from "nobody asked".
          A preview showing only on and off would hide the state most likely to
          be styled badly.
        */}
        <Switch id="cp-precautions" label="Contact precautions" value={true} />
        <Switch id="cp-directive" label="Advance directive" value="unknown" />
        <Switch id="cp-consent" label="Research consent" value={false} />
      </div>
    );
  },

  timeline: function TimelineSpecimen() {
    return (
      <Timeline
        aria-label="Admission history"
        items={[
          { key: "admit", content: "Admitted to ward 4B" },
          { key: "review", content: "Consultant review" },
          { key: "discharge", content: "Discharge planned" },
        ]}
      />
    );
  },

  accordion: function AccordionSpecimen() {
    return (
      <Accordion
        items={[
          {
            key: "obs",
            label: "Observations",
            summary: "K⁺ 5.9 mmol/L · above reference",
            children: "Serum potassium 5.9 mmol/L · reference 3.5–5.1",
          },
          {
            key: "meds",
            label: "Medications",
            summary: "None active",
            children: "No active prescriptions",
          },
        ]}
      />
    );
  },

  loader: function LoaderSpecimen() {
    return (
      <div className="flex items-center gap-4">
        <PulseLoader aria-label="Loading" />
      </div>
    );
  },
};

export const PREVIEWABLE = Object.keys(SPECIMENS);

export function ComponentPreview({
  component,
  theme,
  rows,
  overrides,
  resolved,
}: {
  component: string;
  theme: ThemeName;
  /** The rows on screen, carrying the value each token resolves to now. */
  rows: readonly ComponentToken[];
  /** What the customer has typed, keyed by custom property. */
  overrides: Record<string, string>;
  /** The semantic tier for this theme, so the specimen sits on their palette. */
  resolved: Record<string, string>;
}) {
  const Specimen = SPECIMENS[component];

  const tokens: Record<string, string> = { ...resolved };
  // The base each token resolves to, then whatever is being typed over it.
  for (const row of rows) if (row.base) tokens[row.name] = row.base;
  for (const [name, value] of Object.entries(overrides)) if (value) tokens[name] = value;

  return (
    <div className="xl:sticky xl:top-6">
      <p className="eyebrow mb-1.5 text-graphite-soft">Live preview</p>

      {Specimen ? (
        <Preview
          label={`${component} rendered under the draft theme`}
          tokens={tokens}
          theme={theme}
        >
          <Specimen />
        </Preview>
      ) : (
        <div className="surface p-4">
          <p className="text-[0.8125rem] font-semibold">No live specimen for {component}</p>
          <p className="body-sm mt-1 text-graphite">
            The app can draw {PREVIEWABLE.join(", ")} — the components its own dependencies include.
            The rest live in packages it does not install, and the values below are still the ones
            your application will draw.
          </p>
        </div>
      )}
    </div>
  );
}
