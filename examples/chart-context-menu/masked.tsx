import { ChartContextMenu } from "@/components/zoblocks/chart-context-menu";
import ChartRow from "./_shared/ChartRow";
import { note, noteActions, now } from "./_shared/chart";
import { Stage, useHostLog } from "./_shared/useHostLog";

export default function MaskedSubject() {
  const { handlers, log } = useHostLog();

  return (
    <Stage log={log}>
      <ChartContextMenu
        subject={{
          resource: "DocumentReference",
          id: note.id,
          label: "Group therapy note — Nwosu, C.",
          detail: "Signed by R. Adeyemi, LPC",
          masked: true,
        }}
        actions={noteActions}
        policy={{ role: "a registered nurse", breakGlass: true }}
        now={now}
        {...handlers}
      >
        {/* The row hides whose note this is, so the menu does too. */}
        {(trigger) => (
          <ChartRow
            trigger={trigger}
            title="Restricted record"
            caption="42 CFR Part 2 · not disclosed"
            aside="28 Aug"
          />
        )}
      </ChartContextMenu>
    </Stage>
  );
}
