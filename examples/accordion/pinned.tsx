import { Accordion } from "@/components/zoblocks/accordion";

export default function SectionCannotBeClosedExample() {
  return (
    <Accordion
      headingLevel={3}
      items={[
        {
          key: "signs",
          label: "1 · Signs that things are getting harder",
          children: (
            <p>
              I notice that I am withdrawing, sleeping poorly, or feeling increasingly overwhelmed.
            </p>
          ),
        },
        {
          key: "coping",
          label: "2 · Things I can do on my own",
          children: (
            <p>
              Try grounding exercises, contact someone I trust, or move to a place where I feel
              safe.
            </p>
          ),
        },
        {
          key: "crisis",
          label: "3 · If none of that is working",
          pinned: true,
          severity: "critical",
          summary: "Always open",
          children: (
            <div className="space-y-2">
              <p className="font-semibold">988 — Suicide & Crisis Lifeline</p>
              <p>Available 24 hours.</p>
              <p>Or text HOME to 741741.</p>
            </div>
          ),
        },
      ]}
    />
  );
}
