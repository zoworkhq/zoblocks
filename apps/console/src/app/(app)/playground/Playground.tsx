"use client";

import { useState } from "react";
import { Accordion, Switch, Timeline } from "@oxygenui-design/react";
import {
  VISION_KINDS,
  VISION_LABELS,
  simulateVision,
  type VisionKind,
} from "@oxygenui-design/theme";
import {
  AxisGroup,
  Callout,
  CopyButton,
  Panel,
  Preview,
  StatusChip,
  Toolbar,
} from "@/components/ui";
import type { ThemeName } from "@/lib/token-editor";

type Density = "patient" | "standard" | "clinical";

export interface PlaygroundTheme {
  slug: string;
  name: string;
  liveVersion: number | null;
  /** Resolved semantic tokens per theme, and the component tokens they reach. */
  resolved: Record<ThemeName, Record<string, string>>;
  dependents: Record<string, string[]>;
}

/**
 * Every axis at once, over real components.
 *
 * The three axes are the ones the token system is actually built on — brand ×
 * theme × density — plus colour vision, which is not an axis of the system but
 * is the thing a reviewer most needs to check and cannot check by reading hex
 * values.
 *
 * What this screen deliberately does *not* do is render Oxygen components
 * inside Ant Design or Material UI. It could only do that by importing them,
 * and the console never resolves a UI framework — that is the architectural
 * claim the whole bridge design rests on, and a console that quietly broke it
 * to make a demo prettier would be arguing against its own product. The
 * cross-framework proof is `e2e/bridge-hosts.spec.ts`, which mounts one
 * `Application.tsx` under antd, under MUI, and under neither.
 */
export function Playground({ themes }: { themes: readonly PlaygroundTheme[] }) {
  const [slug, setSlug] = useState(themes[0]?.slug ?? "");
  const [theme, setTheme] = useState<ThemeName>("light");
  const [density, setDensity] = useState<Density>("standard");
  const [vision, setVision] = useState<VisionKind | "none">("none");

  const active = themes.find((entry) => entry.slug === slug) ?? themes[0];
  if (!active) return null;

  /*
   * The full token set, then its dependants, then the simulation.
   *
   * Order matters. Simulating first and then deriving component tokens would
   * simulate a colour twice wherever a component token falls through to a
   * semantic one — visibly wrong on any saturated brand.
   */
  const tokens: Record<string, string> = { ...active.resolved[theme] };
  for (const [semantic, names] of Object.entries(active.dependents)) {
    const value = tokens[semantic];
    if (value) for (const name of names) tokens[name] = value;
  }
  if (vision !== "none") {
    for (const [name, value] of Object.entries(tokens)) {
      tokens[name] = simulateVision(value, vision) ?? value;
    }
  }

  const snippet = setupSnippet(active);

  return (
    <div className="space-y-5">
      <Toolbar>
        <AxisGroup
          label="Theme"
          value={slug}
          onChange={setSlug}
          options={themes.map((entry) => ({ value: entry.slug, label: entry.name }))}
        />
        <AxisGroup
          label="Mode"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "light" as const, label: "Light" },
            { value: "dark" as const, label: "Dark" },
            { value: "high-contrast" as const, label: "High contrast" },
          ]}
        />
        <AxisGroup
          label="Density"
          value={density}
          onChange={setDensity}
          options={[
            { value: "patient" as const, label: "Patient" },
            { value: "standard" as const, label: "Standard" },
            { value: "clinical" as const, label: "Clinical" },
          ]}
        />
        <AxisGroup
          label="Vision"
          value={vision}
          onChange={setVision}
          options={[
            { value: "none" as const, label: "Normal" },
            ...VISION_KINDS.map((kind) => ({ value: kind, label: VISION_LABELS[kind].label })),
          ]}
        />
      </Toolbar>

      {vision !== "none" && (
        <Callout tone="info" title={VISION_LABELS[vision].note}>
          A review simulation, not a diagnosis — dichromacy, which is about a quarter of
          colour-vision deficiency. The clinical status colours are simulated here too, which is the
          point: they are the ones that must stay distinguishable.
        </Callout>
      )}

      <Preview
        label={`${active.name} — ${theme}, ${density} density`}
        tokens={tokens}
        theme={theme}
        density={density}
      >
        <div className="space-y-6">
          <section aria-labelledby="pg-flags" className="space-y-3">
            <h3 id="pg-flags" className="text-[0.8125rem] font-semibold">
              Flags
            </h3>
            {/*
              A flex column, not `space-y`. `Switch` is inline-level, so three
              of them flowed onto one line and the labels ran into the next
              control — `space-y` adds a top margin, which does nothing to
              separate boxes that are sharing a line. The third value is the
              component's whole clinical contribution: a binary control cannot
              tell "no" from "nobody asked".
            */}
            <div className="flex flex-col items-start gap-3">
              <Switch id="pg-precautions" label="Contact precautions" value={true} />
              <Switch id="pg-directive" label="Advance directive" value="unknown" />
              <Switch id="pg-consent" label="Research consent" value={false} />
            </div>
          </section>

          <section aria-labelledby="pg-history" className="space-y-3">
            <h3 id="pg-history" className="text-[0.8125rem] font-semibold">
              History
            </h3>
            <Timeline
              aria-label="Admission history"
              items={[
                { key: "admit", content: "Admitted to ward 4B" },
                { key: "review", content: "Consultant review" },
                { key: "discharge", content: "Discharge planned" },
              ]}
            />
          </section>

          <section aria-labelledby="pg-detail" className="space-y-3">
            <h3 id="pg-detail" className="text-[0.8125rem] font-semibold">
              Detail
            </h3>
            <Accordion
              items={[
                {
                  key: "obs",
                  label: "Observations",
                  // `summary` is the slot that makes a collapsed row worth
                  // reading: a header saying only "Observations" costs an
                  // interaction to learn anything.
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
          </section>
        </div>
      </Preview>

      <Panel
        title="Use this theme"
        description="Link the published stylesheet and set the two attributes. No build step, no JavaScript, and no flash of unstyled content."
        actions={<CopyButton value={snippet}>Copy setup</CopyButton>}
      >
        <pre className="instrument overflow-x-auto p-4 font-mono text-[0.6875rem] leading-relaxed">
          {snippet}
        </pre>
        {active.liveVersion === null && (
          <p className="body-sm mt-3 flex flex-wrap items-center gap-2 text-graphite">
            <StatusChip tone="warn">draft</StatusChip>
            This theme has never been published, so the URL above does not exist yet. Publish it and
            the version in the path becomes real.
          </p>
        )}
      </Panel>
    </div>
  );
}

/**
 * The setup, as a customer would paste it.
 *
 * Two attributes and a stylesheet. `data-ox-theme` and `data-ox-density` go on
 * the *root* element rather than a wrapper, because the semantic and component
 * tiers are declared at `:root` and a `var()` resolves at the element that
 * declares it — scoping the attributes to a subtree moves the primitives and
 * leaves the rest behind.
 */
function setupSnippet(theme: PlaygroundTheme): string {
  const version = theme.liveVersion ?? 1;
  return [
    "<!-- The version is in the URL, so these bytes never change. -->",
    `<link rel="stylesheet" href="/t/{org}/${theme.slug}@${version}.css">`,
    "",
    "<!-- On <html>, not a wrapper: the token tiers are declared at :root. -->",
    '<html data-ox-theme="light" data-ox-density="standard">',
  ].join("\n");
}
