---
"@zoblocks/loaders": patch
---

Fix a crash when the package is imported in any Node context.

`class ZbLoaderElement extends HTMLElement` was evaluated at module scope, so
importing the package on a server threw `ReferenceError: HTMLElement is not
defined` before anything rendered — breaking Nuxt, Angular Universal, Astro,
SvelteKit, and Next.js server components, every one of which this package's
README promised to support.

The class now extends an inert stand-in when there is no DOM. Nothing registers
on a server, which is what a server needs from a client-side package.

A `node`-environment test suite now covers every entry point. Its absence is why
this shipped: the existing suite runs in jsdom, which supplies `HTMLElement`, so
a browser-environment test could not have caught it.

Also: the minimum-duration gate no longer reads the wall clock, matching the
React implementation exactly.
