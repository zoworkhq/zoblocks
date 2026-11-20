import { ChartAccordion } from "@/components/zoblocks/chart-accordion";
import { TOOLBAR_LABEL, sections } from "./_shared/record";

// "Expand all" opens what the reader may see. The withheld section stays closed.
export default function ExpandCollapseAll() {
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
