import { useEffect, useRef, useState } from "react";
import {
  ChartContextMenu,
  type Availability,
  type ChartMenuAction,
} from "@/components/zoblocks/chart-context-menu";
import ChartRow from "./_shared/ChartRow";
import { copyAsText, history, now, openOrder, order } from "./_shared/chart";
import { Stage, useHostLog } from "./_shared/useHostLog";

export default function PendingInPlace() {
  const { handlers, log, say } = useHostLog(
    "Open the menu and watch Copy: it is checked in place, never appended.",
  );

  // The availability check: unanswered on every open, answered 1.5s later.
  const [canCopy, setCanCopy] = useState<Availability | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const actions: ChartMenuAction[] = [
    openOrder,
    { ...copyAsText, availability: canCopy ?? { status: "pending" } },
    history,
  ];

  return (
    <Stage log={log}>
      <ChartContextMenu
        subject={order}
        actions={actions}
        now={now}
        onOpenChange={(open) => {
          clearTimeout(timer.current);
          setCanCopy(null);
          if (!open) return;
          timer.current = setTimeout(() => {
            setCanCopy({ status: "available" });
            say("Availability check resolved — Copy is now available");
          }, 1500);
        }}
        {...handlers}
      >
        {(trigger) => <ChartRow trigger={trigger} subject={order} aside="14:00" />}
      </ChartContextMenu>
    </Stage>
  );
}
