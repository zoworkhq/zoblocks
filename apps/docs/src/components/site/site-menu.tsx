"use client";

/**
 * The site navigation on a phone.
 *
 * Below `md` the header hides its links, and nothing replaced them: a reader
 * on a phone had the logo, a search icon and the footer. This gives them the
 * same three destinations the desktop bar carries.
 *
 * A floating drawer from the right, lit by a faint Zowork-gradient aurora. The page behind is dimmed and inert, focus
 * stays inside, and Close, Escape or a tap outside dismisses it. The scrim is
 * black in both themes: it was `ink/40`, and `ink` is near-white in dark
 * theme, so the page below turned a muddy grey. Its top bar is drawn at the header's own height —
 * 64px at rest, 52px once scrolled — so Close lands exactly where Menu was.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Github, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { restoreFocus } from "@/components/site/interactions";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { ZOWORK_HREF } from "@/lib/zowork";

const LINKS = [
  { href: "/components", label: "Components" },
  { href: "/showcase", label: "Blocks" },
  { href: "/premium", label: "Premium" },
] as const;

/* The pulse grid: blocks ripple out from the centre while a heartbeat runs across them. */
const GRID_COLS = 9;
const GRID_ROWS = 5;
const GRID_CELLS = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
  const x = (i % GRID_COLS) - (GRID_COLS - 1) / 2;
  const y = Math.floor(i / GRID_COLS) - (GRID_ROWS - 1) / 2;
  return Math.round(Math.hypot(x, y) * 110);
});

function PulseGrid({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Link
      href="/components"
      onClick={onNavigate}
      className="site-menu-pulse group relative mx-2 mt-auto mb-3 block overflow-hidden rounded-2xl border border-rule p-4"
    >
      <span aria-hidden="true" className="relative block">
        <span className="site-menu-grid">
          {GRID_CELLS.map((delay, i) => (
            <i key={i} style={{ "--d": `${delay}ms` } as React.CSSProperties} />
          ))}
        </span>
        <svg className="site-menu-ecg" viewBox="0 0 180 100">
          <path
            className="is-trace"
            pathLength={100}
            d="M0 56 H62 L70 56 L78 30 L88 84 L98 14 L108 72 L116 56 H180"
          />
          <path
            className="is-beat"
            pathLength={100}
            d="M0 56 H62 L70 56 L78 30 L88 84 L98 14 L108 72 L116 56 H180"
          />
        </svg>
      </span>
      <span className="relative mt-4 flex items-end justify-between gap-3">
        <span className="flex flex-col gap-0.5">
          <span className="font-display text-[0.9375rem] font-semibold text-ink">
            Healthcare UI, in blocks
          </span>
          <span className="text-xs text-graphite">Typed to FHIR. Built to be read.</span>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 text-graphite transition-transform duration-300 group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

/** `h-16` and `h-13` in `SiteHeader`. */
const BAR_AT_REST = 64;
const BAR_SCROLLED = 52;

const SQUARE =
  "inline-flex size-10 items-center justify-center rounded-lg border border-rule bg-paper-sunk/60 text-graphite transition-colors duration-200 hover:border-rule-strong hover:text-ink";

export function SiteMenu({ mark }: { mark: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [bar, setBar] = React.useState(BAR_AT_REST);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => setMounted(true), []);

  // Any navigation closes it, the back button included.
  React.useEffect(() => setOpen(false), [pathname]);

  // Widening into the desktop bar closes it too: the links are back on screen.
  React.useEffect(() => {
    if (!open) return;
    const wide = window.matchMedia("(min-width: 48rem)");
    const onChange = () => {
      if (wide.matches) setOpen(false);
    };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [open]);

  // Lock scroll, hide the page from assistive tech, trap focus, restore it on close.
  React.useEffect(() => {
    if (!open) return;
    const app = document.getElementById("app-root");
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    app?.setAttribute("aria-hidden", "true");
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [
        ...panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      app?.removeAttribute("aria-hidden");
      restoreFocus(previouslyFocused, triggerRef.current);
    };
  }, [open]);

  function show() {
    // Read the header's settled state, not its box: the height animates for
    // 500ms after crossing the scroll threshold.
    const header = triggerRef.current?.closest("[data-site-header]");
    setBar(header?.hasAttribute("data-scrolled") ? BAR_SCROLLED : BAR_AT_REST);
    setOpen(true);
  }

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={show}
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(SQUARE, "ml-1 md:hidden")}
      >
        <Menu aria-hidden="true" className="size-4" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden">
            <div aria-hidden="true" onClick={close} className="site-menu-scrim absolute inset-0" />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="site-menu-panel absolute inset-y-2 right-2 flex w-[min(20rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-3xl border border-rule bg-paper shadow-2xl"
            >
              <span aria-hidden="true" className="site-menu-aurora" />
              <div
                className="relative flex shrink-0 items-center justify-between gap-4 pr-3 pl-5"
                style={{ height: bar }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Link
                    href="/"
                    onClick={close}
                    aria-label="ZoBlocks home"
                    className="flex min-h-6 items-center gap-2.5 text-ink"
                  >
                    {mark}
                    <span className="font-display text-[0.9375rem] font-semibold tracking-tight">
                      ZoBlocks
                    </span>
                  </Link>
                  {/* A separate link: the wordmark goes home, the maker goes to its site. */}
                  <a
                    href={ZOWORK_HREF}
                    rel="noopener"
                    className="-ml-1 inline-flex min-h-6 items-center text-[0.8125rem] whitespace-nowrap text-graphite"
                  >
                    by&nbsp;<span className="zw-by-name font-semibold">Zowork</span>
                  </a>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className={SQUARE}
                >
                  <X aria-hidden="true" className="site-menu-close size-4" />
                </button>
              </div>

              <nav aria-label="Main" className="relative flex min-h-0 flex-1 flex-col px-3">
                <ul className="flex flex-col gap-1 overflow-y-auto pt-4">
                  {LINKS.map((link, i) => {
                    const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                    return (
                      <li
                        key={link.href}
                        className="site-menu-item"
                        style={{ "--i": i } as React.CSSProperties}
                      >
                        <Link
                          href={link.href}
                          onClick={close}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "site-menu-link group flex min-h-13 items-center gap-3 rounded-2xl px-3 font-display text-[1.375rem] tracking-tight transition-colors duration-200",
                            active
                              ? "font-semibold text-ink"
                              : "font-medium text-graphite hover:text-ink",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "numeric w-5 text-[0.6875rem] tracking-normal",
                              active ? "text-brand-deep" : "text-graphite-soft",
                            )}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1">{link.label}</span>
                          <ArrowRight
                            aria-hidden="true"
                            className={cn(
                              "size-4 transition-all duration-300",
                              active
                                ? "text-brand-deep"
                                : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                            )}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <PulseGrid onNavigate={close} />

                <div className="flex items-center justify-between gap-4 border-t border-rule px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <a
                    href="https://github.com/zoworkhq/zoblocks"
                    className="inline-flex min-h-10 items-center gap-2 rounded-full px-2 text-sm text-graphite transition-colors duration-200 hover:text-ink"
                  >
                    <Github aria-hidden="true" className="size-4" />
                    GitHub
                  </a>
                  <ThemeToggle />
                </div>
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
