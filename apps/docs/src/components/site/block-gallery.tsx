"use client";

/**
 * The gallery, and the viewer a frame opens into.
 *
 * Each frame is a link to `/showcase/[slug]`, not a button. The overlay is an
 * enhancement layered on top of that link — it intercepts a plain left click
 * and leaves every other way of following a link alone, so a block stays
 * addressable, shareable, openable in a new tab, and reachable with JavaScript
 * off. A gallery whose only way in is an onClick handler has quietly made its
 * contents unlinkable.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import type { BlockDoc } from "@/lib/blocks";
import { BlockBody, type Viewport } from "@/components/blocks";
import { cn } from "@/lib/utils";

const VIEWPORTS: readonly { id: Viewport; label: string; width: string }[] = [
  { id: "desktop", label: "Desktop", width: "100%" },
  { id: "tablet", label: "Tablet", width: "768px" },
  { id: "mobile", label: "Mobile", width: "390px" },
];

export function BlockGallery({ blocks }: { blocks: readonly BlockDoc[] }) {
  const [open, setOpen] = React.useState<BlockDoc | null>(null);
  /**
   * Set once the click handler is actually attached.
   *
   * Until hydration the frames are plain links and following one navigates —
   * which is the behaviour we want and the reason they are links at all. It
   * also means a test that clicks too early gets a page load instead of the
   * overlay, so the contract is stated in the DOM rather than guessed at with
   * a sleep.
   */
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => setReady(true), []);
  const [vp, setVp] = React.useState<Viewport>("desktop");
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const returnTo = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (open) return;
    returnTo.current?.focus();
  }, [open]);

  /** A modified click is the reader asking for a real navigation. Let it go. */
  const intercept = (e: React.MouseEvent, block: BlockDoc) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    returnTo.current = e.currentTarget as HTMLElement;
    setVp("desktop");
    setOpen(block);
  };

  return (
    <>
      <div
        className="grid gap-6 lg:grid-cols-2"
        data-gallery
        {...(ready ? { "data-ready": "" } : {})}
      >
        {blocks.map((block, index) => (
          <article
            key={block.slug}
            data-reveal
            style={{ ["--enter-delay" as string]: `${index * 70}ms` }}
          >
            <Link
              href={`/showcase/${block.slug}`}
              onClick={(e) => intercept(e, block)}
              className="group block overflow-hidden rounded-2xl border border-rule bg-paper-sunk transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-rule-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
                <span className="numeric text-[0.6875rem] tracking-wide text-brand-deep">
                  {block.slug}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-graphite-soft transition-colors group-hover:text-ink">
                  Open
                  <ArrowUpRight aria-hidden="true" className="size-3" />
                </span>
              </div>

              {/* A scaled rendering, genuinely inert.
                  `aria-hidden` alone was a violation: the preview is a whole
                  application tree, so hiding it from the accessibility tree
                  while its buttons stayed tabbable left keyboard users landing
                  on controls a screen reader could not announce. `inert`
                  removes them from the tab order as well, which is the half
                  `aria-hidden` never did. */}
              <div className="relative h-[248px] overflow-hidden border-b border-rule bg-paper">
                <div
                  aria-hidden="true"
                  inert
                  className="pointer-events-none origin-top-left"
                  style={{ transform: "scale(.52)", width: "192.3%", height: "192.3%" }}
                >
                  <BlockBody slug={block.slug} />
                </div>
              </div>

              <div className="px-4 py-4">
                <h3 className="text-[1.0625rem] font-semibold tracking-tight">{block.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-graphite">{block.blurb}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {block.uses.map((u) => (
                    <span
                      key={u}
                      className="numeric rounded-md border border-rule bg-paper px-1.5 py-0.5 text-[0.625rem] text-graphite-soft"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-paper/95 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="oxb-viewer-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(null);
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-rule bg-paper-sunk px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="numeric text-xs text-brand-deep">{open.slug}</span>
              <span id="oxb-viewer-title" className="truncate font-semibold tracking-tight">
                {open.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {VIEWPORTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={vp === v.id}
                  onClick={() => setVp(v.id)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                    vp === v.id
                      ? "border-ink bg-ink text-paper"
                      : "border-rule text-graphite hover:border-rule-strong hover:text-ink",
                  )}
                >
                  {v.label}
                </button>
              ))}
              <Link
                href={`/showcase/${open.slug}`}
                className="rounded-lg border border-rule px-2.5 py-1.5 text-xs text-graphite transition-colors hover:border-rule-strong hover:text-ink"
              >
                Open page
              </Link>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rule px-2.5 py-1.5 text-xs text-graphite transition-colors hover:border-rule-strong hover:text-ink"
              >
                Close
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 justify-center overflow-auto p-5">
            <div
              className="w-full overflow-hidden rounded-2xl border border-rule bg-paper shadow-[0_18px_40px_-20px_rgba(0,0,0,.5)] transition-[max-width] duration-500 ease-[var(--ease-out-expo)]"
              style={{
                maxWidth: vp === "desktop" ? "1140px" : VIEWPORTS.find((v) => v.id === vp)?.width,
              }}
            >
              <BlockBody slug={open.slug} vp={vp} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
