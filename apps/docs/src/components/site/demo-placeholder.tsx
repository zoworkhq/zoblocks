/**
 * DemoPlaceholder — holds a live-demo slot open while the catalog is rebuilt.
 *
 * The homepage instrument and the two-renderer comparison mounted real registry
 * components. Those components were cleared so the library can be planned and
 * built from scratch, and the demos will be rewritten against the new ones.
 * Rather than delete the sections around them (the argument each section makes
 * still stands), the slot keeps its instrument frame and says plainly that the
 * demo is not there yet — the same honesty the fallbacks in ComponentPreview
 * and ShowcasePreview already practise.
 *
 * Server component on purpose: no state, no glow, nothing to hydrate.
 */

export function DemoPlaceholder({
  label = "Live demo",
  children = "This demo returns with the rebuilt component catalog.",
}: {
  label?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="instrument instrument-demo">
      <div className="relative flex items-center justify-between gap-4 border-b border-panel-rule px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-panel-muted/60" aria-hidden="true" />
          <span className="eyebrow text-panel-muted">{label}</span>
        </div>
        <span className="eyebrow hidden text-panel-muted sm:block">catalog rebuilding</span>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <p className="max-w-md text-center text-sm leading-relaxed text-panel-muted">{children}</p>
      </div>
    </div>
  );
}
