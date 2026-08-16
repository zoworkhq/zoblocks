---
"@oxygenui-design/react": minor
---

First release: the loaders as an installable React package.

Until now the only React channel was copy-source through the shadcn registry,
which has no versioning and no upgrade path. This package covers teams who want
semver instead.

Both channels are **generated from one source**, so they cannot behave
differently — the registry is authored, the package is derived from it by
rewriting import specifiers, and nothing else. `react` and `react-dom` are peer
dependencies supporting 18 and 19.

Exports `PulseLoader`, `RhythmLoader`, `BreathLoader`, `HelixLoader`,
`InfusionLoader`, the `PageLoader` preset, and `useLoadingGate` for building
your own waits.
