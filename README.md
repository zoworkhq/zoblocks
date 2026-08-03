<div align="center">

# Oxygen UI

**Healthcare components that already know what the data means.**

React components typed to FHIR R4, delivered through a shadcn registry.
The source is copied into your repository — yours to read, audit, and change.

[oxygenui.design](https://oxygenui.design) · MIT core

</div>

---

## What this is

Most component libraries render a value. They have no opinion about a result
that came back preliminary, a reference range that doesn't exist, a record
flagged restricted, or a potassium of 6.8. Those aren't edge cases in
healthcare — they are the normal working set.

Oxygen components take FHIR resources as props directly. No adapter layer, no
bespoke prop shape to learn:

```tsx
import { ObservationPanel } from "@/components/oxygen/vitals-panel";

<ObservationPanel observations={bundle.entry.map((e) => e.resource)} />;
```

Reference ranges, interpretation flags, preliminary and corrected status,
absent values, and critical escalation are handled — and an uninterpreted
result reads **"Not interpreted"**, never "Normal".

## Install

```bash
pnpm dlx shadcn@latest add @oxygenui/vitals-panel
```

Components are distributed as source. The CLI writes the files into your
project and adds `@oxygenui/fhir` (types and pure helpers, zero runtime
dependencies) to your `package.json`.

## Repository layout

```
oxygenui/
├─ apps/docs/          # oxygenui.design — marketing site, catalog, registry host
├─ packages/
│  ├─ fhir/            # @oxygenui/fhir — FHIR R4 types + pure read helpers
│  ├─ tokens/          # @oxygenui/tokens — semantic clinical CSS variables
│  ├─ fixtures/        # synthetic, non-PHI FHIR fixtures for docs and tests
│  └─ tsconfig/        # shared TypeScript configs
├─ registry/oxygen/    # component source — this is what customers receive
├─ content/decisions/  # architecture decision records
├─ scripts/            # registry build and validation
└─ registry.json       # catalog manifest
```

`registry/` is the source of truth for anything a customer installs. Those
files are copied verbatim into their project, so they must be self-contained
and readable on their own.

## Development

```bash
pnpm install
pnpm registry:build   # generate apps/docs/public/r/*.json
pnpm dev              # docs site on http://localhost:3000
```

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the docs site |
| `pnpm build` | Build every package and app |
| `pnpm test` | Unit tests |
| `pnpm typecheck` | Typecheck the workspace |
| `pnpm registry:build` | Regenerate registry JSON |
| `pnpm registry:check` | Validate the registry without writing |
| `pnpm changeset` | Record a release intent |

### Adding a component

1. Write the source under `registry/oxygen/<name>/`.
2. Add an entry to `registry.json` with its files, dependencies, and target path.
3. Run `pnpm registry:build`.
4. Add it to the catalog in `apps/docs/src/app/page.tsx`.

Two things that will silently break a component:

- **Never build a class name from a variable.** Tailwind resolves classes by
  scanning source text, so `` `text-[var(--ox-status-${token})]` `` produces no
  CSS and severity styling vanishes. Use a literal lookup map.
- **New registry directories must be added to `@source` in
  `apps/docs/src/app/globals.css`.** Tailwind does not scan outside the app tree
  on its own, and components render completely unstyled without it.

## Principles

**Absence is a state.** A missing value renders as explicitly missing. A blank
cell is indistinguishable from a rendering failure, and in a chart that
ambiguity is dangerous.

**Never color alone.** Every severity carries an icon, a text label, and a
second structural cue. Components must stay readable in forced-colors mode and
in grayscale.

**Don't infer clinical meaning.** An interpretation stated in the payload
always wins. Where none is stated, it is derived only by comparing a value to
its own reference range. Nothing else is guessed.

**Synthetic data only.** Every fixture, demo, and screenshot uses invented
values on reserved `example.org` systems. No PHI enters this repository, its
issues, or its analytics.

## What this is not

Oxygen UI is **not a compliance boundary**. Installing it does not make an
application HIPAA, GDPR, or DPDP compliant, and it is not a medical device or
clinical decision support. Access control, audit, data residency, and clinical
validation remain yours.

It is well-built UI with healthcare implementation guidance. That is the claim,
and it is the only one we make.

## License

MIT for the core — see [LICENSE](LICENSE). Premium registry resources, when
introduced, will carry a separate commercial license stated on each item.

Built by [Zowork](https://github.com/zoworkhq).
