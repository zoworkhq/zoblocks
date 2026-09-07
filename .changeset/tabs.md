---
"@zoblocks/tabs": minor
"@zoblocks/tabs-core": minor
---

New package: `@zoblocks/tabs`, a tab system built on the framework-free
engine in `tabs-core`.

The design premise is that "tabs" is four different components sharing one
silhouette — a view switch, a navigation menu, a form value and a wizard — which
need four different accessibility trees. So `as` is required and has no default,
and `variant` (eleven skins) is an orthogonal axis that changes no ARIA.

Three things worth knowing:

- **`as` is required, and a tablist of links is an error.** A `role="tablist"`
  wrapped around anchors announces "tab, 2 of 5", then destroys the user's focus
  when an arrow key navigates the page. Every attribute is spelled correctly, so
  axe passes it. The new `@zoblocks/tabs-semantic-mode` rule catches it at lint
  time, and `validateTabsConfig` throws at runtime — the same posture as
  `signature-requires-typed-path`, and for the same reason.
- **Colour never carries a status alone.** `count` + `tone` reaches the
  accessible name as a word, so a red 2 on a Labs tab announces "Labs, 2
  critical". Disabled tabs use `aria-disabled` with a mandatory
  `disabledReason` — in a chart, "no behavioural health section" and
  "behavioural health, restricted" are different clinical facts.
- **Overflow is a choice, not a default.** Five strategies (`scroll`, `menu`,
  `collapse`, `wrap`, `none`) with different trade-offs; `wrap` is rejected on a
  tablist, because once a strip wraps onto two rows "the next tab" stops being a
  direction.

Also included: `onBeforeChange` with async veto and an inert strip while
pending, editable tabs with deterministic close-focus order and keyboard
reordering, `availability` for offline/degraded panels, `syncTo` URL adapters,
audit events, a `--zb-tabs-*` token surface that falls through to `--ant-*`, and
`useTabs()` prop-getters for hosts that want the behaviour without the skin.

`tabs-core` ships the parts with no React dependency: the role table, the
keyboard model, priority-plus `fitTabs`, indicator geometry, the change gate,
validation, locale strings and the URL adapters.

Configuration is validated at render time by the declarative `Tabs`, so an
invalid strip fails identically in `renderToString` and in a browser — a
tablist of links must not be something you only discover after deploying. The
compound `Tabs.Root` keeps a post-mount check, because it learns its items from
a registry that layout effects fill.
