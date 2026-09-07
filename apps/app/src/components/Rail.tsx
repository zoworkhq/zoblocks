"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Blocks,
  KeyRound,
  LayoutGrid,
  Menu,
  Receipt,
  ShoppingBag,
  Users,
  Palette,
  PlayCircle,
  Settings,
} from "lucide-react";
import { themeScreenHref, themeScreens } from "@/lib/theme-screens";
import { cn } from "@/lib/utils";

/**
 * The app's left rail. Navigation, and nothing else.
 *
 * It used to open with a block naming the organisation, the member and their
 * role. That answered "whose app is this", which is a real question on a
 * multi-tenant product — but the account menu in the top-right corner answers
 * it now, with the email besides, so the block was a second copy of the same
 * facts to keep in step.
 *
 * Two things it does that the first version did not:
 *
 *   - **The current page is marked.** Every item looked identical, so the rail
 *     told you nothing about where you were.
 *   - **Theme-scoped screens are nested under the theme they belong to.**
 *     Typography and Components are not global destinations; they are views of
 *     one theme, and a flat list said otherwise.
 *
 * A route appears here only once it exists. The whole reason this phase was
 * written is that the rail linked to `/frameworks`, which returned 404 — a
 * navigation item that goes nowhere is worse than an absent one, and putting a
 * "coming soon" item in its place would only be a politer version of the same
 * lie. Playground, Brand and Members join their groups when they are built.
 */

export function ZoblocksMark({ className = "h-4 w-7" }: { className?: string }) {
  // Two blocks and the tenon that joins them. The docs site's mark, verbatim:
  // a customer arrives here from zoblocks.design in one click, and a different
  // mark at the boundary is the fastest way to make one product feel like two.
  // Keep this in step with `ZoblocksMark` in the docs app's chrome.tsx.
  return (
    <svg viewBox="0 0 28 16" className={className} aria-hidden="true">
      <rect x="11.5" y="5.5" width="5" height="5" rx="1.25" fill="var(--color-brand)" />
      <rect
        x="2.5"
        y="3"
        width="9.5"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="16"
        y="3"
        width="9.5"
        height="10"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export interface RailTheme {
  slug: string;
  name: string;
  liveVersion: number | null;
}

export interface RailProps {
  /**
   * No `org` or `member` any more. Both were here for the tenant block at the
   * top of the rail, and that block's job moved to the account menu — so the
   * props went with it rather than being left behind as data nothing reads.
   */
  themes: readonly RailTheme[];
  /** Frameworks enabled for this organisation, for the count beside the item. */
  frameworkCount: number;
  memberCount: number;
  /** Live entitlements, for the count beside Purchases. */
  purchaseCount: number;
  /**
   * Whether this member may mint a CLI token.
   *
   * Passed rather than derived from a role here, because the rail is a client
   * component and the capability table is the server's answer. A route that
   * would refuse the reader is worse than an absent one — the whole reason
   * this rail was rewritten is that it linked to `/frameworks` before that
   * page existed.
   */
  canMintTokens: boolean;
}

interface Item {
  href: string;
  label: string;
  Icon: typeof LayoutGrid;
  /** Rendered right-aligned. Absent rather than zero when there is nothing to count. */
  count?: number;
}

export function Rail({
  themes,
  frameworkCount,
  memberCount,
  purchaseCount,
  canMintTokens,
}: RailProps) {
  const pathname = usePathname();

  /*
   * Below `lg` the rail is a panel over the page. Above it, an ordinary column.
   *
   * It used to expand inline, which pushed the whole page down by the height of
   * the navigation: tapping Menu on a phone moved the heading you were reading
   * off the bottom of the screen, and closing it moved everything back. An
   * overlay leaves the page where it is, which is the entire argument for one.
   *
   * A `useState` toggle rather than a `<details>`: a details element hides its
   * own content and there is no reliable way to force it open with a media
   * query, so the desktop layout would depend on JavaScript having run.
   */
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // Closes on navigation, so tapping an item does not leave the menu covering
  // the screen the reader just asked for.
  useEffect(() => setOpen(false), [pathname]);

  /*
   * What an overlay owes the reader once it covers the page: a way out that is
   * not the mouse, and a page that does not scroll underneath it.
   *
   * Focus moves into the panel on open and back to the button on close. Without
   * it a keyboard reader presses Menu, a panel appears over everything, and
   * their next Tab continues into the page behind it — they are navigating a
   * screen they cannot see.
   */
  useEffect(() => {
    if (!open) return;

    const returnTo = trigger.current;
    panel.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      returnTo?.focus();
    };
  }, [open]);

  /*
   * Reaching the desktop breakpoint closes it.
   *
   * The button that opens the panel is `lg:hidden`, so above `lg` there is
   * nothing to close it with — and `open` also holds the body scroll lock.
   * Resizing a phone-width window out to desktop with the menu open would
   * otherwise leave the page permanently unscrollable with no visible cause.
   */
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 64rem)");
    const sync = () => wide.matches && setOpen(false);
    sync();
    wide.addEventListener("change", sync);
    return () => wide.removeEventListener("change", sync);
  }, []);

  /*
   * Which theme, if any, the reader is inside.
   *
   * Derived from the path rather than passed down, because the layout is shared
   * by every route under `(app)` and only some of them have a theme at all.
   * `/themes/new` is deliberately excluded — it is a form, not a theme.
   */
  const slug = /^\/themes\/([^/]+)/.exec(pathname)?.[1];
  const openTheme = slug === "new" ? undefined : themes.find((t) => t.slug === slug);

  const design: Item[] = [
    { href: "/themes", label: "Themes", Icon: Palette, count: themes.length },
  ];

  /*
   * Built from `THEME_SCREENS` rather than restated.
   *
   * These were two hardcoded arrays naming the same seven screens the theme
   * page now also lists. One table, read twice, is the only version of that
   * which cannot drift.
   */
  const forTheme = (group: "design" | "tools"): Item[] =>
    openTheme
      ? themeScreens(group).map((screen) => ({
          href: themeScreenHref(openTheme.slug, screen.path),
          label: screen.label,
          Icon: screen.Icon,
        }))
      : [];

  const themeItems = forTheme("design");

  // Playground is not theme-scoped — it compares every theme this organisation
  // has — so it is the one tool that survives having no theme open, and the one
  // item in this group the shared table does not own.
  const playground: Item = { href: "/playground", label: "Playground", Icon: PlayCircle };
  const tools: Item[] = [playground, ...forTheme("tools")];

  /*
   * Three items rather than one, because they have three audiences.
   *
   * Catalogue is where an admin spends money, Purchases is where the whole
   * organisation sees what it owns and what it paid, and Access tokens is
   * where a developer mints the credential the CLI needs. Folding them into a
   * single "Marketplace" destination would make two of the three a tab nobody
   * finds — and the token screen in particular is looked for by somebody who
   * has never opened the catalogue.
   */
  const marketplace: Item[] = [
    // "Marketplace", matching the site. A reader crosses from one to the
    // other in a click, and "catalogue" is already taken here by the
    // component catalogue — two names for the shop and one name for two
    // different things.
    { href: "/market", label: "Marketplace", Icon: ShoppingBag },
    { href: "/market/purchases", label: "Purchases", Icon: Receipt, count: purchaseCount },
    ...(canMintTokens ? [{ href: "/market/tokens", label: "Access tokens", Icon: KeyRound }] : []),
  ];

  const organisation: Item[] = [
    { href: "/frameworks", label: "Frameworks", Icon: Blocks, count: frameworkCount },
    { href: "/members", label: "Members", Icon: Users, count: memberCount },
    { href: "/settings", label: "Settings", Icon: Settings },
  ];

  // One winner, decided across every group, so no two entries look current.
  const current = currentHref(
    pathname,
    [...design, ...themeItems, ...tools, ...marketplace, ...organisation].map((i) => i.href),
  );

  return (
    <div className="flex h-full flex-col gap-4 lg:gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/themes"
          aria-label="Zoblocks app home"
          className="group flex items-center gap-2.5 text-ink"
        >
          <ZoblocksMark className="h-4 w-7 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-180" />
          <span className="font-display text-[0.9375rem] font-semibold tracking-[-0.02em]">
            Zoblocks
          </span>
          <span className="eyebrow text-[0.5625rem] text-graphite-soft">App</span>
        </Link>

        <button
          ref={trigger}
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="app-rail"
          className="inline-flex items-center gap-1.5 rounded-lg border border-rule px-2.5 py-1.5 text-[0.75rem] text-graphite lg:hidden"
        >
          <Menu aria-hidden="true" className="size-3.5" strokeWidth={2} />
          Menu
        </button>
      </div>

      {/*
        The scrim. A real button, so dismissing by tapping beside the panel is
        also reachable from a keyboard and announced as what it does — the same
        gesture on a `<div>` exists only for people using a pointer.
      */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/*
        `min-h-0 flex-1` so the nav inside can still scroll when the rail is
        taller than the viewport — without it a `flex-1` child of a fixed-height
        column overflows its parent instead of scrolling within it.

        `rail-panel` in `globals.css` is what makes it an overlay below `lg` and
        leaves it an ordinary column above — including the `visibility` timing
        that keeps it focusable the instant it opens. It is driven by
        `data-open` rather than a class so the two states live beside each other
        in one stylesheet instead of as a conditional string here.

        Hidden, the panel is `visibility: hidden`: out of the tab order and out
        of the accessibility tree, and — unlike `display: none` — able to slide.
      */}
      <div
        id="app-rail"
        ref={panel}
        tabIndex={-1}
        data-open={open}
        className={cn("rail-panel min-h-0 flex-1 flex-col gap-6 lg:flex")}
      >
        {/*
          The tenant block that used to sit here is gone.

          It named the organisation, the member and their role — and the account
          menu in the top-right corner now states all three, in more detail and
          with the email besides. Two blocks answering "whose app is this"
          within one screen is not redundancy that costs nothing: it is a second
          place to keep in step, and the one that was easiest to miss.
        */}
        <nav aria-label="App" className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          <Group label="Design" items={design} current={current}>
            {openTheme && (
              <li>
                {/*
                Nested, so the two screens below read as views of this theme
                rather than as global destinations. The version is here because
                it is the fact that decides whether an edit is safe.
              */}
                <p className="mt-2 truncate px-2.5 text-[0.6875rem] font-medium text-graphite">
                  {openTheme.name}
                  {openTheme.liveVersion !== null && (
                    <span className="tabular text-graphite-soft">
                      {" "}
                      · v{openTheme.liveVersion} live
                    </span>
                  )}
                </p>
                <ul className="mt-1 space-y-0.5 border-l border-rule pl-2">
                  {themeItems.map((item) => (
                    <NavLink key={item.href} item={item} current={current} />
                  ))}
                </ul>
              </li>
            )}
          </Group>

          {tools.length > 0 && <Group label="Tools" items={tools} current={current} />}

          <Group label="Marketplace" items={marketplace} current={current} />

          <Group label="Organisation" items={organisation} current={current} />
        </nav>
      </div>
    </div>
  );
}

function Group({
  label,
  items,
  current,
  children,
}: {
  label: string;
  items: readonly Item[];
  current: string | undefined;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow mb-1.5 px-2.5 text-[0.5625rem] text-graphite-soft">{label}</p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} current={current} />
        ))}
        {children}
      </ul>
    </div>
  );
}

/**
 * Which single rail item is the current page.
 *
 * The longest href the path sits inside, rather than every href it starts
 * with. `startsWith` alone lit Catalogue (`/market`) as well as Access tokens
 * on `/market/tokens`, so two entries claimed to be current — which reads the
 * same as none. `/themes` carried a hand-written exception for exactly this;
 * resolving the winner once removes the need for one per section.
 */
export function currentHref(pathname: string, hrefs: readonly string[]): string | undefined {
  return hrefs
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

function NavLink({ item, current }: { item: Item; current: string | undefined }) {
  const active = item.href === current;

  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.8125rem]",
          "transition-colors duration-200",
          active
            ? "bg-accent-wash font-medium text-brand-deep"
            : "text-graphite hover:bg-paper-sunk hover:text-ink",
        )}
      >
        <item.Icon
          aria-hidden="true"
          strokeWidth={2}
          className={cn("size-3.5 shrink-0", active ? "text-brand-deep" : "text-graphite-soft")}
        />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.count !== undefined && (
          <span className="tabular text-[0.6875rem] text-graphite-soft">{item.count}</span>
        )}
      </Link>
    </li>
  );
}
