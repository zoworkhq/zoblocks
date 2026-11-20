import { Tabs } from "@zoblocks/tabs";

function PreviewPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
      <p className="text-sm">{children}</p>
    </div>
  );
}

function Rendered() {
  return (
    <PreviewPanel>
      <strong>Rendered</strong> — Preview the component as it appears to users.
    </PreviewPanel>
  );
}

function Source() {
  return (
    <PreviewPanel>
      <strong>Source</strong> — Inspect the component implementation.
    </PreviewPanel>
  );
}

function Diff() {
  return (
    <PreviewPanel>
      <strong>Diff</strong> — Review changes between versions.
    </PreviewPanel>
  );
}

export default function GhostVariantExample() {
  return (
    <section className="space-y-4">
      <Tabs
        as="tabs"
        variant="ghost"
        aria-label="Preview mode"
        defaultValue="rendered"
        items={[
          {
            value: "rendered",
            label: "Rendered",
            children: <Rendered />,
          },
          {
            value: "source",
            label: "Source",
            children: <Source />,
          },
          {
            value: "diff",
            label: "Diff",
            children: <Diff />,
          },
        ]}
      />
    </section>
  );
}
