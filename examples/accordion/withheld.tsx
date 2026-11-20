import { Accordion } from "@/components/zoblocks/accordion";

export default function WithheldAndSayingSoExample() {
  return (
    <Accordion
      headingLevel={3}
      items={[
        {
          key: "notes",
          label: "Progress notes",
          summary: "142 encounters",
          children: (
            <div className="space-y-2">
              <p className="font-medium">Progress notes</p>
              <p>Recent clinical encounters and progress notes.</p>
            </div>
          ),
        },
        {
          key: "psychotherapy",
          label: "Psychotherapy notes",
          access: {
            kind: "withheld",
            reason: "Kept separately by the author",
          },
        },
        {
          key: "sealed",
          label: "Adolescent visit, 2019",
          access: {
            kind: "withheld",
            reason: "Sealed under state minor-consent law. Not releasable to this account.",
          },
        },
      ]}
    />
  );
}
