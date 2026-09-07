---
"@zoblocks/tabs": patch
"@zoblocks/tabs-core": patch
"@zoblocks/tabs-testing": minor
---

Three defects found by mounting Tabs in a real application and a real browser,
which a green unit suite had said nothing about.

- **React StrictMode left every strip inert.** StrictMode mounts, cleans up and
  mounts again; the cleanup disposed the change gate, and disposal was
  terminal — so every request returned `superseded` before a user could touch
  anything. No click, no arrow key, no guard. StrictMode is on in the default
  Next.js template, and Testing Library does not wrap renders in it, so 252
  tests passed while the component did not work. `dispose()` is now reversible
  and `strict-mode.test.tsx` covers it.
- **Flipping `dir` re-measured nothing.** A direction change mirrors every
  offset while changing no element's size, so no ResizeObserver fires and the
  indicator stayed at its LTR position — exactly what a live locale switch
  does. Direction is now a re-measure trigger.
- **The indicator anchored to the wrong edge in RTL.** It set both `left` and
  `inset-inline-start`, which is an over-constrained absolutely positioned box;
  the over-constrained rule drops the start edge, so the thumb sat against the
  right edge and then translated further right.

New in this release, completing the component brief:

- `hotkeys` — Ctrl/Cmd + 1…9, off by default because those belong to the
  browser first on Windows and Linux. `9` is the last tab, as everywhere else.
- `transition="view"` — routes the commit through `startViewTransition` where
  the engine has it, and falls through to the standard transition where it does
  not.
- `virtualise` — `content-visibility` on off-screen triggers, and the
  per-trigger ResizeObserver capped above ~40 tabs. It never removes a trigger
  from the DOM: a tablist whose children come and go tells a screen reader
  there are twenty tabs when there are two hundred and forty.

`@zoblocks/tabs-testing` is new: assertions that read a tab strip's
accessibility tree rather than its props, so they catch what a snapshot cannot
— a tablist of links, a strip with no tab stop, a dangling `aria-controls`, a
nested interactive close button. The shipped component is held to them across
all eleven variants.
