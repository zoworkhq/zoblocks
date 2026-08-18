# Migrating from Ant Design's Timeline

`@oxygenui/timeline` is Ant Design v6's `Timeline`, prop for prop, with no
dependency on antd. A migration is one import.

```diff
- import { Timeline } from "antd";
+ import { Timeline } from "@/components/oxygen/timeline";
```

`test/timeline-parity.test.ts` reads antd's own type declarations out of the
installed package and fails when antd renames anything, so this claim is
checked rather than asserted.

## One change you must make

**An accessible name is required, in the type.**

```diff
- <Timeline items={items} />
+ <Timeline aria-label="Release history" items={items} />
```

antd exposes no way to name the list — `@rc-component/steps` emits no `role`, no
`aria-current` and no `aria-label` at all — so a page with two timelines gives a
screen-reader user two unnamed lists. `TimelineProps` is intersected with a
union requiring `aria-label` or `aria-labelledby`, so the omission does not
compile.

## Three deliberate divergences

### 1. There is no current step, and the last item's rail is not dotted

antd's Timeline is a thin adapter over `Steps` and hardcodes
`current: items.length - 1`. Steps marks that item `process`, and antd's
timeline stylesheet contains exactly one rule keyed on it:

```js
[varName("item-process-rail-line-style")]: "dotted";
```

So antd's last rendered item always has a dotted rail. On a wizard, "the step
you are on, and it continues" is right. On a chronology it is a mark of
incompleteness applied to whichever event happened to be last — and because
`reverse` reverses the array _before_ `current` is computed, on a newest-first
list it lands on the oldest event.

We do not reproduce it. **If you were relying on that dotted segment, it was not
saying what you thought.** In `CareTimeline` the same affordance is reassigned
to something a reader can act on: a dotted rail means _records may be missing
between these two events_.

### 2. `mode` defaults to `start`, following the source

antd's documentation table gives `mode` a default of `end`. The 6.6.0 source
falls back to `'start'`:

```js
return modeList.includes(mode) ? mode : "start";
```

We follow the source. If your layout depended on the documented default rather
than the actual one, it was already rendering as `start` in antd.

### 3. `prefixCls` rebuilds the whole class table

Supported, and it reaches every part rather than only the root. A caller who
changes the prefix is supplying their own stylesheet by definition.

## The v6 renames, all still accepted

v6 renamed most of the item API and kept the old names working with a
deprecation warning. So do we — a migration is only "one import" while the v5
names a real codebase is full of keep working.

| v5                            | v6                                |
| ----------------------------- | --------------------------------- |
| `items[].label`               | `items[].title`                   |
| `items[].children`            | `items[].content`                 |
| `items[].dot`                 | `items[].icon`                    |
| `items[].position`            | `items[].placement`               |
| `mode="left" \| "right"`      | `mode="start" \| "end"`           |
| `pending`, `pendingDot`       | `items[].loading`, `items[].icon` |
| `<Timeline.Item>` as children | `items`                           |

`<Timeline.Item>` children are still read into the same tree as `items`, exactly
as antd does it.

## What you get that antd does not have

- **`<ol>` of `<li>`, with `role="list"` stated.** antd also renders an ordered
  list — its documentation site says `<ul>`, which is wrong — but it omits the
  redundant role, and Safari drops list semantics from any list with
  `list-style: none`. VoiceOver then announces neither the list nor its item
  count.
- **Semantic tokens, not palette values.** `color="red"` resolves to
  `--ox-status-critical`, so a brand override reaches it. Any other string is
  passed through untouched.
- **No antd in your bundle**, which is what keeps the component installable as
  copy-source.

## When to reach past it

`Timeline` has no clinical opinion, and it should not grow one. If you are
rendering a patient's chronology, use
[`CareTimeline`](../../registry/oxygen/care-timeline/), which states what it is
a view of — see [ADR 0011](../decisions/0011-summaries-declare-their-boundaries.md).
