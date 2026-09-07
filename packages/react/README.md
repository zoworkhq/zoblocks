# @zoblocks/react

**Healthcare React components built for the states a demo would skip.**

Part of [Zoblocks](https://zoblocks.design). Zero runtime dependencies beyond
`clsx` and `tailwind-merge`. React 18 and 19.

```bash
npm install @zoblocks/react
```

```tsx
import { PageLoader } from "@zoblocks/react";
import "@zoblocks/react/styles.css";
import "@zoblocks/tokens/zoblocks-tokens.css";

<PageLoader label="Loading your records" />;
```

## Two ways to install

|           | npm package             | Zoblocks registry                    |
| --------- | ----------------------- | ------------------------------------ |
| Install   | `npm i @zoblocks/react` | `npx @zoblocks/cli add pulse-loader` |
| Upgrades  | semver                  | you own the source                   |
| Auditable | in `node_modules`       | in your repository                   |
| Best for  | teams who want upgrades | teams who want to read every line    |

Both channels are generated from one source, so they cannot behave differently.

## What ships today

`PulseLoader` · `RhythmLoader` · `BreathLoader` · `HelixLoader` ·
`InfusionLoader` · `PageLoader` (preset), plus `useLoadingGate` for building
your own waits.

See the [loader documentation](https://zoblocks.design/components) for props,
states, and accessibility notes.

## Accessibility

Indeterminate loaders are `role="status"` in a polite live region; determinate
ones are `role="progressbar"` with a spoken value. The label is always in the
DOM — an empty live region announces nothing. `prefers-reduced-motion` gets a
designed still state rather than a paused animation.

## What this is not

Zoblocks is not a compliance boundary. It does not make an application HIPAA,
GDPR, or DPDP compliant, and it is not a medical device or clinical decision
support.

## Licence

MIT © Zowork
