import { ChartAccordion } from "@/components/zoblocks/chart-accordion";
import { TOOLBAR_LABEL } from "./_shared/record";

// Nothing to show, and still clearly this patient's record.
export default function NoSections() {
  return <ChartAccordion toolbarLabel={TOOLBAR_LABEL} headingLevel={3} sections={[]} />;
}
