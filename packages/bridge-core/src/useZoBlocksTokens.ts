"use client";

/**
 * The resolved ZoBlocks tokens, kept current.
 *
 * Two things make this more than a `getComputedStyle` call.
 *
 * **It survives SSR.** There is no DOM on the server, so the first render uses
 * the caller's fallback and the real values arrive in an effect. Reading during
 * render instead would make the server and client markup disagree, and React
 * would replace the tree rather than hydrate it — a visible flash on every page
 * load, to save one frame.
 *
 * **It follows a theme change.** A toggle flips `data-zb-theme` and every token
 * below it changes at once. Without observing that, a framework holding the
 * previous values renders half a theme until something unrelated causes a
 * re-render, which is worse than not following at all because it looks like a
 * bug in the customer's code. A brand stylesheet arriving after hydration
 * changes them too, with no attribute touched, so `<head>` is watched as well.
 */

import * as React from "react";
import { THEME_ATTRIBUTES, resolveZoBlocksTokens, type ZoBlocksTokens } from "./read";

export interface UseZoBlocksTokensOptions {
  /**
   * Values for the server render and the first client render.
   *
   * Supplying these is how a server-rendered page avoids a flash: the caller
   * already knows the brand it is serving, so it can seed the same values the
   * browser is about to resolve. Compared by value, so an inline object is fine.
   */
  fallback?: ZoBlocksTokens;
  /** Read from here rather than `documentElement`. Scopes to one brand subtree. */
  scope?: React.RefObject<Element | null>;
}

export function useZoBlocksTokens(options: UseZoBlocksTokensOptions = {}): ZoBlocksTokens {
  const { scope } = options;
  const fallback = useSameTokens(options.fallback);
  const [tokens, setTokens] = React.useState<ZoBlocksTokens>(fallback ?? {});

  React.useEffect(() => {
    const element = scope?.current ?? null;

    const read = () => {
      /*
       * Merged over the fallback, not substituted for it.
       *
       * Replacing wholesale looked right and was wrong: on a server-rendered
       * page whose theme stylesheet has not arrived yet, the first effect
       * resolves nothing and would wipe the seed — a flash to the unthemed
       * palette, which is the exact failure the fallback exists to prevent.
       * A token the page has not defined keeps whatever the caller seeded, and
       * one it has defined wins.
       */
      const next = { ...fallback, ...resolveZoBlocksTokens(element) };

      // Compared before setting: a MutationObserver fires for attribute writes
      // that change nothing, and re-rendering a whole application's theme
      // provider on a no-op is how a bridge becomes a performance complaint.
      setTokens((previous) => (shallowEqual(previous, next) ? previous : next));
    };

    read();

    /*
     * A `<link>` is in the DOM before its rules apply, so its `load` is the
     * moment to re-read — including links already in `<head>` at mount, which
     * may still be loading when a page hydrates.
     */
    const links = new Set<Element>();
    const watchLink = (node: Node) => {
      if (node.nodeName !== "LINK" || links.has(node as Element)) return;
      node.addEventListener("load", read);
      links.add(node as Element);
    };

    const observer = new MutationObserver((records) => {
      let changed = false;
      for (const record of records) {
        if (record.type === "attributes") {
          changed = true;
          continue;
        }
        for (const node of Array.from(record.addedNodes)) {
          if (!isStylesheet(node)) continue;
          watchLink(node);
          changed = true;
        }
        if (Array.from(record.removedNodes).some(isStylesheet)) changed = true;
        // Text written into an existing <style>, as CSS-in-JS does.
        const owner = record.target.nodeName === "#text" ? record.target.parentNode : record.target;
        if (owner?.nodeName === "STYLE") changed = true;
      }
      if (changed) read();
    });

    // The element itself, and the document root — a brand can be applied on a
    // wrapper while the theme lives on `<html>`, and both change what resolves.
    const target = element ?? document.documentElement;
    observer.observe(target, { attributes: true, attributeFilter: THEME_ATTRIBUTES });
    if (target !== document.documentElement) {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: THEME_ATTRIBUTES,
      });
    }

    const head = document.head as HTMLHeadElement | null;
    if (head) {
      observer.observe(head, { childList: true, subtree: true, characterData: true });
      head.querySelectorAll("link").forEach(watchLink);
    }

    return () => {
      observer.disconnect();
      for (const link of links) link.removeEventListener("load", read);
    };
  }, [scope, fallback]);

  return tokens;
}

/**
 * The previous object while the values are unchanged.
 *
 * `fallback={{ … }}` is a new object every render. As an effect dependency it
 * tore down and rebuilt the observer on each one. State adjusted during render
 * is React's documented pattern for deriving from a changing prop.
 */
function useSameTokens(value: ZoBlocksTokens | undefined): ZoBlocksTokens | undefined {
  const [same, setSame] = React.useState(value);
  if (same !== value && !shallowEqual(same ?? {}, value ?? {})) {
    setSame(value);
    return value;
  }
  return same;
}

function isStylesheet(node: Node): boolean {
  return node.nodeName === "LINK" || node.nodeName === "STYLE";
}

function shallowEqual(a: ZoBlocksTokens, b: ZoBlocksTokens): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => a[key as keyof ZoBlocksTokens] === b[key as keyof ZoBlocksTokens]);
}
