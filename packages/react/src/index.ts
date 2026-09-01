// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from the registry. Run `pnpm gen`.

export * from "./lib/loader";
export * from "./lib/accordion-core";
export * from "./lib/switch";
// The temporal engine and its React core. Star-exported here rather than
// from each date component, because the barrel is flat: two components
// re-exporting formatPlainDate is a duplicate-identifier error at build.
export * from "./lib/datetime";
export * from "./lib/datetime-field";
export * from "./lib/availability";
export * from "./lib/recurrence";
export { cn } from "./lib/utils";

export * from "./components/accordion/accordion";
export * from "./components/allergy-chip/allergy-chip";
export * from "./components/breath-loader/breath-loader";
export * from "./components/care-team-presence/care-team-presence";
export * from "./components/care-timeline/care-timeline";
export * from "./components/chart-accordion/chart-accordion";
export * from "./components/chart-command-palette/chart-command-palette";
export * from "./components/chart-context-menu/chart-context-menu";
export * from "./components/chart-header/chart-header";
export * from "./components/clinical-status/clinical-status";
export * from "./components/copilot/copilot";
export * from "./components/date-picker/date-picker";
export * from "./components/helix-loader/helix-loader";
export * from "./components/infusion-loader/infusion-loader";
export * from "./components/provenance-chip/provenance-chip";
export * from "./components/pulse-loader/pulse-loader";
export * from "./components/recent-patient-stack/recent-patient-stack";
export * from "./components/recorder/recorder";
export * from "./components/result-value/result-value";
export * from "./components/rhythm-loader/rhythm-loader";
export * from "./components/risk-indicator/risk-indicator";
export * from "./components/safety-plan/safety-plan";
export * from "./components/switch/switch";
export * from "./components/timeline/timeline";
export * from "./components/trend-indicator/trend-indicator";
