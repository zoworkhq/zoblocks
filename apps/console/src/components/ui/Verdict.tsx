import { Check, X } from "lucide-react";
import { StatusChip } from "./StatusChip";

/**
 * The outcome of a check, as distinct from a state.
 *
 * Green was doing two jobs. `tone="pass"` marked both "this cleared the
 * accessibility gate" and "this version is currently live" — a verdict and a
 * state, in the same colour, in a product whose entire claim is that colour
 * carries validated meaning. A reader had no way to tell which they were
 * looking at.
 *
 * A wrapper rather than a second chip. `StatusChip` already renders the box and
 * already accepts an icon; duplicating that to add one guarantee would give the
 * console two chips to keep in visual step. What this adds is the guarantee: a
 * verdict is *always* accompanied by its mark, so pass and fail are
 * distinguishable with the colour removed entirely — not merely tinted
 * differently. States keep `StatusChip` and lose the pass-green, so the two
 * stop competing for the same signal.
 */
export function Verdict({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <StatusChip
      tone={ok ? "pass" : "fail"}
      icon={
        ok ? (
          <Check aria-hidden="true" size={10} strokeWidth={3} />
        ) : (
          <X aria-hidden="true" size={10} strokeWidth={3} />
        )
      }
    >
      {children}
    </StatusChip>
  );
}
