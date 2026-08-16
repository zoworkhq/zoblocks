# @oxygenui-design/react

**Healthcare React components built for the states a demo would skip.**

Part of [Oxygen UI](https://oxygenui.design). Zero runtime dependencies beyond
`clsx` and `tailwind-merge`. React 18 and 19.

```bash
npm install @oxygenui-design/react
```

```tsx
import { PageLoader } from "@oxygenui-design/react";
import "@oxygenui-design/react/styles.css";
import "@oxygenui-design/tokens/oxygen-tokens.css";

<PageLoader label="Loading your records" />;
```

## Two ways to install

|           | npm package                    | shadcn registry                                     |
| --------- | ------------------------------ | --------------------------------------------------- |
| Install   | `npm i @oxygenui-design/react` | `pnpm dlx shadcn@latest add @oxygenui/pulse-loader` |
| Upgrades  | semver                         | you own the source                                  |
| Auditable | in `node_modules`              | in your repository                                  |
| Best for  | teams who want upgrades        | teams who want to read every line                   |

Both channels are generated from one source, so they cannot behave differently.

## What ships today

`PulseLoader` · `RhythmLoader` · `BreathLoader` · `HelixLoader` ·
`InfusionLoader` · `PageLoader` (preset), plus `useLoadingGate` for building
your own waits.

See the [loader documentation](https://oxygenui.design/components) for props,
states, and accessibility notes.

## Accessibility

Indeterminate loaders are `role="status"` in a polite live region; determinate
ones are `role="progressbar"` with a spoken value. The label is always in the
DOM — an empty live region announces nothing. `prefers-reduced-motion` gets a
designed still state rather than a paused animation.

## What this is not

Oxygen UI is not a compliance boundary. It does not make an application HIPAA,
GDPR, or DPDP compliant, and it is not a medical device or clinical decision
support.

## Licence

MIT © Zowork
