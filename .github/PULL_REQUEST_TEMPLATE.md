## What changed, and why

<!-- The change in a sentence, then the reason. If it fixes an issue, link it. -->

## Type of change

- [ ] Bug fix (no API change)
- [ ] New component
- [ ] New feature on an existing component (additive)
- [ ] **Breaking change** — requires a major, a migration note, and ideally a codemod
- [ ] Documentation
- [ ] Internal (build, CI, tooling)

## Checklist

Everything here is in [ENGINEERING.md](../ENGINEERING.md). Tick or strike through
with a reason — an unticked box with no explanation blocks review.

**API**

- [ ] Prop and event names follow the naming standard (§4)
- [ ] No new required prop on an existing component without a major
- [ ] `ref` is forwarded; `className`, `style`, `id`, `data-*`, and `aria-*` pass through
- [ ] `api.md` diff reviewed, if the public surface changed

**Accessibility**

- [ ] Zero axe violations across themes and densities
- [ ] Keyboard path works and is documented (if interactive)
- [ ] Visible focus indicator
- [ ] `prefers-reduced-motion` has a _designed_ state, not a paused one
- [ ] Screen-reader behaviour checked or explicitly deferred with a reason

**Tests**

- [ ] Meets the bar for the component's stability tier (§9)
- [ ] Coverage thresholds pass
- [ ] Visual-regression baselines updated **and reviewed**, if anything moved

**Content and tokens**

- [ ] User-visible copy follows [CONTENT.md](../CONTENT.md)
- [ ] Every colour resolves through a semantic token — no primitives, no literals
- [ ] No hardcoded user-visible English (goes through `@oxygenui/intl`)

**Supply chain**

- [ ] No new runtime dependency without an ADR
- [ ] Component reaches for no forbidden capability (env, network, eval, innerHTML, console)
- [ ] No real patient data anywhere in the diff, including fixtures and screenshots

**Release**

- [ ] Changeset attached (`pnpm changeset`) for any change to a published package

## Screenshots / recordings

<!-- Required for any visual change. Light and dark. Before and after. -->

## Anything a reviewer should look at hardest?
