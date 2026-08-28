"use client";

/**
 * The reasoning under a gallery demo, with only its first sentence up front.
 *
 * The galleries were reported as "messy and confusing", and the measurement
 * agreed: 125 prose sentences across the site run over 35 words, and the date
 * picker page carries 32 of them — a 60-to-90 word paragraph under every one of
 * fourteen variants, all permanently expanded. Six of those stacked is a wall,
 * and the component the reader came for is somewhere behind it.
 *
 * The fix is deferral rather than deletion. This reasoning is the most valuable
 * writing in the repository and no competitor has an equivalent; it simply
 * should not all arrive before the reader has looked at the demo. So: the first
 * sentence stays visible, because it almost always carries the claim, and the
 * rest goes behind a disclosure that says what it contains.
 *
 * `<details>` rather than a state hook, deliberately. It is open-able before
 * hydration, it is searchable by the browser's own find-in-page in most
 * engines, and it prints expanded — which matters here, because these pages get
 * printed and passed around in procurement.
 */

import * as React from "react";

/**
 * Split a note into a lead sentence and the remainder.
 *
 * The lower bound of 40 characters stops an abbreviation or a two-word opener
 * from being promoted to the whole lead; the upper bound of 240 stops a
 * genuinely single-sentence note from being split at a decimal point. The
 * lookahead requires the next sentence to start with a capital, an opening
 * bracket, a quote or a backtick, because several notes open their second
 * sentence with a prop name in code voice.
 */
export function splitNote(text: string): { lead: string; rest: string } {
  const match = /^(.{40,240}?[.?!])\s+(?=[A-Z(“"`])/.exec(text);
  if (!match) return { lead: text, rest: "" };
  return { lead: match[1]!, rest: text.slice(match[0].length).trim() };
}

export function DemoNote({
  children,
  className = "ox-demo__note",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Only a plain string can be split. A note authored as markup keeps whatever
  // structure its author gave it rather than being cut at the first full stop
  // inside an element.
  if (typeof children !== "string") {
    return <p className={className}>{children}</p>;
  }

  const { lead, rest } = splitNote(children);
  if (!rest) return <p className={className}>{lead}</p>;

  return (
    <div className={className}>
      <p>{lead}</p>
      <details className="ox-demo__more">
        <summary>Why it behaves this way</summary>
        <p>{rest}</p>
      </details>
    </div>
  );
}
