import { ChartAccordion } from "@/components/zoblocks/chart-accordion";
import { TOOLBAR_LABEL, sections } from "./_shared/record";

// Nothing is open. Severity, status, counts and timestamps say where to look.
export default function ClosedWithSummaries() {
  return <ChartAccordion toolbarLabel={TOOLBAR_LABEL} headingLevel={3} sections={sections} />;
}
