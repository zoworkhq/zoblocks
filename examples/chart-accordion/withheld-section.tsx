import { ChartAccordion } from "@/components/zoblocks/chart-accordion";
import { TOOLBAR_LABEL, sections } from "./_shared/record";

// Restricted, and says why. There are no hidden children to reveal.
export default function WithheldSection() {
  return (
    <ChartAccordion
      toolbarLabel={TOOLBAR_LABEL}
      headingLevel={3}
      sections={[
        ...sections.slice(0, 2),
        {
          key: "psychotherapy",
          label: "Psychotherapy notes",
          access: { kind: "withheld", reason: "Kept separately by the author" },
        },
      ]}
    />
  );
}
