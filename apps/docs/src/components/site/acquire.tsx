"use client";

/**
 * How you actually get a component, said on the card rather than one page in.
 *
 * The catalogue used to answer "what is this" and stop. A visitor who decided
 * they wanted something had to open the detail page to find out how to get it,
 * and — for anything that is not free — whether they could.
 *
 * There are exactly two answers today and they come from the metadata, not
 * from here:
 *
 *   `tier: "free"` — every component in the public catalogue. MIT, installed
 *   with the CLI, commercial use permitted. The acquisition action is the
 *   command, and one click puts it on the clipboard.
 *
 *   `tier: "pro"` — bought in the marketplace, licensed to the organisation
 *   and perpetual. No component carries this today; the affordance exists so
 *   that the first one to does not need a new component built for it, and so
 *   nothing on this page has to invent a price.
 *
 * There is deliberately no per-component price anywhere in this file. The
 * commercial model prices packs, not components, and a number typed in here
 * would be a number the checkout does not know about.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import type { ComponentDoc } from "@/lib/catalog";
import { distributionState, installCommandFor } from "@/lib/readiness";
import { cn } from "@/lib/utils";

/**
 * The exact line, from the component's own distribution channel.
 *
 * A package component shown an `oxygen add` line sends the reader to a
 * registry item that does not exist, which is worse than no instructions —
 * the detail page already learned this, and the card must not relearn it.
 */
export function installCommand(component: ComponentDoc): string {
  // The rule lives in `component-meta` now, beside the metadata it reads, so
  // the card, the generated catalogue and `llms.txt` cannot disagree about a
  // component's install line — which they did, for the three that ship on npm.
  return installCommandFor(component);
}

export function AcquireAction({
  component,
  className,
}: {
  component: ComponentDoc;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  /**
   * The clipboard refused.
   *
   * On the detail page a failed copy is survivable — the command is printed
   * beside the button and can be selected. On a card it is not: the command
   * exists only in the button's accessible name, so a silent failure leaves a
   * sighted reader with a button that does nothing and no way to find out what
   * it would have copied. So the command replaces the button, `select-all`, and
   * above the card's overlay link where it can actually be selected.
   */
  const [refused, setRefused] = React.useState(false);
  const timeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timeout.current), []);

  if (component.tier === "pro") {
    return (
      <Link
        href="/marketplace"
        // Above the card's overlay link, so the whole card still opens the
        // component and this one corner does something else.
        className={cn(
          "relative z-10 inline-flex items-center gap-1.5 rounded-lg border border-oxygen/40 bg-oxygen/8",
          "px-2.5 py-1.5 text-[0.6875rem] font-semibold text-oxygen-deep",
          "transition-colors hover:bg-oxygen/15 focus-visible:outline focus-visible:outline-2",
          "focus-visible:outline-offset-2 focus-visible:outline-oxygen",
          className,
        )}
      >
        Buy in the marketplace
        <ArrowUpRight aria-hidden="true" className="size-3" />
      </Link>
    );
  }

  /*
   * Nothing to copy for a component that does not exist.
   *
   * Every card rendered this button, including the one component in the
   * catalogue with no registry item behind it — so the card offered a command
   * that fails at the prompt. A stated absence is better than a control that
   * hands somebody a broken line.
   */
  if (distributionState(component.name) === "announced") {
    return (
      <span
        className={cn(
          "relative z-10 inline-flex items-center rounded-lg border border-dashed border-rule",
          "px-2.5 py-1.5 font-mono text-[0.6875rem] text-graphite-soft",
          className,
        )}
      >
        Not built yet
      </span>
    );
  }

  const command = installCommand(component);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      // Blocked by permissions or a non-secure origin. Show the command
      // instead of doing nothing.
      setRefused(true);
      return;
    }
    setCopied(true);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), 2000);
  }

  if (refused) {
    return (
      <code
        className={cn(
          "relative z-10 select-all rounded-lg border border-rule px-2.5 py-1.5",
          "font-mono text-[0.6875rem] text-graphite",
          className,
        )}
      >
        {command}
      </code>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      // The full command is the accessible name. "Copy" on its own, twenty-six
      // times down a page, is twenty-six identical buttons to a screen reader.
      aria-label={`Copy install command: ${command}`}
      className={cn(
        "relative z-10 inline-flex items-center gap-1.5 rounded-lg border border-rule px-2.5 py-1.5",
        "font-mono text-[0.6875rem] text-graphite transition-colors",
        "hover:border-oxygen/45 hover:text-ink",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oxygen",
        className,
      )}
    >
      {copied ? (
        <Check aria-hidden="true" className="size-3 text-oxygen-deep" />
      ) : (
        <Copy aria-hidden="true" className="size-3" />
      )}
      {/*
        The word changes, the width does not: a button that reflows the row
        under the pointer is a button people miss on the second click.
      */}
      <span className="inline-block min-w-[3.5rem] text-left">{copied ? "Copied" : "Install"}</span>
      {/* Announced once, then withdrawn. A permanently-rendered "Copied" is a
          claim about a clipboard that may have been overwritten since. */}
      <span className="sr-only" aria-live="polite">
        {copied ? "Install command copied" : ""}
      </span>
    </button>
  );
}

/**
 * What a component costs, in one word.
 *
 * Read straight off the tier rather than computed: "Free" is a licence claim
 * and the licence is MIT, so it is a fact about the repository rather than a
 * marketing position.
 */
export function PriceTag({ component }: { component: ComponentDoc }) {
  const pro = component.tier === "pro";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider",
        pro ? "bg-oxygen/12 text-oxygen-deep" : "border border-rule text-graphite-soft",
      )}
    >
      {pro ? "Marketplace" : "Free · MIT"}
    </span>
  );
}
