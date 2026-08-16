# Framework smoke apps

`@oxygenui-design/loaders` claims to work "in React, Vue, Angular, Svelte, or
plain HTML". Until this package existed that was a sentence in a README, not a
tested property — and the interesting failures all live in the framework's
template layer, which unit tests in jsdom never touch:

| Framework  | The failure this page would catch                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Plain HTML | The element never upgrades — a bad `define()` guard, or a module that throws on import.                                               |
| React 19   | React 19 sets a **property** when one exists on the element and an attribute otherwise. A getter-only property would silently no-op.  |
| React 18   | React 18 sets everything as an **attribute**, stringified: `open={false}` becomes `open="false"`. Presence-style booleans break here. |
| Vue        | Vue's compiler treats an unknown hyphenated tag as a component and warns, unless `isCustomElement` is configured.                     |
| Angular 22 | Angular's template compiler **errors** (NG0304) on an unknown element without `CUSTOM_ELEMENTS_SCHEMA`.                               |
| Svelte     | Svelte's compiler is permissive, but its attribute update path differs for `null`/`undefined`/`false`.                                |

Each page is the same tiny application, so one Playwright spec
(`e2e/frameworks.spec.ts`) drives all six through an identical script. The
contract every page implements:

| Selector       | Requirement                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| `#framework`   | Names the framework, so a mis-wired route fails loudly instead of passing twice. |
| `#loader`      | `<ox-pulse-loader>` with `label`, `mode="inline"`, `min-duration="0"`.           |
| `#toggle`      | Flips framework state that drives the loader's `open` attribute.                 |
| `#determinate` | `<ox-rhythm-loader>` whose `progress` is bound to a framework **number**.        |
| `#step`        | Advances that number by 25.                                                      |
| `#events`      | Text count of `ox-loader-show` / `ox-loader-hide` events observed by the host.   |

`min-duration="0"` is deliberate. The default 400 ms floor is right for humans
and wrong for a test that would otherwise assert on a loader still serving out
its minimum. The timing gate has its own tests; this one is about the framework
boundary.

## Running

```bash
pnpm --filter @oxygenui-design/smoke build   # every framework's real compiler runs here
pnpm e2e --grep @framework                   # drives the built output in three browsers
```

The build is the first half of the test. Angular's template compiler and Vue's
SFC compiler both fail the build — not the assertion — when the elements are not
declared correctly, which is exactly the failure a consumer would hit.

## React 18

React 18 lives in `apps/smoke-react18`, a separate workspace package, because
two major versions of React cannot share one `node_modules`. It is small and it
earns its place: the React 18 attribute path is the single most common source of
"your web component doesn't work in my app" reports.
