import { cn } from "@/lib/utils";

export type ChipTone = "neutral" | "pass" | "fail" | "warn" | "accent" | "locked";

/**
 * A state, in a word.
 *
 * The library's own rule, carried into its app: severity is never colour
 * alone. Every chip renders text, and the colour reinforces it — so the whole
 * interface survives greyscale printing, colour-vision deficiency, and forced-
 * colours mode without losing a single piece of information.
 *
 * `locked` is its own tone rather than a neutral chip with a padlock, because
 * it appears beside 84 clinical tokens and needs to read as *deliberate* rather
 * than as *unavailable*.
 */
export function StatusChip({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: ChipTone;
  /** Decorative. The word is what carries the meaning. */
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5",
        "font-mono text-[0.625rem] font-medium uppercase tracking-[0.09em]",
        tone === "neutral" && "border border-rule bg-paper-sunk text-graphite",
        tone === "pass" && "bg-pass-wash text-pass",
        tone === "fail" && "bg-fail-wash text-fail",
        tone === "warn" && "bg-warn-wash text-warn",
        tone === "accent" && "bg-accent-wash text-oxygen-deep",
        tone === "locked" && "border border-rule bg-paper-sunk text-graphite-soft",
        className,
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
