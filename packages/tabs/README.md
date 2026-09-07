# @zoblocks/tabs

**Tabs that know what they are.** Four semantic modes across eleven skins, with
the WAI-ARIA keyboard model, priority-plus overflow, and the states a clinical
surface actually hits.

```bash
npm install @zoblocks/tabs
```

```tsx
import { Tabs } from "@zoblocks/tabs";
import "@zoblocks/tabs/styles.css";

<Tabs
  as="tabs"
  variant="segmented"
  aria-label="Document scope"
  defaultValue="personal"
  items={[
    { value: "personal", label: "Personal", children: <PersonalDocs /> },
    { value: "shared", label: "Shared", count: 6, children: <SharedDocs /> },
  ]}
/>;
```

antd is an **optional** peer dependency — the package works without it, and
[`@zoblocks/tabs-core`](../tabs-core) has no dependency on React or antd
at all.

---

## The one thing worth knowing before you integrate

### `as` is required, and there is no default

"Tabs" is four different components sharing a silhouette. They need four
different accessibility trees, and shipping one of them and using it as all four
is the most-reported tab defect in every design system audit:

| You have             | `as`           | Renders                      | Selected state        |
| -------------------- | -------------- | ---------------------------- | --------------------- |
| Panels of one object | `"tabs"`       | `role="tablist"` + buttons   | `aria-selected`       |
| A list of URLs       | `"nav"`        | `<nav>` + real anchors       | `aria-current="page"` |
| A form value         | `"radiogroup"` | `role="radiogroup"` + radios | `aria-checked`        |
| An ordered wizard    | `"steps"`      | `role="tablist"`, gated      | `aria-selected`       |

The failure this prevents is specific and invisible. A `role="tablist"` wrapped
around anchors announces "tab, 2 of 5"; the user presses <kbd>→</kbd> expecting
to preview the next panel; the page navigates and their focus is destroyed.
Every individual attribute is spelled correctly, so no automated checker — axe
included — catches it.

`variant` is the orthogonal axis and it is free: any of the eleven skins can
dress any of the four modes, because the skin is CSS and the mode is the
accessibility tree.

Enforced rather than documented: `validateTabsConfig` throws on a tablist of
links, and `@zoblocks/tabs-semantic-mode` makes it a lint error before the code
ever runs.

---

## Variants

`segmented` · `underline` · `pill` · `enclosed` · `rail` · `ghost` · `stepper` ·
`command` · `card` · `stat` · `unstyled`

The indicator resolves from the variant unless you override it: a thumb for
`segmented`/`command`, a line for `underline`/`rail`, and none for the rest —
wrapping variants have no continuous path for an indicator to travel along, and
`card`/`stat`/`ghost` carry selection in their own background.

## Overflow

Five strategies, none of which dominates, so the component exposes the choice.
What it will not do is the industry default — let the strip run off the viewport
and hope.

| `overflow`             | Use when                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `"scroll"` _(default)_ | Many tabs, order matters, touch-first. Fades, nudge buttons, `scrollIntoView({block:"nearest"})`.                 |
| `"menu"`               | Dense desktop tools where every tab must be listable. Measured priority-plus; the selected tab is pinned visible. |
| `"collapse"`           | Narrow containers. Becomes a native `<select>` — the only picker that already works on every phone.               |
| `"wrap"`               | Pill filters only. Illegal on a tablist: once it wraps, "the next tab" stops being a direction.                   |
| `"none"`               | You have measured and they always fit.                                                                            |

## Three API layers

```tsx
// 1 — declarative. The 90% case.
<Tabs as="tabs" items={items} aria-label="Chart" />

// 2 — compound, when you need the panel tree.
<Tabs.Root as="tabs" onBeforeChange={confirmDiscard}>
  <Tabs.List aria-label="Chart" extra={<Tabs.AddButton />}>
    <Tabs.Trigger value="labs" count={2} tone="critical">Labs</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panels>
    <Tabs.Panel value="labs" mount="lazy"><Labs /></Tabs.Panel>
  </Tabs.Panels>
</Tabs.Root>

// 3 — headless, when none of the skins fit.
const tabs = useTabs({ as: "radiogroup", items, value, onChange });
<div {...tabs.getListProps({ "aria-label": "Range" })}>
  {items.map((item, i) => <MyChip key={item.value} {...tabs.getTriggerProps(i)} />)}
</div>
```

## Keyboard

| Key                                           | `tabs` / `steps`                           | `radiogroup`     | `nav`             |
| --------------------------------------------- | ------------------------------------------ | ---------------- | ----------------- |
| <kbd>Tab</kbd>                                | Enters at the selected tab, then exits     | Same             | Visits every link |
| <kbd>→</kbd> <kbd>←</kbd>                     | Previous / next, wrapping (RTL-aware)      | Same, and checks | Browser default   |
| <kbd>↑</kbd> <kbd>↓</kbd>                     | Vertical orientation only                  | Same             | Browser default   |
| <kbd>Home</kbd> <kbd>End</kbd>                | First / last                               | Same             | —                 |
| <kbd>Enter</kbd> <kbd>Space</kbd>             | Activates under `activation="manual"`      | Checks           | Follows the link  |
| <kbd>Delete</kbd> <kbd>Backspace</kbd>        | Closes a closable tab                      | —                | —                 |
| a–z, 0–9                                      | Typeahead, 600 ms buffer, repeats cycle    | Same             | —                 |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>→</kbd> | Reorders, when `editable.onReorder` is set | —                | —                 |

Use `activation="manual"` when a panel fetches. Under the default, arrowing
across six tabs fires six requests and reads six live regions.

## Colour is never the signal

`count` + `tone` reaches the accessible name as a word: a red **2** on a Labs tab
announces "Labs, 2 critical", not "Labs 2". Same for `dot` ("unsaved changes")
and `availability` ("showing cached data").

A disabled tab uses `aria-disabled`, never the `disabled` attribute, and
`disabledReason` is mandatory — in a chart, "no behavioural health section" and
"behavioural health, restricted" are different clinical facts, and a keyboard
user must be able to discover which one they are looking at.

## Theming

Every value resolves through `--zb-tabs-*` → `--zb-*` → `--ant-*` → a literal.
That chain means the same stylesheet is correct in a ZoBlocks app, in a plain antd
app driven by `ConfigProvider` (no JavaScript required), and on a bare page.
Rebranding is four lines:

```css
[data-brand="northgate"] {
  --zb-tabs-track-radius: 6px;
  --zb-tabs-thumb-radius: 3px;
  --zb-tabs-thumb-shadow: none;
  --zb-tabs-thumb-border: var(--zb-border-strong);
}
```

For a host on antd's non-`cssVar` theme, `@zoblocks/tabs/antd` exports
`<AntdTabsBridge>`, which maps antd's JavaScript tokens onto the same surface.

## What it will not do

- Render a tablist of links — lint error, then a thrown error.
- Wrap a tablist onto two rows. Use `"menu"` or `"collapse"`.
- Hide a disabled or empty tab. Both change the tab count between sessions.
- Reorder tabs by importance. Position is memory.
- Animate panel height. Panels swap; they do not grow.
- Own routing. `syncTo` writes through an adapter you supply.
- Enforce your permissions. `disabled` and `availability` are presentation; a
  hidden panel is not a security control.

ZoBlocks is not a compliance boundary. It does not make an application HIPAA,
GDPR or DPDP compliant, and it is not a medical device or clinical decision
support.
