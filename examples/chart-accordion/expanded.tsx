import { ChartAccordion } from "@/components/zoblocks/chart-accordion";
import { TOOLBAR_LABEL, sections } from "./_shared/record";

export default function Expanded() {
  return (
    <ChartAccordion
      toolbarLabel={TOOLBAR_LABEL}
      headingLevel={3}
      defaultOpenKeys={["risk", "assessments"]}
      sections={sections}
    />
  );
}
