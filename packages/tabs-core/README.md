# @oxygenui-design/tabs-core

**The selection engine behind Oxygen Tabs.** No React, no DOM, no dependencies —
every export is a pure function or a small state machine over plain data.

```bash
npm install @oxygenui-design/tabs-core
```

It exists so a host on a different design system can take Oxygen's keyboard
model and accessibility contract without the skin, and so that contract can be
tested exhaustively without rendering anything.

---

## What is in here

**`rolesFor(mode)`** — the semantic-mode table. One place that says what
`as="tabs"` differs from `as="nav"` in: element, role, selected attribute,
whether arrow keys move selection, whether panels are owned, whether it is a
form value. A change here is a change to what a screen reader says.

**`keyToIntent(key, items, current, options)`** — the WAI-ARIA keyboard model as
arithmetic. Orientation, RTL and wrapping are options, not branches scattered
through a component. Disabled items are still navigable, deliberately: they use
`aria-disabled`, so a keyboard user must be able to land on one and discover it
exists.

**`Typeahead` / `matchTypeahead`** — a 600 ms buffer, and the APG rule most
implementations miss: a repeated character cycles rather than searching for
`"lll"`.

**`focusAfterClose(closed, remaining, hasAddButton)`** — next, else previous,
else the add button, else the list. The rule APG omits, and the reason closable
tabs feel broken nearly everywhere: the usual implementation lets focus fall to
`<body>`.

**`fitTabs({widths, available, gap, reserve, pinned})`** — priority-plus overflow
as pure arithmetic over a cached width map. Never reads the DOM, which is what
makes the classic oscillation — hide with CSS, measure zero, un-hide, repeat —
unreachable by construction. The pinned index is promoted without reordering, so
membership changes and document order never does.

**`indicatorGeometry` / `indicatorStyle` / `resolveIndicator`** — the moving
indicator, driven by `offsetLeft`/`offsetTop` rather than rect deltas, because
those resolve against the same padding edge an absolutely-positioned child does.
Scroll-independent, and identical in RTL.

**`createChangeGate`** — selection as a request. `onBeforeChange` may return a
promise, because vetoing usually means asking a human. Concurrent requests
supersede rather than queue: answering a dialog about tab B should not land you
on tab C. A guard that throws is treated as a refusal — committing anyway would
discard an unsigned note because someone's confirm dialog had a bug.

**`validateTabsConfig`** — the twelve configuration problems that render
perfectly and pass every automated checker. Returns them; the caller decides.

**`describeCount` / `describeTrigger`** — colour is reinforcement, never the
signal, so a tone reaches the accessible name as a word. `2` + `"critical"`
becomes `"2 critical"`, with singular forms, because "1 items" is what an
unfinished product says.

**`hashAdapter` / `searchParamAdapter`** — deep-linking through an adapter, so
the package depends on no router. `replace` is the default: tab selection is a
view state, not a destination, and pushing makes the back button walk the user
through every tab they glanced at.

---

## Using it directly

```ts
import { keyToIntent, rolesFor, fitTabs } from "@oxygenui-design/tabs-core";

const spec = rolesFor("radiogroup");
// { listRole: "radiogroup", triggerRole: "radio", selectedAttr: "aria-checked", … }

const intent = keyToIntent("ArrowLeft", items, 2, { orientation: "horizontal", rtl: true });
// { kind: "move", index: 3 }   ← RTL swaps the inline axis

const { visible, overflow } = fitTabs({
  widths,
  available: 480,
  gap: 8,
  reserve: 96,
  pinned: selectedIndex,
});
```

The React bindings live in [`@oxygenui-design/tabs`](../tabs).
