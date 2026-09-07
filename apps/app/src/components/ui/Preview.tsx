import { cn } from "@/lib/utils";

/**
 * The achromatic zone.
 *
 * The one addition this app makes to the docs vocabulary, and it exists
 * because of a real failure mode: a ZoBlocks-teal control sitting beside a
 * customer's teal swatch makes the customer's swatch look wrong, and they will
 * change a colour that was fine. So inside a preview the chrome drops its hue —
 * `.preview-region` redefines the accent tokens to neutrals — and the only
 * saturated thing on screen belongs to the customer.
 *
 * This is deliberately scoped. The instinct that produced it was right; applying
 * it to the whole product, which is what the first version of this app did,
 * produced a generic admin panel wearing none of ZoBlocks's identity.
 */
export function Preview({
  label,
  tokens,
  theme,
  density,
  className,
  children,
}: {
  /** Names the region, since it contains live components rather than content. */
  label: string;
  /** Custom properties applied to the subtree — a draft theme, mid-edit. */
  tokens?: Record<string, string | undefined>;
  theme?: "light" | "dark" | "high-contrast";
  density?: "patient" | "standard" | "clinical";
  className?: string;
  children: React.ReactNode;
}) {
  const style = Object.fromEntries(
    Object.entries(tokens ?? {}).filter(([key, value]) => key.startsWith("--") && value),
  ) as React.CSSProperties;

  return (
    <section aria-label={label} className={cn("preview-region p-4", className)}>
      {/*
        The preview paints itself with the theme it is previewing.
        
        It used to take the app's own `bg-paper` while applying the
        customer's `--zb-text` on top — so a light theme previewed on a dark
        app page rendered near-black text on a near-black ground. The axe
        sweep caught it as a contrast failure on the switch label, which is
        exactly what a reader would have seen.
        
        `--zb-bg` and `--zb-text` are set on this element by `tokens`, so
        reading them here is reading the draft rather than the chrome. The
        literal fallbacks matter for the same reason every component's do: a
        preview rendered before the token stylesheet loads should be legible
        rather than transparent.
      */}
      <div
        style={{
          ...style,
          background: "var(--zb-bg, #ffffff)",
          color: "var(--zb-text, #0f172a)",
        }}
        {...(theme ? { "data-zb-theme": theme } : {})}
        {...(density ? { "data-zb-density": density } : {})}
        className="rounded-lg p-4"
      >
        {children}
      </div>
    </section>
  );
}
