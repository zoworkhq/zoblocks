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

Register the namespace once, in your project's `components.json`:

```json
{
  "registries": {
    "@oxygenui": "https://oxygenui.design/r/{name}.json"
  }
}
```

Then add components by name:

```bash
pnpm dlx shadcn@latest add @oxygenui/vitals-panel
```

Without that `registries` entry the CLI has no way to resolve `@oxygenui`, so
the add command fails before it reaches the network. If you would rather not
edit `components.json`, pass the URL directly instead:

```bash
pnpm dlx shadcn@latest add https://oxygenui.design/r/vitals-panel.json
```

Components are distributed as source. The CLI writes the files into your
project and adds `@oxygenui-design/fhir` (types and pure helpers, zero runtime
dependencies) to your `package.json`.

The `@oxygenui` in the install command is a shadcn registry namespace, not an
npm scope — it is a local alias for the URL above, and you can name it whatever
you like. The npm packages it pulls in are published under `@oxygenui-design`.

## Repository layout

```
oxygenui/
├─ apps/docs/           # oxygenui.design — marketing site, catalog, registry host
├─ packages/
│  ├─ fhir/             # @oxygenui-design/fhir — FHIR R4 types + pure read helpers
│  ├─ tokens/           # @oxygenui-design/tokens — semantic clinical CSS variables
│  ├─ fixtures/         # synthetic, non-PHI FHIR fixtures for docs and tests
│  ├─ component-meta/   # the metadata schema every generated artifact derives from
│  ├─ eslint-plugin/    # lint rules enforcing the architectural invariants
│  └─ tsconfig/         # shared TypeScript configs
├─ registry/oxygen/     # component source — this is what customers receive
├─ content/decisions/   # architecture decision records
├─ scripts/gen/         # the generator
└─ ARCHITECTURE.md      # how it all fits together, and why
```

`registry/` is the source of truth for anything a customer installs. Those
files are copied verbatim into their project, so they must be self-contained
and readable on their own.

`registry.json`, `tsconfig.generated.json`, `apps/docs/src/lib/generated/`,
`apps/docs/public/r/`, and `apps/docs/public/llms.txt` are **generated**. Edit a
component's `*.meta.ts` and run `pnpm gen`; CI fails if they are stale.

## Development

```bash
pnpm install
pnpm gen              # generate the registry, catalog, and path mappings
pnpm dev              # docs site on http://localhost:6001
```

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the docs site |
| `pnpm build` | Build every package and app |
| `pnpm test` | Unit tests |
| `pnpm lint` | Lint the workspace |
| `pnpm typecheck` | Typecheck the workspace, including registry source |
| `pnpm gen` | Regenerate everything derived from component metadata |
| `pnpm gen:check` | Verify nothing generated is stale (CI) |
| `pnpm gen:component <name>` | Scaffold a new component |
| `pnpm changeset` | Record a release intent |

### Adding a component

```bash
pnpm gen:component vitals-trend
```

Then fill in `registry/oxygen/vitals-trend/vitals-trend.tsx` and its
`vitals-trend.meta.ts`, and run `pnpm gen`.

**That is the whole process.** No shared file is edited. The registry manifest,
the docs catalog and its prop tables, TypeScript path mappings, the Tailwind
source list, and the agent manifest are all derived from the metadata and the
component's own types. `pnpm gen` refuses to run while the scaffolded
placeholders are still in place, and names each field it is waiting on.

Prop documentation is **extracted from the TypeScript types** and must never be
written by hand — a prop table is read as a contract, and one that has silently
drifted is worse than none.

Two things that used to break a component silently are now enforced:

- **Never build a class name from a variable.** Tailwind resolves classes by
  scanning source text, so `` `text-[var(--ox-status-${token})]` `` produces no
  CSS and severity styling vanishes. Use a literal lookup map.
  → `@oxygenui/no-dynamic-class-name`
- **Components reference semantic tokens, never raw palette values.** A
  component that reaches past `--ox-status-critical` to `--ox-red-600` ignores
  every brand override. → `@oxygenui/no-primitive-token`

The Tailwind `@source` list, previously a manual step with the same failure
mode, is generated.

### Architecture

[`ARCHITECTURE.md`](ARCHITECTURE.md) describes the target platform — layer
model, package topology, distribution channels, theming, testing, versioning,
and the phased path from here. Individual decisions and their rejected
alternatives live in [`content/decisions/`](content/decisions/).

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
