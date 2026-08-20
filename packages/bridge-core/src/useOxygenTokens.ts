"use client";

/**
 * The resolved Oxygen tokens, kept current.
 *
 * Two things make this more than a `getComputedStyle` call.
 *
 * **It survives SSR.** There is no DOM on the server, so the first render uses
 * the caller's fallback and the real values arrive in an effect. Reading during
 * render instead would make the server and client markup disagree, and React
 * would replace the tree rather than hydrate it — a visible flash on every page
 * load, to save one frame.
 *
 * **It follows a theme change.** A toggle flips `data-ox-theme` and every token
 * below it changes at once. Without observing that, a framework holding the
 * previous values renders half a theme until something unrelated causes a
 * re-render, which is worse than not following at all because it looks like a
 * bug in the customer's code.
 */

import * as React from "react";
import { THEME_ATTRIBUTES, resolveOxygenTokens, type OxygenTokens } from "./read";

export interface UseOxygenTokensOptions {
  /**
   * Values for the server render and the first client render.
   *
   * Supplying these is how a server-rendered page avoids a flash: the caller
   * already knows the brand it is serving, so it can seed the same values the
   * browser is about to resolve.
   */
  fallback?: OxygenTokens;
  /** Read from here rather than `documentElement`. Scopes to one brand subtree. */
  scope?: React.RefObject<Element | null>;
}

export function useOxygenTokens(options: UseOxygenTokensOptions = {}): OxygenTokens {
  const { fallback, scope } = options;
  const [tokens, setTokens] = React.useState<OxygenTokens>(fallback ?? {});

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
      const next = { ...fallback, ...resolveOxygenTokens(element) };

      // Compared before setting: a MutationObserver fires for attribute writes
      // that change nothing, and re-rendering a whole application's theme
      // provider on a no-op is how a bridge becomes a performance complaint.
      setTokens((previous) => (shallowEqual(previous, next) ? previous : next));
    };

    read();

    const target = element ?? document.documentElement;
    const observer = new MutationObserver(read);

    // The element itself, and the document root — a brand can be applied on a
    // wrapper while the theme lives on `<html>`, and both change what resolves.
    observer.observe(target, { attributes: true, attributeFilter: THEME_ATTRIBUTES });
    if (target !== document.documentElement) {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: THEME_ATTRIBUTES,
      });
    }

    return () => observer.disconnect();
  }, [scope, fallback]);

  return tokens;
}

function shallowEqual(a: OxygenTokens, b: OxygenTokens): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => a[key as keyof OxygenTokens] === b[key as keyof OxygenTokens]);
}
