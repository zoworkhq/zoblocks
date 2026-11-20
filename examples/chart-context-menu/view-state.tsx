import { useState } from "react";
import { ChartContextMenu, type ChartMenuAction } from "@/components/zoblocks/chart-context-menu";
import ChartRow from "./_shared/ChartRow";
import { Stage, useHostLog } from "./_shared/useHostLog";

type Density = "comfortable" | "compact";

export default function ViewState() {
  const { handlers, log } = useHostLog(
    "Right-click the column. The toggles change view state, not the record.",
  );
  const [pinned, setPinned] = useState(true);
  const [abnormal, setAbnormal] = useState(false);
  const [density, setDensity] = useState<Density>("comfortable");

  const setView = (action: ChartMenuAction, checked: boolean) => {
    handlers.onToggle(action, checked);
    if (action.id === "pin") setPinned(checked);
    if (action.id === "abn") setAbnormal(checked);
    if (action.radioGroup === "density" && checked) setDensity(action.id as Density);
  };

  return (
    <Stage log={log}>
      <ChartContextMenu
        subject={{ resource: "Encounter", id: "col-vitals", label: "Vitals column" }}
        actions={[
          {
            id: "pin",
            label: "Pin this column",
            tier: "routine",
            kind: "checkbox",
            checked: pinned,
          },
          {
            id: "abn",
            label: "Abnormal values only",
            tier: "routine",
            kind: "checkbox",
            checked: abnormal,
          },
          {
            id: "comfortable",
            label: "Comfortable",
            tier: "routine",
            kind: "radio",
            radioGroup: "density",
            group: "Density",
            checked: density === "comfortable",
          },
          {
            id: "compact",
            label: "Compact",
            tier: "routine",
            kind: "radio",
            radioGroup: "density",
            group: "Density",
            checked: density === "compact",
          },
        ]}
        onToggle={setView}
      >
        {(trigger) => (
          <ChartRow
            trigger={trigger}
            title="Vitals column"
            caption={`Flowsheet · ${pinned ? "pinned" : "unpinned"} · ${abnormal ? "abnormal only" : "all values"} · ${density}`}
          />
        )}
      </ChartContextMenu>
    </Stage>
  );
}
