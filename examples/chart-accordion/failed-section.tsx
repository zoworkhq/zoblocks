import { ChartAccordion } from "@/components/zoblocks/chart-accordion";
import { TOOLBAR_LABEL, sections } from "./_shared/record";

export default function FailedSection() {
  return (
    <ChartAccordion
      toolbarLabel={TOOLBAR_LABEL}
      headingLevel={3}
      defaultOpenKeys={["team"]}
      sections={[
        ...sections.slice(0, 2),
        {
          key: "team",
          label: "Care team",
          severity: "critical",
          status: "Could not load",
          children: (
            <p>
              <strong>Could not load the care team.</strong> This list may be incomplete. The rest
              of this record loaded normally.
            </p>
          ),
        },
      ]}
    />
  );
}
