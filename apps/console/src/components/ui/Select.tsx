import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlClasses } from "./control";

/**
 * A native select, dressed to match the rest of the kit.
 *
 * Native rather than a custom listbox, deliberately. The lists here are short —
 * four roles, three themes, a handful of versions — and the platform control is
 * already keyboard-operable, screen-reader-correct, typeahead-searchable and
 * on a phone it opens the system picker. A custom one would be a week of work
 * to reach parity and would lose the phone behaviour.
 *
 * What the platform does *not* give is a consistent appearance, which is why
 * this exists: five screens had each hand-written their own class string and
 * only one of them had a focus ring.
 *
 * `appearance-none` plus our own chevron, because the UA arrow cannot be
 * recoloured and sat wrong against a dark ground.
 */
export function Select({
  className,
  invalid,
  mono,
  size = "md",
  children,
  ...props
  // `size` is omitted from the DOM props on purpose: `<select size>` is the
  // number of visible rows, and intersecting it with our own union collapses
  // the type to `never`. A multi-row select is a listbox and would want its own
  // component anyway.
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  invalid?: boolean;
  mono?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <span className="relative inline-flex w-full items-center">
      <select
        {...props}
        aria-invalid={invalid || props["aria-invalid"]}
        className={cn(
          controlClasses({ invalid, mono, size }),
          // Room for the chevron, which is decorative and sits over the field.
          "cursor-pointer appearance-none",
          size === "md" ? "pr-9" : "pr-8",
          className,
        )}
      >
        {children}
      </select>

      <ChevronDown
        aria-hidden="true"
        strokeWidth={2}
        className={cn(
          "pointer-events-none absolute text-graphite-soft",
          size === "md" ? "right-3 size-4" : "right-2.5 size-3.5",
        )}
      />
    </span>
  );
}
