import { ChartContextMenu } from "@/components/zoblocks/chart-context-menu";
import ChartRow from "./_shared/ChartRow";
import { buprenorphineOrder, serverTime } from "./_shared/chart";
import { Stage, useHostLog } from "./_shared/useHostLog";

export default function DisclosureRecord() {
  // Stands in for the host's audit log: every record lands here.
  const { handlers, log } = useHostLog(
    "Choose Reveal Part 2, then pick a reason — or press Escape and watch it record anyway.",
  );

  return (
    <Stage log={log}>
      <ChartContextMenu
        subject={buprenorphineOrder}
        actions={[
          { id: "open", label: "Open order", tier: "routine" },
          {
            id: "part2",
            label: "Reveal Part 2 program notes",
            tier: "disclosive",
            applies: ["MedicationRequest"],
            reasons: [
              "Treatment of this patient",
              "Medical emergency (42 CFR §2.51)",
              "Written patient consent on file",
            ],
          },
        ]}
        policy={{ role: "a registered nurse", breakGlass: true }}
        now={serverTime}
        onRun={handlers.onRun}
        onDisclose={(record) => handlers.onDisclose(record)}
      >
        {(trigger) => <ChartRow trigger={trigger} subject={buprenorphineOrder} aside="08:00" />}
      </ChartContextMenu>
    </Stage>
  );
}
