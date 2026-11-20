import * as React from "react";
import DemoSection from "./_shared/DemoSection";
import { Switch, type CommitPhase } from "@/components/zoblocks/switch";

const PHASES = [
  { phase: "idle", note: "nothing in flight" },
  { phase: "pending", note: "sent, awaiting the record — still focusable" },
  { phase: "committed", note: "landed" },
  { phase: "reverted", note: "we tried and it failed; retry is reasonable" },
  { phase: "blocked", note: "refused before trying; retry fails identically" },
  { phase: "queued", note: "never sent — offline, and cancellable" },
  { phase: "stale", note: "somebody else's write landed" },
] as const satisfies ReadonlyArray<{ phase: CommitPhase; note: string }>;

export default function EveryPhaseDemo() {
  const [index, setIndex] = React.useState(0);
  const active = PHASES[index]!;

  return (
    <DemoSection>
      <div className="flex flex-wrap gap-1.5">
        {PHASES.map((item, itemIndex) => (
          <button
            key={item.phase}
            type="button"
            aria-pressed={itemIndex === index}
            onClick={() => setIndex(itemIndex)}
            className="rounded-md border border-[var(--zb-border)] px-2.5 py-1 text-sm text-[var(--zb-text)]"
          >
            {item.phase}
          </button>
        ))}
      </div>
      <Switch
        label="Contact precautions"
        description="Gown and gloves on entry."
        stateLabels="in-effect"
        tone="caution"
        size="large"
        checked
        phase={active.phase}
        requested={active.phase === "queued" || active.phase === "pending" ? false : undefined}
        serverValue={active.phase === "stale" ? false : undefined}
        error={
          active.phase === "reverted"
            ? "Could not reach the record."
            : active.phase === "blocked"
              ? "Your role cannot change precautions on this unit."
              : undefined
        }
      />
      <p className="m-0 text-sm text-[var(--zb-text-muted)]" aria-live="polite">
        {active.phase} — {active.note}
      </p>
    </DemoSection>
  );
}
