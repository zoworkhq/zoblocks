/**
 * Stand-in for `next/navigation`.
 *
 * `redirect()` in Next throws a control-flow error rather than returning, and
 * the actions rely on that: `signIn` redirects on success and everything after
 * the call is unreachable. Modelling it as a throw keeps the tests honest —
 * a stub that returned undefined would let execution fall through paths that
 * cannot run in production.
 */

export class RedirectError extends Error {
  constructor(readonly url: string) {
    super(`NEXT_REDIRECT: ${url}`);
    this.name = "RedirectError";
  }
}

export function redirect(url: string): never {
  throw new RedirectError(url);
}

/** Runs `fn`, returning the URL it redirected to, or null if it did not. */
export async function captureRedirect(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (error) {
    if (error instanceof RedirectError) return error.url;
    throw error;
  }
}
