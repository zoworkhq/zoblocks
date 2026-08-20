import { Check, X } from "lucide-react";
import { StatusChip } from "./StatusChip";

/**
 * A measured contrast ratio, against the floor it has to clear.
 *
 * Never a bare tick. The number is the part a customer can act on — "5.82:1"
 * beside "needs 4.5:1" tells them they have headroom, and "2.14:1" tells them
 * how far they have to move. A green check tells them nothing and a red one
 * tells them less.
 *
 * The WCAG criterion is named too, because a designer who has to justify the
 * change to someone else needs the reference, and looking it up is friction
 * that ends with the rule being argued with rather than met.
 */
export function ContrastBadge({
  ratio,
  floor,
  criterion,
  against,
}: {
  /** As measured. Rounded for display only — never for the comparison. */
  ratio: number;
  floor: number;
  /** "SC 1.4.3 (text)" or "SC 1.4.11 (interface component)". */
  criterion?: string;
  /** The token it was measured against, when that is not obvious from context. */
  against?: string;
}) {
  const passes = ratio >= floor;

  return (
    <span className="inline-flex items-center gap-2">
      <StatusChip
        tone={passes ? "pass" : "fail"}
        icon={
          passes ? (
            <Check aria-hidden="true" strokeWidth={2.5} className="size-3" />
          ) : (
            <X aria-hidden="true" strokeWidth={2.5} className="size-3" />
          )
        }
      >
        <span className="tabular">{ratio.toFixed(2)}:1</span>
      </StatusChip>
      <span className="tabular text-[0.6875rem] leading-snug text-graphite">
        needs {floor}:1{against && <> on {against}</>}
        {criterion && <> · {criterion}</>}
      </span>
    </span>
  );
}
