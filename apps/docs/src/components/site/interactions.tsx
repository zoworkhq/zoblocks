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
   * entry the CLI needs — without it `@zoblocks/…` resolves to nothing and the
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
      <span aria-hidden="true" className="select-none font-mono text-sm text-trace">
        $
      </span>

      {/*
        It wraps rather than scrolls.

        `whitespace-nowrap` with `overflow-x-auto` meant a command wider than
        its box was simply not shown: at 1024px the homepage hero rendered
        "npx @zoblocks/cli…" of a 344px line in 279px, and on a phone less than
        three quarters of it. A scrollbar is not a disclosure — the reader has
        to discover there is more and then drag for it, and the thing hidden is
        the one instruction the page is asking them to run.

        These commands break at spaces, so wrapping lands between arguments
        rather than mid-token. `tabIndex` went with the overflow: it was there
        because a scrollable region must be reachable by keyboard (WCAG 2.1.1),
        and a non-scrolling, non-interactive element carrying a tab stop is one
        press between the reader and the Copy button for nothing.
      */}
      <code
        aria-label={`Install command: ${command}`}
        className={cn(
          "min-w-0 flex-1 break-words font-mono text-panel-fg/95",
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
 * One observer for the whole page. Elements opt in with `data-reveal`; the CSS
 * handles the transition.
 *
 * Two rules earned by getting this wrong twice, both worth stating.
 *
 * **The sweep repeats.** It used to run `querySelectorAll` once, on mount, so
 * anything that arrived later was never observed. Every gallery switches
 * chapters with a control, so each chapter mounts long after that — and under
 * a CSS default of `opacity: 0` "never observed" means invisible, permanently.
 * Every chapter after the first, on every component page, was a blank slab. A
 * MutationObserver now re-runs the sweep whenever nodes are added.
 *
 * **Nothing is hidden until hiding is known to be reversible.** The fix for
 * the above was to hide an element as the observer began watching it, which
 * failed harder: an IntersectionObserver computes nothing while the document
 * is hidden, so a page opened in a background tab hid all 58 of its elements
 * and revealed none. The flag that switches hiding on is therefore written
 * from inside the **first delivered callback** — the only proof that
 * intersections are being computed at all — and a `visibilitychange` listener
 * covers the tab that starts hidden and is brought forward later.
 */
export function RevealRoot({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const root = document.documentElement;
    const pending = () =>
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])");
    const revealAll = () => pending().forEach((el) => el.setAttribute("data-revealed", "true"));

    // Under reduced motion there is no animation to stage, so everything is
    // simply marked revealed and the live flag is never set.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealAll();
      const mutations = new MutationObserver(revealAll);
      mutations.observe(document.body, { subtree: true, childList: true });
      return () => mutations.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Proof that intersections are being computed. Only now is it safe for
        // the stylesheet to hide anything, because only now is something able
        // to show it again.
        root.setAttribute("data-reveal-live", "");
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "true");
          observer.unobserve(entry.target);
        }
      },
      // `threshold: 0`, not a fraction. A fraction is a share of the *element*,
      // so anything taller than the viewport can never satisfy it: a 14,906px
      // section needed 1,490px on screen in a 900px window, never intersected,
      // and stayed invisible however far you scrolled. The bottom `rootMargin`
      // is what actually paces the reveal, and it works at any height.
      { rootMargin: "0px 0px -12% 0px", threshold: 0 },
    );

    const sweep = () => pending().forEach((el) => observer.observe(el));

    // Batched: one React commit can add hundreds of nodes, and the sweep is a
    // document-wide query.
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        sweep();
      });
    };

    sweep();
    // `childList` only. Revealing writes an attribute, and watching attributes
    // as well would feed the observer its own output.
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { subtree: true, childList: true });

    // A tab that was hidden at load has had no intersections computed. When it
    // comes forward the observer resumes on its own, but the sweep is re-run
    // in case anything mounted meanwhile.
    const onVisible = () => {
      if (document.visibilityState === "visible") sweep();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      mutations.disconnect();
      observer.disconnect();
      // Leaving the flag set would hide everything the next observer has not
      // reached yet.
      root.removeAttribute("data-reveal-live");
    };
  }, []);

  return <>{children}</>;
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

  /*
   * Starts at the answer, not at zero.
   *
   * It initialised at 0 and only reached `to` once an IntersectionObserver
   * fired, which meant the server rendered "0 STATES" and "0 MODES" under
   * headings reading "Result states per component" and "Density modes". That
   * is what a crawler indexes, what a link preview screenshots, what a reader
   * with JavaScript blocked keeps, and what anybody who does not scroll past
   * the fold sees — the home page's proof section claiming the product has
   * none of the thing it is proving.
   *
   * So the value is the initial state and the animation is the enhancement:
   * `count` drops to zero and runs up only after we know the element is both
   * mounted and visible. Nothing can leave the number at zero any more,
   * because zero is no longer where it starts.
   */
  const [count, setCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Nothing to animate to, and nothing gained by animating to it.
    if (to === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
          // Settles on `to` exactly rather than on whatever the easing rounds
          // to, so the last frame cannot land one short of the real figure.
          setCount(progress === 1 ? to : Math.round(eased * to));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };

        setCount(0);
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
      {count ?? to}
      {suffix}
    </span>
  );
}
