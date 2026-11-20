import { Tabs } from "@zoblocks/tabs";

function Option({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2 text-left">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs leading-relaxed text-[var(--zb-text-muted)]">{body}</p>
    </div>
  );
}

export default function CardVariantExample() {
  return (
    <section className="space-y-4">
      <Tabs
        as="radiogroup"
        variant="card"
        aria-label="How should this result be released?"
        defaultValue="immediate"
        items={[
          {
            value: "immediate",
            textLabel: "Immediate",
            label: (
              <Option
                title="Immediate"
                body="Visible in the patient portal as soon as it is verified."
              />
            ),
          },
          {
            value: "reviewed",
            textLabel: "After review",
            label: (
              <Option
                title="After review"
                body="Held until a clinician marks it reviewed. Median delay 6 h."
              />
            ),
          },
          {
            value: "scheduled",
            textLabel: "Scheduled",
            label: (
              <Option
                title="Scheduled"
                body="Released at a fixed time you choose, review or not."
              />
            ),
          },
        ]}
      />
    </section>
  );
}
