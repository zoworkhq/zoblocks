/**
 * Where the app lives, and the two doors into it.
 *
 * The docs site and the app are separate applications on separate origins:
 * this one is public and static, that one is authenticated and per-tenant.
 * Nothing here can link to a route — only to a URL — so the address has to be
 * configuration rather than a path, and it has to be `NEXT_PUBLIC_` because the
 * header that uses it is a client component.
 *
 * The default is the deployed app rather than localhost. A missing variable
 * in production would otherwise point every reader's Sign in at their own
 * machine, which fails silently and looks like the app being down; the same
 * mistake in development is immediate and obvious, which is the right way round.
 *
 * `buyHref` stays in `marketplace.ts` because buying is a marketplace concern.
 * These are not — they are the way in, whatever the reader came for.
 */

export const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.oxygenui.design";

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
 * "Request a workspace" is what actually happens. The console's own heading has
 * said "Request access" for as long as the flow has existed; the site is the
 * half that had not caught up.
 */
export const signUpHref = `${APP}/signup`;

/** The label for `signUpHref`, so both places that render it agree. */
export const SIGN_UP_LABEL = "Request a workspace";
