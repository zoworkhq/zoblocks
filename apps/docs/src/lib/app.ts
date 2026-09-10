/**
 * Where the app lives, and the two doors into it.
 *
 * The docs site and the app are separate applications on separate origins:
 * this one is public and static, that one is authenticated and per-tenant.
 * Nothing here can link to a route — only to a URL — so the address has to be
 * configuration rather than a path, and it has to be `NEXT_PUBLIC_` because the
 * pages that use it are client components.
 *
 * As of 10 Sep 2026 the only reader is `pro/console-page.tsx`, which is the
 * Pro pitch held for a later release. The header and footer used to carry both
 * doors and no longer do.
 *
 * The default is the deployed app rather than localhost. A missing variable
 * in production would otherwise point every reader's Sign in at their own
 * machine, which fails silently and looks like the app being down; the same
 * mistake in development is immediate and obvious, which is the right way round.
 *
 * `buyHref` stays in `marketplace.ts` because buying is a marketplace concern.
 * These are not — they are the way in, whatever the reader came for.
 */

export const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.zoblocks.design";

/** For someone who already has an account. */
export const signInHref = `${APP}/login`;

/**
 * For someone who does not have an account.
 *
 * Signing up does not sign you in: the app creates a *pending* member and an
 * administrator approves it, so this leads to a form and then a waiting room.
 *
 * The label was "Sign up", chosen over "Get started" because the second
 * promises an app on the other side of the click. "Sign up" makes the same
 * promise slightly more quietly, and it turned out to be the wrong one for a
 * different reason: the form asks for an organisation address, and an
 * organisation is created by us rather than by the person filling it in. A
 * first-time reader clicking the one filled button on the site reached a field
 * they could not fill.
 *
 * "Request access" is what actually happens, and it is the console's own
 * heading for the same form — one name for one action across both apps. It
 * was briefly "Request a workspace", which said the same thing in nineteen
 * characters and pushed the header to 393px in a 375px viewport.
 */
export const signUpHref = `${APP}/signup`;

/**
 * The label for `signUpHref`.
 *
 * Nothing on the public site renders it as of 10 Sep 2026: the header and the
 * footer both dropped their doors into the app, because the app is not in this
 * release. It stays here, with `signInHref` and `signUpHref`, because
 * `pro/console-page.tsx` holds the full Pro pitch whole for the release that
 * puts the console back, and that page needs all three.
 */
export const SIGN_UP_LABEL = "Request access";
