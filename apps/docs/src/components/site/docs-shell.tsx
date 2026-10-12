/**
 * The frame of the documentation page: a hero, an "On this page" rail, and
 * the pieces every section is built from.
 *
 * One page, deliberately. It was two for a few days — a beginner guide and an
 * install reference — and the two repeated each other's setup steps with
 * small differences, which is the one thing setup instructions must not do.
 * The component pages are the rest of the manual.
 *
 * No hooks, so it renders on the server: the rail is plain anchors, and the
 * only client code on the page is the copy buttons and the switches.
 */

import Link from "next/link";
import { BookOpen, Bot, Check, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TocEntry {
  id: string;
  label: string;
}

/**
 * The docs pages, listed above "On this page" on every one of them.
 *
 * Two pages, and the second was only reachable from a sentence at the end of
 * the first one's overview. A developer looking for the MCP server had to
 * know to read that far; now it is the second thing in the rail, and the
 * first thing above the content on a phone.
 */
export const DOC_PAGES = [
  { href: "/docs", label: "Getting started", icon: BookOpen },
  { href: "/docs/ai", label: "MCP Server", icon: Bot, badge: "New" },
] as const satisfies ReadonlyArray<{
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}>;

export type DocPath = (typeof DOC_PAGES)[number]["href"];

function PageBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-brand/10 px-1.5 py-px font-mono text-[0.625rem] font-medium tracking-wide text-brand-deep uppercase">
      {children}
    </span>
  );
}

/** The rail's list of pages: the current one carries the brand tick, like the header. */
function DocPagesRail({ current }: { current: DocPath }) {
  return (
    <nav aria-label="Docs">
      <p className="axis-label">Docs</p>
      <ul className="mt-3 space-y-0.5 border-l border-rule">
        {DOC_PAGES.map((page) => {
          const active = page.href === current;
          const Icon = page.icon;
          return (
            <li key={page.href}>
              <Link
                href={page.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-ml-px flex items-center gap-2 border-l py-1.5 pl-3 text-[0.8125rem] transition-colors duration-200",
                  active
                    ? "border-brand font-medium text-ink"
                    : "border-transparent text-graphite hover:border-rule-strong hover:text-ink",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn("size-3.5 shrink-0", active ? "text-brand-deep" : "text-graphite")}
                />
                <span>{page.label}</span>
                {"badge" in page ? <PageBadge>{page.badge}</PageBadge> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * The same pages on a phone, where the rail is hidden. A two-way switch above
 * the content rather than a menu: there are two pages, and both stay visible.
 */
function DocPagesSwitch({ current }: { current: DocPath }) {
  return (
    <nav aria-label="Docs" className="lg:hidden">
      <ul className="grid grid-cols-2 gap-1 rounded-xl border border-rule bg-paper-sunk/60 p-1">
        {DOC_PAGES.map((page) => {
          const active = page.href === current;
          const Icon = page.icon;
          return (
            <li key={page.href}>
              <Link
                href={page.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-[0.8125rem] whitespace-nowrap transition-colors duration-200 sm:gap-2 sm:px-3 sm:text-sm",
                  active
                    ? "bg-paper font-medium text-ink shadow-sm ring-1 ring-brand/40"
                    : "text-graphite hover:text-ink",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn("size-4 shrink-0", active ? "text-brand-deep" : "text-graphite")}
                />
                <span>{page.label}</span>
                {"badge" in page ? <PageBadge>{page.badge}</PageBadge> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function DocsHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-rule">
      <div className="mx-auto max-w-6xl section-major px-5 sm:px-8">
        <p className="eyebrow eyebrow-rule text-graphite" data-reveal>
          {eyebrow}
        </p>
        <h1 className="display-lg mt-4 max-w-3xl text-balance" data-reveal>
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-pretty text-graphite" data-reveal>
          {lede}
        </p>
        {children ? (
          <div className="mt-8 max-w-2xl" data-reveal>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export function DocsShell({
  current,
  toc,
  children,
}: {
  /** Which docs page this is, for the page list's current state. */
  current: DocPath;
  toc: readonly TocEntry[];
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="grid gap-10 py-10 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-14 lg:py-14">
        {/* Hidden on a phone, where it would sit above the content it indexes
            and push it a screen down. The page list moves above the content
            there instead (DocPagesSwitch). */}
        <aside className="hidden space-y-8 lg:sticky lg:top-24 lg:block lg:self-start">
          <DocPagesRail current={current} />
          <nav aria-label="On this page">
            <p className="axis-label">On this page</p>
            <ul className="mt-3 space-y-0.5 border-l border-rule">
              {toc.map((entry) => (
                <li key={entry.id}>
                  <a
                    href={`#${entry.id}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-3 text-[0.8125rem] text-graphite transition-colors duration-200 hover:border-rule-strong hover:text-ink"
                  >
                    {entry.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0">
          <DocPagesSwitch current={current} />
          <div className="mt-8 lg:mt-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections, steps, callouts
// ---------------------------------------------------------------------------

export function DocSection({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-rule py-10 first:border-t-0 first:pt-0"
    >
      <h2 className="display-sm text-balance">{title}</h2>
      {intro ? (
        <div className="mt-4 max-w-2xl space-y-3 text-pretty leading-relaxed text-graphite">
          {intro}
        </div>
      ) : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}

/**
 * One numbered instruction: what to do, the command or file, and what you
 * should see afterwards.
 *
 * The "you should see" line is the part a beginner needs most and a reference
 * page never has. Without it, a step that silently did nothing and a step
 * that worked look the same until three steps later.
 */
export function DocStep({
  n,
  title,
  children,
  check,
  id,
}: {
  n: number;
  title: string;
  children?: React.ReactNode;
  check?: React.ReactNode;
  /** An anchor, so another part of the page can link to this exact step. */
  id?: string;
}) {
  return (
    <li id={id} className="relative grid scroll-mt-24 grid-cols-[2rem_minmax(0,1fr)] gap-x-4">
      <span
        aria-hidden="true"
        className="numeric flex size-8 items-center justify-center rounded-full border border-rule-strong bg-paper text-xs font-semibold text-brand-deep"
      >
        {n}
      </span>
      <div className="min-w-0 pb-9">
        <h3 className="pt-1 text-base font-semibold tracking-tight text-ink">{title}</h3>
        {children ? (
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-graphite">{children}</div>
        ) : null}
        {check ? (
          <p className="mt-3 flex gap-2 text-sm leading-relaxed text-graphite">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-deep" />
            <span>
              <span className="font-medium text-ink">You should see: </span>
              {check}
            </span>
          </p>
        ) : null}
      </div>
    </li>
  );
}

/** A numbered run of `DocStep`s. An `<ol>`, so the count is announced. */
export function DocSteps({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ol className={cn("relative", className)}>{children}</ol>;
}

export function Callout({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-rule bg-paper-sunk/60 px-4 py-3.5 text-sm leading-relaxed text-graphite",
        className,
      )}
    >
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-deep" />
      <div className="min-w-0">
        {title ? <p className="font-medium text-ink">{title}</p> : null}
        <div className={title ? "mt-1" : undefined}>{children}</div>
      </div>
    </div>
  );
}

/** Inline code in prose. The size every page on the site already uses. */
export function C({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-[0.8125rem] text-ink">{children}</code>;
}

/**
 * Text from `@zoblocks/component-meta`'s integration data, where code is
 * marked with backticks so the agent manifest can carry the same string.
 * Each backticked span renders as `C`; everything else is left as it is.
 */
export function Prose({ text }: { text: string }) {
  return <>{text.split("`").map((part, i) => (i % 2 === 1 ? <C key={i}>{part}</C> : part))}</>;
}
