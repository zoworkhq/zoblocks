"use client";

/**
 * Small client-side interactions shared across the page.
 *
 * Each of these degrades to something useful: the install command is
 * selectable text before it is a copy button, reveals start visible if the
 * observer never runs, and the glow simply never appears without a pointer.
 */

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Install command
// ---------------------------------------------------------------------------

export function InstallCommand({
  command,
  className,
  size = "lg",
  note,
}: {
  command: string;
  className?: string;
  size?: "sm" | "lg";
  /**
   * Rendered under the command. Used to state the `components.json` registry
   * entry the CLI needs — without it `@oxygenui/…` resolves to nothing and the
   * add fails before it reaches the network, which reads as a broken library
   * rather than a missing line of config.
   */
  note?: React.ReactNode;
}) {
  const [copied, setCopied] = React.useState(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timeout.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      // Clipboard can be blocked by permissions or a non-secure origin. The
      // command is still on screen and selectable, so fail quietly rather
      // than throwing an error at someone who can just select it.
      return;
    }
    setCopied(true);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), 2000);
  }

  const box = (
    <div
      className={cn(
        "group inline-flex w-full max-w-full items-center gap-3 rounded-xl border border-panel-rule bg-panel text-left",
        "transition-[transform,box-shadow] duration-300 ease-[var(--ease-out-expo)]",
        "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-16px_rgb(2_20_17/0.5)]",
        size === "lg" ? "px-4 py-3.5 sm:px-5" : "px-3 py-2.5",
        className,
      )}
    >
      <span aria-hidden="true" className="select-none font-mono text-sm text-trace/70">
        $
      </span>

      <code
        tabIndex={0}
        aria-label={`Install command: ${command}`}
        className={cn(
          "scroll-hidden min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-panel-fg/95",
          size === "lg" ? "text-[0.8125rem] sm:text-sm" : "text-xs",
        )}
      >
        {command}
      </code>

      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Command copied" : `Copy command: ${command}`}
        className={cn(
          "relative flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5",
          "font-mono text-[0.6875rem] uppercase tracking-wider",
          "transition-colors duration-200",
          copied
            ? "bg-trace/15 text-trace"
            : "text-panel-muted hover:bg-panel-fg/8 hover:text-panel-fg",
        )}
      >
        {copied ? (
          <Check aria-hidden="true" className="size-3.5" />
        ) : (
          <Copy aria-hidden="true" className="size-3.5" />
        )}
        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
      </button>

      {/* Announced without moving focus or disturbing the button's label. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Command copied to clipboard" : ""}
      </span>
    </div>
  );

  if (!note) return box;

  return (
    <div className="w-full">
      {box}
      <p className="mt-2.5 text-xs leading-relaxed text-graphite-soft">{note}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scroll reveal
// ---------------------------------------------------------------------------

/**
 * One observer for the whole page, attached at the root. Elements opt in with
 * `data-reveal`; the CSS handles the transition. Content is styled visible if
 * this never runs, so a failed observer degrades to a static page rather than
 * an invisible one.
 */
export function RevealRoot({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((el) => el.setAttribute("data-revealed", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "true");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Instrument glow
// ---------------------------------------------------------------------------

/**
 * Writes pointer position into CSS custom properties so the bezel can light
 * under the cursor. Pointer-only and passive — no effect on touch, and none
 * at all under reduced motion.
 */
export function InstrumentGlow() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = ref.current;
    const panel = node?.parentElement;
    if (!node || !panel) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    function onMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = panel!.getBoundingClientRect();
        node!.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
        node!.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
      });
    }

    panel.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      panel.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="instrument-glow" aria-hidden="true" />;
}

// ---------------------------------------------------------------------------
// Counter
// ---------------------------------------------------------------------------

/** Counts up once, when scrolled into view. Static under reduced motion. */
export function Counter({
  to,
  suffix = "",
  duration = 1100,
  className,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        let frame = 0;

        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          // Ease-out-expo: fast arrival, gentle settle.
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setValue(Math.round(eased * to));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={cn("numeric", className)}>
      {value}
      {suffix}
    </span>
  );
}
