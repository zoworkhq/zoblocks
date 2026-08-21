/**
 * Where the console lives, and the two doors into it.
 *
 * The docs site and the console are separate applications on separate origins:
 * this one is public and static, that one is authenticated and per-tenant.
 * Nothing here can link to a route — only to a URL — so the address has to be
 * configuration rather than a path, and it has to be `NEXT_PUBLIC_` because the
 * header that uses it is a client component.
 *
 * The default is the deployed console rather than localhost. A missing variable
 * in production would otherwise point every reader's Sign in at their own
 * machine, which fails silently and looks like the console being down; the same
 * mistake in development is immediate and obvious, which is the right way round.
 *
 * `buyHref` stays in `marketplace.ts` because buying is a marketplace concern.
 * These are not — they are the way in, whatever the reader came for.
 */

export const CONSOLE = process.env.NEXT_PUBLIC_CONSOLE_URL ?? "https://console.oxygenui.design";

/** For someone who already has an account. */
export const signInHref = `${CONSOLE}/login`;

/**
 * For someone who does not.
 *
 * Signing up does not sign you in: the console creates a *pending* member and
 * an administrator approves it, so this leads to a form and then a waiting
 * room. The label is "Sign up" rather than "Get started" for that reason — the
 * second promises an app on the other side of the click.
 */
export const signUpHref = `${CONSOLE}/signup`;
