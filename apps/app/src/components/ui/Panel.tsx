import { cn } from "@/lib/utils";

/**
 * A titled region.
 *
 * `tone` is the depth rule made into a prop, so it cannot drift screen by
 * screen: `surface` for content a reader edits or scans, `instrument` for
 * anything that is *rendering* something — a live preview, a snippet, a
 * validation readout. The instrument stays dark in both themes because it is
 * hardware rather than document, and keeping it the lit object is what stops
 * the app flattening into a generic admin grid.
 */
export function Panel({
  id,
  title,
  description,
  actions,
  footer,
  tone = "surface",
  padded = true,
  className,
  children,
}: {
  /** An anchor target, for a link that jumps to one panel on a long screen. */
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** A fixed home for a panel-scoped action, so it never floats in the flow. */
  footer?: React.ReactNode;
  tone?: "surface" | "instrument";
  /** Off for a panel whose child manages its own edges — a table, a preview. */
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const instrument = tone === "instrument";

  return (
    <section
      id={id}
      className={cn(instrument ? "instrument" : "surface", "overflow-hidden", className)}
    >
      {(title || actions) && (
        <div
          className={cn(
            "flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b px-5 py-4",
            instrument ? "border-panel-rule" : "border-rule",
          )}
        >
          {/*
            `flex-1 basis-[18rem]`, for the reason `PageHeader` carries the
            same pair: a wrapping flex container wraps before it shrinks, so a
            long description pushed the panel's action onto its own line while
            a short one left it inline — two panels side by side, each putting
            Copy somewhere different. A growing base fixes the position; the
            floor is what still wraps on a narrow screen.
          */}
          <div className="min-w-0 flex-1 basis-[18rem]">
            {title && (
              <h2
                className={cn(
                  "font-display text-[0.9375rem] font-semibold tracking-[-0.008em]",
                  instrument && "text-panel-fg",
                )}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className={cn(
                  "body-sm mt-1 max-w-[64ch]",
                  instrument ? "text-panel-muted" : "text-graphite",
                )}
              >
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className={cn(padded && "p-5")}>{children}</div>

      {footer && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3",
            instrument ? "border-panel-rule bg-panel-raised" : "border-rule bg-paper-sunk",
          )}
        >
          {footer}
        </div>
      )}
    </section>
  );
}
