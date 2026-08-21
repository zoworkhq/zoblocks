import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/**
 * Two sizes, and no third.
 *
 * `sm` exists for controls that sit inside a table row or beside a field, which
 * is the only place the default was genuinely too big. Before this there were
 * seven call sites passing their own `px-2 py-1` or `px-2.5 py-1.5`, so "small"
 * meant four different things depending on which screen you were on.
 *
 * `icon` is square: a button whose whole content is a glyph should not inherit
 * the horizontal padding of one that holds a word.
 */
export type ButtonSize = "sm" | "md" | "icon";

const SIZES: Record<ButtonSize, string> = {
  md: "px-3.5 py-2 text-[0.8125rem]",
  sm: "px-2.5 py-1.5 text-[0.75rem]",
  icon: "p-1.5",
};

/**
 * The button's appearance, separated from the button.
 *
 * Because a good third of this console's actions are *navigations* — "New
 * theme", "Back to sign in" — and those must be `<a>`. Rendering a `<button>`
 * that calls `router.push` breaks the middle-click, the open-in-new-tab, the
 * copy-link and the status bar preview, and it hands a screen reader the wrong
 * role. So a link that looks like a button takes the classes and stays a link.
 *
 * The alternative — an `asChild` prop cloning its child — needs a Slot
 * implementation and makes the rendered element invisible at the call site.
 */
export function buttonClasses({
  variant = "secondary",
  size = "md",
  blocked = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  blocked?: boolean;
  className?: string;
} = {}): string {
  return cn(
    /*
     * `border` on the base, not per variant.
     *
     * `primary` and `ghost` had no border while `secondary` and `danger` had
     * one, so with identical padding a primary rendered 37px and a secondary
     * 39px. Side by side — which is where buttons live — they did not line up,
     * and the small size drifted the same 2px between 32 and 34.
     *
     * A transparent border costs nothing, keeps every variant one box, and
     * means a variant that gains a visible border later does not resize.
     */
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent font-medium",
    SIZES[size],
    "transition-[background-color,border-color,color] duration-200",
    !blocked && variant === "primary" && "bg-cta text-paper hover:opacity-90",
    !blocked && variant === "secondary" && "border-rule-strong bg-paper hover:bg-paper-sunk",
    !blocked && variant === "ghost" && "text-oxygen-deep hover:bg-accent-wash",
    !blocked &&
      variant === "danger" &&
      "border-fail/30 bg-fail-wash text-fail hover:bg-fail-wash/70",
    blocked && "cursor-not-allowed border-rule bg-paper-sunk text-graphite-soft",
    className,
  );
}

/**
 * The one button.
 *
 * `reason` is the important prop. A control the reader may not use is shown
 * disabled *with the reason*, never hidden — hiding it teaches them the feature
 * does not exist. And it uses `aria-disabled` rather than `disabled`, so the
 * control stays focusable and its explanation stays reachable by keyboard; a
 * `disabled` button takes its own tooltip out of the accessibility tree.
 */
export function Button({
  variant = "secondary",
  size = "md",
  reason,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Present means blocked. Rendered beneath and bound with aria-describedby. */
  reason?: string;
}) {
  const blocked = Boolean(reason);
  const reasonId = blocked ? `${props.id ?? "action"}-reason` : undefined;

  const button = (
    <button
      {...props}
      aria-disabled={blocked || undefined}
      aria-describedby={reasonId ?? props["aria-describedby"]}
      onClick={blocked ? (event) => event.preventDefault() : props.onClick}
      className={buttonClasses({ variant, size, blocked, className })}
    >
      {children}
    </button>
  );

  if (!blocked) return button;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      {button}
      <span id={reasonId} className="max-w-[34ch] text-[0.6875rem] leading-snug text-graphite">
        {reason}
      </span>
    </span>
  );
}
