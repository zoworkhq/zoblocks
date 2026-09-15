"use client";

/**
 * The site navigation on a phone.
 *
 * Below `md` the header hides its links, and nothing replaced them: a reader
 * on a phone had the logo, a search icon and the footer. This gives them the
 * same six destinations the desktop bar and the footer carry.
 *
 * A sheet over the page rather than a dropdown, for the reasons the command
 * menu is one: the page behind is inert, focus stays inside, and Escape or a
 * tap outside closes it. Its top bar is drawn at the header's own height —
 * 64px at rest, 52px once scrolled — so Close lands exactly where Menu was.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Github, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { restoreFocus } from "@/components/site/interactions";
import { ThemeToggle } from "@/components/site/theme-toggle";

const LINKS = [
  { href: "/components", label: "Components" },
  { href: "/install", label: "Install" },
  { href: "/compare", label: "Compare" },
  { href: "/showcase", label: "Blocks" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pro", label: "Pro" },
] as const;

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
            <div
              aria-hidden="true"
              onClick={close}
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] motion-safe:animate-[overlay-in_200ms_ease-out]"
            />

            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="site-menu-panel relative max-h-dvh overflow-y-auto border-b border-rule bg-paper"
            >
              <div
                className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 sm:px-8"
                style={{ height: bar }}
              >
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
                  <span className="numeric hidden rounded border border-rule px-1.5 py-0.5 text-[0.625rem] text-graphite-soft sm:inline">
                    v0.1.0
                  </span>
                </Link>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className={SQUARE}
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>

              <nav aria-label="Main" className="mx-auto max-w-6xl px-5 pb-5 sm:px-8">
                <ul className="border-t border-rule">
                  {LINKS.map((link) => {
                    const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                    return (
                      <li key={link.href} className="border-b border-rule">
                        <Link
                          href={link.href}
                          onClick={close}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex min-h-13 items-center justify-between gap-4 font-display text-[1.0625rem] tracking-tight transition-colors duration-200",
                            active
                              ? "font-semibold text-ink"
                              : "font-medium text-graphite hover:text-ink",
                          )}
                        >
                          {link.label}
                          {/* The header's measured underline, turned into a tick. */}
                          {active ? (
                            <span aria-hidden="true" className="h-px w-5 bg-brand" />
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <a
                    href="https://github.com/zoworkhq/zoblocks"
                    className="inline-flex min-h-10 items-center gap-2 text-sm text-graphite transition-colors duration-200 hover:text-ink"
                  >
                    <Github aria-hidden="true" className="size-4" />
                    GitHub
                    <ArrowUpRight aria-hidden="true" className="size-3" />
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
